import os
import sqlite3
import subprocess
import sys
from pathlib import Path

BACKEND=Path(__file__).resolve().parents[1]

def run_bootstrap(path, demo=True):
    env={**os.environ,'DATABASE_URL':'sqlite:///'+path.as_posix(),'DEMO_MODE':str(demo).lower()}
    env.pop('DATABASE_DIRECT_URL',None);env.pop('VERCEL',None)
    result=subprocess.run([sys.executable,'-m','app.bootstrap'],cwd=BACKEND,env=env,capture_output=True,text=True,timeout=60)
    assert result.returncode==0,result.stderr


def test_fresh_deploy_seeds_all_roles_and_preserves_edits_on_redeploy(tmp_path):
    path=tmp_path/'deploy.db';run_bootstrap(path)
    with sqlite3.connect(path) as db:
        assert db.execute('select version_num from alembic_version').fetchone()[0]=='0002'
        counts=[db.execute(f'select count(*) from {table}').fetchone()[0] for table in ['organizations','users','projects','offers']]
        assert counts[0]==93 and counts[2]==31 and counts[3]==15
        assert db.execute("select role from users where email='superadmin@impactlink.example'").fetchone()[0]=='super_admin'
        assert db.execute("select count(*) from organizations where listing_status='pending'").fetchone()[0]==2
        db.execute("update organizations set listing_status='approved',listing_note='A saved decision' where name like 'New Horizons%'")
        db.execute("update projects set title='Saved project edit' where id=1")
        db.commit()
    run_bootstrap(path)
    with sqlite3.connect(path) as db:
        assert counts==[db.execute(f'select count(*) from {table}').fetchone()[0] for table in ['organizations','users','projects','offers']]
        assert db.execute("select listing_note from organizations where name like 'New Horizons%'").fetchone()[0]=='A saved decision'
        assert db.execute('select title from projects where id=1').fetchone()[0]=='Saved project edit'


def test_demo_disabled_build_creates_schema_without_demo_logins(tmp_path):
    path=tmp_path/'empty.db';run_bootstrap(path,demo=False)
    with sqlite3.connect(path) as db:
        assert db.execute('select count(*) from users').fetchone()[0]==0
        assert db.execute('select version_num from alembic_version').fetchone()[0]=='0002'


def test_vercel_refuses_ephemeral_sqlite(tmp_path):
    env={**os.environ,'VERCEL':'1','DATABASE_URL':'sqlite:///'+(tmp_path/'invalid.db').as_posix()}
    result=subprocess.run([sys.executable,'-c','import app.db'],cwd=BACKEND,env=env,capture_output=True,text=True,timeout=10)
    assert result.returncode!=0
    assert 'persistent PostgreSQL database' in result.stderr
