package com.investtracker.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkPriceResponse {
    private Map<UUID, BigDecimal> prices;
    private String currency;
    private Long timestamp;
}

