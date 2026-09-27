import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv("server/.env")

sid = os.getenv("TWILIO_ACCOUNT_SID", "your_twilio_account_sid_here")
token = os.getenv("TWILIO_AUTH_TOKEN", "your_twilio_auth_token_here")

client = Client(sid, token)
account = client.api.accounts(sid).fetch()
print("Status:", account.status)