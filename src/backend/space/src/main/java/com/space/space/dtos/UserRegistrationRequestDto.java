package com.space.space.dtos;

import com.space.space.enums.AccountPlan;
import com.space.space.enums.Country;
import com.space.space.enums.Language;
import com.space.space.enums.Role;
import com.space.space.models.User;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserRegistrationRequestDto {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private Role role;
    private String bio;
    private Country country;
    private Language language;
}
