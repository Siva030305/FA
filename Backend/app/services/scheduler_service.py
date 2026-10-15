import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.db.supabase_client import get_supabase_client
import datetime
import pytz

logger = logging.getLogger("attendance_scheduler")
scheduler = AsyncIOScheduler()

def run_morning_absence_check():
    """
    Executes the morning absence routine. Marks unlogged employees as absent,
    while respecting holidays and approved leaves.
    """
    try:
        client = get_supabase_client()
        today_str = datetime.date.today().isoformat()
        logger.info(f"Running morning absence check for date: {today_str}")
        
        res = client.rpc("mark_morning_absentees", {"target_date": today_str}).execute()
        marked_count = res.data if res.data is not None else 0
        logger.info(f"Morning absence check completed. Marked/updated {marked_count} records.")
        return marked_count
    except Exception as e:
        logger.error(f"Error executing morning absence check: {e}")
        return None

def start_scheduler():
    """
    Configures and starts the background scheduler.
    Default runs daily at 09:15 AM (after 09:00 AM shift start + 15m grace period).
    """
    if not scheduler.running:
        tz = pytz.timezone("Asia/Kolkata")
        # Run daily at 09:15 AM Monday through Saturday
        scheduler.add_job(
            run_morning_absence_check,
            trigger=CronTrigger(hour=9, minute=15, timezone=tz),
            id="daily_morning_absence_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Attendance scheduler started successfully.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Attendance scheduler stopped.")
