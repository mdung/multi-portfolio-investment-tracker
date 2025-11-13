package com.investtracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceDataPoint {
    private LocalDateTime date;
    private BigDecimal totalValue;
    private BigDecimal totalCost;
    private BigDecimal totalPnL;
    private BigDecimal totalPnLPercent;
}

