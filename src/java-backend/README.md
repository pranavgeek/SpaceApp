
# Space API

## Project Overview

**Space API** is a backend service designed to provide RESTful APIs for user registration, authentication, and profile management. Built using **Spring Boot** and leveraging **JWT** for secure access, this API ensures that users can register, log in, and interact with their profiles in a secure and structured manner. The API supports various configurations and can be deployed to multiple environments.

## Prerequisites

Before running the Space API, make sure the following tools are installed on your system:

- **Java 11+** (Required for building and running the Spring Boot application)
- **Maven** (For managing project dependencies and building the application)
- **MySQL** or **SQLite** (MySQL is used for production; SQLite is used for development)
- **Git** (For cloning the repository)

## Installation Instructions

Follow these steps to set up the project locally:

1. **Clone the Repository**:

   Clone this repository to your local machine:


2. **Install Project Dependencies**:

   Make sure you have **Maven** installed. Run the following command to install the required dependencies:

   ```bash
   mvn clean install
   ```

3. **Configure Database Connection**:

   By default, **SQLite** is used for development. If you're using **MySQL** for production, you’ll need to update the `application.properties` or `application.yml` file located in `src/main/resources/`:

   - **SQLite** (Development):  
     Ensure that the database file path is correctly configured.
   
   - **MySQL** (Production):
     Modify the `application.properties` to reflect your database credentials.

     Example (MySQL):
     ```properties
     spring.datasource.url=jdbc:mysql://localhost:3306/yourdb
     spring.datasource.username=yourusername
     spring.datasource.password=yourpassword
     ```

4. **Set Up Environment Variables**:

   You may want to use environment variables for sensitive information such as your **JWT secret key**, **database credentials**, etc.

   Example:
   ```properties
   jwt.secret=your_secret_key
   ```

5. **Build the Project**:

   Run the following command to build the project and generate the executable JAR file:

   ```bash
   mvn clean package
   ```

   This will create a file called `space-api-1.0-SNAPSHOT.jar` in the `target/` directory.

---

## Running the Application

Once the project is set up and built, you can run the application locally.

1. **Run using Spring Boot Maven Plugin**:
   
   From the project root directory, run:

   ```bash
   mvn spring-boot:run
   ```

2. **Run the JAR File**:
   
   Alternatively, you can run the application using the generated JAR file:

   ```bash
   java -jar target/space-api-1.0-SNAPSHOT.jar
   ```

3. The application should now be running at **http://localhost:8080**.

---

## API Endpoints

The following are the key API endpoints available in the **Space API**:

### **POST /api/v1/auth/register**
- **Description**: Registers a new user by providing an email and password.
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Response**:
  ```json
  {
    "token": "JWT_TOKEN"
  }
  ```

### **POST /api/v1/auth/login**
- **Description**: Logs in an existing user with email and password and returns a JWT token.
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Response**:
  ```json
  {
    "token": "JWT_TOKEN"
  }
  ```

### **GET /api/v1/auth/check**
- **Description**: Checks if the user is authenticated. Requires the `Authorization` header with a valid JWT token.
- **Request headers**:
  ```text
  Authorization: Bearer <your_jwt_token>
  ```

- **Response**:
  ```json
  {
    "email": "user@example.com",
    "status": "authenticated"
  }
  ```

---

## Configuration

### Profile-Based Configuration

You can configure different profiles by creating multiple application properties files:

- **Development (`application-dev.properties`)**:
  Contains development-specific settings (e.g., database, logging level).

- **Production (`application-prod.properties`)**:
  Contains production-specific settings (e.g., database, logging level).

### Running with Specific Profiles:

To run the application with a specific profile, use the following command:

```bash
java -jar target/space-api-1.0-SNAPSHOT.jar --spring.profiles.active=dev
```

Replace `dev` with `prod` for the production profile.

---

## Additional Configuration

### Logging Configuration

The **Spring Boot logging** system allows you to configure how logs are handled. You can define different log levels (e.g., `INFO`, `DEBUG`, `ERROR`) in your `application.properties`:

```properties
logging.level.org.springframework.web=DEBUG
logging.level.com.space=INFO
```

This configuration will log detailed information for HTTP requests and the Space API application.

---