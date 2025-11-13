package com.investtracker.asset.repository;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.entity.Asset.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
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
}

