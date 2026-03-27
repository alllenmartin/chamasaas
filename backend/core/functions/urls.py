
from flask import request,jsonify
from flask_cors import cross_origin
from app import app
from .controller import save_schedule,new_generate_schedule,get_contributions_each,member_lookup,get_settings,send_sms,update_settings,add_member,get_members,update_member,delete_member,get_contributions,add_contribution,request_credit,get_credits,credit_members,update_credit_status,get_credit,generate_schedule,get_schedule,mark_paid,get_vendor_ledger,receive_vendor_payment,get_vendors,create_vendor,delete_vendor,update_vendor,get_contributions_monthly,get_repayment_schedule
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
    if request.method == 'POST': return add_member()
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
    
