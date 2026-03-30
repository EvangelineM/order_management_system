from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class ProductRecord(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    price: Mapped[float] = mapped_column(nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False)
    metal: Mapped[str] = mapped_column(String(100), nullable=False)
    gemstone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    weight: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[float] = mapped_column(nullable=False)
    color: Mapped[str] = mapped_column(String(100), nullable=False)
    material: Mapped[str] = mapped_column(String(100), nullable=False)
    reviews: Mapped[int] = mapped_column(nullable=False)
    active: Mapped[bool] = mapped_column(nullable=False, default=True, index=True)
