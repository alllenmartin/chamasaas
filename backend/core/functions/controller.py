
from flask import Blueprint, jsonify, request
from .models import db, ChamaSettings,Member
from datetime import datetime


def get_settings():
    settings = ChamaSettings.query.first()
    if not settings:
        settings = ChamaSettings()
        db.session.add(settings)
        db.session.commit()
    return jsonify(settings.to_dict()), 200


def update_settings():
    data = request.json
    settings = ChamaSettings.query.first()
    if not settings:
        settings = ChamaSettings()
        db.session.add(settings)

    settings.contribution_amount = data.get("contributionAmount", settings.contribution_amount)
    settings.registration_fee = data.get("registrationFee", settings.registration_fee)
    settings.frequency = data.get("frequency", settings.frequency)
    settings.cut_off_day = data.get("cutOffDay", settings.cut_off_day)
    settings.organization_type = data.get("organizationType", settings.organization_type)
    settings.notifications_enabled = data.get("notificationsEnabled", settings.notifications_enabled)
    notification_date = data.get("notificationDate")
    if notification_date:
        settings.notification_date = datetime.fromisoformat(notification_date).date()
    settings.credit_multiplier = data.get("creditMultiplier", settings.credit_multiplier)
    settings.interest_rate = data.get("interestRate", settings.interest_rate)
    settings.installments = data.get("installments", settings.installments)

    db.session.commit()
    return jsonify(settings.to_dict()), 200


# Add Members
def get_members():
    members = Member.query.all()
    return jsonify([m.to_dict() for m in members]), 200

def add_member():
    data = request.get_json()
    if Member.query.get(data['id']):
        return jsonify({"error": "Member with this ID already exists"}), 400
    member = Member(
        id=data["id"],
        name=data["name"],
        phone=data["phone"],
        role=data.get("role", "Member"),
        amountPaid=data.get("amountPaid", 0),
        status=data.get("status", "Unpaid"),
        registrationPaid=data.get("registrationPaid", False),
    )
    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201


def update_member(member_id):
    data = request.get_json()
    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    member.name = data["name"]
    member.phone = data["phone"]
    member.role = data.get("role", member.role)
    member.amountPaid = data.get("amountPaid", member.amountPaid)
    member.status = data.get("status", member.status)
    member.registrationPaid = data.get("registrationPaid", member.registrationPaid)
    db.session.commit()
    return jsonify(member.to_dict()), 200

def delete_member(member_id):
    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member deleted"}), 200




