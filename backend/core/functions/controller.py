
from flask import Blueprint, jsonify, request,abort
from .models import CreditStatusEnum, db, ChamaSettings,Member,Contribution,Credit,CreditRepayment,VendorLedger,Vendor,RepaymentSchedule,CreditTransaction,TransactionType,DailyLoansInterestBuffer
from datetime import datetime,timedelta
from datetime import date
import calendar
import requests
from .sms import send_sms_to_mobile
from app import app
from dateutil.relativedelta import relativedelta
import math
from sqlalchemy import func, case
from .utils import get_days_in_year, get_principal_balance_as_at



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
    settings.penalty_rate = data.get("loanpenalty", settings.penalty_rate)

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


def get_contributions_monthly():
    month = request.args.get("month")  # e.g., "2026-01"
   
    if month:
        contributions = Contribution.query.filter(Contribution.month == month).all()
    else:
        print('hhhh')
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
        insurance_fee = calculate_insurance_fee(data["installments"],data["amountRequested"]),
    )

    db.session.add(credit)
    db.session.commit()

    return jsonify(credit.to_dict()), 201




def update_credit_status(loan_id):
    credit = Credit.query.filter_by(loan_id=loan_id).first_or_404()
    data = request.json

   

    if credit.status == CreditStatusEnum.Completed:
        return jsonify({"error": "Completed loans cannot be edited"}), 400

    # ✅ Handle status change (loan disbursement)
    if "status" in data:
        new_status = CreditStatusEnum(data["status"])

        

        # Detect disbursement moment
        if credit.status == CreditStatusEnum.Pending:
            txn = CreditTransaction(
                loan_id=loan_id,
                transaction_type=TransactionType.LOAN,
                amount=CreditTransaction.normalize_amount(
                    TransactionType.LOAN,
                    credit.amount_requested
                )
            )
            db.session.add(txn)

            print(txn)

        credit.status = CreditStatusEnum.Active

    # ✅ Handle repayment
    if "amountPaid" in data:
        amount = float(data["amountPaid"])

        txn = CreditTransaction(
            loan_id=loan_id,
            transaction_type=TransactionType.REPAYMENT,
            amount=normalize_amount(
                TransactionType.REPAYMENT,
                amount
            )
        )
        db.session.add(txn)

    db.session.commit()

    # ✅ Auto-close loan if fully paid
    # if credit.outstanding_balance >= 0:
    #     credit.status = CreditStatusEnum.Completed
    #     db.session.commit()

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

def get_repayment_schedule():
    repayments = CreditRepayment.query.all()
    return jsonify([r.to_dict() for r in repayments])

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


def calculate_insurance_fee(installments, amount_requested):
    return (installments * amount_requested) * 0.01

def get_schedule(loan_id):
    loan = Credit.query.filter_by(loan_id=loan_id).first()
    if not loan:
        return jsonify({"error": "Loan not found"}), 404

    repayments = CreditRepayment.query.filter_by(loan_id=loan_id).order_by(CreditRepayment.installment_number).all()
    schedule = [r.to_dict() for r in repayments]

    return jsonify({
        "loan": {
            "loan_id": loan.loan_id,
            "amount_paid": loan.amount_paid,
            "remaining_balance": loan.remaining_balance,
            "status": loan.status.value,
        },
        "schedule": schedule
    }), 200



