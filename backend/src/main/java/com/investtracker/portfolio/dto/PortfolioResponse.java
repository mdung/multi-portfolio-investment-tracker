package com.investtracker.portfolio.dto;

import com.investtracker.portfolio.entity.Portfolio.RiskProfile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioResponse {
    private UUID id;
    private String name;
    private String description;
    private String baseCurrency;
    private RiskProfile riskProfile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

