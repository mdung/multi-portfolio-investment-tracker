package com.investtracker.transaction.service;

import com.investtracker.transaction.dto.TransactionResponse;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class TransactionExportService {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String CSV_HEADER = "ID,Portfolio ID,Asset Symbol,Asset Name,Type,Quantity,Price,Fee,Total,Date,Notes\n";
    
    public byte[] exportToCSV(List<TransactionResponse> transactions) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
        
        // Write BOM for Excel compatibility
        outputStream.write(0xEF);
        outputStream.write(0xBB);
        outputStream.write(0xBF);
        
        writer.write(CSV_HEADER);
        
        for (TransactionResponse tx : transactions) {
            String line = String.format(
                "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                escapeCsv(tx.getId().toString()),
                escapeCsv(tx.getPortfolioId().toString()),
                escapeCsv(tx.getAssetSymbol()),
                escapeCsv(tx.getAssetName() != null ? tx.getAssetName() : ""),
                escapeCsv(tx.getTransactionType().toString()),
                tx.getQuantity().toString(),
                tx.getPrice().toString(),
                tx.getFee() != null ? tx.getFee().toString() : "0",
                tx.getQuantity().multiply(tx.getPrice()).add(tx.getFee() != null ? tx.getFee() : java.math.BigDecimal.ZERO).toString(),
                escapeCsv(tx.getTransactionDate().format(DATE_FORMATTER)),
                escapeCsv(tx.getNotes() != null ? tx.getNotes() : "")
            );
            writer.write(line);
        }
        
        writer.flush();
        writer.close();
        
        return outputStream.toByteArray();
    }
    
    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

