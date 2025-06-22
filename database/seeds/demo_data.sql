-- Smart Recruitment Platform - Demo Data Seeds
-- Password hashes: Password123 = $2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO
--                 password = $2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Insert demo users
INSERT INTO users (uuid, name, email, password_hash, role, phone, is_active, email_verified) VALUES 
('demo-candidate-001', 'Ahmed Ben Ali', 'ahmed.benali@email.com', '$2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO', 'candidate', '+33123456789', true, true),
('demo-employer-001', 'Marie Dubois', 'marie.dubois@techcorp.fr', '$2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO', 'employer', '+33987654321', true, true),
('demo-admin-001', 'System Administrator', 'admin@smartrecruit.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+33555000111', true, true),
('demo-candidate-002', 'Sophie Martin', 'sophie.martin@email.com', '$2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO', 'candidate', '+33234567890', true, true),
('demo-employer-002', 'Jean Dupont', 'jean.dupont@innovtech.fr', '$2a$12$LQv3c1yqBwEHXLAw98j2uOe5UPmkHO6T9mAp1ckrUVTeIaVOYYFHO', 'employer', '+33345678901', true, true);

-- Insert candidate profiles
INSERT INTO candidates (user_id, first_name, last_name, location, experience_years, current_position, current_company, salary_expectation, currency, linkedin_url, github_url, portfolio_url)
SELECT u.id, 'Ahmed', 'Ben Ali', 'Paris, France', 5, 'Full Stack Developer', 'Tech Solutions Inc.', 55000.00, 'EUR', 'https://linkedin.com/in/ahmed-benali', 'https://github.com/ahmed-benali', 'https://ahmed-portfolio.dev'
FROM users u WHERE u.email = 'ahmed.benali@email.com';

INSERT INTO candidates (user_id, first_name, last_name, location, experience_years, current_position, current_company, salary_expectation, currency, linkedin_url, github_url, portfolio_url)
SELECT u.id, 'Sophie', 'Martin', 'Lyon, France', 3, 'Frontend Developer', 'Digital Agency Pro', 45000.00, 'EUR', 'https://linkedin.com/in/sophie-martin', 'https://github.com/sophie-martin', 'https://sophie-dev.com'
FROM users u WHERE u.email = 'sophie.martin@email.com';

-- Insert employer profiles
INSERT INTO employers (user_id, company_name, industry, company_size, website, description, address, city, country, founded_year)
SELECT u.id, 'TechCorp Solutions', 'Technology', '50-200', 'https://techcorp-solutions.fr', 'Leading technology solutions provider in France specializing in web development and digital transformation.', '123 Tech Street', 'Paris', 'France', 2015
FROM users u WHERE u.email = 'marie.dubois@techcorp.fr';

INSERT INTO employers (user_id, company_name, industry, company_size, website, description, address, city, country, founded_year)
SELECT u.id, 'InnovTech Startup', 'Technology', '10-50', 'https://innovtech-startup.fr', 'Innovative startup focused on AI and machine learning solutions for businesses.', '456 Innovation Ave', 'Lyon', 'France', 2020
FROM users u WHERE u.email = 'jean.dupont@innovtech.fr';

-- Insert skills
INSERT INTO skills (name, category, description) VALUES 
('JavaScript', 'Programming', 'JavaScript programming language for web development'),
('React', 'Frontend', 'React.js library for building user interfaces'),
('Node.js', 'Backend', 'JavaScript runtime for server-side development'),
('Python', 'Programming', 'Python programming language'),
('PostgreSQL', 'Database', 'Relational database management system'),
('MongoDB', 'Database', 'NoSQL document database'),
('Docker', 'DevOps', 'Containerization platform'),
('AWS', 'Cloud', 'Amazon Web Services cloud platform'),
('Git', 'Tools', 'Version control system'),
('TypeScript', 'Programming', 'Typed superset of JavaScript'),
('Vue.js', 'Frontend', 'Progressive JavaScript framework'),
('Express.js', 'Backend', 'Web application framework for Node.js'),
('Redis', 'Database', 'In-memory data structure store'),
('Kubernetes', 'DevOps', 'Container orchestration platform'),
('GraphQL', 'API', 'Query language for APIs');

-- Insert job postings
INSERT INTO jobs (employer_id, title, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, currency, remote_allowed, is_active)
SELECT e.id, 'Senior Full Stack Developer', 
'We are looking for an experienced Full Stack Developer to join our dynamic team. You will work on cutting-edge projects using modern technologies and contribute to our digital transformation initiatives.',
'• 5+ years of experience with JavaScript, React, and Node.js
• Strong knowledge of databases (PostgreSQL, MongoDB)
• Experience with cloud platforms (AWS preferred)
• Familiarity with Docker and containerization
• Strong problem-solving skills and attention to detail
• Experience with agile methodologies
• Excellent communication skills in French and English',
'• Develop and maintain web applications using React and Node.js
• Design and implement RESTful APIs and microservices
• Collaborate with cross-functional teams including designers and product managers
• Mentor junior developers and conduct code reviews
• Participate in architectural decisions and technical planning
• Ensure code quality and best practices
• Troubleshoot and debug applications',
'Paris, France', 'full-time', 'senior', 50000.00, 70000.00, 'EUR', true, true
FROM employers e WHERE e.company_name = 'TechCorp Solutions';

