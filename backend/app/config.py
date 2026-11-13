from pathlib import Path
from datetime import date
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / '.env', extra='ignore')
    database_url: str
    app_origin: str = 'http://localhost:8000'
    cookie_secure: bool = True
    session_hours: int = 12
    demo_student_a_password: str = ''
    demo_student_b_password: str = ''
    demo_staff_password: str = ''
    demo_date: date | None = None


settings = Settings()
