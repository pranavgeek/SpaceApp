package com.space.exception;

public class ErrorCodes {

  // Generic Error Codes (Reserved for common system-wide errors)
  public static final String BAD_REQUEST = "ERR-1001";
  public static final String INTERNAL_SERVER_ERROR = "ERR-1002";
  public static final String RESOURCE_NOT_FOUND = "ERR-1003";
  public static final String UNAUTHORIZED_ACCESS = "ERR-1004";



  // Custom Error Codes (Reserved for application-specific errors)
  public static final String USER_EMAIL_ALREADY_IN_USE = "ERR-2001";
  public static final String USER_NOT_FOUND = "ERR-2002";
  public static final String USER_INVALID_PASSWORD = "ERR-2003";
}
