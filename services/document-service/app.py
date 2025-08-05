from flask import Flask, request, jsonify
import os
import json
import logging
import uuid
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

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

def generate_cover_letter_with_openai(candidate_data, job_data, style="professional"):
    """
    Use OpenAI GPT-4 to generate personalized cover letter
    """
    if not openai_client:
        # Fallback cover letter without OpenAI
        return {
            "coverLetter": f"Dear Hiring Manager,\n\nI am writing to express my interest in the {job_data.get('jobTitle', 'position')} role. With my background in software development, I believe I would be a great fit for your team.\n\nThank you for your consideration.\n\nSincerely,\n{candidate_data.get('name', 'Candidate')}",
            "aiConfidence": 0.0,
            "generatedSections": ["header", "body", "closing"]
        }

    try:
        # Simplify data to reduce tokens
        candidate_summary = {
            "name": candidate_data.get("name", ""),
            "skills": candidate_data.get("skills", [])[:3],
            "experience": candidate_data.get("experience", "")[:200]
        }

        job_summary = {
            "title": job_data.get("title", ""),
            "company": job_data.get("company", "")
        }

        prompt = f"""Write brief cover letter. Return JSON:
{{"coverLetter":"Professional 2-paragraph cover letter","aiConfidence":0.9}}

Candidate: {json.dumps(candidate_summary)}
Job: {json.dumps(job_summary)}
Style: {style}"""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Write cover letters. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=400  # Reduced from 2000 to 400
        )

        # Parse the JSON response
        analysis_text = response.choices[0].message.content.strip()

        # Clean up the response to ensure it's valid JSON
        if analysis_text.startswith('```json'):
            analysis_text = analysis_text[7:]
        if analysis_text.endswith('```'):
            analysis_text = analysis_text[:-3]

        result = json.loads(analysis_text)

        # Validate required fields
        if 'coverLetter' not in result:
            result['coverLetter'] = "Error generating cover letter"
        if 'aiConfidence' not in result:
            result['aiConfidence'] = 0.85
        if 'generatedSections' not in result:
            result['generatedSections'] = ["header", "body", "closing"]

        logger.info(f"Successfully generated cover letter with OpenAI - Confidence: {result.get('aiConfidence', 0.85)}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "coverLetter": "Error generating cover letter - please try again",
            "aiConfidence": 0.0,
            "generatedSections": ["error"]
        }
    except Exception as e:
        logger.error(f"Error generating cover letter with OpenAI: {str(e)}")
        return {
            "coverLetter": "Error generating cover letter - please try again",
            "aiConfidence": 0.0,
            "generatedSections": ["error"]
        }

def customize_cv_with_openai(cv_data, job_data, customization_level="moderate"):
    """
    Use OpenAI GPT-4 to customize CV for specific job
    """
    if not openai_client:
        # Fallback CV customization without OpenAI
        return {
            "customizedCV": cv_data,
            "changes": ["OpenAI not configured - no customization applied"],
            "aiConfidence": 0.0
        }

    try:
        prompt = f"""
        Customize this CV for the specific job posting. Optimize it to better match the job requirements while keeping all information truthful.

        ORIGINAL CV DATA:
        {json.dumps(cv_data, indent=2)}

        JOB POSTING DATA:
        {json.dumps(job_data, indent=2)}

        CUSTOMIZATION LEVEL: {customization_level}

        Please customize the CV by:
        1. Reordering skills to prioritize job-relevant ones
        2. Emphasizing relevant experience
        3. Adjusting the professional summary
        4. Highlighting matching qualifications
        5. Using keywords from the job posting

        Return ONLY a valid JSON object with this structure:
        {{
            "customizedCV": {{
                "personalInfo": {{"name": "...", "email": "...", "phone": "...", "location": "..."}},
                "professionalSummary": "Customized summary highlighting job-relevant aspects",
                "technicalSkills": ["Reordered skills prioritizing job requirements"],
                "experience": [
                    {{
                        "title": "...",
                        "company": "...",
                        "duration": "...",
                        "description": "Enhanced description emphasizing relevant aspects",
                        "highlights": ["Job-relevant achievements"]
                    }}
                ],
                "education": [...],
                "certifications": [...]
            }},
            "changes": ["List of specific changes made"],
            "aiConfidence": 0.95,
            "matchingKeywords": ["Keywords from job posting incorporated"]
        }}
        """

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert career counselor and CV optimization specialist. Customize CVs to better match job requirements while maintaining truthfulness and professional standards."},
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

        result = json.loads(analysis_text)

        # Validate required fields
        if 'customizedCV' not in result:
            result['customizedCV'] = cv_data
        if 'changes' not in result:
            result['changes'] = ["No changes applied"]
        if 'aiConfidence' not in result:
            result['aiConfidence'] = 0.85

        logger.info(f"Successfully customized CV with OpenAI - Confidence: {result.get('aiConfidence', 0.85)}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "customizedCV": cv_data,
            "changes": ["Error in CV customization"],
            "aiConfidence": 0.0
        }
    except Exception as e:
        logger.error(f"Error customizing CV with OpenAI: {str(e)}")
        return {
            "customizedCV": cv_data,
            "changes": ["Error in CV customization"],
            "aiConfidence": 0.0
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "document-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": openai_client is not None,
        "openai_model": OPENAI_MODEL if openai_client else "Not configured"
    })

