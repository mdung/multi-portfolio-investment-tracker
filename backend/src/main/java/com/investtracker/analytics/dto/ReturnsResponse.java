package com.investtracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnsResponse {
    private BigDecimal dailyReturn;
    private BigDecimal weeklyReturn;
    private BigDecimal monthlyReturn;
    private BigDecimal yearlyReturn;
    private BigDecimal totalReturn;
}

