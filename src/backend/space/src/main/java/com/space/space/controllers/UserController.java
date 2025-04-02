package com.space.space.controllers;

import com.space.space.dtos.*;
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

    @PostMapping("/addAccountPlan")
    public UserAccountPlanResponseDto addUserAccountPlan(@RequestBody UserAccountPlanRequestDto userAccountPlanRequestDto){
        UserAccountPlanResponseDto userAccountPlanResponseDto = new UserAccountPlanResponseDto();
        User user=userService.addUserAccountPlan(userAccountPlanRequestDto.getUserId(),userAccountPlanRequestDto.getPlans());
        if(user!=null){
            userAccountPlanResponseDto.setUserId(user.getId());
            userAccountPlanResponseDto.setMessage("Account plan successfully added");
        }
        else{
            userAccountPlanResponseDto.setMessage("Account plan not added");
        }
        return userAccountPlanResponseDto;
    }

    @GetMapping("/{id}")
    public UserResponseDetailsDto getUserAccountPlan(@PathVariable String id){
        UserResponseDetailsDto userResponseDetailsDto = new UserResponseDetailsDto();
        User user=userService.getUserById(id);
        userResponseDetailsDto.setUser(user);
        return userResponseDetailsDto;
    }

    @PostMapping("/ScaleUserAccountPlan")
    public UserAccountPlanScalingResponseDto scaleUserAccountPlan(@RequestBody UserAccountPlanScalingRequestDto userAccountPlanScalingRequestDto){
        UserAccountPlanScalingResponseDto userAccountPlanScalingResponseDto = new UserAccountPlanScalingResponseDto();
        try{
            User user =userService.scaleUserAccountPlan(userAccountPlanScalingRequestDto.getUserId(),userAccountPlanScalingRequestDto.getAccountPlan(),userAccountPlanScalingRequestDto.getScale());
            userAccountPlanScalingResponseDto.setUserId(user.getId());
            userAccountPlanScalingResponseDto.setMessage("Account plane upgrade/degrade successfully");
        }catch (Exception e){
            userAccountPlanScalingResponseDto.setMessage("Account plane upgrade/degrad failed");
        }

        return userAccountPlanScalingResponseDto;
    }

}
