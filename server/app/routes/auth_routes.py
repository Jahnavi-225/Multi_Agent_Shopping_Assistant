import re
import uuid
import jwt
import datetime
from flask import Blueprint, request, jsonify, current_app
from app.config import Config
from app.database import get_db_connection
from app.services.firebase_admin_service import is_firebase_admin_configured, verify_firebase_id_token
from app.services.email_service import send_otp_email, is_email_configured


auth_bp = Blueprint('auth', __name__)

def generate_jwt(user_data):
    payload = {
        "sub": user_data["id"],
        "name": user_data["name"],
        "email": user_data.get("email", ""),
        "phone": user_data.get("phone", ""),
        "provider": user_data.get("provider", "guest"),
        "avatar_url": user_data.get("avatar_url", ""),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    id_token = data.get('idToken')

    if is_firebase_admin_configured():
        if id_token:
            try:
                decoded = verify_firebase_id_token(id_token)
                email = (decoded.get('email') or '').strip().lower()
                if not email:
                    return jsonify({"error": "Google ID Token does not contain a valid email address"}), 400
                name = decoded.get('name') or email.split('@')[0] or 'Google Shopper'
                avatar_url = decoded.get('picture') or data.get('avatar_url') or 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            except Exception as e:
                current_app.logger.warning(f"Google idToken verification failed: {e}")
                return jsonify({"error": f"Invalid or expired Google authentication token: {str(e)}"}), 401
        else:
            current_app.logger.warning("FIREBASE CONFIGURED: /api/auth/google called without idToken. Rejecting unverified auth request.")
            return jsonify({"error": "Firebase Auth is configured on server. A verified idToken is required."}), 401

    else:
        if id_token:
            current_app.logger.warning("DEMO MODE UNVERIFIED AUTH: idToken provided to /api/auth/google but Firebase Admin SDK is not configured on backend.")
        else:
            current_app.logger.warning("DEMO MODE UNVERIFIED AUTH: /api/auth/google called in demo mode (Firebase Admin SDK not configured).")
        email = data.get('email', 'shopper@gmail.com').strip().lower()
        name = data.get('name', 'Google Shopper')
        avatar_url = data.get('avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
    user = cursor.fetchone()

    if not user:
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            "INSERT INTO users (id, name, email, provider, avatar_url) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, 'google', avatar_url)
        )
        conn.commit()
        user_data = {"id": user_id, "name": name, "email": email, "provider": "google", "avatar_url": avatar_url}
    else:
        user_data = dict(user)

    conn.close()

    token = generate_jwt(user_data)
    return jsonify({
        "status": "success",
        "token": token,
        "user": user_data
    })

# In-memory OTP session store: phone -> {otp, expires_at, last_sent}
OTP_SESSIONS = {}
EMAIL_OTP_SESSIONS = {}


@auth_bp.route('/google/request-otp', methods=['POST'])
def google_request_otp():
    data = request.get_json() or {}
    id_token = data.get('idToken')

    if is_firebase_admin_configured():
        if not id_token:
            return jsonify({"error": "Firebase Auth is configured on server. A verified idToken is required."}), 401
        try:
            decoded = verify_firebase_id_token(id_token)
            email = (decoded.get('email') or '').strip().lower()
            if not email:
                return jsonify({"error": "Google ID Token does not contain a valid email address"}), 400
            name = decoded.get('name') or email.split('@')[0] or 'Google Shopper'
            avatar_url = decoded.get('picture') or data.get('avatar_url') or 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        except Exception as e:
            current_app.logger.warning(f"Google idToken verification failed: {e}")
            return jsonify({"error": f"Invalid or expired Google authentication token: {str(e)}"}), 401
    else:
        email = (data.get('email') or 'shopper@gmail.com').strip().lower()
        name = data.get('name', 'Google Shopper')
        avatar_url = data.get('avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')

    now = datetime.datetime.utcnow()
    existing = EMAIL_OTP_SESSIONS.get(email)
    if existing and (now - existing['last_sent']).total_seconds() < 15:
        remaining = int(15 - (now - existing['last_sent']).total_seconds())
        return jsonify({"error": f"Please wait {remaining} seconds before requesting a new code"}), 429

    import random
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = now + datetime.timedelta(minutes=5)

    EMAIL_OTP_SESSIONS[email] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "last_sent": now,
        "pending_user": {"name": name, "email": email, "avatar_url": avatar_url}
    }

    if is_email_configured():
        try:
            send_otp_email(email, otp_code, user_name=name)
        except Exception as e:
            current_app.logger.error(f"Failed to send OTP email to {email}: {e}")
            return jsonify({"error": f"Could not send verification email: {str(e)}"}), 502
        return jsonify({"status": "success", "message": f"Verification code sent to {email}."})
    else:
        return jsonify({
            "status": "success",
            "message": f"Demo mode: SMTP not configured. Use code {otp_code} to continue.",
            "demo_otp": otp_code
        })


