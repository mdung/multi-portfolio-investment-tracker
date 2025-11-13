package com.investtracker.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReportResponse {
    private LocalDate reportDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String currency;
    private BigDecimal startingValue;
    private BigDecimal endingValue;
    private BigDecimal totalReturn;
    private BigDecimal totalReturnPercent;
    private BigDecimal bestDayReturn;
    private BigDecimal worstDayReturn;
    private BigDecimal averageDailyReturn;
    private BigDecimal volatility;
    private BigDecimal sharpeRatio;
    private List<DailyPerformance> dailyPerformance;
    private Map<String, AssetPerformance> assetPerformance;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPerformance {
        private LocalDate date;
        private BigDecimal value;
        private BigDecimal returnAmount;
        private BigDecimal returnPercent;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetPerformance {
        private String assetSymbol;
        private BigDecimal startingValue;
        private BigDecimal endingValue;
        private BigDecimal returnAmount;
        private BigDecimal returnPercent;
        private BigDecimal contribution;
    }
}

