import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_filename = "salesvision.db"
    # Try to use current directory, fall back to temp directory if not writable
    try:
        test_file = "./.db_write_test"
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        DATABASE_URL = f"sqlite:///./{db_filename}"
    except Exception:
        temp_db_path = os.path.join(tempfile.gettempdir(), db_filename)
        DATABASE_URL = f"sqlite:///{temp_db_path}"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
