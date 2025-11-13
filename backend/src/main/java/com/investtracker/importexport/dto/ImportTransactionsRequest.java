package com.investtracker.importexport.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ImportTransactionsRequest {
    private MultipartFile file;
    private java.util.UUID portfolioId; // Optional: if not provided, will use portfolio from CSV
}

