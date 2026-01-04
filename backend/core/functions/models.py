from flask_sqlalchemy import SQLAlchemy
import enum
from datetime import date
from core import db

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
        

