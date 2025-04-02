package com.space.space.services;

import com.space.space.enums.*;
import com.space.space.models.User;
import com.space.space.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(String firstName, String lastName, String email, String password,
                             Role role, String bio, Country country, Language language  ) {

        User user=new User();

        try {
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);

            BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
            user.setPassword(bCryptPasswordEncoder.encode(password));

            user.setRole(role);
            user.setBio(bio);
            user.setCountry(country);
            user.setLanguage(language);
        } catch (Exception exception) {
            throw new RuntimeException("Error registering user", exception);
        }

        return userRepository.save(user);
    }

    public User loginUser(String email, String password) {
        User user=userRepository.findByEmail(email);

        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
        if(!bCryptPasswordEncoder.matches(password, user.getPassword())){
            throw new RuntimeException("Incorrect password");
        }
        return user;
    }

    public User addUserAccountPlan(String userId,List<AccountPlan> accountPlans){
        User upadateUser;
        User user=userRepository.findUserById(userId);
        if(user==null){
            throw new RuntimeException("User already exists");
        }
        else{
            user.setAccountPlans(accountPlans);
            upadateUser=userRepository.save(user);
        }
        return upadateUser;
    }

    public User getUserById(String userId){
        User user=userRepository.findUserById(userId);
        if(user==null){
            throw new RuntimeException("User does not exist");
        }
        return user;
    }

    public User scaleUserAccountPlan(String userId, AccountPlan accountPlan, Scale scale){
        User user=userRepository.findUserById(userId);
        if(user==null){
            throw new RuntimeException("User does not exist");
        }
        if(scale.equals(Scale.UPGRADE)){
            if(user.getAccountPlans().contains(accountPlan)){
                throw new RuntimeException("Account Plan already exists");
            }
            else{
                user.getAccountPlans().add(accountPlan);
            }
        }
        else{
            if(user.getAccountPlans().contains(accountPlan)){
                user.getAccountPlans().remove(accountPlan);
            }else{
                throw new RuntimeException("Account Plan does not exist");
            }
        }
        return userRepository.save(user);
    }
}
