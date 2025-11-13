package com.investtracker.marketdata.provider;

import com.investtracker.asset.entity.Asset;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class CoinGeckoPriceProvider implements PriceProvider {
    private final WebClient webClient;
    private static final String BASE_URL = "https://api.coingecko.com/api/v3";
    
    // Symbol to CoinGecko ID mapping
    private static final Map<String, String> SYMBOL_TO_ID = new HashMap<>();
    
    static {
        SYMBOL_TO_ID.put("BTC", "bitcoin");
        SYMBOL_TO_ID.put("ETH", "ethereum");
        SYMBOL_TO_ID.put("BNB", "binancecoin");
        SYMBOL_TO_ID.put("SOL", "solana");
        SYMBOL_TO_ID.put("ADA", "cardano");
        SYMBOL_TO_ID.put("XRP", "ripple");
        SYMBOL_TO_ID.put("DOGE", "dogecoin");
        SYMBOL_TO_ID.put("DOT", "polkadot");
        SYMBOL_TO_ID.put("MATIC", "matic-network");
        SYMBOL_TO_ID.put("AVAX", "avalanche-2");
    }
    
    public CoinGeckoPriceProvider() {
        this.webClient = WebClient.builder()
            .baseUrl(BASE_URL)
            .build();
    }
    
    @Override
    public Optional<BigDecimal> getPrice(Asset asset, String currency) {
        if (!supports(asset.getAssetType())) {
            return Optional.empty();
        }
        
        String coinId = SYMBOL_TO_ID.getOrDefault(asset.getSymbol().toUpperCase(), 
            asset.getSymbol().toLowerCase());
        String currencyLower = currency.toLowerCase();
        
        try {
            Map<String, Object> response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/simple/price")
                    .queryParam("ids", coinId)
                    .queryParam("vs_currencies", currencyLower)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
                .timeout(Duration.ofSeconds(10))
                .block();
            
            if (response != null && response.containsKey(coinId)) {
                @SuppressWarnings("unchecked")
                Map<String, Object> coinData = (Map<String, Object>) response.get(coinId);
                Object priceObj = coinData.get(currencyLower);
                if (priceObj != null) {
                    BigDecimal price;
                    if (priceObj instanceof Number) {
                        price = BigDecimal.valueOf(((Number) priceObj).doubleValue());
                    } else {
                        price = new BigDecimal(priceObj.toString());
                    }
                    return Optional.of(price);
                }
            }
            
            log.warn("No price data found for {} from CoinGecko", asset.getSymbol());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching price from CoinGecko for {}: {}", asset.getSymbol(), e.getMessage());
            return Optional.empty();
        }
    }
    
    @Override
    public Map<Asset, BigDecimal> getPrices(Iterable<Asset> assets, String currency) {
        Map<Asset, BigDecimal> prices = new HashMap<>();
        // CoinGecko supports batch requests
        StringBuilder ids = new StringBuilder();
        Map<String, Asset> idToAsset = new HashMap<>();
        
        for (Asset asset : assets) {
            String coinId = SYMBOL_TO_ID.getOrDefault(asset.getSymbol().toUpperCase(), 
                asset.getSymbol().toLowerCase());
            if (ids.length() > 0) {
                ids.append(",");
            }
            ids.append(coinId);
            idToAsset.put(coinId, asset);
        }
        
        if (ids.length() == 0) {
            return prices;
        }
        
        try {
            String currencyLower = currency.toLowerCase();
            Map<String, Object> response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/simple/price")
                    .queryParam("ids", ids.toString())
                    .queryParam("vs_currencies", currencyLower)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
                .timeout(Duration.ofSeconds(10))
                .block();
            
            if (response != null) {
                for (Map.Entry<String, Asset> entry : idToAsset.entrySet()) {
                    String coinId = entry.getKey();
                    Asset asset = entry.getValue();
                    if (response.containsKey(coinId)) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> coinData = (Map<String, Object>) response.get(coinId);
                        Object priceObj = coinData.get(currencyLower);
                        if (priceObj != null) {
                            BigDecimal price;
                            if (priceObj instanceof Number) {
                                price = BigDecimal.valueOf(((Number) priceObj).doubleValue());
                            } else {
                                price = new BigDecimal(priceObj.toString());
                            }
                            prices.put(asset, price);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching batch prices from CoinGecko: {}", e.getMessage());
        }
        
        return prices;
    }
    
    @Override
    public boolean supports(Asset.AssetType assetType) {
        return assetType == Asset.AssetType.CRYPTO;
    }
    
    @Override
    public String getName() {
        return "CoinGecko";
    }
}

