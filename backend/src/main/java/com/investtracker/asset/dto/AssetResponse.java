package com.investtracker.asset.dto;

import com.investtracker.asset.entity.Asset.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse {
    private UUID id;
    private AssetType assetType;
    private String symbol;
    private String name;
    private String exchange;
    private String network;
    private String currency;
    private LocalDateTime createdAt;
}

