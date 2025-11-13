package com.investtracker.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaxReportResponse {
    private LocalDate reportDate;
    private String currency;
    private BigDecimal totalRealizedGains;
    private BigDecimal totalRealizedLosses;
    private BigDecimal netRealizedGains;
    private List<RealizedTransaction> realizedTransactions;
    private Map<String, BigDecimal> gainsByAsset;
    private Map<String, BigDecimal> lossesByAsset;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RealizedTransaction {
        private String assetSymbol;
        private String assetName;
        private LocalDate sellDate;
        private BigDecimal quantity;
        private BigDecimal sellPrice;
        private BigDecimal costBasis;
        private BigDecimal realizedGain;
        private BigDecimal realizedLoss;
    }
}

