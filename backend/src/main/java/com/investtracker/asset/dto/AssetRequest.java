package com.investtracker.asset.dto;

import com.investtracker.asset.entity.Asset.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssetRequest {
    @NotNull(message = "Asset type is required")
    private AssetType assetType;

    @NotBlank(message = "Symbol is required")
    private String symbol;

    private String name;

    private String exchange;

    private String network;

    @NotBlank(message = "Currency is required")
    private String currency;
}

