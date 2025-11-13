package com.investtracker.alert.dto;

import com.investtracker.alert.entity.PriceAlert.ConditionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceAlertResponse {
    private UUID id;
    private UUID assetId;
    private String assetSymbol;
    private String assetName;
    private ConditionType conditionType;
    private BigDecimal targetPrice;
    private String currency;
    private Boolean isActive;
    private LocalDateTime triggeredAt;
    private LocalDateTime createdAt;
}

