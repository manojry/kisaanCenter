import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.connection import config
from db.init_db import db_initializer
from db.seeds.seed_data import db_seeder
from models import Base

@pytest.fixture(scope="session")
def test_engine():
    # Use a test database (can be in-memory or a dedicated test DB)
    test_db_url = config.database_url.replace(config.DB_NAME, config.DB_NAME + "_test")
    engine = create_engine(test_db_url)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(test_engine):
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture(scope="session", autouse=True)
def seed_test_data(test_engine):
    # Seed reference and test data for all tests
    db_initializer.initialize_database(create_db=False, create_tables=True)
    db_seeder.seed_all(include_test_data=True)
