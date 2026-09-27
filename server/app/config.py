import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'shopping-agent-free-tier-secret-key-2026')
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
    RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY', '')
    RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com'
    FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON', '')
    FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', '')
    CORS_HEADERS = 'Content-Type'

