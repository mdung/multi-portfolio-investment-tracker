package com.investtracker.transaction.controller;

import com.investtracker.transaction.dto.TransactionRequest;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.dto.UpdateTransactionRequest;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.service.TransactionExportService;
import com.investtracker.transaction.service.TransactionService;
import com.investtracker.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    private final TransactionExportService exportService;
    
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
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getTransaction(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            TransactionResponse transaction = transactionService.getTransactionById(id, userPrincipal.getId());
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransaction(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateTransactionRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            TransactionResponse transaction = transactionService.updateTransaction(
                id,
                userPrincipal.getId(),
                request
            );
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            transactionService.deleteTransaction(id, userPrincipal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getUserTransactions(
        @RequestParam(required = false) UUID portfolioId,
        @RequestParam(required = false) UUID assetId,
        @RequestParam(required = false) Transaction.TransactionType transactionType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TransactionResponse> transactions = transactionService.getUserTransactions(
            userPrincipal.getId(),
            portfolioId,
            assetId,
            transactionType,
            startDate,
            endDate,
            pageable
        );
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTransactions(
        @RequestParam(required = false) UUID portfolioId,
        @RequestParam(required = false) UUID assetId,
        @RequestParam(required = false) Transaction.TransactionType transactionType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            List<TransactionResponse> transactions = transactionService.getUserTransactionsForExport(
                userPrincipal.getId(),
                portfolioId,
                assetId,
                transactionType,
                startDate,
                endDate
            );
            
            byte[] csvData = exportService.exportToCSV(transactions);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "transactions.csv");
            headers.setContentLength(csvData.length);
            
            return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private record ErrorResponse(String message) {}
}