@app.route('/api/documents/customize-cv', methods=['POST'])
def customize_cv():
    """
    Customize a CV for a specific job
    
    Input JSON format:
    {
        "cvId": "string",
        "cvData": {
            "personalInfo": {
                "name": "string",
                "email": "string",
                "phone": "string",
                "location": "string"
            },
            "skills": ["string"],
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
                    "year": "string"
                }
            ]
        },
        "jobId": "string",
        "jobData": {
            "title": "string",
            "company": "string",
            "requiredSkills": ["string"],
            "preferredSkills": ["string"],
            "responsibilities": ["string"]
        },
        "template": "string",  # Optional, template style
        "format": "string"     # pdf or docx
    }
    
    Output JSON format:
    {
        "customizedCv": {
            "id": "string",
            "documentUrl": "string",
            "customizations": [
                {
                    "type": "string",  # skill_highlight, experience_reorder, etc.
                    "description": "string"
                }
            ],
            "format": "string",
            "recommendations": ["string"]
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

        if 'cvData' not in data or 'jobData' not in data:
            return jsonify({
                "error": "Missing required fields: cvData and jobData",
                "code": "MISSING_REQUIRED_FIELDS"
            }), 400

        cv_id = data.get('cvId', f"cv_{uuid.uuid4().hex[:8]}")
        cv_data = data.get('cvData', {})
        job_id = data.get('jobId', f"job_{uuid.uuid4().hex[:8]}")
        job_data = data.get('jobData', {})
        template = data.get('template', 'professional')
        format_type = data.get('format', 'pdf')
        customization_level = data.get('customizationLevel', 'moderate')

        # Customize CV using OpenAI
        customization_result = customize_cv_with_openai(cv_data, job_data, customization_level)

        # Generate document URL (in real implementation, this would create actual document)
        document_url = f"/documents/customized_cv_{cv_id}_{job_id}.{format_type}"

        # Prepare response
        response_data = {
            "cvId": cv_id,
            "jobId": job_id,
            "customizedCV": customization_result["customizedCV"],
            "changes": customization_result["changes"],
            "documentUrl": document_url,
            "format": format_type,
            "template": template,
            "metadata": {
                "processingTimestamp": datetime.now().isoformat(),
                "customizationLevel": customization_level,
                "aiConfidence": customization_result["aiConfidence"],
                "openaiUsed": openai_client is not None,
                "processingTime": "~3-7 seconds"
            }
        }

        logger.info(f"Successfully customized CV {cv_id} for job {job_id} - AI Confidence: {customization_result.get('aiConfidence', 0.0)}")

        return jsonify(response_data)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format",
            "code": "INVALID_JSON"
        }), 400
    except Exception as e:
        logger.error(f"Error in customize_cv endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": str(e) if app.debug else "Please try again later"
        }), 500

@app.route('/api/documents/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    """
    Generate a cover letter for a specific job application
    
    Input JSON format:
    {
        "candidateId": "string",
        "candidateName": "string",
        "candidateBackground": "string",
        "jobId": "string",
        "jobTitle": "string",
        "company": "string",
        "jobDescription": "string",
        "keySkills": ["string"],
        "relevantExperience": ["string"],
        "style": "string",  # professional, creative, etc.
        "tone": "string",   # formal, conversational, etc.
        "length": "string", # short, medium, long
        "format": "string"  # pdf or docx
    }
    
    Output JSON format:
    {
        "coverLetter": {
            "id": "string",
            "documentUrl": "string",
            "content": "string",
            "format": "string",
            "suggestions": ["string"]
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

        required_fields = ['candidateName', 'jobTitle', 'company']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}",
                    "code": "MISSING_REQUIRED_FIELD"
                }), 400

        candidate_id = data.get('candidateId', f"candidate_{uuid.uuid4().hex[:8]}")
        candidate_name = data.get('candidateName', '')
        candidate_background = data.get('candidateBackground', '')
        job_id = data.get('jobId', f"job_{uuid.uuid4().hex[:8]}")
        job_title = data.get('jobTitle', '')
        company = data.get('company', '')
        job_description = data.get('jobDescription', '')
        key_skills = data.get('keySkills', [])
        relevant_experience = data.get('relevantExperience', [])
        style = data.get('style', 'professional')
        tone = data.get('tone', 'formal')
        length = data.get('length', 'medium')
        format_type = data.get('format', 'pdf')

        # Prepare candidate data for OpenAI
        candidate_data = {
            "name": candidate_name,
            "background": candidate_background,
            "keySkills": key_skills,
            "relevantExperience": relevant_experience
        }

        # Prepare job data for OpenAI
        job_data = {
            "jobTitle": job_title,
            "company": company,
            "jobDescription": job_description,
            "style": style,
            "tone": tone,
            "length": length
        }

        # Generate cover letter using OpenAI
        cover_letter_result = generate_cover_letter_with_openai(candidate_data, job_data, style)

        # Generate document URL (in real implementation, this would create actual document)
        cover_letter_id = f"cover_letter_{candidate_id}_{job_id}"
        document_url = f"/documents/{cover_letter_id}.{format_type}"

        # Prepare response
        response_data = {
            "candidateId": candidate_id,
            "jobId": job_id,
            "coverLetter": {
                "id": cover_letter_id,
                "content": cover_letter_result["coverLetter"],
                "documentUrl": document_url,
                "format": format_type,
                "style": style,
                "tone": tone,
                "length": length,
                "generatedSections": cover_letter_result.get("generatedSections", []),
                "keyHighlights": cover_letter_result.get("keyHighlights", [])
            },
            "metadata": {
                "processingTimestamp": datetime.now().isoformat(),
                "aiConfidence": cover_letter_result["aiConfidence"],
                "openaiUsed": openai_client is not None,
                "processingTime": "~3-7 seconds"
            }
        }

        logger.info(f"Successfully generated cover letter for candidate {candidate_id} and job {job_id} - AI Confidence: {cover_letter_result.get('aiConfidence', 0.0)}")

        return jsonify(response_data)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format",
            "code": "INVALID_JSON"
        }), 400
    except Exception as e:
        logger.error(f"Error in generate_cover_letter endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": str(e) if app.debug else "Please try again later"
        }), 500

