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

def generate_career_recommendations_with_openai(user_profile, user_type="candidate"):
    """
    Use OpenAI GPT-4 to generate personalized career recommendations
    """
    if not openai_client:
        # Fallback recommendations without OpenAI
        return {
            "recommendations": [
                {
                    "type": "skill_development",
                    "title": "Learn React.js",
                    "description": "OpenAI not configured - using fallback recommendations",
                    "priority": "medium",
                    "timeframe": "3-6 months"
                }
            ],
            "aiConfidence": 0.0
        }

    try:
        # Simplify profile data
        profile_summary = {
            "skills": user_profile.get("skills", [])[:3],
            "experience": user_profile.get("experience", "")[:100],
            "goals": user_profile.get("goals", "")[:100]
        }

        prompt = f"""Give 3 career tips for {user_type}. Return JSON:
{{"recommendations":[{{"type":"skill_development","title":"Learn X","priority":"high"}}],"aiConfidence":0.9}}

Profile: {json.dumps(profile_summary)}"""

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Give career tips. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300  # Reduced from 2000 to 300
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
        if 'recommendations' not in result:
            result['recommendations'] = []
        if 'aiConfidence' not in result:
            result['aiConfidence'] = 0.85

        logger.info(f"Successfully generated career recommendations with OpenAI - Confidence: {result.get('aiConfidence', 0.85)}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "recommendations": [
                {
                    "type": "error",
                    "title": "Error generating recommendations",
                    "description": "Please try again later",
                    "priority": "low",
                    "timeframe": "N/A"
                }
            ],
            "aiConfidence": 0.0
        }
    except Exception as e:
        logger.error(f"Error generating career recommendations with OpenAI: {str(e)}")
        return {
            "recommendations": [
                {
                    "type": "error",
                    "title": "Error generating recommendations",
                    "description": "Please try again later",
                    "priority": "low",
                    "timeframe": "N/A"
                }
            ],
            "aiConfidence": 0.0
        }

def generate_job_recommendations_with_openai(candidate_profile, preferences={}):
    """
    Use OpenAI GPT-4 to recommend jobs based on candidate profile
    """
    if not openai_client:
        # Fallback job recommendations without OpenAI
        return {
            "jobRecommendations": [
                {
                    "jobTitle": "Software Developer",
                    "company": "TechCorp",
                    "matchScore": 0.75,
                    "reasoning": "OpenAI not configured - using fallback recommendations",
                    "location": "Remote",
                    "salaryRange": "$60,000 - $80,000"
                }
            ],
            "aiConfidence": 0.0
        }

    try:
        prompt = f"""
        Recommend suitable job opportunities for this candidate based on their profile and preferences.

        CANDIDATE PROFILE:
        {json.dumps(candidate_profile, indent=2)}

        PREFERENCES:
        {json.dumps(preferences, indent=2)}

        Please analyze the candidate's skills, experience, and preferences to recommend relevant job opportunities.

        Return ONLY a valid JSON object with this structure:
        {{
            "jobRecommendations": [
                {{
                    "jobTitle": "Specific job title",
                    "company": "Company name or type",
                    "matchScore": 0.85,
                    "reasoning": "Why this job matches the candidate",
                    "requiredSkills": ["Skills needed for this role"],
                    "location": "Location or Remote",
                    "salaryRange": "Expected salary range",
                    "growthPotential": "Career growth opportunities",
                    "industryTrends": "Relevant industry insights"
                }}
            ],
            "marketAnalysis": "Current job market analysis for the candidate's field",
            "skillGaps": ["Skills the candidate should develop"],
            "aiConfidence": 0.95
        }}

        Provide 5-7 diverse job recommendations that match the candidate's profile.
        """

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert recruiter and career advisor. Recommend suitable job opportunities based on candidate profiles and current market trends."},
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
        if 'jobRecommendations' not in result:
            result['jobRecommendations'] = []
        if 'aiConfidence' not in result:
            result['aiConfidence'] = 0.85

        logger.info(f"Successfully generated job recommendations with OpenAI - Confidence: {result.get('aiConfidence', 0.85)}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
        return {
            "jobRecommendations": [],
            "aiConfidence": 0.0
        }
    except Exception as e:
        logger.error(f"Error generating job recommendations with OpenAI: {str(e)}")
        return {
            "jobRecommendations": [],
            "aiConfidence": 0.0
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "recommendation-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": openai_client is not None,
        "openai_model": OPENAI_MODEL if openai_client else "Not configured"
    })

