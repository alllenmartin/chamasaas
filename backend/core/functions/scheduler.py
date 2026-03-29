# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, timedelta

scheduler = BackgroundScheduler()

def start_scheduler():
    # Lazy import to avoid circular import
    from app import db
    from core.functions.controller import (
        calculate_daily_interest_for_today,
        post_monthly_interest
    )

    # 🟢 Run daily at 00:05
    scheduler.add_job(
        func=calculate_daily_interest_for_today,
        trigger="cron",
        hour=0,
        minute=5
    )

    # 🟡 Run month-end (last day of month)
    scheduler.add_job(
        func=post_monthly_interest,
        trigger="cron",
        day="last",
        hour=23,
        minute=55
    )

    scheduler.start()