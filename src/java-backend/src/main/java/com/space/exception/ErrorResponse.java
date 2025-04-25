package com.space.exception;

import java.time.LocalDateTime;

public class ErrorResponse {
  private int status;
  private String message;
  private LocalDateTime timestamp;
  private String errorCode;

  // No-argument constructor for Spring to instantiate
  public ErrorResponse() {}

  public ErrorResponse(int status, String message, LocalDateTime timestamp, String errorCode) {
    this.status = status;
    this.message = message;
    this.timestamp = timestamp;
    this.errorCode = errorCode;
  }
  
  public ErrorResponse(int status, String message, LocalDateTime timestamp) {
    this.status = status;
    this.message = message;
    this.timestamp = timestamp;
  }

  // Getters and Setters
  public int getStatus() {
    return status;
  }

  public void setStatus(int status) {
    this.status = status;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public LocalDateTime getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(LocalDateTime timestamp) {
    this.timestamp = timestamp;
  }

  public String getErrorCode() {
    return errorCode;
  }

  public void setErrorCode(String errorCode) {
    this.errorCode = errorCode;
  }
}
