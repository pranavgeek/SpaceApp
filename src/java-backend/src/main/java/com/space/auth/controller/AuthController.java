package com.space.auth.controller;

import com.space.auth.service.AuthService;
import com.space.user.dto.AuthResponseDTO;
import com.space.user.dto.LoginRequestDTO;
import com.space.user.dto.RegisterRequestDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO request) {
    logger.debug("Attempting to register user with email: {}", request.getEmail());

    try {
      AuthResponseDTO response = authService.register(request);
      logger.info("User registered successfully with email: {}", request.getEmail());
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      logger.error("Registration failed for email: {} with error: {}", request.getEmail(),
          e.getMessage());
      throw e; // Re-throw the exception to be handled by global exception handler
    }
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
    logger.debug("Attempting to login user with email: {}", request.getEmail());

    try {
      AuthResponseDTO response = authService.login(request);
      logger.info("User logged in successfully with email: {}", request.getEmail());
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      logger.error("Login failed for email: {} with error: {}", request.getEmail(), e.getMessage());
      throw e; // Re-throw the exception to be handled by global exception handler
    }
  }

  @GetMapping("/check")
  public ResponseEntity<?> checkAuth(Authentication authentication) {
    if (authentication == null) {
      logger.warn("Authentication failed, user is not authenticated");
      return ResponseEntity.status(401).body("Not authenticated");
    }

    logger.info("Authenticated user: {}", authentication.getName());
    return ResponseEntity.ok(Map.of("email", authentication.getName(), "status", "authenticated"));
  }
}
