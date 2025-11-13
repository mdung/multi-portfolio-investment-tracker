package com.investtracker.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceResponse {
    private UUID assetId;
    private String assetSymbol;
    private BigDecimal price;
    private String currency;
    private String source;
    private Long timestamp;
}

