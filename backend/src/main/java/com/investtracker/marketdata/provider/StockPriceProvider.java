package com.investtracker.marketdata.provider;

import com.investtracker.asset.entity.Asset;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Component
public class StockPriceProvider implements PriceProvider {
    private final Random random = new Random();
    
    // Mock price data - in production, integrate with real API (Alpha Vantage, Yahoo Finance, etc.)
    private static final Map<String, BigDecimal> MOCK_PRICES = new HashMap<>();
    
    static {
        MOCK_PRICES.put("AAPL", new BigDecimal("175.50"));
        MOCK_PRICES.put("GOOGL", new BigDecimal("142.30"));
        MOCK_PRICES.put("MSFT", new BigDecimal("378.90"));
        MOCK_PRICES.put("TSLA", new BigDecimal("248.50"));
        MOCK_PRICES.put("AMZN", new BigDecimal("151.20"));
    }
    
    @Override
    public Optional<BigDecimal> getPrice(Asset asset, String currency) {
        if (!supports(asset.getAssetType())) {
            return Optional.empty();
        }
        
        // Mock implementation - add some randomness
        BigDecimal basePrice = MOCK_PRICES.getOrDefault(asset.getSymbol().toUpperCase(), 
            new BigDecimal(100 + random.nextInt(500)));
        
        // Add small random variation
        double variation = 0.95 + (random.nextDouble() * 0.1); // ±5% variation
        BigDecimal price = basePrice.multiply(BigDecimal.valueOf(variation))
            .setScale(2, RoundingMode.HALF_UP);
        
        return Optional.of(price);
    }
    
    @Override
    public Map<Asset, BigDecimal> getPrices(Iterable<Asset> assets, String currency) {
        Map<Asset, BigDecimal> prices = new HashMap<>();
        for (Asset asset : assets) {
            if (supports(asset.getAssetType())) {
                getPrice(asset, currency).ifPresent(price -> prices.put(asset, price));
            }
        }
        return prices;
    }
    
    @Override
    public boolean supports(Asset.AssetType assetType) {
        return assetType == Asset.AssetType.STOCK;
    }
    
    @Override
    public String getName() {
        return "StockPriceProvider";
    }
}

