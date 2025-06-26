from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "matching-service"})

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
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "matches": [
            {
                "candidateId": "candidate123",
                "score": 0.92,
                "matchedSkills": ["JavaScript", "React", "Node.js"],
                "missingSkills": ["MongoDB"],
                "relevantExperience": ["3 years web development"]
            },
            {
                "candidateId": "candidate456",
                "score": 0.85,
                "matchedSkills": ["JavaScript", "React"],
                "missingSkills": ["Node.js", "MongoDB"],
                "relevantExperience": ["2 years frontend development"]
            }
        ]
    })

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
