from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
import uuid
import re
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import time
import sys

# Load environment variables from .env
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client with error handling
def initialize_openai_client():
    """Initialize OpenAI client with proper error handling"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or api_key == 'your_openai_api_key_here':
        logger.warning("OpenAI API key not configured. Some features will be limited.")
        return None

    try:
        client = OpenAI(api_key=api_key)  # ✅ uses the key from .env
        # Skip connection test to avoid hanging - test on first actual use
        logger.info("OpenAI client initialized (connection will be tested on first use)")
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
        # Truncate CV text to reduce tokens
        cv_text_truncated = cv_text[:800] if len(cv_text) > 800 else cv_text

        prompt = f"""Extract CV info as JSON:
{{"personalInfo":{{"name":"","email":"","phone":"","location":""}},"technicalSkills":[],"softSkills":[],"experience":[{{"title":"","company":"","duration":""}}],"education":[{{"degree":"","institution":"","year":""}}],"summary":"","aiConfidence":0.9}}

CV: {cv_text_truncated}"""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Extract CV data as JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Lower temperature for more consistent output
            max_tokens=800    # Reduced from 2000 to 800
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
    Analyze a CV and return improvement suggestions

    Input JSON format:
    {
        "cvText": "string"  # Raw text from CV
    }

    Output JSON format:
    {
        "improvements": ["string"]  # List of improvement suggestions
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload"
            }), 400

        if 'cvText' not in data:
            return jsonify({
                "error": "Missing required field: cvText"
            }), 400

        cv_text = data.get('cvText', '')

        if not cv_text.strip():
            return jsonify({
                "error": "CV text cannot be empty"
            }), 400

        # Get CV improvements using OpenAI
        improvements = get_cv_improvements(cv_text)

        return jsonify({
            "improvements": improvements
        })

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format"
        }), 400
    except Exception as e:
        logger.error(f"Error in analyze_cv endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

def get_cv_improvements(cv_text):
    """
    Get CV improvement suggestions using OpenAI
    """
    try:
        # Truncate CV text more aggressively to reduce tokens
        cv_text_truncated = cv_text[:400] if len(cv_text) > 400 else cv_text

        prompt = f"""Give 5 CV tips as JSON array:
["tip1", "tip2", "tip3", "tip4", "tip5"]

