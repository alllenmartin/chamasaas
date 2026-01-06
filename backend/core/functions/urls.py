
from flask import request
from flask_cors import cross_origin
from app import app
from .controller import get_settings,update_settings,add_member,get_members,update_member,delete_member,get_contributions,add_contribution,request_credit,get_credits,credit_members,update_credit_status,get_credit,generate_schedule,get_schedule,mark_paid



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
    
@app.route("/api/contributions", methods=['GET','POST'])
@cross_origin()
def contrbss():
    if request.method == 'GET': return get_contributions()
    if request.method == 'POST': return add_contribution()
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
@app.route("/api/credit/<loan_id>/schedule", methods=["GET","POST"])
@cross_origin()
def rep_schedule(loan_id):
    if request.method == 'GET': return get_schedule(loan_id)
    if request.method == 'POST': return generate_schedule(loan_id)
    else: return 'Method is Not Allowed'
    
@app.route("/api/repayment/<loan_id>/<int:installment_number>/pay", methods=["PATCH"])
@cross_origin()
def markpaid(loan_id,installment_number):
    if request.method == 'PATCH': return mark_paid(loan_id,installment_number)
    else: return 'Method is Not Allowed'
    
