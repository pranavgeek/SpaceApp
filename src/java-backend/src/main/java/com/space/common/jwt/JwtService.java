package com.space.common.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

  private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

  // 24 hours token validity
  private static final long JWT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

  // Replace with env-based secret later
  private static final String JWT_SECRET_KEY = "12345678901234567890123456789012"; // Must be at
                                                                                   // least 256-bit
                                                                                   // (32 chars)

  private Key getSigningKey() {
    return Keys.hmacShaKeyFor(JWT_SECRET_KEY.getBytes());
  }

  public String extractEmail(String token) {
    logger.debug("Extracting email from token...");
    return extractClaim(token, Claims::getSubject);
  }

  public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    logger.debug("Extracting claim from token...");
    Claims claims = extractAllClaims(token);
    return claimsResolver.apply(claims);
  }

  private Claims extractAllClaims(String token) {
    logger.debug("Extracting all claims from token...");
    return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token)
        .getBody();
  }

  public String generateToken(String email) {
    logger.debug("Generating JWT for email: {}", email);
    String token = Jwts.builder().setSubject(email).setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION_MS))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    logger.info("Generated JWT for email: {}", email);
    return token;
  }

  public boolean isTokenValid(String token, String email) {
    logger.debug("Validating token for email: {}", email);
    String extractedEmail = extractEmail(token);
    boolean isValid = email.equals(extractedEmail) && !isTokenExpired(token);
    if (isValid) {
      logger.info("Token is valid for email: {}", email);
    } else {
      logger.warn("Token is invalid for email: {}", email);
    }
    return isValid;
  }

  private boolean isTokenExpired(String token) {
    logger.debug("Checking if token is expired...");
    return extractExpiration(token).before(new Date());
  }

  private Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }
}
