from fastapi import APIRouter, HTTPException, Depends, status, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.config import settings
from app.db.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ----------------- Models -----------------
class FounderSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    founder_setup_code: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UpdatePasswordRequest(BaseModel):
    new_password: str

# ----------------- Token Dependency -----------------
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    client = get_supabase_client()
    try:
        user_res = client.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")
        
        user_id = user_res.user.id
        profile_res = client.table("profiles").select("*").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
        
        profile = profile_res.data
        if not profile.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Authentication failed: {str(e)}")

async def require_founder(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "founder":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Founder privileges required.")
    return current_user

# ----------------- Endpoints -----------------

@router.get("/founder-status")
def check_founder_status():
    """Checks whether the single Boss/Founder account has been created yet."""
    client = get_supabase_client()
    try:
        res = client.rpc("check_founder_exists").execute()
        founder_exists = bool(res.data)
        
        # Also fetch company name if exists
        company_name = "Face Attendance Portal"
        settings_res = client.table("company_settings").select("company_name").limit(1).execute()
        if settings_res.data and len(settings_res.data) > 0:
            company_name = settings_res.data[0].get("company_name", company_name)
            
        return {
            "founder_exists": founder_exists,
            "company_name": company_name
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")

@router.post("/founder/signup")
def founder_signup(payload: FounderSignupRequest):
    """Initial one-time registration for the company Founder/Boss."""
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    
    if len(payload.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters")

    # Validate setup code from backend .env
    if payload.founder_setup_code != settings.FOUNDER_SETUP_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Founder Setup Code. Verification failed.")

    client = get_supabase_client()
    
    # Check if a founder already exists (Strict: Only one boss)
    founder_check = client.table("profiles").select("id").eq("role", "founder").execute()
    if founder_check.data and len(founder_check.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A Founder account already exists for this organization. Only one Boss is permitted."
        )

    try:
        # Create Auth User in Supabase with pre-confirmed email
        auth_res = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "role": "founder"
            }
        })
        
        if not auth_res or not auth_res.user:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create auth user")
        
        user_id = auth_res.user.id
        
        # Insert into public.profiles
        profile_data = {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "role": "founder",
            "is_active": True,
            "face_enrolled": False
        }
        client.table("profiles").insert(profile_data).execute()
        
        # Log in the new founder to retrieve JWT access tokens
        login_res = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        
        return {
            "message": "Founder account created successfully",
            "access_token": login_res.session.access_token if login_res.session else None,
            "refresh_token": login_res.session.refresh_token if login_res.session else None,
            "user": profile_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Founder registration error: {str(e)}")

@router.post("/login")
def login(payload: LoginRequest):
    """Authenticate Founder or Employee."""
    client = get_supabase_client()
    try:
        auth_res = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        
        if not auth_res.session or not auth_res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
        user_id = auth_res.user.id
        profile_res = client.table("profiles").select("*").eq("id", user_id).single().execute()
        
        if not profile_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found in database")
        
        profile = profile_res.data
        if not profile.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated. Contact the administrator.")
        
        return {
            "access_token": auth_res.session.access_token,
            "refresh_token": auth_res.session.refresh_token,
            "user": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        if "Invalid login credentials" in err_msg:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.post("/founder/forgot-password")
def founder_forgot_password(payload: ForgotPasswordRequest):
    """Password reset is strictly allowed ONLY for the single Founder/Boss."""
    client = get_supabase_client()
    try:
        # Check if email belongs to the founder
        res = client.table("profiles").select("id, role, full_name").eq("email", payload.email).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account registered with this email")
        
        user_record = res.data[0]
        if user_record.get("role") != "founder":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password reset is strictly reserved for the Founder. Employees must contact their Founder to change passwords."
            )
        
        # Send password reset email via Supabase Auth
        client.auth.reset_password_email(payload.email)
        return {"message": "Password reset instructions have been sent to the Founder email address."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/me")
def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile and active role."""
    return user
