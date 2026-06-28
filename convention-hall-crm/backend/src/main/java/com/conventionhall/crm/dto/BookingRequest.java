package com.conventionhall.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BookingRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Event type is required")
    private String eventType;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    private BigDecimal advancePaid;

    private LocalDate paymentDueDate;

    private String checkInTime;

    private String checkOutTime;

    private String amenities;

    private String notes;

    private String bookingStatus;

    // ── Multi-day / Food ──
    private java.time.LocalDate eventEndDate;
    private String foodType; // "VEG" or "NONVEG"

    // ── Amenity detail ──
    private Integer villaRooms;
    private Boolean diningHallIncluded;
    private Boolean vesselsIncluded;

    // ── Terms toggles ──
    private Boolean electricityIncluded;
    private Boolean labourIncluded;
    private Boolean dieselIncluded;
    private Boolean cleaningIncluded;
    private Integer acHours;

    // ── Expense tracking (filled after event) ──
    private java.math.BigDecimal expenseLabour;
    private java.math.BigDecimal expenseDiesel;
    private java.math.BigDecimal expenseCleaning;
    private java.math.BigDecimal expenseElectricity;
    private java.math.BigDecimal expenseOther;

    // ── Cancellation ──
    private String cancellationReason;

    // ── Payment history (JSON, managed by dedicated endpoint) ──
    private String paymentHistory;
}
