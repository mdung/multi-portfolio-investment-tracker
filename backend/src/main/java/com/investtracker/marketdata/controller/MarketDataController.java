package com.investtracker.marketdata.controller;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import com.investtracker.marketdata.dto.*;
import com.investtracker.marketdata.entity.PriceSnapshot;
import com.investtracker.marketdata.service.MarketDataService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.security.UserPrincipal;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.repository.TransactionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
public class MarketDataController {
    private final MarketDataService marketDataService;
    private final AssetService assetService;
    private final PortfolioService portfolioService;
    private final TransactionRepository transactionRepository;
    
    @GetMapping("/asset/{assetId}/price")
    public ResponseEntity<?> getAssetPrice(
        @PathVariable java.util.UUID assetId,
        @RequestParam(defaultValue = "USD") String currency
    ) {
        Asset asset = assetService.findById(assetId)
            .orElse(null);
        
        if (asset == null) {
            return ResponseEntity.notFound().build();
        }
        
        return marketDataService.getCurrentPrice(asset, currency)
            .map(price -> ResponseEntity.ok(new PriceResponse(
                assetId,
                asset.getSymbol(),
                price,
                currency,
                "market",
                System.currentTimeMillis()
            )))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<?> getBulkPrices(
        @Valid @RequestBody BulkPriceRequest request
    ) {
        Map<java.util.UUID, java.math.BigDecimal> prices = new HashMap<>();
        
        for (java.util.UUID assetId : request.getAssetIds()) {
            Asset asset = assetService.findById(assetId).orElse(null);
            if (asset != null) {
                marketDataService.getCurrentPrice(asset, request.getCurrency())
                    .ifPresent(price -> prices.put(assetId, price));
            }
        }
        
        return ResponseEntity.ok(new BulkPriceResponse(
            prices,
            request.getCurrency(),
            System.currentTimeMillis()
        ));
    }
    
    @GetMapping("/asset/{assetId}/history")
    public ResponseEntity<?> getAssetPriceHistory(
        @PathVariable java.util.UUID assetId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @RequestParam(defaultValue = "daily") String interval
    ) {
        Asset asset = assetService.findById(assetId)
            .orElse(null);
        
        if (asset == null) {
            return ResponseEntity.notFound().build();
        }
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        List<PriceSnapshot> snapshots = marketDataService.getHistoricalPrices(assetId, startDate, endDate);
        
        // Group by interval if needed
        List<HistoricalPriceResponse.PricePoint> pricePoints = snapshots.stream()
            .map(snapshot -> new HistoricalPriceResponse.PricePoint(
                snapshot.getSnapshotDate(),
                snapshot.getPrice(),
                snapshot.getSource()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(new HistoricalPriceResponse(
            assetId,
            asset.getSymbol(),
            asset.getCurrency(),
            pricePoints
        ));
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchAssets(
        @RequestParam String query
    ) {
        List<Asset> assets = assetService.searchAssets(query);
        return ResponseEntity.ok(assets);
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshPortfolioPrices(
        @RequestParam java.util.UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            Portfolio portfolio = portfolioService.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
            
            if (!portfolio.getUser().getId().equals(userPrincipal.getId())) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Portfolio access denied"));
            }
            
            // Get all assets in portfolio
            List<Transaction> transactions = transactionRepository.findByPortfolioIdOrderByTransactionDateDesc(portfolioId);
            Set<Asset> assets = transactions.stream()
                .map(Transaction::getAsset)
                .collect(Collectors.toSet());
            
            // Refresh prices for all assets
            marketDataService.getCurrentPrices(assets, portfolio.getBaseCurrency());
            marketDataService.clearCache();
            
            return ResponseEntity.ok(new MessageResponse("Prices refreshed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/prices")
    public ResponseEntity<?> getPortfolioPrices(
        @PathVariable java.util.UUID portfolioId,
        @RequestParam(defaultValue = "USD") String currency
    ) {
        // This would require getting assets from portfolio transactions
        // For simplicity, returning a placeholder
        return ResponseEntity.ok(new MessageResponse("Use /api/analytics/portfolio/{id}/summary for portfolio prices"));
    }
    
    private record MessageResponse(String message) {}
    private record ErrorResponse(String message) {}
}

