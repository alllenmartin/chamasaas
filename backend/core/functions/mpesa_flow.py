from flask import request,jsonify
from datetime import datetime, timedelta
from .models import db, MpesaTransaction,Member,Contribution
from app import app
import requests
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
import base64
from flask_cors import cross_origin


def handle_registration_fee(txn, member):
    """
    Update member record when registration fee is successfully paid via Mpesa.
    """
    try:
        # 1️⃣ Update member
        member.registrationPaid = True
        member.status = "Paid"
        member.amountPaid += int(txn.amount)  # add to any existing amountPaid
        db.session.commit()

        print(f"✅ Member {member.name} registration fee marked as paid. Amount: {txn.amount}")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating member registration fee: {e}")

    
# MPESA Transactions
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
        request_form = request.form.to_dict() or request.get_json(silent=True)
        if not request_form:
            return jsonify({"error": "No input data provided"}), 400

        print("Incoming data:", request_form)

        checkout_id = initiate_stk_push(**request_form)
        print("✅ Payment success:", checkout_id)

        if not checkout_id:
            return jsonify({"error": "STK push failed"}), 500

        return jsonify({"checkout_request_id": checkout_id}), 200

    except ValidationError as err:
        return jsonify(err.messages), 400

    except IntegrityError as e:
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500




def initiate_stk_push(phone_number, amount, reference,transaction_type):
    """Initiate STK push for M-Pesa payment."""
    access_token = get_access_token()
    print('Reached here')
    
    # ✅ CREATE TRANSACTION FIRST
    txn = MpesaTransaction(
        reference=reference,
        receipt= reference,
        phone=phone_number,
        amount=amount,
        transaction_type= transaction_type,
        status="pending"
    )
    db.session.add(txn)
    db.session.commit()

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
        "CallBackURL": "https://7f40-41-90-172-220.ngrok-free.app/mpesa/callback",
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
      # 3️⃣ Save CheckoutRequestID sent by Safaricom to DB
     
      # ✅ Define resp_json safely
    try:
        resp_json = response.json()
    except Exception:
        resp_json = {"error": "Failed to parse Safaricom response"}
         
    checkout_id = resp_json.get("CheckoutRequestID")
    if checkout_id:
        txn.checkout_request_id = checkout_id
        db.session.commit()
    print(response.text.encode('utf8'))
    
    return checkout_id
     # Return only what frontend needs
    # return jsonify({"CheckoutRequestID": checkout_id}), 200
    # return response.json()



@app.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():
    data = request.get_json(force=True)
    print("⚡ MPESA Callback Received:", data)

    stk_callback = data.get("Body", {}).get("stkCallback", {})
    checkout_id = stk_callback.get("CheckoutRequestID")
    result_desc = stk_callback.get("ResultDesc")
    result_code = stk_callback.get("ResultCode")

    if not checkout_id:
        print("⚠️ No CheckoutRequestID in callback")
        return jsonify({"ResultCode": 0, "ResultDesc": "OK"})

    # 1️⃣ Get the transaction
    txn = MpesaTransaction.query.filter_by(checkout_request_id=checkout_id).first()
    if not txn:
        print("⚠️ Transaction not found for CheckoutRequestID:", checkout_id)
        return jsonify({"ResultCode": 0, "ResultDesc": "OK"})

    # 2️⃣ Process based on result
    if result_code == 0:
        # Payment success
        metadata_items = stk_callback.get("CallbackMetadata", {}).get("Item", [])

        txn.amount = next((i["Value"] for i in metadata_items if i["Name"] == "Amount"), txn.amount)
        txn.receipt = next((i["Value"] for i in metadata_items if i["Name"] == "MpesaReceiptNumber"), txn.receipt)
        txn.phone = next((i["Value"] for i in metadata_items if i["Name"] == "PhoneNumber"), txn.phone)
        txn.status = "success"

        # ✅ Ensure transaction_type is correctly set
        if not txn.transaction_type:  # fix if empty
            txn.transaction_type = txn.transaction_type or "shares_contribution"  # default if needed

        db.session.commit()
        print(f"✅ Payment success: {txn.receipt}, Type: {txn.transaction_type}")

        # 3️⃣ Handle different transaction types
        member = Member.query.filter_by(phone=txn.phone).first()
        if not member:
            print(f"⚠️ Member not found for phone {txn.phone}")
        else:
            # Shares contribution → create Contribution record
            if txn.transaction_type == "shares_contribution":
                contribution = Contribution(
                    memberId=member.id,
                    memberName=member.name,
                    month=datetime.now().strftime("%Y-%m"),
                    amount=txn.amount,
                    date=datetime.today().strftime('%d/%m/%Y')
                )
                db.session.add(contribution)
                db.session.commit()
                print(f"✅ Contribution recorded: {contribution.id}")

            # Future: other txn types like registration_fee, loan_repayment etc.
            elif txn.transaction_type == "registration_fee":
                 handle_registration_fee(txn, member)

    else:
        # Payment failed
        txn.status = "failed"
        db.session.commit()
        print(f"❌ Payment failed: {result_desc}")

    return jsonify({"ResultCode": 0, "ResultDesc": "Callback received successfully"})


@app.route("/payment_status")
@cross_origin()
def payment_status():
    reference = request.args.get("checkout_request_id")  # ← match what frontend sends
    print("Checking payment status for:", reference)
    txn = MpesaTransaction.query.filter_by(checkout_request_id=reference).first()

    if not txn:
        return jsonify({"status": "pending"})

    return jsonify({"status": txn.status})

# def initiate_mcash():
#     data = request.get_json()

    
#     mcash = MCashRecords(
#         member_id=data["reference"],
#         month=data["month"],
#         code=data["code"],
#         received_amount = data["amount"],
#         phone= data["phone_number"],
#         loanno= data["LoanNo"], 
#         installment=data["installment"]             
#     )

#     db.session.add(mcash)
#     db.session.commit()

#     return jsonify({
#         "member_id": mcash.member_id,
#         "month": mcash.month,
#         "code": mcash.code,
#         "amount_received": mcash.received_amount,
#         "phone": mcash.phone,
#         "loanno": mcash.loanno,
#     }), 201

