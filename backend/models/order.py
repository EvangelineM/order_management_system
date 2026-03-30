from datetime import datetime
from enum import Enum
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class OrderStatus(str, Enum):
    pending = "pending"
    shipped = "shipped"
    delivered = "delivered"


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    user_email: str | None = Field(default=None)
    items: List[str] = Field(min_length=1)
    total_price: float = Field(gt=0)


class OrderUpdateStatus(BaseModel):
    status: OrderStatus


class Order(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_name: str
    items: List[str]
    total_price: float
    status: OrderStatus
    created_at: datetime
