
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
from apscheduler.schedulers.background import BackgroundScheduler


db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()
mail = Mail()
cors=CORS()
jwt = JWTManager()
scheduler = BackgroundScheduler()



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
    
       # Schedule cron jobs AFTER app & db are ready
    # -------------------------------
    from core.functions.cron_jobs import apply_daily_penalties,notify_upcoming_repayments,post_transactions

    scheduler.add_job(
        func=lambda: apply_daily_penalties(app),  # pass app if needed
        trigger="cron",
        hour=0,
        minute=5,
        id="daily_penalty_job",
        replace_existing=True
    )
    
      # Notify members 7 days before due date every day at 09:00
    scheduler.add_job(
        func=lambda: notify_upcoming_repayments(app, days_before=7),
        trigger="cron",
        hour=9,
        minute=0,
        # trigger="interval",
        # minutes=1, 
        id="repayment_notification_job",
        replace_existing=True
    )

    
    scheduler.add_job(
        func=lambda: post_transactions(app),
        # trigger="cron",
        # hour=9,
        # minute=0,
        trigger="interval",
        minutes=1, 
        id="post_transactions",
        replace_existing=True
    )
    scheduler.start()
    # -------------------------------
   
 


    return app
