package com.investtracker.portfolio.service;

import com.investtracker.portfolio.dto.PortfolioRequest;
import com.investtracker.portfolio.dto.PortfolioResponse;
import com.investtracker.portfolio.entity.Portfolio;
import com.investtracker.portfolio.repository.PortfolioRepository;
import com.investtracker.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {
    
    @Mock
    private PortfolioRepository portfolioRepository;
    
    @InjectMocks
    private PortfolioService portfolioService;
    
    private User testUser;
    private Portfolio testPortfolio;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        
        testPortfolio = new Portfolio();
        testPortfolio.setId(UUID.randomUUID());
        testPortfolio.setUser(testUser);
        testPortfolio.setName("Test Portfolio");
        testPortfolio.setBaseCurrency("USD");
    }
    
    @Test
    void testGetUserPortfolios() {
        // Given
        when(portfolioRepository.findByUserId(testUser.getId()))
            .thenReturn(Arrays.asList(testPortfolio));
        
        // When
        List<PortfolioResponse> result = portfolioService.getUserPortfolios(testUser.getId());
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testPortfolio.getName(), result.get(0).getName());
        verify(portfolioRepository).findByUserId(testUser.getId());
    }
    
    @Test
    void testCreatePortfolio() {
        // Given
        PortfolioRequest request = new PortfolioRequest();
        request.setName("New Portfolio");
        request.setDescription("Test Description");
        request.setBaseCurrency("USD");
        
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);
        
        // When
        PortfolioResponse result = portfolioService.createPortfolio(testUser, request);
        
        // Then
        assertNotNull(result);
        assertEquals(testPortfolio.getName(), result.getName());
        verify(portfolioRepository).save(any(Portfolio.class));
    }
    
    @Test
    void testUpdatePortfolio() {
        // Given
        PortfolioRequest request = new PortfolioRequest();
        request.setName("Updated Portfolio");
        request.setBaseCurrency("EUR");
        
        when(portfolioRepository.findByIdAndUserId(testPortfolio.getId(), testUser.getId()))
            .thenReturn(Optional.of(testPortfolio));
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);
        
        // When
        Optional<PortfolioResponse> result = portfolioService.updatePortfolio(
            testPortfolio.getId(), 
            testUser.getId(), 
            request
        );
        
        // Then
        assertTrue(result.isPresent());
        verify(portfolioRepository).findByIdAndUserId(testPortfolio.getId(), testUser.getId());
        verify(portfolioRepository).save(any(Portfolio.class));
    }
    
    @Test
    void testDeletePortfolio() {
        // Given
        when(portfolioRepository.existsByIdAndUserId(testPortfolio.getId(), testUser.getId()))
            .thenReturn(true);
        doNothing().when(portfolioRepository).deleteById(testPortfolio.getId());
        
        // When
        boolean result = portfolioService.deletePortfolio(testPortfolio.getId(), testUser.getId());
        
        // Then
        assertTrue(result);
        verify(portfolioRepository).deleteById(testPortfolio.getId());
    }
}

