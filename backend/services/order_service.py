from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.order import Order, OrderCreate, OrderStatus
from models.order_db import OrderRecord
from models.order_owner_db import OrderOwnerRecord


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _duplicate_key(
        customer_name: str,
        items: list[str],
        total_price: float,
        user_email: str | None = None,
    ) -> str:
        normalized_items = ",".join(sorted(item.strip().lower() for item in items))
        customer = customer_name.strip().lower()
        price = f"{total_price:.2f}"
        identity = (user_email or "").strip().lower()
        return f"{customer}|{normalized_items}|{price}|{identity}"

    @staticmethod
    def _to_schema(order: OrderRecord) -> Order:
        return Order.model_validate(order)

    @staticmethod
    def _build_condition(query: str, status: OrderStatus | None):
        condition = None

        q = query.strip().lower()
        if q:
            condition = (
                OrderRecord.id.ilike(f"%{q}%")
                | OrderRecord.customer_name.ilike(f"%{q}%")
                | OrderRecord.status.ilike(f"%{q}%")
                | func.array_to_string(OrderRecord.items, ",").ilike(f"%{q}%")
            )

        if status is not None:
            status_condition = OrderRecord.status == status.value
            condition = status_condition if condition is None else condition & status_condition

        return condition

    def _paginate(self, page: int, page_size: int, condition) -> dict:
        base_query = select(OrderRecord)
        count_query = select(func.count()).select_from(OrderRecord)

        if condition is not None:
            base_query = base_query.where(condition)
            count_query = count_query.where(condition)

        total = self.db.scalar(count_query) or 0
        total_pages = max((total + page_size - 1) // page_size, 1)
        bounded_page = min(page, total_pages)
        start = (bounded_page - 1) * page_size

        rows = self.db.scalars(
            base_query.order_by(OrderRecord.created_at.desc()).offset(start).limit(page_size)
        ).all()

        return {
            "items": [self._to_schema(row) for row in rows],
            "page": bounded_page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": bounded_page < total_pages,
            "has_prev": bounded_page > 1,
        }

    def create_order(self, payload: OrderCreate) -> Order:
        dedup_key = self._duplicate_key(
            payload.customer_name,
            payload.items,
            payload.total_price,
            payload.user_email,
        )

        existing = self.db.execute(
            select(OrderRecord.id).where(OrderRecord.dedup_key == dedup_key)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Duplicate order detected")

        new_order = OrderRecord(
            id=str(uuid4()),
            customer_name=payload.customer_name.strip(),
            items=[item.strip() for item in payload.items],
            total_price=payload.total_price,
            status=OrderStatus.pending.value,
            created_at=datetime.now(timezone.utc),
            dedup_key=dedup_key,
        )

        self.db.add(new_order)

        if payload.user_email:
            self.db.add(
                OrderOwnerRecord(
                    order_id=new_order.id,
                    email=payload.user_email.strip().lower(),
                )
            )

        self.db.commit()
        self.db.refresh(new_order)
        return self._to_schema(new_order)

    def list_orders(
        self,
        page: int,
        page_size: int,
        query: str = "",
        status: OrderStatus | None = None,
    ) -> dict:
        condition = self._build_condition(query=query, status=status)
        return self._paginate(page=page, page_size=page_size, condition=condition)

    def get_order(self, order_id: str) -> Order:
        order = self.db.get(OrderRecord, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return self._to_schema(order)

    def search_orders(
        self,
        query: str,
        page: int,
        page_size: int,
        status: OrderStatus | None = None,
    ) -> dict:
        condition = self._build_condition(query=query, status=status)
        return self._paginate(page=page, page_size=page_size, condition=condition)

    def list_orders_by_user(self, email: str, page: int, page_size: int) -> dict:
        normalized = email.strip().lower()

        total = (
            self.db.scalar(
                select(func.count())
                .select_from(OrderRecord)
                .join(OrderOwnerRecord, OrderOwnerRecord.order_id == OrderRecord.id)
                .where(OrderOwnerRecord.email == normalized)
            )
            or 0
        )

        total_pages = max((total + page_size - 1) // page_size, 1)
        bounded_page = min(page, total_pages)
        start = (bounded_page - 1) * page_size

        rows = self.db.scalars(
            select(OrderRecord)
            .join(OrderOwnerRecord, OrderOwnerRecord.order_id == OrderRecord.id)
            .where(OrderOwnerRecord.email == normalized)
            .order_by(OrderRecord.created_at.desc())
            .offset(start)
            .limit(page_size)
        ).all()

        return {
            "items": [self._to_schema(row) for row in rows],
            "page": bounded_page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": bounded_page < total_pages,
            "has_prev": bounded_page > 1,
        }

    def update_status(self, order_id: str, status: OrderStatus) -> Order:
        order = self.db.get(OrderRecord, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order.status = status.value
        self.db.commit()
        self.db.refresh(order)
        return self._to_schema(order)

    def delete_order(self, order_id: str) -> None:
        order = self.db.get(OrderRecord, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        self.db.delete(order)
        self.db.commit()

    def count_unique_orders(self) -> int:
        return self.db.scalar(select(func.count(func.distinct(OrderRecord.dedup_key)))) or 0
