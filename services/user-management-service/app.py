from flask import Flask, request, jsonify
import os
import json
import logging
import uuid
import hashlib
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv('../.env.global')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'recrutai_secret_key_2024')

# In-memory storage for demo (replace with database in production)
users_db = {}
companies_db = {}
sessions_db = {}

# User roles
USER_ROLES = {
    'CANDIDATE': 'candidate',
    'EMPLOYER': 'employer',
    'ADMIN': 'admin'
}

def generate_jwt_token(user_id, role, email):
    """Generate JWT token for user authentication"""
    try:
        payload = {
            'user_id': user_id,
            'role': role,
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=int(os.getenv('JWT_EXPIRATION_HOURS', 24))),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(
            payload,
            os.getenv('JWT_SECRET_KEY', 'recrutai_jwt_secret_2024'),
            algorithm='HS256'
        )
        
        return token
    except Exception as e:
        logger.error(f"Error generating JWT token: {str(e)}")
        return None

def verify_jwt_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'recrutai_jwt_secret_2024'),
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def validate_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Password validation - at least 8 characters, 1 uppercase, 1 lowercase, 1 number"""
    import re
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "user-management-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "total_users": len(users_db),
        "total_companies": len(companies_db),
        "active_sessions": len(sessions_db)
    })

@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """
    Register a new user (candidate or employer)
    
    Expected JSON payload:
    {
        "email": "string (required)",
        "password": "string (required)",
        "role": "candidate|employer (required)",
        "firstName": "string (required)",
        "lastName": "string (required)",
        "phone": "string (optional)",
        "companyName": "string (required for employers)",
        "companySize": "string (optional for employers)",
        "industry": "string (optional for employers)"
    }
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload",
                "code": "MISSING_PAYLOAD"
            }), 400
        
        required_fields = ['email', 'password', 'role', 'firstName', 'lastName']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "code": "MISSING_REQUIRED_FIELDS"
            }), 400
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        role = data.get('role', '').lower()
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        
        # Validate email
        if not validate_email(email):
            return jsonify({
                "error": "Invalid email format",
                "code": "INVALID_EMAIL"
            }), 400
        
        # Check if user already exists
        if email in users_db:
            return jsonify({
                "error": "User with this email already exists",
                "code": "USER_EXISTS"
            }), 409
        
        # Validate role
        if role not in [USER_ROLES['CANDIDATE'], USER_ROLES['EMPLOYER']]:
            return jsonify({
                "error": f"Invalid role. Must be '{USER_ROLES['CANDIDATE']}' or '{USER_ROLES['EMPLOYER']}'",
                "code": "INVALID_ROLE"
            }), 400
        
        # Validate password
        is_valid_password, password_message = validate_password(password)
        if not is_valid_password:
            return jsonify({
                "error": password_message,
                "code": "INVALID_PASSWORD"
            }), 400
        
        # For employers, company name is required
        if role == USER_ROLES['EMPLOYER'] and not data.get('companyName'):
            return jsonify({
                "error": "Company name is required for employers",
                "code": "MISSING_COMPANY_NAME"
            }), 400
        
        # Create user
        user_id = str(uuid.uuid4())
        hashed_password = generate_password_hash(password)
        
        user_data = {
            "userId": user_id,
            "email": email,
            "password": hashed_password,
            "role": role,
            "firstName": first_name,
            "lastName": last_name,
            "phone": data.get('phone', ''),
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "isActive": True,
            "isVerified": False,
            "profileComplete": False
        }
        
        # Add role-specific data
        if role == USER_ROLES['CANDIDATE']:
            user_data.update({
                "skills": [],
                "experience": [],
                "education": [],
                "cvUploaded": False,
                "jobPreferences": {
                    "location": "",
                    "remote": False,
                    "salaryRange": "",
                    "industry": ""
                }
            })
        elif role == USER_ROLES['EMPLOYER']:
            company_id = str(uuid.uuid4())
            company_data = {
                "companyId": company_id,
                "name": data.get('companyName', ''),
                "size": data.get('companySize', ''),
                "industry": data.get('industry', ''),
                "description": "",
                "website": "",
                "location": "",
                "createdAt": datetime.now().isoformat(),
                "ownerId": user_id
            }
            companies_db[company_id] = company_data
            
            user_data.update({
                "companyId": company_id,
                "jobsPosted": 0,
                "candidatesViewed": 0
            })
        
        # Store user
        users_db[email] = user_data
        
        # Generate JWT token
        token = generate_jwt_token(user_id, role, email)
        
        # Create session
        session_id = str(uuid.uuid4())
        sessions_db[session_id] = {
            "sessionId": session_id,
            "userId": user_id,
            "email": email,
            "role": role,
            "createdAt": datetime.now().isoformat(),
            "lastActivity": datetime.now().isoformat(),
            "isActive": True
        }
        
        # Prepare response
        response_data = {
            "user": {
                "userId": user_id,
                "email": email,
                "role": role,
                "firstName": first_name,
                "lastName": last_name,
                "phone": user_data.get('phone', ''),
                "isActive": True,
                "isVerified": False,
                "profileComplete": False,
                "createdAt": user_data['createdAt']
            },
            "authentication": {
                "token": token,
                "sessionId": session_id,
                "expiresIn": f"{os.getenv('JWT_EXPIRATION_HOURS', 24)} hours"
            }
        }
        
        # Add company info for employers
        if role == USER_ROLES['EMPLOYER']:
            response_data["company"] = {
                "companyId": company_id,
                "name": company_data['name'],
                "size": company_data['size'],
                "industry": company_data['industry']
            }
        
        logger.info(f"Successfully registered new {role}: {email}")

        return jsonify(response_data), 201

    except Exception as e:
        logger.error(f"Error in register_user endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """
    Authenticate user login

    Expected JSON payload:
    {
        "email": "string (required)",
        "password": "string (required)"
    }
    """
    try:
        data = request.json

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                "error": "Email and password are required",
                "code": "MISSING_CREDENTIALS"
            }), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        # Check if user exists
        if email not in users_db:
            return jsonify({
                "error": "Invalid email or password",
                "code": "INVALID_CREDENTIALS"
            }), 401

        user = users_db[email]

        # Check password
        if not check_password_hash(user['password'], password):
            return jsonify({
                "error": "Invalid email or password",
                "code": "INVALID_CREDENTIALS"
            }), 401

        # Check if user is active
        if not user.get('isActive', False):
            return jsonify({
                "error": "Account is deactivated",
                "code": "ACCOUNT_DEACTIVATED"
            }), 403

        # Generate JWT token
        token = generate_jwt_token(user['userId'], user['role'], email)

        # Create session
        session_id = str(uuid.uuid4())
        sessions_db[session_id] = {
            "sessionId": session_id,
            "userId": user['userId'],
            "email": email,
            "role": user['role'],
            "createdAt": datetime.now().isoformat(),
            "lastActivity": datetime.now().isoformat(),
            "isActive": True
        }

        # Update last activity
        users_db[email]['updatedAt'] = datetime.now().isoformat()

        # Prepare response
        response_data = {
            "user": {
                "userId": user['userId'],
                "email": email,
                "role": user['role'],
                "firstName": user['firstName'],
                "lastName": user['lastName'],
                "phone": user.get('phone', ''),
                "isActive": user['isActive'],
                "isVerified": user.get('isVerified', False),
                "profileComplete": user.get('profileComplete', False)
            },
            "authentication": {
                "token": token,
                "sessionId": session_id,
                "expiresIn": f"{os.getenv('JWT_EXPIRATION_HOURS', 24)} hours"
            }
        }

        # Add company info for employers
        if user['role'] == USER_ROLES['EMPLOYER'] and user.get('companyId'):
            company = companies_db.get(user['companyId'])
            if company:
                response_data["company"] = {
                    "companyId": company['companyId'],
                    "name": company['name'],
                    "size": company.get('size', ''),
                    "industry": company.get('industry', '')
                }

        logger.info(f"Successful login for {user['role']}: {email}")

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error in login_user endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout_user():
    """
    Logout user and invalidate session
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                "error": "Missing or invalid authorization header",
                "code": "MISSING_AUTH_HEADER"
            }), 401

        token = auth_header.split(' ')[1]

        # Verify token
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({
                "error": "Invalid or expired token",
                "code": "INVALID_TOKEN"
            }), 401

        # Get session ID from request body (optional)
        data = request.json or {}
        session_id = data.get('sessionId')

        # Invalidate session if provided
        if session_id and session_id in sessions_db:
            sessions_db[session_id]['isActive'] = False
            sessions_db[session_id]['loggedOutAt'] = datetime.now().isoformat()

        logger.info(f"Successful logout for user: {payload.get('email')}")

        return jsonify({
            "message": "Successfully logged out",
            "timestamp": datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error in logout_user endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting User Management Service on port 5005...")
    print("✅ Authentication and user management ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/auth/register")
    print("   • POST /api/auth/login")
    print("   • POST /api/auth/logout")
    print("🌐 Service URL: http://localhost:5005")
    print("👥 Features: User registration, Authentication, Session management")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5005, debug=True)
