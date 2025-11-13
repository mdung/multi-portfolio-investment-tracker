package com.investtracker.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.investtracker.marketdata.service.MarketDataService;
import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class PriceUpdateWebSocketHandler extends TextWebSocketHandler {
    private final MarketDataService marketDataService;
    private final AssetRepository assetRepository;
    private final ObjectMapper objectMapper;
    private final Map<String, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
        // Subscribe to all price updates by default
        sessions.computeIfAbsent("all", k -> ConcurrentHashMap.newKeySet()).add(session);
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {}", session.getId());
        sessions.values().forEach(set -> set.remove(session));
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("Received WebSocket message: {}", payload);
        
        // Handle subscription messages
        // Format: {"action": "subscribe", "assetIds": ["uuid1", "uuid2"]}
        try {
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String action = (String) data.get("action");
            
            if ("subscribe".equals(action)) {
                @SuppressWarnings("unchecked")
                List<String> assetIds = (List<String>) data.get("assetIds");
                if (assetIds != null) {
                    for (String assetId : assetIds) {
                        sessions.computeIfAbsent(assetId, k -> ConcurrentHashMap.newKeySet()).add(session);
                    }
                }
            } else if ("unsubscribe".equals(action)) {
                @SuppressWarnings("unchecked")
                List<String> assetIds = (List<String>) data.get("assetIds");
                if (assetIds != null) {
                    for (String assetId : assetIds) {
                        Set<WebSocketSession> assetSessions = sessions.get(assetId);
                        if (assetSessions != null) {
                            assetSessions.remove(session);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage());
        }
    }
    
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void broadcastPriceUpdates() {
        if (sessions.isEmpty()) {
            return;
        }
        
        try {
            // Get all assets that have active subscriptions
            Set<UUID> subscribedAssetIds = new HashSet<>();
            for (String key : sessions.keySet()) {
                if (!"all".equals(key) && !sessions.get(key).isEmpty()) {
                    try {
                        subscribedAssetIds.add(UUID.fromString(key));
                    } catch (IllegalArgumentException e) {
                        // Skip invalid UUIDs
                    }
                }
            }
            
            if (subscribedAssetIds.isEmpty() && sessions.get("all") == null) {
                return;
            }
            
            // Fetch prices for subscribed assets
            List<Asset> assets = subscribedAssetIds.isEmpty() 
                ? assetRepository.findAll() 
                : assetRepository.findAllById(subscribedAssetIds);
            
            Map<UUID, BigDecimal> prices = new HashMap<>();
            for (Asset asset : assets) {
                marketDataService.getCurrentPrice(asset, "USD")
                    .ifPresent(price -> prices.put(asset.getId(), price));
            }
            
            // Broadcast to all sessions
            Map<String, Object> update = new HashMap<>();
            update.put("type", "price_update");
            update.put("prices", prices);
            update.put("timestamp", System.currentTimeMillis());
            
            String message = objectMapper.writeValueAsString(update);
            TextMessage textMessage = new TextMessage(message);
            
            for (Set<WebSocketSession> sessionSet : sessions.values()) {
                for (WebSocketSession session : new ArrayList<>(sessionSet)) {
                    if (session.isOpen()) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (IOException e) {
                            log.error("Error sending WebSocket message: {}", e.getMessage());
                            sessionSet.remove(session);
                        }
                    } else {
                        sessionSet.remove(session);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting price updates: {}", e.getMessage());
        }
    }
    
    public void sendPriceUpdate(UUID assetId, BigDecimal price) {
        Map<String, Object> update = new HashMap<>();
        update.put("type", "price_update");
        update.put("assetId", assetId.toString());
        update.put("price", price);
        update.put("timestamp", System.currentTimeMillis());
        
        try {
            String message = objectMapper.writeValueAsString(update);
            TextMessage textMessage = new TextMessage(message);
            
            // Send to specific asset subscribers
            Set<WebSocketSession> assetSessions = sessions.get(assetId.toString());
            if (assetSessions != null) {
                for (WebSocketSession session : new ArrayList<>(assetSessions)) {
                    if (session.isOpen()) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (IOException e) {
                            log.error("Error sending price update: {}", e.getMessage());
                            assetSessions.remove(session);
                        }
                    } else {
                        assetSessions.remove(session);
                    }
                }
            }
            
            // Send to "all" subscribers
            Set<WebSocketSession> allSessions = sessions.get("all");
            if (allSessions != null) {
                for (WebSocketSession session : new ArrayList<>(allSessions)) {
                    if (session.isOpen()) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (IOException e) {
                            log.error("Error sending price update: {}", e.getMessage());
                            allSessions.remove(session);
                        }
                    } else {
                        allSessions.remove(session);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error creating price update message: {}", e.getMessage());
        }
    }
}

