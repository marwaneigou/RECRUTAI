from flask import Flask, request, jsonify
import os
import json
import logging
import uuid
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

def customize_cv_with_openai(cv_data, job_data):
    """
    Use OpenAI to customize a CV for a specific job
    """
    try:
        # For demo purposes, return sample customization
        customization = {
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
            ],
            "highlightedSkills": ["JavaScript", "React", "Node.js"],
            "tailoredSummary": "Experienced frontend developer with strong React expertise"
        }
        return customization
        
    except Exception as e:
        logger.error(f"Error customizing CV with OpenAI: {str(e)}")
        return {
            "customizations": [],
            "recommendations": ["Unable to provide customizations"],
            "highlightedSkills": [],
            "tailoredSummary": "Professional summary could not be generated"
        }

def generate_cover_letter_with_openai(candidate_data, job_data, style="professional", tone="formal", length="medium"):
    """
    Use OpenAI to generate a personalized cover letter
    """
    try:
        # For demo purposes, return sample cover letter
        letter_content = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job_data.get('jobTitle', 'position')} at {job_data.get('company', 'your company')}. With my extensive experience in web development and passion for creating innovative solutions, I am confident that I would be a valuable addition to your team.

My background in JavaScript, React, and Node.js aligns perfectly with your requirements. In my previous role, I successfully led development projects that improved application performance by 30% and mentored junior developers.

I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success. Thank you for considering my application.

Sincerely,
{candidate_data.get('candidateName', 'Candidate')}"""

        letter_data = {
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
        return letter_data
        
    except Exception as e:
        logger.error(f"Error generating cover letter with OpenAI: {str(e)}")
        return {
            "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the position. Unfortunately, I was unable to generate a personalized cover letter at this time.\n\nSincerely,\n[Your Name]",
            "suggestions": ["Please check your input data and try again"],
            "keyPoints": ["Unable to generate key points"]
        }

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
        
        cv_data = data.get('cvData', {})
        job_data = data.get('jobData', {})
        template = data.get('template', 'professional')
        format_type = data.get('format', 'pdf')
        
        # Get customization recommendations using OpenAI
        customization = customize_cv_with_openai(cv_data, job_data)
        
        # Generate unique ID for the customized CV
        custom_cv_id = f"custom_cv_{uuid.uuid4().hex[:8]}"
        document_url = f"/documents/{custom_cv_id}.{format_type}"
        
        # Prepare response
        response_data = {
            "customizedCv": {
                "id": custom_cv_id,
                "documentUrl": document_url,
                "customizations": customization.get('customizations', []),
                "format": format_type,
                "recommendations": customization.get('recommendations', []),
                "highlightedSkills": customization.get('highlightedSkills', []),
                "tailoredSummary": customization.get('tailoredSummary', '')
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
        
        # Extract candidate and job data
        candidate_data = {
            'candidateName': data.get('candidateName', ''),
            'candidateBackground': data.get('candidateBackground', ''),
            'keySkills': data.get('keySkills', []),
            'relevantExperience': data.get('relevantExperience', [])
        }
        
        job_data = {
            'jobTitle': data.get('jobTitle', ''),
            'company': data.get('company', ''),
            'jobDescription': data.get('jobDescription', '')
        }
        
        style = data.get('style', 'professional')
        tone = data.get('tone', 'formal')
        length = data.get('length', 'medium')
        format_type = data.get('format', 'pdf')
        
        # Generate cover letter using OpenAI
        letter_data = generate_cover_letter_with_openai(candidate_data, job_data, style, tone, length)
        
        # Generate unique ID for the cover letter
        cover_letter_id = f"cover_letter_{uuid.uuid4().hex[:8]}"
        document_url = f"/documents/{cover_letter_id}.{format_type}"
        
        # Prepare response
        response_data = {
            "coverLetter": {
                "id": cover_letter_id,
                "documentUrl": document_url,
                "content": letter_data.get('content', ''),
                "format": format_type,
                "suggestions": letter_data.get('suggestions', []),
                "keyPoints": letter_data.get('keyPoints', [])
            }
        }
        
        logger.info(f"Successfully generated cover letter with ID: {cover_letter_id}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in generate_cover_letter endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/documents/templates', methods=['GET'])
def get_templates():
    """
    Get available document templates
    """
    template_type = request.args.get('type', 'cv')
    
    if template_type == 'cv':
        templates = [
            {"id": "professional", "name": "Professional", "type": "cv", "description": "Clean and professional CV template"},
            {"id": "creative", "name": "Creative", "type": "cv", "description": "Modern and creative CV template"},
            {"id": "minimal", "name": "Minimal", "type": "cv", "description": "Simple and minimal CV template"}
        ]
    else:
        templates = [
            {"id": "formal", "name": "Formal", "type": "cover_letter", "description": "Traditional formal cover letter"},
            {"id": "modern", "name": "Modern", "type": "cover_letter", "description": "Contemporary cover letter style"},
            {"id": "creative", "name": "Creative", "type": "cover_letter", "description": "Creative and engaging cover letter"}
        ]
    
    return jsonify({"templates": templates})

if __name__ == '__main__':
    print("🚀 Starting Document Service on port 5003...")
    print("✅ OpenAI integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/documents/customize-cv")
    print("   • POST /api/documents/generate-cover-letter")
    print("   • GET  /api/documents/templates")
    print("🌐 Service URL: http://localhost:5003")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5003, debug=True)
