import os
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
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

    _ensure_auth_user_schema_compatibility()

    db = SessionLocal()
    try:
        AuthService(db).ensure_admin()
        seed_key = "default_products_v2"
        existing_seed = db.query(SeedRecord).filter(SeedRecord.key == seed_key).first()

        if not existing_seed:
            products_exist = db.query(ProductRecord.id).first() is not None

            if not products_exist:
                products_to_insert = [ProductRecord(**product) for product in DEFAULT_PRODUCTS]
                if products_to_insert:
                    db.add_all(products_to_insert)

            db.add(SeedRecord(key=seed_key))
            db.commit()
    finally:
        db.close()


def _ensure_auth_user_schema_compatibility() -> None:
    """Apply lightweight, idempotent fixes for auth_users table schemas."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "auth_users" not in table_names:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("auth_users")}
    statements: list[str] = []

    if "name" not in existing_columns:
        statements.append("ALTER TABLE auth_users ADD COLUMN name VARCHAR(120)")

    if "password_hash" not in existing_columns:
        statements.append("ALTER TABLE auth_users ADD COLUMN password_hash VARCHAR(128)")

    if "role" not in existing_columns:
        statements.append("ALTER TABLE auth_users ADD COLUMN role VARCHAR(32) DEFAULT 'customer'")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

        # Backfill defaults where possible for newly added nullable columns.
        if "name" not in existing_columns:
            connection.execute(
                text("UPDATE auth_users SET name = COALESCE(name, 'Customer') WHERE name IS NULL")
            )
        if "password_hash" not in existing_columns:
            connection.execute(
                text(
                    "UPDATE auth_users SET password_hash = COALESCE(password_hash, '') "
                    "WHERE password_hash IS NULL"
                )
            )
        if "role" not in existing_columns:
            connection.execute(
                text("UPDATE auth_users SET role = COALESCE(role, 'customer') WHERE role IS NULL")
            )
