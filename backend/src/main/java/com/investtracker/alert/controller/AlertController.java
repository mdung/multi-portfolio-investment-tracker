package com.investtracker.alert.controller;

import com.investtracker.alert.dto.PriceAlertRequest;
import com.investtracker.alert.dto.PriceAlertResponse;
import com.investtracker.alert.service.AlertService;
import com.investtracker.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {
    private final AlertService alertService;
    
    @GetMapping
    public ResponseEntity<List<PriceAlertResponse>> getUserAlerts(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<PriceAlertResponse> alerts = alertService.getUserAlerts(userPrincipal.getId());
        return ResponseEntity.ok(alerts);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<PriceAlertResponse>> getActiveAlerts(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<PriceAlertResponse> alerts = alertService.getActiveAlerts(userPrincipal.getId());
        return ResponseEntity.ok(alerts);
    }
    
    @PostMapping
    public ResponseEntity<?> createAlert(
        @Valid @RequestBody PriceAlertRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            PriceAlertResponse alert = alertService.createAlert(
                userPrincipal.getUser(),
                request
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(alert);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        if (alertService.deleteAlert(id, userPrincipal.getId())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/toggle")
    public ResponseEntity<PriceAlertResponse> toggleAlert(
        @PathVariable UUID id,
        @RequestParam boolean active,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return alertService.toggleAlert(id, userPrincipal.getId(), active)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PriceAlertResponse> getAlert(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return alertService.getAlertById(id, userPrincipal.getId())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAlert(
        @PathVariable UUID id,
        @Valid @RequestBody com.investtracker.alert.dto.UpdatePriceAlertRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return alertService.updateAlert(id, userPrincipal.getId(), request)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<?> createBulkAlerts(
        @Valid @RequestBody com.investtracker.alert.dto.BulkAlertRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<PriceAlertResponse> alerts = alertService.createBulkAlerts(
                userPrincipal.getUser(),
                request.getAlerts()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(alerts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/triggered")
    public ResponseEntity<List<PriceAlertResponse>> getTriggeredAlerts(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<PriceAlertResponse> alerts = alertService.getTriggeredAlerts(userPrincipal.getId());
        return ResponseEntity.ok(alerts);
    }
    
    @PostMapping("/{id}/reset")
    public ResponseEntity<PriceAlertResponse> resetAlert(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return alertService.resetAlert(id, userPrincipal.getId())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    private record ErrorResponse(String message) {}
}

