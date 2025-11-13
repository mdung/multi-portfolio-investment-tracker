package com.investtracker.asset.controller;

import com.investtracker.asset.dto.AssetRequest;
import com.investtracker.asset.dto.AssetResponse;
import com.investtracker.asset.dto.PopularAssetResponse;
import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {
    private final AssetService assetService;
    
    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAsset(@PathVariable UUID id) {
        return assetService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<java.util.List<Asset>> searchAssets(@RequestParam String symbol) {
        java.util.List<Asset> assets = assetService.searchAssets(symbol);
        return ResponseEntity.ok(assets);
    }
    
    @PostMapping
    public ResponseEntity<?> createAsset(
        @Valid @RequestBody AssetRequest request
    ) {
        try {
            AssetResponse asset = assetService.createAsset(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(asset);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(
        @PathVariable UUID id,
        @Valid @RequestBody AssetRequest request
    ) {
        try {
            AssetResponse asset = assetService.updateAsset(id, request);
            return ResponseEntity.ok(asset);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<Page<AssetResponse>> getAssets(
        @RequestParam(required = false) Asset.AssetType assetType,
        @RequestParam(required = false) String symbol,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AssetResponse> assets = assetService.getAssets(assetType, symbol, pageable);
        return ResponseEntity.ok(assets);
    }
    
    @GetMapping("/popular")
    public ResponseEntity<Page<PopularAssetResponse>> getPopularAssets(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PopularAssetResponse> popularAssets = assetService.getPopularAssets(pageable);
        return ResponseEntity.ok(popularAssets);
    }
    
    private record ErrorResponse(String message) {}
}

