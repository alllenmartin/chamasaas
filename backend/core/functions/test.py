import requests
from requests.auth import HTTPBasicAuth

url = "https://apisms.beem.africa/v1/send"

data = {
    "source_addr": "BEEM",
    "encoding": 0,
    "message": "SMS Test from Python API",
    "recipients": [
        {
            "recipient_id": 1,
            "dest_addr": "254703622386"
        }
    ]
}

username = "bcd91b01afb4e553"
password = "ZTc4MzA5ZjExNWVlNzRkMWE0YWIxZTk4MGFiNzk4YzRlMTlhMGQ3MzBlZGZhNWIzN2MyNTM1MTEzYTA3YjcwNQ=="

response = requests.post(url, json=data, auth=HTTPBasicAuth(username, password))

if response.status_code == 200:
    print("SMS sent successfully!")
else:
    print("SMS sending failed. Status code:", response.status_code)
    print("Response:", response.text)