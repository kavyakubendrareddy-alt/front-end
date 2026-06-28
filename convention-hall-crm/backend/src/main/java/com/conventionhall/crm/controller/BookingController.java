package com.conventionhall.crm.controller;

import com.conventionhall.crm.dto.BookingRequest;
import com.conventionhall.crm.entity.Booking;
import com.conventionhall.crm.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Booking createBooking(@Valid @RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }

    @PutMapping("/{id}")
    public Booking updateBooking(@PathVariable Long id,
            @Valid @RequestBody BookingRequest request) {
        return bookingService.updateBooking(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
    }

    @GetMapping("/search")
    public List<Booking> searchBookings(@RequestParam String q) {
        return bookingService.searchBookings(q);
    }

    @GetMapping("/calendar")
    public List<Booking> getCalendarBookings(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return bookingService.getBookingsByDateRange(start, end);
    }

    @GetMapping("/overdue")
    public List<Booking> getOverduePayments() {
        return bookingService.getOverduePayments();
    }

    /**
     * Update the advance paid amount; payment status is auto-recomputed.
     */
    @PatchMapping("/{id}/payment")
    public Booking updatePayment(@PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        BigDecimal advancePaid = payload.containsKey("advancePaid")
                ? new BigDecimal(payload.get("advancePaid").toString())
                : null;
        return bookingService.updatePaymentStatus(id, advancePaid);
    }

    /**
     * Record an individual payment transaction (appended to payment history).
     */
    @PostMapping("/{id}/payments")
    public Booking recordPayment(@PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        BigDecimal amount = new BigDecimal(payload.getOrDefault("amount", "0").toString());
        String method = (String) payload.getOrDefault("method", "Cash");
        String note = (String) payload.getOrDefault("note", "");
        String dateStr = (String) payload.get("date");
        String screenshot = (String) payload.get("screenshot");
        java.time.LocalDate date = dateStr != null
                ? java.time.LocalDate.parse(dateStr)
                : java.time.LocalDate.now();
        return bookingService.recordPayment(id, amount, method, note, date, screenshot);
    }
}
