# Smart Recruitment Platform – Database Setup & Usage Guide

> **Hybrid Data Architecture:** PostgreSQL for transactional, relational data & MongoDB for semi‑structured documents (CVs, full job descriptions, AI artifacts).

---

## 1. Prerequisites

| Component                 | Recommended Version |
| ------------------------- | ------------------- |
| PostgreSQL                | 15 or later         |
| MongoDB                   | 6 or later          |
| Node.js / Yarn (backend)  | ≥ 20                |
| Python (data/AI services) | ≥ 3.11              |
| Docker & Docker Compose   | latest stable       |

> **Tip :** Everything can run locally with `docker compose up` – see **docker‑compose.yaml** in the root of the repo.

---

## 2. Environment Variables

Create a `.env` file at the project root with the following keys :

```dotenv
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=smart_recruit
POSTGRES_USER=smart_admin
POSTGRES_PASSWORD=secret

# MongoDB (SRP = Smart Recruitment Platform)
MONGODB_URI=mongodb://root:secret@localhost:27017/srp?authSource=admin

# Optional – used by the AI microservice
OPENAI_API_KEY=sk‑…
```

`docker compose` will read `.env` automatically.

---

## 3. PostgreSQL Schema (Transaction Layer)

| Table             | Primary Keys & Relationships             | Purpose                   |
| ----------------- | ---------------------------------------- | ------------------------- |
| **users**         | `id PK`                                  | Core identity (all roles) |
| **candidates**    | `id PK`, `user_id FK → users.id`         | Candidate profile précis  |
| **employers**     | `id PK`, `user_id FK → users.id`         | Employer company metadata |
| **jobs**          | `id PK`, `employer_id FK → employers.id` | Advertised positions      |
| **applications**  | `id PK`, `job_id`, `candidate_id` FKs    | Application state machine |
| **sessions**      | `id PK`, `user_id FK`                    | Auth & audit log          |
| **notifications** | `id PK`, `user_id FK`                    | Real‑time updates         |
| **permissions**   | composite PK (`role`, `resource`)        | RBAC matrix               |

<details>
<summary>Minimal DDL excerpt </summary>

```sql
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            TEXT        NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT        NOT NULL,
  role            VARCHAR(20) CHECK (role IN ('candidate','employer','admin')),
  created_at      TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE employers (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry    TEXT,
  website     TEXT
);
-- other tables follow the pattern …
```

</details>

### Migrations

We use **Prisma ORM** (Node) for migrations. Run :

```bash
# after npm install
npx prisma migrate dev --name init
```

Or inside Docker : `docker compose exec api npx prisma migrate deploy`.

---

## 4. MongoDB Collections (Document Layer)

| Collection       | Sample Document (truncated)                                |
| ---------------- | ---------------------------------------------------------- |
| **resumes**      | `{ "candidate_id": 1, "skills": ["Python","NLP"], … }`     |
| **job\_offers**  | `{ "job_id": 5, "title": "ML Engineer", … }`               |
| **ai\_matches**  | `{ "candidate_id": 1, "job_id": 5, "score": 0.87 }`        |
| **letters**      | `{ "candidate_id": 1, "job_id": 5, "letter": "Dear …" }`   |
| **cv\_versions** | `{ "candidate_id": 1, "job_id": 5, "cv_customized": "…" }` |
| **feedback\_ai** | `{ "match_id": "6655f…", "was_relevant": false }`          |

> **Indexing Hint :** Add a compound index on `{ candidate_id, job_id }` for `ai_matches` to speed up look‑ups.

---

## 5. Seed Data & Demo

```bash
# PostgreSQL
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -f seeds/postgres_demo.sql

# MongoDB
mongoimport --uri $MONGODB_URI --collection resumes   --file seeds/resumes_demo.json
mongoimport --uri $MONGODB_URI --collection job_offers --file seeds/jobs_demo.json
```

---

## 6. Backup & Restore

```bash
# PostgreSQL (daily cron example)
pg_dump -Fc -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB > backups/pg/$(date +%F).dump

# MongoDB – archives oplog for point‑in‑time restore
dump_dir=backups/mongo/$(date +%F)
mongodump --uri $MONGODB_URI --out $dump_dir --oplog
```

Restore procedures are documented in `scripts/restore.md`.

---

## 7. Common Queries / Operations

```sql
-- Find all open jobs for a given employer
SELECT * FROM jobs j
WHERE j.employer_id = $1 AND j.is_active = true;

-- Count applications for a job
SELECT COUNT(*) FROM applications WHERE job_id = $1;
```

```javascript
// MongoDB – fetch best 5 matches for candidate 42
const matches = await db.collection('ai_matches')
  .find({ candidate_id: 42 })
  .sort({ score: -1 })
  .limit(5)
  .toArray();
```

---

## 8. Running Tests

```bash
# Jest (Node backend)
yarn test

# PyTest (AI services)
pytest -q
```

---

## 9. Contributing

1. Fork → feature branch → PR.
2. Ensure `pre-commit run --all-files` passes.
3. Write migration scripts & update `/docs/schema/erd.png`.

---

## 10. Contact & Support

Feel free to open an issue or reach the core team at **dev\@smart‑recruit.io**.

---

*© 2025 Smart Recruit Platform. Made with ❤ in Casablanca.*
