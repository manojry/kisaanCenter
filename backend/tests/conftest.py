import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.src.db.connection import config
from backend.src.db.init_db import db_initializer
from backend.src.db.seeds.seed_data import db_seeder
from backend.src.models import Base

@pytest.fixture(scope="session")
def test_engine():
    # Use a test database (can be in-memory or a dedicated test DB)
    # Use SQLite in-memory DB for tests to avoid external dependencies
    test_db_url = "sqlite:///:memory:"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
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
