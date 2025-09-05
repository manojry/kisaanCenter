#!/usr/bin/env python3
"""
Test password hash
"""
import hashlib

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

# Test the password
password = "reddy@123"
hashed = hash_password(password)
print(f"Password: {password}")
print(f"SHA256 Hash: {hashed}")

# The hash we saw in database
db_hash = "87491c9fa1fd4e6c8f72"  # First 20 chars from database
print(f"DB Hash (first 20 chars): {db_hash}")
print(f"Generated Hash (first 20 chars): {hashed[:20]}")
print(f"Match: {hashed[:20] == db_hash}")
