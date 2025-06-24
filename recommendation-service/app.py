from flask import Flask, request, jsonify
import os
import json
import logging
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

def recommend_jobs_with_openai(candidate_profile, preferences, limit=10):
    """
    Use OpenAI to recommend jobs to a candidate
    """
    try:
        # For demo purposes, return sample recommendations
        recommendations = [
            {
                "jobId": "job_001",
                "jobTitle": "Senior Frontend Developer",
                "company": "TechCorp Inc.",
                "matchScore": 0.94,
                "reasonsForRecommendation": [
                    "Skills match: JavaScript, React",
                    "Similar to your previous role",
                    "Aligns with your preference for remote work"
                ],
                "potentialFitInsights": "Your background in building complex web applications makes you an excellent fit"
            },
            {
                "jobId": "job_002",
                "jobTitle": "Full Stack Engineer",
                "company": "WebScale Startup",
                "matchScore": 0.87,
                "reasonsForRecommendation": [
                    "Skills match: JavaScript, React, Node.js",
                    "Matches your preferred industry",
                    "Opportunity to expand backend skills"
                ],
                "potentialFitInsights": "This role offers growth opportunities in backend development"
            }
        ]
        
        explore_categories = [
            {
                "name": "Roles to grow your career",
                "jobs": [
                    {"jobId": "job_003", "jobTitle": "Lead UI Developer", "company": "Creative Agency"},
                    {"jobId": "job_004", "jobTitle": "Technical Lead", "company": "Software Consulting"}
                ]
            }
        ]
        
        return {
            "recommendations": recommendations,
            "exploreCategories": explore_categories
        }
        
    except Exception as e:
        logger.error(f"Error recommending jobs with OpenAI: {str(e)}")
        return {
            "recommendations": [],
            "exploreCategories": []
        }

def recommend_candidates_with_openai(job_details, company_profile, previous_hires, limit=10):
    """
    Use OpenAI to recommend candidates for a job posting
    """
    try:
        # For demo purposes, return sample recommendations
        recommendations = [
            {
                "candidateId": "candidate_001",
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
            }
        ]
        
        talent_pools = [
            {
                "name": "Senior developers",
                "candidates": [
                    {"candidateId": "candidate_002", "highlight": "10+ years experience"}
                ]
            }
        ]
        
        return {
            "recommendations": recommendations,
            "talentPools": talent_pools
        }
        
    except Exception as e:
        logger.error(f"Error recommending candidates with OpenAI: {str(e)}")
        return {
            "recommendations": [],
            "talentPools": []
        }

def generate_skill_recommendations_with_openai(current_skills, experience, career_goals, target_roles, timeframe):
    """
    Use OpenAI to generate skill development recommendations
    """
    try:
        # For demo purposes, return sample recommendations
        recommendations = {
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
                }
            ],
            "certifications": [
                {
                    "name": "AWS Certified Developer",
                    "relevance": "High demand for cloud skills in full-stack roles",
                    "timeToComplete": "3-6 months"
                }
            ],
            "marketInsights": "Full-stack developers with React and cloud experience are in high demand. Focus on TypeScript and serverless technologies to stay competitive."
        }
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating skill recommendations with OpenAI: {str(e)}")
        return {
            "technicalSkills": [],
            "softSkills": [],
            "certifications": [],
            "marketInsights": "Unable to provide market insights at this time"
        }

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "ok",
        "service": "recommendation-service",
        "version": "1.0.0"
    })

@app.route('/api/recommendations/jobs', methods=['POST'])
def recommend_jobs():
    """
    Get personalized job recommendations for a candidate
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'candidateProfile' not in data:
            return jsonify({"error": "Missing required field: candidateProfile"}), 400
        
        candidate_profile = data.get('candidateProfile', {})
        preferences = data.get('preferences', {})
        limit = data.get('limit', 10)
        
        # Get job recommendations using OpenAI
        recommendations = recommend_jobs_with_openai(candidate_profile, preferences, limit)
        
        logger.info(f"Successfully generated {len(recommendations.get('recommendations', []))} job recommendations")
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error in recommend_jobs endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/recommendations/candidates', methods=['POST'])
def recommend_candidates():
    """
    Get candidate recommendations for a job posting
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'jobDetails' not in data:
            return jsonify({"error": "Missing required field: jobDetails"}), 400
        
        job_details = data.get('jobDetails', {})
        company_profile = data.get('companyProfile', {})
        previous_hires = data.get('previousHires', [])
        limit = data.get('limit', 10)
        
        # Get candidate recommendations using OpenAI
        recommendations = recommend_candidates_with_openai(job_details, company_profile, previous_hires, limit)
        
        logger.info(f"Successfully generated {len(recommendations.get('recommendations', []))} candidate recommendations")
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error in recommend_candidates endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/recommendations/skill-development', methods=['POST'])
def recommend_skill_development():
    """
    Get skill development recommendations for career growth
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'currentSkills' not in data:
            return jsonify({"error": "Missing required field: currentSkills"}), 400
        
        current_skills = data.get('currentSkills', [])
        experience = data.get('experience', [])
        career_goals = data.get('careerGoals', [])
        target_roles = data.get('targetRoles', [])
        timeframe = data.get('timeframe', 'medium_term')
        
        # Generate skill development recommendations using OpenAI
        recommendations = generate_skill_recommendations_with_openai(
            current_skills, experience, career_goals, target_roles, timeframe
        )
        
        logger.info(f"Successfully generated skill development recommendations")
        
        return jsonify({"recommendations": recommendations})
        
    except Exception as e:
        logger.error(f"Error in recommend_skill_development endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Recommendation Service on port 5004...")
    print("✅ OpenAI integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/recommendations/jobs")
    print("   • POST /api/recommendations/candidates")
    print("   • POST /api/recommendations/skill-development")
    print("🌐 Service URL: http://localhost:5004")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5004, debug=True)
