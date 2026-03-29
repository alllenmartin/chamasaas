from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
import enum
from datetime import date
from core import db
from datetime import timedelta
from datetime import datetime


# Loan Status
class CreditStatusEnum(enum.Enum):
    Pending= "Pending"
    Active = "Active"
    Completed = "Completed"
    Defaulted = "Defaulted"
    Approved = "Approved"

# Enum for frequency
class FrequencyEnum(enum.Enum):
    Weekly = "Weekly"
    Monthly = "Monthly"
    Yearly = "Yearly"

# Enum for organization type
class OrganizationTypeEnum(enum.Enum):
    Savings = "Savings"
    Credit = "Credit"
    Both = "Both"

#Transaction Type
class TransactionType(enum.Enum):
    LOAN = "Loan"
    REPAYMENT = "Repayment"
    INTEREST_PAID = "Interest Paid"
    INTEREST_DUE = "Interest Due"
    PENALTY_PAID = "Penalty Paid"
    PENALTY_DUE = "Penalty Due"
    INSURANCE_PAID = "Insurance Fee Paid"
    INSURANCE_DUE = "Insurance Fee Due"
    

class ChamaSettings(db.Model):
    __tablename__ = "chama_settings"

    id = db.Column(db.Integer, primary_key=True)
    contribution_amount = db.Column(db.Float, nullable=False, default=0)
    registration_fee = db.Column(db.Float, nullable=False, default=0)
    frequency = db.Column(db.Enum(FrequencyEnum), nullable=False, default=FrequencyEnum.Monthly)
    cut_off_day = db.Column(db.Integer, nullable=False, default=1)
    organization_type = db.Column(db.Enum(OrganizationTypeEnum), nullable=False, default=OrganizationTypeEnum.Savings)
    notifications_enabled = db.Column(db.Boolean, default=False)
    notification_date = db.Column(db.Date, nullable=True)
    credit_multiplier = db.Column(db.Float, nullable=True)
    interest_rate = db.Column(db.Float, nullable=True)
    installments = db.Column(db.Integer, nullable=True)
    penalty_rate = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "contributionAmount": self.contribution_amount,
            "registrationFee": self.registration_fee,
            "frequency": self.frequency.value,  # Enum -> string
            "cutOffDay": self.cut_off_day,
            "organizationType": self.organization_type.value,  # Enum -> string
            "notificationsEnabled": self.notifications_enabled,
            "notificationDate": self.notification_date.isoformat() if self.notification_date else "",
            "creditMultiplier": self.credit_multiplier,
            "interestRate": self.interest_rate,
            "installments": self.installments,
            "loanpenalty": self.penalty_rate,
        }
        
        
# Member model
class Member(db.Model):
    __tablename__ = "member" 
    id = db.Column(db.String(8), primary_key=True)  # ID number
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    role = db.Column(db.String(20), default="Member")
    amountPaid = db.Column(db.Integer, default=0)
    status = db.Column(db.String(10), default="Unpaid")
    registrationPaid = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "role": self.role,
            "amountPaid": self.amountPaid,
            "status": self.status,
            "registrationPaid": self.registrationPaid,
        }
        
class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    memberId = db.Column(db.String(8), db.ForeignKey('member.id'), nullable=False)
    memberName = db.Column(db.String(100))
    month = db.Column(db.String(7))  # e.g., 2024-01
    amount = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(10), default=datetime.today().strftime('%d/%m/%Y'))

    def to_dict(self):
        return {
            "id": self.id,
            "memberId": self.memberId,
            "memberName": self.memberName,
            "month": self.month,
            "amount": self.amount,
            "date": self.date,
        }

class CreditTransaction(db.Model):
    __tablename__ = "credit_transaction"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(10), db.ForeignKey("credit.loan_id"), nullable=False)
    
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Use back_populates instead of backref
    credit = db.relationship("Credit", back_populates="transactions")

    @staticmethod
    def normalize_amount(transaction_type, amount):
        positive_types = {
            TransactionType.LOAN,
            TransactionType.INTEREST_PAID,
            TransactionType.PENALTY_PAID,
            TransactionType.INSURANCE_PAID,
        }

        negative_types = {
            TransactionType.REPAYMENT,
            TransactionType.INTEREST_DUE,
            TransactionType.PENALTY_DUE,
            TransactionType.INSURANCE_DUE,
        }

        if transaction_type in positive_types:
            return abs(amount)
        elif transaction_type in negative_types:
            return -abs(amount)
        else:
            raise ValueError("Invalid transaction type")


