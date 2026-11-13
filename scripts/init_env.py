"""Generate a local environment without printing credentials. Standard library only."""
import argparse
import secrets
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--db-port', default='5432', type=str)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
password = secrets.token_hex(24)
content = f'''POSTGRES_DB=dekanat
POSTGRES_USER=dekanat
POSTGRES_PASSWORD={password}
DATABASE_URL=postgresql+psycopg://dekanat:{password}@127.0.0.1:{args.db_port}/dekanat
APP_ORIGIN=http://localhost:8000
COOKIE_SECURE=false
SESSION_HOURS=12
DEMO_STUDENT_A_PASSWORD={secrets.token_urlsafe(20)}
DEMO_STUDENT_B_PASSWORD={secrets.token_urlsafe(20)}
DEMO_STAFF_PASSWORD={secrets.token_urlsafe(20)}
'''
with (root / '.env').open('x', encoding='utf-8') as file:
    file.write(content)
print('.env создан. Пароли не выведены; передайте демодоступы отдельно.')
