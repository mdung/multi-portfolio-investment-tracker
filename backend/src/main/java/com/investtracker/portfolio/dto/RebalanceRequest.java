package com.investtracker.portfolio.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Data
public class RebalanceRequest {
    @NotEmpty(message = "Target allocations are required")
    private Map<UUID, BigDecimal> targetAllocations; // Asset ID -> Target percentage (0-100)
}

