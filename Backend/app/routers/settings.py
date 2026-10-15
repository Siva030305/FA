from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
import datetime
from app.db.supabase_client import get_supabase_client
from app.routers.auth import get_current_user, require_founder

router = APIRouter(prefix="/api/settings", tags=["Company Settings & Holidays"])

class UpdateSettingsRequest(BaseModel):
    company_name: Optional[str] = None
    office_name: Optional[str] = None
    office_latitude: Optional[float] = None
    office_longitude: Optional[float] = None
    geofence_radius_meters: Optional[float] = None
    work_start_time: Optional[str] = None  # Format: "09:00:00"
    work_end_time: Optional[str] = None    # Format: "18:00:00"
    grace_period_minutes: Optional[int] = None
    face_match_threshold: Optional[float] = None

class CreateHolidayRequest(BaseModel):
    holiday_date: datetime.date
    title: str
    description: Optional[str] = ""

@router.get("")
def get_company_settings():
    """Retrieve current company geofence coordinates and shift timings."""
    client = get_supabase_client()
    try:
        res = client.table("company_settings").select("*").limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Settings not configured")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
def update_company_settings(payload: UpdateSettingsRequest, founder: dict = Depends(require_founder)):
    """Founder updates office geofence location and shift rules."""
    client = get_supabase_client()
    try:
        current_res = client.table("company_settings").select("id").limit(1).execute()
        if not current_res.data:
            raise HTTPException(status_code=404, detail="Settings row not found")
        
        settings_id = current_res.data[0]["id"]
        update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

        res = client.table("company_settings").update(update_data).eq("id", settings_id).execute()
        return {"message": "Company settings updated successfully", "settings": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- Holidays -----------------

@router.get("/holidays")
def list_holidays():
    """List all scheduled holidays."""
    client = get_supabase_client()
    try:
        res = client.table("holidays").select("*").order("holiday_date").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/holidays")
def add_holiday(payload: CreateHolidayRequest, founder: dict = Depends(require_founder)):
    """Founder adds a holiday to prevent employees from being marked absent."""
    client = get_supabase_client()
    try:
        data = {
            "holiday_date": payload.holiday_date.isoformat(),
            "title": payload.title,
            "description": payload.description,
            "created_by": founder["id"]
        }
        res = client.table("holidays").insert(data).execute()
        return {"message": "Holiday added successfully", "holiday": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add holiday: {str(e)}")

@router.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: str, founder: dict = Depends(require_founder)):
    """Founder deletes a scheduled holiday."""
    client = get_supabase_client()
    try:
        res = client.table("holidays").delete().eq("id", holiday_id).execute()
        return {"message": "Holiday removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
