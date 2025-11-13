package com.investtracker.marketdata.controller;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import com.investtracker.marketdata.dto.PriceResponse;
import com.investtracker.marketdata.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
public class MarketDataController {
    private final MarketDataService marketDataService;
    private final AssetService assetService;
    
    @GetMapping("/asset/{assetId}/price")
    public ResponseEntity<?> getAssetPrice(
        @PathVariable UUID assetId,
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
    
    @GetMapping("/portfolio/{portfolioId}/prices")
    public ResponseEntity<?> getPortfolioPrices(
        @PathVariable UUID portfolioId,
        @RequestParam(defaultValue = "USD") String currency
    ) {
        // This would require getting assets from portfolio transactions
        // For simplicity, returning a placeholder
        return ResponseEntity.ok(new MessageResponse("Use /api/analytics/portfolio/{id}/summary for portfolio prices"));
    }
    
    private record MessageResponse(String message) {}
}

