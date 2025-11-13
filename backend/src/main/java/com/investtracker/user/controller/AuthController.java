package com.investtracker.user.controller;

import com.investtracker.security.JwtTokenProvider;
import com.investtracker.user.dto.AuthResponse;
import com.investtracker.user.dto.LoginRequest;
import com.investtracker.user.dto.RegisterRequest;
import com.investtracker.user.entity.User;
import com.investtracker.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName(),
                request.getBaseCurrency()
            );
            
            String token = jwtTokenProvider.generateToken(user.getUsername());
            AuthResponse response = new AuthResponse(token, "Bearer", user.getUsername(), user.getEmail());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.findByUsername(request.getUsername())
            .orElse(null);
        
        if (user == null || !userService.validatePassword(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Invalid username or password"));
        }
        
        if (!user.getEnabled()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Account is disabled"));
        }
        
        String token = jwtTokenProvider.generateToken(user.getUsername());
        AuthResponse response = new AuthResponse(token, "Bearer", user.getUsername(), user.getEmail());
        
        return ResponseEntity.ok(response);
    }
    
    private record ErrorResponse(String message) {}
}

