# Цифровой деканат · локальная приёмка интерфейса

Рабочая матрица по `docs/frontend-final-mvp.md`. Проверочные экземпляры созданы в выделенной PostgreSQL для QA. Вход выполняется штатными аккаунтами из окружения.

| Экран | Маршрут | Источник данных | Проверенное действие | Десктоп / телефон |
|---|---|---|---|---|
| Вход | `/` без сессии | `auth/csrf`, `auth/login`, `me` | Войти, обработать ожидание и ошибку | [1440](../artifacts/browser/final-mvp/screens/login-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/login-390.jpg) |
| Сегодня | `/today` | `study-context`, `announcements`, `schedule`, `academic-results`, `requests` | Листать ленту, открыть ближайшее действие | [1440](../artifacts/browser/final-mvp/screens/today-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/today-390.jpg) |
| Новость | Диалог `/today`, `/announcements/:id` | `announcements/{id}` | Прочитать и открыть занятие | [1440](../artifacts/browser/final-mvp/screens/news-dialog-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/news-dialog-390.jpg) · Карточка [1440](../artifacts/browser/final-mvp/screens/news-detail-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/news-detail-390.jpg) |
| Все объявления | `/announcements` | `announcements` | Найти адресную публикацию | [1440](../artifacts/browser/final-mvp/screens/news-list-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/news-list-390.jpg) |
| Расписание · день | `/schedule?view=day` | `study-context`, `schedule` | День, дата, три фильтра | [1440](../artifacts/browser/final-mvp/screens/schedule-day-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/schedule-day-390.jpg) |
| Расписание · неделя | `/schedule?view=week` | `schedule` | Неделя, дата, открыть ячейку | [1440](../artifacts/browser/final-mvp/screens/schedule-week-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/schedule-week-390.jpg) |
| Занятие | `/schedule/:id` | `schedule/{id}` | Аудитория, история, открыть маршрут | [1440](../artifacts/browser/final-mvp/screens/lesson-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/lesson-390.jpg) |
| Маршрут | `/schedule/:id/route` | `schedule/{id}/route` | Первый этаж, лифт, дверь актуальной аудитории | [1440](../artifacts/browser/final-mvp/screens/route-entry-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/route-entry-390.jpg) · 4-й этаж [1440](../artifacts/browser/final-mvp/screens/route-412-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/route-412-390.jpg) |
| Оценки и сессия | `/academic-results` | `academic-results?semester=` | Выбрать семестр, сверить прогресс | [1440](../artifacts/browser/final-mvp/screens/results-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/results-390.jpg) |
| Итоги семестра | Диалог `/academic-results` | Тот же ответ API | Перейти между тремя историями | [1440](../artifacts/browser/final-mvp/screens/stories-progress-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/stories-progress-390.jpg) · Результаты [1440](../artifacts/browser/final-mvp/screens/stories-results-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/stories-results-390.jpg) · Следующие даты [1440](../artifacts/browser/final-mvp/screens/stories-next-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/stories-next-390.jpg) |
| Заявки и справки | `/requests` (студент) | `requests` | Фильтровать статус, выбрать заявку | [1440](../artifacts/browser/final-mvp/screens/requests-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/requests-390.jpg) |
| Новая заявка | `/requests/new` | `me`, `POST requests` | Заполнить, отправить, увидеть номер | [1440](../artifacts/browser/final-mvp/screens/request-new-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/request-new-390.jpg) |
| Детали заявки | `/requests/:id` (студент) | `requests/{id}`, `reply`, `document` | Этапы, уточнение, скачать PDF | [1440](../artifacts/browser/final-mvp/screens/request-ready-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/request-ready-390.jpg) · После скачивания [1440](../artifacts/browser/final-mvp/screens/request-downloaded-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/request-downloaded-390.jpg) |
| Уведомления | `/notifications` | `notifications`, адресные объявления и ближайший контроль | Открыть связанный объект, прочитать | [1440](../artifacts/browser/final-mvp/screens/notifications-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/notifications-390.jpg) |
| Профиль | `/profile` (студент) | `me` | Пропуск, раскрыть данные | [1440](../artifacts/browser/final-mvp/screens/profile-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/profile-390.jpg) · Раскрыт [1440](../artifacts/browser/final-mvp/screens/profile-expanded-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/profile-expanded-390.jpg) |
| Редактирование профиля | Форма `/profile` | `PATCH me/contacts` | Проверить поля и сохранить | [1440](../artifacts/browser/final-mvp/screens/profile-edit-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/profile-edit-390.jpg) |
| Рабочий экран | `/requests` (сотрудник) | `staff/requests`, `staff/groups` | Выбрать очередь и фильтры | [1440](../artifacts/browser/final-mvp/screens/staff-queue-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-queue-390.jpg) |
| Очередь и обработка | `/requests/:id` (сотрудник) | `staff/requests/{id}`, `transitions` | Начать, уточнить, выдать справку | [1440](../artifacts/browser/final-mvp/screens/staff-request-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-request-390.jpg) |
| Объявления | `/staff/announcements` | `staff/announcements` | Найти публикации факультета | [1440](../artifacts/browser/final-mvp/screens/staff-news-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-news-390.jpg) |
| Форма объявления | `/staff/announcements/new`, `/staff/announcements/:id` | `staff/groups`, `staff/schedule`, `staff/announcements` | Сохранить или опубликовать | [1440](../artifacts/browser/final-mvp/screens/staff-news-new-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-news-new-390.jpg) · Редактирование [1440](../artifacts/browser/final-mvp/screens/staff-news-edit-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-news-edit-390.jpg) |
| Расписание сотрудника | `/staff/schedule` | `staff/schedule` | Найти занятие группы | [1440](../artifacts/browser/final-mvp/screens/staff-schedule-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-schedule-390.jpg) |
| Правка занятия | `/staff/schedule/:id` | `staff/schedule/{id}` | Перенести или отменить | [1440](../artifacts/browser/final-mvp/screens/staff-lesson-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-lesson-390.jpg) |
| Успеваемость сотрудника | `/staff/academic-results` | Сводка `staff/academic-results` | Отобрать группу, увидеть публикации | [1440](../artifacts/browser/final-mvp/screens/staff-results-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-results-390.jpg) |
| Профиль сотрудника | `/profile` (сотрудник) | `me` | Сверить роль и факультет | [1440](../artifacts/browser/final-mvp/screens/staff-profile-1440.jpg) / [390](../artifacts/browser/final-mvp/screens/staff-profile-390.jpg) |

