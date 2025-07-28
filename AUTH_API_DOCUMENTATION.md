# FBR Integration - Authentication API Documentation

## Overview

The FBR Integration Authentication API provides a comprehensive, secure authentication system with the following features:

- **JWT-based authentication** with session management
- **Rate limiting** to prevent brute force attacks
- **Password reset** functionality with email verification
- **Profile management** capabilities
- **Token refresh** mechanism
- **Input validation** and security measures

## Base URL

```
http://localhost:5173/api/auth
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Admin Login

**POST** `/login`

Authenticate an admin user and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@fbr.com",
  "password": "Admin123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@fbr.com",
      "role": "admin",
      "is_verify": true,
      "photo_profile": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "expiresIn": "24h"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

**Error Responses:**
- `400` - Invalid input (missing email/password, invalid email format)
- `401` - Invalid credentials or unverified account
- `429` - Too many login attempts (rate limited)
- `500` - Internal server error

### 2. Admin Logout

**GET** `/logout`

**Headers:** `Authorization: Bearer <token>`

Invalidate the current session and logout the user.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 3. Verify Token

**GET** `/verify-token`

**Headers:** `Authorization: Bearer <token>`

Verify if the current token is valid and get user information.

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "isValid": true,
    "user": {
      "id": 1,
      "email": "admin@fbr.com",
      "role": "admin",
      "is_verify": true
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 4. Get Profile

**GET** `/profile`

**Headers:** `Authorization: Bearer <token>`

Get the current user's profile information.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@fbr.com",
      "role": "admin",
      "is_verify": true,
      "photo_profile": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 5. Update Profile

**PUT** `/profile`

**Headers:** `Authorization: Bearer <token>`

Update the current user's profile information.

**Request Body:**
```json
{
  "email": "newemail@fbr.com",
  "photo_profile": "https://example.com/photo.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "newemail@fbr.com",
      "role": "admin",
      "is_verify": true,
      "photo_profile": "https://example.com/photo.jpg",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 6. Change Password

**PUT** `/change-password`

**Headers:** `Authorization: Bearer <token>`

Change the current user's password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again.",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 7. Forgot Password

**POST** `/forgot-password`

Request a password reset code via email.

**Request Body:**
```json
{
  "email": "admin@fbr.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a reset code has been sent.",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 8. Verify Reset Code

**POST** `/verify-reset-code`

Verify the reset code sent via email.

**Request Body:**
```json
{
  "email": "admin@fbr.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reset code verified successfully",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 9. Reset Password

**PUT** `/reset-password`

Reset password using the verified reset code.

**Request Body:**
```json
{
  "email": "admin@fbr.com",
  "code": "123456",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password.",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### 10. Refresh Token

**POST** `/refresh-token`

**Headers:** `Authorization: Bearer <token>`

Refresh the current JWT token to extend its validity.

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

## Security Features

### Rate Limiting
- Maximum 5 login attempts per email address
- 15-minute lockout period after exceeding limit
- Automatic reset on successful login

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters allowed: `@$!%*?&`

### Session Management
- Maximum 3 concurrent sessions per user
- Automatic cleanup of oldest sessions
- Session invalidation on password change

### Token Security
- JWT tokens with 24-hour expiration
- Secure token generation with timestamps
- Automatic session cleanup for invalid tokens

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 400
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Environment Variables

Required environment variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (for password reset)
EMAIL=your-email@gmail.com
EMAIL_PASS=your-app-password

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_MASTER_DB=fbr_master
```

## Database Schema

### Admin Users Table
```sql
CREATE TABLE admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  verify_token VARCHAR(255),
  is_verify BOOLEAN DEFAULT FALSE,
  verify_code VARCHAR(10),
  photo_profile VARCHAR(255),
  sandbox_test_token VARCHAR(255) DEFAULT '63f756ee-69e4-3b5b-a3b7-0b8656624912',
  sandbox_publish_token VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Admin Sessions Table
```sql
CREATE TABLE admin_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

### Reset Codes Table
```sql
CREATE TABLE reset_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testing

### Default Admin Account
- Email: `admin@fbr.com`
- Password: `admin123`

### Test with cURL

```bash
# Login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fbr.com","password":"admin123"}'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:5173/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Logout
curl -X GET http://localhost:5173/api/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

## Best Practices

1. **Always use HTTPS in production**
2. **Store JWT_SECRET securely**
3. **Implement proper CORS policies**
4. **Use environment variables for configuration**
5. **Monitor rate limiting and failed login attempts**
6. **Regularly rotate JWT secrets**
7. **Implement proper logging for security events**
8. **Use strong password policies**
9. **Implement account lockout after failed attempts**
10. **Regular security audits and updates** 