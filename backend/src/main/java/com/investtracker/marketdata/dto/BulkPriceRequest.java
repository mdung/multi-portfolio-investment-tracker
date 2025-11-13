package com.investtracker.marketdata.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BulkPriceRequest {
    @NotEmpty(message = "Asset IDs are required")
    private List<UUID> assetIds;
    
    private String currency = "USD";
}