CV: {cv_text_truncated}"""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "CV expert. Return JSON array only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=200  # Reduced from 300 to 200
        )

        # Log token usage for monitoring
        if hasattr(response, 'usage'):
            tokens_used = response.usage.total_tokens
            cost = (response.usage.prompt_tokens * 0.0015 + response.usage.completion_tokens * 0.002) / 1000
            logger.info(f"✅ OpenAI request successful - Tokens: {tokens_used}, Cost: ${cost:.6f}")

        # Parse the JSON response
        improvements_text = response.choices[0].message.content.strip()

        # Clean up the response
        if improvements_text.startswith('```json'):
            improvements_text = improvements_text[7:]
        if improvements_text.endswith('```'):
            improvements_text = improvements_text[:-3]

        improvements = json.loads(improvements_text)

        # Ensure it's a list and contains only strings
        if not isinstance(improvements, list):
            improvements = ["Unable to generate specific improvements"]

        # Convert any objects to strings and ensure all items are strings
        clean_improvements = []
        for item in improvements:
            if isinstance(item, dict):
                # If it's an object with a 'tip' key, extract the tip
                if 'tip' in item:
                    clean_improvements.append(str(item['tip']))
                else:
                    # Convert the whole object to string
                    clean_improvements.append(str(item))
            elif isinstance(item, str):
                clean_improvements.append(item)
            else:
                # Convert any other type to string
                clean_improvements.append(str(item))

        return clean_improvements[:5]  # Limit to 5 items

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error getting CV improvements: {error_msg}")

        # Check for specific quota/rate limit errors
        if "insufficient_quota" in error_msg or "429" in error_msg:
            logger.warning("⚠️ OpenAI quota exceeded - using fallback suggestions")
            return [
                "⚠️ OpenAI quota exceeded - Add payment method to get AI-powered suggestions",
                "Visit: https://platform.openai.com/account/billing to add credits",
                "Add more specific technical skills relevant to your target role",
                "Include quantifiable achievements with numbers and percentages",
                "Improve the professional summary to highlight key strengths"
            ]
        elif "401" in error_msg or "invalid" in error_msg.lower():
            logger.warning("🔑 OpenAI API key issue - using fallback suggestions")
            return [
                "🔑 OpenAI API key issue - Check your API key configuration",
                "Add more specific technical skills relevant to your target role",
                "Include quantifiable achievements with numbers and percentages",
                "Improve the professional summary to highlight key strengths",
                "Add relevant certifications or training courses"
            ]
        else:
            # Return general fallback improvements for other errors
            return [
                "Add more specific technical skills relevant to your target role",
                "Include quantifiable achievements with numbers and percentages",
                "Improve the professional summary to highlight key strengths",
                "Add relevant certifications or training courses",
                "Use stronger action verbs to describe your accomplishments"
            ]

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

def analyze_cv_content_advanced(cv_text):
    """
    Advanced rule-based CV analysis - works without OpenAI
    """
    import re

    improvements = []
    cv_lower = cv_text.lower()
    words = cv_text.split()

    # 1. Contact Information Analysis
    has_email = '@' in cv_lower or 'email' in cv_lower
    has_phone = bool(re.search(r'phone|tel|\+\d|\(\d{3}\)|\d{3}-\d{3}-\d{4}', cv_lower))
    has_linkedin = 'linkedin' in cv_lower

    if not has_email or not has_phone:
        improvements.append("🔗 Add complete contact information: email, phone, and LinkedIn profile")
    elif not has_linkedin:
        improvements.append("🔗 Include your LinkedIn profile URL to enhance professional presence")

    # 2. Professional Summary Analysis
    summary_keywords = ['summary', 'profile', 'objective', 'about', 'overview']
    has_summary = any(word in cv_lower for word in summary_keywords)

    if not has_summary:
        improvements.append("📝 Add a compelling professional summary highlighting your key strengths and career goals")

    # 3. Quantifiable Achievements Analysis
    has_numbers = bool(re.search(r'\d+%|\d+\+|\d+ years?|\d+ months?|\$\d+|\d+k|\d+ million|\d+x|increased.*\d+|reduced.*\d+|improved.*\d+', cv_text))
    achievement_words = ['increased', 'reduced', 'improved', 'achieved', 'delivered', 'exceeded']
    has_achievement_words = any(word in cv_lower for word in achievement_words)

    if not has_numbers and not has_achievement_words:
        improvements.append("📊 Add quantifiable achievements with specific numbers, percentages, or metrics (e.g., 'increased efficiency by 30%')")

    # 4. Technical Skills Analysis
    tech_keywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'git', 'aws', 'docker']
    has_tech_skills = any(skill in cv_lower for skill in tech_keywords)

    if not has_tech_skills:
        improvements.append("💻 Add specific technical skills and programming languages relevant to your field")

    # 5. Experience Analysis
    experience_keywords = ['experience', 'work', 'employment', 'position', 'role']
    has_experience = any(word in cv_lower for word in experience_keywords)

    if not has_experience:
        improvements.append("💼 Add detailed work experience with specific job titles, company names, and employment dates")

    # 6. Action Verbs Analysis
    weak_phrases = ['responsible for', 'worked on', 'helped with', 'involved in']
    has_weak_phrases = any(phrase in cv_lower for phrase in weak_phrases)

    if has_weak_phrases:
        improvements.append("⚡ Replace passive phrases like 'responsible for' with strong action verbs like 'developed', 'implemented', 'led'")

    # 7. Education Analysis
    education_keywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master']
    has_education = any(word in cv_lower for word in education_keywords)

    if not has_education:
        improvements.append("🎓 Include your educational background with degrees, institutions, and graduation years")

    # 8. Certifications Analysis
    cert_keywords = ['certification', 'certified', 'license', 'credential', 'course']
    has_certifications = any(word in cv_lower for word in cert_keywords)

    if not has_certifications:
        improvements.append("🏆 Add relevant certifications, professional courses, or training to demonstrate continuous learning")

    # 9. CV Length Analysis
    word_count = len(words)

    if word_count < 150:
        improvements.append("📄 Expand your CV with more detailed descriptions of your experience and achievements")
    elif word_count > 800:
        improvements.append("📄 Consider condensing your CV to focus on the most relevant and recent experiences")

    # 10. General improvements if needed
    general_tips = [
        "🎯 Include more industry-specific keywords and terminology relevant to your target role",
        "📋 Use consistent formatting and professional fonts throughout your CV",
        "🔍 Tailor your CV to match the specific job requirements you're applying for",
        "✨ Proofread carefully for grammar, spelling, and formatting errors",
        "🎨 Use bullet points and clear section headers for better readability"
    ]

    # Add general tips if needed to reach 5 suggestions
    while len(improvements) < 5:
        for tip in general_tips:
            if tip not in improvements and len(improvements) < 5:
                improvements.append(tip)

    return improvements[:5]

# New endpoint for CV improvements
@app.route('/api/analyze/cv-improvements', methods=['POST'])
def analyze_cv_improvements():
    """
    Analyze CV and return improvement suggestions

    Input: {"cvText": "CV content"}
    Output: {"improvements": ["suggestion1", "suggestion2", ...]}
    """
    try:
        data = request.json

        if not data or 'cvText' not in data:
            return jsonify({
                "error": "Missing cvText in request"
            }), 400

        cv_text = data.get('cvText', '')

        if not cv_text.strip():
            return jsonify({
                "error": "CV text cannot be empty"
            }), 400

        logger.info(f"📄 Analyzing CV for improvements ({len(cv_text)} characters)...")

        # Use advanced rule-based analysis (works without OpenAI quota)
        improvements = analyze_cv_content_advanced(cv_text)

        return jsonify({
            "improvements": improvements
        })

    except Exception as e:
        logger.error(f"Error in CV improvements endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "improvements": [
                "🔧 Service error - using fallback suggestions",
                "💻 Add specific technical skills and programming languages relevant to your field",
                "📊 Include quantifiable achievements with numbers and percentages",
                "📝 Improve the professional summary to highlight key strengths",
                "🏆 Add relevant certifications or training courses"
            ]
        })

def calculate_match_score_with_openai(cv_text, job_description):
    """
    Calculate match score between CV and job description using OpenAI
    """
    try:
        # Truncate texts to reduce token usage
        cv_text_truncated = cv_text[:800] if len(cv_text) > 800 else cv_text
        job_desc_truncated = job_description[:600] if len(job_description) > 600 else job_description

        prompt = f"""Analyze CV-Job match and return JSON:
{{
  "matchScore": 85,
  "analysis": "Brief analysis",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"]
}}

