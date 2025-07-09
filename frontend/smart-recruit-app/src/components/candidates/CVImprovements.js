import React, { useState } from 'react';
import './CVImprovements.css';

const CVImprovements = ({ cvText, onClose }) => {
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false); // Prevent double requests

  const analyzeCV = async () => {
    if (!cvText || !cvText.trim()) {
      setError('No CV content available to analyze');
      return;
    }

    // Prevent double requests
    if (isRequesting) {
      console.log('Request already in progress, skipping...');
      return;
    }

    setIsRequesting(true);
    setLoading(true);
    setError(null);
    setImprovements([]);
    setHasAnalyzed(false);

    try {
      const response = await fetch('http://localhost:3000/api/candidates/cv-improvements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText: cvText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.improvements && Array.isArray(data.improvements)) {
        setImprovements(data.improvements);
        setHasAnalyzed(true);

        // Show quota warning if present
        if (data.quotaExceeded) {
          console.warn('OpenAI quota exceeded - showing fallback suggestions');
        }
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('CV Analysis Error:', err);
      setError(err.message || 'Failed to analyze CV. Please try again.');
    } finally {
      setLoading(false);
      setIsRequesting(false); // Reset request flag
    }
  };

  React.useEffect(() => {
    if (cvText && cvText.trim() && !hasAnalyzed) {
      analyzeCV();
    }
  }, [cvText]); // Only depend on cvText, not hasAnalyzed

  return (
    <div className="cv-improvements-modal">
      <div className="cv-improvements-content">
        <div className="cv-improvements-header">
          <h2>🎯 CV Improvement Suggestions</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="cv-improvements-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing your CV with AI...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Analysis Failed</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={analyzeCV}>
                Try Again
              </button>
            </div>
          )}

          {improvements.length > 0 && (
            <div className="improvements-list">
              <div className="improvements-intro">
                <p>Based on AI analysis of your CV, here are specific suggestions to improve your profile:</p>
              </div>
              
              {improvements.map((improvement, index) => (
                <div key={index} className="improvement-item">
                  <div className="improvement-number">{index + 1}</div>
                  <div className="improvement-content">
                    <p>{improvement}</p>
                  </div>
                </div>
              ))}

              <div className="improvements-footer">
                <div className="ai-badge">
                  <span>🤖 Powered by AI Analysis</span>
                </div>
                <button className="analyze-again-btn" onClick={analyzeCV}>
                  Analyze Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVImprovements;
