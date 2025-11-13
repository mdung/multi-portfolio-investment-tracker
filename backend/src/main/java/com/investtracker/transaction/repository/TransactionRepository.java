package com.investtracker.transaction.repository;

import com.investtracker.transaction.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByPortfolioIdOrderByTransactionDateDesc(UUID portfolioId);
    
    @Query("SELECT t FROM Transaction t WHERE t.portfolio.id = :portfolioId AND t.asset.id = :assetId ORDER BY t.transactionDate ASC")
    List<Transaction> findByPortfolioIdAndAssetId(@Param("portfolioId") UUID portfolioId, @Param("assetId") UUID assetId);
    
    @Query("SELECT t FROM Transaction t WHERE t.portfolio.id = :portfolioId AND t.transactionDate BETWEEN :startDate AND :endDate ORDER BY t.transactionDate DESC")
    List<Transaction> findByPortfolioIdAndDateRange(
        @Param("portfolioId") UUID portfolioId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT t FROM Transaction t WHERE t.portfolio.user.id = :userId " +
           "AND (:portfolioId IS NULL OR t.portfolio.id = :portfolioId) " +
           "AND (:assetId IS NULL OR t.asset.id = :assetId) " +
           "AND (:transactionType IS NULL OR t.transactionType = :transactionType) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate) " +
           "ORDER BY t.transactionDate DESC")
    Page<Transaction> findUserTransactionsWithFilters(
        @Param("userId") UUID userId,
        @Param("portfolioId") UUID portfolioId,
        @Param("assetId") UUID assetId,
        @Param("transactionType") Transaction.TransactionType transactionType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    @Query("SELECT t FROM Transaction t WHERE t.portfolio.user.id = :userId " +
           "AND (:portfolioId IS NULL OR t.portfolio.id = :portfolioId) " +
           "AND (:assetId IS NULL OR t.asset.id = :assetId) " +
           "AND (:transactionType IS NULL OR t.transactionType = :transactionType) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate) " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findUserTransactionsWithFiltersList(
        @Param("userId") UUID userId,
        @Param("portfolioId") UUID portfolioId,
        @Param("assetId") UUID assetId,
        @Param("transactionType") Transaction.TransactionType transactionType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT t FROM Transaction t WHERE t.id = :id AND t.portfolio.user.id = :userId")
    java.util.Optional<Transaction> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
}

