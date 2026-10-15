from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import Optional, List
import uuid
import datetime
from app.db.supabase_client import get_supabase_client
from app.routers.auth import get_current_user, require_founder
from app.services.face_service import face_service
from app.services.geofence_service import verify_geofence

router = APIRouter(prefix="/api/attendance", tags=["Attendance Verification"])

@router.post("/check-in")
async def employee_check_in(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_id: Optional[str] = Form(None)
):
    """
    Attendance Check-In:
    1. Geofence Location Verification
    2. SCRFD Face Detection
    3. Anti-Spoofing / Liveness Check
    4. ArcFace 512D Embedding Match
    5. Records attendance (Present or Late, converting Morning Absent if applicable)
    """
    client = get_supabase_client()

    # 1. Geofence Verification
    settings_res = client.table("company_settings").select("*").limit(1).execute()
    if not settings_res.data:
        raise HTTPException(status_code=500, detail="Company settings not found in database")
    
    comp_settings = settings_res.data[0]
    office_lat = comp_settings["office_latitude"]
    office_lng = comp_settings["office_longitude"]
    radius_meters = comp_settings["geofence_radius_meters"]
    match_threshold = comp_settings.get("face_match_threshold", 0.45)

    geo_result = verify_geofence(latitude, longitude, office_lat, office_lng, radius_meters)
    if not geo_result["is_inside"]:
        raise HTTPException(
            status_code=400,
            detail=f"Geofence violation: You are {geo_result['distance_meters']}m away from office. Permitted radius: {radius_meters}m."
        )

    # 2. AI Face Processing & Anti-Spoofing
    image_bytes = await image.read()
    try:
        ai_res = face_service.process_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {str(e)}")

    if not ai_res.get("face_detected"):
        raise HTTPException(status_code=400, detail=ai_res.get("error", "No face detected in live camera frame"))

    liveness_score = ai_res["liveness_score"]
    if liveness_score < 0.40:
        raise HTTPException(
            status_code=400,
            detail=f"Anti-spoofing alert: Liveness check failed (score: {liveness_score}). Please present a live person."
        )

    query_embedding = ai_res["embedding"]
    matched_user_id = user_id
    match_similarity = 1.0 - match_threshold

    # 3. Embedding Vector Matching (ArcFace 512D)
    if not matched_user_id:
        # 1:N Vector Search using Supabase match_face RPC
        match_rpc = client.rpc("match_face", {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": 1
        }).execute()

        if not match_rpc.data or len(match_rpc.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Face not recognized. You must be enrolled by the Founder to mark attendance."
            )
        
        matched_user_id = match_rpc.data[0]["user_id"]
        cosine_dist = match_rpc.data[0]["distance"]
        match_similarity = round(1.0 - cosine_dist, 3)
    else:
        # 1:1 Vector Verification against specific user
        user_emb_res = client.table("face_embeddings").select("embedding").eq("user_id", matched_user_id).execute()
        if not user_emb_res.data or len(user_emb_res.data) == 0:
            raise HTTPException(status_code=400, detail="User does not have any enrolled facial profiles")
        
        # Calculate cosine distance with enrolled templates
        import numpy as np
        q_vec = np.array(query_embedding, dtype=np.float32)
        best_dist = 1.0
        for row in user_emb_res.data:
            template = np.array(row["embedding"], dtype=np.float32)
            dist = 1.0 - float(np.dot(q_vec, template))
            if dist < best_dist:
                best_dist = dist
        
        if best_dist > match_threshold:
            raise HTTPException(
                status_code=400,
                detail=f"Face identity verification failed. Distance ({round(best_dist, 3)}) exceeds threshold ({match_threshold})."
            )
        match_similarity = round(1.0 - best_dist, 3)

    # 4. Upload attendance snapshot to Supabase Storage
    snapshot_path = f"checkins/{matched_user_id}_{datetime.date.today().isoformat()}_{uuid.uuid4().hex[:6]}.jpg"
    try:
        client.storage.from_("attendance-snapshots").upload(
            path=snapshot_path,
            file=image_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
    except Exception:
        snapshot_path = None

    # 5. Record Check-In in Database (Translates Morning Absent to Present or Late)
    checkin_res = client.rpc("record_employee_check_in", {
        "p_user_id": matched_user_id,
        "p_lat": latitude,
        "p_lng": longitude,
        "p_distance": geo_result["distance_meters"],
        "p_is_inside_geofence": True,
        "p_liveness_score": liveness_score,
        "p_match_similarity": match_similarity,
        "p_snapshot_path": snapshot_path
    }).execute()

    record_info = checkin_res.data[0] if checkin_res.data else {}

    # Fetch employee profile for display
    emp_res = client.table("profiles").select("id, full_name, employee_code, department").eq("id", matched_user_id).single().execute()
    employee = emp_res.data if emp_res.data else {}

    return {
        "success": True,
        "status": record_info.get("final_status", "present"),
        "is_late": record_info.get("is_late", False),
        "check_in_time": record_info.get("check_in_time"),
        "distance_meters": geo_result["distance_meters"],
        "liveness_score": liveness_score,
        "match_similarity": match_similarity,
        "employee": employee,
        "message": "Attendance marked successfully! Have a productive day." if not record_info.get("is_late") else "Attendance marked as LATE."
    }

@router.get("/today")
def get_today_attendance(user: dict = Depends(get_current_user)):
    """Fetch attendance records for today."""
    client = get_supabase_client()
    today_str = datetime.date.today().isoformat()
    try:
        query = client.table("attendance").select(
            "*, profiles:user_id(full_name, employee_code, department, designation, avatar_url)"
        ).eq("attendance_date", today_str)

        if user["role"] != "founder":
            query = query.eq("user_id", user["id"])

        res = query.order("check_in_time", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_attendance_history(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    user: dict = Depends(get_current_user)
):
    """Retrieve historical attendance records."""
    client = get_supabase_client()
    try:
        query = client.table("attendance").select(
            "*, profiles:user_id(full_name, employee_code, department, designation)"
        )
        if user["role"] != "founder":
            query = query.eq("user_id", user["id"])

        if start_date:
            query = query.gte("attendance_date", start_date.isoformat())
        if end_date:
            query = query.lte("attendance_date", end_date.isoformat())

        res = query.order("attendance_date", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-morning-routine")
def trigger_morning_routine(founder: dict = Depends(require_founder)):
    """Founder triggers the morning absence routine manually."""
    from app.services.scheduler_service import run_morning_absence_check
    count = run_morning_absence_check()
    return {"message": "Morning absence routine executed", "records_processed": count}
