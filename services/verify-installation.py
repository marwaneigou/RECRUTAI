#!/usr/bin/env python3
"""
RECRUTAI AI Services - Installation Verification
Verifies that all services are properly installed and configured
"""

import requests
import time
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.global')

def check_service_health(service_name, port):
    """Check if a service is running and healthy"""
    try:
        url = f"http://localhost:{port}/health"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {service_name}: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ {service_name}: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {service_name}: Service not running")
        return False
    except Exception as e:
        print(f"❌ {service_name}: Error - {str(e)}")
        return False

def check_openai_configuration():
    """Check if OpenAI API key is configured"""
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ OpenAI API Key: Not configured")
        return False
    elif api_key == 'your_openai_api_key_here':
        print("❌ OpenAI API Key: Default placeholder - needs real key")
        return False
    elif api_key.startswith('sk-'):
        print("✅ OpenAI API Key: Configured")
        return True
    else:
        print("❌ OpenAI API Key: Invalid format")
        return False

def test_service_endpoint(service_name, port, endpoint, method='GET', data=None):
    """Test a specific service endpoint"""
    try:
        url = f"http://localhost:{port}{endpoint}"
        
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        
        if response.status_code in [200, 201]:
            print(f"✅ {service_name} {endpoint}: Working")
            return True
        else:
            print(f"❌ {service_name} {endpoint}: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ {service_name} {endpoint}: Error - {str(e)}")
        return False

def main():
    """Main verification function"""
    print("🔍 RECRUTAI AI Services - Installation Verification")
    print("=" * 60)
    
    # Check OpenAI configuration
    print("\n📋 Configuration Check:")
    openai_ok = check_openai_configuration()
    
    # Define services
    services = [
        ("Analysis Service", 5002),
        ("Matching Service", 5001),
        ("Document Service", 5003),
        ("Recommendation Service", 5004)
    ]
    
    # Check service health
    print("\n🏥 Health Check:")
    all_healthy = True
    for service_name, port in services:
        if not check_service_health(service_name, port):
            all_healthy = False
    
    # Test key endpoints if services are running
    if all_healthy:
        print("\n🧪 Endpoint Testing:")
        
        # Test Analysis Service
        cv_data = {
            "cvText": "John Doe\nSoftware Developer\nSkills: JavaScript, React, Node.js"
        }
        test_service_endpoint("Analysis Service", 5002, "/api/analyze/cv", "POST", cv_data)
        
        # Test Matching Service
        match_data = {
            "jobDescription": "Looking for a React developer with 3+ years experience"
        }
        test_service_endpoint("Matching Service", 5001, "/api/match/job-to-candidates", "POST", match_data)
        
        # Test Document Service
        doc_data = {
            "candidateName": "John Doe",
            "jobTitle": "Frontend Developer",
            "company": "TechCorp"
        }
        test_service_endpoint("Document Service", 5003, "/api/documents/generate-cover-letter", "POST", doc_data)
        
        # Test Recommendation Service
        rec_data = {
            "candidateProfile": {
                "skills": ["JavaScript", "React"],
                "experience": "3 years"
            }
        }
        test_service_endpoint("Recommendation Service", 5004, "/api/recommendations/jobs", "POST", rec_data)
    
    # Summary
    print("\n" + "=" * 60)
    if all_healthy and openai_ok:
        print("🎉 SUCCESS: All services are properly installed and configured!")
        print("\n📋 Next Steps:")
        print("1. Your RECRUTAI AI services are ready to use")
        print("2. Integrate with your main application")
        print("3. Start processing CVs and job descriptions")
    else:
        print("⚠️  ISSUES DETECTED:")
        if not openai_ok:
            print("- Configure your OpenAI API key in .env.global")
        if not all_healthy:
            print("- Start services using: start-all-services.bat")
            print("- Check service logs for errors")
    
    print("\n🔗 Service URLs:")
    for service_name, port in services:
        print(f"• {service_name}: http://localhost:{port}")

if __name__ == "__main__":
    main()
