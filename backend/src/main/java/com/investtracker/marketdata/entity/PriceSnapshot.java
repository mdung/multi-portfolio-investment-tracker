package com.investtracker.marketdata.entity;

import com.investtracker.asset.entity.Asset;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "price_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal price;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDateTime snapshotDate;

    @Column(length = 50)
    private String source;

    @PrePersist
    protected void onCreate() {
        if (snapshotDate == null) {
            snapshotDate = LocalDateTime.now();
        }
    }
}