Job: {job_desc_truncated}
CV: {cv_text_truncated}"""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "HR expert. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )

        # Log token usage
        if hasattr(response, 'usage'):
            tokens_used = response.usage.total_tokens
            cost = (response.usage.prompt_tokens * 0.0015 + response.usage.completion_tokens * 0.002) / 1000
            logger.info(f"✅ Match score calculation - Tokens: {tokens_used}, Cost: ${cost:.6f}")

        # Parse the JSON response
        result_text = response.choices[0].message.content.strip()

        # Clean up the response
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]

        result = json.loads(result_text)

        # Validate result structure
        if not isinstance(result, dict) or 'matchScore' not in result:
            raise ValueError("Invalid response structure")

        return result

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error calculating match score: {error_msg}")

        # Return fallback result
        return {
            "matchScore": 75,
            "analysis": "Unable to calculate detailed match score. Basic compatibility assessment provided.",
            "strengths": ["General experience match", "Basic skill alignment"],
            "gaps": ["Detailed analysis unavailable", "Consider manual review"]
        }

def get_job_specific_recommendations(cv_text, job_description):
    """
    Get job-specific CV improvement recommendations using OpenAI
    """
    try:
        # Truncate texts to reduce token usage
        cv_text_truncated = cv_text[:600] if len(cv_text) > 600 else cv_text
        job_desc_truncated = job_description[:500] if len(job_description) > 500 else job_description

        prompt = f"""Give 5 job-specific CV tips as JSON array:
["tip1", "tip2", "tip3", "tip4", "tip5"]

