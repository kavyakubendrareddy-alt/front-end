package com.conventionhall.crm.scheduler;

import com.conventionhall.crm.entity.Booking;
import com.conventionhall.crm.entity.PaymentStatus;
import com.conventionhall.crm.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Runs every day at midnight (IST) to:
 * - Mark overdue payments automatically
 *
 * WhatsApp reminders are surfaced on the Dashboard and sent manually
 * by the hall owner via the "Send Reminder" button.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final BookingRepository bookingRepository;

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Kolkata")
    public void updateOverdueStatuses() {
        List<Booking> allBookings = bookingRepository.findAll();
        int updated = 0;

        for (Booking booking : allBookings) {
            if (booking.getPaymentStatus() == PaymentStatus.PAID)
                continue;

            PaymentStatus before = booking.getPaymentStatus();
            booking.computePaymentStatus();

            if (booking.getPaymentStatus() != before) {
                bookingRepository.save(booking);
                updated++;
            }
        }

        log.info("Daily overdue check complete — {} booking(s) status updated.", updated);
    }
}
