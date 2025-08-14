# RecrutIA Mobile App

AI-Powered Recruitment Platform - React Native Mobile Application

## Features

### For Job Seekers (Candidates)
- **AI-Powered Job Recommendations**: Get personalized job matches based on your profile and preferences
- **Smart Job Search**: Advanced search with filters for location, salary, experience level, and more
- **Application Tracking**: Track all your job applications in one place with real-time status updates
- **CV Builder**: Build and manage your professional CV with AI assistance
- **Profile Management**: Complete candidate profile with skills, experience, and preferences

### For Employers
- **Dashboard Analytics**: Overview of job postings, applications, and hiring metrics
- **Job Management**: Create, edit, and manage job postings
- **Candidate Management**: Review applications, manage candidate pipeline
- **Team Collaboration**: Multi-user access for hiring teams

### Core Features
- **Secure Authentication**: JWT-based authentication with secure token storage
- **Real-time Notifications**: Push notifications for application updates and new opportunities
- **Offline Support**: Core functionality works offline with data synchronization
- **Cross-Platform**: Works on both iOS and Android devices

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **UI Components**: React Native Paper (Material Design)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Secure Storage**: Expo SecureStore
- **Icons**: Expo Vector Icons
- **Forms**: React Hook Form (for web compatibility)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile/RecrutIA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update the API base URL in `src/services/api.js`
   - Set your backend server URL (default: `http://localhost:3001/api`)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - For iOS: `npm run ios`
   - For Android: `npm run android`
   - For web: `npm run web`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   ├── candidate/     # Candidate-specific screens
│   └── employer/      # Employer-specific screens
├── services/          # API services and utilities
├── theme/            # Theme configuration and styling
└── utils/            # Utility functions
```

## Configuration

### API Configuration
Update the API base URL in `src/services/api.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Theme Customization
Modify colors and styling in `src/theme/theme.js`:
```javascript
export const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  // ... other colors
};
```

## Key Features Implementation

### Authentication
- JWT token-based authentication
- Secure token storage using Expo SecureStore
- Automatic token refresh and logout on expiry
- Role-based navigation (Candidate vs Employer)

### Job Recommendations
- AI-powered job matching algorithm
- Personalized recommendations based on user profile
- Match score calculation and display
- Feedback system for improving recommendations

### Application Management
- Real-time application status tracking
- Push notifications for status updates
- Application history and analytics
- Document upload and management

### Offline Support
- Core data caching for offline access
- Automatic synchronization when online
- Offline-first architecture for better UX

## API Integration

The app integrates with the RecrutIA backend API:

- **Authentication**: `/api/auth/*`
- **Jobs**: `/api/jobs/*`
- **Applications**: `/api/applications/*`
- **AI Features**: `/api/ai/*`
- **Candidates**: `/api/candidates/*`
- **Employers**: `/api/employers/*`

## Building for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

### App Store Deployment
1. Configure app signing in `app.json`
2. Build production version
3. Upload to respective app stores

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Implement proper error handling
- Use TypeScript for better type safety (optional)

### Testing
- Unit tests for utility functions
- Integration tests for API services
- E2E tests for critical user flows

### Performance
- Optimize images and assets
- Implement lazy loading for screens
- Use FlatList for large data sets
- Minimize re-renders with proper memoization

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS simulator not starting**
   ```bash
   npx expo run:ios
   ```

3. **Android build errors**
   ```bash
   npx expo run:android --clear
   ```

### Debug Mode
Enable debug mode in development:
```javascript
// In src/services/api.js
const DEBUG = __DEV__;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

© 2024 RecrutIA. All rights reserved.

## Support

For support and questions:
- Email: support@recrutia.com
- Documentation: [Coming Soon]
- Issues: GitHub Issues
