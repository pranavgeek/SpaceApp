package com.space.auth.service;

import com.space.user.dto.AuthResponseDTO;
import com.space.user.dto.LoginRequestDTO;
import com.space.user.dto.RegisterRequestDTO;
import com.space.user.model.Role;
import com.space.user.model.User;
import com.space.user.repository.UserRepository;
import com.space.common.jwt.JwtService;
import com.space.exception.AppException;
import com.space.exception.ErrorCodes;
import com.space.exception.ErrorMessages;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

  private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

  private final UserRepository userRepository;
  private final JwtService jwtService;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository userRepository, JwtService jwtService) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
  }

  public AuthResponseDTO register(RegisterRequestDTO request) {
    logger.debug("Attempting to register user with email: {}", request.getEmail());

    // Check if email already exists
    if (userRepository.existsByEmail(request.getEmail())) {
      logger.error("Email {} already in use during registration", request.getEmail());
      throw new AppException(HttpStatus.BAD_REQUEST.value(),
          ErrorMessages.MSG_USER_EMAIL_ALREADY_IN_USE, ErrorCodes.USER_EMAIL_ALREADY_IN_USE);
    }

    try {
      // Create and save the new user
      User user =
          new User(request.getEmail(), passwordEncoder.encode(request.getPassword()), Role.USER);
      userRepository.save(user);
      logger.info("User successfully registered with email: {}", request.getEmail());

      // Generate JWT token
      String token = jwtService.generateToken(user.getEmail());
      logger.debug("Generated JWT for email: {}", request.getEmail());

      return new AuthResponseDTO(token);
    } catch (Exception e) {
      logger.error("Error occurred while registering user: {}", e.getMessage());
      throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR.value(),
          ErrorMessages.MSG_INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_SERVER_ERROR, e);
    }
  }

  public AuthResponseDTO login(LoginRequestDTO request) {
    logger.debug("Attempting to login user with email: {}", request.getEmail());

    // Fetch user by email
    Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

    if (optionalUser.isEmpty()) {
      logger.error("Login failed for email: {}. User not found.", request.getEmail());
      // Throwing AppException with custom error code and message for user not found
      throw new AppException(HttpStatus.NOT_FOUND.value(), ErrorMessages.MSG_USER_NOT_FOUND,
          ErrorCodes.USER_NOT_FOUND);
    }

    User user = optionalUser.get();

    // Check if password is valid
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      logger.error("Login failed for email: {}. Invalid password.", request.getEmail());
      // Throwing AppException for invalid password with custom error code and message
      throw new AppException(HttpStatus.BAD_REQUEST.value(),
          ErrorMessages.MSG_USER_INVALID_PASSWORD, ErrorCodes.USER_INVALID_PASSWORD);
    }

    // Generate JWT token
    String token = jwtService.generateToken(user.getEmail());
    logger.info("User successfully logged in with email: {}", request.getEmail());
    logger.debug("Generated JWT for email: {}", request.getEmail());

    return new AuthResponseDTO(token);
  }
}
