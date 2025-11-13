package com.investtracker.transaction.controller;

import com.investtracker.transaction.dto.TransactionRequest;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.service.TransactionService;
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
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    
    @PostMapping
    public ResponseEntity<?> createTransaction(
        @Valid @RequestBody TransactionRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            TransactionResponse transaction = transactionService.createTransaction(
                userPrincipal.getId(),
                request
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}")
    public ResponseEntity<List<TransactionResponse>> getPortfolioTransactions(
        @PathVariable UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<TransactionResponse> transactions = transactionService.getPortfolioTransactions(
                portfolioId,
                userPrincipal.getId()
            );
            return ResponseEntity.ok(transactions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    private record ErrorResponse(String message) {}
}

