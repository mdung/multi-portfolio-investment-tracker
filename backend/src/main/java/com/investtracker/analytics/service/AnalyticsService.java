package com.investtracker.analytics.service;

import com.investtracker.analytics.dto.HoldingResponse;
import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.asset.entity.Asset;
import com.investtracker.marketdata.service.MarketDataService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final PortfolioService portfolioService;
    private final TransactionRepository transactionRepository;
    private final MarketDataService marketDataService;
    
    public PortfolioSummaryResponse getPortfolioSummary(UUID portfolioId, UUID userId) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        List<Transaction> transactions = transactionRepository.findByPortfolioIdOrderByTransactionDateDesc(portfolioId);
        
        // Calculate holdings
        Map<UUID, HoldingCalculation> holdings = calculateHoldings(transactions);
        
        // Get current prices
        List<Asset> assets = holdings.keySet().stream()
            .map(assetId -> {
                // We need to get asset from transaction - for now, use first transaction
                return transactions.stream()
                    .filter(t -> t.getAsset().getId().equals(assetId))
                    .findFirst()
                    .map(Transaction::getAsset)
                    .orElse(null);
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        
        Map<Asset, BigDecimal> currentPrices = marketDataService.getCurrentPrices(assets, portfolio.getBaseCurrency());
        
        // Build holdings response
        List<HoldingResponse> holdingResponses = new ArrayList<>();
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        
        for (Map.Entry<UUID, HoldingCalculation> entry : holdings.entrySet()) {
            UUID assetId = entry.getKey();
            HoldingCalculation calc = entry.getValue();
            
            Asset asset = assets.stream()
                .filter(a -> a.getId().equals(assetId))
                .findFirst()
                .orElse(null);
            
            if (asset == null || calc.quantity.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            
            BigDecimal currentPrice = currentPrices.getOrDefault(asset, BigDecimal.ZERO);
            BigDecimal currentValue = calc.quantity.multiply(currentPrice);
            BigDecimal unrealizedPnL = currentValue.subtract(calc.totalCost);
            
            totalValue = totalValue.add(currentValue);
            totalCost = totalCost.add(calc.totalCost);
            
            holdingResponses.add(new HoldingResponse(
                assetId,
                asset.getSymbol(),
                asset.getName(),
                asset.getAssetType().name(),
                calc.quantity,
                calc.averagePrice,
                currentPrice,
                currentValue,
                unrealizedPnL,
                calc.realizedPnL,
                asset.getCurrency()
            ));
        }
        
        // Calculate allocation
        Map<String, BigDecimal> allocationByType = holdingResponses.stream()
            .collect(Collectors.groupingBy(
                HoldingResponse::getAssetType,
                Collectors.reducing(BigDecimal.ZERO, HoldingResponse::getCurrentValue, BigDecimal::add)
            ));
        
        // Top 5 assets
        Map<String, BigDecimal> topAssets = holdingResponses.stream()
            .sorted((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()))
            .limit(5)
            .collect(Collectors.toMap(
                HoldingResponse::getAssetSymbol,
                HoldingResponse::getCurrentValue,
                (a, b) -> a,
                LinkedHashMap::new
            ));
        
        BigDecimal totalPnL = totalValue.subtract(totalCost);
        BigDecimal totalPnLPercent = totalCost.compareTo(BigDecimal.ZERO) > 0
            ? totalPnL.divide(totalCost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
            : BigDecimal.ZERO;
        
        return new PortfolioSummaryResponse(
            totalValue,
            totalCost,
            totalPnL,
            totalPnLPercent,
            portfolio.getBaseCurrency(),
            holdingResponses,
            allocationByType,
            topAssets
        );
    }
    
    private Map<UUID, HoldingCalculation> calculateHoldings(List<Transaction> transactions) {
        Map<UUID, HoldingCalculation> holdings = new HashMap<>();
        
        for (Transaction tx : transactions) {
            UUID assetId = tx.getAsset().getId();
            HoldingCalculation calc = holdings.computeIfAbsent(assetId, k -> new HoldingCalculation());
            
            switch (tx.getTransactionType()) {
                case BUY:
                case DEPOSIT:
                case TRANSFER_IN:
                    // Add to holdings
                    BigDecimal totalCostBefore = calc.totalCost;
                    BigDecimal quantityBefore = calc.quantity;
                    
                    calc.quantity = calc.quantity.add(tx.getQuantity());
                    calc.totalCost = calc.totalCost.add(tx.getQuantity().multiply(tx.getPrice()).add(tx.getFee()));
                    
                    if (calc.quantity.compareTo(BigDecimal.ZERO) > 0) {
                        calc.averagePrice = calc.totalCost.divide(calc.quantity, 8, RoundingMode.HALF_UP);
                    }
                    break;
                    
                case SELL:
                case WITHDRAW:
                case TRANSFER_OUT:
                    // Remove from holdings (FIFO)
                    if (calc.quantity.compareTo(tx.getQuantity()) < 0) {
                        throw new IllegalStateException("Insufficient holdings for transaction");
                    }
                    
                    BigDecimal sellPrice = tx.getPrice();
                    BigDecimal sellQuantity = tx.getQuantity();
                    BigDecimal costBasis = calc.averagePrice.multiply(sellQuantity);
                    BigDecimal proceeds = sellPrice.multiply(sellQuantity).subtract(tx.getFee());
                    BigDecimal realizedPnL = proceeds.subtract(costBasis);
                    
                    calc.realizedPnL = calc.realizedPnL.add(realizedPnL);
                    calc.quantity = calc.quantity.subtract(sellQuantity);
                    calc.totalCost = calc.totalCost.subtract(costBasis);
                    break;
            }
        }
        
        return holdings;
    }
    
    private static class HoldingCalculation {
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal averagePrice = BigDecimal.ZERO;
        BigDecimal realizedPnL = BigDecimal.ZERO;
    }
}

