package com.space.space.dtos;

import com.space.space.enums.AccountPlan;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserAccountPlanRequestDto {
    private String userId;
    private List<AccountPlan> plans;
}
