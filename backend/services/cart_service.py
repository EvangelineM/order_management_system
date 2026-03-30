import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.cart import CartData, CartResponse, CartSave
from models.cart_db import CartRecord


class CartService:
    def __init__(self, db: Session):
        self.db = db

    def save_cart(self, payload: CartSave) -> CartResponse:
        email = payload.email.lower()
        record = self.db.get(CartRecord, email)
        cart_json = json.dumps(payload.cart)

        if not record:
            record = CartRecord(email=email, cart_json=cart_json)
            self.db.add(record)
        else:
            record.cart_json = cart_json
            record.updated_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(record)
        return CartResponse(email=email, cart=json.loads(record.cart_json or "{}"))

    def get_cart(self, email: str) -> CartResponse:
        normalized = email.lower()
        record = self.db.get(CartRecord, normalized)
        if not record:
            return CartResponse(email=normalized, cart={})

        return CartResponse(email=normalized, cart=json.loads(record.cart_json or "{}"))
