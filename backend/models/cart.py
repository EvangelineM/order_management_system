from pydantic import BaseModel, Field


class CartSave(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    cart: dict[str, int]


class CartResponse(BaseModel):
    email: str
    cart: dict[str, int]


class CartData(BaseModel):
    cart: dict[str, int]
