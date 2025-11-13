package com.investtracker.alert.dto;

import com.investtracker.alert.entity.PriceAlert.ConditionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PriceAlertRequest {
    @NotNull(message = "Asset ID is required")
    private UUID assetId;

    @NotNull(message = "Condition type is required")
    private ConditionType conditionType;

    @NotNull(message = "Target price is required")
    @Positive(message = "Target price must be positive")
    private BigDecimal targetPrice;

    @NotNull(message = "Currency is required")
    private String currency;
}

