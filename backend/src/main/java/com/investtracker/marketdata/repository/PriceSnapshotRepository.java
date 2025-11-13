package com.investtracker.marketdata.repository;

import com.investtracker.marketdata.entity.PriceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PriceSnapshotRepository extends JpaRepository<PriceSnapshot, UUID> {
    @Query("SELECT p FROM PriceSnapshot p WHERE p.asset.id = :assetId ORDER BY p.snapshotDate DESC")
    List<PriceSnapshot> findByAssetIdOrderByDateDesc(@Param("assetId") UUID assetId);
    
    Optional<PriceSnapshot> findFirstByAssetIdOrderBySnapshotDateDesc(UUID assetId);
    
    @Query("SELECT p FROM PriceSnapshot p WHERE p.asset.id = :assetId AND p.snapshotDate BETWEEN :startDate AND :endDate ORDER BY p.snapshotDate ASC")
    List<PriceSnapshot> findByAssetIdAndDateRange(
        @Param("assetId") UUID assetId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}

