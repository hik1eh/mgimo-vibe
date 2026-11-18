"""Generate a local environment without printing credentials. Standard library only."""
import argparse
import re
import secrets
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--db-port', default='5432', type=str)
parser.add_argument('--add-teacher', action='store_true', help='Add a teacher password to an existing .env')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
env_path = root / '.env'
teacher_line = f'DEMO_TEACHER_PASSWORD={secrets.token_urlsafe(20)}'
if args.add_teacher:
    if not env_path.exists():
        parser.error('Сначала создайте .env командой python scripts/init_env.py.')
    content = env_path.read_text(encoding='utf-8')
    teacher_setting = re.search(r'(?m)^[ \t]*(?:export[ \t]+)?DEMO_TEACHER_PASSWORD[ \t]*=([^\n]*)', content)
    if teacher_setting:
        if teacher_setting[1].split('#', 1)[0].strip() not in ('', '""', "''"):
            print('Демопароль преподавателя уже задан.')
            raise SystemExit(0)
        content = content[:teacher_setting.start()] + teacher_line + content[teacher_setting.end():]
        env_path.write_text(content, encoding='utf-8')
    else:
        with env_path.open('a', encoding='utf-8') as file:
            file.write(('' if content.endswith('\n') else '\n') + teacher_line + '\n')
    print('Демопароль преподавателя добавлен. Остальные настройки сохранены.')
    raise SystemExit(0)

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
{teacher_line}
'''
with env_path.open('x', encoding='utf-8') as file:
    file.write(content)
print('.env создан. Пароли не выведены; передайте демодоступы отдельно.')
