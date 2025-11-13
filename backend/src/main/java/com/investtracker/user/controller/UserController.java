package com.investtracker.user.controller;

import com.investtracker.security.UserPrincipal;
import com.investtracker.user.dto.ChangePasswordRequest;
import com.investtracker.user.dto.UpdateProfileRequest;
import com.investtracker.user.dto.UserProfileResponse;
import com.investtracker.user.entity.User;
import com.investtracker.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        User user = userPrincipal.getUser();
        UserProfileResponse response = new UserProfileResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getBaseCurrency(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // Same as /me endpoint
        return getCurrentUser(userPrincipal);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
        @Valid @RequestBody UpdateProfileRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            User updatedUser = userService.updateProfile(
                userPrincipal.getId(),
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                request.getBaseCurrency()
            );
            
            UserProfileResponse response = new UserProfileResponse(
                updatedUser.getId(),
                updatedUser.getUsername(),
                updatedUser.getEmail(),
                updatedUser.getFirstName(),
                updatedUser.getLastName(),
                updatedUser.getBaseCurrency(),
                updatedUser.getCreatedAt(),
                updatedUser.getUpdatedAt()
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
        @Valid @RequestBody ChangePasswordRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        try {
            userService.changePassword(
                userPrincipal.getId(),
                request.getCurrentPassword(),
                request.getNewPassword()
            );
            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    private record ErrorResponse(String message) {}
    private record MessageResponse(String message) {}
}

