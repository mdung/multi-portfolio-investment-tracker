package com.investtracker.scheduler;

import com.investtracker.analytics.service.AnalyticsService;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PortfolioSnapshotScheduler {
    private final PortfolioRepository portfolioRepository;
    private final AnalyticsService analyticsService;
    
    // Run daily at 11:59 PM
    @Scheduled(cron = "0 59 23 * * *")
    public void createDailySnapshots() {
        log.info("Starting daily portfolio snapshot creation at {}", LocalDateTime.now());
        
        try {
            List<Portfolio> portfolios = portfolioRepository.findAll();
            int successCount = 0;
            int errorCount = 0;
            
            for (Portfolio portfolio : portfolios) {
                try {
                    // Get portfolio summary and create snapshot
                    var summary = analyticsService.getPortfolioSummary(
                        portfolio.getId(), 
                        portfolio.getUser().getId()
                    );
                    analyticsService.createSnapshot(portfolio, summary);
                    successCount++;
                } catch (Exception e) {
                    log.error("Error creating snapshot for portfolio {}: {}", 
                        portfolio.getId(), e.getMessage());
                    errorCount++;
                }
            }
            
            log.info("Daily snapshot creation completed. Success: {}, Errors: {}", 
                successCount, errorCount);
        } catch (Exception e) {
            log.error("Error in daily snapshot scheduler: {}", e.getMessage(), e);
        }
    }
}

