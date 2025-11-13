package com.investtracker.asset.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"asset_type", "symbol", "exchange", "network"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 20)
    private AssetType assetType;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(length = 200)
    private String name;

    @Column(length = 50)
    private String exchange;

    @Column(length = 50)
    private String network;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AssetType {
        STOCK, CRYPTO
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

