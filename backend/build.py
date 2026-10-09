"""Vercel build entrypoint with explicit, secret-free setup diagnostics."""
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))


def main():
    os.chdir(ROOT)
    from app.config import deployment_errors
    errors = deployment_errors()
    if errors:
        print('\nImpactLink deployment configuration is incomplete:', file=sys.stderr)
        for error in errors:
            print(' - ' + error, file=sys.stderr)
        print('See DEPLOYMENT.md. No database credentials are printed.', file=sys.stderr)
        return 1
    print('ImpactLink: applying database migrations and preparing demo accounts.', flush=True)
    try:
        from app.bootstrap import bootstrap
        bootstrap()
    except ModuleNotFoundError as error:
        print(f'ImpactLink build dependency is missing: {error.name}. Use the backend FastAPI service and its requirements.txt.', file=sys.stderr)
        return 1
    except Exception as error:
        # Database exceptions may contain connection details; report safe identifiers.
        print(f'ImpactLink database setup failed ({type(error).__name__}).', file=sys.stderr)
        code = getattr(getattr(error, 'orig', None), 'sqlstate', None)
        if code:
            print(f'PostgreSQL error code: {code}', file=sys.stderr)
        print('Check the connection URL, SSL parameters, database availability, and migration permissions. For a transaction pooler, also provide DATABASE_DIRECT_URL, DATABASE_URL_UNPOOLED, or POSTGRES_URL_NON_POOLING.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
