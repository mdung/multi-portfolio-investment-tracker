package com.investtracker.analytics.service;

import com.investtracker.analytics.dto.CorrelationResponse;
import com.investtracker.marketdata.entity.PriceSnapshot;
import com.investtracker.marketdata.repository.PriceSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CorrelationService {
    private final PriceSnapshotRepository priceSnapshotRepository;
    
    public CorrelationResponse calculateCorrelation(UUID portfolioId, java.util.UUID userId) {
        // This would need portfolio and asset information
        // For now, return a simplified version
        
        // Get price snapshots for assets in portfolio
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusMonths(6);
        
        // This is a placeholder - would need to get assets from portfolio
        Map<String, Map<String, BigDecimal>> correlationMatrix = new HashMap<>();
        List<CorrelationResponse.AssetPair> topCorrelatedPairs = new ArrayList<>();
        List<CorrelationResponse.AssetPair> topInversePairs = new ArrayList<>();
        
        // Simplified implementation - would need actual asset price data
        // For a full implementation, we would:
        // 1. Get all assets in portfolio
        // 2. Get price history for each asset
        // 3. Calculate correlation coefficients between pairs
        // 4. Build correlation matrix
        
        return new CorrelationResponse(
            correlationMatrix,
            topCorrelatedPairs,
            topInversePairs
        );
    }
    
    private BigDecimal calculateCorrelationCoefficient(
        List<BigDecimal> prices1, 
        List<BigDecimal> prices2
    ) {
        if (prices1.size() != prices2.size() || prices1.size() < 2) {
            return BigDecimal.ZERO;
        }
        
        // Calculate returns
        List<BigDecimal> returns1 = calculateReturns(prices1);
        List<BigDecimal> returns2 = calculateReturns(prices2);
        
        // Calculate means
        BigDecimal mean1 = returns1.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(returns1.size()), 8, RoundingMode.HALF_UP);
        BigDecimal mean2 = returns2.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(returns2.size()), 8, RoundingMode.HALF_UP);
        
        // Calculate covariance
        BigDecimal covariance = BigDecimal.ZERO;
        for (int i = 0; i < returns1.size(); i++) {
            BigDecimal diff1 = returns1.get(i).subtract(mean1);
            BigDecimal diff2 = returns2.get(i).subtract(mean2);
            covariance = covariance.add(diff1.multiply(diff2));
        }
        covariance = covariance.divide(new BigDecimal(returns1.size()), 8, RoundingMode.HALF_UP);
        
        // Calculate standard deviations
        BigDecimal stdDev1 = calculateStandardDeviation(returns1, mean1);
        BigDecimal stdDev2 = calculateStandardDeviation(returns2, mean2);
        
        // Correlation = covariance / (stdDev1 * stdDev2)
        if (stdDev1.compareTo(BigDecimal.ZERO) == 0 || stdDev2.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        return covariance.divide(stdDev1.multiply(stdDev2), 4, RoundingMode.HALF_UP);
    }
    
    private List<BigDecimal> calculateReturns(List<BigDecimal> prices) {
        List<BigDecimal> returns = new ArrayList<>();
        for (int i = 1; i < prices.size(); i++) {
            if (prices.get(i - 1).compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal returnValue = prices.get(i).subtract(prices.get(i - 1))
                    .divide(prices.get(i - 1), 8, RoundingMode.HALF_UP);
                returns.add(returnValue);
            }
        }
        return returns;
    }
    
    private BigDecimal calculateStandardDeviation(List<BigDecimal> values, BigDecimal mean) {
        BigDecimal variance = values.stream()
            .map(v -> v.subtract(mean).pow(2))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(values.size()), 8, RoundingMode.HALF_UP);
        
        double stdDev = Math.sqrt(variance.doubleValue());
        return BigDecimal.valueOf(stdDev);
    }
}

