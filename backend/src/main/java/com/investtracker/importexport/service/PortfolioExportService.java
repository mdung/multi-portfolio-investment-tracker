package com.investtracker.importexport.service;

import com.investtracker.analytics.dto.HoldingResponse;
import com.investtracker.analytics.dto.PortfolioSummaryResponse;
import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.transaction.dto.TransactionResponse;
import com.investtracker.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PortfolioExportService {
    private final AnalyticsService analyticsService;
    private final TransactionService transactionService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    public byte[] exportPortfolioToCSV(UUID portfolioId, UUID userId) throws IOException {
        PortfolioSummaryResponse summary = analyticsService.getPortfolioSummary(portfolioId, userId);
        List<TransactionResponse> transactions = transactionService.getPortfolioTransactions(portfolioId, userId);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
        
        // Write BOM for Excel compatibility
        outputStream.write(0xEF);
        outputStream.write(0xBB);
        outputStream.write(0xBF);
        
        // Portfolio Summary Section
        writer.write("PORTFOLIO SUMMARY\n");
        writer.write("Total Value," + summary.getTotalValue() + "\n");
        writer.write("Total Cost," + summary.getTotalCost() + "\n");
        writer.write("Total P&L," + summary.getTotalPnL() + "\n");
        writer.write("Total P&L %," + summary.getTotalPnLPercent() + "\n");
        writer.write("Currency," + summary.getBaseCurrency() + "\n");
        writer.write("\n");
        
        // Holdings Section
        writer.write("HOLDINGS\n");
        writer.write("Asset Symbol,Asset Name,Asset Type,Quantity,Average Price,Current Price,Current Value,Unrealized P&L,Realized P&L\n");
        for (HoldingResponse holding : summary.getHoldings()) {
            writer.write(String.format(
                "%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                escapeCsv(holding.getAssetSymbol()),
                escapeCsv(holding.getAssetName() != null ? holding.getAssetName() : ""),
                escapeCsv(holding.getAssetType()),
                holding.getQuantity().toString(),
                holding.getAverageBuyPrice().toString(),
                holding.getCurrentPrice().toString(),
                holding.getCurrentValue().toString(),
                holding.getUnrealizedPnL().toString(),
                holding.getRealizedPnL() != null ? holding.getRealizedPnL().toString() : "0"
            ));
        }
        writer.write("\n");
        
        // Transactions Section
        writer.write("TRANSACTIONS\n");
        writer.write("ID,Asset Symbol,Asset Name,Type,Quantity,Price,Fee,Total,Date,Notes\n");
        for (TransactionResponse tx : transactions) {
            writer.write(String.format(
                "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                escapeCsv(tx.getId().toString()),
                escapeCsv(tx.getAssetSymbol()),
                escapeCsv(tx.getAssetName() != null ? tx.getAssetName() : ""),
                escapeCsv(tx.getTransactionType().toString()),
                tx.getQuantity().toString(),
                tx.getPrice().toString(),
                tx.getFee() != null ? tx.getFee().toString() : "0",
                tx.getQuantity().multiply(tx.getPrice()).add(tx.getFee() != null ? tx.getFee() : java.math.BigDecimal.ZERO).toString(),
                escapeCsv(tx.getTransactionDate().format(DATE_FORMATTER)),
                escapeCsv(tx.getNotes() != null ? tx.getNotes() : "")
            ));
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

