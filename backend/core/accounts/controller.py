from flask import Flask, request, jsonify
from core import bcrypt,db
from .models import User
from flask_jwt_extended import create_access_token
import datetime 


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

    access_token = create_access_token(
        identity={"phone": user.phone, "role": user.role, "name": user.name},
        expires_delta=datetime.timedelta(hours=8),
    )

    return jsonify({"access_token": access_token,
            "user": {
            "phone": user.phone,
            "name": user.name,
            "role": user.role
        }}), 200


