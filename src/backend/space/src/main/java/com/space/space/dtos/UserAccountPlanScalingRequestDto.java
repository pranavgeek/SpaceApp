package com.space.space.dtos;

import com.space.space.enums.AccountPlan;
import com.space.space.enums.Scale;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAccountPlanScalingRequestDto {
    private Scale scale;
    private String userId;
    private AccountPlan accountPlan;
}
