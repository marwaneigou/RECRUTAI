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

def calculate_match_score_with_openai(cv_data, job_data):
    """
    Use OpenAI GPT-4 to calculate intelligent matching score between CV and job
    """
    if not openai_client:
        # Fallback scoring without OpenAI
        return {
            "overallScore": 0.75,
            "skillsMatch": 0.8,
            "experienceMatch": 0.7,
            "educationMatch": 0.6,
            "reasoning": "OpenAI not configured - using fallback scoring",
            "recommendations": ["Configure OpenAI for better matching"],
            "aiConfidence": 0.0
        }

    try:
        # Handle different data formats from backend
        skills = cv_data.get("skills", cv_data.get("technicalSkills", []))
        if isinstance(skills, list):
            skills = skills[:5]  # Limit to 5 skills
        else:
            skills = []

        experience = cv_data.get("experience", 0)
        if isinstance(experience, int):
            # Convert years to description
            experience_desc = f"{experience} years of experience"
        elif isinstance(experience, list):
            experience_desc = str(experience[:2]) if experience else "No experience listed"
        else:
            experience_desc = str(experience) if experience else "No experience listed"

        # Simplify data to reduce tokens
        cv_summary = {
            "skills": skills,
            "experience": experience_desc,
            "education": cv_data.get("education", [])[:1] if isinstance(cv_data.get("education"), list) else []
        }

        # Handle job data
        required_skills = job_data.get("requiredSkills", [])
        if isinstance(required_skills, list):
            required_skills = required_skills[:5]  # Limit to 5 skills
        else:
            required_skills = []

        job_summary = {
            "title": job_data.get("title", ""),
            "skills": required_skills,
            "experience": job_data.get("experienceLevel", ""),
            "location": job_data.get("location", ""),
            "company": job_data.get("company", "")
        }

        # Debug logging
        logger.info(f"CV Summary: {cv_summary}")
        logger.info(f"Job Summary: {job_summary}")

        prompt = f"""Analyze how well this CV matches the job. Be precise with scoring - use the full range 0.0-1.0.

CV: {json.dumps(cv_summary)}
Job: {json.dumps(job_summary)}

Return JSON with exact scores:
- If skills perfectly match: skillsMatch = 0.95-1.0
- If most skills match: skillsMatch = 0.8-0.9
- If some skills match: skillsMatch = 0.5-0.7
- If few/no skills match: skillsMatch = 0.1-0.4

- If experience exceeds requirement: experienceMatch = 0.9-1.0
- If experience meets requirement: experienceMatch = 0.7-0.8
- If experience slightly below: experienceMatch = 0.4-0.6
- If experience far below: experienceMatch = 0.1-0.3

Calculate overallScore as weighted average: (skillsMatch * 0.6) + (experienceMatch * 0.4)

Format: {{"overallScore":0.XX,"skillsMatch":0.XX,"experienceMatch":0.XX,"reasoning":"Detailed analysis explaining the match"}}"""

        # Add a small delay to avoid rate limiting
        import time
        time.sleep(0.1)

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Match CV to job. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300  # Reduced from 2000 to 300
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
        required_fields = ['overallScore', 'skillsMatch', 'experienceMatch', 'educationMatch', 'reasoning']
        for field in required_fields:
            if field not in analysis:
                analysis[field] = 0.5 if field.endswith('Score') or field.endswith('Match') else "Analysis incomplete"

        # Ensure scores are within valid range
        score_fields = ['overallScore', 'skillsMatch', 'experienceMatch', 'educationMatch']
        for field in score_fields:
            if field in analysis:
                analysis[field] = max(0.0, min(1.0, float(analysis[field])))

        if 'aiConfidence' not in analysis:
            analysis['aiConfidence'] = 0.85

        logger.info(f"Successfully calculated match score with OpenAI - Overall Score: {analysis.get('overallScore', 0.0)}")
        return analysis

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "overallScore": 0.5,
            "skillsMatch": 0.5,
            "experienceMatch": 0.5,
            "educationMatch": 0.5,
            "reasoning": "Failed to parse AI analysis",
            "recommendations": ["Please try again"],
            "aiConfidence": 0.0
        }
    except Exception as e:
        logger.error(f"Error calculating match score with OpenAI: {str(e)}")

        # Use enhanced fallback algorithm when OpenAI fails
        return calculate_enhanced_fallback_match(cv_data, job_data)

