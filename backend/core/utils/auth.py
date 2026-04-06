from flask_jwt_extended import create_access_token,create_refresh_token
from datetime import timedelta
import requests


def generate_access_token(user):
    """
    Central place for JWT creation.
    Access token = inactivity window
    Refresh token = session lifetime
    """

    access_token = create_access_token(
        identity={
            "phone": user.phone,
            "role": user.role,
            "name": user.name,
        },
        expires_delta=timedelta(minutes=5),  # ⏱ inactivity timeout
    )

    refresh_token = create_refresh_token(
        identity=user.phone,
        expires_delta=timedelta(hours=8),  # full session life
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

def send_sms(phone, message):
    url = "https://app.mobitechtechnologies.com/sms/sendsms"

    headers = {
        "h_api_key": "e0b77a231c87496086e5fa578977b0bb951dc52526e27697c1215e713fe9df57",
        "Content-Type": "application/json"
    }

    payload = {
        "mobile": '+'+phone,
        "response_type": "json",
        "sender_name": "FULL_CIRCLE",
        "service_id": 0,
        "message": message
    }

    response = requests.post(url, headers=headers, json=payload)
    print(payload)
    return response.json()