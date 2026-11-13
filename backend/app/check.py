"""Run integration tests only against an explicitly separate *_test database."""
import os
import subprocess
import sys
from sqlalchemy.engine import make_url
from .config import ROOT, settings

url = make_url(settings.database_url)
target = os.environ.get('TEST_DATABASE_URL') or url.set(database=f'{url.database}_test').render_as_string(hide_password=False)
if not (make_url(target).database or '').endswith('_test'):
    raise SystemExit('Тестовая база должна оканчиваться на _test.')
env = dict(os.environ, TEST_DATABASE_URL=target)
result = subprocess.run([sys.executable, '-m', 'pytest', str(ROOT / 'backend/tests'), '-q', '-p', 'no:cacheprovider'], env=env)
raise SystemExit(result.returncode)
