from flask_sqlalchemy import SQLAlchemy
import enum
from datetime import date
from core import db
from datetime import datetime


# Loan Status
class CreditStatusEnum(enum.Enum):
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
    id = db.Column(db.Integer, primary_key=True)  # internal PK
    loan_id = db.Column(db.String(10), unique=True, nullable=False)
    member_id = db.Column(db.String(8), nullable=False)
    amount_requested = db.Column(db.Integer, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    installments = db.Column(db.Integer, nullable=False)
    status = db.Column(
        db.Enum(CreditStatusEnum),
        nullable=False,
        default=CreditStatusEnum.Active
    )

    created_at = db.Column(db.Date, default=date.today)

    def to_dict(self):
        return {
            "loanId": self.loan_id,
            "memberId": self.member_id,
            "amountRequested": self.amount_requested,
            "interestRate": self.interest_rate,
            "installments": self.installments,
            "status": self.status.value,
            "createdAt": self.created_at.isoformat(),
        }
        

