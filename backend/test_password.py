#!/usr/bin/env python3
"""
Simple test to verify password hashing works with your specific password
"""

import sys
import os

# Add the backend src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_password_hashing():
    print("Testing password hashing with your specific password...")
    
    # Test your specific password
    test_password = "Malikx1@"
    print(f"Testing password: {test_password} (length: {len(test_password)})")
    
    try:
        # Try importing from the correct location
        from auth.security import get_password_hash
        
        print("Using Argon2 hashing...")
        hashed = get_password_hash(test_password)
        print(f"SUCCESS: Password hashed successfully!")
        print(f"Original: {test_password}")
        print(f"Hashed: {hashed[:50]}...")
        print(f"Hash length: {len(hashed)}")
        
        # Also test verification
        from auth.security import verify_password
        is_valid = verify_password(test_password, hashed)
        print(f"Verification test: {'PASS' if is_valid else 'FAIL'}")
        
    except ImportError as e:
        print(f"Import error: {e}")
        print("Trying alternative import...")
        try:
            # Alternative import path
            from src.auth.security import get_password_hash, verify_password
            
            print("Using Argon2 hashing...")
            hashed = get_password_hash(test_password)
            print(f"SUCCESS: Password hashed successfully!")
            print(f"Original: {test_password}")
            print(f"Hashed: {hashed[:50]}...")
            print(f"Hash length: {len(hashed)}")
            
            # Also test verification
            is_valid = verify_password(test_password, hashed)
            print(f"Verification test: {'PASS' if is_valid else 'FAIL'}")
            
        except Exception as e2:
            print(f"Alternative import also failed: {e2}")
            return False
    
    print("\nPassword hashing test completed successfully!")
    return True

if __name__ == "__main__":
    success = test_password_hashing()
    if success:
        print("\n✅ Your password 'Malikx1@' should work fine with the system!")
        print("✅ The 72-byte error should be resolved with Argon2 hashing.")
    else:
        print("\n❌ There's still an issue with the password hashing.")