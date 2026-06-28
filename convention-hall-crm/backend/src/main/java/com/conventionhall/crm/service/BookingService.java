package com.conventionhall.crm.service;

import com.conventionhall.crm.dto.BookingRequest;
import com.conventionhall.crm.dto.DashboardStats;
import com.conventionhall.crm.entity.Booking;
import com.conventionhall.crm.entity.BookingStatus;
import com.conventionhall.crm.entity.PaymentStatus;
import com.conventionhall.crm.repository.BookingRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ----------------------------------------------------------------
    // CRUD
    // ----------------------------------------------------------------

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    public Booking createBooking(BookingRequest request) {
        LocalDate start = request.getEventDate();
        LocalDate end = request.getEventEndDate() != null ? request.getEventEndDate() : start;
        validateNoDoubleBooking(start, end, null, request.getBookingStatus());
        if (request.getPaymentDueDate() == null && start != null) {
            request.setPaymentDueDate(start.minusDays(5));
        }
        Booking booking = mapToEntity(new Booking(), request);
        // Generate booking reference NRK-YYYY-NNN
        int year = LocalDateTime.now().getYear();
        long count = bookingRepository.countBookingsByYear(year);
        booking.setBookingRef(String.format("NRK-%d-%03d", year, count + 1));
        return bookingRepository.save(booking);
    }

    public Booking updateBooking(Long id, BookingRequest request) {
        LocalDate start = request.getEventDate();
        LocalDate end = request.getEventEndDate() != null ? request.getEventEndDate() : start;
        validateNoDoubleBooking(start, end, id, request.getBookingStatus());
        Booking booking = getBookingById(id);
        mapToEntity(booking, request);
        return bookingRepository.save(booking);
    }

    public void deleteBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        bookingRepository.deleteById(id);
    }

    // ----------------------------------------------------------------
    // Payment recording
    // ----------------------------------------------------------------

    public Booking recordPayment(Long id, BigDecimal amount, String method, String note, LocalDate date,
            String screenshot) {
        Booking booking = getBookingById(id);

        // Append to payment history JSON
        List<Map<String, Object>> history = new ArrayList<>();
        try {
            if (booking.getPaymentHistory() != null && !booking.getPaymentHistory().isBlank()) {
                history = objectMapper.readValue(booking.getPaymentHistory(),
                        new TypeReference<List<Map<String, Object>>>() {
                        });
            }
        } catch (Exception ignored) {
        }

        Map<String, Object> entry = new HashMap<>();
        entry.put("date", date != null ? date.toString() : LocalDate.now().toString());
        entry.put("amount", amount);
        entry.put("method", method != null ? method : "Cash");
        entry.put("note", note != null ? note : "");
        int newIndex = history.size();
        history.add(entry);

        try {
            booking.setPaymentHistory(objectMapper.writeValueAsString(history));
        } catch (Exception ignored) {
        }

        // Store screenshot separately (MEDIUMTEXT column, JSON array by payment index)
        if (screenshot != null && !screenshot.isBlank()) {
            List<Map<String, Object>> screenshots = new ArrayList<>();
            try {
                if (booking.getPaymentScreenshots() != null && !booking.getPaymentScreenshots().isBlank()) {
                    screenshots = objectMapper.readValue(booking.getPaymentScreenshots(),
                            new TypeReference<List<Map<String, Object>>>() {
                            });
                }
            } catch (Exception ignored) {
            }
            Map<String, Object> ssEntry = new HashMap<>();
            ssEntry.put("index", newIndex);
            ssEntry.put("dataUrl", screenshot);
            screenshots.add(ssEntry);
            try {
                booking.setPaymentScreenshots(objectMapper.writeValueAsString(screenshots));
            } catch (Exception ignored) {
            }
        }

        // Update running total
        BigDecimal current = booking.getAdvancePaid() != null ? booking.getAdvancePaid() : BigDecimal.ZERO;
        BigDecimal newTotal = current.add(amount);
        // Cap at totalAmount
        if (booking.getTotalAmount() != null && newTotal.compareTo(booking.getTotalAmount()) > 0) {
            newTotal = booking.getTotalAmount();
        }
        booking.setAdvancePaid(newTotal);
        booking.computePaymentStatus();
        return bookingRepository.save(booking);
    }

    // ----------------------------------------------------------------
    // Search & filter
    // ----------------------------------------------------------------

    public List<Booking> searchBookings(String query) {
        return bookingRepository
                .findByCustomerNameContainingIgnoreCaseOrPhoneNumberContaining(query, query);
    }

    public List<Booking> getBookingsByDateRange(LocalDate start, LocalDate end) {
        return bookingRepository.findByEventDateRangeInclusive(start, end);
    }

    public List<Booking> getOverduePayments() {
        return bookingRepository.findByPaymentStatus(PaymentStatus.OVERDUE);
    }

    // ----------------------------------------------------------------
    // Payment update
    // ----------------------------------------------------------------

    public Booking updatePaymentStatus(Long id, BigDecimal advancePaid) {
        Booking booking = getBookingById(id);
        if (advancePaid != null) {
            booking.setAdvancePaid(advancePaid);
        }
        booking.computePaymentStatus();
        return bookingRepository.save(booking);
    }

    // ----------------------------------------------------------------
    // Dashboard
    // ----------------------------------------------------------------

    public DashboardStats getDashboardStats() {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.now();
        LocalDate monthStart = currentMonth.atDay(1);
        LocalDate monthEnd = currentMonth.atEndOfMonth();

        long totalBookingsThisMonth = bookingRepository.countBookingsInMonth(monthStart, monthEnd);

        long pendingPayments = bookingRepository.findByPaymentStatus(PaymentStatus.PENDING).size()
                + bookingRepository.findByPaymentStatus(PaymentStatus.PARTIAL).size();

        long overduePayments = bookingRepository.findByPaymentStatus(PaymentStatus.OVERDUE).size();

        List<Booking> upcomingEvents = bookingRepository.findUpcomingBookings(today)
                .stream().limit(10).toList();

        // Show bookings needing a reminder: unpaid, event within 7 days
        List<Booking> todayFollowUps = bookingRepository.findBookingsNeedingReminder(today, today.plusDays(7));

        // Past events (last 15)
        List<Booking> pastEvents = bookingRepository.findPastBookings(today)
                .stream().limit(15).toList();

        // All bookings with outstanding balance (daily reminders)
        List<Booking> pendingReminders = bookingRepository.findAllWithPendingPayment();

        return new DashboardStats(
                totalBookingsThisMonth, pendingPayments, overduePayments,
                upcomingEvents, todayFollowUps, pastEvents, pendingReminders);
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    /**
     * Prevents double-booking the hall on overlapping dates.
     * Uses range overlap: existingStart <= newEnd AND existingEnd >= newStart
     */
    private void validateNoDoubleBooking(LocalDate start, LocalDate end, Long excludeId, String statusStr) {
        if ("CANCELLED".equalsIgnoreCase(statusStr))
            return;

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(start, end);
        boolean conflict = overlapping.stream()
                .anyMatch(b -> !b.getId().equals(excludeId));

        if (conflict) {
            throw new RuntimeException(
                    "The hall is already booked on those dates. " +
                            "Please choose different dates or cancel the existing booking first.");
        }
    }

    private Booking mapToEntity(Booking booking, BookingRequest req) {
        booking.setCustomerName(req.getCustomerName());
        // Normalize phone: keep digits only, strip country code prefix
        String phone = req.getPhoneNumber() == null ? "" : req.getPhoneNumber().replaceAll("[^\\d]", "");
        if (phone.startsWith("91") && phone.length() == 12)
            phone = phone.substring(2);
        booking.setPhoneNumber(phone);
        booking.setEventType(req.getEventType());
        booking.setEventDate(req.getEventDate());
        booking.setEventEndDate(req.getEventEndDate());
        booking.setFoodType(req.getFoodType());
        booking.setTotalAmount(req.getTotalAmount());
        booking.setAdvancePaid(req.getAdvancePaid() != null ? req.getAdvancePaid() : BigDecimal.ZERO);
        booking.setPaymentDueDate(req.getPaymentDueDate());
        booking.setCheckInTime(req.getCheckInTime());
        booking.setCheckOutTime(req.getCheckOutTime());

        // Structured amenity/terms fields
        booking.setVillaRooms(req.getVillaRooms());
        booking.setDiningHallIncluded(req.getDiningHallIncluded());
        booking.setVesselsIncluded(req.getVesselsIncluded());
        booking.setElectricityIncluded(req.getElectricityIncluded());
        booking.setLabourIncluded(req.getLabourIncluded());
        booking.setDieselIncluded(req.getDieselIncluded());
        booking.setCleaningIncluded(req.getCleaningIncluded());
        booking.setAcHours(req.getAcHours());

        // Expense fields
        booking.setExpenseLabour(req.getExpenseLabour());
        booking.setExpenseDiesel(req.getExpenseDiesel());
        booking.setExpenseCleaning(req.getExpenseCleaning());
        booking.setExpenseElectricity(req.getExpenseElectricity());
        booking.setExpenseOther(req.getExpenseOther());

        // Cancellation reason
        if (req.getCancellationReason() != null) {
            booking.setCancellationReason(req.getCancellationReason());
        }

        // Auto-generate amenities text
        if (req.getDiningHallIncluded() != null || req.getVillaRooms() != null) {
            List<String> parts = new ArrayList<>();
            parts.add("Function Hall");
            parts.add("2 Rooms");
            if (Boolean.TRUE.equals(req.getDiningHallIncluded()))
                parts.add("Dining Hall");
            Integer vr = req.getVillaRooms();
            if (vr != null && vr > 0)
                parts.add("Villa 1st Floor (" + vr + " room" + (vr > 1 ? "s" : "") + ")");
            if (Boolean.TRUE.equals(req.getVesselsIncluded()))
                parts.add("Cooking Vessels");
            booking.setAmenities(String.join(", ", parts));
        } else {
            booking.setAmenities(req.getAmenities());
        }

        booking.setNotes(req.getNotes());
        if (req.getBookingStatus() != null && !req.getBookingStatus().isBlank()) {
            booking.setBookingStatus(BookingStatus.valueOf(req.getBookingStatus()));
        }
        return booking;
    }
}
