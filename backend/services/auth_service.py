import hashlib

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.user import UserProfile, UserSignIn, UserSignUp
from models.user_db import UserRecord


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _hash_password(password: str) -> str:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def sign_up(self, payload: UserSignUp) -> UserProfile:
        email = payload.email.lower()
        existing = self.db.get(UserRecord, email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user = UserRecord(
            email=email,
            name=payload.name.strip(),
            password_hash=self._hash_password(payload.password),
            role="customer",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return UserProfile(name=user.name, email=user.email, role=user.role)

    def sign_in(self, payload: UserSignIn) -> UserProfile:
        email = payload.email.lower()
        user = self.db.get(UserRecord, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.password_hash != self._hash_password(payload.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return UserProfile(name=user.name, email=user.email, role=user.role)

    def ensure_admin(self) -> None:
        email = "admin@gmail.com"
        existing = self.db.get(UserRecord, email)
        if existing:
            return

        admin = UserRecord(
            email=email,
            name="Admin",
            password_hash=self._hash_password("admin123"),
            role="admin",
        )
        self.db.add(admin)
        self.db.commit()
