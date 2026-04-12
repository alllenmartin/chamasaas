# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from flask import current_app

scheduler = BackgroundScheduler()

def start_scheduler():

    from app import create_app
    from core.functions.controller import (
        calculate_daily_interest_for_today,
        post_monthly_interest
    )

    app = create_app()

    # 🟢 Daily job
    scheduler.add_job(
        func=lambda: run_with_context(app, calculate_daily_interest_for_today),
        trigger="cron",
        hour=19,
        minute=29
    )

    # 🟡 Month-end job
    scheduler.add_job(
        func=lambda: run_with_context(app, post_monthly_interest),
        trigger="cron",
        day="last",
        hour=19,
        minute=30
    )

    scheduler.start()


def run_with_context(app, func):
    with app.app_context():
        func(date.today())