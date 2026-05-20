
from flask import Blueprint, jsonify, request,abort
from .product_factory import build_config
from .models import CreditStatusEnum,AccountType,LedgerEntry, LoanProduct,db,Account, ChamaSettings,Member,Contribution,Credit,CreditRepayment,VendorLedger,Vendor,RepaymentSchedule,CreditTransaction,TransactionType,DailyLoansInterestBuffer,Beneficiary,Collateral,Guarantor
from datetime import datetime,timedelta
from datetime import date
import calendar
import requests
from .sms import send_sms_to_mobile
from app import app
from dateutil.relativedelta import relativedelta
import math
from sqlalchemy import func, case
from .utils import get_days_in_year, get_principal_balance_as_at,generate_member_id, money
from sqlalchemy.exc import IntegrityError



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
    print(data)
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
    settings.registration_acc = data.get("registrationFeeAcc", settings.registration_acc)

    db.session.commit()
    return jsonify(settings.to_dict()), 200


# Add Members
def get_members():
    members = Member.query.all()
    return jsonify([m.to_dict() for m in members]), 200



def create_member():

    data = request.json

    member_id = generate_member_id()

    member = Member(
        member_id=member_id,

        first_name=data.get("firstName"),
        second_name=data.get("secondName"),
        last_name=data.get("lastName"),

        national_id=data.get("nationalId"),

        gender=data.get("gender"),

        dob=date.fromisoformat(data["dob"]) if data.get("dob") else None,

        nationality=data.get("nationality"),
        county=data.get("county"),
        sub_county=data.get("subCounty"),

        phone=data.get("phone"),
        email=data.get("email"),
        address=data.get("address"),

        role=data.get("role"),

        bank_name=data.get("bankName"),
        branch_name=data.get("branchName"),
        account_number=data.get("accountNumber"),

        employment=data.get("employment"),
        employer=data.get("employer"),
        department=data.get("department"),
        terms_of_employment=data.get("termsOfEmployment"),

        business_type=data.get("businessType"),
        business_name=data.get("businessName"),
        business_location=data.get("businessLocation"),
        landmark=data.get("landmark"),

        status=data.get("status", "Draft")
    )

    db.session.add(member)
    db.session.flush()

    beneficiaries = data.get("beneficiaries", [])

    for b in beneficiaries:

        beneficiary = Beneficiary(
            member_id=member_id,
            name=b.get("name"),
            phone=b.get("phone"),
            relation=b.get("relation"),
            share=b.get("share"),
            id_number=b.get("idNumber"),
            address=b.get("address"),
            guardian=b.get("guardian"),
        )

        db.session.add(beneficiary)

    db.session.commit()

    return jsonify({
        "message": "Member created successfully",
        "memberId": member.member_id
    }), 201



def update_member(member_id):

    member = Member.query.get_or_404(member_id)

    data = request.json

    member.first_name = data.get("firstName")
    member.second_name = data.get("secondName")
    member.last_name = data.get("lastName")

    member.national_id = data.get("nationalId")

    member.gender = data.get("gender")

    member.dob = (
        date.fromisoformat(data["dob"])
        if data.get("dob")
        else None
    )

    member.nationality = data.get("nationality")
    member.county = data.get("county")
    member.sub_county = data.get("subCounty")

    member.phone = data.get("phone")
    member.email = data.get("email")
    member.address = data.get("address")

    member.role = data.get("role")

    member.bank_name = data.get("bankName")
    member.branch_name = data.get("branchName")
    member.account_number = data.get("accountNumber")

    member.employment = data.get("employment")
    member.employer = data.get("employer")
    member.department = data.get("department")
    member.terms_of_employment = data.get("termsOfEmployment")

    member.business_type = data.get("businessType")
    member.business_name = data.get("businessName")
    member.business_location = data.get("businessLocation")
    member.landmark = data.get("landmark")

    member.status = data.get("status", member.status)

    # DELETE OLD BENEFICIARIES
    Beneficiary.query.filter_by(member_id=member_id).delete()

    # ADD NEW BENEFICIARIES
    beneficiaries = data.get("beneficiaries", [])

    for b in beneficiaries:

        beneficiary = Beneficiary(
            member_id=member_id,
            name=b.get("name"),
            phone=b.get("phone"),
            relation=b.get("relation"),
            share=b.get("share"),
            id_number=b.get("idNumber"),
            address=b.get("address"),
            guardian=b.get("guardian"),
        )

        db.session.add(beneficiary)

    db.session.commit()

    return jsonify({
        "message": "Member updated successfully",
        "memberId": member.member_id
    })

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

# def add_contribution():
#     data = request.json
#     member = Member.query.get(data["memberId"])
#     if not member:
#         return jsonify({"error": "Member not found"}), 404

#     contribution = Contribution(
#         memberId=member.member_id,
#         memberName=member.first_name,
#         month=data["month"],
#         amount=data["amount"],
#         date=datetime.today().strftime('%d/%m/%Y')
#     )
#     db.session.add(contribution)
#     db.session.commit()
#     return jsonify(contribution.to_dict()), 201

