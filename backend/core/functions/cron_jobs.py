from datetime import datetime, date, timedelta
from .models import CreditRepayment,Credit,MpesaTransaction,MCashRecords,Contribution, CreditStatusEnum,db
from .scheduledtasks import apply_penalty_if_overdue

from core import mail
from flask_mail import Message

def mark_paid_cron(amount,loan_id, installment_number):
    amount_to_pay = amount

    if amount_to_pay <= 0:
        print('Error')

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

    print('Okay')



def apply_daily_penalties(app):
    with app.app_context():
        print(f"Running daily penalty job: {datetime.now()}")
    
        all_repayments = CreditRepayment.query.filter_by(paid=False).all()
        for r in all_repayments:
          apply_penalty_if_overdue(r)

        db.session.commit()
        print("Daily penalties applied successfully.")
        
def notify_upcoming_repayments(app, days_before=7):
    """
    Notify members about repayments due in `days_before` days.
    """
    with app.app_context():
        today = date.today()
        target_date = today + timedelta(days=days_before)
        print("Started")

        # Fetch unpaid installments due in `days_before` days
        upcoming_repayments = CreditRepayment.query.filter_by(paid=False).filter(
            CreditRepayment.due_date == target_date
        ).all()

        for repayment in upcoming_repayments:
            loan = Credit.query.filter_by(loan_id=repayment.loan_id).first()
            if not loan:
                continue  # safety check

            member_email = "martinallen722@gmail.com"  # adjust to your model field

            # Example: send an email notification
            msg = Message(
                subject=f"Repayment Due Reminder - Loan {loan.loan_id}",
                sender="noreply@yourapp.com",
                recipients=[member_email],
                body=(
                    f"Dear {loan.member_name},\n\n"
                    f"This is a friendly reminder that installment #{repayment.installment_number} "
                    f"of your loan (KES {repayment.total}) is due on {repayment.due_date}.\n\n"
                    "Please ensure timely payment to avoid penalties.\n\n"
                    "Thank you."
                )
            )

            try:
                mail.send(msg)
                print(f"Reminder sent to {member_email} for loan {loan.loan_id} installment {repayment.installment_number}")
            except Exception as e:
                print(f"Failed to send reminder to {member_email}: {e}")
                
                
def post_transactions(app):
    """
    Compare unposted MpesaTransaction and MCashRecords,
    insert into appropriate tables based on MCashRecords.code,
    mark both as posted when matched.
    """
    with app.app_context():
        # Get unposted MpesaTransactions
        unposted_mpesa = MpesaTransaction.query.filter_by(posted=False).all()

        # Get unposted MCashRecords
        unposted_mcash = MCashRecords.query.filter_by(posted=False).all()

        inserted_count = 0

        print(f"Unposted MpesaTransactions: {len(unposted_mpesa)}")
        for mpesa in unposted_mpesa:
            print(f"  ID: {mpesa.id}, Memberid: {mpesa.Memberid}, Phone: {mpesa.phone}, "
                  f"Month: {mpesa.month}, Date: {mpesa.transaction_date}, Amount: {mpesa.amount}")

        print(f"\nUnposted MCashRecords: {len(unposted_mcash)}")
        for mcash in unposted_mcash:
            print(f"  ID: {mcash.id}, Memberid: {mcash.member_id}, Phone: {mcash.phone}, "
                  f"Month: {mcash.month}, Date: {mcash.transaction_date}, Code: {mcash.code}, "
                  f"Amount: {mcash.received_amount}")

        # Now start matching
        for mpesa in unposted_mpesa:
            mpesa_member_id = mpesa.Memberid
            mpesa_phone = mpesa.phone
            mpesa_month = mpesa.month
            mpesa_date = mpesa.transaction_date

            print("\n--- Checking Mpesa Transaction ---")
            print(f"Mpesa ID: {mpesa.id}, Memberid: {mpesa_member_id}, Phone: {mpesa_phone}")
            print(f"Month: {mpesa_month}, Date: {mpesa_date}, Amount: {mpesa.amount}")

            # Find matching MCash record
            match = next(
                (
                    mcash
                    for mcash in unposted_mcash
                    if mcash.member_id == int(mpesa_member_id)
                    and mcash.phone == mpesa_phone
                    and mcash.month == mpesa_month
                    and mcash.transaction_date == mpesa_date
                ),
                None,
            )

            if match:
                print("✅ Found matching MCash record!")
                print(f"MCash ID: {match.id}, Memberid: {match.member_id}, Phone: {match.phone}")
                print(f"Month: {match.month}, Date: {match.transaction_date}, Code: {match.code}, Amount: {match.received_amount}")
                
                # Handle based on mcash.code
                if match.code == "CONTRIBUTION":
                    contribution = Contribution(
                        memberId=mpesa_member_id,
                        memberName=mpesa.member_name,
                        month=mpesa_month,
                        amount=mpesa.amount,
                        date=mpesa_date,
                    )
                    db.session.add(contribution)
                    print(f"Inserted Contribution for {mpesa_member_id} amount {mpesa.amount}")

                elif match.code == "LOAN_REPAYMENT":
                    # Placeholder for registration fee logic
                    mark_paid_cron(mpesa.amount,match.loanno, match.installment)
                    print("Would handle LOAN_REPAYMENT here")
                    pass

                # Mark both as posted
                mpesa.posted = True
                match.posted = True
                inserted_count += 1
            else:
                print("❌ No matching MCash record found for this Mpesa transaction.")

        db.session.commit()
        print(f"\n✅ Reconciled and inserted {inserted_count} contributions (or other codes).")
        
        
        




                
                
    
