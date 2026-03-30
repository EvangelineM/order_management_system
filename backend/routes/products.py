from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from db import get_db
from models.product import ProductCreate, Product
from services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)


@router.post("", response_model=Product)
def create_product(
    product: ProductCreate,
    service: ProductService = Depends(get_product_service),
):
    """Create a new product."""
    return service.create_product(product)


@router.get("", response_model=list[Product])
def get_products(
    active_only: bool = Query(default=True),
    service: ProductService = Depends(get_product_service),
):
    """Get all products (or only active ones)."""
    if active_only:
        return service.get_active_products()
    return service.get_all_products()


@router.get("/search")
def search_products(
    q: str = Query(default=""),
    service: ProductService = Depends(get_product_service),
):
    """Search products by name, description, or category."""
    if not q.strip():
        return service.get_active_products()
    return service.search_products(q)


@router.get("/{product_id}", response_model=Product)
def get_product(
    product_id: str,
    service: ProductService = Depends(get_product_service),
):
    """Get a product by ID."""
    product = service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=Product)
def update_product(
    product_id: str,
    payload: dict,
    service: ProductService = Depends(get_product_service),
):
    """Update a product."""
    product = service.update_product(product_id, payload)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    service: ProductService = Depends(get_product_service),
):
    """Delete a product (soft delete)."""
    success = service.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return Response(status_code=204)


@router.patch("/{product_id}/stock")
def update_stock(
    product_id: str,
    quantity_change: int = Query(...),
    service: ProductService = Depends(get_product_service),
):
    """Update product stock."""
    product = service.update_stock(product_id, quantity_change)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
