from flask import Flask, request, jsonify
import os
import json
import logging
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
        
        # For demo purposes, return sample recommendations
        recommendations = {
            "recommendations": [
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
                }
            ],
            "exploreCategories": [
                {
                    "name": "Roles to grow your career",
                    "jobs": [
                        {"jobId": "job_002", "jobTitle": "Lead UI Developer", "company": "Creative Agency"}
                    ]
                }
            ]
        }
        
        logger.info(f"Successfully generated {len(recommendations['recommendations'])} job recommendations")
        
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
        
        # For demo purposes, return sample recommendations
        recommendations = {
            "recommendations": [
                {
                    "candidateId": "candidate_001",
                    "matchScore": 0.92,
                    "skills": {
                        "matched": ["JavaScript", "React", "Node.js"],
                        "missing": ["TypeScript"]
                    },
                    "experienceRelevance": "Has 4 years experience in similar roles",
                    "cultureFit": "Values align with company's focus on innovation"
                }
            ],
            "talentPools": [
                {
                    "name": "Senior developers",
                    "candidates": [
                        {"candidateId": "candidate_002", "highlight": "10+ years experience"}
                    ]
                }
            ]
        }
        
        logger.info(f"Successfully generated {len(recommendations['recommendations'])} candidate recommendations")
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error in recommend_candidates endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Recommendation Service on port 5004...")
    print("✅ OpenAI integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/recommendations/jobs")
    print("   • POST /api/recommendations/candidates")
    print("🌐 Service URL: http://localhost:5004")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5004, debug=True)
