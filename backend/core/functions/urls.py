
from flask import request
from flask_cors import cross_origin
from app import app
from .controller import get_settings,update_settings,add_member,get_members,update_member,delete_member



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
