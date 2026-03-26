
import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    JWT_SECRET_KEY= os.urandom(24)
    SECRET_KEY = os.urandom(24)
    MOBITECH_URL = "https://app.mobitechtechnologies.com//sms/sendsms"
    MOBITECH_API_KEY = "e0b77a231c87496086e5fa578977b0bb951dc52526e27697c1215e713fe9df57"
class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    # SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:10224@localhost:5432/eveshop_db'
    # DEVELOPMENT_DATABASE_URL = 'postgresql://postgres:10224@localhost:5432/eveshop'
    # SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost:3306/chama"
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:10224@localhost:5432/chama'
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = "martinallen722@gmail.com"
    MAIL_PASSWORD = "xugu lljy lxpo khqr"

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL")
class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv("STAGING_DATABASE_URL")
class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("PRODUCTION_DATABASE_URL")
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "staging": StagingConfig,
    "production": ProductionConfig
    }
