# SaaS Workflow Automation Platform

A complete scalable SaaS platform for designing and evaluating complex business workflows.

## Features

- **Workflow Builder**: Define multi-step workflows with diverse step types (Task, Approval, Notification).
- **Rule Engine**: Setup intricate routing logic using conditional statements (e.g. `amount > 100 && country == 'US'`).
- **Dynamic Schemas**: Each workflow takes a custom JSON schema to evaluate data safely against priority-ordered rules.
- **Execution Engine**: Fast and robust execution evaluation with strict pathing rules and fallbacks.
- **Audit Logs**: Comprehensive tracking of every step taken, rule evaluated, and result produced.

## Tech Stack
- Frontend: Next.js 14, React, Tailwind CSS, TypeScript
- Backend: FastAPI, Python, SQLAlchemy, ASyncPG
- Database: PostgreSQL

## Quick Start (Docker)

Ensure you have Docker and Docker Compose installed.

1. Clone the repository.
2. From the project root, run:
   ```bash
   docker-compose up --build -d
   ```
3. The platform will be available at:
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`
   
*(Note: Alembic migrations are automatically run on backend startup container via the Dockerfile)*

## API Endpoints

- `GET /api/workflows`: List all workflows
- `POST /api/workflows`: Create workflow
- `POST /api/workflows/{id}/execute`: Trigger execution with JSON payload matching schema
- `GET /api/executions/{id}/logs`: Get execution audit trail

## Setup for Local Development (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
# Activate venv (Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Platform designed as a scalable architecture ready for production deployment on Vercel (frontend) and Render/AWS (backend).
