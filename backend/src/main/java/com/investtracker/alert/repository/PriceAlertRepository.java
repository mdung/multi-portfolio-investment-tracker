package com.investtracker.alert.repository;

import com.investtracker.alert.entity.PriceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PriceAlertRepository extends JpaRepository<PriceAlert, UUID> {
    List<PriceAlert> findByUserId(UUID userId);
    List<PriceAlert> findByUserIdAndIsActiveTrue(UUID userId);
    List<PriceAlert> findByIsActiveTrue();
    boolean existsByIdAndUserId(UUID id, UUID userId);
}