class Credit(db.Model):
    __tablename__ = "credit"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(10), unique=True, nullable=False)
    member_id = db.Column(db.String(8), db.ForeignKey("member.id"), nullable=False)
    member = relationship("Member", backref="credits", foreign_keys=[member_id])
    amount_requested = db.Column(db.Integer, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    installments = db.Column(db.Integer, nullable=False)
    insurance_fee=db.Column(db.Float,default=0)
    schedule_generated = db.Column(db.Boolean, default=False)
    interest_method = db.Column(db.String(50), default="amortized")

    # Relationship to transactions
    transactions = db.relationship(
        "CreditTransaction",
        back_populates="credit",
        lazy="dynamic"
    )
    status = db.Column(
        db.Enum(CreditStatusEnum),
        nullable=False,
        default=CreditStatusEnum.Pending
    )
    created_at = db.Column(db.Date, default=date.today) 

    @property
    def outstanding_balance(self):
        return round(sum(
            t.amount for t in self.transactions
            if t.transaction_type in [TransactionType.LOAN, TransactionType.REPAYMENT]
        ), 2)

    @property
    def outstanding_interest(self):
        return round(sum(
            t.amount for t in self.transactions
            if t.transaction_type in [TransactionType.INTEREST_PAID, TransactionType.INTEREST_DUE]
        ), 2)

    @property
    def outstanding_penalty(self):
        return round(sum(
            t.amount for t in self.transactions
            if t.transaction_type in [TransactionType.PENALTY_PAID, TransactionType.PENALTY_DUE]
        ), 2)

    @property
    def outstanding_insurance(self):
        return round(sum(
            t.amount for t in self.transactions
            if t.transaction_type in [TransactionType.INSURANCE_PAID, TransactionType.INSURANCE_DUE]
        ), 2)

    @property
    def total_outstanding(self):
        return round(
            self.outstanding_balance +
            self.outstanding_interest +
            self.outstanding_penalty +
            self.outstanding_insurance,
            2
        )
    
    @property
    def expected_completion_date(self):
        if self.status == CreditStatusEnum.Pending:
            return None

        # Example assumption: monthly installments
        months = self.installments or 0
        return self.created_at + timedelta(days=30 * months)


    def to_dict(self):                                                                                                                                                                                                                                                     
        return {
            "loanId": self.loan_id,
            "memberId": self.member_id,
            "memberName": self.member.name if self.member else "",
            "memberPhone": self.member.phone if self.member else "",
            "amountRequested": self.amount_requested,
            "interestRate": self.interest_rate,
            "interestAmount": round(self.outstanding_interest, 2),
            "remainingBalance": self.outstanding_balance,
            "outstandingInterest": self.outstanding_interest,
            "outstandingPenalty": self.outstanding_penalty,
            "outstandingInsurance": self.outstanding_insurance,
            "totalOutstanding": self.total_outstanding,
            "installments": self.installments,
            "amountPaid":  self.outstanding_balance,
            "totalPayable": round(self.total_outstanding, 2),
            "insuranceFee": self.insurance_fee,
            "expectedCompletionDate": (
                self.expected_completion_date.isoformat()
                if self.expected_completion_date
                else None
            ),
            "status": self.status.value,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

class CreditRepayment(db.Model):
    __tablename__ = "credit_repayments"
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(10), db.ForeignKey("credit.loan_id"), nullable=False)
    installment_number = db.Column(db.Integer, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    principal = db.Column(db.Float, nullable=False)
    interest = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    paid = db.Column(db.Boolean, default=False)
    paid_at = db.Column(db.Date, nullable=True)
    amount_paid = db.Column(db.Float, nullable=False, default=0)
    remaining_balance = db.Column(db.Float, nullable=False)
    interest_paid = db.Column(db.Float, default=0)
    principal_paid = db.Column(db.Float, default=0)
    penalty = db.Column(db.Numeric(10, 2), default=0)
    penalty_paid = db.Column(db.Numeric(10, 2), default=0)
    penalty_applied_at = db.Column(db.Date)
    
    def to_dict(self):
        remaining = max(self.total - (self.amount_paid or 0), 0)
        return {
            "id": self.id,
            "installment_number": self.installment_number,
            "loan_id": self.loan_id,
            "due_date": self.due_date.isoformat(),
            "principal": self.principal,
            "interest": self.interest,
            "total": self.total,
            "paid": self.paid,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "amount_paid": self.amount_paid,
            "remaining_balance": remaining,
            "interest_paid":self.interest_paid,
        }
        
        
class Vendor(db.Model):
    __tablename__ = "vendors"
    
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.String(20), unique=True, nullable=False)  # optional code
    name = db.Column(db.String(100), nullable=False)
    default_monthly_amount = db.Column(db.Float, nullable=False, default=0)
    phone = db.Column(db.String(100), nullable=True)

    # Relationship: Ledger entries
    ledger_entries = db.relationship("VendorLedger", backref="vendor", lazy=True)

class VendorLedger(db.Model):
    __tablename__ = "vendor_ledger"

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendors.id"), nullable=False)
    month = db.Column(db.Date, nullable=False)
    expected_amount = db.Column(db.Float, nullable=False, default=0)
    amount_received = db.Column(db.Float, nullable=False, default=0)
    outstanding_amount = db.Column(db.Float, nullable=False, default=0)
    received_amount = db.Column(db.Float, nullable=False, default=0)
    
    
class MpesaTransaction(db.Model):
    __tablename__ = "mpesa_transactions"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    receipt = db.Column(db.String(50),nullable=False)
    reference = db.Column(db.String(100), nullable=False)
    checkout_request_id = db.Column(db.String(100), unique=True, nullable=True) 
    phone = db.Column(db.String(20), nullable=False)
    trans_time = db.Column(db.DateTime, default=datetime.utcnow)  # YYYYMMDDHHMMSS
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(
        db.Enum("pending", "success", "failed", name="mpesa_status"),
        default="pending"
    )
    transaction_type = db.Column(
    db.Enum(
        "registration_fee",
        "shares_contribution",
        "penalty_due",
        "loan_repayment",
        name="transaction_type"
    ),
    default="shares_contribution")
    
    def to_dict(self):
        return {
            "id": self.id,
            "amount": self.amount,
            "receipt": self.receipt,
            "phone": self.phone,
            "trans_time": self.trans_time,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
        

    
class RepaymentSchedule(db.Model):
    __tablename__ = "repayment_schedule"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(50))
    installment_number = db.Column(db.Integer)
    due_date = db.Column(db.Date)
    principal = db.Column(db.Float)
    interest = db.Column(db.Float)
    total_payment = db.Column(db.Float)
    balance = db.Column(db.Float)


class DailyLoansInterestBuffer(db.Model):
    __tablename__ = "daily_loansinterest_buffer"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(50))
    interest_date = db.Column(db.Date)
    product_type = db.Column(db.String(100))
    interest_amount = db.Column(db.Float)
    outstanding_balance = db.Column(db.Float)
