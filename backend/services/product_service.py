import re
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.product import ProductCreate
from models.product_db import ProductRecord


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def create_product(self, product: ProductCreate) -> dict:
        """Create a new product."""
        existing = (
            self.db.query(ProductRecord)
            .filter(ProductRecord.name.ilike(product.name.strip()))
            .filter(ProductRecord.category.ilike(product.category.strip()))
            .filter(ProductRecord.price == product.price)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Product already exists")

        product_id = self._generate_product_id(product.name)
        
        db_product = ProductRecord(
            id=product_id,
            name=product.name,
            category=product.category,
            description=product.description,
            price=product.price,
            stock=product.stock,
            image=product.image,
            metal=product.metal,
            gemstone=product.gemstone,
            weight=product.weight,
            rating=product.rating,
            color=product.color,
            material=product.material,
            reviews=product.reviews,
            active=True,
        )
        
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        
        return self._map_to_dict(db_product)

    def _generate_product_id(self, name: str) -> str:
        base_slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-") or "product"

        while True:
            candidate = f"p-{base_slug[:40]}-{uuid4().hex[:8]}"
            exists = self.db.query(ProductRecord.id).filter(ProductRecord.id == candidate).first()
            if not exists:
                return candidate

    def get_all_products(self) -> list[dict]:
        """Get all products."""
        products = self.db.query(ProductRecord).all()
        return [self._map_to_dict(p) for p in products]

    def get_active_products(self) -> list[dict]:
        """Get only active products."""
        products = self.db.query(ProductRecord).filter(ProductRecord.active == True).all()
        return [self._map_to_dict(p) for p in products]

    def get_product_by_id(self, product_id: str) -> dict | None:
        """Get a single product by ID."""
        product = self.db.query(ProductRecord).filter(ProductRecord.id == product_id).first()
        return self._map_to_dict(product) if product else None

    def update_product(self, product_id: str, updates: dict) -> dict | None:
        """Update a product."""
        product = self.db.query(ProductRecord).filter(ProductRecord.id == product_id).first()
        if not product:
            return None
        
        for key, value in updates.items():
            if hasattr(product, key):
                setattr(product, key, value)
        
        self.db.commit()
        self.db.refresh(product)
        return self._map_to_dict(product)

    def delete_product(self, product_id: str) -> bool:
        """Soft delete a product by setting active=False."""
        product = self.db.query(ProductRecord).filter(ProductRecord.id == product_id).first()
        if not product:
            return False
        
        product.active = False
        self.db.commit()
        return True

    def update_stock(self, product_id: str, quantity_change: int) -> dict | None:
        """Update product stock."""
        product = self.db.query(ProductRecord).filter(ProductRecord.id == product_id).first()
        if not product:
            return None
        
        product.stock = max(0, product.stock + quantity_change)
        self.db.commit()
        self.db.refresh(product)
        return self._map_to_dict(product)

    def search_products(self, query: str) -> list[dict]:
        """Search products by name or description."""
        search_term = f"%{query.lower()}%"
        products = self.db.query(ProductRecord).filter(
            (ProductRecord.name.ilike(search_term)) |
            (ProductRecord.description.ilike(search_term)) |
            (ProductRecord.category.ilike(search_term))
        ).all()
        return [self._map_to_dict(p) for p in products]

    @staticmethod
    def _map_to_dict(product: ProductRecord) -> dict:
        """Convert ProductRecord to dictionary."""
        if not product:
            return None
        return {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "description": product.description,
            "price": float(product.price),
            "stock": product.stock,
            "image": product.image,
            "metal": product.metal,
            "gemstone": product.gemstone,
            "weight": product.weight,
            "rating": float(product.rating),
            "color": product.color,
            "material": product.material,
            "reviews": product.reviews,
            "active": product.active,
        }
