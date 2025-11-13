package com.investtracker.importexport.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ImportPortfolioRequest {
    private MultipartFile file;
}

