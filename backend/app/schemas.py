import re
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator
from .request_types import RequestKind


class LoginIn(BaseModel):
    login: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class ContactsIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    contact_email: str | None = Field(max_length=254)
    contact_phone: str | None = Field(max_length=32)

    @field_validator('contact_email')
    @classmethod
    def email(cls, value):
        if value and not re.fullmatch(r'[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+', value):
            raise ValueError('Укажите корректный адрес электронной почты.')
        return value or None

    @field_validator('contact_phone')
    @classmethod
    def phone(cls, value):
        if value and (not re.fullmatch(r'\+?[0-9 ()-]+', value) or not 7 <= sum(c.isdigit() for c in value) <= 15):
            raise ValueError('Укажите телефон с 7–15 цифрами.')
        return value or None


class RequestIn(BaseModel):
    kind: RequestKind = RequestKind.STUDY
    purpose: str = Field(min_length=3, max_length=500)
    idempotency_key: UUID

    @field_validator('purpose')
    @classmethod
    def strip_purpose(cls, value, info: ValidationInfo):
        if len(value.strip()) < 3:
            message = ('Укажите место предъявления' if info.data.get('kind') == RequestKind.STUDY
                       else 'Укажите детали заявки')
            raise ValueError(f'{message} (от 3 символов).')
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


class JournalIn(BaseModel):
    model_config = ConfigDict(extra='forbid')
    attendance: Literal['present', 'absent'] | None
    checkpoint: Literal['completed', 'pending'] | None
    version: int = Field(ge=0)
