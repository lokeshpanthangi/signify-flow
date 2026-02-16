"""
Auth CRUD Operations
====================
Database operations for authentication.
"""

from supabase import Client


def signup_user(supabase: Client, email: str, password: str, full_name: str):
    """
    Create a new user with Supabase Auth.
    The profile is auto-created via database trigger.
    """
    auth_response = supabase.auth.sign_up({
        "email": email,
        "password": password,
        "options": {
            "data": {
                "full_name": full_name
            }
        }
    })
    return auth_response


def login_user(supabase: Client, email: str, password: str):
    """
    Authenticate user with email and password.
    """
    auth_response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    return auth_response


def logout_user(supabase: Client):
    """
    Sign out the current user.
    """
    supabase.auth.sign_out()


def get_user_by_token(supabase: Client, access_token: str):
    """
    Get user info from access token.
    """
    user_response = supabase.auth.get_user(access_token)
    return user_response


def get_profile(supabase: Client, user_id: str):
    """
    Get user profile from profiles table.
    """
    response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return response.data
