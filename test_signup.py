#!/usr/bin/env python3
"""
Simple script to test the exact signup request that's failing
"""

import requests
import json

def test_signup():
    # Backend URL (adjust if different)
    backend_url = "http://localhost:8000"
    
    # Your credentials
    signup_data = {
        "email": "leoali851@gmail.com",
        "password": "Malikx1@"
    }
    
    print("Testing signup with your credentials...")
    print(f"Email: {signup_data['email']}")
    print(f"Password: {signup_data['password']}")
    
    try:
        response = requests.post(
            f"{backend_url}/auth/register",
            headers={"Content-Type": "application/json"},
            json=signup_data
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Signup successful!")
        else:
            print("❌ Signup failed")
            
    except Exception as e:
        print(f"❌ Error making request: {e}")
        print("Make sure the backend server is running on http://localhost:8000")

if __name__ == "__main__":
    test_signup()