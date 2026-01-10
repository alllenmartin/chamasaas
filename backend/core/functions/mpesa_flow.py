from datetime import datetime
from flask import request, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
import requests
from core import db
from app import app
import base64
from .models import MpesaTransaction,Member,MCashRecords

def get_mpesa_transactions():
    transactions = MpesaTransaction.query.all()
    return jsonify([o.to_dict() for o in transactions])

def get_access_token():
    consumer_key = 'QXiBhe2EadAjW8t1JpM5jw0XuTTFp7iGGbh1bYUgT4Z6bvRn'
    consumer_secret = '0gqp8PioAmY4E2EL7H7cRc3d80NJXhRU2Z7AhNd0fbtLcbLyVYLDi9vEED5qTtUv'
    access_token_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    headers = {"Content-Type": "application/json"}
    auth = (consumer_key, consumer_secret)
    try:
        response = requests.get(access_token_url, headers=headers, auth=auth)
        response.raise_for_status()
        result = response.json()
        access_token = result["access_token"]
        # return jsonify({"access_token": access_token})
        return access_token
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)})
    
def initiate_MPESA_push():
     try:
       request_form = request.form.to_dict()  or request.get_json()
      
            
       try:        
          res = initiate_stk_push(**request_form)
          return jsonify({"Message": res}), 200
       except ValidationError as err:
         return jsonify(err.messages), 400
     

     except IntegrityError as e:
        return jsonify({"error": str(e)}), 500
    
        # Other Role Backs
    
     except Exception as e:
        return jsonify({"error": str(e)}), 500




def initiate_stk_push(phone_number, amount, reference):
    """Initiate STK push for M-Pesa payment."""
    access_token = get_access_token()

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    # Generate timestamp
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    shortcode = 174379
    passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
   
    # Concatenate Shortcode, Passkey, and Timestamp
    # concat_string = f"{app.config['MPESA_SHORTCODE']}{app.config['MPESA_PASSKEY']}{timestamp}"
    concat_string = f"{shortcode}{passkey}{timestamp}"

    # Encode the concatenated string to base64
    password = base64.b64encode(concat_string.encode()).decode()
  
    

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": int(phone_number),
        "PartyB": shortcode,
        "PhoneNumber": int(phone_number),
        "CallBackURL": "https://3fbe066afe3e.ngrok-free.app/mpesa/callback",
        "AccountReference": reference,
        "TransactionDesc": "Payment of X"
    }
    response = requests.request(
        "POST",
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        headers = headers,
        json = payload,
        timeout = 10
        )
    print(response.text.encode('utf8'))
    

    return response.json()


@app.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():
    data = request.get_json(force=True)
    print("📥 M-Pesa Callback received:", data)

    try:
        stk_callback = data["Body"]["stkCallback"]

        result_code = stk_callback["ResultCode"]
        result_desc = stk_callback["ResultDesc"]

        if result_code == 0:
            # Payment was successful
            metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])

            amount = next((item["Value"] for item in metadata if item["Name"] == "Amount"), None)
            receipt = next((item["Value"] for item in metadata if item["Name"] == "MpesaReceiptNumber"), None)
            phone = next((item["Value"] for item in metadata if item["Name"] == "PhoneNumber"), None)
            trans_time = next((item["Value"] for item in metadata if item["Name"] == "TransactionDate"), None)
            

            transaction_date,month = parse_mpesa_timestamp(str(trans_time))
            member = Member.query.filter_by(phone=normalize_phone(phone)).first()

                        
            # 👉 Save to database here if needed
            transaction = MpesaTransaction(
            amount=amount,
            receipt=receipt,
            phone=phone,
            trans_time=trans_time,
            month= month,
            transaction_date= transaction_date,
            Memberid=member.id,
            member_name = member.name             
            )
            db.session.add(transaction)
            db.session.commit()

            print(f"✅ Success: {amount} received, Receipt {receipt}, Phone {phone}, Time {trans_time}")
           
        else:
            # Payment failed/cancelled
            print(f"❌ Failed: {result_desc}")

    except Exception as e:
        print("⚠️ Error parsing callback:", e)

    # Always acknowledge Safaricom
    return jsonify({"ResultCode": 0, "ResultDesc": "Callback received successfully"})


def parse_mpesa_timestamp(timestamp):
    """Convert MPESA timestamp to DD/MM/YYYY and YYYY-MM"""
    dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S")
    human_date = dt.strftime("%d/%m/%Y")
    year_month = dt.strftime("%Y-%m")
    return human_date, year_month

def normalize_phone(phone):
    """
    Normalize Kenyan phone numbers to 2547XXXXXXXX format.
    
    Examples:
    0712345678  -> 254712345678
    +254712345678 -> 254712345678
    254712345678  -> 254712345678
    """
    phone = str(phone).strip()  # remove whitespace
    
    if phone.startswith("07"):
        return "254" + phone[1:]
    elif phone.startswith("+254"):
        return phone[1:]  # remove '+'
    elif phone.startswith("254"):
        return phone
    else:
        raise ValueError(f"Invalid phone number format: {phone}")
    
    
def initiate_mcash():
    data = request.get_json()

    
    mcash = MCashRecords(
        member_id=data["reference"],
        month=data["month"],
        code=data["code"],
        received_amount = data["amount"],
        phone= data["phone_number"],
        loanno= data["LoanNo"], 
        installment=data["installment"]             
    )

    db.session.add(mcash)
    db.session.commit()

    return jsonify({
        "member_id": mcash.member_id,
        "month": mcash.month,
        "code": mcash.code,
        "amount_received": mcash.received_amount,
        "phone": mcash.phone,
        "loanno": mcash.loanno,
    }), 201


