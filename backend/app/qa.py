"""Reset only the explicitly named disposable end-to-end test database."""
import argparse
from sqlalchemy import text
from .db import engine, Base, SessionLocal
from . import models
from .seed import demo_credentials, seed

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--reset-test-data', action='store_true', required=True)
parser.parse_args()
if engine.url.database != 'dekanat_e2e_test':
    raise SystemExit('Refusing reset: expected dedicated dekanat_e2e_test database.')
tables = ', '.join('"' + table.name + '"' for table in Base.metadata.sorted_tables)
with engine.begin() as connection:
    connection.execute(text(f'TRUNCATE {tables} RESTART IDENTITY CASCADE'))
with SessionLocal() as db:
    seed(db, demo_credentials())
print('Disposable QA data initialized. Main database untouched.')
