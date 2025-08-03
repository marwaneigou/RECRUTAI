# AI-Powered Job Recommendation System

## Overview

This document describes the implementation of an AI-powered job recommendation system for the RecrutIA platform. The system uses machine learning algorithms to match candidates with relevant job opportunities based on their CV, skills, experience, and preferences.

## Architecture

### Components

1. **Frontend (React)**: Candidate dashboard with job recommendations
2. **Backend API (Node.js/Express)**: Job recommendation endpoints and caching
3. **AI Matching Service (Python/Flask)**: Machine learning algorithms for job matching
4. **Database**: PostgreSQL for structured data, MongoDB for AI analysis and caching
5. **Analytics**: Interaction tracking and feedback system

### Data Flow

```
Candidate Dashboard → Backend API → AI Matching Service → Job Recommendations
                                ↓
                         MongoDB (Analytics & Cache)
                                ↓
                         PostgreSQL (Jobs & Profiles)
```

## Features

### 1. AI-Powered Matching

- **Skills Matching**: Compares candidate skills with job requirements
- **Experience Matching**: Evaluates experience level compatibility
- **Location Matching**: Considers location preferences and remote work options
- **Salary Matching**: Aligns salary expectations with job offers
- **OpenAI Integration**: Uses GPT-4 for intelligent matching analysis

### 2. Real-time Recommendations

- **Dynamic Loading**: Fetches recommendations from live job database
- **Match Scoring**: Provides percentage match scores for each recommendation
- **Reasoning**: AI-generated explanations for why jobs are recommended
- **Skills Analysis**: Shows matched and missing skills for each position

### 3. Performance Optimization

- **Caching System**: 30-minute cache for job recommendations
- **Background Processing**: Pre-calculates matches for better performance
- **Pagination**: Limits results to prevent overload
- **Fallback Algorithms**: Simple matching when AI service is unavailable

### 4. Analytics & Feedback

- **Interaction Tracking**: Monitors user actions (view, apply, save, dismiss)
- **Feedback System**: Thumbs up/down rating for recommendations
- **Analytics Dashboard**: Admin view of recommendation effectiveness
- **Continuous Learning**: Feedback improves future recommendations

## API Endpoints

### Job Recommendations

```http
GET /ai-features/job-recommendations
```

**Parameters:**
- `limit` (optional): Number of recommendations (default: 10)
- `refresh` (optional): Force refresh cache (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "jobId": 123,
        "title": "Senior Frontend Developer",
        "company": "TechCorp",
        "location": "Paris, France",
        "matchScore": 94,
        "skillsMatch": 90,
        "experienceMatch": 95,
        "reasoning": "Your React and JavaScript skills align perfectly...",
        "matchedSkills": ["React", "JavaScript", "TypeScript"],
        "missingSkills": ["Vue.js"],
        "salary": "50k - 70k EUR",
        "remote": true
      }
    ],
    "total": 5,
    "candidateProfile": {
      "skills": ["React", "JavaScript", "Node.js"],
      "experience": 5,
      "location": "Paris, France"
    },
    "processingInfo": {
      "jobsAnalyzed": 25,
      "recommendationsGenerated": 5,
      "timestamp": "2025-01-31T10:30:00Z"
    }
  }
}
```

### Interaction Tracking

```http
POST /ai-features/track-recommendation-interaction
```

**Body:**
```json
{
  "jobId": 123,
  "action": "view", // "view", "apply", "save", "dismiss"
  "matchScore": 94,
  "metadata": {
    "source": "dashboard",
    "jobTitle": "Senior Frontend Developer"
  }
}
```

### Feedback Submission

```http
POST /ai-features/recommendation-feedback
```

**Body:**
```json
{
  "jobId": 123,
  "rating": 5, // 1-5 scale
  "feedback": "Great recommendation!",
  "improvementSuggestions": ["More remote positions"]
}
```

## Frontend Implementation

### Candidate Dashboard

The candidate dashboard displays AI-powered job recommendations with:

- **Loading States**: Skeleton loading while fetching recommendations
- **Empty States**: Helpful messages when no recommendations are available
- **Interactive Cards**: Job details with match scores and reasoning
- **Feedback Buttons**: Thumbs up/down for quick feedback
- **Action Buttons**: Apply and view details functionality

### Key Components

```javascript
// Fetch job recommendations
const fetchJobRecommendations = async () => {
  const response = await aiAPI.getJobRecommendations({ limit: 5 })
  setJobRecommendations(response.data.recommendations)
}

// Track user interactions
const handleViewJobDetails = async (job) => {
  await aiAPI.trackRecommendationInteraction(
    job.id, 'view', job.matchScore, { source: 'dashboard' }
  )
  setSelectedJob(job)
  setShowJobDetails(true)
}

