package com.investtracker.analytics.repository;

import com.investtracker.analytics.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, UUID> {
    @Query("SELECT p FROM PortfolioSnapshot p WHERE p.portfolio.id = :portfolioId ORDER BY p.snapshotDate DESC")
    List<PortfolioSnapshot> findByPortfolioIdOrderByDateDesc(@Param("portfolioId") UUID portfolioId);
    
    @Query("SELECT p FROM PortfolioSnapshot p WHERE p.portfolio.id = :portfolioId " +
           "AND p.snapshotDate BETWEEN :startDate AND :endDate ORDER BY p.snapshotDate ASC")
    List<PortfolioSnapshot> findByPortfolioIdAndDateRange(
        @Param("portfolioId") UUID portfolioId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT p FROM PortfolioSnapshot p WHERE p.portfolio.id = :portfolioId " +
           "AND DATE(p.snapshotDate) = DATE(:date) ORDER BY p.snapshotDate DESC")
    List<PortfolioSnapshot> findByPortfolioIdAndDate(
        @Param("portfolioId") UUID portfolioId,
        @Param("date") LocalDateTime date
    );
}

