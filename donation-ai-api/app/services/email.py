import os
import smtplib
from email.message import EmailMessage
import logging

logger = logging.getLogger("donation_ai.email")

from typing import Tuple

def send_email(to_email: str, subject: str, body_html: str, body_text: str = None) -> Tuple[bool, str]:
    """
    Sends an email using configured SMTP settings from environment variables.
    If SMTP settings are not configured, prints the email content to terminal for development.
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM") or os.getenv("SMTP_FROM_EMAIL") or smtp_user or "no-reply@donationai.org"

    if not smtp_host or not smtp_user:
        logger.warning(f"[DEVELOPMENT MODE] SMTP host/user not set in .env. Logging email to {to_email}.")
        print(f"\n==========================================")
        print(f"📧 EMAIL RECIPIENT: {to_email}")
        print(f"📧 SUBJECT: {subject}")
        print(f"📧 MESSAGE BODY:\n{body_text or body_html}")
        print(f"==========================================\n")
        return False, "SMTP configuration is completely missing (SMTP_HOST or SMTP_USER)."

    if smtp_user == "your_email@gmail.com" or smtp_password == "paste_your_16_character_app_password_here":
        return False, "SMTP credentials in .env are using placeholder values (SMTP_USER/SMTP_PASSWORD). Please configure valid credentials."

    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg.set_content(body_text or body_html)
        if body_html:
            msg.add_alternative(body_html, subtype='html')

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
        logger.info(f"Successfully sent email to {to_email}")
        print(f"✅ EMAIL SENT to {to_email}")
        return True, ""
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error ({to_email}): {str(e)}")
        print(f"❌ SMTP AUTH ERROR ({to_email}): {str(e)}")
        return False, "SMTP Authentication Failed. Please check SMTP_USER and SMTP_PASSWORD in .env."
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        print(f"❌ SMTP SEND ERROR ({to_email}): {str(e)}")
        return False, f"Email delivery failed: {str(e)}"

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    subject = "Reset Your Password - Donation AI"
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Inter', -apple-system, sans-serif; background-color: #F8F4ED; margin: 0; padding: 40px 20px; color: #2D1B14; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #FFFCF8; border: 1px solid #E4D8CA; border-radius: 16px; padding: 36px; box-shadow: 0 10px 25px rgba(45, 27, 20, 0.05); }}
    .brand {{ font-size: 24px; font-weight: 800; color: #2D1B14; text-align: center; margin-bottom: 24px; }}
    .brand span {{ color: #C9652B; }}
    .title {{ font-size: 22px; font-weight: 700; color: #2D1B14; margin-top: 0; margin-bottom: 12px; }}
    .text {{ font-size: 14px; color: #75665C; line-height: 1.6; margin-bottom: 24px; }}
    .btn-container {{ text-align: center; margin: 28px 0; }}
    .btn {{ display: inline-block; background-color: #C9652B; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(201,101,43,0.25); }}
    .link-alt {{ font-size: 12px; color: #A3988E; word-break: break-all; margin-top: 16px; }}
    .footer {{ font-size: 12px; color: #A3988E; border-top: 1px solid #EFE6D8; margin-top: 32px; padding-top: 20px; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Donation <span>AI</span></div>
    <h2 class="title">Reset Your Password</h2>
    <p class="text">Hello,</p>
    <p class="text">We received a request to reset the password for your Donation AI account ({to_email}). Click the button below to set a new password:</p>
    <div class="btn-container">
      <a href="{reset_link}" class="btn">Reset Password</a>
    </div>
    <p class="text" style="font-size: 13px;">If you did not request a password reset, you can safely ignore this message. Your account remains secure.</p>
    <div class="link-alt">
      Or copy and paste this URL into your browser:<br/>
      <a href="{reset_link}" style="color: #C9652B;">{reset_link}</a>
    </div>
    <div class="footer">
      Donation AI &bull; Smarter Giving. Brighter Tomorrows.
    </div>
  </div>
</body>
</html>"""

    text_content = f"Donation AI - Reset Your Password\n\nReset link: {reset_link}\n\nIf you did not request a password reset, please ignore this email."
    success, _ = send_email(to_email, subject, html_content, text_content)
    return success

def send_delivery_otp_email(to_email: str, donor_name: str, donation_id: int, otp: str, expiry_minutes: int, is_resend: bool = False) -> Tuple[bool, str]:
    subject = f"Donation AI — Delivery Verification Code"
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Inter', -apple-system, sans-serif; background-color: #F8F4ED; margin: 0; padding: 40px 20px; color: #2D1B14; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #FFFCF8; border: 1px solid #E4D8CA; border-radius: 16px; padding: 36px; box-shadow: 0 10px 25px rgba(45, 27, 20, 0.05); }}
    .brand {{ font-size: 24px; font-weight: 800; color: #2D1B14; text-align: center; margin-bottom: 24px; }}
    .brand span {{ color: #C9652B; }}
    .title {{ font-size: 22px; font-weight: 700; color: #2D1B14; margin-top: 0; margin-bottom: 12px; }}
    .text {{ font-size: 14px; color: #75665C; line-height: 1.6; margin-bottom: 16px; }}
    .otp-container {{ text-align: center; margin: 28px 0; background-color: #F3EBE1; padding: 20px; border-radius: 12px; }}
    .otp-code {{ font-size: 32px; font-weight: 800; color: #C9652B; letter-spacing: 4px; }}
    .footer {{ font-size: 12px; color: #A3988E; border-top: 1px solid #EFE6D8; margin-top: 32px; padding-top: 20px; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Donation <span>AI</span></div>
    <h2 class="title">Delivery Verification Code</h2>
    <p class="text">Hello {donor_name},</p>
    <p class="text">Your delivery verification code for donation {donation_id} is:</p>
    <div class="otp-container">
      <div class="otp-code">{otp}</div>
    </div>
    <p class="text">This code expires in {expiry_minutes} minutes.</p>
    {f'<p class="text" style="color: #C9652B; font-weight: 600;">If you requested a new code, your previous code is no longer valid.</p>' if is_resend else ''}
    <p class="text">Please provide this code to the authorized delivery person when your donation is handed over.<br/>
    If you did not expect this delivery, please contact Donation AI support.</p>
    <p class="text" style="margin-top: 32px;">Thank you,<br/>
    <strong>Donation AI Team</strong><br/>
    Intelligent Donation Management Platform</p>
    <div class="footer">
      Donation AI &bull; Smarter Giving. Brighter Tomorrows.
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Hello {donor_name},

Your delivery verification code for donation {donation_id} is:
{otp}

This code expires in {expiry_minutes} minutes.
{'''
If you requested a new code, your previous code is no longer valid.
''' if is_resend else ''}
Please provide this code to the authorized delivery person when your donation is handed over.
If you did not expect this delivery, please contact Donation AI support.

Thank you,

Donation AI Team
Intelligent Donation Management Platform
"""
    return send_email(to_email, subject, html_content, text_content)

