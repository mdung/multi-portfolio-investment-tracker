package com.investtracker.portfolio.service;

import com.investtracker.portfolio.dto.PortfolioRequest;
import com.investtracker.portfolio.dto.PortfolioResponse;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.repository.PortfolioRepository;
import com.investtracker.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {
    private final PortfolioRepository portfolioRepository;
    
    public List<PortfolioResponse> getUserPortfolios(UUID userId) {
        return portfolioRepository.findByUserId(userId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    public Optional<PortfolioResponse> getPortfolio(UUID portfolioId, UUID userId) {
        return portfolioRepository.findByIdAndUserId(portfolioId, userId)
            .map(this::toResponse);
    }
    
    @Transactional
    public PortfolioResponse createPortfolio(User user, PortfolioRequest request) {
        Portfolio portfolio = new Portfolio();
        portfolio.setUser(user);
        portfolio.setName(request.getName());
        portfolio.setDescription(request.getDescription());
        portfolio.setBaseCurrency(request.getBaseCurrency() != null ? request.getBaseCurrency() : "USD");
        portfolio.setRiskProfile(request.getRiskProfile());
        
        return toResponse(portfolioRepository.save(portfolio));
    }
    
    @Transactional
    public Optional<PortfolioResponse> updatePortfolio(UUID portfolioId, UUID userId, PortfolioRequest request) {
        return portfolioRepository.findByIdAndUserId(portfolioId, userId)
            .map(portfolio -> {
                portfolio.setName(request.getName());
                portfolio.setDescription(request.getDescription());
                portfolio.setBaseCurrency(request.getBaseCurrency());
                portfolio.setRiskProfile(request.getRiskProfile());
                return toResponse(portfolioRepository.save(portfolio));
            });
    }
    
    @Transactional
    public boolean deletePortfolio(UUID portfolioId, UUID userId) {
        if (portfolioRepository.existsByIdAndUserId(portfolioId, userId)) {
            portfolioRepository.deleteById(portfolioId);
            return true;
        }
        return false;
    }
    
    public boolean isOwner(UUID portfolioId, UUID userId) {
        return portfolioRepository.existsByIdAndUserId(portfolioId, userId);
    }
    
    public Optional<Portfolio> findById(UUID portfolioId) {
        return portfolioRepository.findById(portfolioId);
    }
    
    private PortfolioResponse toResponse(Portfolio portfolio) {
        return new PortfolioResponse(
            portfolio.getId(),
            portfolio.getName(),
            portfolio.getDescription(),
            portfolio.getBaseCurrency(),
            portfolio.getRiskProfile(),
            portfolio.getCreatedAt(),
            portfolio.getUpdatedAt()
        );
    }
}

