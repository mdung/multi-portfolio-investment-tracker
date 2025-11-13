package com.investtracker.marketdata.provider;

import com.investtracker.asset.entity.Asset;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
public class AlphaVantagePriceProvider implements PriceProvider {
    private final WebClient webClient;
    private final String apiKey;
    private static final String BASE_URL = "https://www.alphavantage.co/query";
    
    public AlphaVantagePriceProvider(@Value("${alphavantage.api.key:demo}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder()
            .baseUrl(BASE_URL)
            .build();
    }
    
    @Override
    public Optional<BigDecimal> getPrice(Asset asset, String currency) {
        if (!supports(asset.getAssetType())) {
            return Optional.empty();
        }
        
        try {
            Map<String, Object> response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .queryParam("function", "GLOBAL_QUOTE")
                    .queryParam("symbol", asset.getSymbol())
                    .queryParam("apikey", apiKey)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
                .timeout(Duration.ofSeconds(10))
                .block();
            
            if (response != null && response.containsKey("Global Quote")) {
                @SuppressWarnings("unchecked")
                Map<String, String> quote = (Map<String, String>) response.get("Global Quote");
                String priceStr = quote.get("05. price");
                if (priceStr != null && !priceStr.isEmpty()) {
                    return Optional.of(new BigDecimal(priceStr));
                }
            }
            
            log.warn("No price data found for {} from Alpha Vantage", asset.getSymbol());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching price from Alpha Vantage for {}: {}", asset.getSymbol(), e.getMessage());
            return Optional.empty();
        }
    }
    
    @Override
    public Map<Asset, BigDecimal> getPrices(Iterable<Asset> assets, String currency) {
        Map<Asset, BigDecimal> prices = new HashMap<>();
        // Alpha Vantage has rate limits, so we fetch one at a time
        // In production, consider batching or using premium API
        for (Asset asset : assets) {
            getPrice(asset, currency).ifPresent(price -> prices.put(asset, price));
            // Add delay to respect rate limits (5 calls per minute for free tier)
            try {
                Thread.sleep(12000); // 12 seconds between calls
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
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
        return "AlphaVantage";
    }
}

