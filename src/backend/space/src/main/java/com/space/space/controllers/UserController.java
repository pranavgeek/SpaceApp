package com.space.space.controllers;

import com.space.space.dtos.UserLoginRequestDto;
import com.space.space.dtos.UserLoginResponseDto;
import com.space.space.dtos.UserRegistrationRequestDto;
import com.space.space.dtos.UserRegistrationResponseDto;
import com.space.space.enums.ResponseError;
import com.space.space.models.User;
import com.space.space.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.logging.Logger;

@RestController
@RequestMapping("/users")
public class UserController {

    private UserService userService;

    private Logger logger=Logger.getLogger(UserController.class.getName());
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserRegistrationResponseDto userRegistration(@RequestBody UserRegistrationRequestDto userRegistrationRequestDto){
        UserRegistrationResponseDto userRegistrationResponseDto = new UserRegistrationResponseDto();
        User user;
        try{
            user= userService.registerUser(userRegistrationRequestDto.getFirstName(),userRegistrationRequestDto.getLastName(), userRegistrationRequestDto.getEmail(),
                    userRegistrationRequestDto.getPassword(), userRegistrationRequestDto.getRole(), userRegistrationRequestDto.getBio(), userRegistrationRequestDto.getCountry(),userRegistrationRequestDto.getLanguage());
            userRegistrationResponseDto.setResponseError(ResponseError.SUCCESS);
            userRegistrationResponseDto.setName(user.getFirstName()+" "+user.getLastName());
            userRegistrationResponseDto.setUserId(user.getId());

        } catch (Exception e) {
            userRegistrationResponseDto.setResponseError(ResponseError.FAILED);
        }
        return userRegistrationResponseDto;
    }

    @PostMapping("/login")
    public UserLoginResponseDto userLogin(@Validated @RequestBody UserLoginRequestDto userLoginRequestDto){
        UserLoginResponseDto userLoginResponseDto = new UserLoginResponseDto();
        User user=userService.loginUser(userLoginRequestDto.getEmail(),userLoginRequestDto.getPassword());
        userLoginResponseDto.setUserId(user.getId());
        userLoginResponseDto.setFirstName(user.getFirstName());
        userLoginResponseDto.setLastName(user.getLastName());
        return userLoginResponseDto;
    }

}
