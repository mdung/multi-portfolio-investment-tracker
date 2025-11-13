package com.investtracker.reports.controller;

import com.investtracker.reports.dto.PerformanceReportResponse;
import com.investtracker.reports.dto.TaxReportResponse;
import com.investtracker.reports.service.PerformanceReportService;
import com.investtracker.reports.service.TaxReportService;
import com.investtracker.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final TaxReportService taxReportService;
    private final PerformanceReportService performanceReportService;
    
    @GetMapping("/tax")
    public ResponseEntity<?> getTaxReport(
        @RequestParam UUID portfolioId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            TaxReportResponse report = taxReportService.generateTaxReport(
                portfolioId,
                userPrincipal.getId(),
                startDate,
                endDate
            );
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/performance")
    public ResponseEntity<?> getPerformanceReport(
        @RequestParam UUID portfolioId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            PerformanceReportResponse report = performanceReportService.generatePerformanceReport(
                portfolioId,
                userPrincipal.getId(),
                startDate,
                endDate
            );
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    private record ErrorResponse(String message) {}
}

