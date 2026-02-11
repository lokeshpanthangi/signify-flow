"""
Supabase Client Configuration
=============================
Initializes and exports the Supabase client for use across the backend.
"""

from supabase import create_client, Client

# ─── Supabase Configuration ───────────────────────────────────────────────────
SUPABASE_URL = "https://kdbxpoidpyqevmivzaih.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYnhwb2lkcHlxZXZtaXZ6YWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE0NjIsImV4cCI6MjA4NjMyNzQ2Mn0.lbq9_gVDm0SAdY7-zUkxj15kS2AFfL9RQeAH_Ah4qPc"

# ─── Initialize Supabase Client ──────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_supabase_client() -> Client:
    """Returns the initialized Supabase client instance."""
    return supabase
