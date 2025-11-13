package com.investtracker.transaction.repository;

import com.investtracker.transaction.entity.Transaction;
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
}

