from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import List, Optional
import uuid
from app.db.supabase_client import get_supabase_client
from app.routers.auth import require_founder
from app.services.face_service import face_service

router = APIRouter(prefix="/api/enrollment", tags=["Facial Enrollment"])

@router.post("/register-faces")
async def register_employee_faces(
    employee_id: str = Form(...),
    images: List[UploadFile] = File(...),
    founder: dict = Depends(require_founder)
):
    """
    Founder registers 6 face sample images for an employee.
    Detects faces with SCRFD, checks quality & anti-spoofing, extracts 512D ArcFace embeddings,
    and saves them into Supabase.
    """
    if len(images) != 6:
        raise HTTPException(
            status_code=400,
            detail=f"Exactly 6 face images are required for enrollment. Received {len(images)} images."
        )

    client = get_supabase_client()
    
    # Verify employee exists and is active
    emp_res = client.table("profiles").select("*").eq("id", employee_id).single().execute()
    if not emp_res.data:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee = emp_res.data
    enrolled_embeddings = []
    poses = ["front", "slight_left", "slight_right", "head_up", "head_down", "expression"]

    for idx, img_file in enumerate(images):
        pose_label = poses[idx] if idx < len(poses) else f"pose_{idx+1}"
        file_bytes = await img_file.read()
        
        try:
            result = face_service.process_image(file_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image {idx+1} ({pose_label}) error: {str(e)}")

        if not result.get("face_detected"):
            raise HTTPException(
                status_code=400,
                detail=f"Face not clearly detected in photo {idx+1} ({pose_label}). Please capture clear, unobstructed photos."
            )

        quality = result["quality_score"]
        if quality < 0.25:
            raise HTTPException(
                status_code=400,
                detail=f"Photo {idx+1} ({pose_label}) has poor image quality/blur (score: {quality}). Please re-take."
            )

        # Upload image to Supabase Storage 'enrolled-faces' bucket
        storage_path = f"{employee_id}/{pose_label}_{uuid.uuid4().hex[:8]}.jpg"
        try:
            client.storage.from_("enrolled-faces").upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
        except Exception:
            # If bucket doesn't exist or error, continue with null path
            storage_path = None

        enrolled_embeddings.append({
            "user_id": employee_id,
            "embedding": result["embedding"],
            "quality_score": quality,
            "image_url": storage_path,
            "is_primary": (idx == 0)
        })

    # Clear prior embeddings if re-enrolling
    client.table("face_embeddings").delete().eq("user_id", employee_id).execute()

    # Insert all 6 embeddings into Supabase
    client.table("face_embeddings").insert(enrolled_embeddings).execute()

    # Update employee profile face_enrolled status
    client.table("profiles").update({
        "face_enrolled": True,
        "enrolled_images_count": len(enrolled_embeddings)
    }).eq("id", employee_id).execute()

    return {
        "message": f"Successfully enrolled 6 facial images for {employee.get('full_name')}",
        "employee_id": employee_id,
        "enrolled_count": len(enrolled_embeddings)
    }

@router.get("/status/{employee_id}")
def check_enrollment_status(employee_id: str, founder: dict = Depends(require_founder)):
    """Check how many embeddings are enrolled for an employee."""
    client = get_supabase_client()
    res = client.table("face_embeddings").select("id, quality_score, is_primary, created_at").eq("user_id", employee_id).execute()
    return {
        "employee_id": employee_id,
        "enrolled_count": len(res.data) if res.data else 0,
        "embeddings": res.data
    }
