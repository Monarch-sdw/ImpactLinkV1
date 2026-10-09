import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

load_dotenv()
def normalize_url(url):
    if url.startswith('postgres://'): return url.replace('postgres://','postgresql+psycopg://',1)
    if url.startswith('postgresql://'): return url.replace('postgresql://','postgresql+psycopg://',1)
    return url

URL = normalize_url(os.getenv('DATABASE_URL', 'sqlite:///./impactlink.db'))
if os.getenv('VERCEL') and not URL.startswith('postgresql'):
    raise RuntimeError('Set DATABASE_URL to a persistent PostgreSQL database before deploying to Vercel.')
engine_options={'poolclass':NullPool} if os.getenv('VERCEL') else {}
engine = create_engine(URL, connect_args={'check_same_thread': False, 'timeout': 30} if URL.startswith('sqlite') else {'prepare_threshold':None}, pool_pre_ping=True, **engine_options)
if URL.startswith('sqlite'):
    @event.listens_for(engine, 'connect')
    def sqlite_setup(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')
        connection.execute('PRAGMA journal_mode=WAL')

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
class Base(DeclarativeBase):
    pass

def get_db():
    with SessionLocal() as session:
        yield session
