package com.conventionhall.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal advancePaid;

    private LocalDate paymentDueDate;

    // Stored as "HH:mm" strings to avoid serialisation complexity
    private String checkInTime;

    private String checkOutTime;

    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ─────────────────── Multi-day / Food ───────────────────────────────────
    private LocalDate eventEndDate;

    @Column(length = 10)
    private String foodType; // "VEG" or "NONVEG"

    // ─────────────────── Amenity detail ─────────────────────────────────────
    private Integer villaRooms; // 0-3 extra villa rooms @ ₹1500/room
    private Boolean diningHallIncluded;
    private Boolean vesselsIncluded;

    // ─────────────────── Terms toggles ──────────────────────────────────────
    private Boolean electricityIncluded;
    private Boolean labourIncluded;
    private Boolean dieselIncluded;
    private Boolean cleaningIncluded;
    private Integer acHours; // AC hours per day (default 3)

    // ─────────────────── Reference & history ────────────────────────────────
    @Column(unique = true, length = 20)
    private String bookingRef; // e.g. NRK-2026-001

    @Column(columnDefinition = "TEXT")
    private String paymentHistory; // JSON array of payment records

    @Column(columnDefinition = "MEDIUMTEXT")
    private String paymentScreenshots; // JSON array of {index, dataUrl} for payment proof screenshots

    // ─────────────────── Expense tracking ───────────────────────────────────
    @Column(precision = 10, scale = 2)
    private BigDecimal expenseLabour;

    @Column(precision = 10, scale = 2)
    private BigDecimal expenseDiesel;

    @Column(precision = 10, scale = 2)
    private BigDecimal expenseCleaning;

    @Column(precision = 10, scale = 2)
    private BigDecimal expenseElectricity;

    @Column(precision = 10, scale = 2)
    private BigDecimal expenseOther;

    // ─────────────────── Cancellation ───────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String cancellationReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus bookingStatus = BookingStatus.CONFIRMED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ----------------------------------------------------------------
    // Lifecycle hooks
    // ----------------------------------------------------------------

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        computePaymentStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        computePaymentStatus();
    }

    // ----------------------------------------------------------------
    // Helper methods
    // ----------------------------------------------------------------

    public BigDecimal getRemainingBalance() {
        if (totalAmount == null)
            return BigDecimal.ZERO;
        BigDecimal paid = (advancePaid != null) ? advancePaid : BigDecimal.ZERO;
        return totalAmount.subtract(paid);
    }

    public BigDecimal getTotalExpenses() {
        BigDecimal total = BigDecimal.ZERO;
        if (expenseLabour != null)
            total = total.add(expenseLabour);
        if (expenseDiesel != null)
            total = total.add(expenseDiesel);
        if (expenseCleaning != null)
            total = total.add(expenseCleaning);
        if (expenseElectricity != null)
            total = total.add(expenseElectricity);
        if (expenseOther != null)
            total = total.add(expenseOther);
        return total;
    }

    /**
     * Auto-computes paymentStatus based on amounts and due date.
     * Cancelled bookings are never marked OVERDUE.
     */
    public void computePaymentStatus() {
        // Never change payment status of a cancelled booking automatically
        if (this.bookingStatus == BookingStatus.CANCELLED)
            return;

        BigDecimal remaining = getRemainingBalance();

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            this.paymentStatus = PaymentStatus.PAID;
            return;
        }

        boolean isPastDue = (paymentDueDate != null) && paymentDueDate.isBefore(LocalDate.now());

        if (isPastDue) {
            this.paymentStatus = PaymentStatus.OVERDUE;
        } else if (advancePaid != null && advancePaid.compareTo(BigDecimal.ZERO) > 0) {
            this.paymentStatus = PaymentStatus.PARTIAL;
        } else {
            this.paymentStatus = PaymentStatus.PENDING;
        }
    }
}
