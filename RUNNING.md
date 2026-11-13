# Цифровой деканат — запуск и проверка

## Рабочая реализация T01–T03

Код находится в этой папке: `backend/` — FastAPI + SQLAlchemy + Alembic, `frontend/` — React + TypeScript + Vite. Хранение — PostgreSQL. Работают вход, выход, профиль, создание справки, список и карточка, очередь факультета, уточнение, ответ, история, уведомления и защищённый демонстрационный PDF. Справка не имеет юридической силы, все профили вымышлены.

### Запуск с чистого клона через Docker Compose

Нужны Docker Engine с Compose v2 и Python 3.11+ только для создания локального окружения. Команды выполняются из `dekanat-handoff` (корня приложения).

```powershell
python scripts/init_env.py
docker compose up --build -d
docker compose logs -f app
```

Если команда `python` указывает на неработающий Windows Store alias, используйте полный путь к установленному Python. Скрипт создаёт `.env` со случайными паролями и не выводит их. При существующем `.env` он завершается без перезаписи. Альтернатива — заполнить `.env.example` и сохранить как `.env`; значения `POSTGRES_PASSWORD` и пароль в `DATABASE_URL` должны совпадать. Для URL используйте URL-кодирование специальных символов; генератор выдаёт безопасные для URL значения.

Откройте **http://localhost:8000**. API и собранный интерфейс работают на одном origin. Сервис `app` ждёт готовности базы, выполняет `alembic upgrade head`, идемпотентное демонаполнение и запускает Uvicorn. База хранится в именованном томе `postgres_data`. Повторный запуск и `docker compose down` сохраняют данные. В первой версии предусмотрен один экземпляр приложения при запуске миграций.

Логины: `student.a` — Алина Ветрова, группа ОН-201; `student.b` — Марк Леснов, группа ЦТ-202; `staff.a` — Ирина Речная, сотрудник факультета общественных наук. Пароли берутся из `DEMO_STUDENT_A_PASSWORD`, `DEMO_STUDENT_B_PASSWORD`, `DEMO_STAFF_PASSWORD`. Команда передаёт демодоступы жюри отдельно. Seed не меняет уже существующие пароли, профили и пользовательские заявки.

### Локальный запуск без Docker

Нужны Python 3.11+, Node.js 22+ и PostgreSQL 17+. Создайте постоянную базу `dekanat` и отдельного пользователя с правами на неё. Заполните `DATABASE_URL` в `.env`; для локального подключения рекомендуется `127.0.0.1`. Команды PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe scripts/init_env.py
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
$env:PYTHONPATH = 'backend'
.\.venv\Scripts\python.exe -m alembic -c backend/alembic.ini upgrade head
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Перед миграцией отредактируйте `.env` под свою базу. Если `.env` уже подготовлен, пропустите `init_env.py`. В macOS/Linux замените `.venv\Scripts\python.exe` на `.venv/bin/python`, `npm.cmd` на `npm`, задайте `export PYTHONPATH=backend`.

Для разработки с Vite: установите `APP_ORIGIN=http://127.0.0.1:5173` в `.env`, перезапустите API и выполните в другом терминале `npm.cmd --prefix frontend run dev`. Открывайте именно `http://127.0.0.1:5173`. Vite проксирует `/api` в API. Для собранного интерфейса верните `APP_ORIGIN=http://localhost:8000`.

Миграции отдельно: `python -m alembic -c backend/alembic.ini upgrade head`. Повторное заполнение: при `PYTHONPATH=backend` — `python -m app.seed`. Проверка соответствия схемы: `python -m alembic -c backend/alembic.ini check`.

### Проверки

Интеграционные тесты используют настоящую PostgreSQL. Создайте отдельную базу с суффиксом `_test`, например `dekanat_test`, доступную тому же пользователю. Тесты удаляют **все данные тестовой базы**, выполняют миграции вниз/вверх и наполняют её заново. Основную базу они не используют. `app.check` по умолчанию берёт строку приложения и добавляет `_test` к имени базы; можно явно задать `TEST_DATABASE_URL` через окружение.

```powershell
$env:PYTHONPATH = 'backend'
.\.venv\Scripts\python.exe -m app.check
npm.cmd --prefix frontend run build
.\.venv\Scripts\python.exe -m pip check
```

Через Compose:

```powershell
docker compose exec db createdb -U dekanat dekanat_test
docker compose exec app python -m app.check
```

Первая команда создания базы нужна только один раз; для изменённого `POSTGRES_USER` подставьте своё имя. В работающем локальном приложении можно выполнить:

```powershell
.\.venv\Scripts\python.exe scripts/smoke.py --save-pdf
.\.venv\Scripts\python.exe scripts/check_persistence.py
```

`smoke.py` входит тремя отдельными сессиями, создаёт реальные демонстрационные заявки в базе приложения, проходит уточнение и завершение, проверяет изоляцию, скачивает PDF и выходит. `--save-pdf` сохраняет образец в игнорируемом `artifacts/`. Без флага файл не сохраняется. Скрипт не очищает существующие данные. `check_persistence.py` удерживает cookie в памяти; после сообщения READY перезапустите API и базу в другом терминале и нажмите Enter. Проверяются прежняя сессия, профиль, заявки, уведомления и скачивание готового PDF.

### Сброс и публичная сборка

Сброс не входит в запуск и seed. Только для выделенной демонстрационной среды: `docker compose down --volumes`, затем `docker compose up --build -d`. Это **необратимо удаляет все данные этого Compose-проекта**. Команда запускается отдельно и вручную.

Для публичного адреса нужны HTTPS-прокси, `APP_ORIGIN=https://ваш-домен`, `COOKIE_SECURE=true`, постоянный том и резервное копирование PostgreSQL. Секреты задаются окружением сервера. Cookie сессии — HttpOnly, SameSite=Lax; в базе хранится хеш случайного токена. Изменения, вход и выход проверяют Origin и CSRF. Выход отзывает серверную сессию. Не публикуйте `.env`, тестовые артефакты или пароли в README. Публичный деплой и проверка из России относятся к T07.

### Фактическая проверка 13 ноября 2026

На Windows, Python 3.13.5, Node 24.19.0, PostgreSQL 18.3: сборка TypeScript/Vite успешна; 11 тестов PostgreSQL пройдены; `alembic check` не обнаружил расхождений; `pip check` успешен. Пройден HTTP smoke-сценарий. После перезапуска API и PostgreSQL сохранились сессия, профиль, заявки, уведомления и доступ к PDF. Образец PDF отрендерен Poppler и визуально осмотрен. Compose-конфигурация валидна; сборка контейнера и запуск Compose не проверены — Docker Engine не работает в окружении. В тестах остаётся одно предупреждение Starlette об устаревающем имени AnyIO BlockingPortal.

Браузерный прогон, 360/390/768/1440 px, клавиатура и восстановление формы при сетевом сбое не проверены: обе доступные службы автоматизации браузера недоступны. Адаптивная вёрстка и сохранение черновиков реализованы, но сборка не заменяет визуальную приёмку.

T04: расписание, переносы, успеваемость и их демоданные. T05: «Сегодня», адресная лента, управление объявлениями и расписанием; личные уведомления по справкам уже есть в T03. T06: визуальная полировка и полная проверка адаптивности/доступности. T07: хостинг, HTTPS, внешняя проверка, отчёт и материалы жюри. Подробности: `docs/07-implementation-log.md` и `docs/08-api.md`.