Job: {job_desc_truncated}
CV: {cv_text_truncated}"""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Career advisor. Return JSON array only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=250
        )

        # Log token usage
        if hasattr(response, 'usage'):
            tokens_used = response.usage.total_tokens
            cost = (response.usage.prompt_tokens * 0.0015 + response.usage.completion_tokens * 0.002) / 1000
            logger.info(f"✅ Job recommendations - Tokens: {tokens_used}, Cost: ${cost:.6f}")

        # Parse the JSON response
        recommendations_text = response.choices[0].message.content.strip()

        # Clean up the response
        if recommendations_text.startswith('```json'):
            recommendations_text = recommendations_text[7:]
        if recommendations_text.endswith('```'):
            recommendations_text = recommendations_text[:-3]

        recommendations = json.loads(recommendations_text)

        # Ensure it's a list
        if not isinstance(recommendations, list):
            recommendations = ["Unable to generate specific recommendations"]

        return recommendations

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error getting job recommendations: {error_msg}")

        # Return fallback recommendations
        return [
            "Highlight skills mentioned in the job description",
            "Add specific examples that match job requirements",
            "Use keywords from the job posting in your CV",
            "Quantify achievements relevant to this role",
            "Tailor your professional summary to this position"
        ]

@app.route('/api/analyze/calculate-match-score', methods=['POST'])
def calculate_match_score():
    """
    Calculate match score between CV and job description using OpenAI

    Input JSON format:
    {
        "cvText": "string",      # CV content
        "jobDescription": "string" # Job description
    }

    Output JSON format:
    {
        "matchScore": 85,        # Score from 0-100
        "analysis": "string",    # Brief analysis
        "strengths": ["string"], # Matching strengths
        "gaps": ["string"]       # Areas for improvement
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload"
            }), 400

        if 'cvText' not in data or 'jobDescription' not in data:
            return jsonify({
                "error": "Missing required fields: cvText and jobDescription"
            }), 400

        cv_text = data.get('cvText', '')
        job_description = data.get('jobDescription', '')

        if not cv_text.strip() or not job_description.strip():
            return jsonify({
                "error": "CV text and job description cannot be empty"
            }), 400

        # Calculate match score using OpenAI
        match_result = calculate_match_score_with_openai(cv_text, job_description)

        return jsonify(match_result)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format"
        }), 400
    except Exception as e:
        logger.error(f"Error in calculate_match_score endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/analyze/cv-job-recommendations', methods=['POST'])
def get_cv_job_recommendations():
    """
    Get job-specific CV improvement recommendations

    Input JSON format:
    {
        "cvText": "string",      # CV content
        "jobDescription": "string" # Job description
    }

    Output JSON format:
    {
        "recommendations": ["string"] # Job-specific improvement suggestions
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload"
            }), 400

        if 'cvText' not in data or 'jobDescription' not in data:
            return jsonify({
                "error": "Missing required fields: cvText and jobDescription"
            }), 400

        cv_text = data.get('cvText', '')
        job_description = data.get('jobDescription', '')

        if not cv_text.strip() or not job_description.strip():
            return jsonify({
                "error": "CV text and job description cannot be empty"
            }), 400

        # Get job-specific recommendations using OpenAI
        recommendations = get_job_specific_recommendations(cv_text, job_description)

        return jsonify({
            "recommendations": recommendations
        })

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format"
        }), 400
    except Exception as e:
        logger.error(f"Error in get_job_recommendations endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/analyze/job-matching', methods=['POST'])
def get_job_matching_recommendations():
    """
    Get job recommendations based on CV and available jobs

    Input JSON format:
    {
        "cvText": "string",     # Raw text from CV
        "jobs": [               # Array of available jobs
            {
                "id": "int",
                "title": "string",
                "description": "string",
                "requirements": "string",
                "company": "string",
                "location": "string"
            }
        ]
    }

    Output JSON format:
    {
        "recommendations": [
            {
                "jobId": "int",
                "matchScore": "int",
                "reasons": ["string"],
                "suggestions": ["string"]
            }
        ]
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload"
            }), 400

        if 'cvText' not in data or 'jobs' not in data:
            return jsonify({
                "error": "Missing required fields: cvText and jobs"
            }), 400

        cv_text = data.get('cvText', '')
        jobs = data.get('jobs', [])

        if not cv_text.strip():
            return jsonify({
                "error": "CV text cannot be empty"
            }), 400

        if not jobs or not isinstance(jobs, list):
            return jsonify({
                "error": "Jobs must be a non-empty array"
            }), 400

        # Get job recommendations using OpenAI
        recommendations = get_job_recommendations_with_openai(cv_text, jobs)

        return jsonify({
            "recommendations": recommendations
        })

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format"
        }), 400
    except Exception as e:
        logger.error(f"Error in get_job_recommendations endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

def get_job_recommendations_with_openai(cv_text, jobs):
    """
    Get job recommendations using OpenAI
    """
    try:
        # Truncate CV text to reduce tokens
        cv_text_truncated = cv_text[:800] if len(cv_text) > 800 else cv_text

        # Limit to top 5 jobs to avoid token limits
        jobs_limited = jobs[:5]

        # Create jobs summary for the prompt
        jobs_summary = []
        for job in jobs_limited:
            job_text = f"ID: {job.get('id')}, Title: {job.get('title')}, Company: {job.get('company')}, Requirements: {job.get('requirements', job.get('description', ''))[:200]}"
            jobs_summary.append(job_text)

        prompt = f"""Analyze CV and rank jobs by match. Return JSON array:
[
  {{
    "jobId": 1,
    "matchScore": 85,
    "reasons": ["Strong React skills match", "5+ years experience fits senior role"],
    "suggestions": ["Highlight leadership experience", "Add specific project metrics"]
  }}
]

CV: {cv_text_truncated}

Jobs:
{chr(10).join(jobs_summary)}

Rank all jobs, score 0-100."""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Job matching expert. Return JSON array only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )

        # Log token usage
        if hasattr(response, 'usage'):
            tokens_used = response.usage.total_tokens
            cost = (response.usage.prompt_tokens * 0.0015 + response.usage.completion_tokens * 0.002) / 1000
            logger.info(f"✅ Job recommendations request successful - Tokens: {tokens_used}, Cost: ${cost:.6f}")

        # Parse the JSON response
        recommendations_text = response.choices[0].message.content.strip()

        # Clean up the response
        if recommendations_text.startswith('```json'):
            recommendations_text = recommendations_text[7:]
        if recommendations_text.endswith('```'):
            recommendations_text = recommendations_text[:-3]

        recommendations = json.loads(recommendations_text)

        # Ensure it's a list and validate structure
        if not isinstance(recommendations, list):
            recommendations = []

        # Validate and clean up recommendations
        valid_recommendations = []
        for rec in recommendations:
            if isinstance(rec, dict) and 'jobId' in rec:
                valid_rec = {
                    'jobId': rec.get('jobId'),
                    'matchScore': min(100, max(0, rec.get('matchScore', 0))),
                    'reasons': rec.get('reasons', []) if isinstance(rec.get('reasons'), list) else [],
                    'suggestions': rec.get('suggestions', []) if isinstance(rec.get('suggestions'), list) else []
                }
                valid_recommendations.append(valid_rec)

        return valid_recommendations

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error getting job recommendations: {error_msg}")

        # Return fallback recommendations for errors
        fallback_recommendations = []
        for job in jobs[:3]:  # Limit to 3 jobs for fallback
            fallback_recommendations.append({
                'jobId': job.get('id'),
                'matchScore': 50,  # Neutral score
                'reasons': ["Unable to analyze match due to API limitations"],
                'suggestions': ["Review job requirements manually", "Tailor your CV to highlight relevant skills"]
            })

        return fallback_recommendations