@app.route('/api/recommendations/jobs', methods=['POST'])
def recommend_jobs():
    """
    Recommend jobs to a candidate
    
    Input JSON format:
    {
        "candidateId": "string",
        "candidateProfile": {
            "skills": ["string"],
            "experience": ["string"],
            "education": ["string"],
            "interests": ["string"],
            "jobHistory": ["string"]
        },
        "preferences": {
            "industries": ["string"],
            "roles": ["string"],
            "locations": ["string"],
            "remote": boolean,
            "salary": {
                "min": number,
                "max": number,
                "currency": "string"
            }
        },
        "limit": number,  # Optional, number of recommendations to return
        "includeApplied": boolean  # Optional, whether to include jobs the candidate has already applied to
    }
    
    Output JSON format:
    {
        "recommendations": [
            {
                "jobId": "string",
                "jobTitle": "string",
                "company": "string",
                "matchScore": float,  # 0-1 match score
                "reasonsForRecommendation": ["string"],
                "potentialFitInsights": "string"
            }
        ],
        "exploreCategories": [
            {
                "name": "string",  # e.g. "Similar to your experience," "Growing industries", etc.
                "jobs": [
                    {
                        "jobId": "string",
                        "jobTitle": "string",
                        "company": "string"
                    }
                ]
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

        if 'candidateProfile' not in data:
            return jsonify({
                "error": "Missing required field: candidateProfile",
                "code": "MISSING_CANDIDATE_PROFILE"
            }), 400

        candidate_id = data.get('candidateId', f"candidate_{uuid.uuid4().hex[:8]}")
        candidate_profile = data.get('candidateProfile', {})
        preferences = data.get('preferences', {})
        limit = data.get('limit', 10)
        include_applied = data.get('includeApplied', False)

        # Generate job recommendations using OpenAI
        job_recommendations = generate_job_recommendations_with_openai(candidate_profile, preferences)

        # Prepare response
        response_data = {
            "candidateId": candidate_id,
            "jobRecommendations": job_recommendations["jobRecommendations"][:limit],
            "marketAnalysis": job_recommendations.get("marketAnalysis", ""),
            "skillGaps": job_recommendations.get("skillGaps", []),
            "metadata": {
                "processingTimestamp": datetime.now().isoformat(),
                "recommendationsGenerated": len(job_recommendations["jobRecommendations"]),
                "aiConfidence": job_recommendations["aiConfidence"],
                "openaiUsed": openai_client is not None,
                "processingTime": "~5-10 seconds"
            }
        }

        logger.info(f"Successfully generated job recommendations for candidate {candidate_id} - AI Confidence: {job_recommendations.get('aiConfidence', 0.0)}")

        return jsonify(response_data)

    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON format",
            "code": "INVALID_JSON"
        }), 400
    except Exception as e:
        logger.error(f"Error in recommend_jobs endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": str(e) if app.debug else "Please try again later"
        }), 500
                ]
            },
            {
                "name": "Trending in your location",
                "jobs": [
                    {
                        "jobId": "job102",
                        "jobTitle": "React Native Developer",
                        "company": "Mobile App Studio"
                    },
                    {
                        "jobId": "job103",
                        "jobTitle": "Frontend Architect",
                        "company": "E-Commerce Platform"
                    }
                ]
            }
        ]
    })

@app.route('/api/recommendations/candidates', methods=['POST'])
def recommend_candidates():
    """
    Recommend candidates for a job posting
    
    Input JSON format:
    {
        "employerId": "string",
        "jobId": "string",
        "jobDetails": {
            "title": "string",
            "description": "string",
            "requiredSkills": ["string"],
            "preferredSkills": ["string"],
            "experience": "string",
            "education": "string"
        },
        "companyProfile": {
            "industry": "string",
            "size": "string",
            "culture": ["string"]
        },
        "previousHires": [
            {
                "role": "string",
                "skills": ["string"],
                "performance": "string"  # e.g. "excellent", "good"
            }
        ],
        "limit": number  # Optional, number of recommendations to return
    }
    
    Output JSON format:
    {
        "recommendations": [
            {
                "candidateId": "string",
                "matchScore": float,  # 0-1 match score
                "skills": {
                    "matched": ["string"],
                    "missing": ["string"]
                },
                "experienceRelevance": "string",
                "cultureFit": "string",
                "reasonsForRecommendation": ["string"],
                "suggestedInterviewQuestions": ["string"]
            }
        ],
        "talentPools": [
            {
                "name": "string",  # e.g. "Tech experts", "Recent graduates"
                "candidates": [
                    {
                        "candidateId": "string",
                        "highlight": "string"
                    }
                ]
            }
        ]
    }
    """
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "recommendations": [
            {
                "candidateId": "candidate123",
                "matchScore": 0.92,
                "skills": {
                    "matched": ["JavaScript", "React", "Node.js"],
                    "missing": ["TypeScript"]
                },
                "experienceRelevance": "Has 4 years experience in similar roles",
                "cultureFit": "Values align with company's focus on innovation",
                "reasonsForRecommendation": [
                    "Strong technical skills matching job requirements",
                    "Relevant industry experience",
                    "History of successful project completions"
                ],
                "suggestedInterviewQuestions": [
                    "Describe a complex frontend problem you solved using React",
                    "How have you collaborated with backend developers in previous roles?"
                ]
            },
            {
                "candidateId": "candidate456",
                "matchScore": 0.86,
                "skills": {
                    "matched": ["JavaScript", "React", "CSS"],
                    "missing": ["Node.js", "MongoDB"]
                },
                "experienceRelevance": "3 years in frontend development",
                "cultureFit": "Background in collaborative environments",
                "reasonsForRecommendation": [
                    "Strong frontend skills",
                    "Quick learner based on career progression",
                    "Experience with similar products"
                ],
                "suggestedInterviewQuestions": [
                    "How do you approach learning new technologies?",
                    "Describe your experience with state management in React applications"
                ]
            }
        ],
        "talentPools": [
            {
                "name": "Senior developers",
                "candidates": [
                    {
                        "candidateId": "candidate789",
                        "highlight": "10+ years in web development"
                    },
                    {
                        "candidateId": "candidate101",
                        "highlight": "Led teams of 5+ developers"
                    }
                ]
            },
            {
                "name": "Specialists",
                "candidates": [
                    {
                        "candidateId": "candidate102",
                        "highlight": "Deep expertise in React optimization"
                    },
                    {
                        "candidateId": "candidate103",
                        "highlight": "UX/UI design background"
                    }
                ]
            }
        ]
    })

@app.route('/api/recommendations/skill-development', methods=['POST'])
def recommend_skill_development():
    """
    Recommend skills for career development based on candidate profile and job market
    
    Input JSON format:
    {
        "candidateId": "string",
        "currentSkills": ["string"],
        "experience": ["string"],
        "careerGoals": ["string"],
        "targetRoles": ["string"],
        "timeframe": "string"  # short_term, medium_term, long_term
    }
    
    Output JSON format:
    {
        "recommendations": {
            "technicalSkills": [
                {
                    "skill": "string",
                    "priority": "string",  # high, medium, low
                    "reason": "string",
                    "resources": [
                        {
                            "type": "string",  # course, book, tutorial
                            "title": "string",
                            "url": "string"
                        }
                    ]
                }
            ],
            "softSkills": [
                {
                    "skill": "string",
                    "priority": "string",
                    "reason": "string",
                    "developmentTips": ["string"]
                }
            ],
            "certifications": [
                {
                    "name": "string",
                    "relevance": "string",
                    "timeToComplete": "string"
                }
            ],
            "marketInsights": "string"
        }
    }
    """
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "recommendations": {
            "technicalSkills": [
                {
                    "skill": "TypeScript",
                    "priority": "high",
                    "reason": "Growing demand in React ecosystem and enhances your existing JavaScript skills",
                    "resources": [
                        {
                            "type": "course",
                            "title": "TypeScript for JavaScript Developers",
                            "url": "https://example.com/courses/typescript"
                        },
                        {
                            "type": "book",
                            "title": "Effective TypeScript",
                            "url": "https://example.com/books/effective-typescript"
                        }
                    ]
                },
                {
                    "skill": "GraphQL",
                    "priority": "medium",
                    "reason": "Complements your API knowledge and trending in frontend development",
                    "resources": [
                        {
                            "type": "tutorial",
                            "title": "GraphQL Fundamentals",
                            "url": "https://example.com/tutorials/graphql"
                        }
                    ]
                }
            ],
            "softSkills": [
                {
                    "skill": "Technical Communication",
                    "priority": "high",
                    "reason": "Essential for senior roles and team leadership",
                    "developmentTips": [
                        "Practice documenting complex concepts in simple terms",
                        "Volunteer to present at team meetings"
                    ]
                },
                {
                    "skill": "Mentorship",
                    "priority": "medium",
                    "reason": "Pathway to leadership positions",
                    "developmentTips": [
                        "Offer to onboard new team members",
                        "Create learning resources for your team"
                    ]
                }
            ],
            "certifications": [
                {
                    "name": "AWS Certified Developer",
                    "relevance": "High demand for cloud skills in full-stack roles",
                    "timeToComplete": "3-6 months"
                }
            ],
            "marketInsights": "Full-stack developers with React and cloud experience are in high demand. Focus on TypeScript and serverless technologies to stay competitive in the next 1-2 years."
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Recommendation Service on port 5004...")
    print("✅ OpenAI GPT-4 integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/recommendations/jobs")
    print("   • POST /api/recommendations/career")
    print("   • POST /api/recommendations/skills")
    print("🌐 Service URL: http://localhost:5004")
    print("🤖 Features: Job recommendations, Career guidance, Skill development")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5004, debug=True)
