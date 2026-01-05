
from flask import Blueprint, jsonify, request,abort
from .models import CreditStatusEnum, db, ChamaSettings,Member,Contribution,Credit,CreditRepayment
from datetime import datetime
from datetime import date
import calendar






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


def update_credit_status(loan_id):
    credit = Credit.query.filter_by(loan_id=loan_id).first_or_404()
    data = request.json

    if credit.status == CreditStatusEnum.Completed:
        return jsonify({"error": "Completed loans cannot be edited"}), 400

    if "status" in data:
        credit.status = CreditStatusEnum(data["status"])

    if "amountPaid" in data:
        credit.amount_paid = float(data["amountPaid"])

        if credit.remaining_balance == 0:
            credit.status = CreditStatusEnum.Completed

    db.session.commit()
    return jsonify(credit.to_dict())

def get_credit(loan_id):
    credit = Credit.query.filter_by(loan_id=loan_id).first()

    if not credit:
        return jsonify({"error": "Loan not found"}), 404

    return jsonify(credit.to_dict())


# Repayment Schedule

# =========================
# Helper functions
# =========================

def last_day_of_current_month(d):
    last_day = calendar.monthrange(d.year, d.month)[1]
    return date(d.year, d.month, last_day)

def last_day_of_month(year, month):
    return calendar.monthrange(year, month)[1]


def last_day_of_next_month(d):
    if d.month == 12:
        year, month = d.year + 1, 1
    else:
        year, month = d.year, d.month + 1

    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, last_day)


def add_months(d, months):
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


# =========================
# Generate Repayment Schedule
# =========================
def get_schedule(loanId):
    # Make sure the credit exists
    credit = Credit.query.filter_by(loan_id=loanId).first_or_404()

    # Fetch all repayments for this loan
    repayments = CreditRepayment.query.filter_by(loan_id=loanId).order_by(CreditRepayment.installment_number).all()

    # Convert them to dictionaries for frontend
    schedule_list = []
    for item in repayments:
        schedule_list.append({
            "installment_number": item.installment_number,
            "due_date": item.due_date.isoformat(),
            "principal": float(item.principal),
            "interest": float(item.interest),
            "total": float(item.total),
            "remaining_balance": float(item.remaining_balance),
            "paid": item.paid,
        })

    return jsonify({"schedule": schedule_list})



def generate_schedule(loan_id):
    credit = Credit.query.filter_by(loan_id=loan_id).first_or_404()

    # 🔒 Lock check
    if credit.schedule_generated:
        return jsonify({"error": "Schedule already generated"}), 403

    data = request.get_json() or {}
    calc_method = data.get("method", "Amortized")  # "Amortized" | "Straight"

    today = date.today()
    start_month = today.month - 1  # JS months are 0-based
    start_year = today.year

    # =========================
    # Same 15th rule as JS
    # =========================
    if today.day > 15:
        start_month += 1
        if start_month > 11:
            start_month = 0
            start_year += 1

    installments = credit.installments
    principal_per_installment = credit.amount_requested / installments
    remaining_balance = credit.amount_requested

    monthly_rate = credit.interest_rate / 100 / 12
    interest_per_installment = (
        credit.interest_amount / installments
        if calc_method.lower() == "straight"
        else 0
    )

    schedule = []

    # =========================
    # MAIN LOOP (EXACT JS PORT)
    # =========================
    for i in range(1, installments + 1):

        # Interest calculation
        if calc_method.lower() == "amortized":
            interest = remaining_balance * monthly_rate
        else:  # straight line
            interest = interest_per_installment

        installment_amount = principal_per_installment + interest
        remaining_balance -= principal_per_installment

        # Installment date (end of month)
        installment_month = start_month + i - 1
        installment_year = start_year

        if installment_month > 11:
            installment_year += installment_month // 12
            installment_month = installment_month % 12

        last_day = last_day_of_month(
            installment_year, installment_month + 1
        )

        due_date = date(
            installment_year,
            installment_month + 1,
            last_day
        )

        repayment = CreditRepayment(
            loan_id=credit.loan_id,
            installment_number=i,
            due_date=due_date,
            principal=round(principal_per_installment),
            interest=round(interest),
            total=round(installment_amount),
            remaining_balance=round(
                remaining_balance if remaining_balance > 0 else 0
            ),
        )

        db.session.add(repayment)

        schedule.append({
            "installmentNumber": i,
            "date": due_date.isoformat(),
            "principal": round(principal_per_installment),
            "interest": round(interest),
            "total": round(installment_amount),
            "remainingBalance": round(
                remaining_balance if remaining_balance > 0 else 0
            ),
            "paid": False
        })

    # 🔒 Lock loan
    credit.schedule_generated = True
    db.session.commit()

    return jsonify({
        "message": "Repayment schedule generated",
        "schedule": schedule
    }), 201
    
