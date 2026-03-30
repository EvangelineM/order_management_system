from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from models.cart import CartResponse, CartSave
from services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["cart"])


def get_cart_service(db: Session = Depends(get_db)) -> CartService:
    return CartService(db)


@router.post("", response_model=CartResponse)
def save_cart(payload: CartSave, service: CartService = Depends(get_cart_service)):
    return service.save_cart(payload)


@router.get("", response_model=CartResponse)
def get_cart(
    email: str = Query(..., min_length=3),
    service: CartService = Depends(get_cart_service),
):
    return service.get_cart(email)
