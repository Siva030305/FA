from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime
from app.db.supabase_client import get_supabase_client
from app.routers.auth import require_founder, get_current_user

router = APIRouter(prefix="/api/employees", tags=["Employee Management"])

class CreateEmployeeRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    employee_code: str
    department: Optional[str] = "General"
    designation: Optional[str] = "Staff"
    phone: Optional[str] = None

class UpdateEmployeeRequest(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def list_employees(founder: dict = Depends(require_founder)):
    """Founder views all employees and their facial enrollment status."""
    client = get_supabase_client()
    try:
        res = client.table("profiles").select("*").eq("role", "employee").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(payload: CreateEmployeeRequest, founder: dict = Depends(require_founder)):
    """Founder creates a new employee account and initializes their leave balance."""
    client = get_supabase_client()
    
    # Check if employee_code already exists
    code_check = client.table("profiles").select("id").eq("employee_code", payload.employee_code).execute()
    if code_check.data and len(code_check.data) > 0:
        raise HTTPException(status_code=400, detail=f"Employee Code '{payload.employee_code}' already exists")
    
    # Check if email already exists
    email_check = client.table("profiles").select("id").eq("email", payload.email).execute()
    if email_check.data and len(email_check.data) > 0:
        raise HTTPException(status_code=400, detail=f"Email '{payload.email}' already registered")

    try:
        # Create Auth user in Supabase
        auth_res = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "role": "employee",
                "employee_code": payload.employee_code
            }
        })
        
        if not auth_res or not auth_res.user:
            raise HTTPException(status_code=500, detail="Failed to create auth user")
        
        user_id = auth_res.user.id
        
        # Insert profile
        profile_data = {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "role": "employee",
            "employee_code": payload.employee_code,
            "department": payload.department,
            "designation": payload.designation,
            "phone": payload.phone,
            "is_active": True,
            "face_enrolled": False,
            "enrolled_images_count": 0
        }
        client.table("profiles").insert(profile_data).execute()

        # Initialize current year leave balance
        current_year = datetime.date.today().year
        client.table("leave_balances").insert({
            "user_id": user_id,
            "year": current_year,
            "annual_leave_total": 12,
            "sick_leave_total": 6,
            "casual_leave_total": 6
        }).execute()

        return {
            "message": "Employee created successfully. Face enrollment can now be initiated.",
            "employee": profile_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating employee: {str(e)}")

@router.get("/{employee_id}")
def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve details for a specific employee."""
    # Employee can only view self unless founder
    if current_user["role"] != "founder" and current_user["id"] != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    client = get_supabase_client()
    try:
        res = client.table("profiles").select("*").eq("id", employee_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Employee not found")
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{employee_id}")
def update_employee(employee_id: str, payload: UpdateEmployeeRequest, founder: dict = Depends(require_founder)):
    """Founder updates employee details."""
    client = get_supabase_client()
    try:
        update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        res = client.table("profiles").update(update_data).eq("id", employee_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Employee not found")
        return {"message": "Employee updated successfully", "employee": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
