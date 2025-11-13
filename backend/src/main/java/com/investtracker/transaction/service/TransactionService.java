package com.investtracker.transaction.service;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.service.PortfolioService;
import com.investtracker.transaction.dto.TransactionRequest;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.dto.UpdateTransactionRequest;
import com.investtracker.transaction.entity.Transaction;
import com.investtracker.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final PortfolioService portfolioService;
    private final AssetService assetService;
    
    public List<TransactionResponse> getPortfolioTransactions(UUID portfolioId, UUID userId) {
        if (!portfolioService.isOwner(portfolioId, userId)) {
            throw new IllegalArgumentException("Portfolio not found or access denied");
        }
        
        return transactionRepository.findByPortfolioIdOrderByTransactionDateDesc(portfolioId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public TransactionResponse createTransaction(UUID userId, TransactionRequest request) {
        // Validate portfolio ownership
        Portfolio portfolio = portfolioService.findById(request.getPortfolioId())
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Portfolio access denied");
        }
        
        // Get asset
        Asset asset = assetService.findById(request.getAssetId())
            .orElseThrow(() -> new IllegalArgumentException("Asset not found"));
        
        // Handle transfer transactions
        Portfolio transferPortfolio = null;
        if (request.getTransferPortfolioId() != null) {
            transferPortfolio = portfolioService.findById(request.getTransferPortfolioId())
                .orElseThrow(() -> new IllegalArgumentException("Transfer portfolio not found"));
            
            if (!transferPortfolio.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException("Transfer portfolio access denied");
            }
        }
        
        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setPortfolio(portfolio);
        transaction.setAsset(asset);
        transaction.setTransactionType(request.getTransactionType());
        transaction.setQuantity(request.getQuantity());
        transaction.setPrice(request.getPrice());
        transaction.setFee(request.getFee() != null ? request.getFee() : java.math.BigDecimal.ZERO);
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setNotes(request.getNotes());
        transaction.setTransferPortfolio(transferPortfolio);
        
        Transaction saved = transactionRepository.save(transaction);
        
        // If transfer, create corresponding transaction in other portfolio
        if (request.getTransactionType() == Transaction.TransactionType.TRANSFER_OUT && transferPortfolio != null) {
            Transaction transferIn = new Transaction();
            transferIn.setPortfolio(transferPortfolio);
            transferIn.setAsset(asset);
            transferIn.setTransactionType(Transaction.TransactionType.TRANSFER_IN);
            transferIn.setQuantity(request.getQuantity());
            transferIn.setPrice(request.getPrice());
            transferIn.setFee(java.math.BigDecimal.ZERO);
            transferIn.setTransactionDate(request.getTransactionDate());
            transferIn.setNotes("Transfer from " + portfolio.getName());
            transferIn.setTransferPortfolio(portfolio);
            transactionRepository.save(transferIn);
        }
        
        return toResponse(saved);
    }
    
    public List<Transaction> getTransactionsByPortfolioAndAsset(UUID portfolioId, UUID assetId) {
        return transactionRepository.findByPortfolioIdAndAssetId(portfolioId, assetId);
    }
    
    public TransactionResponse getTransactionById(UUID transactionId, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found or access denied"));
        return toResponse(transaction);
    }
    
    @Transactional
    public TransactionResponse updateTransaction(UUID transactionId, UUID userId, UpdateTransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found or access denied"));
        
        // Validate portfolio ownership (should already be validated, but double-check)
        if (!transaction.getPortfolio().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Access denied");
        }
        
        // Get asset
        Asset asset = assetService.findById(request.getAssetId())
            .orElseThrow(() -> new IllegalArgumentException("Asset not found"));
        
        // Handle transfer portfolio
        Portfolio transferPortfolio = null;
        if (request.getTransferPortfolioId() != null) {
            transferPortfolio = portfolioService.findById(request.getTransferPortfolioId())
                .orElseThrow(() -> new IllegalArgumentException("Transfer portfolio not found"));
            
            if (!transferPortfolio.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException("Transfer portfolio access denied");
            }
        }
        
        // Update transaction
        transaction.setAsset(asset);
        transaction.setTransactionType(request.getTransactionType());
        transaction.setQuantity(request.getQuantity());
        transaction.setPrice(request.getPrice());
        transaction.setFee(request.getFee() != null ? request.getFee() : java.math.BigDecimal.ZERO);
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setNotes(request.getNotes());
        transaction.setTransferPortfolio(transferPortfolio);
        
        Transaction saved = transactionRepository.save(transaction);
        
        // If this is a transfer, update the corresponding transaction
        if (request.getTransactionType() == Transaction.TransactionType.TRANSFER_OUT && transferPortfolio != null) {
            // Find and update the corresponding TRANSFER_IN transaction
            List<Transaction> transferInTransactions = transactionRepository.findByPortfolioIdAndAssetId(
                transferPortfolio.getId(), asset.getId()
            );
            transferInTransactions.stream()
                .filter(t -> t.getTransactionType() == Transaction.TransactionType.TRANSFER_IN)
                .filter(t -> t.getTransferPortfolio() != null && t.getTransferPortfolio().getId().equals(transaction.getPortfolio().getId()))
                .findFirst()
                .ifPresent(transferIn -> {
                    transferIn.setQuantity(request.getQuantity());
                    transferIn.setPrice(request.getPrice());
                    transferIn.setTransactionDate(request.getTransactionDate());
                    transferIn.setNotes("Transfer from " + transaction.getPortfolio().getName());
                    transactionRepository.save(transferIn);
                });
        }
        
        return toResponse(saved);
    }
    
    @Transactional
    public void deleteTransaction(UUID transactionId, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found or access denied"));
        
        // If this is a transfer, also delete the corresponding transaction
        if (transaction.getTransactionType() == Transaction.TransactionType.TRANSFER_OUT && 
            transaction.getTransferPortfolio() != null) {
            List<Transaction> transferInTransactions = transactionRepository.findByPortfolioIdAndAssetId(
                transaction.getTransferPortfolio().getId(), transaction.getAsset().getId()
            );
            transferInTransactions.stream()
                .filter(t -> t.getTransactionType() == Transaction.TransactionType.TRANSFER_IN)
                .filter(t -> t.getTransferPortfolio() != null && t.getTransferPortfolio().getId().equals(transaction.getPortfolio().getId()))
                .findFirst()
                .ifPresent(transactionRepository::delete);
        } else if (transaction.getTransactionType() == Transaction.TransactionType.TRANSFER_IN &&
                   transaction.getTransferPortfolio() != null) {
            // If deleting TRANSFER_IN, also delete the corresponding TRANSFER_OUT
            List<Transaction> transferOutTransactions = transactionRepository.findByPortfolioIdAndAssetId(
                transaction.getTransferPortfolio().getId(), transaction.getAsset().getId()
            );
            transferOutTransactions.stream()
                .filter(t -> t.getTransactionType() == Transaction.TransactionType.TRANSFER_OUT)
                .filter(t -> t.getTransferPortfolio() != null && t.getTransferPortfolio().getId().equals(transaction.getPortfolio().getId()))
                .findFirst()
                .ifPresent(transactionRepository::delete);
        }
        
        transactionRepository.delete(transaction);
    }
    
    public Page<TransactionResponse> getUserTransactions(
        UUID userId,
        UUID portfolioId,
        UUID assetId,
        Transaction.TransactionType transactionType,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Pageable pageable
    ) {
        Page<Transaction> transactions = transactionRepository.findUserTransactionsWithFilters(
            userId, portfolioId, assetId, transactionType, startDate, endDate, pageable
        );
        return transactions.map(this::toResponse);
    }
    
    public List<TransactionResponse> getUserTransactionsForExport(
        UUID userId,
        UUID portfolioId,
        UUID assetId,
        Transaction.TransactionType transactionType,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {
        List<Transaction> transactions = transactionRepository.findUserTransactionsWithFiltersList(
            userId, portfolioId, assetId, transactionType, startDate, endDate
        );
        return transactions.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
            transaction.getId(),
            transaction.getPortfolio().getId(),
            transaction.getAsset().getId(),
            transaction.getAsset().getSymbol(),
            transaction.getAsset().getName(),
            transaction.getTransactionType(),
            transaction.getQuantity(),
            transaction.getPrice(),
            transaction.getFee(),
            transaction.getTransactionDate(),
            transaction.getNotes(),
            transaction.getTransferPortfolio() != null ? transaction.getTransferPortfolio().getId() : null,
            transaction.getCreatedAt()
        );
    }
}

