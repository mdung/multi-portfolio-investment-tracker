package com.investtracker.reports.service;

import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.analytics.entity.PortfolioSnapshot;
import com.investtracker.analytics.repository.PortfolioSnapshotRepository;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.reports.dto.PerformanceReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceReportService {
    private final PortfolioService portfolioService;
    private final AnalyticsService analyticsService;
    private final PortfolioSnapshotRepository portfolioSnapshotRepository;
    
    public PerformanceReportResponse generatePerformanceReport(
        UUID portfolioId, 
        UUID userId, 
        LocalDate startDate, 
        LocalDate endDate
    ) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        if (startDate == null) {
            startDate = LocalDate.now().minusYears(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        // Get snapshots in date range
        List<PortfolioSnapshot> snapshots = portfolioSnapshotRepository.findByPortfolioIdAndDateRange(
            portfolioId, startDateTime, endDateTime
        );
        
        // If no snapshots, create current one
        if (snapshots.isEmpty()) {
            PortfolioSummaryResponse summary = analyticsService.getPortfolioSummary(portfolioId, userId);
            analyticsService.createSnapshot(portfolio, summary);
            snapshots = portfolioSnapshotRepository.findByPortfolioIdAndDateRange(portfolioId, startDateTime, endDateTime);
        }
        
        if (snapshots.isEmpty()) {
            throw new IllegalArgumentException("No performance data available");
        }
        
        // Sort by date
        snapshots.sort(Comparator.comparing(PortfolioSnapshot::getSnapshotDate));
        
        BigDecimal startingValue = snapshots.get(0).getTotalValue();
        BigDecimal endingValue = snapshots.get(snapshots.size() - 1).getTotalValue();
        BigDecimal totalReturn = endingValue.subtract(startingValue);
        BigDecimal totalReturnPercent = startingValue.compareTo(BigDecimal.ZERO) > 0
            ? totalReturn.divide(startingValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
            : BigDecimal.ZERO;
        
        // Calculate daily performance
        List<PerformanceReportResponse.DailyPerformance> dailyPerformance = new ArrayList<>();
        BigDecimal bestDayReturn = BigDecimal.ZERO;
        BigDecimal worstDayReturn = BigDecimal.ZERO;
        List<BigDecimal> dailyReturns = new ArrayList<>();
        
        for (int i = 1; i < snapshots.size(); i++) {
            PortfolioSnapshot prev = snapshots.get(i - 1);
            PortfolioSnapshot curr = snapshots.get(i);
            
            BigDecimal returnAmount = curr.getTotalValue().subtract(prev.getTotalValue());
            BigDecimal returnPercent = prev.getTotalValue().compareTo(BigDecimal.ZERO) > 0
                ? returnAmount.divide(prev.getTotalValue(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                : BigDecimal.ZERO;
            
            dailyReturns.add(returnPercent);
            if (returnPercent.compareTo(bestDayReturn) > 0) {
                bestDayReturn = returnPercent;
            }
            if (returnPercent.compareTo(worstDayReturn) < 0) {
                worstDayReturn = returnPercent;
            }
            
            dailyPerformance.add(new PerformanceReportResponse.DailyPerformance(
                curr.getSnapshotDate().toLocalDate(),
                curr.getTotalValue(),
                returnAmount,
                returnPercent
            ));
        }
        
        // Calculate average daily return
        BigDecimal averageDailyReturn = dailyReturns.isEmpty() ? BigDecimal.ZERO
            : dailyReturns.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(dailyReturns.size()), 4, RoundingMode.HALF_UP);
        
        // Calculate volatility
        BigDecimal volatility = calculateVolatility(dailyReturns);
        
        // Calculate Sharpe ratio
        BigDecimal sharpeRatio = volatility.compareTo(BigDecimal.ZERO) > 0
            ? averageDailyReturn.divide(volatility, 4, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Asset performance (simplified - would need more detailed tracking)
        Map<String, PerformanceReportResponse.AssetPerformance> assetPerformance = new HashMap<>();
        
        return new PerformanceReportResponse(
            LocalDate.now(),
            startDate,
            endDate,
            portfolio.getBaseCurrency(),
            startingValue,
            endingValue,
            totalReturn,
            totalReturnPercent,
            bestDayReturn,
            worstDayReturn,
            averageDailyReturn,
            volatility,
            sharpeRatio,
            dailyPerformance,
            assetPerformance
        );
    }
    
    private BigDecimal calculateVolatility(List<BigDecimal> returns) {
        if (returns.size() < 2) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal mean = returns.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(returns.size()), 8, RoundingMode.HALF_UP);
        
        BigDecimal variance = returns.stream()
            .map(r -> r.subtract(mean).pow(2))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(returns.size()), 8, RoundingMode.HALF_UP);
        
        double stdDev = Math.sqrt(variance.doubleValue());
        return BigDecimal.valueOf(stdDev);
    }
}

