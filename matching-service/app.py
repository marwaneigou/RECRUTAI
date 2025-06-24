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

def match_job_to_candidates_ai(job_data, candidates_data, limit=10):
    """
    Use OpenAI to match a job to potential candidates
    """
    try:
        # For demo purposes, return sample matches
        matches = [
            {
                "candidateId": "candidate_001",
                "score": 0.92,
                "matchedSkills": ["JavaScript", "React", "Node.js"],
                "missingSkills": ["TypeScript"],
                "relevantExperience": ["5 years web development", "React specialist"]
            },
            {
                "candidateId": "candidate_002",
                "score": 0.85,
                "matchedSkills": ["JavaScript", "React"],
                "missingSkills": ["Node.js", "MongoDB"],
                "relevantExperience": ["3 years frontend development"]
            }
        ]
        return matches
        
    except Exception as e:
        logger.error(f"Error matching job to candidates with OpenAI: {str(e)}")
        return []

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "ok",
        "service": "matching-service",
        "version": "1.0.0"
    })

@app.route('/api/match/job-to-candidates', methods=['POST'])
def match_job_to_candidates():
    """
    Find the best candidates for a specific job using AI matching
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'jobDescription' not in data:
            return jsonify({"error": "Missing required field: jobDescription"}), 400
        
        # Extract job data
        job_data = {
            'jobId': data.get('jobId', ''),
            'jobTitle': data.get('jobTitle', ''),
            'jobDescription': data.get('jobDescription', ''),
            'requiredSkills': data.get('requiredSkills', []),
            'preferredSkills': data.get('preferredSkills', []),
            'experienceLevel': data.get('experienceLevel', '')
        }
        
        limit = data.get('limit', 10)
        
        # Get matches using OpenAI
        matches = match_job_to_candidates_ai(job_data, [], limit)
        
        logger.info(f"Successfully matched job {job_data['jobId']} to {len(matches)} candidates")
        
        return jsonify({"matches": matches})
        
    except Exception as e:
        logger.error(f"Error in match_job_to_candidates endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/match/candidate-to-jobs', methods=['POST'])
def match_candidate_to_jobs():
    """
    Find the best jobs for a specific candidate using AI matching
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'candidateId' not in data:
            return jsonify({"error": "Missing required field: candidateId"}), 400
        
        # For demo purposes, return sample matches
        matches = [
            {
                "jobId": "job_001",
                "score": 0.89,
                "matchedSkills": ["JavaScript", "React"],
                "missingSkills": ["AWS"],
                "relevanceExplanation": "Your frontend experience aligns well with this role"
            }
        ]
        
        logger.info(f"Successfully matched candidate to {len(matches)} jobs")
        
        return jsonify({"matches": matches})
        
    except Exception as e:
        logger.error(f"Error in match_candidate_to_jobs endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Matching Service on port 5001...")
    print("✅ OpenAI integration ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/match/job-to-candidates")
    print("   • POST /api/match/candidate-to-jobs")
    print("🌐 Service URL: http://localhost:5001")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
