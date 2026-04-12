
from flask import request,jsonify
from flask_cors import cross_origin
from app import app
from datetime import date
from .controller import add_repayment,delete_account,update_account,get_accounts,get_account,create_account,create_member, calculate_daily_interest_for_month,current_member_commitment,get_all_security,security_status,save_guarantors,save_collaterals,get_active_loans,calculate_daily_interest_for_today, save_schedule,new_generate_schedule,get_contributions_each,member_lookup,get_settings,send_sms,update_settings,get_members,update_member,delete_member,get_contributions,add_contribution,request_credit,get_credits,credit_members,update_credit_status,get_credit,generate_schedule,get_schedule,mark_paid,get_vendor_ledger,receive_vendor_payment,get_vendors,create_vendor,delete_vendor,update_vendor,get_contributions_monthly,get_repayment_schedule
from .mpesa_flow import get_mpesa_transactions,initiate_MPESA_push

@app.route("/api/settings", methods=['GET','POST'])
@cross_origin()
def settings():
    if request.method == 'GET': return get_settings()
    if request.method == 'POST': return update_settings()
    else: return 'Method is Not Allowed'
    
@app.route("/api/members", methods=['GET','POST'])
@cross_origin()
def memberss():
    if request.method == 'GET': return get_members()
    # if request.method == 'POST': return add_member()
    else: return 'Method is Not Allowed'
    
@app.route("/api/members/<member_id>", methods=["PUT","DELETE"])
@cross_origin()
def updatemembers(member_id):
    if request.method == 'PUT': return update_member(member_id)
    if request.method == 'DELETE': return delete_member(member_id)
    else: return 'Method is Not Allowed'
    
    
@app.route("/members/lookup", methods=["GET"])
@cross_origin()
def get_member_lookup():
    if request.method == 'GET': return member_lookup()
    else: return 'Method is Not Allowed'
    
@app.route("/api/contributions/<member_id>", methods=["GET"])
@cross_origin()
def getontributions(member_id):
    if request.method == 'GET': return get_contributions_each(member_id)
    else: return 'Method is Not Allowed'
    
    
@app.route("/api/contributions", methods=['GET','POST'])
@cross_origin()
def contrbss():
    if request.method == 'GET': return get_contributions()
    if request.method == 'POST': return add_contribution()
    else: return 'Method is Not Allowed'
    
@app.route("/api/generate-schedule", methods=["POST"])
@cross_origin()
def generateschedule():
    if request.method == 'POST': return new_generate_schedule()
    else: return 'Method is Not Allowed'
    
@app.route("/api/contributionsbymonth", methods=['GET'])
@cross_origin()
def contrbssbymonth():
    if request.method == 'GET': return get_contributions_monthly()
    else: return 'Method is Not Allowed'
    
    
# Credit
@app.route("/api/credit", methods=['GET','POST'])
@cross_origin()
def credit_application():
    if request.method == 'GET': return get_credits()
    if request.method == 'POST': return request_credit()
    else: return 'Method is Not Allowed'
    
    
@app.route("/api/credit/members", methods=["GET"])
@cross_origin()
def get_credit_members():
    if request.method == 'GET': return credit_members()
    else: return 'Method is Not Allowed'
    
@app.route("/api/credit/<loan_id>", methods=["GET","PATCH"])
@cross_origin()
def edit_loans(loan_id):
    if request.method == 'GET': return get_credit(loan_id)
    if request.method == 'PATCH': return update_credit_status(loan_id)
    else: return 'Method is Not Allowed'
    
# Repayment Schedule

@app.route("/api/credit/<loan_id>/schedule", methods=["GET", "POST"])
@cross_origin()
def rep_schedule(loan_id):
    if request.method == 'GET':
        return get_schedule(loan_id)

    elif request.method == 'POST':
        return save_schedule(loan_id)  #  call save function

    else:
        return 'Method is Not Allowed'
    
@app.route("/api/repayments", methods=["GET"])   
@cross_origin() 
def get_repayment_scheduless():
    if request.method == 'GET': return get_repayment_schedule()
    else: return 'Method is Not Allowed'
    
