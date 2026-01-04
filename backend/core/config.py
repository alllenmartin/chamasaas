
import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    JWT_SECRET_KEY= os.urandom(24)
    SECRET_KEY = os.urandom(24)
class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    # SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:10224@localhost:5432/eveshop_db'
    # DEVELOPMENT_DATABASE_URL = 'postgresql://postgres:10224@localhost:5432/eveshop'
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost:3306/chama"
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
