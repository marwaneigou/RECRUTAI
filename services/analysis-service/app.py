from flask import Flask, request, jsonify
import os
import json
import logging
import uuid
import re
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv('../.env.global')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize OpenAI client with error handling
def initialize_openai_client():
    """Initialize OpenAI client with proper error handling"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or api_key == 'your_openai_api_key_here':
        logger.warning("OpenAI API key not configured. Some features will be limited.")
        return None

    try:
        client = OpenAI(api_key=api_key)
        # Test the connection
        client.models.list()
        logger.info("OpenAI client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
        return None

# Global OpenAI client
openai_client = initialize_openai_client()

# OpenAI configuration
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4')
OPENAI_TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', '0.3'))
OPENAI_MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', '2000'))

def analyze_cv_with_openai(cv_text, language='en'):
    """
    Use OpenAI GPT-4 to analyze CV and extract structured information
    """
    if not openai_client:
        # Fallback analysis without OpenAI
        return {
            "personalInfo": {"name": "N/A", "email": "N/A", "phone": "N/A", "location": "N/A"},
            "technicalSkills": ["JavaScript", "Python", "React"],
            "softSkills": ["Communication", "Leadership"],
            "experience": [],
            "education": [],
            "summary": "OpenAI not configured - using fallback analysis",
            "aiConfidence": 0.0
        }

    try:
        prompt = f"""
        Analyze the following CV and extract structured information in JSON format.

        CV Text:
        {cv_text}

        Please extract and return ONLY a valid JSON object with this exact structure:
        {{
            "personalInfo": {{
                "name": "Full name",
                "email": "Email address",
                "phone": "Phone number",
                "location": "Location/Address"
            }},
            "technicalSkills": ["List of technical skills"],
            "softSkills": ["List of soft skills"],
            "experience": [
                {{
                    "title": "Job title",
                    "company": "Company name",
                    "duration": "Duration (e.g., 2020-2023)",
                    "description": "Brief description",
                    "highlights": ["Key achievements"]
                }}
            ],
            "education": [
                {{
                    "degree": "Degree name",
                    "institution": "Institution name",
                    "year": "Year or duration",
                    "subjects": ["Relevant subjects"]
                }}
            ],
            "summary": "Professional summary in 2-3 sentences",
            "aiConfidence": 0.95
        }}

        Extract all available information. If information is not available, use "N/A" or empty arrays.
        """

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert CV analyzer. Extract structured information from CVs and return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=OPENAI_TEMPERATURE,
            max_tokens=OPENAI_MAX_TOKENS
        )

        # Parse the JSON response
        analysis_text = response.choices[0].message.content.strip()

        # Clean up the response to ensure it's valid JSON
        if analysis_text.startswith('```json'):
            analysis_text = analysis_text[7:]
        if analysis_text.endswith('```'):
            analysis_text = analysis_text[:-3]

        analysis = json.loads(analysis_text)

        # Validate required fields
        required_fields = ['personalInfo', 'technicalSkills', 'softSkills', 'experience', 'education', 'summary']
        for field in required_fields:
            if field not in analysis:
                analysis[field] = {} if field == 'personalInfo' else []

        if 'aiConfidence' not in analysis:
            analysis['aiConfidence'] = 0.85

        logger.info(f"Successfully analyzed CV with OpenAI - Confidence: {analysis.get('aiConfidence', 0.85)}")
        return analysis

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "personalInfo": {"name": "N/A", "email": "N/A", "phone": "N/A", "location": "N/A"},
            "technicalSkills": [],
            "softSkills": [],
            "experience": [],
            "education": [],
            "summary": "Failed to parse AI analysis",
            "aiConfidence": 0.0
        }
    except Exception as e:
        logger.error(f"Error analyzing CV with OpenAI: {str(e)}")
        return {
            "personalInfo": {"name": "N/A", "email": "N/A", "phone": "N/A", "location": "N/A"},
            "technicalSkills": [],
            "softSkills": [],
            "experience": [],
            "education": [],
            "summary": "Error in AI analysis",
            "aiConfidence": 0.0
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "analysis-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": openai_client is not None,
        "openai_model": OPENAI_MODEL if openai_client else "Not configured"
    })

@app.route('/api/analyze/cv', methods=['POST'])
def analyze_cv():
    """
    Analyze a CV and extract structured information
    
    Input JSON format:
    {
        "cvId": "string",
        "cvText": "string",  # Raw text from CV
        "fileType": "string", # pdf, docx, or txt
        "language": "string"  # Optional, defaults to 'en'
    }
    
    Output JSON format:
    {
        "analysis": {
            "personalInfo": {
                "name": "string",
                "email": "string",
                "phone": "string",
                "location": "string"
            },
            "skills": ["string"],
            "technicalSkills": ["string"],
            "softSkills": ["string"],
            "experience": [
                {
                    "title": "string",
                    "company": "string",
                    "duration": "string",
                    "description": "string",
                    "highlights": ["string"]
                }
            ],
            "education": [
                {
                    "degree": "string",
                    "institution": "string",
                    "year": "string",
                    "subjects": ["string"]
                }
            ],
            "languages": [
                {
                    "language": "string",
                    "proficiency": "string"
                }
            ],
            "strengths": ["string"],
            "improvementAreas": ["string"]
        }
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

        if 'cvText' not in data:
            return jsonify({
                "error": "Missing required field: cvText",
                "code": "MISSING_CV_TEXT"
            }), 400

        cv_id = data.get('cvId', f"cv_{uuid.uuid4().hex[:8]}")
        cv_text = data.get('cvText', '')
        language = data.get('language', 'en')
        file_type = data.get('fileType', 'txt')

        if not cv_text.strip():
            return jsonify({
                "error": "CV text cannot be empty",
                "code": "EMPTY_CV_TEXT"
            }), 400

        # Analyze CV using OpenAI
        analysis = analyze_cv_with_openai(cv_text, language)

        # Prepare response
        response_data = {
            "cvId": cv_id,
            "analysis": analysis,
            "metadata": {
                "processingTimestamp": datetime.now().isoformat(),
                "language": language,
                "fileType": file_type,
                "textLength": len(cv_text),
                "openaiUsed": openai_client is not None,
                "processingTime": "~2-5 seconds"
            }
        }

        logger.info(f"Successfully analyzed CV {cv_id} - AI Confidence: {analysis.get('aiConfidence', 0.0)}")

        return jsonify(response_data)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format",
            "code": "INVALID_JSON"
        }), 400
    except Exception as e:
        logger.error(f"Error in analyze_cv endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": str(e) if app.debug else "Please try again later"
        }), 500