@app.route("/api/repayment/<loan_id>/<int:installment_number>/pay", methods=["PATCH"])
@cross_origin()
def markpaid(loan_id,installment_number):
    if request.method == 'PATCH': return mark_paid(loan_id,installment_number)
    else: return 'Method is Not Allowed'
    
@app.route("/api/vendor-ledger", methods=["GET"])
@cross_origin()
def vLedger():
    if request.method == 'GET': return get_vendor_ledger()
    else: return 'Method is Not Allowed'

@app.route("/api/vendor-ledger/<int:id>/receive", methods=["PATCH"])
@cross_origin()
def RVendorFee(id):
    if request.method == 'PATCH': return receive_vendor_payment(id)
    else: return 'Method is Not Allowed'   
    
@app.route("/api/vendors", methods=["GET","POST"])
@cross_origin()
def vendorss():
    if request.method == 'GET': return get_vendors()
    if request.method == 'POST': return create_vendor()
    else: return 'Method is Not Allowed'  
    
@app.route("/api/vendors/<int:id>", methods=["PUT","DELETE"])
@cross_origin()
def updatevendorss(id):
    if request.method == 'PUT': return update_vendor(id)
    if request.method == 'DELETE': return delete_vendor(id)
    else: return 'Method is Not Allowed'  
    
    
@app.route("/api/stk-push", methods=['GET','POST'])
@cross_origin()
def initiate_transaction():
    if request.method == 'GET': return get_mpesa_transactions()
    if request.method == 'POST': return initiate_MPESA_push()
    else: return 'Method is Not Allowed'
    
    
    
# SMS
@app.route("/send-sms", methods=["POST"])
@cross_origin()
def send_sms_notification():
    if request.method == 'POST': return send_sms()
    else: return 'Method is Not Allowed'

@app.route("/api/loans/calculate-interest", methods=["POST"])
def run_interest():
    run_date = date.today()
    calculate_daily_interest_for_today()
    return {"message": "Interest calculated successfully"}, 200

@app.route("/api/loans/active", methods=["GET"])
@cross_origin()
def get_the_active_loans():
    if request.method == 'GET': return get_active_loans()


@app.route("/api/loan_journal", methods=["POST"])
@cross_origin()
def pay_loan():
    if request.method == 'POST': return add_repayment()

@app.route("/api/newmembers", methods=["POST"])
@cross_origin()
def create_new_members():
    if request.method == 'POST': return create_member()


@app.route('/api/guarantors', methods=['POST'])
@cross_origin()
def save_security_guarantors():
    if request.method == 'POST': return save_guarantors()


@app.route('/api/collaterals', methods=['POST'])
@cross_origin()
def save_security_collateral():
    if request.method == 'POST': return save_collaterals()

@app.route('/api/loans/<string:loan_id>/security', methods=["GET"])
@cross_origin()
def get_securities(loan_id):
     if request.method == 'GET': return get_all_security(loan_id)

@app.route('/api/loans/<string:loan_id>/security-status', methods=['GET'])
@cross_origin()
def get_security_status(loan_id):
     if request.method == 'GET': return security_status(loan_id)

@app.route("/api/member/<member_id>/current_commitment", methods=["GET"])
@cross_origin()
def get_committment(member_id):
    if request.method == 'GET': return current_member_commitment(member_id)
    
# Chat of Accounts
@app.route("/api/coa", methods=["POST"])
@cross_origin()
def create_coa():
    if request.method == 'POST': return create_account()
    
@app.route("/api/coa", methods=["GET"])
@cross_origin()
def get_coa():
    if request.method == 'GET': return get_accounts()
    
@app.route("/api/coa/<int:id>", methods=["GET"])
@cross_origin()
def get_single_coa(id):
    if request.method == 'GET': return get_account(id)

@app.route("/api/coa/<int:id>", methods=["PUT"])
@cross_origin()
def update_coa(id):
    if request.method == 'PUT': return update_account(id)

@app.route("/api/coa/<int:id>", methods=["DELETE"])
@cross_origin()
def delete_coa(id):
    if request.method == 'DELETE': return delete_account(id)