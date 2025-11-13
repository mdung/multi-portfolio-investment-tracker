package com.investtracker.portfolio.service;

import com.investtracker.analytics.dto.HoldingResponse;
import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.portfolio.dto.RebalanceRequest;
import com.investtracker.portfolio.dto.RebalanceSuggestion;
import com.investtracker.portfolio.entity.Portfolio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RebalanceService {
    private final PortfolioService portfolioService;
    private final AnalyticsService analyticsService;
    
    public List<RebalanceSuggestion> calculateRebalanceSuggestions(
        UUID portfolioId, 
        UUID userId, 
        Map<UUID, BigDecimal> targetAllocations
    ) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        PortfolioSummaryResponse summary = analyticsService.getPortfolioSummary(portfolioId, userId);
        BigDecimal totalValue = summary.getTotalValue();
        
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return Collections.emptyList();
        }
        
        List<RebalanceSuggestion> suggestions = new ArrayList<>();
        
        // Calculate current allocations
        Map<UUID, BigDecimal> currentAllocations = summary.getHoldings().stream()
            .collect(Collectors.toMap(
                HoldingResponse::getAssetId,
                holding -> totalValue.compareTo(BigDecimal.ZERO) > 0
                    ? holding.getCurrentValue().divide(totalValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                    : BigDecimal.ZERO
            ));
        
        // Calculate suggestions
        for (Map.Entry<UUID, BigDecimal> targetEntry : targetAllocations.entrySet()) {
            UUID assetId = targetEntry.getKey();
            BigDecimal targetAllocation = targetEntry.getValue();
            BigDecimal currentAllocation = currentAllocations.getOrDefault(assetId, BigDecimal.ZERO);
            BigDecimal difference = targetAllocation.subtract(currentAllocation);
            
            // Find holding for asset details
            HoldingResponse holding = summary.getHoldings().stream()
                .filter(h -> h.getAssetId().equals(assetId))
                .findFirst()
                .orElse(null);
            
            if (holding == null && difference.abs().compareTo(new BigDecimal("0.1")) < 0) {
                continue; // Skip if no holding and difference is negligible
            }
            
            String assetSymbol = holding != null ? holding.getAssetSymbol() : "Unknown";
            String assetName = holding != null ? holding.getAssetName() : "Unknown";
            
            // Calculate suggested action amount
            BigDecimal targetValue = totalValue.multiply(targetAllocation).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal currentValue = holding != null ? holding.getCurrentValue() : BigDecimal.ZERO;
            BigDecimal suggestedAction = targetValue.subtract(currentValue);
            
            String action = "HOLD";
            if (difference.abs().compareTo(new BigDecimal("1")) > 0) { // More than 1% difference
                if (suggestedAction.compareTo(BigDecimal.ZERO) > 0) {
                    action = "BUY";
                } else if (suggestedAction.compareTo(BigDecimal.ZERO) < 0) {
                    action = "SELL";
                }
            }
            
            suggestions.add(new RebalanceSuggestion(
                assetId,
                assetSymbol,
                assetName,
                currentAllocation,
                targetAllocation,
                difference,
                suggestedAction,
                action
            ));
        }
        
        // Sort by absolute difference (largest first)
        suggestions.sort((a, b) -> b.getDifference().abs().compareTo(a.getDifference().abs()));
        
        return suggestions;
    }
}

