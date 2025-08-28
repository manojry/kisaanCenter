# Environment Configuration Guide

## Overview
This application uses environment variables for all sensitive configuration data. All database credentials and API keys must be provided through environment variables or a `.env` file.

## Setup Instructions

### 1. Create Environment File
Copy the example environment file and customize it:
```bash
cp .env.example .env
```

### 2. Required Environment Variables
Update your `.env` file with the following **required** variables:

```bash
# Database Configuration (All Required)
DB_HOST=your_database_host
DB_NAME=your_database_name  
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# API Security (Required)
SECRET_KEY=your_jwt_secret_key_here
```

### 3. Optional Environment Variables
These have sensible defaults but can be customized:

```bash
# Database Connection
DB_PORT=5432                    # Default: 5432
DB_SSL_MODE=require            # Default: require

# Database Pool Settings
DB_POOL_SIZE=10                # Default: 10
DB_MAX_OVERFLOW=20             # Default: 20
DB_POOL_RECYCLE=3600          # Default: 3600 (1 hour)
DB_POOL_PRE_PING=true         # Default: true

# API Configuration  
API_HOST=0.0.0.0              # Default: 0.0.0.0
API_PORT=8000                 # Default: 8000
DEBUG=true                    # Default: true
ACCESS_TOKEN_EXPIRE_MINUTES=30 # Default: 30
ALGORITHM=HS256               # Default: HS256

# Application Settings
ENVIRONMENT=development        # Default: development
LOG_LEVEL=INFO                # Default: INFO
```

### 4. Security Best Practices

#### Database Password
- Use a strong, unique password for your database
- Never commit passwords to version control
- Consider using database connection strings with SSL

#### JWT Secret Key
- Generate a cryptographically secure random key
- Example generation (Python):
  ```python
  import secrets
  print(secrets.token_urlsafe(32))
  ```
- Example generation (OpenSSL):
  ```bash
  openssl rand -base64 32
  ```

### 5. Environment Validation
The application automatically validates that all required environment variables are present on startup. If any required variables are missing, the application will:
- Display an error message listing the missing variables
- Exit with a non-zero status code
- Provide guidance on how to set the variables

### 6. File Locations
- **Production**: Set environment variables directly in your deployment environment
- **Development**: Use `.env` file in the project root directory
- **Docker**: Use Docker environment files or container environment variables

### 7. Testing
All test files also require the same environment variables. Ensure your `.env` file is properly configured before running tests.

## Troubleshooting

### Common Issues
1. **"Missing required environment variables" error**
   - Check that your `.env` file exists and is in the correct location
   - Verify all required variables are set (no empty values)
   - Ensure no typos in variable names

2. **Database connection errors**
   - Verify database host, port, and credentials
   - Check network connectivity to database server
   - Ensure SSL mode matches your database configuration

3. **JWT token errors**
   - Verify SECRET_KEY is set and not empty
   - Ensure ALGORITHM matches expected value (HS256)

### Debug Mode
Set `DEBUG=true` in your environment to see more detailed error messages during development.

## Migration from Hardcoded Values
If you're upgrading from a version with hardcoded credentials:
1. All hardcoded values have been removed
2. The application will now fail to start without proper environment configuration
3. Review your existing configuration and set appropriate environment variables
4. Test the application thoroughly after migration

## Support
For additional help with environment configuration, refer to the main project documentation or create an issue in the project repository.
