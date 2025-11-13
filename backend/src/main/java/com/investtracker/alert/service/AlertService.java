package com.investtracker.alert.service;

import com.investtracker.alert.dto.PriceAlertRequest;
import com.investtracker.alert.dto.PriceAlertResponse;
import com.investtracker.alert.entity.PriceAlert;
import com.investtracker.alert.repository.PriceAlertRepository;
import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import com.investtracker.marketdata.service.MarketDataService;
import com.investtracker.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {
    private final PriceAlertRepository alertRepository;
    private final AssetService assetService;
    private final MarketDataService marketDataService;
    
    public List<PriceAlertResponse> getUserAlerts(UUID userId) {
        return alertRepository.findByUserId(userId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    public List<PriceAlertResponse> getActiveAlerts(UUID userId) {
        return alertRepository.findByUserIdAndIsActiveTrue(userId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public PriceAlertResponse createAlert(User user, PriceAlertRequest request) {
        Asset asset = assetService.findById(request.getAssetId())
            .orElseThrow(() -> new IllegalArgumentException("Asset not found"));
        
        PriceAlert alert = new PriceAlert();
        alert.setUser(user);
        alert.setAsset(asset);
        alert.setConditionType(request.getConditionType());
        alert.setTargetPrice(request.getTargetPrice());
        alert.setCurrency(request.getCurrency());
        alert.setIsActive(true);
        
        return toResponse(alertRepository.save(alert));
    }
    
    @Transactional
    public boolean deleteAlert(UUID alertId, UUID userId) {
        if (alertRepository.existsByIdAndUserId(alertId, userId)) {
            alertRepository.deleteById(alertId);
            return true;
        }
        return false;
    }
    
    @Transactional
    public Optional<PriceAlertResponse> toggleAlert(UUID alertId, UUID userId, boolean isActive) {
        return alertRepository.findById(alertId)
            .filter(alert -> alert.getUser().getId().equals(userId))
            .map(alert -> {
                alert.setIsActive(isActive);
                return toResponse(alertRepository.save(alert));
            });
    }
    
    public Optional<PriceAlertResponse> getAlertById(UUID alertId, UUID userId) {
        return alertRepository.findById(alertId)
            .filter(alert -> alert.getUser().getId().equals(userId))
            .map(this::toResponse);
    }
    
    @Transactional
    public Optional<PriceAlertResponse> updateAlert(UUID alertId, UUID userId, com.investtracker.alert.dto.UpdatePriceAlertRequest request) {
        return alertRepository.findById(alertId)
            .filter(alert -> alert.getUser().getId().equals(userId))
            .map(alert -> {
                Asset asset = assetService.findById(request.getAssetId())
                    .orElseThrow(() -> new IllegalArgumentException("Asset not found"));
                
                alert.setAsset(asset);
                alert.setConditionType(request.getConditionType());
                alert.setTargetPrice(request.getTargetPrice());
                alert.setCurrency(request.getCurrency());
                // Reset triggered status if updating
                if (alert.getTriggeredAt() != null) {
                    alert.setTriggeredAt(null);
                    alert.setIsActive(true);
                }
                
                return toResponse(alertRepository.save(alert));
            });
    }
    
    @Transactional
    public List<PriceAlertResponse> createBulkAlerts(User user, List<PriceAlertRequest> requests) {
        return requests.stream()
            .map(request -> createAlert(user, request))
            .collect(Collectors.toList());
    }
    
    public List<PriceAlertResponse> getTriggeredAlerts(UUID userId) {
        return alertRepository.findByUserId(userId)
            .stream()
            .filter(alert -> alert.getTriggeredAt() != null)
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public Optional<PriceAlertResponse> resetAlert(UUID alertId, UUID userId) {
        return alertRepository.findById(alertId)
            .filter(alert -> alert.getUser().getId().equals(userId))
            .filter(alert -> alert.getTriggeredAt() != null)
            .map(alert -> {
                alert.setTriggeredAt(null);
                alert.setIsActive(true);
                return toResponse(alertRepository.save(alert));
            });
    }
    
    // Check alerts periodically (every 5 minutes)
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void checkAlerts() {
        List<PriceAlert> activeAlerts = alertRepository.findByIsActiveTrue();
        
        for (PriceAlert alert : activeAlerts) {
            if (alert.getTriggeredAt() != null) {
                continue; // Already triggered
            }
            
            Optional<BigDecimal> currentPrice = marketDataService.getCurrentPrice(
                alert.getAsset(), 
                alert.getCurrency()
            );
            
            if (currentPrice.isPresent()) {
                boolean triggered = false;
                if (alert.getConditionType() == PriceAlert.ConditionType.BELOW) {
                    triggered = currentPrice.get().compareTo(alert.getTargetPrice()) < 0;
                } else if (alert.getConditionType() == PriceAlert.ConditionType.ABOVE) {
                    triggered = currentPrice.get().compareTo(alert.getTargetPrice()) > 0;
                }
                
                if (triggered) {
                    alert.setTriggeredAt(LocalDateTime.now());
                    alert.setIsActive(false);
                    alertRepository.save(alert);
                    
                    // In production, send notification (email, push, etc.)
                    System.out.println("Alert triggered: " + alert.getAsset().getSymbol() + 
                        " " + alert.getConditionType() + " " + alert.getTargetPrice());
                }
            }
        }
    }
    
    private PriceAlertResponse toResponse(PriceAlert alert) {
        return new PriceAlertResponse(
            alert.getId(),
            alert.getAsset().getId(),
            alert.getAsset().getSymbol(),
            alert.getAsset().getName(),
            alert.getConditionType(),
            alert.getTargetPrice(),
            alert.getCurrency(),
            alert.getIsActive(),
            alert.getTriggeredAt(),
            alert.getCreatedAt()
        );
    }
}

