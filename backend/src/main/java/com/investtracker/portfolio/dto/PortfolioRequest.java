package com.investtracker.portfolio.dto;

import com.investtracker.portfolio.entity.Portfolio.RiskProfile;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PortfolioRequest {
    @NotBlank(message = "Portfolio name is required")
    private String name;
    private String description;
    private String baseCurrency = "USD";
    private RiskProfile riskProfile;
}

