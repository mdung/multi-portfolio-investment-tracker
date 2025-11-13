package com.investtracker.asset.controller;

import com.investtracker.asset.entity.Asset;
import com.investtracker.asset.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public ResponseEntity<List<Asset>> searchAssets(@RequestParam String symbol) {
        List<Asset> assets = assetService.searchAssets(symbol);
        return ResponseEntity.ok(assets);
    }
}

