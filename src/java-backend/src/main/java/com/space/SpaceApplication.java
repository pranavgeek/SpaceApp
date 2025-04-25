package com.space;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpaceApplication {

  private static final Logger logger = LoggerFactory.getLogger(SpaceApplication.class);

  public static void main(String[] args) {
    // Log application startup
    logger.info("Starting SpaceApplication...");

    SpringApplication.run(SpaceApplication.class, args);

    // Log that the application has started successfully
    logger.info("SpaceApplication started successfully!");
  }
}
