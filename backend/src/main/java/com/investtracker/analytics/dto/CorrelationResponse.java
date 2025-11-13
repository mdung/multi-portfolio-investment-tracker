package com.investtracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CorrelationResponse {
    private Map<String, Map<String, BigDecimal>> correlationMatrix; // Asset symbol -> Asset symbol -> Correlation
    private List<AssetPair> topCorrelatedPairs;
    private List<AssetPair> topInversePairs;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetPair {
        private String asset1Symbol;
        private String asset2Symbol;
        private BigDecimal correlation;
    }
}

