package com.investtracker.analytics.controller;

import com.investtracker.analytics.dto.*;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;
    
    @GetMapping("/portfolio/{portfolioId}/summary")
    public ResponseEntity<?> getPortfolioSummary(
        @PathVariable UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            PortfolioSummaryResponse summary = analyticsService.getPortfolioSummary(
                portfolioId,
                userPrincipal.getId()
            );
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/performance")
    public ResponseEntity<?> getPortfolioPerformance(
        @PathVariable UUID portfolioId,
        @RequestParam(defaultValue = "DAILY") String interval,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<PerformanceDataPoint> performance = analyticsService.getPortfolioPerformance(
                portfolioId,
                userPrincipal.getId(),
                interval
            );
            return ResponseEntity.ok(performance);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/history")
    public ResponseEntity<?> getPortfolioHistory(
        @PathVariable UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<PerformanceDataPoint> history = analyticsService.getPortfolioHistory(
                portfolioId,
                userPrincipal.getId()
            );
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/returns")
    public ResponseEntity<?> getPortfolioReturns(
        @PathVariable UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            ReturnsResponse returns = analyticsService.getPortfolioReturns(
                portfolioId,
                userPrincipal.getId()
            );
            return ResponseEntity.ok(returns);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/risk-metrics")
    public ResponseEntity<?> getPortfolioRiskMetrics(
        @PathVariable UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            RiskMetricsResponse riskMetrics = analyticsService.getPortfolioRiskMetrics(
                portfolioId,
                userPrincipal.getId()
            );
            return ResponseEntity.ok(riskMetrics);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        DashboardResponse dashboard = analyticsService.getDashboard(userPrincipal.getId());
        return ResponseEntity.ok(dashboard);
    }
    
    @GetMapping("/correlation")
    public ResponseEntity<?> getAssetCorrelation(
        @RequestParam UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            com.investtracker.analytics.dto.CorrelationResponse correlation = 
                analyticsService.calculateCorrelation(portfolioId, userPrincipal.getId());
            return ResponseEntity.ok(correlation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/allocation")
    public ResponseEntity<?> getPortfolioAllocation(
        @PathVariable UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // For now, return summary (allocation is included)
        return getPortfolioSummary(portfolioId, userPrincipal);
    }
    
    private record ErrorResponse(String message) {}
}

