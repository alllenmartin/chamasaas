
from flask import request
from flask_cors import cross_origin
from app import app
from .controller import create_user,login





@app.route("/api/register", methods=['POST'])
@cross_origin()
def user_accounts():
    if request.method == 'POST': return create_user()
    else: return 'Method is Not Allowed'
    

@app.route("/api/login", methods=['POST'])
@cross_origin()
def get_accounts():
    if request.method == 'POST': return login()
    else: return 'Method is Not Allowed'