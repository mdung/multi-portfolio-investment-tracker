package com.investtracker.alert.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkAlertRequest {
    @NotEmpty(message = "Alerts list cannot be empty")
    @Valid
    private List<PriceAlertRequest> alerts;
}

