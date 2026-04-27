"""One-off: create a Supabase auth user using the service-role key.

Usage:
    source .venv/bin/activate
    python scripts/create_test_user.py
"""
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

EMAIL = "tienn@test.local"
PASSWORD = "123@123aA"

client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

try:
    res = client.auth.admin.create_user(
        {
            "email": EMAIL,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"username": "tienn"},
        }
    )
    user = res.user
    if not user:
        print("no user returned:", res)
        sys.exit(1)
    print("created user")
    print("  id:   ", user.id)
    print("  email:", user.email)
except Exception as e:
    msg = str(e)
    if "already" in msg.lower() or "registered" in msg.lower():
        print(f"user {EMAIL} already exists — that's fine")
        sys.exit(0)
    print("FAILED:", msg)
    sys.exit(1)