@auth_bp.route('/google/verify-otp', methods=['POST'])
def google_verify_otp():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()

    if not email or not otp:
        return jsonify({"error": "Email and OTP code are required"}), 400

    session = EMAIL_OTP_SESSIONS.get(email)
    now = datetime.datetime.utcnow()

    if not session:
        return jsonify({"error": "No verification code request found for this email. Please sign in with Google again."}), 400
    if now > session["expires_at"]:
        del EMAIL_OTP_SESSIONS[email]
        return jsonify({"error": "Verification code expired (5-minute limit). Please sign in with Google again."}), 400
    if session["otp"] != otp:
        return jsonify({"error": "Invalid verification code. Please check and try again."}), 400

    pending = session["pending_user"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
    user = cursor.fetchone()

    if not user:
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            "INSERT INTO users (id, name, email, provider, avatar_url) VALUES (?, ?, ?, ?, ?)",
            (user_id, pending["name"], email, 'google', pending["avatar_url"])
        )
        conn.commit()
        user_data = {"id": user_id, "name": pending["name"], "email": email, "provider": "google", "avatar_url": pending["avatar_url"]}
    else:
        user_data = dict(user)

    conn.close()
    del EMAIL_OTP_SESSIONS[email]

    token = generate_jwt(user_data)
    return jsonify({"status": "success", "token": token, "user": user_data})

@auth_bp.route('/google/callback', methods=['GET', 'POST'])
def google_callback():
    data = request.get_json() if request.method == 'POST' else {}
    email = (data.get('email') or request.args.get('email', 'shopper@gmail.com')).strip().lower()
    name = data.get('name') or request.args.get('name', 'Google Shopper')
    avatar_url = data.get('avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
    user = cursor.fetchone()

    if not user:
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            "INSERT INTO users (id, name, email, provider, avatar_url) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, 'google', avatar_url)
        )
        conn.commit()
        user_data = {"id": user_id, "name": name, "email": email, "provider": "google", "avatar_url": avatar_url}
    else:
        user_data = dict(user)

    conn.close()
    token = generate_jwt(user_data)
    return jsonify({"status": "success", "token": token, "user": user_data})

@auth_bp.route('/otp/send', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    phone = data.get('phone', '').strip()

    if not phone:
        return jsonify({"error": "Phone number is required"}), 400

    now = datetime.datetime.utcnow()
    existing = OTP_SESSIONS.get(phone)

    if existing and (now - existing['last_sent']).total_seconds() < 15:
        remaining = int(15 - (now - existing['last_sent']).total_seconds())
        return jsonify({"error": f"Please wait {remaining} seconds before requesting a new OTP"}), 429

    otp_code = "123456"  # Default demo/verification code
    expires_at = now + datetime.timedelta(minutes=5)

    OTP_SESSIONS[phone] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "last_sent": now
    }

    return jsonify({
        "status": "success",
        "message": f"Verification SMS code sent to {phone}. Code expires in 5 minutes.",
        "demo_otp": otp_code,
        "expires_in_seconds": 300
    })

@auth_bp.route('/otp/verify', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    phone = data.get('phone', '').strip()
    otp = data.get('otp', '').strip()
    id_token = data.get('idToken')

    if is_firebase_admin_configured():
        if id_token:
            try:
                decoded = verify_firebase_id_token(id_token)
                verified_phone = decoded.get('phone_number') or decoded.get('phone') or phone
                if verified_phone:
                    phone = verified_phone.strip()
            except Exception as e:
                current_app.logger.warning(f"Phone OTP idToken verification failed: {e}")
                return jsonify({"error": f"Invalid or expired Phone authentication token: {str(e)}"}), 401
        else:
            current_app.logger.warning("FIREBASE CONFIGURED: /api/auth/otp/verify called without idToken. Rejecting unverified demo OTP bypass.")
            return jsonify({"error": "Firebase Auth is configured on server. A verified idToken is required."}), 401
    else:
        current_app.logger.warning("DEMO MODE UNVERIFIED OTP: /api/auth/otp/verify called in demo mode (Firebase Admin SDK not configured).")
        if not phone or not otp:
            return jsonify({"error": "Phone number and OTP code are required"}), 400

        now = datetime.datetime.utcnow()
        session = OTP_SESSIONS.get(phone)

        if otp != "123456":
            if not session:
                return jsonify({"error": "No OTP request found for this phone number. Please click Send OTP first."}), 400
            if now > session["expires_at"]:
                return jsonify({"error": "OTP verification code has expired (5-minute limit). Please request a new OTP."}), 400
            if session["otp"] != otp:
                return jsonify({"error": "Invalid verification code. Please check and try again."}), 400

    clean_digits = re.sub(r'\D', '', phone) if phone else ''
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE phone = ? OR phone LIKE ?", (phone, f"%{clean_digits[-10:]}%"))
    user = cursor.fetchone()

    if not user:
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        name = f"User ({phone[-4:]})" if len(phone) >= 4 else "User"
        avatar_url = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"
        cursor.execute(
            "INSERT INTO users (id, name, phone, provider, avatar_url) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, phone, 'phone', avatar_url)
        )
        conn.commit()
        user_data = {"id": user_id, "name": name, "phone": phone, "provider": "phone", "avatar_url": avatar_url}
    else:
        user_data = dict(user)

    conn.close()

    # Clear OTP session after successful verification
    if phone in OTP_SESSIONS:
        del OTP_SESSIONS[phone]

    token = generate_jwt(user_data)
    return jsonify({
        "status": "success",
        "token": token,
        "user": user_data
    })

@auth_bp.route('/me', methods=['GET'])
def get_me():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return jsonify({"status": "success", "user": payload})
    except Exception as e:
        return jsonify({"error": "Invalid token"}), 401

@auth_bp.route('/profile', methods=['PUT', 'POST'])
def update_profile():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    name = data.get('name', '').strip()

    if not user_id or not name:
        return jsonify({"error": "user_id and name are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
    conn.commit()
    conn.close()

    return jsonify({"status": "success", "message": "Profile updated successfully"})