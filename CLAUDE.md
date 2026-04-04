# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Fitness Assistant (智能健身助手) — a full-stack web app that generates personalized AI-powered fitness plans based on user body data and goals. The UI is in Chinese.

## Development Commands

### Backend (Python/FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # dev server on :8000
```

### Frontend (React/TypeScript/Vite)
```bash
cd frontend
npm install
npm run dev                             # dev server on :3000
npm run build                           # tsc && vite build
npm run lint                            # eslint
npm run test                            # vitest (use vitest --run for single execution)
```

### Database (MySQL)
```bash
mysql -u root -p < database/schemas/schema.sql
mysql -u root -p < database/seeds/seed.sql
```

### Project Setup
```bash
bash scripts/setup.sh                   # installs all deps, creates venv
```

## Architecture

### Backend (`backend/app/`)
- **Framework**: FastAPI with SQLAlchemy ORM. Supports both SQLite (default, `DB_TYPE=sqlite`) and MySQL (`DB_TYPE=mysql`).
- **Entry point**: `main.py` — registers CORS, routers, creates tables on startup via `Base.metadata.create_all`, runs schema migrations for new columns.
- **Config**: `core/config.py` — pydantic-settings `Settings` class, reads from `.env`
- **Database**: `core/database.py` — SQLAlchemy engine/session, `get_db()` dependency
- **Auth**: JWT-based (python-jose), OAuth2 password flow. `core/security.py` handles hashing/tokens. `routers/auth.py` has `/register` and `/login` endpoints.
- **API routes** (all prefixed `/api`):
  - `/api/auth` — register, login
  - `/api/user` — user profile CRUD
  - `/api/plan` — fitness plan generation/retrieval
  - `/api/system` — system endpoints (weather, tips)
- **AI integration**: `services/ai_plan_generator.py` calls Claude API (Anthropic Messages API via httpx) to generate plans. Falls back to mock data when `CLAUDE_API_KEY` is empty or on error.
- **Schedule logic**: `services/schedule_generator.py` handles training periodization (intensity cycles), rest day patterns, muscle group rotation, and BMR/TDEE calculations.

### Frontend (`frontend/src/`)
- **Framework**: React 18 + TypeScript, Vite bundler, Tailwind CSS
- **State management**: Zustand with `persist` middleware (stores in `store/`). Auth state persists to localStorage via `auth-storage` key.
- **Routing**: React Router v6. Public routes: `/login`, `/register`. Protected routes wrapped in `Layout`: `/dashboard`, `/profile`, `/tips`, `/user`, `/calendar`
- **API layer**: Axios clients in `api/` directory
- **Key stores**: `store/auth.ts` (auth state + localStorage), `store/profile.ts` (user profile)
- **Hydration**: Layout component waits for `_hasHydrated` before rendering protected content

### Database Schema
Three tables: `users`, `user_profiles` (body data, fitness goal as ENUM '减脂'/'增肌', selected muscle groups as JSON), `fitness_plans` (JSON plan data, unique per user+date).

## Environment Variables

Both `backend/.env.example` and `frontend/.env.example` exist. Key backend vars:
- `DB_TYPE` — "sqlite" (default) or "mysql"
- `DB_*` — MySQL connection (when using MySQL)
- `JWT_SECRET_KEY` — must change for production
- `CLAUDE_API_KEY` — Anthropic API key (optional; mock data used if empty)
- `CLAUDE_MODEL` — defaults to `claude-opus-4-6`
- `WEATHER_API_KEY` — weather service key
- `FRONTEND_URL` — CORS origin (default `http://localhost:3000`)

## Key Patterns
- Fitness goals are Chinese enum values: `减脂` (fat loss) and `增肌` (muscle gain)
- Muscle groups are Chinese strings: `胸`, `背`, `肩`, `腿`, `手臂`, `腹部`, `核心`, `有氧`
- Training cycles use periodization: intensity progresses light → medium → heavy, with deload weeks every 4th week
- Rest day patterns are defined per frequency in `REST_DAY_PATTERNS` (0=Mon ... 6=Sun)
- The AI plan generator returns structured JSON with workout_groups (exercises per muscle), meal_plan (3 options per meal: self_cook/takeout/eat_out), calorie_summary, and recommendations
- Auth tokens stored in localStorage and Zustand persisted state
- Backend auto-creates DB tables on startup and migrates new columns via `_migrate_db()`
