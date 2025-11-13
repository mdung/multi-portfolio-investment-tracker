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
public class CryptoPriceProvider implements PriceProvider {
    private final Random random = new Random();
    
    // Mock price data - in production, integrate with CoinGecko, CoinMarketCap, etc.
    private static final Map<String, BigDecimal> MOCK_PRICES = new HashMap<>();
    
    static {
        MOCK_PRICES.put("BTC", new BigDecimal("43500.00"));
        MOCK_PRICES.put("ETH", new BigDecimal("2650.00"));
        MOCK_PRICES.put("BNB", new BigDecimal("315.00"));
        MOCK_PRICES.put("SOL", new BigDecimal("98.50"));
        MOCK_PRICES.put("ADA", new BigDecimal("0.52"));
    }
    
    @Override
    public Optional<BigDecimal> getPrice(Asset asset, String currency) {
        if (!supports(asset.getAssetType())) {
            return Optional.empty();
        }
        
        // Mock implementation - add some randomness
        BigDecimal basePrice = MOCK_PRICES.getOrDefault(asset.getSymbol().toUpperCase(), 
            new BigDecimal(1 + random.nextInt(1000)));
        
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
        return assetType == Asset.AssetType.CRYPTO;
    }
    
    @Override
    public String getName() {
        return "CryptoPriceProvider";
    }
}

