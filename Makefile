.PHONY: up down build logs migrate shell-backend shell-db test lint

# ─── Docker ─────────────────────────────────────────
up:
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d

build:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

# ─── Database ────────────────────────────────────────
migrate:
	docker compose exec backend alembic upgrade head

makemigration:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

# ─── Dev shells ──────────────────────────────────────
shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U ati_user -d ati_db

# ─── Tests ───────────────────────────────────────────
test:
	docker compose exec backend pytest app/tests/ -v --tb=short

# ─── Lint ────────────────────────────────────────────
lint:
	docker compose exec backend ruff check app/
	docker compose exec frontend npm run lint
