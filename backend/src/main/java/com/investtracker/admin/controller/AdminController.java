package com.investtracker.admin.controller;

import com.investtracker.admin.dto.UserListResponse;
import com.investtracker.asset.dto.AssetRequest;
import com.investtracker.asset.dto.AssetResponse;
import com.investtracker.asset.service.AssetService;
import com.investtracker.portfolio.repository.PortfolioRepository;
import com.investtracker.security.UserPrincipal;
import com.investtracker.user.entity.User;
import com.investtracker.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final AssetService assetService;
    
    @GetMapping("/users")
    public ResponseEntity<Page<UserListResponse>> getAllUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);
        
        Page<UserListResponse> response = users.map(user -> {
            int portfolioCount = portfolioRepository.findByUserId(user.getId()).size();
            return new UserListResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getBaseCurrency(),
                user.getEnabled(),
                user.getCreatedAt(),
                portfolioCount
            );
        });
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/users/{id}/enable")
    public ResponseEntity<?> enableUser(
        @PathVariable UUID id,
        @RequestParam boolean enabled,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        User user = userRepository.findById(id)
            .orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        user.setEnabled(enabled);
        userRepository.save(user);
        
        return ResponseEntity.ok(new MessageResponse("User " + (enabled ? "enabled" : "disabled") + " successfully"));
    }
    
    @GetMapping("/assets")
    public ResponseEntity<Page<AssetResponse>> getAllAssets(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AssetResponse> assets = assetService.getAssets(null, null, pageable);
        return ResponseEntity.ok(assets);
    }
    
    @PostMapping("/assets/bulk")
    public ResponseEntity<?> bulkCreateAssets(
        @Valid @RequestBody List<AssetRequest> requests
    ) {
        try {
            List<AssetResponse> createdAssets = requests.stream()
                .map(request -> {
                    try {
                        return assetService.createAsset(request);
                    } catch (Exception e) {
                        return null; // Skip failed assets
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAssets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Bulk creation failed: " + e.getMessage()));
        }
    }
    
    private record MessageResponse(String message) {}
    private record ErrorResponse(String message) {}
}

