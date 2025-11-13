package com.investtracker.portfolio.controller;

import com.investtracker.portfolio.dto.PortfolioRequest;
import com.investtracker.portfolio.dto.PortfolioResponse;
import com.investtracker.portfolio.service.PortfolioService;
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
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {
    private final PortfolioService portfolioService;
    
    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getUserPortfolios(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<PortfolioResponse> portfolios = portfolioService.getUserPortfolios(userPrincipal.getId());
        return ResponseEntity.ok(portfolios);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PortfolioResponse> getPortfolio(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return portfolioService.getPortfolio(id, userPrincipal.getId())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PortfolioResponse> createPortfolio(
        @Valid @RequestBody PortfolioRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        PortfolioResponse portfolio = portfolioService.createPortfolio(
            userPrincipal.getUser(),
            request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolio);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PortfolioResponse> updatePortfolio(
        @PathVariable UUID id,
        @Valid @RequestBody PortfolioRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return portfolioService.updatePortfolio(id, userPrincipal.getId(), request)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePortfolio(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        if (portfolioService.deletePortfolio(id, userPrincipal.getId())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