// Submit feedback
const handleJobFeedback = async (job, rating) => {
  await aiAPI.submitRecommendationFeedback(job.id, rating)
  setFeedbackGiven(prev => new Set([...prev, job.id]))
}
```

## AI Matching Algorithm

### Scoring Components

1. **Skills Match (40% weight)**
   - Exact skill name matching
   - Skill category similarity
   - Required vs. preferred skills

2. **Experience Match (30% weight)**
   - Years of experience alignment
   - Seniority level compatibility
   - Industry experience relevance

3. **Location Match (20% weight)**
   - Geographic proximity
   - Remote work preferences
   - Commute feasibility

4. **Salary Match (10% weight)**
   - Expectation vs. offer alignment
   - Market rate compatibility
   - Negotiation potential

### OpenAI Integration

The system uses GPT-4 for intelligent analysis:

```python
def calculate_match_score_with_openai(cv_data, job_data):
    prompt = f"""
    Analyze the match between this candidate and job:
    
    Candidate: {cv_data}
    Job: {job_data}
    
    Return JSON with scores and reasoning.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )
    
    return parse_json_response(response)
```

## Database Schema

### MongoDB Collections

#### Job Matches
```javascript
{
  candidateId: 123,
  jobId: 456,
  matchScore: 94.5,
  skillsMatch: { score: 90, matchedSkills: [...], missingSkills: [...] },
  experienceMatch: { score: 95, candidateExp: 5, jobRequirement: "senior" },
  locationMatch: { score: 100, remoteAllowed: true },
  salaryMatch: { score: 85, candidateExpectation: 60000, jobRange: {...} },
  reasoning: "Strong technical match with excellent experience alignment",
  calculatedAt: ISODate("2025-01-31T10:30:00Z")
}
```

#### Recommendation Interactions
```javascript
{
  candidateId: 123,
  jobId: 456,
  action: "view", // "view", "apply", "save", "dismiss", "feedback"
  matchScore: 94,
  metadata: { source: "dashboard", jobTitle: "..." },
  timestamp: ISODate("2025-01-31T10:30:00Z"),
  userAgent: "...",
  ipAddress: "..."
}
```

#### Recommendation Feedback
```javascript
{
  candidateId: 123,
  jobId: 456,
  rating: 5, // 1-5 scale
  feedback: "Great recommendation!",
  improvementSuggestions: ["More remote positions"],
  submittedAt: ISODate("2025-01-31T10:30:00Z"),
  processed: false
}
```

## Performance Considerations

### Caching Strategy

- **In-Memory Cache**: 30-minute TTL for job recommendations
- **Cache Keys**: `recommendations_{candidateId}_{limit}`
- **Cache Invalidation**: Manual refresh option available
- **Memory Management**: LRU eviction for cache size control

### Background Processing

- **Scheduled Matching**: Pre-calculates matches every 2 hours
- **Batch Processing**: Processes candidates in batches of 10
- **Resource Limits**: Limits to top 20 jobs and 5 matches per candidate
- **Error Handling**: Continues processing even if individual matches fail

### Scalability

- **Horizontal Scaling**: Stateless services can be load balanced
- **Database Optimization**: Indexed queries for fast retrieval
- **API Rate Limiting**: Prevents abuse and ensures fair usage
- **Monitoring**: Comprehensive logging for performance tracking

## Testing

### Unit Tests

```bash
# Run backend tests
cd backend
npm test

# Run specific test file
npm test tests/job-recommendations.test.js
```

### Integration Tests

```bash
# Run full system integration test
node test-job-recommendations.js
```

### Test Coverage

- API endpoint functionality
- Authentication and authorization
- Caching behavior
- Error handling
- Data validation
- AI service integration

## Deployment

### Environment Variables

```bash
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.3

# Database Configuration
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...

# Service URLs
MATCHING_SERVICE_URL=http://localhost:5001
RECOMMENDATION_SERVICE_URL=http://localhost:5002
```

### Service Dependencies

1. **PostgreSQL**: Job and candidate data
2. **MongoDB**: AI analysis and caching
3. **OpenAI API**: Machine learning analysis
4. **Redis** (optional): Enhanced caching
5. **Node.js**: Backend API server
6. **Python/Flask**: AI matching service

## Monitoring & Analytics

### Key Metrics

- **Recommendation Accuracy**: Feedback ratings and application rates
- **System Performance**: Response times and cache hit rates
- **User Engagement**: Interaction rates and feedback volume
- **AI Service Health**: OpenAI API usage and error rates

### Dashboards

- **Admin Analytics**: Recommendation effectiveness and user behavior
- **Performance Monitoring**: System health and response times
- **AI Insights**: Matching accuracy and improvement opportunities

## Future Enhancements

1. **Advanced ML Models**: Custom trained models for better accuracy
2. **Real-time Updates**: WebSocket-based live recommendations
3. **Personalization**: Learning from user behavior patterns
4. **A/B Testing**: Experiment with different matching algorithms
5. **Mobile Optimization**: Native mobile app integration
6. **Multi-language Support**: Internationalization for global markets

## Conclusion

The AI-powered job recommendation system provides intelligent, personalized job matching for candidates while maintaining high performance and user experience. The system is designed to be scalable, maintainable, and continuously improving through user feedback and analytics.