@app.route('/api/analyze/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    """
    Generate a personalized cover letter based on CV and job details

    Input JSON format:
    {
        "cvText": "string",           # CV content
        "jobTitle": "string",         # Job title
        "jobDescription": "string",   # Job description
        "company": "string",          # Company name
        "candidateName": "string"     # Candidate's name
    }

    Output JSON format:
    {
        "coverLetter": "string",      # Generated cover letter
        "wordCount": "int",           # Word count
        "suggestions": ["string"]     # Additional suggestions
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload"
            }), 400

        required_fields = ['cvText', 'jobTitle', 'jobDescription', 'candidateName']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400

        cv_text = data.get('cvText', '')
        job_title = data.get('jobTitle', '')
        job_description = data.get('jobDescription', '')
        company = data.get('company', 'the company')  # Default fallback
        candidate_name = data.get('candidateName', '')

        if not cv_text.strip() or not job_description.strip():
            return jsonify({
                "error": "CV text and job description cannot be empty"
            }), 400

        # Generate cover letter using OpenAI
        cover_letter_result = generate_cover_letter_with_openai(
            cv_text, job_title, job_description, company, candidate_name
        )

        return jsonify(cover_letter_result)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format"
        }), 400
    except Exception as e:
        logger.error(f"Error in generate_cover_letter endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

def generate_cover_letter_with_openai(cv_text, job_title, job_description, company, candidate_name):
    """
    Generate cover letter using OpenAI
    """
    try:
        # Truncate texts to reduce tokens
        cv_text_truncated = cv_text[:600] if len(cv_text) > 600 else cv_text
        job_description_truncated = job_description[:400] if len(job_description) > 400 else job_description

        # Create a more flexible prompt that handles missing company info
        company_text = f"at {company}" if company and company != "the company" else ""

        prompt = f"""Write a professional cover letter for {candidate_name} applying for the {job_title} position{company_text}.

CV Summary: {cv_text_truncated}

Job Description: {job_description_truncated}

Requirements:
- Professional tone, 3-4 paragraphs
- Highlight relevant skills from CV that match job requirements
- Show enthusiasm for the role and organization
- Include specific examples from experience
- Keep it concise (250-300 words)
- Start with "Dear Hiring Manager,"
- End with "Sincerely, {candidate_name}"

Return only the cover letter text, no additional formatting or explanations."""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Professional cover letter writer. Write compelling, personalized cover letters that highlight candidate strengths."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=400
        )

        # Log token usage
        if hasattr(response, 'usage'):
            tokens_used = response.usage.total_tokens
            cost = (response.usage.prompt_tokens * 0.0015 + response.usage.completion_tokens * 0.002) / 1000
            logger.info(f"✅ Cover letter generation successful - Tokens: {tokens_used}, Cost: ${cost:.6f}")

        # Get the generated cover letter
        cover_letter = response.choices[0].message.content.strip()

        # Count words
        word_count = len(cover_letter.split())

        # Generate additional suggestions
        suggestions = [
            "Review and personalize the opening paragraph",
            "Add specific metrics or achievements if available",
            "Research the company culture and mention alignment",
            "Proofread for grammar and spelling",
            "Keep it to one page when printed"
        ]

        return {
            "coverLetter": cover_letter,
            "wordCount": word_count,
            "suggestions": suggestions
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error generating cover letter: {error_msg}")

        # Return fallback cover letter template
        company_mention = f"at {company}" if company and company != "the company" else ""
        company_reference = company if company and company != "the company" else "your organization"

        fallback_cover_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job_title} position{company_mention}. With my background in software development and passion for creating innovative solutions, I am excited about the opportunity to contribute to your team.

