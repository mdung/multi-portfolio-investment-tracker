package com.investtracker.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Email(message = "Email must be valid")
    private String email;

    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @Size(min = 3, max = 10, message = "Base currency must be between 3 and 10 characters")
    private String baseCurrency;
}

