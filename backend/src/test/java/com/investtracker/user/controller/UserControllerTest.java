package com.investtracker.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.investtracker.security.UserPrincipal;
import com.investtracker.user.dto.ChangePasswordRequest;
import com.investtracker.user.dto.UpdateProfileRequest;
import com.investtracker.user.entity.User;
import com.investtracker.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private User createTestUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setBaseCurrency("USD");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setEnabled(true);
        return user;
    }
    
    @Test
    @WithMockUser
    void testGetCurrentUser() throws Exception {
        User user = createTestUser();
        UserPrincipal userPrincipal = new UserPrincipal(user);
        
        mockMvc.perform(get("/api/users/me")
                .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }
    
    @Test
    @WithMockUser
    void testGetProfile() throws Exception {
        User user = createTestUser();
        UserPrincipal userPrincipal = new UserPrincipal(user);
        
        mockMvc.perform(get("/api/users/profile")
                .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }
    
    @Test
    @WithMockUser
    void testUpdateProfile() throws Exception {
        User user = createTestUser();
        User updatedUser = createTestUser();
        updatedUser.setEmail("newemail@example.com");
        updatedUser.setFirstName("NewFirst");
        updatedUser.setLastName("NewLast");
        updatedUser.setBaseCurrency("EUR");
        
        UserPrincipal userPrincipal = new UserPrincipal(user);
        
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("newemail@example.com");
        request.setFirstName("NewFirst");
        request.setLastName("NewLast");
        request.setBaseCurrency("EUR");
        
        when(userService.updateProfile(
            eq(user.getId()),
            eq("newemail@example.com"),
            eq("NewFirst"),
            eq("NewLast"),
            eq("EUR")
        )).thenReturn(updatedUser);
        
        mockMvc.perform(put("/api/users/profile")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newemail@example.com"))
                .andExpect(jsonPath("$.firstName").value("NewFirst"));
    }
    
    @Test
    @WithMockUser
    void testChangePassword() throws Exception {
        User user = createTestUser();
        UserPrincipal userPrincipal = new UserPrincipal(user);
        
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword123");
        
        doNothing().when(userService).changePassword(
            eq(user.getId()),
            eq("oldPassword"),
            eq("newPassword123")
        );
        
        mockMvc.perform(put("/api/users/password")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));
    }
    
    @Test
    @WithMockUser
    void testChangePasswordWithIncorrectCurrentPassword() throws Exception {
        User user = createTestUser();
        UserPrincipal userPrincipal = new UserPrincipal(user);
        
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPassword");
        request.setNewPassword("newPassword123");
        
        doThrow(new IllegalArgumentException("Current password is incorrect"))
            .when(userService).changePassword(
                eq(user.getId()),
                eq("wrongPassword"),
                eq("newPassword123")
            );
        
        mockMvc.perform(put("/api/users/password")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }
}

