from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db import init_db
from routes.auth import router as auth_router
from routes.cart import router as cart_router
from routes.orders import router as orders_router
from routes.products import router as products_router

load_dotenv()

app = FastAPI(title="Order Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": "true"}
    )

app.include_router(orders_router)
app.include_router(products_router)
app.include_router(auth_router)
app.include_router(cart_router)


@app.on_event("startup")
def startup_event() -> None:
    init_db()


@app.get("/")
def healthcheck():
    return {"status": "ok", "message": "Order API is running"}