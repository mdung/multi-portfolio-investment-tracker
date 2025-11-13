package com.investtracker.asset.service;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
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
}