def generate_schedule(loan_id):
    credit = Credit.query.filter_by(loan_id=loan_id).first_or_404()

    # Lock check
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
    Interest is paid first, then principal.
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
            continue  # skip already fully paid installments

        # Amount being paid
        paid_amount = float(item.get("amount", repayment.total))
        remaining_payment = paid_amount

        # =========================
        # 1️⃣ PAY INTEREST FIRST
        # =========================
        interest_due = max(
            0,
            (repayment.interest or 0) - (repayment.interest_paid or 0)
        )
        interest_payment = min(remaining_payment, interest_due)

        repayment.interest_paid = (repayment.interest_paid or 0) + interest_payment
        credit.paid_interest = (credit.paid_interest or 0) + interest_payment 
        remaining_payment -= interest_payment

        # =========================
        # 2️⃣ PAY PRINCIPAL
        # =========================
        principal_due = max(
            0,
            (repayment.principal or 0) - (repayment.principal_paid or 0)
        )
        principal_payment = min(remaining_payment, principal_due)

        repayment.principal_paid = (repayment.principal_paid or 0) + principal_payment
        remaining_payment -= principal_payment

        # =========================
        # 3️⃣ UPDATE TOTAL PAID
        # =========================
        repayment.amount_paid = (
            (repayment.interest_paid or 0) +
            (repayment.principal_paid or 0)
        )

        # =========================
        # 4️⃣ MARK INSTALLMENT PAID
        # =========================
        if (
            repayment.interest_paid >= (repayment.interest or 0) and
            repayment.principal_paid >= (repayment.principal or 0)
        ):
            repayment.paid = True
            repayment.paid_at = date.today()

        # =========================
        # 5️⃣ UPDATE CREDIT TOTALS
        # =========================
        credit.amount_paid += paid_amount

        if credit.amount_paid >= credit.total_payable:
            credit.status = CreditStatusEnum.Completed

        response_repayments.append({
            "id": repayment.id,
            "installment_number": repayment.installment_number,
            "loan_id": repayment.loan_id,
            "paid": repayment.paid,
            "paid_at": repayment.paid_at.isoformat() if repayment.paid_at else None,
            "amount_paid": repayment.amount_paid
        })

    db.session.commit()

    return jsonify({
        "message": "Repayments updated successfully",
        "repayments": response_repayments,
        "loan": {
            "loan_id": credit.loan_id,
            "status": credit.status.value,
            "amount_paid": credit.amount_paid,
            "remaining_balance": credit.remaining_balance,
        } if response_repayments else {}
    }), 200
    
def get_penalty_rate():
    settings = ChamaSettings.query.first()
    return float(settings.penalty_rate) if settings and settings.penalty_rate else 0.0


def apply_penalty_if_overdue(r):
    if r.paid:
        return

    if date.today() <= r.due_date:
        return

    if r.penalty_applied_at:
        return

    penalty_rate = get_penalty_rate()

    if penalty_rate <= 0:
        return

    # penalty_rate is a percentage (e.g. 2 means 2%)
    r.penalty = round(r.total * (penalty_rate / 100), 2)
    r.penalty_applied_at = date.today()


def mark_paid(loan_id, installment_number):
    data = request.get_json() or {}
    amount_to_pay = data.get("amount", 0)

    if amount_to_pay <= 0:
        return jsonify({"error": "Enter a valid payment amount"}), 400

    credit = Credit.query.filter_by(loan_id=loan_id).first_or_404()

    # Fetch all installments ordered
    all_repayments = (
        CreditRepayment.query
        .filter_by(loan_id=loan_id)
        .order_by(CreditRepayment.installment_number)
        .all()
    )

    extra_payment = amount_to_pay

    for r in all_repayments:
        apply_penalty_if_overdue(r)
        if extra_payment <= 0:
            break

        # Initialize fields safely
        r.interest_paid = r.interest_paid or 0
        r.amount_paid = r.amount_paid or 0
        
        # ---- PAY PENALTY FIRST ----
        remaining_penalty = (r.penalty or 0) - (r.penalty_paid or 0)
        if remaining_penalty > 0:
            penalty_payment = min(extra_payment, remaining_penalty)
            r.penalty_paid = (r.penalty_paid or 0) + penalty_payment
            r.amount_paid += penalty_payment
            extra_payment -= penalty_payment

        # ---- PAY INTEREST FIRST ----
        remaining_interest = r.interest - r.interest_paid
        if remaining_interest > 0:
            interest_payment = min(extra_payment, remaining_interest)
            r.interest_paid += interest_payment
            r.amount_paid += interest_payment
            extra_payment -= interest_payment

        if extra_payment <= 0:
            continue

        # ---- THEN PAY PRINCIPAL ----
        principal_total = r.total - r.interest
        principal_paid = r.amount_paid - r.interest_paid
        remaining_principal = principal_total - principal_paid

        if remaining_principal > 0:
            principal_payment = min(extra_payment, remaining_principal)
            r.amount_paid += principal_payment
            extra_payment -= principal_payment

        # ---- FINALIZE INSTALLMENT ----
        r.paid = r.amount_paid >= r.total
        if r.paid:
            r.paid_at = date.today()

    # ---- UPDATE CREDIT TOTALS ----
    credit.amount_paid = sum(r.amount_paid or 0 for r in all_repayments)
    
    # ---- UPDATE CREDIT TOTALS ----
    credit.amount_paid = sum(r.amount_paid or 0 for r in all_repayments)

    credit.paid_penalty = sum(
        r.penalty_paid or 0 for r in all_repayments
    )

    # Cap paid_interest to total interest
    credit.paid_interest = min(
        sum(r.interest_paid or 0 for r in all_repayments),
        sum(r.interest for r in all_repayments)
    )

    if credit.amount_paid >= credit.total_payable:
        credit.status = CreditStatusEnum.Completed
        
    

    db.session.commit()

    return jsonify({
        "message": "Payment applied successfully (interest prioritized)",
        "loan": {
            "loan_id": credit.loan_id,
            "amount_paid": credit.amount_paid,
            "paid_interest": credit.paid_interest,
            "remaining_balance": credit.remaining_balance,
            "status": credit.status.value
        },
        "repayments": [
            {
                "installment_number": r.installment_number,
                "interest_paid": r.interest_paid,
                "amount_paid": r.amount_paid,
                "total": r.total,
                "paid": r.paid,
                "paid_at": r.paid_at.isoformat() if r.paid_at else None
            } for r in all_repayments
        ]
    }), 200


    