def pay_repayments():
    """
    Marks one or multiple repayments as paid (supports partial payments).
    Request JSON:
    {
        "repayments": [
            {"id": 1, "amount": 5000},
            {"id": 2}  # defaults to full amount
        ]
    }
    """
    data = request.get_json() or {}
    repayments_list = data.get("repayments")
    if not repayments_list or not isinstance(repayments_list, list):
        return jsonify({"error": "repayments must be a non-empty list"}), 400

    response_repayments = []

    for item in repayments_list:
        repayment_id = item.get("id")
        if not repayment_id:
            continue

        repayment = CreditRepayment.query.get(repayment_id)
        if not repayment:
            continue

        credit = Credit.query.get(repayment.loan_id)
        if not credit:
            continue

        if repayment.paid:
            # Skip already paid installments
            continue

        # Determine amount to mark as paid
        paid_amount = item.get("amount", repayment.total)

        # 1️⃣ Mark repayment
        repayment.paid = True
        repayment.paid_at = date.today()
        repayment.amount_paid = paid_amount

        # 2️⃣ Update loan totals
        credit.amount_paid += paid_amount
        credit.remaining_balance = credit.total_payable - credit.amount_paid

        # 3️⃣ Update loan status if fully paid
        if credit.remaining_balance <= 0:
            credit.remaining_balance = 0
            credit.status = CreditStatusEnum.Completed

        response_repayments.append({
            "id": repayment.id,
            "installment_number": repayment.installment_number,
            "loan_id": repayment.loan_id,
            "paid": repayment.paid,
            "paid_at": repayment.paid_at.isoformat(),
            "amount_paid": repayment.amount_paid
        })

    db.session.commit()

    return jsonify({
        "message": "Repayments updated successfully",
        "repayments": response_repayments,
        # Return loan info for the first repayment as reference
        "loan": {
            "loan_id": credit.loan_id,
            "status": credit.status.value,
            "amount_paid": credit.amount_paid,
            "remaining_balance": credit.remaining_balance,
        } if response_repayments else {}
    }), 200

def mark_paid(installment_number):
    # Find the repayment by its installment_number
    repayment = CreditRepayment.query.filter_by(installment_number=installment_number).first()
    if not repayment:
        return jsonify({"error": "Installment not found"}), 404

    if repayment.paid:
        return jsonify({"error": "Already paid"}), 400

    # Mark as paid
    repayment.paid = True
    repayment.paid_at = date.today()
    repayment.amount_paid = repayment.total  # full payment

    # Update parent loan
    credit = Credit.query.filter_by(loan_id=repayment.loan_id).first()
    if not credit:
        return jsonify({"error": "Loan not found"}), 404

    credit.amount_paid += repayment.total  # ✅ only update amount_paid

    # Update status if fully paid
    if credit.remaining_balance <= 0:
        credit.status = CreditStatusEnum.Completed

    db.session.commit()

    return jsonify({
        "message": "Installment marked as paid",
        "repayment": {
            "installment_number": repayment.installment_number,
            "loan_id": repayment.loan_id,
            "paid": repayment.paid,
            "paid_at": repayment.paid_at.isoformat(),
            "amount_paid": repayment.amount_paid
        },
        "loan": {
            "loan_id": credit.loan_id,
            "status": credit.status.value,
            "amount_paid": credit.amount_paid,
            "remaining_balance": credit.remaining_balance  # read-only property
        }
    }), 200









