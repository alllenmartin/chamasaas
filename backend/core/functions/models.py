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
    
# Account Type
class AccountType(enum.Enum):
    Asset = "Asset"
    Liability = "Liability"
    Income = "Income"
    Expense = "Expense"
    Equity = "Equity"



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
        
        


class Member(db.Model):
    member_id = db.Column(db.String(20), primary_key=True)
    # member_id = db.Column(db.String(20), unique=True, nullable=True)
    first_name = db.Column(db.String(50), nullable=True)
    second_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50), nullable=True)
    national_id = db.Column(db.String(20),unique=True, nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    dob = db.Column(db.Date, nullable=True)
    nationality = db.Column(db.String(50))
    county = db.Column(db.String(50))
    sub_county = db.Column(db.String(50))
    phone = db.Column(db.String(20),unique=True)
    email = db.Column(db.String(50))
    address = db.Column(db.String(200))
    role = db.Column(db.String(20))
    bank_name = db.Column(db.String(50))
    branch_name = db.Column(db.String(50))
    account_number = db.Column(db.String(30))
    employment = db.Column(db.String(20))
    employer = db.Column(db.String(50))
    department = db.Column(db.String(50))
    terms_of_employment = db.Column(db.String(50))
    business_type = db.Column(db.String(50))
    business_name = db.Column(db.String(50))
    business_location = db.Column(db.String(50))
    landmark = db.Column(db.String(50))
    area_code = db.Column(db.String(50))
    created_at = db.Column(db.Date, default=date.today)

    def to_dict(self):
        return {
            
            "memberId": self.member_id,

            # Names
            "name": f"{self.first_name or ''} {self.second_name or ''} {self.last_name or ''}".strip(),

            # Personal
            "gender": self.gender,
            "dob": self.dob.isoformat() if self.dob else None,
            "nationalId": self.national_id,
            "status": "Active",

            # Contact
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "county": self.county,
            "subcounty": self.sub_county,
            "nationality": self.nationality,

            # Membership
            "role": self.role,
            "registrationPaid": False,

            # Financial
            "bankName": self.bank_name,
            "branchName": self.branch_name,
            "bankAccountNumber": self.account_number,

            # Employment
            "employmentType": self.employment,
            "employerName": self.employer,
            "departmentName": self.department,
            "termsOfEmployment": self.terms_of_employment,
            "businessName": self.business_name,
            "businessLocation": self.business_location,
            "landmark": self.landmark,

            # Relations
           "nextOfKin": [
                {
                    "name": b.name,
                    "phone": b.phone,
                    "relation": b.relation
                }
                for b in self.get_beneficiaries()
            ]
        }
    
    def get_beneficiaries(self):
     return Beneficiary.query.filter_by(member_id=self.member_id).all()


class Beneficiary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.String(20), db.ForeignKey('member.member_id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    relation = db.Column(db.String(50))
    share = db.Column(db.Float)
    id_number = db.Column(db.String(20))
    address = db.Column(db.String(200))
    guardian = db.Column(db.String(50))

    
        
class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    memberId = db.Column(db.String(20), db.ForeignKey('member.member_id'), nullable=False)
    memberName = db.Column(db.String(100))
    month = db.Column(db.String(7))  # e.g., 2024-01
    amount = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(10), default=datetime.today().strftime('%d/%m/%Y'))

    def to_dict(self):
        return {
             "id": self.memberId,
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
    member_id = db.Column(db.String(20), db.ForeignKey("member.member_id"), nullable=False)
    member = relationship("Member", backref="credits", foreign_keys=[member_id])
    amount_requested = db.Column(db.Integer, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    installments = db.Column(db.Integer, nullable=False)
    insurance_fee=db.Column(db.Float,default=0)
    schedule_generated = db.Column(db.Boolean, default=False)
    interest_method = db.Column(db.String(50), default="amortized")
    guarantors = db.relationship("Guarantor", backref="loan", lazy=True)

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
            "memberName": self.member.first_name if self.member else "",
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


class Guarantor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(10), db.ForeignKey('credit.loan_id'))
    member_number = db.Column(db.String(50))
    name = db.Column(db.String(100))
    amount_guaranteed = db.Column(db.Float)
    total_shares = db.Column(db.Float)
    committed_amount = db.Column(db.Float)


class Collateral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.String(10), db.ForeignKey('credit.loan_id'))
    type = db.Column(db.String(50))
    description = db.Column(db.String(200))
    value = db.Column(db.Float)
    owner = db.Column(db.String(100))
    
class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100))
    type = db.Column(db.Enum(AccountType), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("account.id"))
    is_postable = db.Column(db.Boolean, default=True)
    children = db.relationship(
    "Account",
    backref=db.backref("parent", remote_side=[id]),
    lazy="selectin"
    )
    

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(50), nullable=False)
    entity = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.String(50), nullable=True)
    changes = db.Column(db.JSON)  
    snapshot = db.Column(db.JSON) 
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.DateTime, default=datetime.utcnow)
    


class LedgerEntry(db.Model):
    __tablename__ = "ledger_entries"
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer,db.ForeignKey("account.id"),nullable=False)
    account_code = db.Column(db.String(20))
    # Amount moved
    debit = db.Column(db.Float, default=0)
    credit = db.Column(db.Float, default=0)
    description = db.Column(db.String(255))
    document_no = db.Column(db.String(50))  # e.g receipt no, loan id
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    # Relationship (optional but useful)
    account = db.relationship("Account", backref="ledger_entries")


