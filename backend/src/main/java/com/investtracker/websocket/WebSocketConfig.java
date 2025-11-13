package com.investtracker.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final PriceUpdateWebSocketHandler priceUpdateWebSocketHandler;
    
    public WebSocketConfig(PriceUpdateWebSocketHandler priceUpdateWebSocketHandler) {
        this.priceUpdateWebSocketHandler = priceUpdateWebSocketHandler;
    }
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(priceUpdateWebSocketHandler, "/ws/prices")
            .setAllowedOrigins("*"); // In production, specify allowed origins
    }
}

