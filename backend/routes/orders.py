from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from db import get_db
from models.order import OrderCreate, OrderStatus, OrderUpdateStatus
from services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)


@router.post("")
def create_order(order: OrderCreate, service: OrderService = Depends(get_order_service)):
    return service.create_order(order)


@router.get("")
def get_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=100),
    q: str = Query(default=""),
    status: OrderStatus | None = Query(default=None),
    service: OrderService = Depends(get_order_service),
):
    return service.list_orders(page=page, page_size=page_size, query=q, status=status)


@router.get("/count")
def get_unique_order_count(service: OrderService = Depends(get_order_service)):
    return {"unique_order_count": service.count_unique_orders()}


@router.get("/search")
def search_orders(
    q: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=100),
    status: OrderStatus | None = Query(default=None),
    service: OrderService = Depends(get_order_service),
):
    return service.search_orders(query=q, page=page, page_size=page_size, status=status)


@router.get("/by-user")
def get_orders_by_user(
    email: str = Query(..., min_length=3),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    service: OrderService = Depends(get_order_service),
):
    return service.list_orders_by_user(email=email, page=page, page_size=page_size)


@router.get("/{order_id}")
def get_order(order_id: str, service: OrderService = Depends(get_order_service)):
    return service.get_order(order_id)


@router.patch("/{order_id}")
def update_order_status(
    order_id: str,
    payload: OrderUpdateStatus,
    service: OrderService = Depends(get_order_service),
):
    return service.update_status(order_id=order_id, status=payload.status)


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: str, service: OrderService = Depends(get_order_service)):
    service.delete_order(order_id)
    return Response(status_code=204)
