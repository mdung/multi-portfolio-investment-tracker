package com.investtracker.importexport.service;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.transaction.dto.TransactionRequest;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.service.TransactionService;
import com.investtracker.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImportService {
    private final TransactionService transactionService;
    private final PortfolioService portfolioService;
    private final AssetService assetService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Transactional
    public int importTransactions(MultipartFile file, UUID userId, UUID portfolioId) throws Exception {
        List<TransactionRequest> transactions = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header
                }
                
                if (line.trim().isEmpty()) {
                    continue;
                }
                
                String[] parts = parseCsvLine(line);
                if (parts.length < 6) {
                    continue; // Skip invalid lines
                }
                
                try {
                    TransactionRequest request = new TransactionRequest();
                    
                    // If portfolioId not provided, try to get from CSV or use default
                    if (portfolioId == null && parts.length > 1) {
                        try {
                            portfolioId = UUID.fromString(parts[1]);
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Portfolio ID is required");
                        }
                    }
                    request.setPortfolioId(portfolioId);
                    
                    // Asset symbol (will need to find or create asset)
                    String assetSymbol = parts[2];
                    Asset asset = assetService.searchAssets(assetSymbol).stream()
                        .findFirst()
                        .orElse(null);
                    
                    if (asset == null) {
                        // Create asset if not found (simplified - would need more info)
                        throw new IllegalArgumentException("Asset not found: " + assetSymbol);
                    }
                    request.setAssetId(asset.getId());
                    
                    // Transaction type
                    request.setTransactionType(Transaction.TransactionType.valueOf(parts[4]));
                    
                    // Quantity
                    request.setQuantity(new BigDecimal(parts[5]));
                    
                    // Price
                    request.setPrice(new BigDecimal(parts[6]));
                    
                    // Fee (optional)
                    if (parts.length > 7) {
                        request.setFee(new BigDecimal(parts[7]));
                    }
                    
                    // Date
                    if (parts.length > 9) {
                        request.setTransactionDate(LocalDateTime.parse(parts[9], DATE_FORMATTER));
                    } else {
                        request.setTransactionDate(LocalDateTime.now());
                    }
                    
                    // Notes (optional)
                    if (parts.length > 10) {
                        request.setNotes(parts[10]);
                    }
                    
                    transactions.add(request);
                } catch (Exception e) {
                    // Skip invalid transactions
                    continue;
                }
            }
        }
        
        // Create transactions
        int count = 0;
        for (TransactionRequest request : transactions) {
            try {
                transactionService.createTransaction(userId, request);
                count++;
            } catch (Exception e) {
                // Skip failed transactions
            }
        }
        
        return count;
    }
    
    @Transactional
    public Portfolio importPortfolio(MultipartFile file, User user) throws Exception {
        // Simplified portfolio import - would need proper CSV format
        // For now, create a basic portfolio and import transactions
        com.investtracker.portfolio.dto.PortfolioRequest portfolioRequest = new com.investtracker.portfolio.dto.PortfolioRequest();
        portfolioRequest.setName("Imported Portfolio");
        portfolioRequest.setBaseCurrency("USD");
        
        com.investtracker.portfolio.dto.PortfolioResponse portfolioResponse = portfolioService.createPortfolio(user, portfolioRequest);
        
        // Get the portfolio entity
        Portfolio saved = portfolioService.findById(portfolioResponse.getId())
            .orElseThrow(() -> new IllegalArgumentException("Failed to create portfolio"));
        
        // Import transactions
        importTransactions(file, user.getId(), saved.getId());
        
        return saved;
    }
    
    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentField = new StringBuilder();
        
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(currentField.toString());
                currentField = new StringBuilder();
            } else {
                currentField.append(c);
            }
        }
        fields.add(currentField.toString());
        
        return fields.toArray(new String[0]);
    }
}

