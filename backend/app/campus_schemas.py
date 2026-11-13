from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, AwareDatetime


class AnnouncementFields(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    title: str = Field(min_length=3, max_length=160)
    text: str = Field(min_length=3, max_length=5000)
    audience: Literal['faculty', 'group']
    group_id: int | None = Field(default=None, ge=1)
    lesson_id: int | None = Field(default=None, ge=1)
    status: Literal['draft', 'published', 'withdrawn'] = 'draft'
    pinned: bool = False
    expires_at: AwareDatetime | None = None


class AnnouncementCreate(AnnouncementFields):
    idempotency_key: UUID


class AnnouncementEdit(AnnouncementFields):
    version: int = Field(ge=1)


class LessonEdit(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    version: int = Field(ge=1)
    action: Literal['update', 'cancel'] = 'update'
    reason: str = Field(min_length=3, max_length=500)
    starts_at: AwareDatetime | None = None
    ends_at: AwareDatetime | None = None
    building: str | None = Field(default=None, min_length=1, max_length=120)
    room: str | None = Field(default=None, min_length=1, max_length=40)
