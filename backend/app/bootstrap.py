"""Repeatable deploy setup: migrate first, then add missing fictional demo data."""
from pathlib import Path
import os
from alembic import command
from alembic.config import Config
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool
from .db import engine, normalize_url
from .seed import seed

def bootstrap():
    root=Path(__file__).resolve().parents[1]
    config=Config(str(root/'alembic.ini'))
    config.set_main_option('script_location',str(root/'migrations'))
    # Session advisory locks need a direct connection, not a transaction pooler.
    direct_url=os.getenv('DATABASE_DIRECT_URL')
    migration_engine=create_engine(normalize_url(direct_url),poolclass=NullPool) if direct_url else engine
    with migration_engine.connect() as connection:
        postgres=connection.dialect.name=='postgresql'
        if postgres:
            # Serialize migrations/seeding across concurrent deployment builds.
            connection.execute(text('SELECT pg_advisory_lock(170037)'))
            connection.commit()
        try:
            config.attributes['connection']=connection
            command.upgrade(config,'head')
            with Session(bind=connection,expire_on_commit=False) as session:
                seed(session)
        finally:
            if postgres:
                connection.rollback()
                connection.execute(text('SELECT pg_advisory_unlock(170037)'))
                connection.commit()
    print('Database ready.')

if __name__=='__main__': bootstrap()
