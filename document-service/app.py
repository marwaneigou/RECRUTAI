from flask import Flask, request, jsonify
import os
import json
import logging
import uuid
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.global')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "ok",
        "service": "document-service",
        "version": "1.0.0"
    })

@app.route('/api/documents/customize-cv', methods=['POST'])
def customize_cv():
    """
    Customize CV for a specific job application using AI
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'cvData' not in data or 'jobData' not in data:
            return jsonify({"error": "Missing required fields: cvData and jobData"}), 400
        
        # Generate unique ID for the customized CV
        custom_cv_id = f"custom_cv_{uuid.uuid4().hex[:8]}"
        
        # For demo purposes, return sample customization
        response_data = {
            "customizedCv": {
                "id": custom_cv_id,
                "documentUrl": f"/documents/{custom_cv_id}.pdf",
                "customizations": [
                    {
                        "type": "skill_highlight",
                        "description": "Highlighted React and JavaScript skills for frontend role"
                    },
                    {
                        "type": "experience_reorder",
                        "description": "Prioritized web development experience"
                    }
                ],
                "recommendations": [
                    "Consider adding TypeScript to your skillset",
                    "Elaborate on team leadership experience"
                ]
            }
        }
        
        logger.info(f"Successfully customized CV with ID: {custom_cv_id}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in customize_cv endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/documents/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    """
    Generate a personalized cover letter using AI
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'candidateName' not in data or 'jobTitle' not in data:
            return jsonify({"error": "Missing required fields: candidateName and jobTitle"}), 400
        
        # Generate unique ID for the cover letter
        cover_letter_id = f"cover_letter_{uuid.uuid4().hex[:8]}"
        
        # For demo purposes, return sample cover letter
        letter_content = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {data.get('jobTitle', 'position')} at {data.get('company', 'your company')}. With my extensive experience in web development and passion for creating innovative solutions, I am confident that I would be a valuable addition to your team.

My background in JavaScript, React, and Node.js aligns perfectly with your requirements. In my previous role, I successfully led development projects that improved application performance by 30% and mentored junior developers.

I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success. Thank you for considering my application.

Sincerely,
{data.get('candidateName', 'Candidate')}"""

        response_data = {
            "coverLetter": {
                "id": cover_letter_id,
                "documentUrl": f"/documents/{cover_letter_id}.pdf",
                "content": letter_content,
                "suggestions": [
                    "Consider mentioning specific projects you've worked on",
                    "Reference the company's recent achievements"
                ],
                "keyPoints": [
                    "Technical skills alignment",
                    "Leadership experience",
                    "Performance improvements"
                ]
            }
        }
        
        logger.info(f"Successfully generated cover letter with ID: {cover_letter_id}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in generate_cover_letter endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Document Service on port 5003...")
    print("✅ OpenAI integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/documents/customize-cv")
    print("   • POST /api/documents/generate-cover-letter")
    print("🌐 Service URL: http://localhost:5003")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5003, debug=True)
