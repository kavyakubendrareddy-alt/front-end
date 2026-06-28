package com.conventionhall.crm.dto;

import com.conventionhall.crm.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStats {
    private long totalBookingsThisMonth;
    private long pendingPayments;
    private long overduePayments;
    private List<Booking> upcomingEvents;
    private List<Booking> todayFollowUps;
    private List<Booking> pastEvents;
    private List<Booking> pendingReminders;
}
