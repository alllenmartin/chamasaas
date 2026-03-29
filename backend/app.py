from core import create_app
import os
from core.functions.scheduler import start_scheduler

app = create_app()  # Will use FLASK_CONFIG env var or 'development' by default



# Applications Routes
from core.functions import urls
from core.accounts import urls



@app.route('/')
def hello():
    return "Hello Worvvvld!"

if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_scheduler()    
    app.run(debug=True)