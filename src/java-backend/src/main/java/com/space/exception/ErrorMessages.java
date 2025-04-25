package com.space.exception;

public class ErrorMessages {


  // Generic Error Messages (Reserved for common system-wide errors)
  public static final String MSG_BAD_REQUEST = "Bad request: Invalid input or data";
  public static final String MSG_INTERNAL_SERVER_ERROR =
      "Internal server error: Something went wrong";
  public static final String MSG_RESOURCE_NOT_FOUND = "Requested resource not found";
  public static final String MSG_UNAUTHORIZED_ACCESS = "Unauthorized access attempt";


  // Custom Error Messages (Reserved for application-specific errors)
  public static final String MSG_USER_EMAIL_ALREADY_IN_USE =
      "Email already in use. Please use a different email.";
  public static final String MSG_USER_NOT_FOUND = "User not found";
  public static final String MSG_USER_INVALID_PASSWORD = "Invalid password provided.";
}
