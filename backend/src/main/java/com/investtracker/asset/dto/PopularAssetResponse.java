package com.investtracker.asset.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PopularAssetResponse {
    private AssetResponse asset;
    private Long transactionCount;
}

