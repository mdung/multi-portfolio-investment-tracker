package com.investtracker.asset.service;

import com.investtracker.asset.dto.AssetRequest;
import com.investtracker.asset.dto.AssetResponse;
import com.investtracker.asset.dto.PopularAssetResponse;
import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository assetRepository;
    
    public Optional<Asset> findById(UUID id) {
        return assetRepository.findById(id);
    }
    
    public List<Asset> searchAssets(String symbol) {
        return assetRepository.findBySymbolContainingIgnoreCase(symbol);
    }
    
    public List<Asset> findByType(Asset.AssetType assetType) {
        return assetRepository.findByAssetType(assetType);
    }
    
    @Transactional
    public Asset getOrCreateAsset(Asset.AssetType assetType, String symbol, String name, 
                                  String exchange, String network, String currency) {
        // Try to find existing asset
        Optional<Asset> existing = assetRepository.findByAssetTypeAndSymbolAndExchangeAndNetwork(
            assetType, symbol, exchange, network
        );
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create new asset
        Asset asset = new Asset();
        asset.setAssetType(assetType);
        asset.setSymbol(symbol.toUpperCase());
        asset.setName(name);
        asset.setExchange(exchange);
        asset.setNetwork(network);
        asset.setCurrency(currency);
        
        return assetRepository.save(asset);
    }
    
    @Transactional
    public AssetResponse createAsset(AssetRequest request) {
        // Check if asset already exists
        Optional<Asset> existing = assetRepository.findByAssetTypeAndSymbolAndExchangeAndNetwork(
            request.getAssetType(),
            request.getSymbol(),
            request.getExchange(),
            request.getNetwork()
        );
        
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Asset already exists");
        }
        
        Asset asset = new Asset();
        asset.setAssetType(request.getAssetType());
        asset.setSymbol(request.getSymbol().toUpperCase());
        asset.setName(request.getName());
        asset.setExchange(request.getExchange());
        asset.setNetwork(request.getNetwork());
        asset.setCurrency(request.getCurrency());
        
        Asset saved = assetRepository.save(asset);
        return toResponse(saved);
    }
    
    @Transactional
    public AssetResponse updateAsset(UUID assetId, AssetRequest request) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found"));
        
        // Check if updating to a symbol that already exists (excluding current asset)
        Optional<Asset> existing = assetRepository.findByAssetTypeAndSymbolAndExchangeAndNetwork(
            request.getAssetType(),
            request.getSymbol(),
            request.getExchange(),
            request.getNetwork()
        );
        
        if (existing.isPresent() && !existing.get().getId().equals(assetId)) {
            throw new IllegalArgumentException("Asset with these details already exists");
        }
        
        asset.setAssetType(request.getAssetType());
        asset.setSymbol(request.getSymbol().toUpperCase());
        asset.setName(request.getName());
        asset.setExchange(request.getExchange());
        asset.setNetwork(request.getNetwork());
        asset.setCurrency(request.getCurrency());
        
        Asset saved = assetRepository.save(asset);
        return toResponse(saved);
    }
    
    public Page<AssetResponse> getAssets(Asset.AssetType assetType, String symbol, Pageable pageable) {
        Page<Asset> assets = assetRepository.findAssetsWithFilters(assetType, symbol, pageable);
        return assets.map(this::toResponse);
    }
    
    public Page<PopularAssetResponse> getPopularAssets(Pageable pageable) {
        Page<Object[]> results = assetRepository.findPopularAssets(pageable);
        return results.map(result -> {
            Asset asset = (Asset) result[0];
            Long count = ((Number) result[1]).longValue();
            return new PopularAssetResponse(toResponse(asset), count);
        });
    }
    
    private AssetResponse toResponse(Asset asset) {
        return new AssetResponse(
            asset.getId(),
            asset.getAssetType(),
            asset.getSymbol(),
            asset.getName(),
            asset.getExchange(),
            asset.getNetwork(),
            asset.getCurrency(),
            asset.getCreatedAt()
        );
    }
}

