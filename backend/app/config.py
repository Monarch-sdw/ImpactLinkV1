"""Shared database configuration for local runs and hosted deployments."""
import os

DATABASE_KEYS = ('DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'DATABASE_DIRECT_URL', 'DATABASE_URL_UNPOOLED')
DIRECT_KEYS = ('DATABASE_DIRECT_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING')


def normalize_url(url):
    url = url.strip()
    if url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql+psycopg://', 1)
    if url.startswith('postgresql://'):
        return url.replace('postgresql://', 'postgresql+psycopg://', 1)
    return url


def first_value(keys, environment):
    return next((environment[key].strip() for key in keys if environment.get(key, '').strip()), None)


def database_url(environment=None):
    environment = os.environ if environment is None else environment
    value = first_value(DATABASE_KEYS, environment)
    if not value:
        if environment.get('VERCEL'):
            raise RuntimeError('A persistent PostgreSQL database is required. Connect a database in Vercel Storage, or set DATABASE_URL / POSTGRES_URL in Settings > Environment Variables for this deployment environment, then redeploy.')
        value = 'sqlite:///./impactlink.db'
    url = normalize_url(value)
    if environment.get('VERCEL') and not url.startswith('postgresql+psycopg://'):
        raise RuntimeError('Vercel requires a persistent PostgreSQL database. Use a postgres://, postgresql://, or postgresql+psycopg:// connection URL, not the local SQLite URL.')
    return url


def migration_url(environment=None):
    environment = os.environ if environment is None else environment
    value = first_value(DIRECT_KEYS, environment)
    if value:
        # Validate the override using the same rules as the runtime connection.
        return database_url({**environment, 'DATABASE_URL': value})
    return database_url(environment)


def deployment_errors(environment=None):
    environment = os.environ if environment is None else environment
    errors = []
    for resolver in (database_url, migration_url):
        try:
            resolver(environment)
        except RuntimeError as error:
            if str(error) not in errors:
                errors.append(str(error))
    if environment.get('VERCEL') and len(environment.get('JWT_SECRET', '')) < 32:
        errors.append('Set JWT_SECRET to a stable random secret of at least 32 characters in Vercel Settings > Environment Variables, then redeploy.')
    return errors
