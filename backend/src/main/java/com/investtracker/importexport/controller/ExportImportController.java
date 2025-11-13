package com.investtracker.importexport.controller;

import com.investtracker.importexport.service.ImportService;
import com.investtracker.importexport.service.PortfolioExportService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.security.UserPrincipal;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.service.TransactionExportService;
import com.investtracker.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExportImportController {
    private final TransactionExportService transactionExportService;
    private final TransactionService transactionService;
    private final PortfolioExportService portfolioExportService;
    private final ImportService importService;
    
    @GetMapping("/export/transactions")
    public ResponseEntity<byte[]> exportAllTransactions(
        @RequestParam(required = false) UUID portfolioId,
        @RequestParam(required = false) UUID assetId,
        @RequestParam(required = false) com.investtracker.transaction.entity.Transaction.TransactionType transactionType,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            java.util.List<TransactionResponse> transactions = transactionService.getUserTransactionsForExport(
                userPrincipal.getId(),
                portfolioId,
                assetId,
                transactionType,
                null,
                null
            );
            
            byte[] csvData = transactionExportService.exportToCSV(transactions);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "transactions.csv");
            headers.setContentLength(csvData.length);
            
            return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/export/portfolio/{id}")
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
                // PDF export would require additional library
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
    
    @PostMapping("/import/transactions")
    public ResponseEntity<?> importTransactions(
        @RequestParam("file") MultipartFile file,
        @RequestParam(required = false) UUID portfolioId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("File is empty"));
            }
            
            int count = importService.importTransactions(file, userPrincipal.getId(), portfolioId);
            return ResponseEntity.ok(new MessageResponse("Imported " + count + " transactions successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Import failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/import/portfolio")
    public ResponseEntity<?> importPortfolio(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("File is empty"));
            }
            
            Portfolio portfolio = importService.importPortfolio(file, userPrincipal.getUser());
            com.investtracker.portfolio.dto.PortfolioResponse response = new com.investtracker.portfolio.dto.PortfolioResponse(
                portfolio.getId(),
                portfolio.getName(),
                portfolio.getDescription(),
                portfolio.getBaseCurrency(),
                portfolio.getRiskProfile(),
                portfolio.getCreatedAt(),
                portfolio.getUpdatedAt()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Import failed: " + e.getMessage()));
        }
    }
    
    private record MessageResponse(String message) {}
    private record ErrorResponse(String message) {}
}

