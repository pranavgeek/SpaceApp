package com.space.exception;

import java.time.LocalDateTime;

public class AppException extends RuntimeException {
  private static final long serialVersionUID = -3158197253776865663L;
  private int statusCode;
  private String message;
  private String errorCode;
  private LocalDateTime timestamp;

  // Constructor with errorCode and timestamp
  public AppException(int statusCode, String message, String errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.timestamp = LocalDateTime.now(); // Automatically set the timestamp
  }

  // Constructor with errorCode and timestamp for throwable cause
  public AppException(int statusCode, String message, String errorCode, Throwable cause) {
    super(message, cause);
    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.timestamp = LocalDateTime.now(); // Automatically set the timestamp
  }

  // Getters
  public int getStatusCode() {
    return statusCode;
  }

  public String getMessage() {
    return message;
  }

  public String getErrorCode() {
    return errorCode;
  }

  public LocalDateTime getTimestamp() {
    return timestamp;
  }
}