def get_vendor_ledger():
    """
    Returns vendor ledger entries for a given month.
    Auto-creates entries if missing.
    Query param: month=YYYY-MM (optional, defaults to current month)
    """
    month_str = request.args.get("month")
    if month_str:
        year, month = map(int, month_str.split("-"))
        first_day = date(year, month, 1)
    else:
        today = date.today()
        first_day = date(today.year, today.month, 1)

    # Count total members once
    total_members = Member.query.count()

    # Get all vendors
    vendors = Vendor.query.all()

    # Check and create missing ledger entries
    for vendor in vendors:
        existing = VendorLedger.query.filter_by(
            vendor_id=vendor.id, month=first_day
        ).first()
        if not existing:
            # expected = vendor.default_monthly_amount * total members
            expected = (vendor.default_monthly_amount or 0) * total_members
            ledger = VendorLedger(
                vendor_id=vendor.id,
                month=first_day,
                expected_amount=expected,
                amount_received=0,
                outstanding_amount=expected
            )
            db.session.add(ledger)

    db.session.commit()

    # Fetch entries for this month
    entries = VendorLedger.query.filter_by(month=first_day).all()

    return jsonify([
        {
            "id": e.id,
            "vendor_id": e.vendor_id,
            "month": e.month.isoformat(),
            "expected_amount": e.expected_amount,
            "amount_received": e.amount_received,
            "outstanding_amount": e.outstanding_amount
        } for e in entries
    ])


# vendors
def receive_vendor_payment(id):
    data = request.get_json() or {}
    amount = data.get("amount")

    if amount is None or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    ledger = VendorLedger.query.get(id)
    if not ledger:
        return jsonify({"error": "Ledger entry not found"}), 404

    # Update ledger
    ledger.received_amount += amount
    ledger.outstanding_amount = max(ledger.expected_amount - ledger.received_amount, 0)
    db.session.commit()

    # Get vendor phone
    vendor = ledger.vendor

    if vendor and vendor.phone:
        message = (
            f"Payment of KES {amount} received from {vendor.name} "
            f"for {ledger.month.strftime('%B %Y')}.\n"
            f"Outstanding: KES {ledger.outstanding_amount}"
        )
        send_sms_to_mobile(vendor.phone, message)  # direct call, no HTTP request
       

    return jsonify({
        "id": ledger.id,
        "vendor_id": ledger.vendor_id,
        "month": ledger.month.isoformat(),
        "expected_amount": ledger.expected_amount,
        "received_amount": ledger.received_amount,
        "outstanding_amount": ledger.outstanding_amount
    }), 200


# def receive_vendor_payment(id):
#     """
#     Mark an amount as received for a vendor ledger entry
#     Request JSON:
#     {
#         "amount": 100
#     }
#     """
#     data = request.get_json() or {}
#     amount = data.get("amount")

#     if amount is None or amount <= 0:
#         return jsonify({"error": "Invalid amount"}), 400

#     ledger = VendorLedger.query.get(id)
#     if not ledger:
#         return jsonify({"error": "Ledger entry not found"}), 404

