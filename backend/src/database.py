from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

MYSQL_USER = 'your_user'
MYSQL_PASSWORD = 'your_password'
MYSQL_HOST = 'localhost'
MYSQL_DB = 'market_db'

DATABASE_URL = f"mysql+mysqlconnector://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
