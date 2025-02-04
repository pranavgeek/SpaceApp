package com.space.space.models;

import com.space.space.enums.AccountPlan;
import com.space.space.enums.Country;
import com.space.space.enums.Language;
import com.space.space.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class User extends BaseModel{
    private String firstName;
    private String lastName;
    private String email;
    private String password;

    @Enumerated(EnumType.ORDINAL)
    private Role role;

    private Long followersCount;

    @Enumerated(value = EnumType.ORDINAL)
    @ElementCollection
    private List<AccountPlan> accountPlans;

    private String bio;

    @Enumerated(value = EnumType.ORDINAL)
    private Country country;

    @Enumerated(value = EnumType.ORDINAL)
    private Language language;

}
