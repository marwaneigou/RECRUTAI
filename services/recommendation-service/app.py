from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "recommendation-service"})

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
    # This is a placeholder - replace with actual AI implementation
    data = request.json
    
    # Placeholder response
    return jsonify({
        "recommendations": [
            {
                "jobId": "job123",
                "jobTitle": "Senior Frontend Developer",
                "company": "Tech Solutions Inc.",
                "matchScore": 0.94,
                "reasonsForRecommendation": [
                    "Skills match: JavaScript, React",
                    "Similar to your previous role at Digital Innovations",
                    "Aligns with your preference for remote work"
                ],
                "potentialFitInsights": "Your background in building complex web applications makes you an excellent fit"
            },
            {
                "jobId": "job456",
                "jobTitle": "Full Stack Engineer",
                "company": "WebScale Startup",
                "matchScore": 0.87,
                "reasonsForRecommendation": [
                    "Skills match: JavaScript, React, Node.js",
                    "Matches your preferred industry",
                    "Opportunity to expand backend skills"
                ],
                "potentialFitInsights": "This role offers growth opportunities in backend development while leveraging your frontend strengths"
            }
        ],
        "exploreCategories": [
            {
                "name": "Roles to grow your career",
                "jobs": [
                    {
                        "jobId": "job789",
                        "jobTitle": "Lead UI Developer",
                        "company": "Creative Agency"
                    },
                    {
                        "jobId": "job101",
                        "jobTitle": "Technical Lead",
                        "company": "Software Consulting Firm"
                    }
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
    app.run(host='0.0.0.0', port=5004, debug=True)
