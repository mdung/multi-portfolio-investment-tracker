package com.investtracker.analytics.controller;

import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // For now, return summary (can be extended with time-series data)
        return getPortfolioSummary(portfolioId, userPrincipal);
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

