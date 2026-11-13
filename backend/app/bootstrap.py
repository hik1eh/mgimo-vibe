"""Single-instance demo boot: migrate, seed without resetting, then serve."""
import os
import subprocess
import sys
from .config import ROOT

subprocess.run([sys.executable, '-m', 'alembic', '-c', str(ROOT / 'backend/alembic.ini'), 'upgrade', 'head'], check=True)
subprocess.run([sys.executable, '-m', 'app.seed'], check=True)
os.execvp(sys.executable, [sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'])
