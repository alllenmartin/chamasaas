from core import create_app

app = create_app()  # Will use FLASK_CONFIG env var or 'development' by default



# Applications Routes
from core.functions import urls
from core.accounts import urls



@app.route('/')
def hello():
    return "Hello Worvvvld!"

if __name__ == "__main__":
    app.run()