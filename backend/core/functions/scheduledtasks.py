# from datetime import date
# from .models import ChamaSettings

# def get_penalty_rate():
#     settings = ChamaSettings.query.first()
#     return float(settings.penalty_rate) if settings and settings.penalty_rate else 0.0

# def apply_penalty_if_overdue(r):
#     if r.paid:
#         return

#     if date.today() <= r.due_date:
#         return

#     if r.penalty_applied_at:
#         return

#     penalty_rate = get_penalty_rate()

#     if penalty_rate <= 0:
#         return

#     # penalty_rate is a percentage (e.g. 2 means 2%)
#     r.penalty = round(r.total * (penalty_rate / 100), 2)
#     r.penalty_applied_at = date.today()
    
    

