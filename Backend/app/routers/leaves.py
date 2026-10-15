from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
import datetime
from app.db.supabase_client import get_supabase_client
from app.routers.auth import get_current_user, require_founder

router = APIRouter(prefix="/api/leaves", tags=["Leave Management"])

class CreateLeaveRequest(BaseModel):
    leave_type: str  # 'annual', 'sick', 'casual', 'unpaid'
    start_date: datetime.date
    end_date: datetime.date
    reason: str

class ReviewLeaveRequest(BaseModel):
    status: str  # 'approved', 'rejected'
    admin_remarks: Optional[str] = None

@router.get("/balance")
def get_leave_balance(user: dict = Depends(get_current_user)):
    """Retrieve leave balance for current authenticated user."""
    client = get_supabase_client()
    current_year = datetime.date.today().year
    try:
        res = client.table("leave_balances").select("*").eq("user_id", user["id"]).eq("year", current_year).execute()
        if not res.data:
            # Create default balance if missing
            new_bal = {
                "user_id": user["id"],
                "year": current_year,
                "annual_leave_total": 12,
                "sick_leave_total": 6,
                "casual_leave_total": 6,
                "annual_leave_used": 0,
                "sick_leave_used": 0,
                "casual_leave_used": 0
            }
            res = client.table("leave_balances").insert(new_bal).execute()
            return res.data[0]
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/requests")
def list_leave_requests(user: dict = Depends(get_current_user)):
    """Employees view their own leave requests; Founder views all."""
    client = get_supabase_client()
    try:
        query = client.table("leave_requests").select("*, profiles:user_id(full_name, employee_code, department)")
        if user["role"] != "founder":
            query = query.eq("user_id", user["id"])
        
        res = query.order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/request", status_code=status.HTTP_201_CREATED)
def apply_leave(payload: CreateLeaveRequest, user: dict = Depends(get_current_user)):
    """Employee submits a leave application."""
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")
    
    days_count = (payload.end_date - payload.start_date).days + 1
    client = get_supabase_client()

    try:
        leave_data = {
            "user_id": user["id"],
            "leave_type": payload.leave_type,
            "start_date": payload.start_date.isoformat(),
            "end_date": payload.end_date.isoformat(),
            "days_count": days_count,
            "reason": payload.reason,
            "status": "pending"
        }
        res = client.table("leave_requests").insert(leave_data).execute()
        return {"message": "Leave request submitted successfully", "request": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/request/{request_id}")
def review_leave(request_id: str, payload: ReviewLeaveRequest, founder: dict = Depends(require_founder)):
    """Founder approves or rejects an employee's leave request."""
    if payload.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be either 'approved' or 'rejected'")
    
    client = get_supabase_client()
    try:
        req_res = client.table("leave_requests").select("*").eq("id", request_id).single().execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Leave request not found")
        
        leave_req = req_res.data
        user_id = leave_req["user_id"]
        leave_type = leave_req["leave_type"]
        days = leave_req["days_count"]
        
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        update_data = {
            "status": payload.status,
            "reviewed_by": founder["id"],
            "reviewed_at": now_iso,
            "admin_remarks": payload.admin_remarks
        }
        
        # If approved, update leave balance accordingly
        if payload.status == "approved" and leave_type in ("annual", "sick", "casual"):
            current_year = datetime.date.today().year
            bal_res = client.table("leave_balances").select("*").eq("user_id", user_id).eq("year", current_year).execute()
            if bal_res.data and len(bal_res.data) > 0:
                current_bal = bal_res.data[0]
                col_name = f"{leave_type}_leave_used"
                new_used = current_bal.get(col_name, 0) + days
                client.table("leave_balances").update({col_name: new_used}).eq("id", current_bal["id"]).execute()

        res = client.table("leave_requests").update(update_data).eq("id", request_id).execute()
        return {"message": f"Leave request {payload.status}", "request": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
