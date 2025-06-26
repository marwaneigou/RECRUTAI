from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "analysis-service"})

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
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "analysis": {
            "personalInfo": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1 555-123-4567",
                "location": "Montreal, Canada"
            },
            "skills": ["Problem solving", "Team leadership", "Communication"],
            "technicalSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
            "softSkills": ["Team collaboration", "Project management"],
            "experience": [
                {
                    "title": "Senior Developer",
                    "company": "Tech Company Inc.",
                    "duration": "2020-2023",
                    "description": "Led development team on web projects",
                    "highlights": ["Improved performance by 30%", "Mentored junior developers"]
                },
                {
                    "title": "Web Developer",
                    "company": "Digital Solutions Ltd.",
                    "duration": "2017-2020",
                    "description": "Developed responsive web applications",
                    "highlights": ["Built e-commerce platform", "Integrated payment systems"]
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "institution": "University of Technology",
                    "year": "2017",
                    "subjects": ["Software Engineering", "Database Systems"]
                }
            ],
            "languages": [
                {
                    "language": "English",
                    "proficiency": "Native"
                },
                {
                    "language": "French",
                    "proficiency": "Professional"
                }
            ],
            "strengths": ["Technical expertise", "Fast learner"],
            "improvementAreas": ["Add more project details", "Highlight leadership roles"]
        }
    })

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
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "analysis": {
            "requiredSkills": ["JavaScript", "React", "Node.js"],
            "preferredSkills": ["MongoDB", "AWS", "TypeScript"],
            "requiredExperience": "3+ years",
            "educationRequirements": "Bachelor's degree in Computer Science or equivalent",
            "jobResponsibilities": [
                "Develop and maintain web applications",
                "Collaborate with cross-functional teams",
                "Optimize application performance",
                "Implement responsive design"
            ],
            "companyValues": ["Innovation", "Collaboration", "Work-life balance"],
            "benefits": ["Health insurance", "Remote work options", "Professional development"],
            "employmentType": "Full-time",
            "location": "Montreal, Canada",
            "remote": True,
            "seniority": "Mid-level",
            "industry": "Technology",
            "keywords": ["Full-stack", "Web development", "React", "Node.js"]
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