#     # Calculate new received and outstanding amounts
#     ledger.received_amount += amount
#     ledger.outstanding_amount = max(ledger.expected_amount - ledger.received_amount, 0)

#     db.session.commit()

#     return jsonify({
#         "id": ledger.id,
#         "vendor_id": ledger.vendor_id,
#         "month": ledger.month.isoformat(),
#         "expected_amount": ledger.expected_amount,
#         "received_amount": ledger.received_amount,
#         "outstanding_amount": ledger.outstanding_amount
#     }), 200
    
def get_vendors():
    vendors = Vendor.query.order_by(Vendor.name.asc()).all()

    result = [
        {
            "id": v.id,
            "vendor_id": v.vendor_id,
            "name": v.name,
            "phone":v.phone,
            "default_monthly_amount": v.default_monthly_amount
        }
        for v in vendors
    ]

    return jsonify(result), 200


def create_vendor():
    data = request.get_json()

    if not data or not data.get("vendor_id") or not data.get("name"):
        return jsonify({"error": "vendor_id and name are required"}), 400

    if Vendor.query.filter_by(vendor_id=data["vendor_id"]).first():
        return jsonify({"error": "Vendor ID already exists"}), 409

    vendor = Vendor(
        vendor_id=data["vendor_id"],
        name=data["name"],
        phone=data["phone"],
        default_monthly_amount=data.get("default_monthly_amount", 0)
    )

    db.session.add(vendor)
    db.session.commit()

    return jsonify({
        "id": vendor.id,
        "vendor_id": vendor.vendor_id,
        "name": vendor.name,
        "default_monthly_amount": vendor.default_monthly_amount
    }), 201
    

def update_vendor(id):
    vendor = Vendor.query.get_or_404(id)
    data = request.get_json()

    if "vendor_id" in data:
        existing = Vendor.query.filter_by(vendor_id=data["vendor_id"]).first()
        if existing and existing.id != vendor.id:
            return jsonify({"error": "Vendor ID already exists"}), 409
        vendor.vendor_id = data["vendor_id"]

    if "name" in data:
        vendor.name = data["name"]
        
    if "phone" in data:
       vendor.phone = data["phone"]

    if "default_monthly_amount" in data:
        vendor.default_monthly_amount = data["default_monthly_amount"]

    db.session.commit()

    return jsonify({
        "id": vendor.id,
        "vendor_id": vendor.vendor_id,
        "name": vendor.name,
        "phone": vendor.phone,
        "default_monthly_amount": vendor.default_monthly_amount
    }), 200


def delete_vendor(id):
    vendor = Vendor.query.get_or_404(id)

    db.session.delete(vendor)
    db.session.commit()

    return jsonify({"message": "Vendor deleted successfully"}), 200

def send_sms():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    mobile = data.get("mobile")
    message = data.get("message")

    result = send_sms_to_mobile(mobile, message)
    return jsonify(result)

def member_lookup():
    members = Member.query.order_by(Member.name.asc()).all()
    return jsonify([m.to_dict() for m in members])

def get_contributions_each(member_id):
    contributions = Contribution.query.filter_by(memberId=member_id).all()
    return jsonify([c.to_dict() for c in contributions])


def new_generate_schedule():
    data = request.json

    principal = float(data["principal"])
    annual_rate = float(data["annual_rate"])
    months = int(data["months"])
    start_date = datetime.strptime(data["start_date"], "%Y-%m-%d")

    monthly_rate = annual_rate / 100 / 12

    # EMI Formula
    emi = (principal * monthly_rate) / (1 - math.pow(1 + monthly_rate, -months))
    emi = round(emi, 2)

    balance = principal
    schedule = []

    for month in range(1, months + 1):
        interest = round(balance * monthly_rate, 2)
        principal_paid = round(emi - interest, 2)

        # Adjust final payment
        if month == months:
            principal_paid = round(balance, 2)
            emi = round(principal_paid + interest, 2)

        closing_balance = round(balance - principal_paid, 2)

        payment_date = start_date + relativedelta(months=month)

        schedule.append({
            "month": month,
            "payment_date": payment_date.strftime("%Y-%m-%d"),
            "opening_balance": round(balance, 2),
            "interest": interest,
            "principal_paid": principal_paid,
            "emi": emi,
            "closing_balance": closing_balance
        })

        balance = closing_balance

    return jsonify({
        "emi": emi,
        "schedule": schedule
    })