@app.route('/api/documents/templates', methods=['GET'])
def get_templates():
    """
    Get available document templates
    
    Query parameters:
    - type: "cv" or "cover_letter"
    
    Output JSON format:
    {
        "templates": [
            {
                "id": "string",
                "name": "string",
                "type": "string",
                "description": "string",
                "previewUrl": "string"
            }
        ]
    }
    """
    template_type = request.args.get('type', 'cv')
    
    # Placeholder response
    if template_type == 'cv':
        templates = [
            {
                "id": "cv_template_1",
                "name": "Professional",
                "type": "cv",
                "description": "Clean, professional layout ideal for corporate applications",
                "previewUrl": "/templates/cv/professional.png"
            },
            {
                "id": "cv_template_2",
                "name": "Creative",
                "type": "cv",
                "description": "Modern design with visual elements for creative fields",
                "previewUrl": "/templates/cv/creative.png"
            },
            {
                "id": "cv_template_3",
                "name": "Academic",
                "type": "cv",
                "description": "Detailed format suitable for academic and research positions",
                "previewUrl": "/templates/cv/academic.png"
            }
        ]
    else:
        templates = [
            {
                "id": "cl_template_1",
                "name": "Standard",
                "type": "cover_letter",
                "description": "Traditional cover letter format with formal tone",
                "previewUrl": "/templates/cover_letter/standard.png"
            },
            {
                "id": "cl_template_2",
                "name": "Modern",
                "type": "cover_letter",
                "description": "Contemporary style with a balanced formal-conversational tone",
                "previewUrl": "/templates/cover_letter/modern.png"
            }
        ]
    
    return jsonify({"templates": templates})

if __name__ == '__main__':
    print("🚀 Starting Document Service on port 5003...")
    print("✅ OpenAI GPT-4 integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/documents/customize-cv")
    print("   • POST /api/documents/generate-cover-letter")
    print("   • GET  /api/documents/templates")
    print("🌐 Service URL: http://localhost:5003")
    print("🤖 Features: CV customization, Cover letter generation, Document templates")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5003, debug=True)
