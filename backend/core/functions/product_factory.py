def build_config(data):
    return {
        # ================= INTEREST =================
        "interest": {
            "type": data.get("interest_type"),
            "rate": data.get("interest_rate")
        },

        # ================= AMOUNT =================
        "amount": {
            "min": data.get("min_amount"),
            "max": data.get("max_amount")
        },

        # ================= TERM =================
        "term": {
            "min": data.get("min_term"),
            "max": data.get("max_term")
        },

        # ================= SECURITY =================
        "security": {
            "secured": data.get("secured", False),
            "guarantors_required": data.get("guarantors_required", 0),
            "requires_collateral": data.get("requires_collateral", False)
        },

        # ================= REPAYMENT =================
        "repayment": {
            "frequency": data.get("repayment_frequency"),
            "method": data.get("repayment_method"),
            "grace_period_days": data.get("grace_period_days", 0),
            "late_payment_rate": data.get("late_payment_rate"),
            "late_payment_type": data.get("late_payment_type"),
            "allow_reschedule": data.get("allow_reschedule", False),
            "allow_early_repayment": data.get("allow_early_repayment", True),
            "early_repayment_penalty": data.get("early_repayment_penalty")
        },

        # ================= GL =================
        "gl": data.get("gl", {}),

        # ================= RULES =================
        "rules": data.get("rules", []),

        # ================= CHARGES =================
        "charges": data.get("charges", [])
    }