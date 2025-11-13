package com.investtracker.marketdata.service;

import com.investtracker.asset.entity.Asset;
import com.investtracker.marketdata.entity.PriceSnapshot;
import com.investtracker.marketdata.provider.PriceProvider;
import com.investtracker.marketdata.repository.PriceSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class MarketDataService {
    private final List<PriceProvider> priceProviders;
    private final PriceSnapshotRepository priceSnapshotRepository;
    
    // In-memory cache (TTL: 5 minutes)
    private final Map<String, CachedPrice> priceCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    
    public Optional<BigDecimal> getCurrentPrice(Asset asset, String currency) {
        String cacheKey = asset.getId().toString() + ":" + currency;
        CachedPrice cached = priceCache.get(cacheKey);
        
        if (cached != null && !cached.isExpired()) {
            return Optional.of(cached.price);
        }
        
        for (PriceProvider provider : priceProviders) {
            if (provider.supports(asset.getAssetType())) {
                Optional<BigDecimal> price = provider.getPrice(asset, currency);
                if (price.isPresent()) {
                    // Cache the price
                    priceCache.put(cacheKey, new CachedPrice(price.get(), System.currentTimeMillis()));
                    
                    // Save to database for historical tracking
                    savePriceSnapshot(asset, price.get(), currency, provider.getName());
                    
                    return price;
                }
            }
        }
        
        return Optional.empty();
    }
    
    public Map<Asset, BigDecimal> getCurrentPrices(Collection<Asset> assets, String currency) {
        Map<Asset, BigDecimal> prices = new HashMap<>();
        List<Asset> uncachedAssets = new ArrayList<>();
        
        // Check cache first
        for (Asset asset : assets) {
            String cacheKey = asset.getId().toString() + ":" + currency;
            CachedPrice cached = priceCache.get(cacheKey);
            if (cached != null && !cached.isExpired()) {
                prices.put(asset, cached.price);
            } else {
                uncachedAssets.add(asset);
            }
        }
        
        // Fetch uncached prices
        if (!uncachedAssets.isEmpty()) {
            Map<Asset, BigDecimal> fetchedPrices = fetchPricesFromProviders(uncachedAssets, currency);
            prices.putAll(fetchedPrices);
        }
        
        return prices;
    }
    
    private Map<Asset, BigDecimal> fetchPricesFromProviders(Collection<Asset> assets, String currency) {
        Map<Asset, BigDecimal> prices = new HashMap<>();
        Map<Asset.AssetType, PriceProvider> providerMap = new HashMap<>();
        
        // Group assets by type and get appropriate provider
        for (PriceProvider provider : priceProviders) {
            for (Asset.AssetType type : Asset.AssetType.values()) {
                if (provider.supports(type)) {
                    providerMap.put(type, provider);
                }
            }
        }
        
        // Fetch prices
        for (Asset asset : assets) {
            PriceProvider provider = providerMap.get(asset.getAssetType());
            if (provider != null) {
                provider.getPrice(asset, currency).ifPresent(price -> {
                    prices.put(asset, price);
                    String cacheKey = asset.getId().toString() + ":" + currency;
                    priceCache.put(cacheKey, new CachedPrice(price, System.currentTimeMillis()));
                    savePriceSnapshot(asset, price, currency, provider.getName());
                });
            }
        }
        
        return prices;
    }
    
    @Transactional
    public void savePriceSnapshot(Asset asset, BigDecimal price, String currency, String source) {
        PriceSnapshot snapshot = new PriceSnapshot();
        snapshot.setAsset(asset);
        snapshot.setPrice(price);
        snapshot.setCurrency(currency);
        snapshot.setSource(source);
        snapshot.setSnapshotDate(LocalDateTime.now());
        priceSnapshotRepository.save(snapshot);
    }
    
    public void clearCache() {
        priceCache.clear();
    }
    
    public Map<UUID, BigDecimal> getBulkPrices(List<UUID> assetIds, String currency) {
        // This would need AssetService to get assets by IDs
        // For now, return empty map - will be implemented in controller
        return new HashMap<>();
    }
    
    public List<PriceSnapshot> getHistoricalPrices(UUID assetId, LocalDateTime startDate, LocalDateTime endDate) {
        return priceSnapshotRepository.findByAssetIdAndDateRange(assetId, startDate, endDate);
    }
    
    public void refreshPortfolioPrices(UUID portfolioId) {
        // This would need to get all assets in portfolio and refresh their prices
        // Implementation would be in controller/service that has access to portfolio
        clearCache();
    }
    
    private static class CachedPrice {
        final BigDecimal price;
        final long timestamp;
        
        CachedPrice(BigDecimal price, long timestamp) {
            this.price = price;
            this.timestamp = timestamp;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
}

