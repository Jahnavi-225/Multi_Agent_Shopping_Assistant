import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, auth

logger = logging.getLogger(__name__)

_initialized = False

def init_firebase_admin():
    global _initialized
    if firebase_admin._apps:
        _initialized = True
        return firebase_admin.get_app()

    cert_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON', '').strip()
    cert_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', '').strip()

    cred = None

    if cert_json:
        try:
            cert_dict = json.loads(cert_json)
            cred = credentials.Certificate(cert_dict)
            logger.info("Loaded Firebase service account from FIREBASE_SERVICE_ACCOUNT_JSON env var.")
        except Exception as e:
            logger.error(f"Error parsing FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    if not cred and cert_path:
        if os.path.exists(cert_path):
            try:
                cred = credentials.Certificate(cert_path)
                logger.info(f"Loaded Firebase service account from file path: {cert_path}")
            except Exception as e:
                logger.error(f"Error loading FIREBASE_SERVICE_ACCOUNT_PATH at {cert_path}: {e}")
        else:
            logger.warning(f"FIREBASE_SERVICE_ACCOUNT_PATH specified but file does not exist: {cert_path}")

    if cred:
        try:
            app = firebase_admin.initialize_app(cred)
            _initialized = True
            logger.info("Firebase Admin SDK initialized successfully.")
            return app
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            return None
    else:
        logger.info("Firebase Admin SDK not configured (no service account JSON or file path provided). Running in demo mode.")
        return None

def is_firebase_admin_configured():
    if not firebase_admin._apps:
        init_firebase_admin()
    return bool(firebase_admin._apps)

def verify_firebase_id_token(id_token):
    if not is_firebase_admin_configured():
        raise RuntimeError("Firebase Admin SDK is not configured on the server.")
    if not id_token:
        raise ValueError("Missing idToken for verification.")
    
    # Verify the ID token using Firebase Admin SDK
    decoded_token = auth.verify_id_token(id_token)
    return decoded_token
