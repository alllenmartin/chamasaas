from .models import db,CreditTransaction,TransactionType
from sqlalchemy import func, case
import calendar
from datetime import date

def get_principal_balance_as_at(loan_id, as_at_date):
    result = db.session.query(
        func.coalesce(func.sum(
            case(
                (
                    CreditTransaction.transaction_type == TransactionType.LOAN,
                    CreditTransaction.amount
                ),
                (
                    CreditTransaction.transaction_type == TransactionType.REPAYMENT,
                    -CreditTransaction.amount
                ),
                else_=0
            )
        ), 0)
    ).filter(
        CreditTransaction.loan_id == loan_id,
        func.date(CreditTransaction.created_at) <= as_at_date
    ).scalar()
    return round(result, 2)

def is_leap_year(year: int) -> bool:
    return calendar.isleap(year)

def get_days_in_year(d: date) -> int:
    return 366 if is_leap_year(d.year) else 365

