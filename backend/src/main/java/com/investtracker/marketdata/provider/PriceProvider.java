package com.investtracker.marketdata.provider;

import com.investtracker.asset.entity.Asset;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

public interface PriceProvider {
    /**
     * Get the current price for a single asset
     */
    Optional<BigDecimal> getPrice(Asset asset, String currency);
    
    /**
     * Get prices for multiple assets at once (for efficiency)
     */
    Map<Asset, BigDecimal> getPrices(Iterable<Asset> assets, String currency);
    
    /**
     * Check if this provider supports the given asset type
     */
    boolean supports(Asset.AssetType assetType);
    
    /**
     * Get the provider name for logging/tracking
     */
    String getName();
}

