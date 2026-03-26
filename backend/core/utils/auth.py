from flask_jwt_extended import create_access_token,create_refresh_token
from datetime import timedelta


# def generate_access_token(user):
#     """
#     Central place for JWT creation.
#     Change expiry here only.
#     """
#     return create_access_token(
#         identity={
#             "phone": user.phone,
#             "role": user.role,
#             "name": user.name,
#         },
#         expires_delta=timedelta(hours=8),
#     )

def generate_access_token(user):
    """
    Central place for JWT creation.
    Access token = inactivity window
    Refresh token = session lifetime
    """

    access_token = create_access_token(
        identity={
            "phone": user.phone,
            "role": user.role,
            "name": user.name,
        },
        expires_delta=timedelta(minutes=5),  # ⏱ inactivity timeout
    )

    refresh_token = create_refresh_token(
        identity=user.phone,
        expires_delta=timedelta(hours=8),  # full session life
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }