# ATI Logistics Marketplace

A full-stack freight exchange platform where **shippers post cargo** and **carriers find loads and place bids** — inspired by [ati.su](https://ati.su).

## Stack

| Layer | Tech |
|---|---|
| Backend API | FastAPI + Python 3.11 |
| Database | PostgreSQL 16 + SQLAlchemy (async) |
| Cache / Sessions | Redis 7 |
| Migrations | Alembic |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS |
| State | Zustand + React Query |
| Auth | JWT (access + refresh tokens) |
| Infrastructure | Docker Compose |

## Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd ati_copy

# 2. Copy env file and configure secrets
cp .env.example .env

# 3. Build and start everything
make build

# 4. Run migrations
make migrate

# 5. Open the app
open http://localhost:3000
# API docs at http://localhost:8000/docs
```

## Project Structure

```
ati_copy/
├── backend/        # FastAPI application
├── frontend/       # Next.js application
├── docker-compose.yml
├── .env.example
└── Makefile
```

## API Documentation

Once running, the interactive API docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Core Features

- 🔐 **JWT Auth** — register/login with role-based access (shipper | carrier | dispatcher)
- 📦 **Cargo Marketplace** — post, search, filter by origin/destination/date/price/weight
- 💰 **Bidding System** — carriers bid on cargo, shippers accept/reject
- 💬 **Messaging** — direct messages between users
- 🏢 **Company Profiles** — company verification system
- ⭐ **Ratings & Reviews** — review counterparties after completed loads

## Development

```bash
make shell-backend   # bash inside backend container
make shell-db        # psql inside postgres container
make logs            # follow all container logs
make test            # run pytest suite
make lint            # ruff (backend) + eslint (frontend)
make makemigration name="add_indexes"  # create new migration
```
