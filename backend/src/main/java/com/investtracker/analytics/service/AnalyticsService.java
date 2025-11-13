package com.investtracker.analytics.service;

import com.investtracker.analytics.dto.*;
import com.investtracker.analytics.entity.PortfolioSnapshot;
import com.investtracker.analytics.repository.PortfolioSnapshotRepository;
import com.investtracker.asset.entity.Asset;
import com.investtracker.marketdata.service.MarketDataService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.repository.PortfolioRepository;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.repository.TransactionRepository;
import com.investtracker.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final PortfolioService portfolioService;
    private final PortfolioRepository portfolioRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final MarketDataService marketDataService;
    private final PortfolioSnapshotRepository portfolioSnapshotRepository;
    
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
    
    public List<PerformanceDataPoint> getPortfolioPerformance(UUID portfolioId, UUID userId, String interval) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = switch (interval.toUpperCase()) {
            case "DAILY" -> endDate.minusDays(30);
            case "WEEKLY" -> endDate.minusWeeks(12);
            case "MONTHLY" -> endDate.minusMonths(12);
            default -> endDate.minusDays(30);
        };
        
        List<PortfolioSnapshot> snapshots = portfolioSnapshotRepository.findByPortfolioIdAndDateRange(
            portfolioId, startDate, endDate
        );
        
        // If no snapshots, create them from current summary
        if (snapshots.isEmpty()) {
            PortfolioSummaryResponse summary = getPortfolioSummary(portfolioId, userId);
            createSnapshot(portfolio, summary);
            snapshots = portfolioSnapshotRepository.findByPortfolioIdAndDateRange(portfolioId, startDate, endDate);
        }
        
        return snapshots.stream()
            .map(snapshot -> new PerformanceDataPoint(
                snapshot.getSnapshotDate(),
                snapshot.getTotalValue(),
                snapshot.getTotalCost(),
                snapshot.getTotalPnL(),
                snapshot.getTotalPnLPercent()
            ))
            .collect(Collectors.toList());
    }
    
    public List<PerformanceDataPoint> getPortfolioHistory(UUID portfolioId, UUID userId) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        List<PortfolioSnapshot> snapshots = portfolioSnapshotRepository.findByPortfolioIdOrderByDateDesc(portfolioId);
        
        return snapshots.stream()
            .map(snapshot -> new PerformanceDataPoint(
                snapshot.getSnapshotDate(),
                snapshot.getTotalValue(),
                snapshot.getTotalCost(),
                snapshot.getTotalPnL(),
                snapshot.getTotalPnLPercent()
            ))
            .collect(Collectors.toList());
    }
    
    @Transactional
    public void createSnapshot(Portfolio portfolio, PortfolioSummaryResponse summary) {
        PortfolioSnapshot snapshot = new PortfolioSnapshot();
        snapshot.setPortfolio(portfolio);
        snapshot.setTotalValue(summary.getTotalValue());
        snapshot.setTotalCost(summary.getTotalCost());
        snapshot.setTotalPnL(summary.getTotalPnL());
        snapshot.setTotalPnLPercent(summary.getTotalPnLPercent());
        snapshot.setCurrency(summary.getBaseCurrency());
        snapshot.setSnapshotDate(LocalDateTime.now());
        portfolioSnapshotRepository.save(snapshot);
    }
    
    public ReturnsResponse getPortfolioReturns(UUID portfolioId, UUID userId) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        PortfolioSummaryResponse currentSummary = getPortfolioSummary(portfolioId, userId);
        BigDecimal currentValue = currentSummary.getTotalValue();
        
        LocalDateTime now = LocalDateTime.now();
        
        // Get historical snapshots
        BigDecimal dailyValue = getSnapshotValue(portfolioId, now.minusDays(1));
        BigDecimal weeklyValue = getSnapshotValue(portfolioId, now.minusWeeks(1));
        BigDecimal monthlyValue = getSnapshotValue(portfolioId, now.minusMonths(1));
        BigDecimal yearlyValue = getSnapshotValue(portfolioId, now.minusYears(1));
        
        // Calculate returns
        BigDecimal dailyReturn = calculateReturn(dailyValue, currentValue);
        BigDecimal weeklyReturn = calculateReturn(weeklyValue, currentValue);
        BigDecimal monthlyReturn = calculateReturn(monthlyValue, currentValue);
        BigDecimal yearlyReturn = calculateReturn(yearlyValue, currentValue);
        
        // Total return from cost basis
        BigDecimal totalReturn = currentSummary.getTotalPnLPercent();
        
        return new ReturnsResponse(dailyReturn, weeklyReturn, monthlyReturn, yearlyReturn, totalReturn);
    }
    
    private BigDecimal getSnapshotValue(UUID portfolioId, LocalDateTime date) {
        List<PortfolioSnapshot> snapshots = portfolioSnapshotRepository.findByPortfolioIdAndDate(
            portfolioId, date
        );
        if (snapshots.isEmpty()) {
            // Try to get closest snapshot
            List<PortfolioSnapshot> allSnapshots = portfolioSnapshotRepository.findByPortfolioIdOrderByDateDesc(portfolioId);
            if (allSnapshots.isEmpty()) {
                return BigDecimal.ZERO;
            }
            // Find closest snapshot before or at the date
            return allSnapshots.stream()
                .filter(s -> s.getSnapshotDate().isBefore(date) || s.getSnapshotDate().isEqual(date))
                .findFirst()
                .map(PortfolioSnapshot::getTotalValue)
                .orElse(BigDecimal.ZERO);
        }
        return snapshots.get(0).getTotalValue();
    }
    
    private BigDecimal calculateReturn(BigDecimal previousValue, BigDecimal currentValue) {
        if (previousValue == null || previousValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentValue.subtract(previousValue)
            .divide(previousValue, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }
    
    public RiskMetricsResponse getPortfolioRiskMetrics(UUID portfolioId, UUID userId) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        PortfolioSummaryResponse summary = getPortfolioSummary(portfolioId, userId);
        
        // Calculate portfolio concentration (top 5 assets %)
        Map<String, BigDecimal> topAssets = summary.getTopAssets();
        BigDecimal top5Value = topAssets.values().stream()
            .limit(5)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal portfolioConcentration = summary.getTotalValue().compareTo(BigDecimal.ZERO) > 0
            ? top5Value.divide(summary.getTotalValue(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
            : BigDecimal.ZERO;
        
        // Calculate volatility (standard deviation of returns)
        List<PortfolioSnapshot> snapshots = portfolioSnapshotRepository.findByPortfolioIdOrderByDateDesc(portfolioId);
        BigDecimal volatility = calculateVolatility(snapshots);
        
        // Calculate Sharpe ratio (simplified - assumes risk-free rate of 0)
        BigDecimal sharpeRatio = calculateSharpeRatio(snapshots, volatility);
        
        return new RiskMetricsResponse(
            portfolioConcentration,
            topAssets,
            volatility,
            sharpeRatio,
            summary.getBaseCurrency()
        );
    }
    
    private BigDecimal calculateVolatility(List<PortfolioSnapshot> snapshots) {
        if (snapshots.size() < 2) {
            return BigDecimal.ZERO;
        }
        
        // Calculate returns
        List<BigDecimal> returns = new ArrayList<>();
        for (int i = 1; i < snapshots.size(); i++) {
            BigDecimal prevValue = snapshots.get(i).getTotalValue();
            BigDecimal currValue = snapshots.get(i - 1).getTotalValue();
            if (prevValue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal returnValue = currValue.subtract(prevValue)
                    .divide(prevValue, 8, RoundingMode.HALF_UP);
                returns.add(returnValue);
            }
        }
        
        if (returns.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        // Calculate mean
        BigDecimal mean = returns.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(returns.size()), 8, RoundingMode.HALF_UP);
        
        // Calculate variance
        BigDecimal variance = returns.stream()
            .map(r -> r.subtract(mean).pow(2))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(returns.size()), 8, RoundingMode.HALF_UP);
        
        // Standard deviation (volatility)
        double stdDev = Math.sqrt(variance.doubleValue());
        return BigDecimal.valueOf(stdDev).multiply(new BigDecimal("100")); // Convert to percentage
    }
    
    private BigDecimal calculateSharpeRatio(List<PortfolioSnapshot> snapshots, BigDecimal volatility) {
        if (snapshots.size() < 2 || volatility.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        // Calculate average return
        BigDecimal avgReturn = BigDecimal.ZERO;
        int count = 0;
        for (int i = 1; i < snapshots.size(); i++) {
            BigDecimal prevValue = snapshots.get(i).getTotalValue();
            BigDecimal currValue = snapshots.get(i - 1).getTotalValue();
            if (prevValue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal returnValue = currValue.subtract(prevValue)
                    .divide(prevValue, 8, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")); // Convert to percentage
                avgReturn = avgReturn.add(returnValue);
                count++;
            }
        }
        
        if (count == 0) {
            return BigDecimal.ZERO;
        }
        
        avgReturn = avgReturn.divide(new BigDecimal(count), 4, RoundingMode.HALF_UP);
        
        // Sharpe ratio = (Return - RiskFreeRate) / Volatility
        // Assuming risk-free rate = 0
        return volatility.compareTo(BigDecimal.ZERO) > 0
            ? avgReturn.divide(volatility, 4, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
    }
    
    public DashboardResponse getDashboard(UUID userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserId(userId);
        
        BigDecimal totalNetWorth = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        Map<String, Map<String, Object>> assetPerformance = new HashMap<>();
        
        // Aggregate data from all portfolios
        for (Portfolio portfolio : portfolios) {
            try {
                PortfolioSummaryResponse summary = getPortfolioSummary(portfolio.getId(), userId);
                totalNetWorth = totalNetWorth.add(summary.getTotalValue());
                totalCost = totalCost.add(summary.getTotalCost());
                
                // Track asset performance
                for (HoldingResponse holding : summary.getHoldings()) {
                    String symbol = holding.getAssetSymbol();
                    if (!assetPerformance.containsKey(symbol)) {
                        Map<String, Object> perf = new HashMap<>();
                        perf.put("assetSymbol", symbol);
                        perf.put("assetName", holding.getAssetName());
                        perf.put("totalValue", BigDecimal.ZERO);
                        perf.put("totalCost", BigDecimal.ZERO);
                        perf.put("totalPnL", BigDecimal.ZERO);
                        assetPerformance.put(symbol, perf);
                    }
                    Map<String, Object> perf = assetPerformance.get(symbol);
                    perf.put("totalValue", ((BigDecimal) perf.get("totalValue")).add(holding.getCurrentValue()));
                    perf.put("totalCost", ((BigDecimal) perf.get("totalCost")).add(holding.getAverageBuyPrice().multiply(holding.getQuantity())));
                    perf.put("totalPnL", ((BigDecimal) perf.get("totalPnL")).add(holding.getUnrealizedPnL()));
                }
            } catch (Exception e) {
                // Skip portfolios with errors
            }
        }
        
        BigDecimal overallPnL = totalNetWorth.subtract(totalCost);
        BigDecimal overallPnLPercent = totalCost.compareTo(BigDecimal.ZERO) > 0
            ? overallPnL.divide(totalCost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
            : BigDecimal.ZERO;
        
        // Top performing assets
        List<Map<String, Object>> topPerformingAssets = assetPerformance.values().stream()
            .map(perf -> {
                BigDecimal value = (BigDecimal) perf.get("totalValue");
                BigDecimal cost = (BigDecimal) perf.get("totalCost");
                BigDecimal pnl = (BigDecimal) perf.get("totalPnL");
                BigDecimal returnPct = cost.compareTo(BigDecimal.ZERO) > 0
                    ? pnl.divide(cost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                    : BigDecimal.ZERO;
                
                Map<String, Object> result = new HashMap<>();
                result.put("assetSymbol", perf.get("assetSymbol"));
                result.put("assetName", perf.get("assetName"));
                result.put("return", returnPct);
                result.put("value", value);
                result.put("pnl", pnl);
                return result;
            })
            .sorted((a, b) -> ((BigDecimal) b.get("return")).compareTo((BigDecimal) a.get("return")))
            .limit(10)
            .collect(Collectors.toList());
        
        // Recent transactions
        List<TransactionResponse> recentTransactions = transactionService.getUserTransactionsForExport(
            userId, null, null, null, null, null
        ).stream()
            .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
            .limit(10)
            .collect(Collectors.toList());
        
        return new DashboardResponse(
            totalNetWorth,
            totalCost,
            overallPnL,
            overallPnLPercent,
            portfolios.isEmpty() ? "USD" : portfolios.get(0).getBaseCurrency(),
            topPerformingAssets,
            recentTransactions,
            portfolios.size()
        );
    }
    
    private static class HoldingCalculation {
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal averagePrice = BigDecimal.ZERO;
        BigDecimal realizedPnL = BigDecimal.ZERO;
    }
}

