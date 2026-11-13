from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class LoginIn(BaseModel):
    login: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class RequestIn(BaseModel):
    purpose: str = Field(min_length=3, max_length=500)
    idempotency_key: UUID

    @field_validator('purpose')
    @classmethod
    def strip_purpose(cls, value):
        if len(value.strip()) < 3:
            raise ValueError('Укажите место предъявления (от 3 символов).')
        return value.strip()


class TransitionIn(BaseModel):
    action: Literal['start', 'clarify', 'complete']
    version: int = Field(ge=1)
    text: str = Field(default='', max_length=2000)


class ReplyIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    version: int = Field(ge=1)

    @field_validator('text')
    @classmethod
    def strip_text(cls, value):
        if not value.strip():
            raise ValueError('Введите ответ.')
        return value.strip()
