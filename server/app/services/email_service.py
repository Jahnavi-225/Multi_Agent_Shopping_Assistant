import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def is_email_configured():
    return bool(os.getenv('SMTP_HOST') and os.getenv('SMTP_USER') and os.getenv('SMTP_PASSWORD'))


def send_otp_email(to_email, otp_code, user_name="there"):
    host = os.getenv('SMTP_HOST', '').strip()
    port = int(os.getenv('SMTP_PORT', '587'))
    user = os.getenv('SMTP_USER', '').strip()
    password = os.getenv('SMTP_PASSWORD', '').strip()
    from_name = os.getenv('SMTP_FROM_NAME', 'ShopWiseAI').strip()

    if not is_email_configured():
        raise RuntimeError("SMTP is not configured on the server.")

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Your ShopWiseAI verification code: {otp_code}"
    msg['From'] = f"{from_name} <{user}>"
    msg['To'] = to_email

    text_body = f"Hi {user_name},\n\nYour verification code is: {otp_code}\nIt expires in 5 minutes."
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#4f46e5;">ShopWiseAI</h2>
      <p>Hi {user_name},</p>
      <p>Your sign-in verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">{otp_code}</p>
      <p style="color:#6b7280; font-size: 13px;">This code expires in 5 minutes.</p>
    </div>
    """
    msg.attach(MIMEText(text_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(user, password)
        server.sendmail(user, [to_email], msg.as_string())

    return True