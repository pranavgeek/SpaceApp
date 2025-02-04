package com.space.space.services;

import com.space.space.enums.Country;
import com.space.space.enums.Language;
import com.space.space.enums.Role;
import com.space.space.models.User;
import com.space.space.repositories.UserRepository;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;


@Log4j2
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
}
