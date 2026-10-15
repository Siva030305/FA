from supabase import create_client, Client
from app.config import settings

_supabase_client: Client | None = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env")
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client
