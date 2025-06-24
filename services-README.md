# 🤖 RECRUTAI AI Services

## Vue d'ensemble

RECRUTAI AI Services est une suite de microservices alimentés par l'IA qui automatisent et optimisent le processus de recrutement.

## 🏗️ Services Disponibles

1. **🔍 Analysis Service (Port 5002)** - Analyse de CVs et emplois
2. **🎯 Matching Service (Port 5001)** - Matching intelligent candidats-emplois  
3. **📄 Document Service (Port 5003)** - Génération de documents personnalisés
4. **💡 Recommendation Service (Port 5004)** - Recommandations IA

## 🚀 Installation Rapide

### 1. Configurer la clé OpenAI
Éditez le fichier `.env.global` et remplacez `your_openai_api_key_here` par votre vraie clé API OpenAI.

### 2. Installer les dépendances
```bash
install-dependencies.bat
```

### 3. Démarrer les services
```bash
start-all-services.bat
```

### 4. Tester
```bash
curl http://localhost:5002/health
curl http://localhost:5001/health
curl http://localhost:5003/health
curl http://localhost:5004/health
```

## 📋 Endpoints Principaux

### Analysis Service
- `POST /api/analyze/cv` - Analyser un CV
- `POST /api/analyze/job` - Analyser une offre d'emploi

### Matching Service  
- `POST /api/match/job-to-candidates` - Trouver des candidats pour un emploi
- `POST /api/match/candidate-to-jobs` - Trouver des emplois pour un candidat

### Document Service
- `POST /api/documents/customize-cv` - Personnaliser un CV
- `POST /api/documents/generate-cover-letter` - Générer une lettre de motivation

### Recommendation Service
- `POST /api/recommendations/jobs` - Recommandations d'emplois
- `POST /api/recommendations/candidates` - Recommandations de candidats

## 🔒 Sécurité

- Les clés API sont stockées dans des variables d'environnement
- Aucune donnée sensible n'est loggée
- Validation des entrées sur tous les endpoints

---

**🎉 Votre plateforme RECRUTAI est prête à révolutionner le recrutement !**
