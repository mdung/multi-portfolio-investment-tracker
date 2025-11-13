package com.investtracker.analytics.entity;

import com.investtracker.portfolio.entity.Portfolio;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "portfolio_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(name = "total_value", nullable = false, precision = 20, scale = 8)
    private BigDecimal totalValue;

    @Column(name = "total_cost", nullable = false, precision = 20, scale = 8)
    private BigDecimal totalCost;

    @Column(name = "total_pnl", nullable = false, precision = 20, scale = 8)
    private BigDecimal totalPnL;

    @Column(name = "total_pnl_percent", nullable = false, precision = 10, scale = 4)
    private BigDecimal totalPnLPercent;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDateTime snapshotDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (snapshotDate == null) {
            snapshotDate = LocalDateTime.now();
        }
    }
}

