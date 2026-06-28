package com.conventionhall.crm.repository;

import com.conventionhall.crm.entity.Booking;
import com.conventionhall.crm.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

        List<Booking> findByCustomerNameContainingIgnoreCaseOrPhoneNumberContaining(
                        String name, String phone);

        List<Booking> findByEventDateBetweenOrderByEventDateAsc(LocalDate start, LocalDate end);

        List<Booking> findByPaymentStatus(PaymentStatus paymentStatus);

        List<Booking> findByEventDate(LocalDate date);

        @Query("SELECT b FROM Booking b WHERE b.eventDate >= :today AND b.bookingStatus != 'CANCELLED' ORDER BY b.eventDate ASC")
        List<Booking> findUpcomingBookings(@Param("today") LocalDate today);

        /**
         * Returns non-cancelled bookings with an unpaid balance whose event date
         * falls within the reminder window (today to sevenDaysLater).
         */
        @Query("SELECT b FROM Booking b WHERE b.eventDate BETWEEN :start AND :end " +
                        "AND b.paymentStatus != 'PAID' AND b.bookingStatus != 'CANCELLED' " +
                        "ORDER BY b.eventDate ASC")
        List<Booking> findBookingsNeedingReminder(@Param("start") LocalDate start,
                        @Param("end") LocalDate end);

        @Query("SELECT COUNT(b) FROM Booking b WHERE b.eventDate BETWEEN :start AND :end " +
                        "AND b.bookingStatus != 'CANCELLED'")
        long countBookingsInMonth(@Param("start") LocalDate start, @Param("end") LocalDate end);

        /**
         * Finds active (non-cancelled) bookings whose date range overlaps [startDate,
         * endDate].
         * Overlap condition: existingStart <= newEnd AND existingEnd >= newStart
         * where existingEnd = COALESCE(eventEndDate, eventDate).
         */
        @Query("SELECT b FROM Booking b WHERE b.bookingStatus != 'CANCELLED' " +
                        "AND b.eventDate <= :endDate " +
                        "AND COALESCE(b.eventEndDate, b.eventDate) >= :startDate")
        List<Booking> findOverlappingBookings(@Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query("SELECT b FROM Booking b WHERE b.eventDate BETWEEN :start AND :end " +
                        "OR (b.eventEndDate IS NOT NULL AND b.eventEndDate BETWEEN :start AND :end) " +
                        "ORDER BY b.eventDate ASC")
        List<Booking> findByEventDateRangeInclusive(@Param("start") LocalDate start,
                        @Param("end") LocalDate end);

        /**
         * Count non-cancelled bookings created in a given calendar year (for ref
         * generation).
         */
        @Query("SELECT COUNT(b) FROM Booking b WHERE YEAR(b.createdAt) = :year")
        long countBookingsByYear(@Param("year") int year);

        /** Past events: event already ended, not cancelled, most recent first. */
        @Query("SELECT b FROM Booking b WHERE COALESCE(b.eventEndDate, b.eventDate) < :today " +
                        "AND b.bookingStatus != 'CANCELLED' ORDER BY b.eventDate DESC")
        List<Booking> findPastBookings(@Param("today") LocalDate today);

        /** All bookings with an outstanding balance (payment not fully settled). */
        @Query("SELECT b FROM Booking b WHERE b.paymentStatus != 'PAID' " +
                        "AND b.bookingStatus != 'CANCELLED' ORDER BY b.eventDate ASC")
        List<Booking> findAllWithPendingPayment();
}
