package com.space.config;

import com.space.common.jwt.JwtService;
import com.space.user.repository.UserRepository;
import com.space.user.model.User;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

  private final JwtService jwtService;
  private final UserRepository userRepository;

  public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      logger.debug("No Authorization header or invalid format, skipping JWT filter.");
      filterChain.doFilter(request, response);
      return;
    }

    String jwt = authHeader.substring(7);
    String email = jwtService.extractEmail(jwt);

    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      logger.debug("JWT token found for email: {}", email);

      Optional<User> userOpt = userRepository.findByEmail(email);
      if (userOpt.isPresent() && jwtService.isTokenValid(jwt, email)) {
        logger.info("User authenticated successfully with email: {}", email);

        User user = userOpt.get();
        UsernamePasswordAuthenticationToken authToken =
            new UsernamePasswordAuthenticationToken(user, null, null); // No authorities yet

        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
      } else {
        logger.warn("Invalid or expired token for email: {}", email);
      }
    }

    filterChain.doFilter(request, response);
  }
}
