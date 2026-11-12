from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.db_models import User, RoleEnum, NGOProfile, VerificationStatus
from app.schemas import UserCreate, NGORegister, UserResponse, Token, GoogleLoginRequest
from app.services.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    role_val = user_data.role.upper()
    if role_val not in [RoleEnum.DONOR.value, RoleEnum.NGO.value]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be DONOR or NGO.")

    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        phone=user_data.phone,
        role=RoleEnum(role_val)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/register/ngo", response_model=UserResponse)
def register_ngo(ngo_data: NGORegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == ngo_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=ngo_data.email,
        full_name=ngo_data.full_name,
        password_hash=get_password_hash(ngo_data.password),
        phone=ngo_data.phone,
        role=RoleEnum.NGO
    )
    db.add(new_user)
    db.flush() # get ID

    new_profile = NGOProfile(
        user_id=new_user.id,
        organization_name=ngo_data.organization_name,
        description=ngo_data.description,
        address=ngo_data.address,
        registration_number=ngo_data.registration_number,
        email=ngo_data.email,
        phone=ngo_data.phone,
        verification_status=VerificationStatus.PENDING
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is blocked or deactivated. Please contact an administrator."
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)
    access_token = create_access_token(
        data={"sub": user.email, "role": role_val}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
def login_google(google_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    user = db.query(User).filter(User.email == google_data.email).first()
    
    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is blocked or deactivated. Please contact an administrator."
            )
    else:
        # Create a new user with default DONOR role
        user = User(
            email=google_data.email,
            full_name=google_data.display_name or google_data.email.split('@')[0],
            password_hash=get_password_hash(google_data.uid + "google_auth_placeholder"),
            role=RoleEnum.DONOR,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate FastAPI JWT for the user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)
    access_token = create_access_token(
        data={"sub": user.email, "role": role_val}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile.
    """
    return current_user

from pydantic import BaseModel, EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully"}

@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    access_token = create_access_token(
        data={"sub": current_user.email, "role": role_val}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from app.services.email import send_password_reset_email
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        reset_token = create_access_token(
            data={"sub": user.email, "type": "password_reset"}, 
            expires_delta=timedelta(hours=1)
        )
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        send_password_reset_email(user.email, reset_link)
        print(f"\n==========================================")
        print(f"🔑 RESET LINK FOR {user.email}:")
        print(f"{reset_link}")
        print(f"==========================================\n")
        
    return {"success": True, "message": "If an account exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not request.token:
        raise HTTPException(status_code=400, detail="Invalid or missing token")
    try:
        from app.services.auth import SECRET_KEY, ALGORITHM, get_password_hash
        from jose import jwt
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        if not email or token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.password_hash = get_password_hash(request.new_password)
        db.commit()
        db.refresh(user)
        return {"success": True, "message": "Password reset successfully"}
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
