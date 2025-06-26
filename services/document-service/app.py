from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "document-service"})

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
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "customizedCv": {
            "id": "custom_cv_123",
            "documentUrl": "/documents/custom_cv_123.pdf",
            "customizations": [
                {
                    "type": "skill_highlight",
                    "description": "Highlighted JavaScript and React skills"
                },
                {
                    "type": "experience_reorder",
                    "description": "Prioritized web development experience"
                },
                {
                    "type": "summary_customization",
                    "description": "Tailored summary to match job requirements"
                }
            ],
            "format": "pdf",
            "recommendations": [
                "Consider adding TypeScript to your skillset",
                "Elaborate on team leadership experience"
            ]
        }
    })

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
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "coverLetter": {
            "id": "cover_letter_456",
            "documentUrl": "/documents/cover_letter_456.pdf",
            "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the [Job Title] position at [Company]...",
            "format": "pdf",
            "suggestions": [
                "Mention your experience with React in the first paragraph",
                "Reference the company's recent achievements"
            ]
        }
    })

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
    app.run(host='0.0.0.0', port=5003, debug=True)
