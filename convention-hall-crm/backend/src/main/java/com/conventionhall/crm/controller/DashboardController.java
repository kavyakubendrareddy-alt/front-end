package com.conventionhall.crm.controller;

import com.conventionhall.crm.dto.DashboardStats;
import com.conventionhall.crm.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final BookingService bookingService;

    @GetMapping("/stats")
    public DashboardStats getStats() {
        return bookingService.getDashboardStats();
    }
}
