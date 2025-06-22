# 🚀 RecrutIA - Smart Recruitment Platform

A comprehensive AI-powered recruitment platform built with modern web technologies, featuring intelligent job matching, automated screening, and seamless candidate-employer interactions.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## ✨ Features

### 🏢 For Employers
- **Company Profile Management** - Complete company information and branding
- **Job Posting & Management** - Create, edit, and manage job postings
- **Application Tracking** - Review and manage candidate applications
- **AI-Powered Matching** - Get matched with qualified candidates
- **Interview Scheduling** - Coordinate interviews with candidates
- **Analytics Dashboard** - Track hiring metrics and performance

### 👨‍💼 For Candidates
- **Professional Profile** - Comprehensive profile with skills and experience
- **Resume Management** - Upload and manage multiple resume versions
- **Smart Job Search** - Advanced filtering and AI-powered recommendations
- **Application Tracking** - Monitor application status and feedback
- **Interview Preparation** - Tools and resources for interview success
- **Career Insights** - Personalized career guidance and market trends

### 🤖 AI Features
- **Intelligent Job Matching** - ML algorithms for candidate-job compatibility
- **Resume Parsing** - Automatic extraction of candidate information
- **Skill Assessment** - AI-powered evaluation of technical skills
- **Personalized Recommendations** - Tailored job suggestions
- **Automated Screening** - Initial candidate filtering and ranking

## 🛠 Tech Stack

### Frontend
- **React.js** - Modern UI library with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **React Hot Toast** - Elegant notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma ORM** - Type-safe database client
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing

### Database
- **PostgreSQL** - Primary relational database
- **MongoDB** - Document storage for AI artifacts
- **Docker** - Containerized database deployment

### AI/ML
- **Groq API** - Large language model integration
- **Meta-Llama** - Advanced AI model for intelligent features
- **Custom Algorithms** - Proprietary matching and ranking systems

## 📁 Project Structure

```
RecrutIA/
├── 📁 backend/                 # Node.js/Express API server
│   ├── 📁 src/
│   │   ├── 📁 routes/         # API route handlers
│   │   ├── 📁 middleware/     # Authentication & validation
│   │   ├── 📁 utils/          # Helper functions
│   │   └── 📄 server.js       # Main server file
│   ├── 📁 prisma/             # Database schema & migrations
│   └── 📄 package.json
├── 📁 frontend/               # React.js application
│   └── 📁 smart-recruit-app/
│       ├── 📁 src/
│       │   ├── 📁 components/ # React components
│       │   ├── 📁 contexts/   # React contexts
│       │   ├── 📁 services/   # API services
│       │   └── 📄 App.js      # Main app component
│       └── 📄 package.json
├── 📁 database/              # Database configuration
│   ├── 📁 postgresql/        # PostgreSQL setup
│   ├── 📁 mongodb/           # MongoDB setup
│   ├── 📁 scripts/           # Database utilities
│   └── 📁 seeds/             # Sample data
├── 📁 docs/                  # Documentation
├── 📁 scripts/               # Utility scripts
└── 📄 README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Docker** & **Docker Compose**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/marwaneigou/RECRUTAI.git
cd RECRUTAI
```

### 2. Start Databases
```bash
# Start PostgreSQL and MongoDB with Docker
cd scripts
./start-databases-docker.bat
```

### 3. Setup Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Setup Frontend
```bash
cd frontend/smart-recruit-app
npm install
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Database Admin**: http://localhost:8080 (pgAdmin)

## 📖 Installation

### Detailed Setup Instructions

1. **Database Setup**
   ```bash
   # Initialize databases with sample data
   cd scripts
   ./reset-database-and-seeds.bat
   ```

2. **Environment Configuration**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Migration**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Seed Database**
   ```bash
   npm run seed
   ```

## 🎯 Usage

### For Employers
1. **Register** as an employer
2. **Complete** company profile
3. **Post** job openings
4. **Review** applications
5. **Schedule** interviews

### For Candidates
1. **Create** candidate profile
2. **Upload** resume
3. **Search** for jobs
4. **Apply** to positions
5. **Track** application status

## 📚 API Documentation

Comprehensive API documentation is available in the `/docs` folder:

- [API Endpoints](docs/API_DOCUMENTATION.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Project Report](docs/PROJECT_REPORT.md)

### Key Endpoints

```
Authentication:
POST /api/auth/register
POST /api/auth/login

Jobs:
GET    /api/jobs
POST   /api/jobs
PUT    /api/jobs/:id
DELETE /api/jobs/:id

Applications:
GET  /api/applications
POST /api/applications
PUT  /api/applications/:id
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow **ESLint** configuration
- Write **comprehensive tests**
- Update **documentation**
- Use **conventional commits**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Marwane Igou** - Full Stack Developer & Project Lead
- **Contributors** - See [CONTRIBUTORS.md](CONTRIBUTORS.md)

## 🙏 Acknowledgments

- **React.js** community for excellent documentation
- **Prisma** team for the amazing ORM
- **Tailwind CSS** for the utility-first approach
- **Open Source** community for inspiration

---

**Built with ❤️ for the future of recruitment**
