
from flask import Blueprint, jsonify, request
from .models import db, ChamaSettings,Member,Contribution,Credit
from datetime import datetime
from datetime import date



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


# Contributions
def get_contributions():
    contributions = Contribution.query.all()
    return jsonify([c.to_dict() for c in contributions])

def add_contribution():
    data = request.json
    member = Member.query.get(data["memberId"])
    if not member:
        return jsonify({"error": "Member not found"}), 404

    contribution = Contribution(
        memberId=member.id,
        memberName=member.name,
        month=data["month"],
        amount=data["amount"],
        date=datetime.today().strftime('%d/%m/%Y')
    )
    db.session.add(contribution)
    db.session.commit()
    return jsonify(contribution.to_dict()), 201


# Credit
def credit_members():
    members = Member.query.all()

    results = []
    for m in members:
        total_contribution = db.session.query(
            db.func.coalesce(db.func.sum(Contribution.amount), 0)
        ).filter(Contribution.memberId == m.id).scalar()

        results.append({
            "id": m.id,
            "name": m.name,
            "registrationPaidAmount": m.registrationPaid,
            "totalContribution": total_contribution,
        })

    return jsonify(results), 200

# def get_credits():
#     credits = Credit.query.all()
#     return jsonify([c.to_dict() for c in credits]), 200
def get_credits():
    credits = (
        db.session.query(Credit, Member)
        .join(Member, Credit.member_id == Member.id)
        .order_by(Credit.created_at.desc())
        .all()
    )

    result = []
    for credit, member in credits:
        result.append({
            "loanId": credit.loan_id,
            "memberId": credit.member_id,
            "memberName": member.name,  # ✅ resolved here
            "amountRequested": credit.amount_requested,
            "interestRate": credit.interest_rate,
            "installments": credit.installments,
            "status": credit.status.value,  # ✅ Enum → string
            "createdAt": credit.created_at.isoformat(),
        })

    return jsonify(result), 200



def generate_loan_id():
    last_credit = Credit.query.order_by(Credit.id.desc()).first()

    if not last_credit:
        return "L001"

    last_number = int(last_credit.loan_id.replace("L", ""))
    return f"L{last_number + 1:03d}"


def request_credit():
    data = request.json
    loan_id = generate_loan_id()
    credit = Credit(
        loan_id=loan_id,
        member_id=data["memberId"],
        amount_requested=data["amountRequested"],
        interest_rate=data["interestRate"],
        installments=data["installments"],
    )

    db.session.add(credit)
    db.session.commit()

    return jsonify(credit.to_dict()), 201






