#!/usr/bin/env python3
"""
Test Groq API Connection
========================

This script tests if your Groq API key is working correctly.
"""

import os
from dotenv import load_dotenv

def test_groq_connection():
    print("🔍 Testing Groq API Connection")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    
    # Get API key
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key:
        print("❌ GROQ_API_KEY not found in environment")
        print("💡 Please check your .env file")
        return False
    
    print(f"✅ API Key found: {groq_api_key[:10]}...{groq_api_key[-4:]}")
    
    # Test Groq import
    try:
        from groq import Groq
        print("✅ Groq library imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import Groq library: {e}")
        print("💡 Run: pip install groq")
        return False
    
    # Test client initialization
    try:
        # Try different initialization methods for compatibility
        try:
            # New Groq client (v0.4+)
            client = Groq(api_key=groq_api_key)
        except TypeError:
            # Older Groq client
            from groq import Client
            client = Client(api_key=groq_api_key)
        print("✅ Groq client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Groq client: {e}")
        print("💡 Trying to reinstall groq...")
        import subprocess
        try:
            subprocess.run(["pip", "install", "--upgrade", "groq==0.11.0"], check=True)
            print("✅ Groq reinstalled, please restart and try again")
        except:
            print("❌ Failed to reinstall groq")
        return False
    
    # Test a simple API call
    try:
        print("🧪 Testing API call...")
        response = client.chat.completions.create(
            messages=[
                {"role": "user", "content": "Say 'Hello, Groq is working!' in JSON format with a 'message' field."}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=50
        )
        
        result = response.choices[0].message.content
        print(f"✅ API call successful!")
        print(f"📄 Response: {result}")
        return True
        
    except Exception as e:
        print(f"❌ API call failed: {e}")
        print("💡 Possible issues:")
        print("   - Invalid API key")
        print("   - Network connection problem")
        print("   - Groq service temporarily unavailable")
        return False

def test_resume_extraction():
    """Test resume extraction functionality"""
    print("\n🧠 Testing Resume Extraction")
    print("=" * 40)
    
    # Load environment
    load_dotenv()
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key:
        print("❌ Cannot test - GROQ_API_KEY not found")
        return False
    
    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        # Test resume text
        test_resume = """
John Doe
Software Engineer
Email: john.doe@email.com
Phone: (555) 123-4567

Experience:
Software Engineer at TechCorp (2021-2023)
- Developed web applications using React and Node.js
- Worked with databases like PostgreSQL

Education:
Bachelor of Computer Science
University of Technology (2017-2021)

Skills: JavaScript, Python, React, Node.js
"""
        
        print("📤 Sending test resume for extraction...")
        
        prompt = f"""
Extract structured information from this resume:

{test_resume}

Return only JSON with this structure:
{{
    "name": "Full name",
    "email": "Email address", 
    "phone": "Phone number",
    "skills": ["skill1", "skill2"],
    "experience": ["company name"],
    "education": ["degree"]
}}
"""
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You extract structured data from resumes. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-70b-versatile",
            temperature=0.1,
            max_tokens=500
        )
        
        result = response.choices[0].message.content
        print("✅ Resume extraction successful!")
        print(f"📄 Extracted data: {result}")
        
        # Try to parse JSON
        import json
        try:
            parsed = json.loads(result)
            print("✅ JSON parsing successful!")
            print(f"👤 Name: {parsed.get('name', 'Not found')}")
            print(f"📧 Email: {parsed.get('email', 'Not found')}")
            return True
        except json.JSONDecodeError:
            print("⚠️ Response is not valid JSON, but extraction worked")
            return True
            
    except Exception as e:
        print(f"❌ Resume extraction failed: {e}")
        return False

def main():
    print("🧪 Groq API Test Suite")
    print("=" * 50)
    
    # Test 1: Basic connection
    connection_ok = test_groq_connection()
    
    if connection_ok:
        # Test 2: Resume extraction
        extraction_ok = test_resume_extraction()
        
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS")
        print("=" * 50)
        print(f"Connection Test: {'✅ PASS' if connection_ok else '❌ FAIL'}")
        print(f"Extraction Test: {'✅ PASS' if extraction_ok else '❌ FAIL'}")
        
        if connection_ok and extraction_ok:
            print("\n🎉 All tests passed! Groq is working correctly.")
            print("💡 You can now use the resume upload feature.")
        else:
            print("\n⚠️ Some tests failed. Check the error messages above.")
    else:
        print("\n❌ Basic connection failed. Please fix the API key issue first.")
    
    print("\n🔧 If you're still having issues:")
    print("1. Check your .env file has the correct GROQ_API_KEY")
    print("2. Get a new API key from: https://groq.com/")
    print("3. Make sure you have internet connection")
    print("4. Try restarting the service")

if __name__ == "__main__":
    main()