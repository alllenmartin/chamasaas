# utils/sms.py
import requests
from app import app

def send_sms_to_mobile(mobile: str, message: str):
    """
    Sends SMS via Mobitech.
    """
    if not mobile or not message:
        return {"error": "Mobile and message are required"}

    payload = {
        "mobile": '+'+mobile,
        "response_type": "json",
        "sender_name": "MOBI-TECH",
        "service_id": 0,
        "message": message
    }
    print('Found here',payload)

    headers = {
        "h_api_key": app.config["MOBITECH_API_KEY"],
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            app.config["MOBITECH_URL"],
            json=payload,
            headers=headers,
            timeout=10
        )
        return response.json()
    except Exception as e:
        print("⚠️ SMS sending failed:", str(e))
        return {"error": str(e)}
