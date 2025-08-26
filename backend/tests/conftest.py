import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the src directory to the Python path
src_path = os.path.join(os.path.dirname(__file__), '..', 'src')
sys.path.insert(0, src_path)

from models import Base
from test_seeder import seed_test_data

@pytest.fixture(scope="session")
def test_engine():
    # Use SQLite in-memory DB for tests
    test_db_url = "sqlite:///:memory:"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def seeded_engine(test_engine):
    # Seed test data once for the session
    Session = sessionmaker(bind=test_engine)
    session = Session()
    try:
        seed_test_data(session)
        return test_engine
    finally:
        session.close()

@pytest.fixture(scope="function")
def db_session(seeded_engine):
    Session = sessionmaker(bind=seeded_engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