def calculate_enhanced_fallback_match(cv_data, job_data):
    """
    Enhanced fallback matching algorithm when OpenAI is unavailable
    """
    try:
        # Extract skills
        cv_skills = set()
        if isinstance(cv_data.get('skills'), list):
            cv_skills = set(skill.lower().strip() for skill in cv_data['skills'] if skill)

        job_skills = set()
        if isinstance(job_data.get('requiredSkills'), list):
            job_skills = set(skill.lower().strip() for skill in job_data['requiredSkills'] if skill)
        elif isinstance(job_data.get('skills'), list):
            job_skills = set(skill.lower().strip() for skill in job_data['skills'] if skill)

        # Skills matching
        if job_skills:
            matched_skills = cv_skills.intersection(job_skills)
            skills_match = len(matched_skills) / len(job_skills)
            missing_skills = job_skills - cv_skills
        else:
            skills_match = 0.7  # Default when no specific skills required
            matched_skills = set()
            missing_skills = set()

        # Experience matching
        cv_experience = 0
        if isinstance(cv_data.get('experience'), str):
            # Extract years from string like "5 years of experience"
            import re
            years_match = re.search(r'(\d+)', cv_data['experience'])
            if years_match:
                cv_experience = int(years_match.group(1))
        elif isinstance(cv_data.get('experience'), (int, float)):
            cv_experience = cv_data['experience']

        job_level = job_data.get('experienceLevel', '').lower()
        if job_level == 'entry' or job_level == 'junior':
            experience_match = 1.0 if cv_experience >= 0 else 0.5
        elif job_level == 'mid' or job_level == 'middle':
            experience_match = 1.0 if cv_experience >= 2 else max(0.3, cv_experience / 3)
        elif job_level == 'senior':
            experience_match = 1.0 if cv_experience >= 5 else max(0.2, cv_experience / 6)
        else:
            experience_match = 0.6  # Default for unspecified level

        # Location matching
        cv_location = cv_data.get('location', '').lower()
        job_location = job_data.get('location', '').lower()

        if job_data.get('remoteAllowed', False):
            location_match = 1.0
        elif cv_location and job_location:
            if cv_location in job_location or job_location in cv_location:
                location_match = 1.0
            else:
                location_match = 0.3
        else:
            location_match = 0.5

        # Calculate overall score with more weight on skills
        overall_score = (
            skills_match * 0.6 +      # Increased weight for skills
            experience_match * 0.4    # Increased weight for experience
        )

        # Apply location and other factors as modifiers
        if location_match < 0.5:
            overall_score *= 0.9  # Slight penalty for poor location match

        # Ensure minimum variance - avoid clustering around same scores
        if overall_score > 0.75 and skills_match < 0.8:
            overall_score = max(0.65, overall_score - 0.1)
        elif overall_score < 0.4 and skills_match > 0.6:
            overall_score = min(0.6, overall_score + 0.15)

        # Generate reasoning
        reasoning_parts = []
        if skills_match > 0.7:
            reasoning_parts.append(f"Strong skills match ({int(skills_match*100)}%)")
        elif skills_match > 0.4:
            reasoning_parts.append(f"Moderate skills match ({int(skills_match*100)}%)")
        else:
            reasoning_parts.append(f"Limited skills match ({int(skills_match*100)}%)")

        if experience_match > 0.8:
            reasoning_parts.append("excellent experience fit")
        elif experience_match > 0.5:
            reasoning_parts.append("good experience alignment")
        else:
            reasoning_parts.append("experience gap exists")

        if location_match == 1.0:
            reasoning_parts.append("perfect location match")
        elif location_match > 0.5:
            reasoning_parts.append("acceptable location")

        reasoning = f"Fallback analysis: {', '.join(reasoning_parts)}. Overall compatibility: {int(overall_score*100)}%"

        # Generate recommendations
        recommendations = []
        if missing_skills:
            top_missing = list(missing_skills)[:3]
            recommendations.append(f"Consider developing: {', '.join(top_missing)}")
        if experience_match < 0.5:
            recommendations.append("Gain more relevant experience")
        if not recommendations:
            recommendations.append("Strong candidate - consider applying!")

        return {
            "overallScore": min(overall_score, 1.0),
            "skillsMatch": skills_match,
            "experienceMatch": experience_match,
            "educationMatch": 0.6,  # Default education match
            "reasoning": reasoning,
            "recommendations": recommendations,
            "matchedSkills": [skill.title() for skill in matched_skills],
            "missingSkills": [skill.title() for skill in missing_skills],
            "aiConfidence": 0.6  # Lower confidence for fallback
        }

    except Exception as e:
        logger.error(f"Error in fallback matching: {str(e)}")
        return {
            "overallScore": 0.5,
            "skillsMatch": 0.5,
            "experienceMatch": 0.5,
            "educationMatch": 0.5,
            "reasoning": "Basic fallback scoring due to analysis error",
            "recommendations": ["Please try again"],
            "matchedSkills": [],
            "missingSkills": [],
            "aiConfidence": 0.3
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "matching-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": openai_client is not None,
        "openai_model": OPENAI_MODEL if openai_client else "Not configured"
    })