def save_schedule(loan_id):
    loan = Credit.query.filter_by(loan_id=loan_id).first()

    if not loan:
        return jsonify({"error": "Loan not found"}), 404

    # Optional: clear existing schedule
    RepaymentSchedule.query.filter_by(loan_id=loan_id).delete()

    loan_data = {
        "amountRequested": loan.amount_requested,
        "interestRate": loan.interest_rate,
        "installments": loan.installments
    }

    schedule = generate_schedule(loan_data)

    for row in schedule:
        entry = RepaymentSchedule(
            loan_id=loan_id,
            installment_number=row["installment_number"],
            due_date=row["due_date"],
            principal=row["principal"],
            interest=row["interest"],
            total_payment=row["total_payment"],
            balance=row["balance"]
        )
        db.session.add(entry)

    db.session.commit()

    return jsonify({"message": "Schedule saved successfully"})

def generate_schedule(loan):
    if not isinstance(loan, dict):
        raise ValueError(f"Expected dict but got {type(loan)}")

    schedule = []  # ✅ FIX
    

    P = float(loan.get("amountRequested", 0))
    r = float(loan.get("interestRate", 0)) / 100 / 12
    n = int(loan.get("installments", 1))

    if r == 0:
        monthly_payment = P / n
    else:
        monthly_payment = (P * r) / (1 - (1 + r) ** -n)

    balance = P

    for i in range(1, n + 1):
        interest = balance * r
        principal = monthly_payment - interest
        balance -= principal

        schedule.append({
            "installment_number": i,
            "due_date": datetime.today().date() + timedelta(days=30 * i),
            "principal": round(principal, 2),
            "interest": round(interest, 2),
            "total_payment": round(monthly_payment, 2),
            "balance": round(balance if balance > 0 else 0, 2)
        })

    return schedule

def calculate_daily_interest_for_today():
    """
    Calculates daily interest for all active loans.
    Includes backfill for any missing days.
    Stores daily interest in DailyLoansInterestBuffer.
    """
    today = date.today()
    active_loans = Credit.query.filter_by(status=CreditStatusEnum.Active).all()

    for loan in active_loans:
        # 1️⃣ Determine start date for calculation
        last_record = DailyLoansInterestBuffer.query.filter_by(
            loan_id=loan.loan_id
        ).order_by(DailyLoansInterestBuffer.interest_date.desc()).first()

        start_date = last_record.interest_date + timedelta(days=1) if last_record else loan.created_at

        # 2️⃣ Loop through all missing days up to yesterday
        for n in range((today - start_date).days):
            single_date = start_date + timedelta(days=n)

            # Prevent duplicates just in case
            exists = DailyLoansInterestBuffer.query.filter_by(
                loan_id=loan.loan_id,
                interest_date=single_date
            ).first()
            if exists:
                continue

            # 3️⃣ Get outstanding balance as at previous day
            prev_date = single_date - timedelta(days=1)
            ob = get_principal_balance_as_at(loan.loan_id, prev_date)

            # 4️⃣ Calculate daily interest
            diy = get_days_in_year(single_date)
            interest_amount = round((ob * loan.interest_rate / 100) / diy, 2)

            # 5️⃣ Insert into DailyLoansInterestBuffer
            buffer_record = DailyLoansInterestBuffer(
                loan_id=loan.loan_id,
                interest_date=single_date,
                product_type=loan.interest_method,
                interest_amount=interest_amount,
                outstanding_balance=ob
            )
            db.session.add(buffer_record)

    db.session.commit()