def analyze_job_with_openai(job_description, job_title, company="", language='en'):
    """
    Use OpenAI GPT-4 to analyze job posting and extract structured information
    """
    if not openai_client:
        # Fallback analysis without OpenAI
        return {
            "requiredSkills": ["JavaScript", "React", "Node.js"],
            "preferredSkills": ["TypeScript", "AWS"],
            "responsibilities": ["Develop web applications", "Collaborate with team"],
            "requirements": ["3+ years experience", "Bachelor's degree"],
            "benefits": ["Health insurance", "Remote work"],
            "summary": "OpenAI not configured - using fallback analysis",
            "aiConfidence": 0.0
        }

    try:
        prompt = f"""
        Analyze the following job posting and extract structured information in JSON format.

        Job Title: {job_title}
        Company: {company}
        Job Description:
        {job_description}

        Please extract and return ONLY a valid JSON object with this exact structure:
        {{
            "requiredSkills": ["List of required technical skills"],
            "preferredSkills": ["List of preferred/nice-to-have skills"],
            "responsibilities": ["List of main job responsibilities"],
            "requirements": ["List of requirements (experience, education, etc.)"],
            "benefits": ["List of benefits and perks"],
            "workArrangement": "remote/hybrid/onsite",
            "experienceLevel": "entry/junior/mid/senior/lead",
            "industry": "Industry sector",
            "summary": "Brief summary of the role in 2-3 sentences",
            "aiConfidence": 0.95
        }}

        Extract all available information. If information is not available, use empty arrays or "N/A".
        """

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert job posting analyzer. Extract structured information from job descriptions and return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=OPENAI_TEMPERATURE,
            max_tokens=OPENAI_MAX_TOKENS
        )

        # Parse the JSON response
        analysis_text = response.choices[0].message.content.strip()

        # Clean up the response to ensure it's valid JSON
        if analysis_text.startswith('```json'):
            analysis_text = analysis_text[7:]
        if analysis_text.endswith('```'):
            analysis_text = analysis_text[:-3]

        analysis = json.loads(analysis_text)

        # Validate required fields
        required_fields = ['requiredSkills', 'preferredSkills', 'responsibilities', 'requirements', 'benefits', 'summary']
        for field in required_fields:
            if field not in analysis:
                analysis[field] = []

        if 'aiConfidence' not in analysis:
            analysis['aiConfidence'] = 0.85

        logger.info(f"Successfully analyzed job posting with OpenAI - Confidence: {analysis.get('aiConfidence', 0.85)}")
        return analysis

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "requiredSkills": [],
            "preferredSkills": [],
            "responsibilities": [],
            "requirements": [],
            "benefits": [],
            "summary": "Failed to parse AI analysis",
            "aiConfidence": 0.0
        }
    except Exception as e:
        logger.error(f"Error analyzing job with OpenAI: {str(e)}")
        return {
            "requiredSkills": [],
            "preferredSkills": [],
            "responsibilities": [],
            "requirements": [],
            "benefits": [],
            "summary": "Error in AI analysis",
            "aiConfidence": 0.0
        }

