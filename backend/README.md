# Backend (FastAPI)

## Configure PostgreSQL (Neon-ready)

Create a `.env` file in `backend/` and set:

```bash
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>/<db>?sslmode=require
```

For local Postgres, you can use:

```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/orders_db
```

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Tables are auto-created on startup.

## Base URL

`http://127.0.0.1:8000`

## Endpoints

- `POST /orders`
- `GET /orders?page=1&page_size=5`
- `GET /orders/{id}`
- `GET /orders/search?q=foo&page=1&page_size=5`
- `PATCH /orders/{id}`
- `DELETE /orders/{id}`
- `GET /orders/count`