INSERT INTO jobs (employer_id, title, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, currency, remote_allowed, is_active)
SELECT e.id, 'Frontend React Developer', 
'Join our frontend team to build amazing user interfaces with React and modern JavaScript. Perfect opportunity for a mid-level developer looking to grow their skills.',
'• 3+ years of React experience
• Strong knowledge of TypeScript and modern JavaScript
• Experience with CSS frameworks and responsive design
• Knowledge of state management (Redux, Context API)
• Familiarity with testing frameworks (Jest, React Testing Library)
• Understanding of web performance optimization
• Experience with Git and collaborative development',
'• Build responsive and interactive web applications
• Implement pixel-perfect designs from Figma/Adobe XD
• Optimize application performance and user experience
• Write clean, maintainable, and well-tested code
• Collaborate with backend developers and designers
• Participate in sprint planning and daily standups
• Stay updated with latest frontend technologies',
'Paris, France', 'full-time', 'mid', 40000.00, 55000.00, 'EUR', true, true
FROM employers e WHERE e.company_name = 'TechCorp Solutions';

INSERT INTO jobs (employer_id, title, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, currency, remote_allowed, is_active)
SELECT e.id, 'AI/ML Engineer', 
'Exciting opportunity to work on cutting-edge AI and machine learning projects. Join our innovative team and help build the future of intelligent applications.',
'• 4+ years of experience in machine learning and AI
• Strong Python programming skills
• Experience with ML frameworks (TensorFlow, PyTorch, scikit-learn)
• Knowledge of data processing and analysis
• Experience with cloud ML services (AWS SageMaker, Google AI Platform)
• Understanding of MLOps and model deployment
• PhD or Masters in Computer Science, AI, or related field preferred',
'• Design and implement machine learning models and algorithms
• Process and analyze large datasets
• Deploy ML models to production environments
• Collaborate with data scientists and software engineers
• Research and evaluate new AI technologies
• Optimize model performance and scalability
• Document technical solutions and best practices',
'Lyon, France', 'full-time', 'senior', 55000.00, 75000.00, 'EUR', true, true
FROM employers e WHERE e.company_name = 'InnovTech Startup';

INSERT INTO jobs (employer_id, title, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, currency, remote_allowed, is_active)
SELECT e.id, 'DevOps Engineer', 
'We are seeking a DevOps Engineer to help us scale our infrastructure and improve our deployment processes. Great opportunity to work with modern cloud technologies.',
'• 3+ years of DevOps/Infrastructure experience
• Strong knowledge of Docker and Kubernetes
• Experience with cloud platforms (AWS, Azure, or GCP)
• Proficiency in Infrastructure as Code (Terraform, CloudFormation)
• Experience with CI/CD pipelines (Jenkins, GitLab CI, GitHub Actions)
• Knowledge of monitoring and logging tools
• Scripting skills (Bash, Python)',
'• Design and maintain cloud infrastructure
• Implement and improve CI/CD pipelines
• Monitor application performance and system health
• Automate deployment and scaling processes
• Ensure security best practices
• Collaborate with development teams
• Troubleshoot infrastructure issues',
'Remote', 'full-time', 'mid', 45000.00, 60000.00, 'EUR', true, true
FROM employers e WHERE e.company_name = 'InnovTech Startup';

-- Insert candidate skills
INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level, years_experience)
SELECT c.id, s.id, 'advanced', 5
FROM candidates c, skills s 
WHERE c.first_name = 'Ahmed' AND s.name IN ('JavaScript', 'React', 'Node.js');

INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level, years_experience)
SELECT c.id, s.id, 'intermediate', 3
FROM candidates c, skills s 
WHERE c.first_name = 'Ahmed' AND s.name IN ('Python', 'PostgreSQL', 'Docker');

INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level, years_experience)
SELECT c.id, s.id, 'expert', 3
FROM candidates c, skills s 
WHERE c.first_name = 'Sophie' AND s.name IN ('React', 'TypeScript', 'Vue.js');

INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level, years_experience)
SELECT c.id, s.id, 'intermediate', 2
FROM candidates c, skills s 
WHERE c.first_name = 'Sophie' AND s.name IN ('JavaScript', 'Node.js');

-- Insert job skills requirements
INSERT INTO job_skills (job_id, skill_id, required_level, is_required, weight)
SELECT j.id, s.id, 'advanced', true, 1.0
FROM jobs j, skills s 
WHERE j.title = 'Senior Full Stack Developer' AND s.name IN ('JavaScript', 'React', 'Node.js');

INSERT INTO job_skills (job_id, skill_id, required_level, is_required, weight)
SELECT j.id, s.id, 'intermediate', false, 0.8
FROM jobs j, skills s 
WHERE j.title = 'Senior Full Stack Developer' AND s.name IN ('PostgreSQL', 'Docker', 'AWS');

INSERT INTO job_skills (job_id, skill_id, required_level, is_required, weight)
SELECT j.id, s.id, 'advanced', true, 1.0
FROM jobs j, skills s 
WHERE j.title = 'Frontend React Developer' AND s.name IN ('React', 'TypeScript', 'JavaScript');

-- Insert sample permissions
INSERT INTO permissions (role, resource, action, allowed) VALUES 
('admin', 'users', 'create', true),
('admin', 'users', 'read', true),
('admin', 'users', 'update', true),
('admin', 'users', 'delete', true),
('admin', 'jobs', 'create', true),
('admin', 'jobs', 'read', true),
('admin', 'jobs', 'update', true),
('admin', 'jobs', 'delete', true),
('employer', 'jobs', 'create', true),
('employer', 'jobs', 'read', true),
('employer', 'jobs', 'update', true),
('employer', 'jobs', 'delete', false),
('employer', 'applications', 'read', true),
('employer', 'applications', 'update', true),
('candidate', 'jobs', 'read', true),
('candidate', 'applications', 'create', true),
('candidate', 'applications', 'read', true),
('candidate', 'applications', 'update', true);
