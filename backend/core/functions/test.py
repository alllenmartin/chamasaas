import requests

url = "https://app.mobitechtechnologies.com/sms/sendsms"

headers = {
    "h_api_key": "e0b77a231c87496086e5fa578977b0bb951dc52526e27697c1215e713fe9df57",
    "Content-Type": "application/json"
}

payload = {
    "mobile": "+254703622384",
    "response_type": "json",
    "sender_name": "FULL_CIRCLE",
    "service_id": 0,
    "message": "This is a message.\n\nRegards\nMobitech Technologies Ltd"
}

response = requests.post(url, headers=headers, json=payload)

# Print response
print("Status Code:", response.status_code)
print("Response:", response.text)