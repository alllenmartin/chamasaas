from flask import Flask, request, jsonify
from core import bcrypt,db
from .models import User,OtpAttempt
from flask_jwt_extended import jwt_required, get_jwt_identity,create_access_token
from core.utils.auth import generate_access_token,send_sms
import random
import datetime
from datetime import datetime, timedelta 
otp_store = {}


def create_user():
    data = request.json
    name = data.get("name")
    phone = data.get("phone")
    password = data.get("password")
    role = data.get("role", "member")

    if not name or not phone or not password:
        return jsonify({"msg": "All fields are required"}), 400

    # Check if user exists
    if User.query.filter_by(phone=phone).first():
        return jsonify({"msg": "Phone number already registered"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(name=name, phone=phone, password=hashed_pw, role=role)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201




def login():
    data = request.json
    phone = data.get("phone")
    password = data.get("password")

    user = User.query.filter_by(phone=phone).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"msg": "Incorrect password"}), 401

  
    otp = str(random.randint(100000, 999999))
    user.otp = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    db.session.commit()

  
    message = f"Your OTP code is {otp}. It expires in 5 minutes. Do not share it."

    sms_response = send_sms(user.phone, message)

    # Optional: log response for debugging
    print("SMS Response:", sms_response)


    return jsonify({
        "msg": "OTP sent",
        "requires_otp": True
    }), 200



def verify_otp():
    data = request.json
    phone = data.get("phone")
    otp = str(data.get("otp")).strip()

    user = User.query.filter_by(phone=phone).first()
    ip_address = request.remote_addr

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # 🔒 1️⃣ CHECK FAILED ATTEMPTS FIRST
    failed_attempts = OtpAttempt.query.filter_by(
        phone=phone,
        success=False
    ).filter(
        OtpAttempt.created_at >= datetime.utcnow() - timedelta(minutes=10)
    ).count()

    if failed_attempts >= 5:
        return jsonify({
            "msg": "Too many failed attempts. Try again after 10 minutes."
        }), 429

    # 🔍 2️⃣ VERIFY OTP
    success = (
        user.otp
        and user.otp_expires_at
        and datetime.utcnow() <= user.otp_expires_at
        and user.otp == otp
    )

    # 🧾 3️⃣ LOG ATTEMPT (ALWAYS)
    attempt = OtpAttempt(
        phone=phone,
        otp_entered=otp,
        success=success,
        ip_address=ip_address,
    )
    db.session.add(attempt)
    db.session.commit()

 
    if not success:
        return jsonify({"msg": "Invalid or expired OTP"}), 401

    # ✅ 5️⃣ SUCCESS → CLEAR OTP
    user.otp = None
    user.otp_expires_at = None
    db.session.commit()

    access_token = generate_access_token(user)

    return jsonify({
        "access_token": access_token,
        "user": {
            "phone": user.phone,
            "name": user.name,
            "role": user.role
        }
    }), 200
    
    

@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()

    new_access_token = create_access_token(
        identity=identity,
        expires_delta=timedelta(minutes=5)
    )

    return jsonify({"access_token": new_access_token}), 200