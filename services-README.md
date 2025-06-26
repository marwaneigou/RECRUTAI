# 🤖 RECRUTAI AI Services Platform

## Vue d'ensemble

RECRUTAI AI Services est une plateforme complète de microservices alimentés par l'intelligence artificielle qui automatise et optimise le processus de recrutement. Cette solution révolutionnaire utilise OpenAI GPT-4 pour analyser les CVs, matcher les candidats avec les emplois, générer des documents personnalisés et fournir des recommandations intelligentes.

## 🏗️ Architecture Microservices

### Services Principaux

1. **🔍 Analysis Service (Port 5002)**
   - Analyse automatique des CVs avec extraction d'informations structurées
   - Analyse des offres d'emploi et extraction des exigences
   - Utilisation d'OpenAI GPT-4 pour une compréhension avancée du langage naturel

2. **🎯 Matching Service (Port 5001)**
   - Algorithmes de matching intelligent candidats-emplois
   - Calcul de scores de compatibilité avancés
   - Matching bidirectionnel avec justifications détaillées

3. **📄 Document Service (Port 5003)**
   - Personnalisation automatique des CVs pour des emplois spécifiques
   - Génération de lettres de motivation adaptées
   - Templates multiples et styles personnalisables

4. **💡 Recommendation Service (Port 5004)**
   - Recommandations d'emplois personnalisées pour les candidats
   - Recommandations de candidats pour les employeurs
   - Conseils de développement de compétences basés sur l'IA

5. **👥 User Management Service (Port 5005)**
   - Gestion des utilisateurs (candidats et employeurs)
   - Authentification JWT sécurisée
   - Gestion des profils et des sessions

6. **📧 Notification Service (Port 5006)**
   - Notifications en temps réel
   - Alertes par email
   - Système de notifications push

## 🚀 Installation et Configuration

### Prérequis
- Python 3.8+
- Clé API OpenAI GPT-4
- Git

### 1. Cloner le projet
```bash
git clone https://github.com/marwaneigou/RECRUTAI.git
cd RECRUTAI
```

### 2. Configurer la clé OpenAI
Éditez le fichier `services/.env.global` et configurez votre clé API :
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Installer les dépendances
```bash
install-dependencies.bat
```

### 4. Démarrer tous les services
```bash
start-all-services.bat
```

### 5. Tester l'installation
```bash
cd services
python run-all-tests.py
```

## 📋 API Documentation Complète

### Analysis Service (Port 5002)

#### Analyser un CV
```bash
POST /api/analyze/cv
Content-Type: application/json

{
  "cvId": "cv_123",
  "cvText": "John Doe\nSoftware Developer\n...",
  "language": "en",
  "extractionLevel": "detailed"
}
```

**Réponse :**
```json
{
  "cvId": "cv_123",
  "analysis": {
    "personalInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "location": "Montreal, Canada"
    },
    "technicalSkills": ["JavaScript", "React", "Node.js"],
    "softSkills": ["Leadership", "Communication"],
    "experience": [...],
    "education": [...],
    "summary": "Experienced developer with strong React skills"
  }
}
```

#### Analyser une offre d'emploi
```bash
POST /api/analyze/job
Content-Type: application/json

{
  "jobId": "job_456",
  "jobTitle": "Senior React Developer",
  "company": "TechCorp",
  "jobDescription": "We are looking for...",
  "analysisDepth": "detailed"
}
```

### Matching Service (Port 5001)

#### Trouver des candidats pour un emploi
```bash
POST /api/match/job-to-candidates
Content-Type: application/json

{
  "jobTitle": "Frontend Developer",
  "requiredSkills": ["JavaScript", "React"],
  "requiredExperience": "3+ years",
  "remote": true,
  "limit": 10
}
```

#### Trouver des emplois pour un candidat
```bash
POST /api/match/candidate-to-jobs
Content-Type: application/json

{
  "candidateId": "candidate_123",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "4 years",
  "remotePreference": true,
  "limit": 10
}
```

### Document Service (Port 5003)

#### Personnaliser un CV
```bash
POST /api/documents/customize-cv
Content-Type: application/json

{
  "cvData": {
    "candidateName": "John Doe",
    "skills": ["JavaScript", "React"],
    "experience": [...]
  },
  "jobData": {
    "jobTitle": "Frontend Developer",
    "company": "TechCorp",
    "requiredSkills": ["React", "TypeScript"]
  },
  "template": "professional"
}
```

