# 🤖 RECRUTAI AI Services

## Vue d'ensemble

RECRUTAI AI Services est une suite de microservices alimentés par l'IA qui automatisent et optimisent le processus de recrutement. Chaque service utilise OpenAI GPT-4 pour fournir des analyses intelligentes et des recommandations personnalisées.

## 🏗️ Architecture

### Services Disponibles

1. **🔍 Analysis Service (Port 5002)**
   - Analyse de CVs avec extraction d'informations structurées
   - Analyse de descriptions d'emploi
   - Extraction de compétences et d'expérience

2. **🎯 Matching Service (Port 5001)**
   - Matching emploi-candidats intelligent
   - Scores de compatibilité
   - Analyse des compétences manquantes

3. **📄 Document Service (Port 5003)**
   - Personnalisation de CVs pour emplois spécifiques
   - Génération de lettres de motivation
   - Templates et styles multiples

4. **💡 Recommendation Service (Port 5004)**
   - Recommandations d'emplois personnalisées
   - Recommandations de candidats pour employeurs
   - Conseils de développement de compétences

## 🚀 Installation Rapide

### 1. Installer les Dépendances
```bash
install-dependencies.bat
```

### 2. Configure Environment
Configure your OpenAI API key in `.env.global`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start All Services
```bash
# Start all services at once
start-all-services.bat

# Or start individually
cd analysis-service && python app.py
cd matching-service && python app.py
cd document-service && python app.py
cd recommendation-service && python app.py
```

### 4. Verify Installation
```bash
python verify-installation.py
```

## 📋 API Documentation

### Analysis Service (Port 5002)

#### Analyze CV
```bash
POST /api/analyze/cv
Content-Type: application/json

{
  "cvId": "cv_123",
  "cvText": "John Doe\nSoftware Developer\n...",
  "language": "en"
}
```

#### Analyze Job
```bash
POST /api/analyze/job
Content-Type: application/json

{
  "jobId": "job_456",
  "jobTitle": "Frontend Developer",
  "jobDescription": "We are looking for...",
  "company": "TechCorp"
}
```

### Matching Service (Port 5001)

#### Match Job to Candidates
```bash
POST /api/match/job-to-candidates
Content-Type: application/json

{
  "jobId": "job_123",
  "jobDescription": "Looking for React developer...",
  "requiredSkills": ["JavaScript", "React"],
  "limit": 10
}
```

#### Match Candidate to Jobs
```bash
POST /api/match/candidate-to-jobs
Content-Type: application/json

{
  "candidateId": "candidate_123",
  "resumeText": "Experienced developer...",
  "skills": ["JavaScript", "React"],
  "limit": 10
}
```

### Document Service (Port 5003)

#### Customize CV
```bash
POST /api/documents/customize-cv
Content-Type: application/json

{
  "cvData": {
    "candidateName": "John Doe",
    "skills": ["JavaScript", "React"]
  },
  "jobData": {
    "jobTitle": "Frontend Developer",
    "requiredSkills": ["React", "TypeScript"]
  },
  "template": "professional"
}
```

#### Generate Cover Letter
```bash
POST /api/documents/generate-cover-letter
Content-Type: application/json

{
  "candidateName": "John Doe",
  "jobTitle": "Frontend Developer",
  "company": "TechCorp",
  "style": "professional",
  "tone": "formal"
}
```

### Recommendation Service (Port 5004)

#### Job Recommendations
```bash
POST /api/recommendations/jobs
Content-Type: application/json

{
  "candidateProfile": {
    "skills": ["JavaScript", "React"],
    "experience": "3 years",
    "location": "Montreal"
  },
  "preferences": {
    "remote": true,
    "industry": "technology"
  }
}
```

#### Candidate Recommendations
```bash
POST /api/recommendations/candidates
Content-Type: application/json

{
  "jobDetails": {
    "jobTitle": "Frontend Developer",
    "requiredSkills": ["React", "JavaScript"],
    "experienceLevel": "mid-level"
  },
  "limit": 10
}
```

## 🧪 Testing

### Health Checks
```bash
curl http://localhost:5002/health  # Analysis Service
curl http://localhost:5001/health  # Matching Service
curl http://localhost:5003/health  # Document Service
curl http://localhost:5004/health  # Recommendation Service
```

### Run All Tests
```bash
python run-all-tests.py
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)

### Service Ports
- Analysis Service: 5002
- Matching Service: 5001
- Document Service: 5003
- Recommendation Service: 5004

## 🚀 Deployment

### Docker (Optional)
Each service can be containerized:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5002
CMD ["python", "app.py"]
```

### Production Considerations
- Use environment variables for API keys
- Implement proper logging and monitoring
- Add rate limiting and authentication
- Use a reverse proxy (nginx) for load balancing

## 🔒 Security

- API keys are stored in environment variables
- No sensitive data is logged
- Input validation on all endpoints
- CORS configured for web integration

## 📊 Monitoring

Each service provides:
- Health check endpoints
- Structured logging
- Error handling and reporting
- Performance metrics

## 🤝 Integration

### With Main Application
```python
import requests

# Example: Analyze a CV
response = requests.post('http://localhost:5002/api/analyze/cv', json={
    'cvText': cv_content
})
analysis = response.json()
```

### With Frontend
```javascript
// Example: Get job recommendations
const response = await fetch('http://localhost:5004/api/recommendations/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateProfile: profile })
});
const recommendations = await response.json();
```

## 🆘 Troubleshooting

### Common Issues

1. **Service not starting**
   - Check if port is already in use
   - Verify Python dependencies are installed
   - Check OpenAI API key configuration

2. **OpenAI API errors**
   - Verify API key is valid and has credits
   - Check internet connection
   - Review API rate limits

3. **Import errors**
   - Run `pip install -r requirements.txt`
   - Check Python version (3.8+ required)

### Logs
Each service logs to console. Check terminal windows for error messages.

## 📈 Performance

- Average response time: 2-5 seconds (depending on OpenAI API)
- Concurrent requests: Supports multiple simultaneous requests
- Memory usage: ~100-200MB per service

## 🔄 Updates

To update services:
1. Pull latest code
2. Update dependencies: `pip install -r requirements.txt`
3. Restart services

---

**🎉 Your RECRUTAI AI Services are ready to revolutionize recruitment!**
