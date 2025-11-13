package com.investtracker.reports.service;

import com.investtracker.analytics.dto.HoldingResponse;
import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.reports.dto.TaxReportResponse;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxReportService {
    private final PortfolioService portfolioService;
    private final TransactionRepository transactionRepository;
    private final AnalyticsService analyticsService;
    
    public TaxReportResponse generateTaxReport(UUID portfolioId, UUID userId, LocalDate startDate, LocalDate endDate) {
        Portfolio portfolio = portfolioService.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        // Get all transactions in date range
        List<Transaction> transactions = transactionRepository.findByPortfolioIdOrderByTransactionDateDesc(portfolioId);
        
        // Filter by date range
        if (startDate != null || endDate != null) {
            transactions = transactions.stream()
                .filter(tx -> {
                    LocalDate txDate = tx.getTransactionDate().toLocalDate();
                    if (startDate != null && txDate.isBefore(startDate)) {
                        return false;
                    }
                    if (endDate != null && txDate.isAfter(endDate)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
        }
        
        // Calculate realized gains/losses from SELL transactions
        List<TaxReportResponse.RealizedTransaction> realizedTransactions = new ArrayList<>();
        Map<String, BigDecimal> gainsByAsset = new HashMap<>();
        Map<String, BigDecimal> lossesByAsset = new HashMap<>();
        BigDecimal totalRealizedGains = BigDecimal.ZERO;
        BigDecimal totalRealizedLosses = BigDecimal.ZERO;
        
        // Calculate holdings to get cost basis
        Map<UUID, HoldingCalculation> holdings = calculateHoldings(transactions);
        
        for (Transaction tx : transactions) {
            if (tx.getTransactionType() == Transaction.TransactionType.SELL) {
                UUID assetId = tx.getAsset().getId();
                HoldingCalculation holding = holdings.get(assetId);
                
                if (holding != null && holding.averagePrice.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal costBasis = holding.averagePrice.multiply(tx.getQuantity());
                    BigDecimal proceeds = tx.getPrice().multiply(tx.getQuantity()).subtract(tx.getFee() != null ? tx.getFee() : BigDecimal.ZERO);
                    BigDecimal realizedPnL = proceeds.subtract(costBasis);
                    
                    TaxReportResponse.RealizedTransaction realizedTx = new TaxReportResponse.RealizedTransaction(
                        tx.getAsset().getSymbol(),
                        tx.getAsset().getName(),
                        tx.getTransactionDate().toLocalDate(),
                        tx.getQuantity(),
                        tx.getPrice(),
                        costBasis,
                        realizedPnL.compareTo(BigDecimal.ZERO) > 0 ? realizedPnL : BigDecimal.ZERO,
                        realizedPnL.compareTo(BigDecimal.ZERO) < 0 ? realizedPnL.abs() : BigDecimal.ZERO
                    );
                    realizedTransactions.add(realizedTx);
                    
                    if (realizedPnL.compareTo(BigDecimal.ZERO) > 0) {
                        totalRealizedGains = totalRealizedGains.add(realizedPnL);
                        gainsByAsset.merge(tx.getAsset().getSymbol(), realizedPnL, BigDecimal::add);
                    } else {
                        totalRealizedLosses = totalRealizedLosses.add(realizedPnL.abs());
                        lossesByAsset.merge(tx.getAsset().getSymbol(), realizedPnL.abs(), BigDecimal::add);
                    }
                }
            }
        }
        
        BigDecimal netRealizedGains = totalRealizedGains.subtract(totalRealizedLosses);
        
        return new TaxReportResponse(
            LocalDate.now(),
            portfolio.getBaseCurrency(),
            totalRealizedGains,
            totalRealizedLosses,
            netRealizedGains,
            realizedTransactions,
            gainsByAsset,
            lossesByAsset
        );
    }
    
    private Map<UUID, HoldingCalculation> calculateHoldings(List<Transaction> transactions) {
        Map<UUID, HoldingCalculation> holdings = new HashMap<>();
        
        // Sort by date ascending for FIFO calculation
        List<Transaction> sortedTx = transactions.stream()
            .sorted(Comparator.comparing(Transaction::getTransactionDate))
            .collect(Collectors.toList());
        
        for (Transaction tx : sortedTx) {
            UUID assetId = tx.getAsset().getId();
            HoldingCalculation calc = holdings.computeIfAbsent(assetId, k -> new HoldingCalculation());
            
            switch (tx.getTransactionType()) {
                case BUY:
                case DEPOSIT:
                case TRANSFER_IN:
                    calc.quantity = calc.quantity.add(tx.getQuantity());
                    calc.totalCost = calc.totalCost.add(tx.getQuantity().multiply(tx.getPrice()).add(tx.getFee() != null ? tx.getFee() : BigDecimal.ZERO));
                    if (calc.quantity.compareTo(BigDecimal.ZERO) > 0) {
                        calc.averagePrice = calc.totalCost.divide(calc.quantity, 8, RoundingMode.HALF_UP);
                    }
                    break;
                    
                case SELL:
                case WITHDRAW:
                case TRANSFER_OUT:
                    if (calc.quantity.compareTo(tx.getQuantity()) >= 0) {
                        calc.quantity = calc.quantity.subtract(tx.getQuantity());
                        BigDecimal costBasis = calc.averagePrice.multiply(tx.getQuantity());
                        calc.totalCost = calc.totalCost.subtract(costBasis);
                    }
                    break;
            }
        }
        
        return holdings;
    }
    
    private static class HoldingCalculation {
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal averagePrice = BigDecimal.ZERO;
    }
}

