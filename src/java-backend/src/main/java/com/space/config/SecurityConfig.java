package com.space.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

  private final JwtAuthFilter jwtAuthFilter;

  public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
    this.jwtAuthFilter = jwtAuthFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    logger.debug("Configuring HTTP security...");

    http.csrf(csrf -> csrf.disable()).headers(headers -> headers.frameOptions().disable())
        .authorizeHttpRequests(auth -> auth.requestMatchers("/api/v1/auth/**").permitAll() // Open
                                                                                           // access
                                                                                           // to
                                                                                           // auth
                                                                                           // endpoints
            .requestMatchers("/h2-console/**").authenticated() // Basic auth for dev tools
            .requestMatchers("/api/**").authenticated() // JWT protected endpoints
            .anyRequest().denyAll()) // Deny all other requests
        .httpBasic(Customizer.withDefaults()) // Enable Basic Auth
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Stateless
                                                                                       // session
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    logger.info("HTTP security configured with JWT and Basic Auth filters.");

    return http.build();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
      throws Exception {
    logger.debug("Creating AuthenticationManager...");
    return config.getAuthenticationManager();
  }

  @Bean
  public UserDetailsService userDetailsService() {
    logger.debug("Creating in-memory user for Basic Auth...");

    UserDetails devUser = User.builder().username("devadmin")
        .password(passwordEncoder().encode("devpassword")).roles("DEV").build();

    logger.info("In-memory user 'devadmin' created for Basic Auth.");
    return new InMemoryUserDetailsManager(devUser);
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
