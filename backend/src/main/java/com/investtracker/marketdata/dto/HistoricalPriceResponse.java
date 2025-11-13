package com.investtracker.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalPriceResponse {
    private UUID assetId;
    private String assetSymbol;
    private String currency;
    private List<PricePoint> prices;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricePoint {
        private LocalDateTime date;
        private BigDecimal price;
        private String source;
    }
}

