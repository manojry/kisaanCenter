
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, validator
from fastapi import HTTPException, status

class SecurityValidator:
    """Comprehensive input validation for security"""
    
    # Regex patterns for validation
    PATTERNS = {
        'username': r'^[a-zA-Z0-9_]{3,50}$',
        'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'phone': r'^\+?[1-9]\d{1,14}$',
        'password': r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
        'alphanumeric': r'^[a-zA-Z0-9\s]+$',
        'numeric': r'^\d+$',
        'decimal': r'^\d+(\.\d{1,2})?$'
    }
    
    @classmethod
    def validate_pattern(cls, value: str, pattern_name: str) -> bool:
        """Validate value against predefined pattern"""
        if pattern_name not in cls.PATTERNS:
            raise ValueError(f"Unknown pattern: {pattern_name}")
        
        pattern = cls.PATTERNS[pattern_name]
        return bool(re.match(pattern, value))
    
    @classmethod
    def validate_length(cls, value: str, min_length: int = 0, max_length: int = 1000) -> bool:
        """Validate string length"""
        return min_length <= len(value) <= max_length
    
    @classmethod
    def validate_file_upload(cls, filename: str, allowed_extensions: List[str]) -> bool:
        """Validate file upload security"""
        if not filename:
            return False
        # Check file extension
        file_ext = filename.lower().split('.')[-1]
        if file_ext not in [ext.lower() for ext in allowed_extensions]:
            return False
        # Check for dangerous filenames
        dangerous_names = ['..', '/', '\\', 'con', 'prn', 'aux', 'nul']
        filename_lower = filename.lower()
        for dangerous in dangerous_names:
            if dangerous in filename_lower:
                return False
        return True
    
    @classmethod
    def validate_json_structure(cls, data: Dict[str, Any], required_fields: List[str]) -> bool:
        """Validate JSON structure and required fields"""
        if not isinstance(data, dict):
            return False
        
        for field in required_fields:
            if field not in data:
                return False
        
        return True

class SecureUserInput(BaseModel):
    """Secure user input validation model"""
    username: str
    password: str
    email: Optional[str] = None
    contact: Optional[str] = None
    
    @validator('username')
    def validate_username(cls, v):
        if not SecurityValidator.validate_pattern(v, 'username'):
            raise ValueError('Invalid username format')
        if not SecurityValidator.validate_length(v, 3, 50):
            raise ValueError('Username must be 3-50 characters')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not SecurityValidator.validate_pattern(v, 'password'):
            raise ValueError(
                'Password must contain at least 8 characters with uppercase, '
                'lowercase, number and special character'
            )
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v and not SecurityValidator.validate_pattern(v, 'email'):
            raise ValueError('Invalid email format')
        return v
    
    @validator('contact')
    def validate_contact(cls, v):
        if v and not SecurityValidator.validate_pattern(v, 'phone'):
            raise ValueError('Invalid phone number format')
        return v

def validate_request_data(data: Dict[str, Any], validation_rules: Dict[str, Any]) -> Dict[str, Any]:
    """Validate request data against security rules"""
    errors = []
    
    for field, rules in validation_rules.items():
        if field not in data:
            if rules.get('required', False):
                errors.append(f"Field '{field}' is required")
            continue
        
        value = data[field]
        
        # Type validation
        if 'type' in rules:
            expected_type = rules['type']
            if not isinstance(value, expected_type):
                errors.append(f"Field '{field}' must be of type {expected_type.__name__}")
                continue
        
        # String validations
        if isinstance(value, str):
            # Length validation
            if 'min_length' in rules or 'max_length' in rules:
                min_len = rules.get('min_length', 0)
                max_len = rules.get('max_length', 1000)
                if not SecurityValidator.validate_length(value, min_len, max_len):
                    errors.append(f"Field '{field}' length must be between {min_len} and {max_len}")
            
            # Pattern validation
            if 'pattern' in rules:
                if not SecurityValidator.validate_pattern(value, rules['pattern']):
                    errors.append(f"Field '{field}' has invalid format")
            
            # SQL injection check
            if not SQLInjectionProtection.validate_input(value):
                errors.append(f"Field '{field}' contains potentially dangerous content")
        
        # Numeric validations
        if isinstance(value, (int, float)):
            if 'min_value' in rules and value < rules['min_value']:
                errors.append(f"Field '{field}' must be at least {rules['min_value']}")
            if 'max_value' in rules and value > rules['max_value']:
                errors.append(f"Field '{field}' must be at most {rules['max_value']}")
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"validation_errors": errors}
        )
    
    return data

class SQLInjectionProtection:
    """SQL Injection protection utilities"""
    
    @staticmethod
    def validate_input(input_str: str) -> bool:
        """Basic SQL injection detection"""
        if not isinstance(input_str, str):
            return True
            
        # Common SQL injection patterns
        sql_patterns = [
            r"(?:--|#|\/\*|\*\/|--|\n)",
            r"(?:union\s+(?:all\s+)?select)",
            r"(?:insert\s+into|update\s+.*set|delete\s+from)",
            r"(?:drop\s+(?:table|database|view|index))",
            r"(?:create\s+(?:table|database|view|index))",
            r"(?:exec\s+|\bexecute\b)",
            r"(?:select\s+.*from\s+.*where)",
            r"(?:benchmark\s*\(|sleep\s*\()"
        ]
        
        input_lower = input_str.lower()
        
        for pattern in sql_patterns:
            if re.search(pattern, input_lower):
                return False
                
        return True