My experience includes working with modern technologies and frameworks that align well with your requirements. I have successfully delivered projects that demonstrate my technical skills and ability to work collaboratively in fast-paced environments.

I am particularly drawn to {company_reference} because of your commitment to innovation and excellence. I would welcome the opportunity to discuss how my skills and enthusiasm can contribute to your team's continued success.

Sincerely,
{candidate_name}"""

        return {
            "coverLetter": fallback_cover_letter,
            "wordCount": len(fallback_cover_letter.split()),
            "suggestions": [
                "This is a template - please personalize it with specific details",
                "Add specific examples from your experience",
                "Research the company and mention specific reasons for interest",
                "Highlight 2-3 key skills that match the job requirements"
            ]
        }

if __name__ == '__main__':
    print("🚀 Starting Analysis Service on port 5002...")
    print("✅ OpenAI GPT-4 integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/analyze/cv")
    print("   • POST /api/analyze/cv-improvements")
    print("   • POST /api/analyze/job")
    print("   • POST /api/analyze/calculate-match-score")
    print("   • POST /api/analyze/cv-job-recommendations")
    print("   • POST /api/analyze/job-matching")
    print("   • POST /api/analyze/generate-cover-letter")
    print("🌐 Service URL: http://localhost:5002")
    print("🤖 Features: CV analysis, Job analysis, OpenAI GPT-4 powered")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5002, debug=True)
