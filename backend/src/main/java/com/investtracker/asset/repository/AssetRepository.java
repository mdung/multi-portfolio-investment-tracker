package com.investtracker.asset.repository;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.entity.Asset.AssetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Optional<Asset> findByAssetTypeAndSymbolAndExchangeAndNetwork(
        AssetType assetType, String symbol, String exchange, String network
    );
    List<Asset> findBySymbolContainingIgnoreCase(String symbol);
    List<Asset> findByAssetType(AssetType assetType);
    
    @Query("SELECT a FROM Asset a WHERE " +
           "(:assetType IS NULL OR a.assetType = :assetType) " +
           "AND (:symbol IS NULL OR LOWER(a.symbol) LIKE LOWER(CONCAT('%', :symbol, '%')))")
    Page<Asset> findAssetsWithFilters(
        @Param("assetType") AssetType assetType,
        @Param("symbol") String symbol,
        Pageable pageable
    );
    
    @Query("SELECT a, COUNT(t.id) as transactionCount FROM Asset a " +
           "LEFT JOIN Transaction t ON t.asset.id = a.id " +
           "GROUP BY a.id " +
           "ORDER BY transactionCount DESC")
    Page<Object[]> findPopularAssets(Pageable pageable);
}