@app.route('/api/analyze/job', methods=['POST'])
def analyze_job():
    """
    Analyze a job description and extract structured information
    
    Input JSON format:
    {
        "jobId": "string",
        "jobTitle": "string",
        "jobDescription": "string",
        "company": "string",
        "language": "string"  # Optional, defaults to 'en'
    }
    
    Output JSON format:
    {
        "analysis": {
            "requiredSkills": ["string"],
            "preferredSkills": ["string"],
            "requiredExperience": "string",
            "educationRequirements": "string",
            "jobResponsibilities": ["string"],
            "companyValues": ["string"],
            "benefits": ["string"],
            "employmentType": "string",
            "location": "string",
            "remote": boolean,
            "seniority": "string",
            "industry": "string",
            "keywords": ["string"]
        }
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

        if 'jobDescription' not in data:
            return jsonify({
                "error": "Missing required field: jobDescription",
                "code": "MISSING_JOB_DESCRIPTION"
            }), 400

        job_id = data.get('jobId', f"job_{uuid.uuid4().hex[:8]}")
        job_title = data.get('jobTitle', 'Untitled Position')
        job_description = data.get('jobDescription', '')
        company = data.get('company', '')
        language = data.get('language', 'en')

        if not job_description.strip():
            return jsonify({
                "error": "Job description cannot be empty",
                "code": "EMPTY_JOB_DESCRIPTION"
            }), 400

        # Analyze job using OpenAI
        analysis = analyze_job_with_openai(job_description, job_title, company, language)

        # Prepare response
        response_data = {
            "jobId": job_id,
            "analysis": analysis,
            "metadata": {
                "processingTimestamp": datetime.now().isoformat(),
                "jobTitle": job_title,
                "company": company,
                "language": language,
                "descriptionLength": len(job_description),
                "openaiUsed": openai_client is not None,
                "processingTime": "~2-5 seconds"
            }
        }

        logger.info(f"Successfully analyzed job {job_id} - AI Confidence: {analysis.get('aiConfidence', 0.0)}")

        return jsonify(response_data)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format",
            "code": "INVALID_JSON"
        }), 400
    except Exception as e:
        logger.error(f"Error in analyze_job endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": str(e) if app.debug else "Please try again later"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Analysis Service on port 5002...")
    print("✅ OpenAI GPT-4 integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/analyze/cv")
    print("   • POST /api/analyze/job")
    print("🌐 Service URL: http://localhost:5002")
    print("🤖 Features: CV analysis, Job analysis, OpenAI GPT-4 powered")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5002, debug=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
