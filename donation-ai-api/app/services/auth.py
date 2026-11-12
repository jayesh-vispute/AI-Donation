import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.db_models import User, RoleEnum

# --- JWT configuration ---
# In a real application, SECRET_KEY should be read from environment variables.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-donation-ai")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, hashed_password):
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # --- MOCK FOR LOCAL TESTING IF FIREBASE/AUTH BYPASSED ---
    if os.getenv("TESTING_MOCK_AUTH", "true").lower() == "true":
        if token.startswith("mock_donor"):
            return {"sub": f"{token}@example.com", "role": "DONOR"}
        if token.startswith("mock_ngo"):
            return {"sub": f"{token}@example.com", "role": "NGO"}
        if token.startswith("mock_admin"):
            return {"sub": f"{token}@example.com", "role": "ADMIN"}
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def get_current_user(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    email = payload.get("sub")
    
    # If using mock token logic, auto-create the user if missing
    if os.getenv("TESTING_MOCK_AUTH", "true").lower() == "true" and email and email.startswith("mock_"):
        user = db.query(User).filter(User.email == email).first()
        if not user:
            role = RoleEnum.DONOR
            if "mock_ngo" in email:
                role = RoleEnum.NGO
            elif "mock_admin" in email:
                role = RoleEnum.ADMIN
                
            user = User(
                email=email,
                full_name="Mock User",
                role=role,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        if user.role in [RoleEnum.NGO, RoleEnum.ngo]:
            from app.db_models import NGOProfile
            ngo = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
            if not ngo:
                ngo = NGOProfile(
                    user_id=user.id,
                    organization_name="Mock NGO Organization",
                    latitude=28.5355,
                    longitude=77.3910
                )
                db.add(ngo)
                db.commit()
        return user
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account is blocked or deactivated. Please contact an administrator."
        )
        
    return user

def require_donor(current_user: User = Depends(get_current_user)):
    # Admin can access donor endpoints if needed
    if current_user.role not in [RoleEnum.DONOR, RoleEnum.donor, RoleEnum.ADMIN, RoleEnum.admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions. Donor role required.")
    return current_user

def require_ngo(current_user: User = Depends(get_current_user)):
    # Admin can access NGO endpoints if needed
    if current_user.role not in [RoleEnum.NGO, RoleEnum.ngo, RoleEnum.ADMIN, RoleEnum.admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions. NGO role required.")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions. Admin role required.")
    return current_user
