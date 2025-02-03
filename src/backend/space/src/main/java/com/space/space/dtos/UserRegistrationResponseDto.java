package com.space.space.dtos;

import com.space.space.enums.ResponseError;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegistrationResponseDto {
    private String name;
    private String userId;
    private ResponseError responseError;
}
