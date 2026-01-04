
# app/__init__.py

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from marshmallow import Schema, fields, ValidationError
from .config import config  # assuming config is a dictionary of config classes
from flask_mail import Mail
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()
mail = Mail()
cors=CORS()
jwt = JWTManager()



def create_app(config_mode=None):
    if config_mode is None:
        # fallback to environment variable or default
        config_mode = os.getenv('FLASK_CONFIG', 'development')

    if config_mode not in config:
        raise ValueError(f"Invalid config mode: {config_mode}")

    app = Flask(__name__)
    app.config.from_object(config[config_mode])

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    jwt.init_app(app) 
   

    from core.accounts.models import User
    # from core.budget.models import Wallet
   


    return app
