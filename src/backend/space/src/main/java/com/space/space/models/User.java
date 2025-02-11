package com.space.space.models;

import com.space.space.enums.AccountPlan;
import com.space.space.enums.Country;
import com.space.space.enums.Language;
import com.space.space.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Getter
@Setter
public class User extends BaseModel {
    private String firstName;
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Long followersCount;

    @Enumerated(EnumType.STRING)
    @ElementCollection
    private List<AccountPlan> accountPlans;

    private String bio;

    @Enumerated(EnumType.STRING)
    private Country country;

    @Enumerated(EnumType.STRING)
    private Language language;
}
