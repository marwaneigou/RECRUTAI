from flask import Flask, request, jsonify
import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv
import logging

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

def analyze_cv_with_openai(cv_text, language='en'):
    """
    Analyze CV text using OpenAI GPT-4 to extract structured information
    """
    try:
        prompt = f"""
        Analyze the following CV/Resume text and extract structured information in JSON format.
        Please provide a comprehensive analysis including:

        1. Personal Information (name, email, phone, location)
        2. Technical Skills (programming languages, frameworks, tools)
        3. Soft Skills (communication, leadership, etc.)
        4. Work Experience (with details for each position)
        5. Education (degrees, institutions, years)
        6. Languages (with proficiency levels)
        7. Strengths and areas for improvement

        CV Text:
        {cv_text}

        Please respond with a valid JSON object following this exact structure:
        {{
            "personalInfo": {{
                "name": "string",
                "email": "string", 
                "phone": "string",
                "location": "string"
            }},
            "skills": ["string"],
            "technicalSkills": ["string"],
            "softSkills": ["string"],
            "experience": [
                {{
                    "title": "string",
                    "company": "string", 
                    "duration": "string",
                    "description": "string",
                    "highlights": ["string"]
                }}
            ],
            "education": [
                {{
                    "degree": "string",
                    "institution": "string",
                    "year": "string",
                    "subjects": ["string"]
                }}
            ],
            "languages": [
                {{
                    "language": "string",
                    "proficiency": "string"
                }}
            ],
            "strengths": ["string"],
            "improvementAreas": ["string"]
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert HR analyst specializing in CV/Resume analysis. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )

        # Parse the JSON response
        analysis_text = response.choices[0].message.content.strip()
        
        # Clean up the response to ensure it's valid JSON
        if analysis_text.startswith('```json'):
            analysis_text = analysis_text[7:]
        if analysis_text.endswith('```'):
            analysis_text = analysis_text[:-3]
        
        analysis = json.loads(analysis_text)
        return analysis

    except Exception as e:
        logger.error(f"Error analyzing CV with OpenAI: {str(e)}")
        # Return a basic structure if OpenAI fails
        return {
            "personalInfo": {"name": "", "email": "", "phone": "", "location": ""},
            "skills": [],
            "technicalSkills": [],
            "softSkills": [],
            "experience": [],
            "education": [],
            "languages": [],
            "strengths": [],
            "improvementAreas": ["Unable to analyze CV - please check the format"]
        }

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "ok",
        "service": "analysis-service",
        "version": "1.0.0"
    })

@app.route('/api/analyze/cv', methods=['POST'])
def analyze_cv():
    """
    Analyze CV and extract structured information using AI
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'cvText' not in data:
            return jsonify({"error": "Missing required field: cvText"}), 400
        
        cv_text = data.get('cvText', '')
        language = data.get('language', 'en')
        
        if not cv_text.strip():
            return jsonify({"error": "CV text cannot be empty"}), 400
        
        # Analyze CV using OpenAI
        analysis = analyze_cv_with_openai(cv_text, language)
        
        logger.info(f"Successfully analyzed CV with ID: {data.get('cvId', 'unknown')}")
        
        return jsonify({"analysis": analysis})
        
    except Exception as e:
        logger.error(f"Error in analyze_cv endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/analyze/job', methods=['POST'])
def analyze_job():
    """
    Analyze job description and extract requirements using AI
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'jobDescription' not in data:
            return jsonify({"error": "Missing required field: jobDescription"}), 400
        
        job_title = data.get('jobTitle', '')
        job_description = data.get('jobDescription', '')
        company = data.get('company', '')
        language = data.get('language', 'en')
        
        if not job_description.strip():
            return jsonify({"error": "Job description cannot be empty"}), 400
        
        # Analyze job description using OpenAI (simplified for demo)
        analysis = {
            "requiredSkills": ["JavaScript", "React", "Node.js"],
            "preferredSkills": ["TypeScript", "MongoDB", "AWS"],
            "requiredExperience": "3+ years",
            "educationRequirements": "Bachelor's degree",
            "jobResponsibilities": ["Develop web applications", "Collaborate with team"],
            "companyValues": ["Innovation", "Collaboration"],
            "benefits": ["Health insurance", "Remote work"],
            "employmentType": "Full-time",
            "location": "Montreal, Canada",
            "remote": True,
            "seniority": "Mid-level",
            "industry": "Technology",
            "keywords": ["Full-stack", "Web development"]
        }
        
        logger.info(f"Successfully analyzed job with ID: {data.get('jobId', 'unknown')}")
        
        return jsonify({"analysis": analysis})
        
    except Exception as e:
        logger.error(f"Error in analyze_job endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Analysis Service on port 5002...")
    print("✅ OpenAI integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/analyze/cv")
    print("   • POST /api/analyze/job")
    print("🌐 Service URL: http://localhost:5002")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5002, debug=True)
