from core import create_app
import os
from core.functions.scheduler import start_scheduler
from flask import Flask, g


app = create_app()  # Will use FLASK_CONFIG env var or 'development' by default



# Applications Routes
from core.functions import urls
from core.accounts import urls
from core.functions import audit_events

def set_user():
    from flask import g, request
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

    g.user_id = None

    try:
        verify_jwt_in_request(optional=True)

        identity = get_jwt_identity()
        print('oyttyihtyhnjk')
        if identity is not None:
            g.user_id = identity
            

    except:
        print('error')



@app.route('/')
def hello():
    return "Hello Worvvvld!"

if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_scheduler()    
    app.run(debug=True)