## Компоненты и данные

- `section-banner.tsx`, `campus-object.tsx`, `campus-canvas.tsx` и `campus-geometry.ts` отвечают за общую шапку, загрузку рендера и семь объёмных объектов. `campusGeometry` строит стены, ступени, стёкла, крышу и крылья. `positionCamera` двигает камеру между ракурсами. Снимки сделаны с одного WebGL-объекта. [Геометрия](../frontend/src/campus-geometry.ts) · [Камера](../frontend/src/campus-canvas.tsx#L26) · [Ракурс 1](../artifacts/browser/final-mvp/screens/campus-angle-a.png) · [Ракурс 2](../artifacts/browser/final-mvp/screens/campus-angle-b.png)
- `news-feed.tsx`, `study.tsx`, `lesson-route.tsx` связывают доску новостей, календарь и план. Серверный `campus_map.py` строит путь от входа по графу коридоров и лифта. Фильтры и обратные переходы сохраняют дату и устойчивые идентификаторы.
- `semester-stories.tsx` показывает прогресс, опубликованные результаты и даты контроля из выбранного семестра. `student-profile.tsx` получает учебные сведения из `me` и сохраняет только разрешённые контакты. `staff-results.tsx` читает сводку своего факультета.
- `requests.tsx`, `notifications.tsx` и `staff.tsx` показывают этапы справки, входящие события и рабочие действия сотрудника. `final-mvp.css` задаёт общую палитру, типографику, варианты компонентов и мобильное представление.
- Миграция `d30c92a74fc1` переносит текущие аудитории и преподавателей в справочники, добавляет контактные поля, краткий факт объявления и типизированные связи уведомлений. API сохраняет прежние подписи преподавателя и аудитории для существующих клиентов.

## Локальный запуск и проверка

```powershell
cd E:\mgimo-vibe\dekanat-handoff
docker compose up --build -d --wait
docker compose ps
```

Откройте [кабинет](http://localhost:8000) и обновите вкладку через Ctrl+F5. При первом запуске создайте `.env` через `python scripts/init_env.py`. Приложение применяет Alembic и идемпотентное демонаполнение при старте. Доступы остаются в окружении.

```powershell
npm.cmd --prefix frontend test
docker compose -p dekanat-qa -f compose.qa.yaml up --build -d --wait db app
docker compose -p dekanat-qa -f compose.qa.yaml build browser
docker compose -p dekanat-qa -f compose.qa.yaml exec -T app python -m app.qa --reset-test-data
docker compose -p dekanat-qa -f compose.qa.yaml exec -T app python -m alembic -c /app/backend/alembic.ini check
docker compose -p dekanat-qa -f compose.qa.yaml run --rm --no-deps browser npx playwright test auth.spec.ts cabinet-header.spec.ts compatibility.spec.ts evidence.spec.ts final-mvp.spec.ts layout.spec.ts premium.spec.ts states.spec.ts student-redesign.spec.ts workflow.spec.ts
```

Для интеграционных тестов один раз создайте отдельную базу `dekanat_mvp_test` в QA PostgreSQL. Если вы поменяли `POSTGRES_USER`, подставьте его в команду вместо `dekanat`.

```powershell
docker compose -p dekanat-qa -f compose.qa.yaml exec -T db createdb -U dekanat dekanat_mvp_test
@'
import os
from sqlalchemy.engine import make_url
os.environ['TEST_DATABASE_URL'] = make_url(os.environ['DATABASE_URL']).set(database='dekanat_mvp_test').render_as_string(hide_password=False)
from app import check
'@ | docker compose -p dekanat-qa -f compose.qa.yaml exec -T -e PYTEST_ADDOPTS=--tb=short app python
```

Отдельный тест `persistence.spec.ts` удерживает две сессии во время остановки и запуска QA app/db. В другом терминале после READY выполните команды из [инструкции запуска](../RUNNING.md#повторить-браузерные-проверки-в-изолированном-docker).

Для повтора видеосценариев подготовьте чистые вымышленные записи командой `app.qa --reset-test-data` из блока выше. Скрипт сброса проверяет точное имя QA-базы. Затем запустите:

```powershell
docker compose -p dekanat-qa -f compose.qa.yaml run --rm --no-deps browser node demo-videos.cjs
```

## Результаты 18 ноября 2026

| Проверка | Фактический результат |
|---|---|
| FastAPI и PostgreSQL | 40 тестов прошли на финальном образе. Проверены контакты и серверная изоляция профилей, заявок, PDF, расписания и действий сотрудника. Осталось предупреждение Starlette об устаревшем имени AnyIO BlockingPortal. |
| Схема и миграция | `alembic check` подтвердил соответствие схемы моделям. На основном экземпляре сверены существующая заявка, два занятия и четыре строки успеваемости. |
| Сборка и модульные проверки | TypeScript/Vite собраны в Docker, 12 модульных тестов прошли. Отдельный динамический модуль 3D весит 563,5 КБ после минификации и 144,4 КБ с gzip. Vite отметил превышение порога 500 КБ. |
| Браузеры | Пройдено 53 уникальных сценария с учётом повторных запусков и рестарта. Chromium проверен на 360, 390, 768, 1024, 1440 и 1916 px, WebKit на 360 px, Firefox на 1440 px. |
| Матрица экранов | 24 строки, 65 кадров с двумя ракурсами 3D. На 1440 и 390 px использованы реальные ответы QA-сервера. Только часы браузера на «Сегодня» фиксировались на 08:00 Москвы для показа ближайшего занятия на сохранённой учебной неделе. |
| Доступность | Проверены axe, клавиатура, Escape и возврат фокуса, reduced motion, свайп, отсутствие горизонтального переполнения, длинные русские подписи, 200% базового текста. В финальном пути скачивания отдельно проверен контраст подтверждения. |
| Сохранность | Браузерная проверка после остановки и запуска QA app/db прошла. Сравнены две прежние сессии и восемь групп ответов API. [Заявка после перезапуска](../artifacts/browser/after/persisted-after-docker-restart.png) |

В первом общем прогоне прошли 46 из 52 тестов. Повтор `auth.spec.ts layout.spec.ts --grep 'auth|all seven|photo stream|keyboard feed'` дал 12/12, включая шесть ранее упавших проверок. Уточнены подсчёт семи фото, проверка неподвижной камеры и управление лентой при разных указателях. После дополнительной правки контраста финальный прогон `final-mvp.spec.ts workflow.spec.ts` дал 4/4. Сбой кеша Docker при параллельной сборке устранён последовательной сборкой app и browser.

Отчёты Playwright доступны для [общего прогона](../artifacts/browser/final-mvp/results-full-round-1.json), [повтора](../artifacts/browser/final-mvp/results-followup.json), [рестарта](../artifacts/browser/final-mvp/results-persistence.json) и [финальных сценариев](../artifacts/browser/final-mvp/results-final-targeted.json).

### Записи сквозных сценариев

- Сотрудник меняет аудиторию с 305 на 412 и публикует объявление для группы. Студент открывает уведомление и проходит от входа до двери 412 с переключением на четвёртый этаж. [Видео переноса и маршрута · 18 с](../artifacts/browser/final-mvp/video/lesson-move-and-route.webm)
- Студент заказывает справку, сотрудник выдаёт её, студент через уведомление скачивает PDF. [Видео справки · 16 с](../artifacts/browser/final-mvp/video/certificate-and-pdf.webm) · [Загруженный образец](../artifacts/browser/final-mvp/video/certificate-demo.pdf)

Оба WebM воспроизведены в Chromium в размере 1280×900. Запись начинается после входа. Финальные кадры показывают выделенную аудиторию 412 и подтверждение скачивания.

### Границы проверки

- Поэтажный план охватывает 210, 305 и 412 в Северном корпусе. Для остальных мест карточка показывает имеющиеся сведения о корпусе и аудитории.
- У `staff.a` доступ к сводной успеваемости своего факультета в режиме чтения. Публикация оценок потребует отдельного разрешения. В каталоге заявок доступна справка об обучении.
- Мобильные результаты получены в эмуляции браузеров. Проверка физического телефона, ручного скринридера и публичного адреса остаётся за рамками локального прогона.
