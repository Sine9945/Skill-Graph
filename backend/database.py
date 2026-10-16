import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from models import Base


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)


Base.metadata.create_all(engine)


def ensure_schema():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "job" in table_names:
        columns = {column["name"] for column in inspector.get_columns("job")}
        if "is_active" not in columns:
            default_value = "TRUE" if engine.dialect.name == "postgresql" else "1"
            with engine.begin() as connection:
                connection.execute(
                    text(
                        f"ALTER TABLE job ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT {default_value}"
                    )
                )


ensure_schema()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()