# Monthly
def calculate_daily_interest_for_month(run_date: date):
    start_of_month = run_date.replace(day=1)
    end_of_month = run_date

    active_loans = Credit.query.filter_by(status=CreditStatusEnum.Active).all()

    for loan in active_loans:
        interest_rate = loan.interest_rate / 100  # convert % to decimal

        current_date = start_of_month

        while current_date <= end_of_month:

            # Skip if already calculated
            exists = DailyLoansInterestBuffer.query.filter_by(
                loan_id=loan.loan_id,
                interest_date=current_date
            ).first()

            if exists:
                current_date += timedelta(days=1)
                continue

            # Get yesterday's balance
            prev_date = current_date - timedelta(days=1)

            ob = get_principal_balance_as_at(loan.loan_id, prev_date)

            if ob <= 0:
                current_date += timedelta(days=1)
                continue

            diy = get_days_in_year(current_date)

            interest_amount = round((ob * interest_rate) / diy, 2)

            buffer = DailyLoansInterestBuffer(
                loan_id=loan.loan_id,
                interest_date=current_date,
                product_type=loan.interest_method,
                interest_amount=interest_amount,
                outstanding_balance=ob
            )

            db.session.add(buffer)

            current_date += timedelta(days=1)

    db.session.commit()



def post_monthly_interest(as_at_date=None):
    """
    Sums daily interest in DailyLoansInterestBuffer for the current month
    and posts a single INTEREST_DUE transaction per loan.
    """

    today = as_at_date or date.today()
    start_of_month = today.replace(day=1)

    results = db.session.query(
        DailyLoansInterestBuffer.loan_id,
        func.sum(DailyLoansInterestBuffer.interest_amount)
    ).filter(
        DailyLoansInterestBuffer.interest_date >= start_of_month,
        DailyLoansInterestBuffer.interest_date <= today
    ).group_by(
        DailyLoansInterestBuffer.loan_id
    ).all()

    for loan_id, total_interest in results:
        # Check if we already posted to avoid duplicates
        existing = CreditTransaction.query.filter_by(
            loan_id=loan_id,
            transaction_type="INTEREST_DUE",
            created_at=today
        ).first()
        if existing:
            continue

        transaction = CreditTransaction(
            loan_id=loan_id,
            transaction_type="INTEREST_DUE",
            amount=round(total_interest, 2)
        )
        db.session.add(transaction)

    db.session.commit()
    print(f"Posted INTEREST_DUE for {len(results)} loans as of {today}")



def post_repayment(loan_id: str, amount: float, repayment_date: date = None):
       
    repayment_date = repayment_date or date.today()
    loan = Credit.query.filter_by(loan_id=loan_id).first()
    if not loan:
        raise ValueError(f"Loan {loan_id} not found")

    remaining = amount

    # Helper to apply payment to a specific type
    def apply_payment(transaction_type, outstanding):
        nonlocal remaining
        pay = min(outstanding, remaining)
        if pay > 0:
            transaction = CreditTransaction(
                loan_id=loan_id,
                transaction_type=transaction_type,
                amount=-pay,  # repayment is negative in your normalize_amount
                created_at=repayment_date
            )
            db.session.add(transaction)
            remaining -= pay
        return remaining

    # 1️ Pay Interest first
    remaining = apply_payment(TransactionType.INTEREST_DUE, loan.outstanding_interest)

    # 2️ Pay Penalty
    remaining = apply_payment(TransactionType.PENALTY_DUE, loan.outstanding_penalty)

    # 3️ Pay Insurance
    remaining = apply_payment(TransactionType.INSURANCE_DUE, loan.outstanding_insurance)

    # 4️ Remaining reduces principal
    remaining = apply_payment(TransactionType.REPAYMENT, loan.outstanding_balance)

    db.session.commit()

    print(f"Repayment of {amount} applied to loan {loan_id}. Remaining unapplied: {remaining}")
    return remaining

def add_repayment():
    data = request.json
    loan_id = data.get("loanId")
    amount = data.get("amount")
    repayment_date = data.get("date")
    if repayment_date:
        repayment_date = date.fromisoformat(repayment_date)
    try:
        remaining = post_repayment(loan_id, amount, repayment_date)
        return jsonify({
            "loanId": loan_id,
            "amount": amount,
            "remainingUnapplied": remaining,
            "date": repayment_date.isoformat()
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    

def get_active_loans():
    member_id = request.args.get("member_id")  # optional, filter by member
    query = Credit.query.filter(Credit.status == "Active")  # or CreditStatusEnum.Active
    if member_id:
        query = query.filter(Credit.member_id == member_id)

    loans = query.all()
    loans_list = [
        {
            "loanId": l.loan_id,
            "memberId": l.member_id,
            "memberName": l.member.name if l.member else "",
            "totalOutstanding": l.total_outstanding,
        }
        for l in loans
    ]
    return jsonify(loans_list)