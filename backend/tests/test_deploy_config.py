import os
import subprocess
import sys
from pathlib import Path
import pytest
from app.config import DATABASE_KEYS, database_url, migration_url, deployment_errors


@pytest.mark.parametrize('key', DATABASE_KEYS)
def test_hosted_database_aliases(key):
    env={'VERCEL':'1', key:' postgres://user:password@localhost/example?sslmode=require '}
    assert database_url(env)=='postgresql+psycopg://user:password@localhost/example?sslmode=require'


def test_empty_primary_uses_provider_variable():
    assert database_url({'VERCEL':'1','DATABASE_URL':'  ','POSTGRES_URL':'postgres://host/db'}).endswith('host/db')


def test_runtime_and_migrations_choose_the_correct_connections():
    env={'VERCEL':'1','DATABASE_URL':'postgres://pool/db','POSTGRES_URL':'postgres://other/db','POSTGRES_URL_NON_POOLING':'postgres://direct/db'}
    assert database_url(env).endswith('pool/db')
    assert migration_url(env).endswith('direct/db')
    env['DATABASE_DIRECT_URL']='postgres://explicit/db'
    assert migration_url(env).endswith('explicit/db')


def test_missing_hosted_settings_produce_actionable_errors_without_values():
    errors=deployment_errors({'VERCEL':'1'})
    assert len(errors)==2
    assert 'DATABASE_URL / POSTGRES_URL' in errors[0]
    assert 'JWT_SECRET' in errors[1]
    assert deployment_errors({'VERCEL':'1','DATABASE_URL':'postgres://localhost/db','JWT_SECRET':'x'*32})==[]
    with pytest.raises(RuntimeError,match='persistent PostgreSQL'):
        database_url({'VERCEL':'1','DATABASE_URL':'sqlite:///local.db'})


def test_build_reports_missing_settings_before_importing_database():
    root=Path(__file__).resolve().parents[1]
    env={k:v for k,v in os.environ.items() if k not in (*DATABASE_KEYS,'JWT_SECRET')}
    env['VERCEL']='1'
    result=subprocess.run([sys.executable,str(root/'build.py')],cwd=root.parent,env=env,capture_output=True,text=True,timeout=15)
    assert result.returncode==1
    assert 'configuration is incomplete' in result.stderr
    assert 'DATABASE_URL / POSTGRES_URL' in result.stderr
    assert 'JWT_SECRET' in result.stderr
    assert 'Traceback' not in result.stderr


def test_build_entrypoint_migrates_and_seeds_from_any_working_directory(tmp_path):
    import sqlite3
    root=Path(__file__).resolve().parents[1]
    env={k:v for k,v in os.environ.items() if k not in (*DATABASE_KEYS,'VERCEL')}
    path=tmp_path/'build.db'
    env.update(DATABASE_URL='sqlite:///'+path.as_posix(),DEMO_MODE='true')
    result=subprocess.run([sys.executable,str(root/'build.py')],cwd=root.parent,env=env,capture_output=True,text=True,timeout=60)
    assert result.returncode==0,result.stderr
    with sqlite3.connect(path) as db:
        assert db.execute('SELECT version_num FROM alembic_version').fetchone()[0]=='0002'
        assert db.execute("SELECT role FROM users WHERE email='superadmin@impactlink.example'").fetchone()[0]=='super_admin'
