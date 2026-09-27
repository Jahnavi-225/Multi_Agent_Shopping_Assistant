import sys
sys.path.insert(0, "server")
from dotenv import load_dotenv
import os

load_dotenv("server/.env")

print("HOST:", repr(os.getenv("SMTP_HOST")))
print("USER:", repr(os.getenv("SMTP_USER")))
print("PASS set?:", bool(os.getenv("SMTP_PASSWORD")))

from app.services.email_service import send_otp_email
send_otp_email("venkatalakshmi.velpuri@sasi.ac.in", "123456", user_name="Test")
print("Sent!")