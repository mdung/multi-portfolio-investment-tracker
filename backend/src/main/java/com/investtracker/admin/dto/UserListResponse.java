package com.investtracker.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String baseCurrency;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private Integer portfolioCount;
}

