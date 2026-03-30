# Evangeline Assignment

This repository contains:

- `backend/` FastAPI service for order management.
- `frontend/` React + Vite UI for interacting with the API.

## Features

- Create orders
- Duplicate prevention
- Search orders
- Update order status
- Delete orders
- Count unique orders
- Pagination support
- PostgreSQL persistence (Neon-compatible)

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Update DATABASE_URL in .env for your Neon/Postgres instance
uvicorn main:app --reload
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.
