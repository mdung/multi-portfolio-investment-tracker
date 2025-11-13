package com.investtracker.portfolio.controller;

import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.importexport.service.PortfolioExportService;
import com.investtracker.portfolio.dto.DuplicatePortfolioRequest;
import com.investtracker.portfolio.dto.PortfolioRequest;
import com.investtracker.portfolio.dto.PortfolioResponse;
import com.investtracker.portfolio.dto.RebalanceRequest;
import com.investtracker.portfolio.dto.RebalanceSuggestion;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.portfolio.service.RebalanceService;
import com.investtracker.security.UserPrincipal;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    private final AnalyticsService analyticsService;
    private final PortfolioExportService portfolioExportService;
    private final TransactionService transactionService;
    private final RebalanceService rebalanceService;
    
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
    
    @PostMapping("/{id}/snapshot")
    public ResponseEntity<?> createPortfolioSnapshot(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            PortfolioSummaryResponse summary = analyticsService.getPortfolioSummary(id, userPrincipal.getId());
            com.investtracker.portfolio.entity.Portfolio portfolio = portfolioService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
            
            analyticsService.createSnapshot(portfolio, summary);
            return ResponseEntity.ok(new MessageResponse("Portfolio snapshot created successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<?> duplicatePortfolio(
        @PathVariable UUID id,
        @RequestBody(required = false) DuplicatePortfolioRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            String newName = request != null ? request.getName() : null;
            boolean copyTransactions = request != null && Boolean.TRUE.equals(request.getCopyTransactions());
            
            PortfolioResponse duplicate = portfolioService.duplicatePortfolio(
                id,
                userPrincipal.getId(),
                newName,
                copyTransactions
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(duplicate);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportPortfolio(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "csv") String format,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            byte[] data;
            String filename;
            String contentType;
            
            if ("csv".equalsIgnoreCase(format)) {
                data = portfolioExportService.exportPortfolioToCSV(id, userPrincipal.getId());
                filename = "portfolio_" + id + ".csv";
                contentType = "text/csv";
            } else {
                // PDF export would require additional library (e.g., iText)
                return ResponseEntity.badRequest().build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(data.length);
            
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<TransactionResponse>> getPortfolioTransactions(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<TransactionResponse> transactions = transactionService.getPortfolioTransactions(
                id,
                userPrincipal.getId()
            );
            return ResponseEntity.ok(transactions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{id}/rebalance")
    public ResponseEntity<?> getRebalanceSuggestions(
        @PathVariable UUID id,
        @Valid @RequestBody RebalanceRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<RebalanceSuggestion> suggestions = rebalanceService.calculateRebalanceSuggestions(
                id,
                userPrincipal.getId(),
                request.getTargetAllocations()
            );
            return ResponseEntity.ok(suggestions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    private record MessageResponse(String message) {}
    private record ErrorResponse(String message) {}
}