#### Générer une lettre de motivation
```bash
POST /api/documents/generate-cover-letter
Content-Type: application/json

{
  "candidateName": "John Doe",
  "jobTitle": "Frontend Developer",
  "company": "TechCorp",
  "keySkills": ["JavaScript", "React"],
  "style": "professional",
  "tone": "formal",
  "length": "medium"
}
```

### User Management Service (Port 5005)

#### Inscription d'un utilisateur
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "candidate",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Connexion
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Notification Service (Port 5006)

#### Envoyer une notification
```bash
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "user_123",
  "type": "job_match",
  "title": "Nouveau match trouvé!",
  "message": "Un emploi correspond à votre profil",
  "sendEmail": true,
  "email": "user@example.com"
}
```

## 🧪 Tests et Validation

### Tests automatisés
```bash
cd services
python run-all-tests.py
```

### Tests manuels des endpoints
```bash
# Test de santé de tous les services
curl http://localhost:5002/health
curl http://localhost:5001/health
curl http://localhost:5003/health
curl http://localhost:5004/health
curl http://localhost:5005/health
curl http://localhost:5006/health
```

## 🔒 Sécurité et Configuration

### Variables d'environnement
- `OPENAI_API_KEY`: Clé API OpenAI (obligatoire)
- `JWT_SECRET_KEY`: Clé secrète pour JWT
- `DATABASE_URL`: URL de la base de données
- `EMAIL_USER`: Utilisateur email pour les notifications
- `EMAIL_PASSWORD`: Mot de passe email

### Sécurité
- Authentification JWT
- Validation des entrées
- Chiffrement des mots de passe
- Protection contre les attaques CORS
- Rate limiting configuré

## 🚀 Déploiement

### Docker (Recommandé)
```bash
# Construire les images
docker-compose build

# Démarrer tous les services
docker-compose up -d
```

### Cloud Deployment
- AWS: EC2, ECS, Lambda
- Azure: App Services, Container Instances
- GCP: Cloud Run, Kubernetes Engine

## 📊 Monitoring et Logs

### Métriques disponibles
- Nombre de requêtes par service
- Temps de réponse moyen
- Taux d'erreur
- Utilisation des ressources

### Logs structurés
Tous les services génèrent des logs structurés avec :
- Timestamp
- Niveau de log
- Service source
- Détails de la requête

## 🤝 Contribution

### Structure du projet
```
RECRUTAI/
├── services/
│   ├── analysis-service/
│   ├── matching-service/
│   ├── document-service/
│   ├── recommendation-service/
│   ├── user-management-service/
│   ├── notification-service/
│   ├── .env.global
│   └── run-all-tests.py
├── start-all-services.bat
├── install-dependencies.bat
└── README.md
```

### Technologies utilisées
- **Backend**: Python, Flask
- **IA**: OpenAI GPT-4, Transformers
- **Base de données**: MongoDB, PostgreSQL
- **Authentification**: JWT
- **Containerisation**: Docker
- **Tests**: pytest, requests

## 📈 Roadmap

### Version 1.1
- [ ] Interface web React.js
- [ ] Application mobile React Native
- [ ] Base de données persistante
- [ ] Cache Redis

### Version 1.2
- [ ] Intégration LinkedIn
- [ ] Analytics avancées
- [ ] API GraphQL
- [ ] Webhooks

## 🆘 Support et Dépannage

### Problèmes courants

1. **Service ne démarre pas**
   - Vérifiez que le port n'est pas utilisé
   - Vérifiez les dépendances Python
   - Consultez les logs du service

2. **Erreurs OpenAI**
   - Vérifiez la clé API
   - Vérifiez les crédits OpenAI
   - Vérifiez la connexion internet

3. **Erreurs d'authentification**
   - Vérifiez le token JWT
   - Vérifiez la configuration des secrets

### Logs et debugging
```bash
# Voir les logs d'un service
tail -f services/analysis-service/app.log

# Mode debug
export DEBUG=True
python services/analysis-service/app.py
```

---

## 🎉 Conclusion

**RECRUTAI AI Services** est une plateforme complète qui révolutionne le recrutement grâce à l'intelligence artificielle. Avec ses 6 microservices intégrés et son architecture scalable, elle offre une solution complète pour automatiser et optimiser tous les aspects du processus de recrutement.

**🚀 Prêt à transformer votre processus de recrutement avec l'IA !**
