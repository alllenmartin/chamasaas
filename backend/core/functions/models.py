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
        
class Credit(db.Model):
    __tablename__ = "credit"
    id = db.Column(db.Integer, primary_key=True)  # internal PK
    loan_id = db.Column(db.String(10), unique=True, nullable=False)
    member_id = db.Column(db.String(8), db.ForeignKey("member.id"), nullable=False)
    member = relationship("Member", backref="credits", foreign_keys=[member_id])
    amount_requested = db.Column(db.Integer, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    installments = db.Column(db.Integer, nullable=False)
    amount_paid = db.Column(db.Float, nullable=False, default=0)
    schedule_generated = db.Column(db.Boolean, default=False)

    status = db.Column(
        db.Enum(CreditStatusEnum),
        nullable=False,
        default=CreditStatusEnum.Pending
    )

    created_at = db.Column(db.Date, default=date.today)
    
    
    @property
    def total_payable(self):
        rate = self.interest_rate or 0
        return self.amount_requested + (
            self.amount_requested * rate / 100
        )

    @property
    def remaining_balance(self):
        paid = self.amount_paid or 0
        return max(self.total_payable - paid, 0)
    
    @property
    def interest_amount(self):
        rate = self.interest_rate or 0
        return self.amount_requested * rate / 100
    
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
            "amountRequested": self.amount_requested,
            "interestRate": self.interest_rate,
            "interestAmount": round(self.interest_amount, 2),
            "installments": self.installments,
            "amountPaid": self.amount_paid or 0,
            "totalPayable": round(self.total_payable, 2),
            "remainingBalance": round(self.remaining_balance, 2),
            "expectedCompletionDate": (
                self.expected_completion_date.isoformat()
                if self.expected_completion_date
                else None
            ),
            "status": self.status.value,
            "createdAt": self.created_at.isoformat(),
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
    remaining_balance = db.Column(db.Float, nullable=False)


        

