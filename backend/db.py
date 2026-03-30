import os
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")


DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from models.cart_db import CartRecord
    from models.order_owner_db import OrderOwnerRecord
    from models.order_db import OrderRecord
    from models.user_db import UserRecord
    from models.product_db import ProductRecord
    from models.seed_db import SeedRecord
    from data.default_products import DEFAULT_PRODUCTS
    from services.auth_service import AuthService

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        AuthService(db).ensure_admin()
        seed_key = "default_products_v1"
        existing_seed = db.query(SeedRecord).filter(SeedRecord.key == seed_key).first()

        if not existing_seed:
            existing_product_ids = {
                row[0] for row in db.query(ProductRecord.id).all()
            }

            products_to_insert = [
                ProductRecord(**product)
                for product in DEFAULT_PRODUCTS
                if product["id"] not in existing_product_ids
            ]

            if products_to_insert:
                db.add_all(products_to_insert)

            db.add(SeedRecord(key=seed_key))
            db.commit()
    finally:
        db.close()