def add_contribution():
    data = request.json


    # ================= VALIDATION =================
    member = Member.query.get(data.get("memberId"))
    
    if not member:
        return jsonify({"error": "Member not found"}), 404

    if not data.get("amount"):
        return jsonify({"error": "Amount is required"}), 400

    if not data.get("date"):
        return jsonify({"error": "Date is required"}), 400

    # ================= FORMAT DATE =================
    try:
        input_date = datetime.strptime(data["date"], "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    month = input_date.strftime("%Y-%m")
    formatted_date = input_date.strftime("%m/%d/%Y").lstrip("0").replace("/0", "/")
 

    # ================= MEMBER NAME =================
    member_name = f"{member.first_name or ''} {member.second_name or ''} {member.last_name or ''}".strip()

    # ================= DOCUMENT NO =================
    document_no = f"CNTR-{int(datetime.utcnow().timestamp())}"

    # ================= AMOUNT =================
    amount = float(data["amount"])

    # ================= ACCOUNT MAPPING =================
    cash_account = Account.query.filter_by(name="Cash").first()
   

    if not cash_account:
        return jsonify({"error": "Cash account not configured"}), 400

    # Map savings product → GL
    savings_product = data.get("savingsProduct")
    print(savings_product)

    if savings_product == "DEP":
        target_account = Account.query.filter_by(name="Member Savings Control").first()
    elif savings_product == "SC":
        target_account = Account.query.filter_by(name="Share Capital Control").first()
    elif savings_product == "REG":
       settings = ChamaSettings.query.first()
       if not settings or not settings.registration_acc:
        return jsonify({
            "error": "Registration Fee Account not configured in settings"
        }), 400
       target_account = Account.query.filter_by(
        code=settings.registration_acc).first()

    else:
        return jsonify({"error": "Invalid savings product"}), 400

    if not target_account:
        return jsonify({"error": "Target account not configured"}), 400

    # ================= SAVE CONTRIBUTION =================
    contribution = Contribution(
        memberId=member.member_id,
        memberName=member_name,
        month=month,
        amount=money(amount),
        date=datetime.today().strftime('%d/%m/%Y'),
        savings_product=savings_product,
        # document_no=document_no
    )

    db.session.add(contribution)

    # ================= LEDGER ENTRIES =================
    # Debit Cash
    debit_entry = LedgerEntry(
        account_id=cash_account.id,
        account_code=cash_account.code,
        debit=money(amount),
        credit=0,
        description=f"{savings_product} contribution from {member_name}",
        document_no=document_no,
        transaction_date=input_date
    )

    # Credit Member Liability
    credit_entry = LedgerEntry(
        account_id=target_account.id,
        account_code=target_account.code,
        debit=0,
        credit=money(amount),
        description=f"{savings_product} contribution from {member_name}",
        document_no=document_no,
        transaction_date=input_date
    )

    db.session.add(debit_entry)
    db.session.add(credit_entry)
    
    # ================= AUTO REGISTRATION CHECK =================
    if savings_product == "REG":
        settings = ChamaSettings.query.first()
        registration_fee = settings.registration_fee if settings else 0

        total_paid = db.session.query(
            func.coalesce(func.sum(Contribution.amount), 0)
        ).filter(
            Contribution.memberId == member.member_id,
            Contribution.savings_product == "REG"
        ).scalar()

        if total_paid >= registration_fee:
            member.registration_paid = True

# ================= COMMIT =================

    # ================= COMMIT =================
    db.session.commit()

    return jsonify(contribution.to_dict()), 201


# Credit
def credit_members():
    members = Member.query.all()
    settings = ChamaSettings.query.first()
    required_fee = settings.registration_fee if settings else 0

    results = []

    for m in members:

        total_contribution = db.session.query(
            db.func.coalesce(db.func.sum(Contribution.amount), 0)
        ).filter(
            Contribution.memberId == m.member_id,
            Contribution.savings_product == "DEP"
        ).scalar()

        reg_paid = db.session.query(
            db.func.coalesce(db.func.sum(Contribution.amount), 0)
        ).filter(
            Contribution.memberId == m.member_id,
            Contribution.savings_product == "REG"
        ).scalar()

        results.append({
            "id": m.member_id,
            "name": f"{m.first_name or ''} {m.last_name or ''}".strip(),
            "nationalId": m.national_id,

            "registrationPaidAmount": float(reg_paid),
            "registrationPaid": reg_paid >= required_fee,

            "totalContribution": float(total_contribution or 0),
        })

    return jsonify(results), 200


def get_credits():
    credits = (
        db.session.query(Credit, Member)
        .join(Member, Credit.member_id == Member.member_id)
        .order_by(Credit.created_at.desc())
        .all()
    )

    result = []
    for credit, member in credits:
        result.append({
            "loanId": credit.loan_id,
            "memberId": credit.member_id,
            "memberName": member.first_name,  # ✅ resolved here
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
    
    # -------------------- Check Full Guarantee --------------------
    total_guaranteed = db.session.query(
        db.func.sum(Guarantor.amount_guaranteed)
    ).filter_by(loan_id=loan_id).scalar() or 0

    loan_amount = float(credit.amount_requested)

    if total_guaranteed < loan_amount:
        return jsonify({
            "error": f"Loan is not fully guaranteed ({total_guaranteed}/{loan_amount})"
        }), 400
    # ---------------------------------------------------------------

    # Handle status change (loan disbursement)
    if "status" in data:
        new_status = CreditStatusEnum(data["status"])

        

    # Detect disbursement moment
    if credit.status == CreditStatusEnum.Pending:
    
        loan_amount = float(credit.amount_requested)

        principal_account = Account.query.filter_by(name="Principal Loans Receivable").first()
        cash_account = Account.query.filter_by(name="Bank").first()

        # -------------------- DEBIT: Principal Receivable --------------------
        db.session.add(LedgerEntry(
            account_id=principal_account.id,
            account_code=principal_account.code,
            debit=money(loan_amount),
            credit=0,
            description=f"Loan disbursement - {credit.loan_id}",
            document_no=str(loan_id)
        ))

        # -------------------- CREDIT: Cash/Bank --------------------
        db.session.add(LedgerEntry(
            account_id=cash_account.id,
            account_code=cash_account.code,
            debit=0,
            credit=money(loan_amount),
            description=f"Loan disbursement - {credit.loan_id}",
            document_no=str(loan_id)
        ))

        # -------------------- Credit Transaction --------------------
        txn = CreditTransaction(
            loan_id=loan_id,
            transaction_type=TransactionType.LOAN,
            amount=CreditTransaction.normalize_amount(
                TransactionType.LOAN,
                credit.amount_requested
            )
        )

        db.session.add(txn)

        credit.status = CreditStatusEnum.Active

    # ✅ Handle repayment
    if "amountPaid" in data:
        amount = float(data["amountPaid"])

        txn = CreditTransaction(
            loan_id=loan_id,
            transaction_type=TransactionType.REPAYMENT,
            amount=CreditTransaction.normalize_amount(
                TransactionType.REPAYMENT,
                amount
            )
        )
        db.session.add(txn)

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
    members = Member.query.order_by(Member.first_name.asc()).all()
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
            print('Found',ob)


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
    
# Test
def run_monthly_interest_calculation():

    data = request.get_json()

    if not data or "run_date" not in data:
        return jsonify({"error": "run_date is required (YYYY-MM-DD)"}), 400

    try:
        run_date = datetime.strptime(data["run_date"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    print("Running monthly interest calculation for date:", run_date)
    calculate_daily_interest_for_month(run_date)

    return jsonify({
        "message": "Interest calculation completed",
        "run_date": str(run_date)
    }), 200
    
    
def run_post_monthly_interest():

    data = request.get_json()

    # Optional: allow passing date, otherwise use today
    if data and "as_at_date" in data:
        try:
            as_at_date = datetime.strptime(data["as_at_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    else:
        as_at_date = date.today()

    try:
        post_monthly_interest(as_at_date)

        return jsonify({
            "message": "Monthly interest posted successfully",
            "as_at_date": str(as_at_date)
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
        
# End Tesr



# def post_monthly_interest(as_at_date=None):

#     today = as_at_date or date.today()
#     start_of_month = today.replace(day=1)

#     results = db.session.query(
#         DailyLoansInterestBuffer.loan_id,
#         func.sum(DailyLoansInterestBuffer.interest_amount)
#     ).filter(
#         DailyLoansInterestBuffer.interest_date >= start_of_month,
#         DailyLoansInterestBuffer.interest_date <= today
#     ).group_by(
#         DailyLoansInterestBuffer.loan_id
#     ).all()

#     for loan_id, total_interest in results:
#         # Check if we already posted to avoid duplicates
#         existing = CreditTransaction.query.filter_by(
#             loan_id=loan_id,
#             transaction_type="INTEREST_DUE",
#             created_at=today
#         ).first()
#         if existing:
#             continue

#         transaction = CreditTransaction(
#             loan_id=loan_id,
#             transaction_type="INTEREST_DUE",
#             amount=round(total_interest, 2)
#         )
#         db.session.add(transaction)

#     db.session.commit()
#     print(f"Posted INTEREST_DUE for {len(results)} loans as of {today}")

def post_monthly_interest(as_at_date=None):

    today = as_at_date or date.today()
    start_of_month = today.replace(day=1)

    interest_receivable_account = Account.query.filter_by(name="Interest Receivable").first()
    interest_income_account = Account.query.filter_by(name="Loan Interest Income").first()

    if not interest_receivable_account or not interest_income_account:
        raise ValueError("Required accounts (Interest Receivable / Interest Income) not found")

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

        # Avoid duplicates
        existing = CreditTransaction.query.filter_by(
            loan_id=loan_id,
            transaction_type="INTEREST_DUE",
            created_at=today
        ).first()

        if existing:
            continue

        total_interest = round(total_interest or 0, 2)
        print(f"Posting interest for loan {loan_id}: {total_interest}")

        # ---------------- CREDIT TRANSACTION ----------------
        transaction = CreditTransaction(
            loan_id=loan_id,
            transaction_type="INTEREST_DUE",
            amount=total_interest,
            created_at=today
        )
        db.session.add(transaction)

        # ---------------- LEDGER POSTINGS ----------------

        # 1. Debit Interest Receivable (Asset increases)
        db.session.add(LedgerEntry(
            account_id=interest_receivable_account.id,
            account_code=interest_receivable_account.code,
            debit=total_interest,
            credit=0,
            description="Monthly interest accrued",
            document_no=str(loan_id)
        ))

        # 2. Credit Interest Income (Revenue increases)
        db.session.add(LedgerEntry(
            account_id=interest_income_account.id,
            account_code=interest_income_account.code,
            debit=0,
            credit=money(total_interest),
            description="Monthly interest income accrued",
            document_no=str(loan_id)
        ))

    db.session.commit()
    print(f"Posted INTEREST_DUE for {len(results)} loans as of {today}")





def post_repayment(loan_id: str, amount: float, repayment_date: date = None):
       
    repayment_date = repayment_date or date.today()
    loan = Credit.query.filter_by(loan_id=loan_id).first()
    if not loan:
        raise ValueError(f"Loan {loan_id} not found")

    remaining = amount

    cash_account = Account.query.filter_by(name="Cash").first()
    print(cash_account)
    principal_account = Account.query.filter_by(name="Principal Loans Receivable").first()

    interest_account = Account.query.filter_by(name="Loan Interest Income").first()
    penalty_account = Account.query.filter_by(name="Loan Interest Income").first()
    insurance_account = Account.query.filter_by(name="Loan Interest Income").first()

    def apply_payment(transaction_type, outstanding, income_account=None):
        nonlocal remaining
        pay = min(outstanding, remaining)

        if pay > 0:
            # ---------------- CREDIT TRANSACTION (existing logic) ----------------
            transaction = CreditTransaction(
                loan_id=loan_id,
                transaction_type=transaction_type,
                amount=-money(pay),
                created_at=repayment_date
            )
            db.session.add(transaction)

            # ---------------- LEDGER POSTING ----------------
            # 1. Cash increases (DEBIT)
            db.session.add(LedgerEntry(
                account_id=cash_account.id,
                account_code=cash_account.code,
                debit=money(pay),
                credit=0,
                description=f"Loan repayment - {transaction_type}",
                document_no=str(loan_id)
            ))

            # 2. Depending on type
            if transaction_type == TransactionType.REPAYMENT:
                # Principal reduction (CREDIT)
                db.session.add(LedgerEntry(
                    account_id=principal_account.id,
                    account_code=principal_account.code,
                    debit=0,
                    credit=money(pay),
                    description="Principal repayment",
                    document_no=str(loan_id)
                ))

            elif transaction_type == TransactionType.INTEREST_DUE:
                db.session.add(LedgerEntry(
                    account_id=interest_account.id,
                    account_code=interest_account.code,
                    debit=0,
                    credit=money(pay),
                    description="Interest income",
                    document_no=str(loan_id)
                ))

            elif transaction_type == TransactionType.PENALTY_DUE:
                db.session.add(LedgerEntry(
                    account_id=penalty_account.id,
                    account_code=penalty_account.code,
                    debit=0,
                    credit=money(pay),
                    description="Penalty income",
                    document_no=str(loan_id)
                ))

            elif transaction_type == TransactionType.INSURANCE_DUE:
                db.session.add(LedgerEntry(
                    account_id=insurance_account.id,
                    account_code=insurance_account.code,
                    debit=0,
                    credit=money(pay),
                    description="Insurance income",
                    document_no=str(loan_id)
                ))

            remaining -= money(pay)

        return remaining

    # 1️⃣ Interest
    remaining = apply_payment(TransactionType.INTEREST_DUE, loan.outstanding_interest)

    # 2️⃣ Penalty
    remaining = apply_payment(TransactionType.PENALTY_DUE, loan.outstanding_penalty)

    # 3️⃣ Insurance
    remaining = apply_payment(TransactionType.INSURANCE_DUE, loan.outstanding_insurance)

    # 4️⃣ Principal
    remaining = apply_payment(TransactionType.REPAYMENT, loan.outstanding_balance)

    db.session.commit()

    return remaining


# def add_repayment():
#     data = request.json
#     loan_id = data.get("loanId")
#     amount = data.get("amount")
#     repayment_date = data.get("date")
#     if repayment_date:
#         repayment_date = date.fromisoformat(repayment_date)

#     try:
#         remaining = post_repayment(loan_id, amount, repayment_date)

#         # If balance is 0, mark loan as Completed
#         if remaining == 0:
#             credit = Credit.query.filter_by(loan_id=loan_id).first()
#             if credit and credit.status != CreditStatusEnum.Completed:
#                 credit.status = CreditStatusEnum.Completed
#                 db.session.commit()   # or commit later if you reuse the session

#         return jsonify({
#             "loanId": loan_id,
#             "amount": amount,
#             "remainingUnapplied": remaining,
#             "date": repayment_date.isoformat()
#         })
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 400

def add_repayment():
    data = request.json
    loan_id = data.get("loanId")
    amount = data.get("amount")
    repayment_date = data.get("date")

    if repayment_date:
        repayment_date = date.fromisoformat(repayment_date)

    try:
        # 1. Process repayment allocation
        remaining = post_repayment(loan_id, amount, repayment_date)

        # 2. Get updated loan
        credit = Credit.query.filter_by(loan_id=loan_id).first()

        # 3. Calculate REAL outstanding balance
        total_outstanding = (
            (credit.outstanding_balance or 0) +
            (credit.outstanding_interest or 0) +
            (credit.outstanding_penalty or 0) +
            (credit.outstanding_insurance or 0)
        )

        # 4. Only close if truly cleared
        if round(total_outstanding, 2) <= 0:
            if credit.status != CreditStatusEnum.Completed:
                credit.status = CreditStatusEnum.Completed
                db.session.commit()

        return jsonify({
            "loanId": loan_id,
            "amount": amount,
            "remainingUnapplied": remaining,
            "date": repayment_date.isoformat() if repayment_date else None
        })

    except ValueError as e:
        print(e)
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
            "memberName": l.member.first_name if l.member else "",
            "totalOutstanding": l.total_outstanding,
        }
        for l in loans
    ]
    return jsonify(loans_list)


def save_collaterals():
    data = request.json
    loan_id = data.get('loanId')
    collaterals = data.get('collaterals', [])

    if not loan_id:
        return jsonify({"error": "loanId is required"}), 400

    for c in collaterals:

     
        if not c.get('type') or not c.get('description'):
            return jsonify({"error": "Type and description required"}), 400

        if float(c.get('value') or 0) <= 0:
            return jsonify({"error": "Invalid collateral value"}), 400

        new_c = Collateral(
            loan_id=loan_id,
            type=c.get('type'),
            description=c.get('description'),
            value=float(c.get('value') or 0),
            owner=c.get('owner')
        )

        db.session.add(new_c)

    db.session.commit()

    return jsonify({"message": "Collaterals saved successfully"}), 201





def save_guarantors():
    data = request.json
    loan_id = data.get('loanId')
    guarantors = data.get('guarantors', [])
    


    # If loanId is a dict, extract actual memberId or loan string
    if isinstance(loan_id, dict):
        loan_id = loan_id.get("memberId")  # adjust key to match your frontend
    else:
        loan_id = str(loan_id)

    # Fetch loan requested amount
    loan = Credit.query.filter_by(loan_id=loan_id).first()
    if not loan:
        return jsonify({"error": "Loan not found"}), 404

    loan_amount = float(loan.amount_requested)

    # Sum of amounts being saved for this loan
    total_new_guarantee = sum(float(g.get('amountGuaranteed', 0)) for g in guarantors)
    if total_new_guarantee > loan_amount:
        return jsonify({"error": "Total guaranteed exceeds loan requested amount"}), 400

    # Check each guarantor for available shares
    for g in guarantors:
        member_no = g.get('memberNumber')
        total_shares = float(g.get('totalShares', 0))
        new_amount = float(g.get('amountGuaranteed', 0))

        # Total already committed in other loans
        existing = db.session.query(func.sum(Guarantor.amount_guaranteed)).join(Credit, Guarantor.loan_id == Credit.loan_id).filter(
                Guarantor.member_number == member_no,
                Guarantor.loan_id != loan_id,  # exclude current loan
                Credit.status != CreditStatusEnum.Completed  # exclude completed loans
            ).scalar() or 0

        available = total_shares - existing
      
        if new_amount > available:
            return jsonify({
                "error": f"{member_no} exceeds available shares for guarantorship"
            }), 400
            
        existing_committed = db.session.query(db.func.sum(Guarantor.amount_guaranteed)).filter(Guarantor.member_number == member_no,
            Guarantor.loan_id != loan_id).scalar() or 0

        new_amount = float(g.get('amountGuaranteed', 0))

        committed_amount = existing_committed + new_amount
            
            
    

    # All checks passed, save guarantors
    for g in guarantors:
        new_g = Guarantor(
            loan_id=loan_id,
            member_number=g.get('memberNumber'),
            name=g.get('name'),
            amount_guaranteed=float(g.get('amountGuaranteed', 0)),
            total_shares=float(g.get('totalShares', 0)),
            committed_amount=committed_amount,
        )
        db.session.add(new_g)

    db.session.commit()
    return jsonify({"message": "Saved successfully"}), 201

def get_all_security(loan_id):
    if isinstance(loan_id, dict):
        loan_id = loan_id.get("memberId")
        
   
        
    loan = Credit.query.filter_by(loan_id=loan_id).first()
    
    if not loan:
     return jsonify({"error": "Loan not found"}), 404

    guarantors = Guarantor.query.filter_by(loan_id=loan.loan_id).all()
    collaterals = Collateral.query.filter_by(loan_id=loan.loan_id).all()

    return jsonify({
        "guarantors": [
            {
                "memberNumber": g.member_number,
                "name": g.name,
                "amountGuaranteed": g.amount_guaranteed,
                "totalShares": g.total_shares,
                "committedAmount": g.committed_amount,
                "availableForGuarantee":g.total_shares-g.committed_amount,
            }
            for g in guarantors
        ],
        "collaterals": [
            {
                "type": c.type,
                "description": c.description,
                "value": c.value,
                "owner": c.owner
            }
            for c in collaterals
        ]
    })


def security_status(loan_id):
    loan =  Credit.query.filter_by(loan_id=loan_id).first()

    guarantors = Guarantor.query.filter_by(loan_id=loan_id).all()
    collaterals = Collateral.query.filter_by(loan_id=loan_id).all()

    total_guaranteed = sum(g.amount_guaranteed for g in guarantors)
    total_collateral = sum(c.value for c in collaterals)

    total_security = total_guaranteed + total_collateral

    coverage = (total_security / loan.amount_requested) * 100 if loan.amount_requested else 0

    return jsonify({
        "loanAmount": loan.amount_requested,
        "totalGuaranteed": total_guaranteed,
        "totalCollateral": total_collateral,
        "totalSecurity": total_security,
        "coveragePercent": round(coverage, 2),
        "isFullySecured": total_security >= loan.amount_requested
    })



def current_member_commitment(member_id):
    # Get member
    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404

    # Calculate total savings from contributions table
    contributions = Contribution.query.filter_by(memberId=member_id).all()
    total_savings = sum([c.amount for c in contributions])

    # Get all loans where member is a guarantor
    guarantors = Guarantor.query.filter_by(member_number=member_id).all()

    total_commitment = 0
    for g in guarantors:
        loan =  Credit.query.filter_by(loan_id=g.loan_id).first()
        if not loan:
            continue

        total_guaranteed_for_loan = sum([x.amount_guaranteed for x in loan.guarantors])
        if total_guaranteed_for_loan > 0:
            committed = (g.amount_guaranteed / total_guaranteed_for_loan) * loan.outstanding_balance
            total_commitment += committed

    available_for_guarantee = max(total_savings - total_commitment, 0)

    return jsonify({
        "totalSavings": total_savings,
        "totalCommitment": total_commitment,
        "availableForGuarantee": available_for_guarantee
    })
    
# Chat of Accounts
def create_account():
    data = request.get_json()
    print(data)
    try:

        # Required fields
        if not data.get("code") or not data.get("name") or not data.get("type"):
            return jsonify({"error": "code, name, type are required"}), 400

        # Prevent duplicate codes
        existing = Account.query.filter_by(code=data["code"]).first()
        if existing:
            return jsonify({"error": "Account code already exists"}), 400

        # Validate account type
        print("TYPE RECEIVED:", data["type"])
        print("AVAILABLE:", list(AccountType))
        try:
            account_type = AccountType(data["type"])
        except ValueError:
            return jsonify({
                "error": f"Invalid account type. Must be one of {[t.value for t in AccountType]}"
            }), 400

        # Handle parent account (IMPORTANT)
        parent = None
        if data.get("parent_id"):
            parent = Account.query.get(data["parent_id"])
            print(parent)
            if not parent:
                return jsonify({"error": "Parent account not found"}), 400

        account = Account(
            code=data["code"],
            name=data["name"],
            type=account_type,
            parent_id=parent.id if parent else None,
            # IMPORTANT RULE
            is_postable=data.get("is_postable", True)
        )
       

        db.session.add(account)
        db.session.commit()

        return jsonify({
            "message": "Account created",
            "id": account.id
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Account code already exists"}), 400



# def get_accounts():
#     accounts = Account.query.all()

#     result = []

#     for a in accounts:

#         balance = db.session.query(
#             func.coalesce(func.sum(LedgerEntry.debit), 0) -
#             func.coalesce(func.sum(LedgerEntry.credit), 0)
#         ).filter(LedgerEntry.account_id == a.id).scalar()

#         result.append({
#             "id": a.id,
#             "code": a.code,
#             "name": a.name,
#             "type": a.type.value,
#             "parent_id": a.parent_id,
#             "is_postable": a.is_postable,
#             "balance": float(balance)
#         })

#     return jsonify(result)
def get_accounts():
    accounts = Account.query.all()

    result = []

    for a in accounts:
        result.append({
            "id": a.id,
            "code": a.code,
            "name": a.name,
            "type": a.type.value,
            "parent_id": a.parent_id,
            "is_postable": a.is_postable,
            "balance": float(get_account_balance(a))  # ONLY THIS SOURCE
        })

    return jsonify(result)


def get_leaf_balance(account_id):
    return db.session.query(
        func.coalesce(func.sum(LedgerEntry.debit), 0) -
        func.coalesce(func.sum(LedgerEntry.credit), 0)
    ).filter(LedgerEntry.account_id == account_id).scalar() or 0

def get_account_balance(account):
    # POSTING ACCOUNTS → ledger ONLY
    if account.is_postable:
        return get_leaf_balance(account.id)

    # NON-POSTING ACCOUNTS → children ONLY (NO LEDGER EVER)
    total = 0

    for child in account.children:
        total += get_account_balance(child)

    return total


def get_account(id):
    account = Account.query.get_or_404(id)

    return jsonify({
        "id": account.id,
        "code": account.code,
        "name": account.name,
        "type": account.type.value,
        "parent_id":account.parent_id,
    })


def update_account(id):
    account = Account.query.get_or_404(id)
    data = request.get_json()

    if "code" in data:
        account.code = data["code"]

    if "name" in data:
        account.name = data["name"]

    if "type" in data:
        try:
            account.type = AccountType(data["type"])
        except ValueError:
            return jsonify({"error": "Invalid account type"}), 400

    db.session.commit()

    return jsonify({"message": "Account updated"})



def delete_account(id):
    account = Account.query.get_or_404(id)

    db.session.delete(account)
    db.session.commit()

    return jsonify({"message": "Account deleted"})

# Product Factory
def create_product():
    data = request.json

    config = build_config(data)

    product = LoanProduct(
        code=data["code"],
        name=data["name"],
        description=data.get("description"),
        config=config
    )

    db.session.add(product)
    db.session.commit()

    return jsonify(product.to_dict()), 201

def get_products():
    products = LoanProduct.query.filter_by(is_active=True).all()

    return jsonify([p.to_dict() for p in products])

# def get_product(id):
#     product = LoanProduct.query.get_or_404(id)
#     return jsonify(product.to_dict())

def update_product(id):
    product = LoanProduct.query.get_or_404(id)
    data = request.json

    # rebuild config
    product.config = build_config(data)

    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description)

    # 🔥 versioning
    product.version += 1

    db.session.commit()

    return jsonify(product.to_dict())

def delete_product(id):
    product = LoanProduct.query.get_or_404(id)

    product.is_active = False
    db.session.commit()

    return jsonify({"message": "Product deactivated"})

# @app.route("/api/loan_product_factory/<int:id>")
def get_product(id):
    lp = LoanProduct.query.get(id)
    return jsonify(flatten_loan_product(lp))

def flatten_loan_product(lp):
    config = lp.config or {}

    return {
        "id": lp.id,
        "code": lp.code,
        "name": lp.name,

        # Interest
        "interest_type": config.get("interest", {}).get("type") if config else None,
        "interest_rate": config.get("interest", {}).get("rate") if config else None,

        # Amount
        "min_amount": config.get("amount", {}).get("min") if config else None,
        "max_amount": config.get("amount", {}).get("max") if config else None,

        # Term
        "min_term": config.get("term", {}).get("min") if config else None,
        "max_term": config.get("term", {}).get("max") if config else None,

        # Security
        "secured": config.get("security", {}).get("secured") if config else None,
        "guarantors_required": config.get("security", {}).get("guarantors_required") if config else None,
        "requires_collateral": config.get("security", {}).get("requires_collateral") if config else None,

        # Repayment
        "repayment_frequency": config.get("repayment", {}).get("frequency") if config else None,
        "repayment_method": config.get("repayment", {}).get("method") if config else None,
        "grace_period_days": config.get("repayment", {}).get("grace_period_days") if config else None,
        "late_payment_rate": config.get("repayment", {}).get("late_payment_rate") if config else None,
        "late_payment_type": config.get("repayment", {}).get("late_payment_type") if config else None,
        "allow_reschedule": config.get("repayment", {}).get("allow_reschedule") if config else None,
        "allow_early_repayment": config.get("repayment", {}).get("allow_early_repayment") if config else None,
        "early_repayment_penalty": config.get("repayment", {}).get("early_repayment_penalty") if config else None,

        # GL
        "loan_principal_gl": config.get("gl", {}).get("loan_principal") if config else None,
        "interest_income_gl": config.get("gl", {}).get("interest_income") if config else None,
        "penalty_income_gl": config.get("gl", {}).get("penalty_income") if config else None,
        "charges_income_gl": config.get("gl", {}).get("charges_income") if config else None,

        # Arrays
        "rules": config.get("rules", []) if config else [],
        "charges": config.get("charges", []) if config else [],
    }
    
    
def member_financial_summary(member_id):

    # SETTINGS
    settings = ChamaSettings.query.first()
    credit_multiplier = settings.credit_multiplier / 100 if settings else 0.95
    registration_fee = settings.registration_fee if settings else 0

    # ---------------- SAVINGS (DEP only) ----------------
    dep_total = db.session.query(
        db.func.coalesce(db.func.sum(Contribution.amount), 0)
    ).filter(
        Contribution.memberId == member_id,
        Contribution.savings_product == "DEP"
    ).scalar()

    # ---------------- REG ----------------
    reg_total = db.session.query(
        db.func.coalesce(db.func.sum(Contribution.amount), 0)
    ).filter(
        Contribution.memberId == member_id,
        Contribution.savings_product == "REG"
    ).scalar()

    # ---------------- LOANS ----------------
    loans = Credit.query.filter_by(member_id=member_id).all()

    active_loans = sum(float(l.amount_requested) for l in loans if l.status == "Active")
    total_loans = sum(float(l.amount_requested) for l in loans)

    # ---------------- CREDIT CALC ----------------
    qualified_amount = float(dep_total) * credit_multiplier
    available_credit = qualified_amount - active_loans

    return jsonify({
        "memberId": member_id,

        "savings": {
            "DEP": float(dep_total),
            "REG": float(reg_total)
        },

        "loans": {
            "totalLoans": total_loans,
            "activeLoans": active_loans,
            "count": len(loans)
        },

        "credit": {
            "qualifiedAmount": qualified_amount,
            "availableCredit": available_credit
        },

        "registration": {
            "required": registration_fee,
            "paid": float(reg_total) >= registration_fee
        }
    }), 200
    

def get_member_contributions(member_id):
    contributions = Contribution.query.filter_by(memberId=member_id).all()

    return jsonify([
        {
            "id": c.id,
            "memberId": c.memberId,
            "memberName": c.memberName,
            "month": c.month,
            "amount": c.amount,
            "date": c.date,
            "savingsProduct": c.savings_product  # IMPORTANT
        }
        for c in contributions
    ]), 200
    

def get_member_contributions_by_product(member_id, product):

    contributions = Contribution.query.filter_by(
        memberId=member_id,
        savings_product=product
    ).all()

    return jsonify([c.to_dict() for c in contributions]), 200


def get_member_loans(member_id):

    loans = Credit.query.filter_by(
        member_id=member_id
    ).order_by(Credit.id.desc()).all()

    return jsonify([
        {
            "loanId": l.loan_id,
            "amountRequested": float(l.amount_requested),
            "status": l.status.value if l.status else None,
            "interestRate": l.interest_rate,
            "installments": l.installments,
            "createdAt": l.created_at.isoformat() if l.created_at else None
        }
        for l in loans
    ]), 200
    

def get_member_overview(member_id):
    m = Member.query.get(member_id)
    return jsonify(m.to_dict())

def member_statement(member_id):

    from_date = request.args.get("from")
    to_date = request.args.get("to")

    member = Member.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404

    # ================= PARSE DATES =================
    def parse(d):
        return datetime.strptime(d, "%Y-%m-%d") if d else None

    from_dt = parse(from_date)
    to_dt = parse(to_date)

    # ================= SAVINGS (EXCLUDE REG ONLY) =================
    savings_query = Contribution.query.filter(
        Contribution.memberId == member_id,
        Contribution.savings_product != "REG"
    )

    loans_query = Credit.query.filter_by(member_id=member_id)

    # Apply date filter
    if from_dt:
        savings_query = savings_query.filter(Contribution.date >= from_date)
    if to_dt:
        savings_query = savings_query.filter(Contribution.date <= to_date)

    savings = savings_query.all()
    loans = loans_query.all()

    # ================= BUILD STATEMENT =================
    statement = []

    for s in savings:
        statement.append({
            "date": s.date,
            "type": s.savings_product,
            "description": f"{s.savings_product} Contribution",
            "debit": 0,
            "credit": float(s.amount)
        })

    for l in loans:
        statement.append({
            "date": l.created_at.isoformat() if l.created_at else None,
            "type": "LOAN",
            "description": f"Loan {l.loan_id}",
            "debit": float(l.amount_requested),
            "credit": 0
        })

    statement.sort(key=lambda x: x["date"] or "")

    # ================= RUNNING BALANCE =================
    balance = 0
    for s in statement:
        balance += s["credit"]
        balance -= s["debit"]
        s["balance"] = balance

    opening_balance = 0 if not statement else statement[0]["balance"] - (
        statement[0]["credit"] - statement[0]["debit"]
    )

    closing_balance = balance

    return jsonify({
        "member": {
            "id": member.member_id,
            "name": f"{member.first_name or ''} {member.last_name or ''}".strip()
        },
        "openingBalance": opening_balance,
        "closingBalance": closing_balance,
        "statement": statement
    }), 200
