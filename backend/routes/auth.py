from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from models.user import UserProfile, UserSignIn, UserSignUp
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/signup", response_model=UserProfile)
def sign_up(payload: UserSignUp, service: AuthService = Depends(get_auth_service)):
    return service.sign_up(payload)


@router.post("/signin", response_model=UserProfile)
def sign_in(payload: UserSignIn, service: AuthService = Depends(get_auth_service)):
    return service.sign_in(payload)