@app.route('/api/match/job-to-candidates', methods=['POST'])
def match_job_to_candidates():
    """
    Match a job to potential candidates
    
    Input JSON format:
    {
        "jobId": "string",
        "jobDescription": "string",
        "requirements": ["string"],
        "requiredSkills": ["string"],
        "preferredSkills": ["string"],
        "experienceLevel": "string",
        "limit": int  # Optional, number of matches to return
    }
    
    Output JSON format:
    {
        "matches": [
            {
                "candidateId": "string",
                "score": float,  # 0-1 match score
                "matchedSkills": ["string"],
                "missingSkills": ["string"],
                "relevantExperience": ["string"]
            }
        ]
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

        job_id = data.get('jobId', f"job_{uuid.uuid4().hex[:8]}")
        job_description = data.get('jobDescription', '')
        requirements = data.get('requirements', [])
        required_skills = data.get('requiredSkills', [])
        preferred_skills = data.get('preferredSkills', [])
        experience_level = data.get('experienceLevel', 'mid')
        limit = data.get('limit', 10)

        # For demo purposes, create sample candidate data
        sample_candidates = [
            {
                "candidateId": "candidate_001",
                "personalInfo": {"name": "John Doe", "email": "john@email.com"},
                "technicalSkills": ["JavaScript", "React", "Node.js", "Python"],
                "experience": [{"title": "Senior Developer", "duration": "3 years"}],
                "education": [{"degree": "Computer Science", "institution": "University"}]
            },
            {
                "candidateId": "candidate_002",
                "personalInfo": {"name": "Jane Smith", "email": "jane@email.com"},
                "technicalSkills": ["Python", "Django", "PostgreSQL", "React"],
                "experience": [{"title": "Full-Stack Developer", "duration": "4 years"}],
                "education": [{"degree": "Software Engineering", "institution": "Tech College"}]
            }
        ]

        job_data = {
            "jobId": job_id,
            "jobDescription": job_description,
            "requirements": requirements,
            "requiredSkills": required_skills,
            "preferredSkills": preferred_skills,
            "experienceLevel": experience_level
        }

        # Calculate matches using OpenAI
        matches = []
        for candidate in sample_candidates[:limit]:
            match_result = calculate_match_score_with_openai(candidate, job_data)

            matches.append({
                "candidateId": candidate["candidateId"],
                "candidateName": candidate["personalInfo"]["name"],
                "overallScore": match_result["overallScore"],
                "skillsMatch": match_result["skillsMatch"],
                "experienceMatch": match_result["experienceMatch"],
                "educationMatch": match_result["educationMatch"],
                "reasoning": match_result["reasoning"],
                "strengths": match_result.get("strengths", []),
                "concerns": match_result.get("concerns", []),
                "recommendations": match_result.get("recommendations", []),
                "aiConfidence": match_result["aiConfidence"]
            })

        # Sort by overall score
        matches.sort(key=lambda x: x["overallScore"], reverse=True)

        response_data = {
            "jobId": job_id,
            "matches": matches,
            "metadata": {
                "processingTimestamp": datetime.now().isoformat(),
                "totalCandidatesAnalyzed": len(sample_candidates),
                "matchesReturned": len(matches),
                "openaiUsed": openai_client is not None,
                "processingTime": "~5-10 seconds"
            }
        }

        logger.info(f"Successfully matched job {job_id} to {len(matches)} candidates")

        return jsonify(response_data)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format",
            "code": "INVALID_JSON"
        }), 400
    except Exception as e:
        logger.error(f"Error in match_job_to_candidates endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": str(e) if app.debug else "Please try again later"
        }), 500

@app.route('/api/match/candidate-to-jobs', methods=['POST'])
def match_candidate_to_jobs():
    """
    Match a candidate to potential jobs
    
    Input JSON format:
    {
        "candidateId": "string",
        "resumeText": "string",
        "skills": ["string"],
        "experience": ["string"],
        "jobPreferences": {
            "roles": ["string"],
            "industries": ["string"],
            "locations": ["string"]
        },
        "limit": int  # Optional, number of matches to return
    }
   
    Output JSON format:
    {
        "matches": [
            {
                "jobId": "string",
                "score": float,  # 0-1 match score
                "matchedSkills": ["string"],
                "missingSkills": ["string"],
                "relevanceExplanation": "string"
            }
        ]
    }
    """
    # This is a placeholder - replace with actual AI implementation
    data = request.json

    # Placeholder response
    return jsonify({
        "matches": [
            {
                "jobId": "job789",
                "score": 0.89,
                "matchedSkills": ["JavaScript", "React"],
                "missingSkills": ["AWS"],
                "relevanceExplanation": "Your frontend experience aligns well with this role"
            },
            {
                "jobId": "job101",
                "score": 0.76,
                "matchedSkills": ["JavaScript"],
                "missingSkills": ["Python", "Django"],
                "relevanceExplanation": "Your JavaScript skills match, but additional backend skills would help"
            }
        ]
    })

@app.route('/api/match/cv-to-job', methods=['POST'])
def match_cv_to_job():
    """
    Match a candidate's CV to a specific job using AI

    Input JSON format:
    {
        "candidateProfile": {
            "candidateId": "string",
            "skills": ["string"],
            "experience": int,
            "location": "string",
            "expectedSalary": float,
            "cvAnalysis": object
        },
        "jobData": {
            "jobId": int,
            "title": "string",
            "description": "string",
            "requirements": "string",
            "requiredSkills": ["string"],
            "experienceLevel": "string",
            "location": "string",
            "salaryMin": float,
            "salaryMax": float,
            "remoteAllowed": boolean,
            "company": "string",
            "industry": "string"
        },
        "includeReasons": boolean
    }

    Output JSON format:
    {
        "overallScore": float,  # 0-1 match score
        "skillsMatch": float,
        "experienceMatch": float,
        "locationMatch": float,
        "salaryMatch": float,
        "matchedSkills": ["string"],
        "missingSkills": ["string"],
        "reasoning": "string",
        "recommendations": ["string"],
        "aiConfidence": float
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data or 'candidateProfile' not in data or 'jobData' not in data:
            return jsonify({
                "error": "Missing candidateProfile or jobData",
                "code": "MISSING_DATA"
            }), 400

        candidate_profile = data['candidateProfile']
        job_data = data['jobData']
        include_reasons = data.get('includeReasons', True)

        # Use the existing OpenAI matching function
        match_result = calculate_match_score_with_openai(candidate_profile, job_data)

        # Calculate additional matching factors

        # Skills matching
        candidate_skills = set(skill.lower() for skill in candidate_profile.get('skills', []))
        required_skills = set(skill.lower() for skill in job_data.get('requiredSkills', []))

        matched_skills = list(candidate_skills.intersection(required_skills))
        missing_skills = list(required_skills - candidate_skills)

        # Location matching
        location_score = 1.0  # Default to perfect match
        if job_data.get('location') and candidate_profile.get('location'):
            if job_data.get('remoteAllowed', False):
                location_score = 1.0  # Remote work = perfect location match
            elif job_data['location'].lower() in candidate_profile['location'].lower():
                location_score = 1.0  # Same location
            else:
                location_score = 0.3  # Different location, lower score

        # Salary matching
        salary_score = 1.0  # Default to perfect match
        if (job_data.get('salaryMin') and job_data.get('salaryMax') and
            candidate_profile.get('expectedSalary')):
            expected = float(candidate_profile['expectedSalary'])
            job_min = float(job_data['salaryMin'])
            job_max = float(job_data['salaryMax'])

            if job_min <= expected <= job_max:
                salary_score = 1.0  # Perfect match
            elif expected < job_min:
                # Candidate expects less - good for employer
                salary_score = 0.9
            else:
                # Candidate expects more - calculate how much over
                overage = (expected - job_max) / job_max
                salary_score = max(0.1, 1.0 - overage)

        # Enhanced response with calculated factors
        enhanced_result = {
            "overallScore": match_result.get("overallScore", 0.75),
            "skillsMatch": match_result.get("skillsMatch", 0.8),
            "experienceMatch": match_result.get("experienceMatch", 0.7),
            "locationMatch": location_score,
            "salaryMatch": salary_score,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "reasoning": match_result.get("reasoning", "AI-powered matching analysis"),
            "recommendations": match_result.get("recommendations", []),
            "aiConfidence": match_result.get("aiConfidence", 0.8)
        }

        return jsonify(enhanced_result)

    except Exception as e:
        logger.error(f"CV to job matching error: {str(e)}")
        return jsonify({
            "error": f"Matching failed: {str(e)}",
            "code": "MATCHING_ERROR"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Matching Service on port 5001...")
    print("✅ OpenAI GPT-4 integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/match/job-to-candidates")
    print("   • POST /api/match/candidate-to-jobs")
    print("   • POST /api/match/cv-to-job")
    print("🌐 Service URL: http://localhost:5001")
    print("🤖 Features: AI-powered candidate-job matching, Smart scoring")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
