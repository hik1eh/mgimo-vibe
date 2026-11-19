# «Цифровой деканат будущего»

## Повторная проверка сборки 19 ноября 2026

- Приложение использует Lora Italic 550 в крупных заголовках. Файл шрифта и SIL OFL 1.1 побайтно совпали с дистрибутивом Google Fonts. Кириллические заголовки рендерятся этой гарнитурой на 360 и 1440 px. Раздел в интерфейсе называется «Успеваемость». [Официальная лицензия Lora](https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt).
- Все 141 записи npm фронтенда, 6 записей QA и 39 зафиксированных Python-пакетов сверены повторно. Наборы зависимостей совпали с предыдущим аудитом. Phosphor Icons 2.1.10, React, Three.js и другие runtime-библиотеки сопровождаются MIT-уведомлениями. Пять файлов OFL и общий файл уведомлений доступны по HTTP. У Python-пакетов в образе есть тексты лицензий. Бесплатное использование допускается на условиях перечисленных лицензий. [SIL OFL](https://openfontlicense.org/ofl-faq/), [MIT](https://opensource.org/license/mit).
- Запасной WebP шапочки теперь снят из собственной сцены Three.js в Playwright. Файл 784 × 476 px с прозрачностью. Сторонний растр в этом сценарии больше не раздаётся. Экспорт Git исключает неиспользуемые баннеры, старый студенческий билет и прежние сравнительные скриншоты. Право публикации этих файлов в полной истории пока не подтверждено.
- Новый локальный набор содержит 211 занятий на все 35 будних дней периода 1 ноября — 20 декабря, 14 вымышленных преподавателей, 16 строк успеваемости, 9 объявлений и 6 отметок журнала. Прежние заявки, документы, пользовательские уведомления и сессии удалены после проверенной локальной резервной копии.
- Прошли 50 серверных, 12 модульных, 13 браузерных и 6 тестов упаковки исходников. На основном Docker прошли 69 проверок готовности, `alembic check` и `pip check`. [Playwright](../artifacts/browser/nov-dec/results.json), [локальная готовность](../artifacts/browser/nov-dec/main-ready.json), [декабрь на телефоне](../artifacts/browser/nov-dec/december-week-360.png).
- Архив из `4aad139e367c` проверен по манифесту и SHA-256. В нём 196 файлов, включая сборку, миграции, шрифты и уведомления. Docker успешно собрал образ из распакованного ZIP. Секреты и сохранённые локальные документы в состав архива не входят. [ZIP](../artifacts/handoff/dekanat-source-4aad139e367c.zip), [SHA-256](../artifacts/handoff/dekanat-source-4aad139e367c.zip.sha256).

## Соответствие конкурсному заданию

Пять обязательных частей работают в локальном Docker. Студент может войти, найти занятие и проследить перенос, проверить результаты, подать заявку, получить ответ и открыть связанное уведомление. Публичная готовность оценивается отдельно по доступу жюри, лицензиям распространяемых материалов и итоговым ссылкам.

| Требование | Состояние | Что есть в прототипе |
|---|---|---|
| Вход и профиль | Реализовано | Вход по логину и паролю, выход с отзывом сессии, восстановление после перезагрузки. Раскрываемый профиль содержит ФИО, факультет, направление, курс и группу. |
| Расписание | Реализовано | Сегодня и неделя, преподаватель, время, корпус, аудитория. Перенос показывает старую аудиторию и новую. Отмена подписана текстом. Поэтажный 3D-маршрут доступен для поддерживаемых аудиторий Северного корпуса. |
| Успеваемость | Реализовано | Семестры, экзамены, зачёты, даты сессии, ближайший контроль и сводка закрытия. Итоги семестра используют записи выбранного студента. |
| Заявки и справки | Реализовано | Шесть видов заявок, выдача четырёх демонстрационных PDF, очередь своего факультета, статусы, уточнение, история. Решение по академотпуску и ответ на обращение сохраняются в карточке с уведомлением. |
| Уведомления | Реализовано | Новости вуза и объявления факультета или группы, события по заявкам и переносу или отмене, напоминание о ближайшем контроле. Видимые адресату записи открывают нужную карточку. |
| Телефон от 360 px | Локальная приёмка | Ключевые действия проверяются на 360 и 1440 px. Четыре основные вкладки остаются в навигации. «Дополнительно» находится среди вспомогательных действий. |
| Тестовые данные, символика, статус | Реализовано | Вымышленный Университет Северного кампуса с собственной монограммой «СК». Учебные даты, данные, документы и почта вида `@north-campus.example` демонстрационные. Статус конкурсного прототипа указан в интерфейсе. |
| Разграничение и секреты | Локальная приёмка | Сервер определяет пользователя по сессии. Студент видит свою заявку, свой PDF и свои отметки. Деканат работает со своим факультетом. Преподаватель работает со своими занятиями и активными студентами этих групп. Пароли хешируются Argon2id, ключи сессии хранятся в виде хешей. Запись требует Origin и CSRF. |
| Тестовые аккаунты | Подготовлены | `student.a`, `student.b` из разных факультетов, `staff.a` для первого факультета и `teacher.a` для журнала. Пароли задаются в `.env` и передаются командой отдельно. |
| Сторонний код и материалы | Проверено с открытыми пунктами | Лицензии зависимостей и шрифтов сверены ниже. Для части референсов права исходных материалов ещё нужно подтвердить перед передачей исходников или конкурсного отчёта. |
| Ссылка, Россия без VPN, срок до 28 ноября | Ожидает релиза | Команда оставила запуск в локальном Docker. Публичный HTTPS, доступность из России и доступность до объявления итогов пока не подтверждены. |

## Дополнения к ядру

- В «Дополнительно» доступны преподаватели по расписанию группы и переход к обращению в деканат. Справочник выводит имя, фамилию, отчество, все дисциплины преподавателя в группе и рабочую почту.
- Кабинет преподавателя сохраняет посещаемость и состояние контрольной точки по конкретному занятию. Сводка учитывает явные отметки, исключает отменённые занятия и считает контрольные точки отдельно от посещаемости. При наличии отметок в итогах семестра появляется соответствующий шаг.
- Справки для стажировки или практики, военкомата и направление на пересдачу используют прежний процесс обработки. Миграция `f32b0e71c59a` дополняет существующие заявки типом «Справка об обучении» с прежними номерами.

## Проверки и материалы жюри

- Серверная приёмка на отдельной PostgreSQL `dekanat_unit_test`: 49 тестов прошли. Проверены старый путь справки, три новых PDF, уточнение и ответ, идемпотентность, отказ чужому студенту, ограничения журнала и сохранность после повторного seed. `alembic check` и `pip check` успешны.
- `npm.cmd --prefix frontend test`: 12 тестов прошли. TypeScript и Vite успешно собраны в Docker. Vite предупредил о двух JS-блоках крупнее 500 КБ, pytest предупредил об устаревшем алиасе Starlette TestClient.
- В Playwright пройдены четыре новых сценария на 360 и 1440 px. Проверены клавиатурное меню, справочник, направление, обращение, ответ сотрудника, сохранение отметок и их появление в «Оценках» и «Итогах семестра». Axe для справочника не обнаружил ошибок по проверенным правилам. [Результаты](../artifacts/browser/other-functional/targeted-results.json), [справочник на телефоне](../artifacts/browser/other-functional/teachers-360.png), [журнал](../artifacts/browser/other-functional/journal-1440.png).
- Четыре вкладки остаются по центру на десктопе. Дополнительное меню не меняет размер основного меню при открытии. На девяти проверенных ширинах от 360 до 1600 px горизонтального переполнения нет.
- `docker compose up --build -d --wait` поднял приложение и PostgreSQL. После миграции сверены SHA-256 восьми наборов прежних данных. Сохранились 3 прежних профиля, 2 заявки, 1 документ, 2 уведомления, 4 события, 61 занятие, 7 объявлений и 10 результатов. Локальный smoke выполнил 69 проверок, включая вход и выход четырёх аккаунтов и HTTP-выдачу лицензионных уведомлений. [Локальная готовность](../artifacts/browser/other-functional/main-ready.json).
- Общий браузерный запуск дал 59 успешных сценариев. Пять актуальных сценариев из числа первоначально упавших прошли в повторе вместе с четырьмя новыми сценариями на финальной сборке. Повтор подтвердил работу при тексте 200%, десять полей профиля, касание и WebKit. Исторический захват T06 ожидает разметку прежней версии. С отдельным успешным тестом перезапуска пройдено 65 уникальных актуальных сценариев. После перезапуска QA-приложения и PostgreSQL с тем же томом сохранились заявки, учебные записи, отметки и три проверенные сессии. [Общий запуск](../artifacts/browser/other-functional/regression-results.json), [повтор](../artifacts/browser/other-functional/rechecked-results.json), [перезапуск](../artifacts/browser/other-functional/persistence-results.json).
- Семь файлов браузерной сборки сверены с шестью фактическими значениями секретов. Совпадений нет, `.env` в образе отсутствует. Четыре файла OFL и общий файл уведомлений раздаются по HTTP байт в байт.

| Критерий | Связь с результатом |
|---|---|
| Проработанность идеи | Маршрут от адресного объявления к нужной паре, маршрут по этажам и полный цикл общения с деканатом. Справочник, журнал и итоги добавляют информацию в существующие учебные сценарии. |
| Использование ИИ | Этапы разработки, промпты и визуальные итерации собраны в журнале и спецификациях. Финальный документ команды должен перечислить фактически применённые инструменты и ручные шаги. |
| Имплементация | FastAPI, PostgreSQL и React работают в Docker. Миграции, роли, документы и сохранность проверяются на работающем приложении. Внешняя часть T07 зависит от публикации. |
| Качество | Адаптивная навигация, текстовые статусы, состояния загрузки и ошибок, доступ по клавиатуре и уважение настроек уменьшения движения. Локальные автоматические проверки дают свидетельства по проверенным сценариям. |

Для оценки потребуются публичная ссылка, доступ жюри к репозиторию или архиву, демодоступы в комментарии и итоговый документ о процессе. В проекте есть журнал, проверка, скриншоты и сценарий демонстрации. Публикация материалов остаётся за командой. [Подготовка T07](10-demo-and-handoff.md), [журнал](07-implementation-log.md), [запуск](../RUNNING.md).

## Лицензии

Проверены точные версии из `frontend/package-lock.json`, `e2e/package-lock.json` и `backend/requirements.lock`. Для установленных пакетов сверены декларации и файлы лицензий из дистрибутивов. Приложения ниже включают платформенные записи npm, системные пакеты фактически использованных образов и список нативных файлов колёс Python. Лицензионная проверка этих зависимостей относится к проверенным версиям.

| Компонент | Лицензия и фактическое состояние |
|---|---|
| Браузерный код проекта | React, React DOM, React Router, Three.js, Base UI, Phosphor Icons и их runtime-зависимости в текущем npm lock имеют MIT. Полные тексты и копирайты для 20 записей набора зависимостей доступны по `/assets/third-party-notices.txt` и ссылке в подвале. [Файл уведомлений](../frontend/public/assets/third-party-notices.txt), [условия MIT](https://opensource.org/license/mit). |
| Сборка и тесты | Vite и React-плагин используют MIT. TypeScript использует Apache-2.0. Playwright и его ядра используют Apache-2.0, а `@axe-core/playwright` и `axe-core` используют MPL-2.0. Лицензионные файлы Playwright, NOTICE и сторонние уведомления axe присутствуют в QA-пакетах. QA-код отделён от образа приложения. [Playwright Docker](https://playwright.dev/docs/docker), [MPL 2.0](https://www.mozilla.org/en-US/MPL/2.0/). |
| Backend | FastAPI, SQLAlchemy и Alembic используют MIT, Uvicorn и Starlette используют BSD-3-Clause. Остальные лицензии приведены по каждому установленному пакету. `certifi` использует MPL-2.0, `psycopg` и `psycopg-binary` декларируют LGPL v3. В колёсах есть тексты лицензий. При распространении бинарного образа отдельно проверить условия на исходники лицензированных компонентов, уведомления и права на замену LGPL-библиотеки. [Документация Psycopg](https://www.psycopg.org/psycopg3/docs/basic/install.html), [LGPLv3](https://www.gnu.org/licenses/lgpl-3.0.html), [Mozilla MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/). |
| Шрифты интерфейса | Manrope, Allura, Lora Italic, Marck Script и Golos Text используют SIL OFL 1.1. В Docker раздаются Manrope, Allura и Lora Italic, тексты OFL всех пяти находятся в `/assets/font-licenses/`. Исходные файлы Marck Script и Golos Text сохранены. [Справка OFL](https://openfontlicense.org/ofl-faq/). |
| Шрифт PDF | DejaVu Sans встраивается в демонстрационный документ. В исходниках и серверном образе есть условия Bitstream Vera, изменения DejaVu в public domain и уведомление для импортированных глифов Arev. [Текст лицензии](../backend/app/assets/LICENSE-DejaVu.txt). |
| Исходники команды | В корне проекта нет отдельного `LICENSE`. Правообладатели определяют условия передачи исходников жюри. Публичность репозитория сама по себе не задаёт открытую лицензию. [GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository). |

### Изображения и модели

| Материал | Происхождение и статус |
|---|---|
| Семь фотографий карусели, световой луч, фон кабинета | Самостоятельные результаты ImageGen. В документации есть промпты и заметки о конвертации. Актуальная сборка содержит девять этих WebP. [Исходные фото](11-auth-interaction-spec.md), [свет](12-auth-update.md), [дополнения](16-auth-carousel-photos.md), [фон](19-premium-cabinet.md). |
| Исторический студенческий билет, четыре баннера и сравнительные снимки | Старые версии создавались или восстанавливались с переданными референсами. Для этих референсов и включающих их сравнений права публикации не подтверждены. Экспорт исходников исключает эти пути. Действующий запасной кадр входа получен из собственной 3D-шапочки. Для передачи полной истории Git требуется проверить права отдельно. [Шапочка](15-auth-cap-spec.md), [баннеры](18-compact-header-and-image-quality.md), [условия OpenAI](https://openai.com/policies/terms-of-use/). |
| 3D и изображения запасного режима | Геометрия кампуса, этажей, шапочки и объектов создаётся в коде проекта средствами Three.js. Десять WebP в `frontend/public/assets/campus-models/` получены из собственных сцен. Сторонние наборы полигонов, текстур или моделей в этом сценарии не обнаружены. [Геометрия кампуса](../frontend/src/campus-geometry.ts), [поэтажная модель](../frontend/src/indoor-route-model.ts), [захват](../e2e/capture-models.cjs). |

### Упакованные нативные компоненты

- `psycopg-binary` содержит PostgreSQL libpq, OpenSSL 3, MIT Kerberos, OpenLDAP, PCRE, SASL, libselinux, libkeyutils и libcom_err. Среди отдельных условий есть PostgreSQL License, Apache-2.0 у OpenSSL 3, OpenLDAP Public License, уведомления MIT Kerberos и BSD-подобные условия PCRE и SASL. Версии SONAME и состав по файлам приведены ниже. Точные notices и provenance Linux-сборки нужны при передаче wheel внутри образа. [PostgreSQL](https://www.postgresql.org/about/licence/), [Psycopg](https://www.psycopg.org/psycopg3/docs/basic/install.html), [OpenSSL](https://www.openssl.org/source/license.html).
- Pillow содержит библиотеки libavif, Brotli, FreeType, HarfBuzz, libjpeg-turbo, Little CMS, XZ/liblzma, OpenJPEG, libpng, libwebp с SharpYUV, libtiff, libxcb и libXau, Zstandard. У них собственные лицензии и уведомления. Например, FreeType предлагает FTL или GPLv2, libwebp распространяется под BSD-условиями с отдельным патентным файлом, Zstandard предлагает BSD или GPLv2. Нативные модули из колёс перечислены ниже. [Зависимости Pillow](https://pillow.readthedocs.io/en/stable/installation/building-from-source.html), [FreeType](https://freetype.org/license.html), [WebP](https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/COPYING), [Zstandard](https://github.com/facebook/zstd/blob/dev/LICENSE).
- Биндинги Argon2 используют MIT. У эталонной реализации Argon2 собственное двойное лицензирование Apache-2.0 или CC0-1.0. Наличие полного SBOM для статически вкомпилированного кода расширений колёс отдельно не подтверждено. [Лицензия Argon2](https://github.com/P-H-C/phc-winner-argon2/blob/master/LICENSE).

### Контейнеры и инструменты

| Среда | Фактически проверенная основа |
|---|---|
| Сборка фронтенда | `node:22-alpine`, Node 22.23.5 и npm 10.9.9, Alpine 3.24.4. Node включает MIT и отдельные лицензии встроенных компонентов. npm использует Artistic-2.0 плюс лицензии зависимостей. [Node LICENSE](https://github.com/nodejs/node/blob/v22.x/LICENSE), [npm LICENSE](https://github.com/npm/cli/blob/v10.9.9/LICENSE). |
| Приложение | `python:3.13-slim`, Python 3.13.18 с условиями PSF и историческими уведомлениями, Debian 13.7. Лицензии системных пакетов сверялись по `/usr/share/doc/*/copyright`. [Python 3.13](https://docs.python.org/3.13/license.html). |
| СУБД | PostgreSQL 17.11, официальная PostgreSQL License. Подложка Alpine 3.24.1. Набор системных пакетов ниже взят из `/lib/apk/db/installed`. [PostgreSQL License](https://www.postgresql.org/about/licence/). |
| Браузерная приёмка | QA-образ Playwright 1.64.1 на Ubuntu Noble содержит Chromium, headless Chromium, Firefox, WebKit и FFmpeg. У FFmpeg найден текст LGPLv2.1. В полном Chromium присутствует Widevine CDM с отдельными проприетарными условиями Google. Он находится в тестовом образе и в приложении не используется. Перед передачей QA-образа нужно сверить условия его браузерных компонентов и уведомления, включая Firefox и WebKit. [Playwright Docker](https://playwright.dev/docs/docker), [Widevine](https://www.widevine.com/), [Mozilla](https://www.mozilla.org/en-US/MPL/), [WebKit](https://webkit.org/licensing-webkit/). |
| Docker Desktop | Инструмент запуска имеет собственные условия. Они применяются к использованию Desktop командой независимо от лицензий библиотек в проекте. [Условия Docker Desktop](https://docs.docker.com/subscription-billing/desktop-license/). |

Дистрибутивы Debian и Ubuntu могут использовать свои обозначения в полях `License:`. В приложении сохранены их обозначения и пути к полным уведомлениям. Отдельные бинарные образы и архивы требуют проверки состава именно той сборки, которая будет передаваться.

## История Git

Проверенная опубликованная вершина GitHub — `b9b56f8`. Семь групп связанных правок сократили 20 локальных коммитов до 11 с точным совпадением итогового дерева. Исходные 38 коммитов доступны в локальной ветке `backup/frontend-before-squash-20261119`. После трёх новых коммитов в `main` **32** коммита, из них 14 поверх проверенной точки GitHub.


## Инвентарь зависимостей и лицензий

<details>
<summary>npm · frontend · 141 записей</summary>

Apache-2.0 — 3, BSD-3-Clause — 1, CC-BY-4.0 — 1, ISC — 5, MIT — 131. 50 записей сверены по метаданным lock, соответствующих версий на локальной Windows нет.

| Пакет | Версия | Лицензия | Роль | Файл в пакете |
| --- | --- | --- | --- | --- |
| `@babel/code-frame` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/compat-data` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/core` | 7.29.13 | MIT | сборка или QA | `LICENSE` |
| `@babel/generator` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-compilation-targets` | 7.29.13 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-globals` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-module-imports` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-module-transforms` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-plugin-utils` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-string-parser` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-validator-identifier` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/helper-validator-option` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/helpers` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@babel/parser` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@babel/plugin-transform-react-jsx-self` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/plugin-transform-react-jsx-source` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/runtime` | 8.1.2 | MIT | транзитивная | `LICENSE` |
| `@babel/template` | 7.29.7 | MIT | сборка или QA | `LICENSE` |
| `@babel/traverse` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@babel/types` | 7.29.14 | MIT | сборка или QA | `LICENSE` |
| `@base-ui/react` | 1.9.0 | MIT | прямая | `LICENSE` |
| `@base-ui/utils` | 0.5.0 | MIT | транзитивная | `LICENSE` |
| `@dimforge/rapier3d-compat` | 0.12.0 | Apache-2.0 | сборка или QA | `LICENSE` |
| `@esbuild/aix-ppc64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/android-arm` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/android-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/android-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/darwin-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/darwin-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/freebsd-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/freebsd-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-arm` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-ia32` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-loong64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-mips64el` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-ppc64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-riscv64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-s390x` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/linux-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/netbsd-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/netbsd-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/openbsd-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/openbsd-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/openharmony-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/sunos-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/win32-arm64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/win32-ia32` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@esbuild/win32-x64` | 0.25.12 | MIT | сборка или QA / optional | декларация npm lock |
| `@floating-ui/core` | 1.8.0 | MIT | транзитивная | `LICENSE` |
| `@floating-ui/dom` | 1.8.0 | MIT | транзитивная | `LICENSE` |
| `@floating-ui/react-dom` | 2.1.9 | MIT | транзитивная | `LICENSE` |
| `@floating-ui/utils` | 0.2.12 | MIT | транзитивная | `LICENSE` |
| `@jridgewell/gen-mapping` | 0.3.13 | MIT | сборка или QA | `LICENSE` |
| `@jridgewell/remapping` | 2.3.5 | MIT | сборка или QA | `LICENSE` |
| `@jridgewell/resolve-uri` | 3.1.3 | MIT | сборка или QA | `LICENSE` |
| `@jridgewell/sourcemap-codec` | 1.6.0 | MIT | сборка или QA | `LICENSE` |
| `@jridgewell/trace-mapping` | 0.3.31 | MIT | сборка или QA | `LICENSE` |
| `@phosphor-icons/react` | 2.1.10 | MIT | прямая | `LICENSE` |
| `@rolldown/pluginutils` | 1.0.0-beta.9 | MIT | сборка или QA | `LICENSE` |
| `@rollup/rollup-android-arm-eabi` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-android-arm64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-android-x64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-darwin-arm64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-darwin-x64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-freebsd-arm64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-freebsd-x64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-arm-gnueabihf` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-arm-musleabihf` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-arm64-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-arm64-musl` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-loong64-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-loong64-musl` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-ppc64-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-ppc64-musl` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-riscv64-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-riscv64-musl` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-s390x-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-x64-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-linux-x64-musl` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-openbsd-x64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-openharmony-arm64` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-win32-arm64-msvc` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-win32-ia32-msvc` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-win32-x64-gnu` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@rollup/rollup-win32-x64-msvc` | 4.68.3 | MIT | сборка или QA / optional | декларация npm lock |
| `@tweenjs/tween.js` | 23.1.3 | MIT | сборка или QA | `LICENSE` |
| `@types/babel__core` | 7.20.5 | MIT | сборка или QA | `LICENSE` |
| `@types/babel__generator` | 7.27.0 | MIT | сборка или QA | `LICENSE` |
| `@types/babel__template` | 7.4.4 | MIT | сборка или QA | `LICENSE` |
| `@types/babel__traverse` | 7.28.0 | MIT | сборка или QA | `LICENSE` |
| `@types/estree` | 1.0.10 | MIT | сборка или QA | `LICENSE` |
| `@types/react` | 19.1.6 | MIT | прямая dev | `LICENSE` |
| `@types/react-dom` | 19.1.6 | MIT | прямая dev | `LICENSE` |
| `@types/stats.js` | 0.17.4 | MIT | сборка или QA | `LICENSE` |
| `@types/three` | 0.187.0 | MIT | прямая dev | `LICENSE` |
| `@types/webxr` | 0.5.24 | MIT | сборка или QA | `LICENSE` |
| `@vitejs/plugin-react` | 4.5.1 | MIT | прямая dev | `LICENSE` |
| `baseline-browser-mapping` | 2.11.37 | Apache-2.0 | сборка или QA | `LICENSE.txt` |
| `browserslist` | 4.29.5 | MIT | сборка или QA | `LICENSE` |
| `caniuse-lite` | 1.0.30001826 | CC-BY-4.0 | сборка или QA | `LICENSE` |
| `convert-source-map` | 2.0.0 | MIT | сборка или QA | `LICENSE` |
| `cookie` | 1.1.1 | MIT | транзитивная | `LICENSE` |
| `csstype` | 3.2.3 | MIT | транзитивная | `LICENSE` |
| `debug` | 4.4.3 | MIT | сборка или QA | `LICENSE` |
| `electron-to-chromium` | 1.5.485 | ISC | сборка или QA | `LICENSE` |
| `esbuild` | 0.25.12 | MIT | сборка или QA | `LICENSE.md` |
| `escalade` | 3.2.0 | MIT | сборка или QA | `license` |
| `fdir` | 6.5.0 | MIT | сборка или QA | `LICENSE` |
| `fflate` | 0.8.3 | MIT | сборка или QA | `LICENSE` |
| `fsevents` | 2.3.3 | MIT | сборка или QA / optional | декларация npm lock |
| `gensync` | 1.0.0-beta.2 | MIT | сборка или QA | `LICENSE` |
| `js-tokens` | 4.0.0 | MIT | сборка или QA | `LICENSE` |
| `jsesc` | 3.1.0 | MIT | сборка или QA | `LICENSE-MIT.txt` |
| `json5` | 2.2.3 | MIT | сборка или QA | `LICENSE.md` |
| `lru-cache` | 5.1.1 | ISC | сборка или QA | `LICENSE` |
| `meshoptimizer` | 1.1.1 | MIT | сборка или QA | `LICENSE.md` |
| `ms` | 2.1.3 | MIT | сборка или QA | `license.md` |
| `nanoid` | 3.3.20 | MIT | сборка или QA | `LICENSE` |
| `node-releases` | 2.0.64 | MIT | сборка или QA | `LICENSE` |
| `picocolors` | 1.1.1 | ISC | сборка или QA | `LICENSE` |
| `picomatch` | 4.0.7 | MIT | сборка или QA | `LICENSE` |
| `postcss` | 8.5.32 | MIT | сборка или QA | `LICENSE` |
| `react` | 19.1.0 | MIT | прямая | `LICENSE` |
| `react-dom` | 19.1.0 | MIT | прямая | `LICENSE` |
| `react-refresh` | 0.17.0 | MIT | сборка или QA | `LICENSE` |
| `react-router` | 7.18.5 | MIT | транзитивная | `LICENSE.md` |
| `react-router-dom` | 7.18.5 | MIT | прямая | `LICENSE.md` |
| `reselect` | 5.3.0 | MIT | транзитивная | `LICENSE` |
| `rollup` | 4.68.3 | MIT | сборка или QA | `LICENSE.md` |
| `scheduler` | 0.26.0 | MIT | транзитивная | `LICENSE` |
| `semver` | 6.3.2 | ISC | сборка или QA | `LICENSE` |
| `set-cookie-parser` | 2.7.3 | MIT | транзитивная | `LICENSE` |
| `source-map-js` | 1.2.2 | BSD-3-Clause | сборка или QA | `LICENSE` |
| `three` | 0.187.0 | MIT | прямая | `LICENSE` |
| `tinyglobby` | 0.2.17 | MIT | сборка или QA | `LICENSE` |
| `typescript` | 5.8.3 | Apache-2.0 | прямая dev | `LICENSE.txt` |
| `update-browserslist-db` | 1.3.4 | MIT | сборка или QA | `LICENSE` |
| `use-sync-external-store` | 1.7.0 | MIT | транзитивная | `LICENSE` |
| `vite` | 6.4.6 | MIT | прямая dev | `LICENSE.md` |
| `yallist` | 3.1.1 | ISC | сборка или QA | `LICENSE` |

</details>

<details>
<summary>npm · e2e · 6 записей</summary>

Apache-2.0 — 4, MPL-2.0 — 2.

| Пакет | Версия | Лицензия | Роль | Файл в пакете |
| --- | --- | --- | --- | --- |
| `@axe-core/playwright` | 4.11.1 | MPL-2.0 | прямая dev | `LICENSE` |
| `@playwright/test` | 1.64.1 | Apache-2.0 | прямая dev | `LICENSE`, `NOTICE` |
| `axe-core` | 4.11.4 | MPL-2.0 | сборка или QA | `LICENSE`, `LICENSE-3RD-PARTY.txt` |
| `playwright` | 1.64.1 | Apache-2.0 | сборка или QA | `LICENSE`, `NOTICE` |
| `playwright-core` | 1.65.0 | Apache-2.0 | сборка или QA | `LICENSE`, `NOTICE` |
| `playwright-core` | 1.64.1 | Apache-2.0 | сборка или QA | `LICENSE`, `NOTICE` |

</details>

<details>
<summary>Python · 39 закреплённых пакетов и pip из базового образа</summary>

| Пакет | Версия | Лицензия | Уведомления |
| --- | --- | --- | --- |
| `alembic` | 1.16.1 | MIT | `alembic-1.16.1.dist-info/licenses/LICENSE` |
| `annotated-types` | 0.8.0 | MIT | `annotated_types-0.8.0.dist-info/licenses/LICENSE` |
| `anyio` | 4.16.0 | MIT | `anyio-4.16.0.dist-info/licenses/LICENSE` |
| `argon2-cffi` | 23.1.0 | MIT | `argon2_cffi-23.1.0.dist-info/licenses/LICENSE` |
| `argon2-cffi-bindings` | 26.2.0 | MIT | `argon2_cffi_bindings-26.2.0.dist-info/licenses/LICENSE` |
| `certifi` | 2026.10.23 | MPL-2.0 | `certifi-2026.10.23.dist-info/licenses/LICENSE` |
| `cffi` | 2.1.1 | MIT-0 | `cffi-2.1.1.dist-info/licenses/LICENSE` |
| `chardet` | 7.7.0 | 0BSD | `chardet-7.7.0.dist-info/licenses/LICENSE` |
| `click` | 8.5.1 | BSD-3-Clause | `click-8.5.1.dist-info/licenses/LICENSE.txt` |
| `colorama` | 0.4.6 | BSD-3-Clause | `colorama-0.4.6.dist-info/licenses/LICENSE.txt` |
| `fastapi` | 0.115.12 | MIT | `fastapi-0.115.12.dist-info/licenses/LICENSE` |
| `greenlet` | 3.5.6 | MIT AND PSF-2.0 | `greenlet-3.5.6.dist-info/licenses/LICENSE` и ещё 1 |
| `h11` | 0.16.0 | MIT | `h11-0.16.0.dist-info/licenses/LICENSE.txt` |
| `httpcore` | 1.0.9 | BSD-3-Clause | `httpcore-1.0.9.dist-info/licenses/LICENSE.md` |
| `httpx` | 0.28.1 | BSD-3-Clause | `httpx-0.28.1.dist-info/licenses/LICENSE.md` |
| `idna` | 3.20 | BSD-3-Clause | `idna-3.20.dist-info/licenses/LICENSE.md` |
| `iniconfig` | 2.3.1 | MIT | `iniconfig-2.3.1.dist-info/licenses/LICENSE` |
| `Mako` | 1.4.3 | MIT | `mako-1.4.3.dist-info/licenses/LICENSE` |
| `MarkupSafe` | 3.0.4 | BSD-3-Clause | `markupsafe-3.0.4.dist-info/licenses/LICENSE.txt` |
| `packaging` | 26.3 | Apache-2.0 OR BSD-2-Clause | `packaging-26.3.dist-info/licenses/LICENSE` и ещё 6 |
| `pillow` | 13.0.0 | MIT-CMU | `pillow-13.0.0.dist-info/licenses/LICENSE` |
| `pip` | 26.2.2 | MIT | `pip-26.2.2.dist-info/licenses/AUTHORS.txt` и ещё 43 |
| `pluggy` | 1.7.0 | MIT | `pluggy-1.7.0.dist-info/licenses/LICENSE` |
| `psycopg` | 3.2.9 | GNU LGPL v3 | `psycopg-3.2.9.dist-info/licenses/LICENSE.txt` |
| `psycopg-binary` | 3.2.9 | GNU LGPL v3 | `psycopg_binary-3.2.9.dist-info/licenses/LICENSE.txt` |
| `pwdlib` | 0.2.1 | MIT | `pwdlib-0.2.1.dist-info/licenses/LICENSE` |
| `pycparser` | 3.12 | BSD-3-Clause | `pycparser-3.12.dist-info/licenses/LICENSE` |
| `pydantic` | 2.14.3 | MIT | `pydantic-2.14.3.dist-info/licenses/LICENSE` |
| `pydantic-settings` | 2.9.1 | MIT | `pydantic_settings-2.9.1.dist-info/licenses/LICENSE` |
| `pydantic_core` | 2.50.4 | MIT | `pydantic_core-2.50.4.dist-info/licenses/LICENSE` |
| `pypdf` | 5.6.0 | BSD-3-Clause | `pypdf-5.6.0.dist-info/licenses/LICENSE` |
| `pytest` | 8.3.5 | MIT | `pytest-8.3.5.dist-info/LICENSE` |
| `python-dotenv` | 1.2.4 | BSD-3-Clause | `python_dotenv-1.2.4.dist-info/licenses/LICENSE` |
| `reportlab` | 4.4.1 | BSD-3-Clause | `reportlab-4.4.1.dist-info/licenses/LICENSE` |
| `SQLAlchemy` | 2.0.41 | MIT | `sqlalchemy-2.0.41.dist-info/licenses/LICENSE` |
| `starlette` | 0.46.2 | BSD-3-Clause | `starlette-0.46.2.dist-info/licenses/LICENSE.md` |
| `typing-inspection` | 0.4.5 | MIT | `typing_inspection-0.4.5.dist-info/licenses/LICENSE` |
| `typing_extensions` | 4.16.0 | PSF-2.0 | `typing_extensions-4.16.0.dist-info/licenses/LICENSE` |
| `tzdata` | 2026.6 | Apache-2.0 (пакет), public domain (данные IANA) | `tzdata-2026.6.dist-info/licenses/LICENSE` и ещё 1 |
| `uvicorn` | 0.34.2 | BSD-3-Clause | `uvicorn-0.34.2.dist-info/licenses/LICENSE.md` |

</details>

<details>
<summary>Нативные файлы колёс · 71 записей</summary>

| Колесо | Файл |
| --- | --- |
| `argon2-cffi-bindings` | `_argon2_cffi_bindings/_ffi.abi3.so` |
| `cffi` | `_cffi_backend.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `650fdafa2468af73c11f__mypyc.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/_kernel.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/models/__init__.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/models/_format.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/ascii.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/confusion.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/escape.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/language.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/magic.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/markup.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/orchestrator.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/postprocess.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/statistical.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/structural.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/utf1632.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/utf8.cpython-313-x86_64-linux-gnu.so` |
| `chardet` | `chardet/pipeline/validity.cpython-313-x86_64-linux-gnu.so` |
| `greenlet` | `greenlet/_greenlet.cpython-313-x86_64-linux-gnu.so` |
| `greenlet` | `greenlet/tests/_test_extension.cpython-313-x86_64-linux-gnu.so` |
| `greenlet` | `greenlet/tests/_test_extension_cpp.cpython-313-x86_64-linux-gnu.so` |
| `MarkupSafe` | `markupsafe/_speedups.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_avif.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_imaging.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_imagingcms.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_imagingft.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_imagingmath.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_imagingmorph.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_imagingtk.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `PIL/_webp.cpython-313-x86_64-linux-gnu.so` |
| `pillow` | `pillow.libs/libXau-154567c4.so.6.0.0` |
| `pillow` | `pillow.libs/libavif-c6062d5f.so.16.4.2` |
| `pillow` | `pillow.libs/libbrotlicommon-53534446.so.1.2.0` |
| `pillow` | `pillow.libs/libbrotlidec-7e5462ba.so.1.2.0` |
| `pillow` | `pillow.libs/libfreetype-57f805ba.so.6.20.6` |
| `pillow` | `pillow.libs/libharfbuzz-fb49c9fc.so.0.61450.0` |
| `pillow` | `pillow.libs/libjpeg-6dc8d115.so.62.4.0` |
| `pillow` | `pillow.libs/liblcms2-88eaba2f.so.2.0.19` |
| `pillow` | `pillow.libs/liblzma-de26b416.so.5.8.4` |
| `pillow` | `pillow.libs/libopenjp2-e530e1bf.so.2.5.4` |
| `pillow` | `pillow.libs/libpng16-1d1ba958.so.16.58.0` |
| `pillow` | `pillow.libs/libsharpyuv-0066295b.so.0.1.2` |
| `pillow` | `pillow.libs/libtiff-20b7e810.so.6.3.0` |
| `pillow` | `pillow.libs/libwebp-51b0b3f7.so.7.2.0` |
| `pillow` | `pillow.libs/libwebpdemux-9fe2abcc.so.2.0.17` |
| `pillow` | `pillow.libs/libwebpmux-8fb1c9f6.so.3.1.2` |
| `pillow` | `pillow.libs/libxcb-9065bb12.so.1.1.0` |
| `pillow` | `pillow.libs/libzstd-40ad5e7e.so.1.5.7` |
| `psycopg-binary` | `psycopg_binary.libs/libcom_err-2abe824b.so.2.1` |
| `psycopg-binary` | `psycopg_binary.libs/libcrypto-6de3c5c6.so.3` |
| `psycopg-binary` | `psycopg_binary.libs/libgssapi_krb5-497db0c6.so.2.2` |
| `psycopg-binary` | `psycopg_binary.libs/libk5crypto-b1f99d5c.so.3.1` |
| `psycopg-binary` | `psycopg_binary.libs/libkeyutils-dfe70bd6.so.1.5` |
| `psycopg-binary` | `psycopg_binary.libs/libkrb5-fcafa220.so.3.3` |
| `psycopg-binary` | `psycopg_binary.libs/libkrb5support-d0bcff84.so.0.1` |
| `psycopg-binary` | `psycopg_binary.libs/liblber-fc196096.so.2.0.200` |
| `psycopg-binary` | `psycopg_binary.libs/libldap-ff149244.so.2.0.200` |
| `psycopg-binary` | `psycopg_binary.libs/libpcre-9513aab5.so.1.2.0` |
| `psycopg-binary` | `psycopg_binary.libs/libpq-6a0c3ecd.so.5.17` |
| `psycopg-binary` | `psycopg_binary.libs/libsasl2-883649fd.so.3.0.0` |
| `psycopg-binary` | `psycopg_binary.libs/libselinux-0922c95c.so.1` |
| `psycopg-binary` | `psycopg_binary.libs/libssl-c434c5f0.so.3` |
| `psycopg-binary` | `psycopg_binary/_psycopg.cpython-313-x86_64-linux-gnu.so` |
| `psycopg-binary` | `psycopg_binary/pq.cpython-313-x86_64-linux-gnu.so` |
| `pydantic_core` | `pydantic_core/_pydantic_core.cpython-313-x86_64-linux-gnu.so` |
| `SQLAlchemy` | `sqlalchemy/cyextension/collections.cpython-313-x86_64-linux-gnu.so` |
| `SQLAlchemy` | `sqlalchemy/cyextension/immutabledict.cpython-313-x86_64-linux-gnu.so` |
| `SQLAlchemy` | `sqlalchemy/cyextension/processors.cpython-313-x86_64-linux-gnu.so` |
| `SQLAlchemy` | `sqlalchemy/cyextension/resultproxy.cpython-313-x86_64-linux-gnu.so` |
| `SQLAlchemy` | `sqlalchemy/cyextension/util.cpython-313-x86_64-linux-gnu.so` |

</details>

<details>
<summary>Компоненты, встроенные в pip</summary>

Версии из `pip/_vendor/vendor.txt`.

```text
CacheControl==0.14.4
distlib==0.4.2
distro==1.9.0
msgpack==1.1.2
packaging==26.2
platformdirs==4.10.0
pyproject-hooks==1.2.0
requests==2.34.2
    certifi==2026.10.19
    idna==3.18
    urllib3==2.7.0
rich==14.2.0
    pygments==2.20.0
resolvelib==1.2.1
setuptools==70.3.0
tomli==2.4.1
tomli-w==1.2.0
truststore==0.10.4
```

Копии уведомлений в `pip-26.2.2.dist-info/licenses/src/pip/_vendor/`.

- `cachecontrol/LICENSE.txt`
- `certifi/LICENSE`
- `distlib/LICENSE.txt`
- `distro/LICENSE`
- `idna/LICENSE.md`
- `msgpack/COPYING`
- `packaging/LICENSE`
- `packaging/LICENSE.APACHE`
- `packaging/LICENSE.BSD`
- `pkg_resources/LICENSE`
- `platformdirs/LICENSE`
- `pygments/LICENSE`
- `pyproject_hooks/LICENSE`
- `requests/LICENSE`
- `resolvelib/LICENSE`
- `rich/LICENSE`
- `tomli/LICENSE`
- `tomli_w/LICENSE`
- `truststore/LICENSE`
- `urllib3/LICENSE.txt`

</details>

<details>
<summary>Alpine для сборки Node · 19 пакетов</summary>

| Пакет | Версия | Поле L в APK |
| --- | --- | --- |
| alpine-baselayout | 3.7.2-r1 | GPL-2.0-only |
| alpine-baselayout-data | 3.7.2-r1 | GPL-2.0-only |
| alpine-keys | 2.6-r0 | MIT |
| alpine-release | 3.24.4-r0 | MIT |
| apk-tools | 3.0.9-r0 | GPL-2.0-only |
| busybox | 1.37.0-r31 | GPL-2.0-only |
| busybox-binsh | 1.37.0-r31 | GPL-2.0-only |
| ca-certificates-bundle | 20261020-r0 | MPL-2.0 AND MIT |
| libapk | 3.0.9-r0 | GPL-2.0-only |
| libatomic | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libcrypto3 | 3.5.9-r0 | Apache-2.0 |
| libgcc | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libssl3 | 3.5.9-r0 | Apache-2.0 |
| libstdc++ | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| musl | 1.2.6-r3 | MIT |
| musl-utils | 1.2.6-r3 | MIT AND BSD-2-Clause AND GPL-2.0-or-later |
| scanelf | 1.3.9-r1 | GPL-2.0-only |
| ssl_client | 1.37.0-r31 | GPL-2.0-only |
| zlib | 1.3.2-r1 | Zlib |

</details>

<details>
<summary>Alpine для PostgreSQL · 45 пакетов</summary>

| Пакет | Версия | Поле L в APK |
| --- | --- | --- |
| .postgresql-rundeps | 20260813.191733 |  |
| alpine-baselayout | 3.7.2-r1 | GPL-2.0-only |
| alpine-baselayout-data | 3.7.2-r1 | GPL-2.0-only |
| alpine-keys | 2.6-r0 | MIT |
| alpine-release | 3.24.1-r0 | MIT |
| apk-tools | 3.0.6-r0 | GPL-2.0-only |
| bash | 5.3.9-r1 | GPL-3.0-or-later |
| busybox | 1.37.0-r31 | GPL-2.0-only |
| busybox-binsh | 1.37.0-r31 | GPL-2.0-only |
| ca-certificates-bundle | 20260611-r0 | MPL-2.0 AND MIT |
| gdbm | 1.26-r0 | GPL-3.0-or-later |
| icu-data-full | 78.1-r0 | ICU |
| icu-libs | 78.1-r0 | ICU |
| keyutils-libs | 1.6.3-r4 | GPL-2.0-or-later AND LGPL-2.0-or-later |
| krb5-conf | 1.0-r2 | MIT |
| krb5-libs | 1.22.2-r1 | MIT |
| libapk | 3.0.6-r0 | GPL-2.0-only |
| libcom_err | 1.47.4-r0 | GPL-2.0-or-later AND LGPL-2.0-or-later AND BSD-3-Clause AND MIT |
| libcrypto3 | 3.5.7-r0 | Apache-2.0 |
| libedit | 20260508.3.1-r1 | BSD-3-Clause |
| libffi | 3.5.2-r1 | MIT |
| libgcc | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libldap | 2.6.14-r0 | OLDAP-2.8 |
| libncursesw | 6.6_p20260516-r0 | X11 |
| libsasl | 2.1.28-r9 | BSD-3-Clause-Attribution AND BSD-4-Clause |
| libssl3 | 3.5.7-r0 | Apache-2.0 |
| libstdc++ | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libuuid | 2.42.1-r0 | BSD-3-Clause |
| libverto | 0.3.2-r2 | MIT |
| libxml2 | 2.13.9-r2 | MIT |
| libxslt | 1.1.43-r3 | X11 |
| llvm21-libs | 21.1.8-r1 | Apache-2.0 |
| lz4-libs | 1.10.0-r1 | BSD-2-Clause AND GPL-2.0-or-later |
| musl | 1.2.6-r2 | MIT |
| musl-utils | 1.2.6-r2 | MIT AND BSD-2-Clause AND GPL-2.0-or-later |
| ncurses-terminfo-base | 6.6_p20260516-r0 | X11 |
| nss_wrapper | 1.1.12-r1 | BSD-3-Clause |
| readline | 8.3.3-r1 | GPL-3.0-or-later |
| scanelf | 1.3.9-r1 | GPL-2.0-only |
| ssl_client | 1.37.0-r31 | GPL-2.0-only |
| tzdata | 2026c-r0 | Public-Domain |
| xz-libs | 5.8.3-r0 | GPL-2.0-or-later AND 0BSD AND Public-Domain AND LGPL-2.1-or-later |
| zlib | 1.3.2-r0 | Zlib |
| zstd | 1.5.7-r2 | BSD-3-Clause OR GPL-2.0-or-later |
| zstd-libs | 1.5.7-r2 | BSD-3-Clause OR GPL-2.0-or-later |

</details>

<details>
<summary>Debian приложения · 87 пакетов</summary>

| Пакет | Версия | Декларация дистрибутива | Файл в образе |
| --- | --- | --- | --- |
| `adduser` | 3.152 | GPL-2+ | `/usr/share/doc/adduser/copyright` |
| `apt` | 3.0.4 | BSD-3-clause, Expat, GPL-2, GPL-2+, GPL-2+ and curl, curl | `/usr/share/doc/apt/copyright` |
| `base-files` | 13.8+deb13u7 | GPL-2+, verbatim | `/usr/share/doc/base-files/copyright` |
| `base-passwd` | 3.6.7 | GPL-2, public-domain | `/usr/share/doc/base-passwd/copyright` |
| `bash` | 5.2.37-2+b10 | BSD-4-clause-UC, BSD-4-clause-UC and MIT-like, GFDL-NIV-1.3, GPL-2+, GPL-3+, GPL-3+ with Bison exception, Latex2e, MIT-like, permissive | `/usr/share/doc/bash/copyright` |
| `bsdutils` | 1:2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/bsdutils/copyright` |
| `ca-certificates` | 20250419+deb13u1 | GPL-2+, MPL-2.0 | `/usr/share/doc/ca-certificates/copyright` |
| `coreutils` | 9.7-3 | BSD-4-clause-UC, FSFULLR, GFDL-NIV-1.3, GPL-3+, GPL-3+ and BSD-4-clause-UC, GPL-3+ and ISC, ISC | `/usr/share/doc/coreutils/copyright` |
| `dash` | 0.5.12-12 | BSD-3-Clause, BSD-3-clause, GPL-2+, public-domain | `/usr/share/doc/dash/copyright` |
| `debconf` | 1.5.91 | BSD-2-clause | `/usr/share/doc/debconf/copyright` |
| `debian-archive-keyring` | 2025.1 | GNU GPL и отдельные условия для набора ключей | `/usr/share/doc/debian-archive-keyring/copyright` |
| `debianutils` | 5.23.2 | GPL-2+, SMAIL-GPL, public-domain | `/usr/share/doc/debianutils/copyright` |
| `diffutils` | 1:3.10-4 | FSFAP, FSFULLR, GFDL-NIV-1.3, GPL-2+, GPL-3+, GPL-3+ and FSFULLR, GPL-3+ with autoconf exception, GPL-3+ with texinfo exception, LGPL-2.0+, LGPL-2.1+, LGPL-3.0+, LGPL-3.0+ or GPL-2+, X11, public-domain | `/usr/share/doc/diffutils/copyright` |
| `dpkg` | 1.22.22 | GPL-2+, public-domain-s-s-d | `/usr/share/doc/dpkg/copyright` |
| `findutils` | 4.10.0-3 | BSD-3-clause, BSD-3-clause or GPL-3+, BSD-3-clause or LGPL-2.1+, BSD-3-clause or LGPL-3+, FSFAP, FSFULLR, FSFULLR or GPL or LGPL, GFDL-NIV-1.3+, GFDL-NIV-1.3+ or GFDL-NIV-1.3+, GPL, GPL with automake exception, GPL-2+, GPL-2+ with Autoconf-data exception, GPL-3+, GPL-3+ with Autoconf-data exception, GPL-3+ with Bison-2.2 exception, ISC, ISC or LGPL-2.1+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3, LGPL-3+, X11, public-domain | `/usr/share/doc/findutils/copyright` |
| `gcc-14-base:amd64` | 14.2.0-19 | GPL-3.0-or-later, GCC Runtime Library Exception 3.1 для указанных файлов | `/usr/share/doc/gcc-14-base/copyright` |
| `grep` | 3.11-4 | GPL-3+ | `/usr/share/doc/grep/copyright` |
| `gzip` | 1.13-1+deb13u1 | FSF-manpages, GFDL-1.3+-no-invariant, GPL-3+ | `/usr/share/doc/gzip/copyright` |
| `hostname` | 3.25 | GPL-2 | `/usr/share/doc/hostname/copyright` |
| `init-system-helpers` | 1.69~deb13u1 | BSD-3-clause, GPL-2+ | `/usr/share/doc/init-system-helpers/copyright` |
| `libacl1:amd64` | 2.3.2-2+b1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libacl1/copyright` |
| `libapt-pkg7.0:amd64` | 3.0.4 | BSD-3-clause, Expat, GPL-2, GPL-2+, GPL-2+ and curl, curl | `/usr/share/doc/libapt-pkg7.0/copyright` |
| `libattr1:amd64` | 1:2.5.2-3 | GPL-2+, LGPL-2+ | `/usr/share/doc/libattr1/copyright` |
| `libaudit-common` | 1:4.0.2-2+deb13u1 | GPL-2, LGPL-2.1 | `/usr/share/doc/libaudit-common/copyright` |
| `libaudit1:amd64` | 1:4.0.2-2+deb13u1 | GPL-2, LGPL-2.1 | `/usr/share/doc/libaudit1/copyright` |
| `libblkid1:amd64` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/libblkid1/copyright` |
| `libbsd0:amd64` | 0.12.2-2 | BSD-2-clause, BSD-2-clause-NetBSD, BSD-2-clause-author, BSD-2-clause-verbatim, BSD-3-clause, BSD-3-clause-John-Birrell, BSD-3-clause-Regents, BSD-3-clause-Regents and BSD-2-clause-NetBSD, BSD-3-clause-author, BSD-5-clause-Peter-Wemm, Beerware, Expat, ISC, ISC-Original, public-domain | `/usr/share/doc/libbsd0/copyright` |
| `libbz2-1.0:amd64` | 1.0.8-6 | BSD-variant, GPL-2 | `/usr/share/doc/libbz2-1.0/copyright` |
| `libc-bin` | 2.41-12+deb13u4 | BSD-2-clause, BSD-2-clause or GPL-2, BSD-3-clause-Berkeley, BSD-3-clause-Berkeley and BSD-3-clause-WIDE, BSD-3-clause-Berkeley and DEC, BSD-3-clause-Berkeley and DEC and IBM and ISC, BSD-3-clause-Berkeley and DEC and ISC, BSD-3-clause-Berkeley and DEC and ISC and LGPL-2.1+, BSD-3-clause-Berkeley and DEC and LGPL-2.1+, BSD-3-clause-Berkeley and ISC, BSD-3-clause-Berkeley and LGPL-2.1+, BSD-3-clause-Berkeley and LGPL-2.1+ and Univ-Coimbra, BSD-3-clause-Carnegie, BSD-3-clause-Oracle, BSD-3-clause-WIDE, BSD-like-Spencer, BSL-1.0, CORE-MATH, Carnegie, Carnegie and LGPL-2.1+, DEC, FSFAP, GPL-2, GPL-2+, GPL-2+-with-link-exception, GPL-3+, IBM, IBM and ISC, ISC, ISC and LGPL-2.1+, Inner-Net, Inner-Net and LGPL-2.1+, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and GPL-2, LGPL-2.1+ and SunPro, LGPL-2.1+-with-link-exception, LGPL-3+, MIT-like-Lord, PCRE, SunPro, Unicode-DFS-2016, Univ-Coimbra, public-domain | `/usr/share/doc/libc-bin/copyright` |
| `libc6:amd64` | 2.41-12+deb13u4 | BSD-2-clause, BSD-2-clause or GPL-2, BSD-3-clause-Berkeley, BSD-3-clause-Berkeley and BSD-3-clause-WIDE, BSD-3-clause-Berkeley and DEC, BSD-3-clause-Berkeley and DEC and IBM and ISC, BSD-3-clause-Berkeley and DEC and ISC, BSD-3-clause-Berkeley and DEC and ISC and LGPL-2.1+, BSD-3-clause-Berkeley and DEC and LGPL-2.1+, BSD-3-clause-Berkeley and ISC, BSD-3-clause-Berkeley and LGPL-2.1+, BSD-3-clause-Berkeley and LGPL-2.1+ and Univ-Coimbra, BSD-3-clause-Carnegie, BSD-3-clause-Oracle, BSD-3-clause-WIDE, BSD-like-Spencer, BSL-1.0, CORE-MATH, Carnegie, Carnegie and LGPL-2.1+, DEC, FSFAP, GPL-2, GPL-2+, GPL-2+-with-link-exception, GPL-3+, IBM, IBM and ISC, ISC, ISC and LGPL-2.1+, Inner-Net, Inner-Net and LGPL-2.1+, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and GPL-2, LGPL-2.1+ and SunPro, LGPL-2.1+-with-link-exception, LGPL-3+, MIT-like-Lord, PCRE, SunPro, Unicode-DFS-2016, Univ-Coimbra, public-domain | `/usr/share/doc/libc6/copyright` |
| `libcap-ng0:amd64` | 0.8.5-4+b1 | GPL-2+, GPL-3, LGPL-2.1+ | `/usr/share/doc/libcap-ng0/copyright` |
| `libcap2:amd64` | 1:2.75-10+deb13u1+b3 | BSD-3-clause, BSD-3-clause or GPL-2, BSD-3-clause or GPL-2+, GPL-2, GPL-2+ | `/usr/share/doc/libcap2/copyright` |
| `libcrypt1:amd64` | 1:4.4.38-1 | LGPL-2.1-or-later, public domain и другие условия по файлам | `/usr/share/doc/libcrypt1/copyright` |
| `libdb5.3t64:amd64` | 5.3.28+dfsg2-9 | Artistic or BSD-3-clause, BSD-3-clause, BSD-3-clause-fjord, GPL, GPL or Artistic, GPL-3, MIT-old, Ms-PL, Sleepycat, Sleepycat and BSD-3-clause, TCL-like, X11, zlib | `/usr/share/doc/libdb5.3t64/copyright` |
| `libdebconfclient0:amd64` | 0.280 | BSD-2-Clause, BSD-2-clause, GPL-2+ | `/usr/share/doc/libdebconfclient0/copyright` |
| `libffi8:amd64` | 3.4.8-2 | Expat, GPL, GPL-2+, GPL-3+, MPL-1.1 or GPL-2+ or LGPL-2.1+, X11, public-domain | `/usr/share/doc/libffi8/copyright` |
| `libgcc-s1:amd64` | 14.2.0-19 | GPL-3.0-or-later с GCC Runtime Library Exception 3.1 для библиотеки | `/usr/share/doc/libgcc-s1/copyright` |
| `libgdbm6t64:amd64` | 1.24-2 | GFDL-NIV-1.3+, GPL-2+, GPL-3+ | `/usr/share/doc/libgdbm6t64/copyright` |
| `libgmp10:amd64` | 2:6.3.0+dfsg-3 | GPL-2+, GPL-2+ or LGPL-3+, GPL-3+, GPL-3+ with Bison exception, LGPL-3+ | `/usr/share/doc/libgmp10/copyright` |
| `libhogweed6t64:amd64` | 3.10.1-1 | Expat, GAP, GPL-2, GPL-2+, GPL-3+ with Autoconf exception, LGPL-2+, LGPL-3+, LGPL-3+ or GPL-2+, public-domain | `/usr/share/doc/libhogweed6t64/copyright` |
| `liblastlog2-2:amd64` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/liblastlog2-2/copyright` |
| `liblz4-1:amd64` | 1.10.0-4 | BSD-2-clause, BSD-2-clause or GPL-2+, GPL-2+ | `/usr/share/doc/liblz4-1/copyright` |
| `liblzma5:amd64` | 5.8.1-1+deb13u2 | 0BSD, FSFUL, FSFULLR, GPL-2+, GPL-3.0-or-later-WITH-Autoconf-exception-macro, LGPL-2.1+, PD, PD-debian, noderivs, none, permissive-nowarranty | `/usr/share/doc/liblzma5/copyright` |
| `libmd0:amd64` | 1.1.0-2+b1 | BSD-2-clause, BSD-2-clause-NetBSD, BSD-3-clause, BSD-3-clause-Aaron-D-Gifford, Beerware, ISC, public-domain-md4, public-domain-md5, public-domain-sha1 | `/usr/share/doc/libmd0/copyright` |
| `libmount1:amd64` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/libmount1/copyright` |
| `libncursesw6:amd64` | 6.5+20250216-2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/libncursesw6/copyright` |
| `libnettle8t64:amd64` | 3.10.1-1 | Expat, GAP, GPL-2, GPL-2+, GPL-3+ with Autoconf exception, LGPL-2+, LGPL-3+, LGPL-3+ or GPL-2+, public-domain | `/usr/share/doc/libnettle8t64/copyright` |
| `libpam-modules:amd64` | 1.7.0-5 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam-modules/copyright` |
| `libpam-modules-bin` | 1.7.0-5 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam-modules-bin/copyright` |
| `libpam-runtime` | 1.7.0-5 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam-runtime/copyright` |
| `libpam0g:amd64` | 1.7.0-5 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam0g/copyright` |
| `libpcre2-8-0:amd64` | 10.46-1~deb13u3 | BSD-2-clause, BSD-3-clause, BSD-3-clause-Cambridge with BINARY LIBRARY-LIKE PACKAGES exception, X11, public-domain | `/usr/share/doc/libpcre2-8-0/copyright` |
| `libreadline8t64:amd64` | 8.2-6 | GFDL-NIV-1.3+, GPL-2+, GPL-3, GPL-3+, ISC-no-attribution | `/usr/share/doc/libreadline8t64/copyright` |
| `libseccomp2:amd64` | 2.6.0-2 | LGPL-2.1 | `/usr/share/doc/libseccomp2/copyright` |
| `libselinux1:amd64` | 3.8.1-1 | GPL-2, public-domain | `/usr/share/doc/libselinux1/copyright` |
| `libsemanage-common` | 3.8.1-1 | GPL-2, LGPL-2.1+ | `/usr/share/doc/libsemanage-common/copyright` |
| `libsemanage2:amd64` | 3.8.1-1 | GPL-2, LGPL-2.1+ | `/usr/share/doc/libsemanage2/copyright` |
| `libsepol2:amd64` | 3.8.1-1 | GPL-2, GPL-2+, LGPL-2.1+, Zlib | `/usr/share/doc/libsepol2/copyright` |
| `libsmartcols1:amd64` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/libsmartcols1/copyright` |
| `libsqlite3-0:amd64` | 3.46.1-7+deb13u2 | GPL-2+, public-domain | `/usr/share/doc/libsqlite3-0/copyright` |
| `libssl3t64:amd64` | 3.5.7-1~deb13u3 | Apache-2.0, Artistic, Artistic or GPL-1+, GPL-1+ | `/usr/share/doc/libssl3t64/copyright` |
| `libstdc++6:amd64` | 14.2.0-19 | GPL-3.0-or-later с GCC Runtime Library Exception 3.1 для библиотеки | `/usr/share/doc/libstdc++6/copyright` |
| `libsystemd0:amd64` | 257.13-1~deb13u1 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libsystemd0/copyright` |
| `libtinfo6:amd64` | 6.5+20250216-2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/libtinfo6/copyright` |
| `libudev1:amd64` | 257.13-1~deb13u1 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libudev1/copyright` |
| `libuuid1:amd64` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/libuuid1/copyright` |
| `libxxhash0:amd64` | 0.8.3-2 | BSD-2-clause, BSD-2-clause or GPL-2+, GPL-2+ | `/usr/share/doc/libxxhash0/copyright` |
| `libzstd1:amd64` | 1.5.7+dfsg-1 | BSD-3-clause, BSD-3-clause or GPL-2, Expat, GPL-2, zlib | `/usr/share/doc/libzstd1/copyright` |
| `login` | 1:4.16.0-2+really2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/login/copyright` |
| `login.defs` | 1:4.17.4-2 | BSD-3-clause, GPL-1, GPL-2+ | `/usr/share/doc/login.defs/copyright` |
| `mawk` | 1.3.4.20250131-1 | CC-BY-3.0, GPL-2.0-only, X11 | `/usr/share/doc/mawk/copyright` |
| `mount` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/mount/copyright` |
| `ncurses-base` | 6.5+20250216-2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/ncurses-base/copyright` |
| `ncurses-bin` | 6.5+20250216-2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/ncurses-bin/copyright` |
| `netbase` | 6.5 | GPL-2 | `/usr/share/doc/netbase/copyright` |
| `openssl` | 3.5.7-1~deb13u3 | Apache-2.0, Artistic, Artistic or GPL-1+, GPL-1+ | `/usr/share/doc/openssl/copyright` |
| `openssl-provider-legacy` | 3.5.7-1~deb13u3 | Apache-2.0, Artistic, Artistic or GPL-1+, GPL-1+ | `/usr/share/doc/openssl-provider-legacy/copyright` |
| `passwd` | 1:4.17.4-2 | BSD-3-clause, GPL-1, GPL-2+ | `/usr/share/doc/passwd/copyright` |
| `perl-base` | 5.40.1-6+deb13u1 | Artistic, Artistic or GPL-1+, Artistic or GPL-1+ or Artistic-dist, Artistic-2, Artistic-dist, BSD-3-clause, BSD-3-clause-GENERIC, BSD-3-clause-with-weird-numbering, BSD-4-clause-POWERDOG, BZIP, CC0-1.0, DONT-CHANGE-THE-GPL, Expat, Expat or GPL-1+ or Artistic, FSFAP, GPL-1+, GPL-1+ or Artistic, GPL-1+ or Artistic or Artistic-dist, GPL-1+ or Artistic, and BSD-3-clause-GENERIC, GPL-1+ or Artistic, and BSD-4-clause-POWERDOG, GPL-1+ or Artistic, and Expat, GPL-1+ or Artistic, and Unicode, GPL-2+, GPL-2+ or Artistic, GPL-3+-WITH-BISON-EXCEPTION, LGPL-2.1, REGCOMP, REGCOMP, and GPL-1+ or Artistic, SDBM-PUBLIC-DOMAIN, TEXT-TABS, Unicode, ZLIB | `/usr/share/doc/perl-base/copyright` |
| `readline-common` | 8.2-6 | GFDL-NIV-1.3+, GPL-2+, GPL-3, GPL-3+, ISC-no-attribution | `/usr/share/doc/readline-common/copyright` |
| `sed` | 4.9-2+deb13u1 | BSD-4-clause-UC, BSL-1, GFDL-NIV-1.3+, GPL-3+, GPL-3+ and ISC, ISC, X11, pcre | `/usr/share/doc/sed/copyright` |
| `sqv` | 1.3.0-3+b2 | LGPL-2.0-or-later | `/usr/share/doc/sqv/copyright` |
| `sysvinit-utils` | 3.14-4 | GPL-2.0, GPL-2.0+, GPL-3.0, LGPL-2.1+ | `/usr/share/doc/sysvinit-utils/copyright` |
| `tar` | 1.35+dfsg-3.1 | GPL-2+, GPL-3+, GPL-3+ with Bison exception, LGPL-2.1+, LGPL-3+ | `/usr/share/doc/tar/copyright` |
| `tzdata` | 2026f-0+deb13u1 | public-domain | `/usr/share/doc/tzdata/copyright` |
| `util-linux` | 2.41.5-0+deb13u1 | BSD-2-clause, BSD-3-clause, BSD-4-clause, BSLA, Expat, GPL-2, GPL-2+, GPL-3+, ISC, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, public-domain | `/usr/share/doc/util-linux/copyright` |
| `zlib1g:amd64` | 1:1.3.dfsg+really1.3.1-1+b1 | Zlib | `/usr/share/doc/zlib1g/copyright` |

</details>

<details>
<summary>Ubuntu браузерной приёмки · 515 пакетов</summary>

| Пакет | Версия | Декларация дистрибутива | Файл в образе |
| --- | --- | --- | --- |
| `adduser` | 3.137ubuntu1 | GPL-2+ | `/usr/share/doc/adduser/copyright` |
| `adwaita-icon-theme` | 46.0-1 | CC-BY-3.0-US, CC-BY-SA-2.0-IT, CC-BY-SA-3.0 or LGPL-3, and CC-BY-SA-4.0, CC-BY-SA-3.0-US, CC-BY-SA-3.0-US or LGPL-3, CC-BY-SA-3.0-Unported, CC-BY-SA-4.0, GFDL-1.2+, GFDL-1.2+ or CC-BY-SA-3.0-Unported or CC-BY-SA-2.0-IT, and CC-BY-3.0-US, GPL-2, GPL-3+, GPL-unspecified | `/usr/share/doc/adwaita-icon-theme/copyright` |
| `apt` | 2.8.3 | BSD-3-clause, Expat, GPL-2, GPL-2+ | `/usr/share/doc/apt/copyright` |
| `at-spi2-common` | 2.52.0-1build1 | AFL-2.1, AFL-2.1 or GPL-2+, GPL-2, GPL-2+, LGPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/at-spi2-common/copyright` |
| `base-files` | 13ubuntu10.5 | текст уведомления | `/usr/share/doc/base-files/copyright` |
| `base-passwd` | 3.6.3build1 | GPL-2, public-domain | `/usr/share/doc/base-passwd/copyright` |
| `bash` | 5.2.21-2ubuntu4 | BSD-4-clause-UC, BSD-4-clause-UC and MIT-like, GFDL-NIV-1.3, GPL-2+, GPL-3+, GPL-3+ with Bison exception, Latex2e, MIT-like, permissive | `/usr/share/doc/bash/copyright` |
| `bsdutils` | 1:2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/bsdutils/copyright` |
| `ca-certificates` | 20260816ubuntu0.24.04.1 | GPL-2+, MPL-2.0 | `/usr/share/doc/ca-certificates/copyright` |
| `coreutils` | 9.4-3ubuntu6.3 | BSD-4-clause-UC, FSFULLR, GFDL-NIV-1.3, GPL-3+, GPL-3+ and BSD-4-clause-UC, GPL-3+ and ISC, ISC | `/usr/share/doc/coreutils/copyright` |
| `curl` | 8.5.0-2ubuntu10.16 | BSD-3-Clause, BSD-3-clause, BSD-4-Clause-UC, FSFULLR, GPL-2+ with Autoconf-data exception, GPL-2+ with Libtool exception, GPL-3+ with Autoconf-data exception, ISC, OLDAP-2.8, X11, curl | `/usr/share/doc/curl/copyright` |
| `dash` | 0.5.12-6ubuntu5 | BSD-3-Clause, BSD-3-clause, GPL-2+, public-domain | `/usr/share/doc/dash/copyright` |
| `dbus` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/dbus/copyright` |
| `dbus-bin` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/dbus-bin/copyright` |
| `dbus-daemon` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/dbus-daemon/copyright` |
| `dbus-session-bus-common` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/dbus-session-bus-common/copyright` |
| `dbus-system-bus-common` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/dbus-system-bus-common/copyright` |
| `dbus-user-session` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/dbus-user-session/copyright` |
| `dconf-gsettings-backend:amd64` | 0.40.0-4ubuntu0.1 | GPL-3, LGPL-2+ | `/usr/share/doc/dconf-gsettings-backend/copyright` |
| `dconf-service` | 0.40.0-4ubuntu0.1 | GPL-3, LGPL-2+ | `/usr/share/doc/dconf-service/copyright` |
| `debconf` | 1.5.86ubuntu1 | BSD-2-clause | `/usr/share/doc/debconf/copyright` |
| `debianutils` | 5.17build1 | GPL-2+, SMAIL-GPL, public-domain | `/usr/share/doc/debianutils/copyright` |
| `dictionaries-common` | 1.29.7 | GPL-2+, GPL-3+ | `/usr/share/doc/dictionaries-common/copyright` |
| `diffutils` | 1:3.10-1ubuntu0.1 | FSFAP, FSFULLR, GFDL-NIV-1.3, GPL-2+, GPL-3+, GPL-3+ and FSFULLR, GPL-3+ with autoconf exception, GPL-3+ with texinfo exception, LGPL-2.0+, LGPL-2.1+, LGPL-3.0+, LGPL-3.0+ or GPL-2+, X11, public-domain | `/usr/share/doc/diffutils/copyright` |
| `dirmngr` | 2.4.4-2ubuntu17.6 | BSD-3-clause, CC0-1.0, Expat, GPL-2+, GPL-3+, GPL-3+ or BSD-3-clause, LGPL-2.1+, LGPL-3+, LGPL-3+ or GPL-2+, RFC-Reference, TinySCHEME, permissive | `/usr/share/doc/dirmngr/copyright` |
| `dpkg` | 1.22.6ubuntu6.6 | GPL-2+, public-domain-s-s-d | `/usr/share/doc/dpkg/copyright` |
| `e2fsprogs` | 1.47.0-2.4~exp1ubuntu4.1 | Apache-2, BSD-3-Clause, GPL or MIT-US-export, GPL-2, GPL-2+ with Texinfo exception, ISC, Kazlib, LGPL-2, Latex2e | `/usr/share/doc/e2fsprogs/copyright` |
| `emacsen-common` | 3.0.5 | текст уведомления | `/usr/share/doc/emacsen-common/copyright` |
| `findutils` | 4.9.0-5build1 | BSD-3-clause, BSD-3-clause and/or GPL-3+, FSFAP, FSFULLR, GFDL-NIV-1.3+, GPL with automake exception, GPL-2+, GPL-2+ with Autoconf-data exception, GPL-3+, GPL-3+ with Autoconf-data exception, GPL-3+ with Bison-2.2 exception, ISC, ISC and/or LGPL-2.1+, LGPL-2+, LGPL-2.1+, LGPL-3, LGPL-3+, X11, public-domain | `/usr/share/doc/findutils/copyright` |
| `fontconfig` | 2.15.0-1.1ubuntu2 | текст уведомления | `/usr/share/doc/fontconfig/copyright` |
| `fontconfig-config` | 2.15.0-1.1ubuntu2 | текст уведомления | `/usr/share/doc/fontconfig-config/copyright` |
| `fonts-freefont-ttf` | 20211204+svn4273-2 | GPL-3+, GPL-3+ with Special Font Exception | `/usr/share/doc/fonts-freefont-ttf/copyright` |
| `fonts-ipafont-gothic` | 00303-21ubuntu1 | GPL-3+, IPA-1 | `/usr/share/doc/fonts-ipafont-gothic/copyright` |
| `fonts-liberation` | 1:2.1.5-3 | GPL-2+, SIL-OFL-1.1 | `/usr/share/doc/fonts-liberation/copyright` |
| `fonts-noto-color-emoji` | 2.047-0ubuntu0.24.04.1 | Apache-2.0, SIL-1.1 | `/usr/share/doc/fonts-noto-color-emoji/copyright` |
| `fonts-tlwg-loma-otf` | 1:0.7.3-1 | GPL-2+, GPL-2+ with Font exception, LPPL, other | `/usr/share/doc/fonts-tlwg-loma-otf/copyright` |
| `fonts-unifont` | 1:15.1.01-1build1 | GFDL-NIV, GPL-2+ | `/usr/share/doc/fonts-unifont/copyright` |
| `fonts-wqy-zenhei` | 0.9.45-8 | GPL-2 with Font embedding exception, GPL-2 with Font embedding exception and M+ FONTS License, M+ FONTS License | `/usr/share/doc/fonts-wqy-zenhei/copyright` |
| `gcc-14-base:amd64` | 14.2.0-4ubuntu2~24.04.1 | GPL-3.0-or-later, GCC Runtime Library Exception 3.1 для указанных файлов | `/usr/share/doc/gcc-14-base/copyright` |
| `git` | 1:2.43.0-1ubuntu7.4 | Apache-2.0, BSD-3-clause, Boost, EDL-1.0, Expat, GPL-1+ or Artistic-1, GPL-2, GPL-2+, ISC, LGPL-2+, LGPL-2.1+, Zlib, dlmalloc, mingw-runtime | `/usr/share/doc/git/copyright` |
| `git-man` | 1:2.43.0-1ubuntu7.4 | Apache-2.0, BSD-3-clause, Boost, EDL-1.0, Expat, GPL-1+ or Artistic-1, GPL-2, GPL-2+, ISC, LGPL-2+, LGPL-2.1+, Zlib, dlmalloc, mingw-runtime | `/usr/share/doc/git-man/copyright` |
| `glib-networking:amd64` | 2.80.0-1build1 | LGPL-2+, LGPL-2+ and LGPL-2.1+, LGPL-2.1+ | `/usr/share/doc/glib-networking/copyright` |
| `glib-networking-common` | 2.80.0-1build1 | LGPL-2+, LGPL-2+ and LGPL-2.1+, LGPL-2.1+ | `/usr/share/doc/glib-networking-common/copyright` |
| `glib-networking-services` | 2.80.0-1build1 | LGPL-2+, LGPL-2+ and LGPL-2.1+, LGPL-2.1+ | `/usr/share/doc/glib-networking-services/copyright` |
| `gpg` | 2.4.4-2ubuntu17.6 | BSD-3-clause, CC0-1.0, Expat, GPL-2+, GPL-3+, GPL-3+ or BSD-3-clause, LGPL-2.1+, LGPL-3+, LGPL-3+ or GPL-2+, RFC-Reference, TinySCHEME, permissive | `/usr/share/doc/gpg/copyright` |
| `gpg-agent` | 2.4.4-2ubuntu17.6 | BSD-3-clause, CC0-1.0, Expat, GPL-2+, GPL-3+, GPL-3+ or BSD-3-clause, LGPL-2.1+, LGPL-3+, LGPL-3+ or GPL-2+, RFC-Reference, TinySCHEME, permissive | `/usr/share/doc/gpg-agent/copyright` |
| `gpgconf` | 2.4.4-2ubuntu17.6 | BSD-3-clause, CC0-1.0, Expat, GPL-2+, GPL-3+, GPL-3+ or BSD-3-clause, LGPL-2.1+, LGPL-3+, LGPL-3+ or GPL-2+, RFC-Reference, TinySCHEME, permissive | `/usr/share/doc/gpgconf/copyright` |
| `gpgv` | 2.4.4-2ubuntu17.6 | BSD-3-clause, CC0-1.0, Expat, GPL-2+, GPL-3+, GPL-3+ or BSD-3-clause, LGPL-2.1+, LGPL-3+, LGPL-3+ or GPL-2+, RFC-Reference, TinySCHEME, permissive | `/usr/share/doc/gpgv/copyright` |
| `grep` | 3.11-4build1 | GPL-3+ | `/usr/share/doc/grep/copyright` |
| `gsettings-desktop-schemas` | 46.1-0ubuntu1 | LGPL-2.1+ | `/usr/share/doc/gsettings-desktop-schemas/copyright` |
| `gstreamer1.0-libav:amd64` | 1.24.1-1build1 | LGPL-2+, LGPL-2.1+ | `/usr/share/doc/gstreamer1.0-libav/copyright` |
| `gstreamer1.0-plugins-bad:amd64` | 1.24.2-1ubuntu4 | BSD (2 clause), BSD (3 clause), GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-2.1,, MIT/X11 (BSD like), MIT/X11 (BSD like) LGPL-2+, MPL-1.1, MPL-1.1 GPL, MPL-1.1 GPL GPL-2+ LGPL (v2 or later) (with incorrect FSF address), MPL-1.1 LGPL-2+, UNKNOWN | `/usr/share/doc/gstreamer1.0-plugins-bad/copyright` |
| `gstreamer1.0-plugins-base:amd64` | 1.24.2-1ubuntu0.5 | BSD (2 clause), BSD (3 clause), GPL-2+, LGPL-2+, MIT/X11 (BSD like) LGPL-2+ | `/usr/share/doc/gstreamer1.0-plugins-base/copyright` |
| `gstreamer1.0-plugins-good:amd64` | 1.24.2-1ubuntu1.8 | BSD, BSD (3 clause), GPL-2+, LGPL, LGPL-2, LGPL-2+, LGPL-2.1+, MIT/X11 (BSD like) LGPL-2+ | `/usr/share/doc/gstreamer1.0-plugins-good/copyright` |
| `gtk-update-icon-cache` | 3.24.41-4ubuntu1.3 | Apache-2.0, CC-BY-SA-4.0, Expat, GPL-3+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and Expat, LGPL-2+ and ZPL-2.1, LGPL-2+ or SWL, LGPL-2.1+, SWL, X11R5-permissive, ZPL-2.1, check-gdk-cairo-permissive, other, unencumbered | `/usr/share/doc/gtk-update-icon-cache/copyright` |
| `gzip` | 1.12-1ubuntu3.2 | FSF-manpages, GFDL-1.3+-no-invariant, GPL-3+ | `/usr/share/doc/gzip/copyright` |
| `hicolor-icon-theme` | 0.17-2 | GPL-2+ | `/usr/share/doc/hicolor-icon-theme/copyright` |
| `hostname` | 3.23+nmu2ubuntu2 | GPL-2 | `/usr/share/doc/hostname/copyright` |
| `humanity-icon-theme` | 0.6.16 | текст уведомления | `/usr/share/doc/humanity-icon-theme/copyright` |
| `hunspell-en-us` | 1:2020.12.07-2 | текст уведомления | `/usr/share/doc/hunspell-en-us/copyright` |
| `init-system-helpers` | 1.66ubuntu1 | BSD-3-clause, GPL-2+ | `/usr/share/doc/init-system-helpers/copyright` |
| `iso-codes` | 4.16.0-1 | LGPL-2.1+ | `/usr/share/doc/iso-codes/copyright` |
| `krb5-locales` | 1.20.1-6ubuntu2.10 | текст уведомления | `/usr/share/doc/krb5-locales/copyright` |
| `libaa1:amd64` | 1.4p5-51.1 | Abstyles, Custom, LGPL-2.0+ | `/usr/share/doc/libaa1/copyright` |
| `libabsl20220623t64:amd64` | 20220623.1-3.1ubuntu3.2 | Apache-2.0 | `/usr/share/doc/libabsl20220623t64/copyright` |
| `libacl1:amd64` | 2.3.2-1build1.1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libacl1/copyright` |
| `libaom3:amd64` | 3.8.2-2ubuntu0.2 | BSD-2-Clause, BSD-2-clause, BSD-3-clause, Expat, ISC, public-domain-md5 | `/usr/share/doc/libaom3/copyright` |
| `libapparmor1:amd64` | 4.0.1really4.0.1-0ubuntu0.24.04.9 | BSD-3-clause, BSD-3-clause or GPL-2+, GPL-2, GPL-2+, LGPL-2.1+ | `/usr/share/doc/libapparmor1/copyright` |
| `libapt-pkg6.0t64:amd64` | 2.8.3 | BSD-3-clause, Expat, GPL-2, GPL-2+ | `/usr/share/doc/libapt-pkg6.0t64/copyright` |
| `libargon2-1:amd64` | 0~20190702+dfsg-4build1 | Apache-2.0, CC0, CC0 or Apache-2.0 | `/usr/share/doc/libargon2-1/copyright` |
| `libasound2-data` | 1.2.11-1ubuntu0.3 | LPGL-2.1+ | `/usr/share/doc/libasound2-data/copyright` |
| `libasound2t64:amd64` | 1.2.11-1ubuntu0.3 | LPGL-2.1+ | `/usr/share/doc/libasound2t64/copyright` |
| `libaspell15:amd64` | 0.60.8.1-1build1 | GFDL-1.2+, LGPL-2.1+ | `/usr/share/doc/libaspell15/copyright` |
| `libass9:amd64` | 1:0.17.1-2build1 | GPL-2+, ISC, NTP, Unlicense | `/usr/share/doc/libass9/copyright` |
| `libassuan0:amd64` | 2.5.6-1build1 | GAP, GAP~FSF, GPL-2+, GPL-2+ with libtool exception, GPL-3+, LGPL-2.1+, LGPL-3+ | `/usr/share/doc/libassuan0/copyright` |
| `libasyncns0:amd64` | 0.8-6build4 | LGPL-2.1+ | `/usr/share/doc/libasyncns0/copyright` |
| `libatk-bridge2.0-0t64:amd64` | 2.52.0-1build1 | AFL-2.1, AFL-2.1 or GPL-2+, GPL-2, GPL-2+, LGPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libatk-bridge2.0-0t64/copyright` |
| `libatk1.0-0t64:amd64` | 2.52.0-1build1 | AFL-2.1, AFL-2.1 or GPL-2+, GPL-2, GPL-2+, LGPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libatk1.0-0t64/copyright` |
| `libatomic1:amd64` | 14.2.0-4ubuntu2~24.04.1 | текст уведомления | `/usr/share/doc/libatomic1/copyright` |
| `libatspi2.0-0t64:amd64` | 2.52.0-1build1 | AFL-2.1, AFL-2.1 or GPL-2+, GPL-2, GPL-2+, LGPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libatspi2.0-0t64/copyright` |
| `libattr1:amd64` | 1:2.5.2-1ubuntu0.1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libattr1/copyright` |
| `libaudit-common` | 1:3.1.2-2.1ubuntu0.1 | GPL-2, LGPL-2.1 | `/usr/share/doc/libaudit-common/copyright` |
| `libaudit1:amd64` | 1:3.1.2-2.1ubuntu0.1 | GPL-2, LGPL-2.1 | `/usr/share/doc/libaudit1/copyright` |
| `libavahi-client3:amd64` | 0.8-13ubuntu6.2 | текст уведомления | `/usr/share/doc/libavahi-client3/copyright` |
| `libavahi-common-data:amd64` | 0.8-13ubuntu6.2 | текст уведомления | `/usr/share/doc/libavahi-common-data/copyright` |
| `libavahi-common3:amd64` | 0.8-13ubuntu6.2 | текст уведомления | `/usr/share/doc/libavahi-common3/copyright` |
| `libavc1394-0:amd64` | 0.5.4-5build3 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libavc1394-0/copyright` |
| `libavcodec60:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libavcodec60/copyright` |
| `libavfilter9:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libavfilter9/copyright` |
| `libavformat60:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libavformat60/copyright` |
| `libavif16:amd64` | 1.0.4-1ubuntu3 | Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC0-1.0, custom-1 | `/usr/share/doc/libavif16/copyright` |
| `libavtp0:amd64` | 0.2.0-1build1 | BSD-3-clause | `/usr/share/doc/libavtp0/copyright` |
| `libavutil58:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libavutil58/copyright` |
| `libblas3:amd64` | 3.12.0-3build1.1 | BSD-3-clause, BSD-3-clause-intel | `/usr/share/doc/libblas3/copyright` |
| `libblkid1:amd64` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/libblkid1/copyright` |
| `libbluray2:amd64` | 1:1.3.4-1build1 | BSD-3-clause, GPL-2+, LGPL-2.1+, MPL-1.0, MPL-1.0 or GPL-2+ or LGPL-2.1+, custom | `/usr/share/doc/libbluray2/copyright` |
| `libbrotli1:amd64` | 1.1.0-2ubuntu0.1 | MIT | `/usr/share/doc/libbrotli1/copyright` |
| `libbs2b0:amd64` | 3.1.0+dfsg-7build1 | Expat, FSF-unlimited, GPL-2+, GPL-3+, MIT+FSF-public | `/usr/share/doc/libbs2b0/copyright` |
| `libbsd0:amd64` | 0.12.1-1build1.1 | BSD-2-clause, BSD-2-clause-NetBSD, BSD-2-clause-author, BSD-2-clause-verbatim, BSD-3-clause, BSD-3-clause-John-Birrell, BSD-3-clause-Regents, BSD-3-clause-Regents and BSD-2-clause-NetBSD, BSD-3-clause-author, BSD-5-clause-Peter-Wemm, Beerware, Expat, ISC, ISC-Original, public-domain | `/usr/share/doc/libbsd0/copyright` |
| `libbz2-1.0:amd64` | 1.0.8-5.1ubuntu0.1 | BSD-variant, GPL-2 | `/usr/share/doc/libbz2-1.0/copyright` |
| `libc-bin` | 2.39-0ubuntu8.9 | текст уведомления | `/usr/share/doc/libc-bin/copyright` |
| `libc6:amd64` | 2.39-0ubuntu8.9 | текст уведомления | `/usr/share/doc/libc6/copyright` |
| `libcaca0:amd64` | 0.99.beta20-4ubuntu0.2 | GPL, GPL-2+, ISC, LGPL-2+, WTFPL-2 | `/usr/share/doc/libcaca0/copyright` |
| `libcairo-gobject2:amd64` | 1.18.0-3build1 | текст уведомления | `/usr/share/doc/libcairo-gobject2/copyright` |
| `libcairo-script-interpreter2:amd64` | 1.18.0-3build1 | текст уведомления | `/usr/share/doc/libcairo-script-interpreter2/copyright` |
| `libcairo2:amd64` | 1.18.0-3build1 | текст уведомления | `/usr/share/doc/libcairo2/copyright` |
| `libcap-ng0:amd64` | 0.8.4-2build2 | GPL-2+, GPL-3, LGPL-2.1+ | `/usr/share/doc/libcap-ng0/copyright` |
| `libcap2:amd64` | 1:2.66-5ubuntu2.4 | BSD-3-clause, BSD-3-clause or GPL-2, BSD-3-clause or GPL-2+, GPL-2, GPL-2+ | `/usr/share/doc/libcap2/copyright` |
| `libcap2-bin` | 1:2.66-5ubuntu2.4 | BSD-3-clause, BSD-3-clause or GPL-2, BSD-3-clause or GPL-2+, GPL-2, GPL-2+ | `/usr/share/doc/libcap2-bin/copyright` |
| `libcbor0.10:amd64` | 0.10.2-1.2ubuntu2 | Expat | `/usr/share/doc/libcbor0.10/copyright` |
| `libcdparanoia0:amd64` | 3.10.2+debian-14build3 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libcdparanoia0/copyright` |
| `libchromaprint1:amd64` | 1.5.1-5 | BSD-3-clause, Expat, LGPL-2.1+ | `/usr/share/doc/libchromaprint1/copyright` |
| `libcjson1:amd64` | 1.7.17-1 | Apache-2.0, MIT | `/usr/share/doc/libcjson1/copyright` |
| `libcodec2-1.2:amd64` | 1.2.0-2build1 | JMVBSD, KISSFFTBSD, LGPL-2.1 | `/usr/share/doc/libcodec2-1.2/copyright` |
| `libcolord2:amd64` | 1.4.7-1build2 | CC0-1.0, CC0-1.0 and NPES, GFDL-NIV, GPL-2+, LGPL-2.1+, NPES | `/usr/share/doc/libcolord2/copyright` |
| `libcom-err2:amd64` | 1.47.0-2.4~exp1ubuntu4.1 | Apache-2, BSD-3-Clause, GPL or MIT-US-export, GPL-2, GPL-2+ with Texinfo exception, ISC, Kazlib, LGPL-2, Latex2e | `/usr/share/doc/libcom-err2/copyright` |
| `libcrypt1:amd64` | 1:4.4.36-4build1 | LGPL-2.1-or-later, public domain и другие условия по файлам | `/usr/share/doc/libcrypt1/copyright` |
| `libcryptsetup12:amd64` | 2:2.7.0-1ubuntu4.2 | Apache-2.0, CC0, CC0 or Apache-2.0, GPL-2+, GPL-2+ with OpenSSL exception, GPL-3+, LGPL-2.1+, LGPL-2.1+ with OpenSSL exception, public-domain | `/usr/share/doc/libcryptsetup12/copyright` |
| `libcups2t64:amd64` | 2.4.7-1.2ubuntu7.14 | Apache-2.0, Apache-2.0-with-GPL2-LGPL2-Exception, Apache-2.0-with-GPL2-LGPL2-Exception or BSD-2-clause, BSD-2-Clause, FSFUL, Zlib | `/usr/share/doc/libcups2t64/copyright` |
| `libcurl3t64-gnutls:amd64` | 8.5.0-2ubuntu10.16 | BSD-3-Clause, BSD-3-clause, BSD-4-Clause-UC, FSFULLR, GPL-2+ with Autoconf-data exception, GPL-2+ with Libtool exception, GPL-3+ with Autoconf-data exception, ISC, OLDAP-2.8, X11, curl | `/usr/share/doc/libcurl3t64-gnutls/copyright` |
| `libcurl4t64:amd64` | 8.5.0-2ubuntu10.16 | BSD-3-Clause, BSD-3-clause, BSD-4-Clause-UC, FSFULLR, GPL-2+ with Autoconf-data exception, GPL-2+ with Libtool exception, GPL-3+ with Autoconf-data exception, ISC, OLDAP-2.8, X11, curl | `/usr/share/doc/libcurl4t64/copyright` |
| `libdatrie1:amd64` | 0.2.13-3build1 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libdatrie1/copyright` |
| `libdav1d7:amd64` | 1.4.1-1build1 | BSD-2-clause, ISC, ISC and BSD-2-clause, public-domain | `/usr/share/doc/libdav1d7/copyright` |
| `libdb5.3t64:amd64` | 5.3.28+dfsg2-7 | Artistic or BSD-3-clause, BSD-3-clause, BSD-3-clause-fjord, GPL, GPL or Artistic, GPL-3, MIT-old, Ms-PL, Sleepycat, Sleepycat and BSD-3-clause, TCL-like, X11, zlib | `/usr/share/doc/libdb5.3t64/copyright` |
| `libdbus-1-3:amd64` | 1.14.10-4ubuntu4.1 | AFL-2.1, BSD-3-clause, BSD-3-clause and BSD-3-clause-generic, BSD-3-clause-generic, Expat, FSF-unlimited-permission, GPL-2+, GPL-2+ or AFL-2.1, and Expat and Tcl-BSDish, LGPL-2.1+, Tcl-BSDish, autoconf-archive-permissive, g10-permissive | `/usr/share/doc/libdbus-1-3/copyright` |
| `libdc1394-25:amd64` | 2.2.6-4build1 | текст уведомления | `/usr/share/doc/libdc1394-25/copyright` |
| `libdca0:amd64` | 0.0.7-2build1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libdca0/copyright` |
| `libdconf1:amd64` | 0.40.0-4ubuntu0.1 | GPL-3, LGPL-2+ | `/usr/share/doc/libdconf1/copyright` |
| `libde265-0:amd64` | 1.0.15-1ubuntu0.2 | BSD-4-clause, GPL-3+, LGPL-3+, other-1, public-domain-1 | `/usr/share/doc/libde265-0/copyright` |
| `libdebconfclient0:amd64` | 0.271ubuntu3 | BSD-2-Clause, BSD-2-clause, GPL-2+ | `/usr/share/doc/libdebconfclient0/copyright` |
| `libdecor-0-0:amd64` | 0.2.2-1build2 | Expat, GPL-3.0+ | `/usr/share/doc/libdecor-0-0/copyright` |
| `libdeflate0:amd64` | 1.19-1build1.1 | Expat | `/usr/share/doc/libdeflate0/copyright` |
| `libdevmapper1.02.1:amd64` | 2:1.02.185-3ubuntu3.2 | BSD-2-Clause, GPL-2.0, GPL-2.0+, LGPL-2.1 | `/usr/share/doc/libdevmapper1.02.1/copyright` |
| `libdirectfb-1.7-7t64:amd64` | 1.7.7-11.1ubuntu2 | Apache-2.0, BSD-3-clause, BSD-3-clause or GPL-2+, Expat, GPL-2, GPL-2 and Expat, GPL-2+, LGPL-2.0+, LGPL-2.0+ and Expat, LGPL-2.1+ | `/usr/share/doc/libdirectfb-1.7-7t64/copyright` |
| `libdrm-amdgpu1:amd64` | 2.4.125-1ubuntu0.1~24.04.2 | текст уведомления | `/usr/share/doc/libdrm-amdgpu1/copyright` |
| `libdrm-common` | 2.4.125-1ubuntu0.1~24.04.2 | текст уведомления | `/usr/share/doc/libdrm-common/copyright` |
| `libdrm-intel1:amd64` | 2.4.125-1ubuntu0.1~24.04.2 | текст уведомления | `/usr/share/doc/libdrm-intel1/copyright` |
| `libdrm2:amd64` | 2.4.125-1ubuntu0.1~24.04.2 | текст уведомления | `/usr/share/doc/libdrm2/copyright` |
| `libduktape207:amd64` | 2.7.0+tests-0ubuntu3 | CC0, expat, unicode | `/usr/share/doc/libduktape207/copyright` |
| `libdv4t64:amd64` | 1.0.0-17.1build1 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libdv4t64/copyright` |
| `libdvdnav4:amd64` | 6.1.1-3build1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libdvdnav4/copyright` |
| `libdvdread8t64:amd64` | 6.1.3-1.1build1 | GPL-2, GPL-2 or GPL-3, GPL-2+, GPL-3, LGPL-2.1+ | `/usr/share/doc/libdvdread8t64/copyright` |
| `libdw1t64:amd64` | 0.190-1.1ubuntu0.1 | BSD-2-clause, GFDL-NIV-1.3, GPL-3+, GPL-3+ with Bison exception, LGPL-2.1+, LGPL-3+ or GPL-2+ | `/usr/share/doc/libdw1t64/copyright` |
| `libedit2:amd64` | 3.1-20230828-1build1 | BSD-3-clause | `/usr/share/doc/libedit2/copyright` |
| `libegl-mesa0:amd64` | 25.2.8-0ubuntu0.24.04.4 | (MIT OR Apache-2.0) AND Unicode-DFS-2016, Apache-2.0, Apache-2.0 OR MIT, BSD-2-clause, BSD-3-google, BSL, GPL, GPL-1+, GPL-2, GPL-2 or MIT, Khronos, MIT, MIT OR Apache-2.0, MLAA, SGI, Unicode-DFS-2016 | `/usr/share/doc/libegl-mesa0/copyright` |
| `libegl1:amd64` | 1.7.0-1build1 | Apache-2.0, BSD-1-clause, GPL, GPL-3+, MIT, public-domain | `/usr/share/doc/libegl1/copyright` |
| `libelf1t64:amd64` | 0.190-1.1ubuntu0.1 | BSD-2-clause, GFDL-NIV-1.3, GPL-3+, GPL-3+ with Bison exception, LGPL-2.1+, LGPL-3+ or GPL-2+ | `/usr/share/doc/libelf1t64/copyright` |
| `libenchant-2-2:amd64` | 2.3.3-2build2 | Expat, FSFAP, GPL-2.0+, GPL-3.0+, LGPL-2.0+, LGPL-2.1+, LGPL-3.0+ | `/usr/share/doc/libenchant-2-2/copyright` |
| `libepoxy0:amd64` | 1.5.10-1build1 | Expat | `/usr/share/doc/libepoxy0/copyright` |
| `liberror-perl` | 0.17029-2 | Artistic, Artistic or GPL-1+, GPL-1+, MIT/X11 | `/usr/share/doc/liberror-perl/copyright` |
| `libevdev2:amd64` | 1.13.1+dfsg-1build1 | Apache-2.0, BSD-3, GPL-2, GPL-2+, MIT | `/usr/share/doc/libevdev2/copyright` |
| `libevent-2.1-7t64:amd64` | 2.1.12-stable-9ubuntu2.2 | BSD-2-clause, BSD-3-clause, BSL, Expat, FSFUL, FSFULLR, FSFULLR-No-Warranty, GPL-2+, GPL-3+, ISC, curl | `/usr/share/doc/libevent-2.1-7t64/copyright` |
| `libexpat1:amd64` | 2.6.1-2ubuntu0.6 | MIT | `/usr/share/doc/libexpat1/copyright` |
| `libext2fs2t64:amd64` | 1.47.0-2.4~exp1ubuntu4.1 | Apache-2, BSD-3-Clause, GPL or MIT-US-export, GPL-2, GPL-2+ with Texinfo exception, ISC, Kazlib, LGPL-2, Latex2e | `/usr/share/doc/libext2fs2t64/copyright` |
| `libfaad2:amd64` | 2.11.1-1build1 | GPL-2+, GPL-3+ | `/usr/share/doc/libfaad2/copyright` |
| `libfdisk1:amd64` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/libfdisk1/copyright` |
| `libffi8:amd64` | 3.4.6-1build1 | Expat, GPL, GPL-2+, GPL-3+, MPL-1.1 or GPL-2+ or LGPL-2.1+, X11, public-domain | `/usr/share/doc/libffi8/copyright` |
| `libfftw3-double3:amd64` | 3.3.10-1ubuntu3 | GPL-2+ | `/usr/share/doc/libfftw3-double3/copyright` |
| `libfido2-1:amd64` | 1.14.0-1build3 | BSD-2-clause, ISC, ISC and BSD-2-clause, public-domain | `/usr/share/doc/libfido2-1/copyright` |
| `libflac12t64:amd64` | 1.4.3+ds-2.1ubuntu2 | BSD-3-clause, GFDL-1.1+, GPL-2+, GPL-2+ or LGPL-2.1+, ISC, LGPL-2+, LGPL-2.1+, Public-domain | `/usr/share/doc/libflac12t64/copyright` |
| `libflite1:amd64` | 2.2-6build3 | текст уведомления | `/usr/share/doc/libflite1/copyright` |
| `libfluidsynth3:amd64` | 2.3.4-1build3 | CC-BY-SA-3.0, LGPL-2+, LGPL-2.1+, MIT/X11, Public-domain | `/usr/share/doc/libfluidsynth3/copyright` |
| `libfontconfig1:amd64` | 2.15.0-1.1ubuntu2 | текст уведомления | `/usr/share/doc/libfontconfig1/copyright` |
| `libfontenc1:amd64` | 1:1.1.8-1build1 | текст уведомления | `/usr/share/doc/libfontenc1/copyright` |
| `libfreeaptx0:amd64` | 0.1.1-2build1 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libfreeaptx0/copyright` |
| `libfreetype6:amd64` | 2.13.2+dfsg-1ubuntu0.2 | BSD-3-Clause, BSL-1.0, Expat, FSFAP, FTL, FTL and Expat, GPL-2+, GPL-3+, MIT-Modern-Variant, MIT-SMC, OpenGroup-MIT, Public-Domain, Zlib | `/usr/share/doc/libfreetype6/copyright` |
| `libfribidi0:amd64` | 1.0.13-3build1 | LGPL-2.1+ | `/usr/share/doc/libfribidi0/copyright` |
| `libgav1-1:amd64` | 0.18.0-1build3 | Apache-2.0, BSD-3-clause | `/usr/share/doc/libgav1-1/copyright` |
| `libgbm1:amd64` | 25.2.8-0ubuntu0.24.04.4 | (MIT OR Apache-2.0) AND Unicode-DFS-2016, Apache-2.0, Apache-2.0 OR MIT, BSD-2-clause, BSD-3-google, BSL, GPL, GPL-1+, GPL-2, GPL-2 or MIT, Khronos, MIT, MIT OR Apache-2.0, MLAA, SGI, Unicode-DFS-2016 | `/usr/share/doc/libgbm1/copyright` |
| `libgcc-s1:amd64` | 14.2.0-4ubuntu2~24.04.1 | GPL-3.0-or-later с GCC Runtime Library Exception 3.1 для библиотеки | `/usr/share/doc/libgcc-s1/copyright` |
| `libgcrypt20:amd64` | 1.10.3-2ubuntu0.2 | текст уведомления | `/usr/share/doc/libgcrypt20/copyright` |
| `libgdbm-compat4t64:amd64` | 1.23-5.1build1 | GFDL-NIV-1.3+, GPL-2+, GPL-3+ | `/usr/share/doc/libgdbm-compat4t64/copyright` |
| `libgdbm6t64:amd64` | 1.23-5.1build1 | GFDL-NIV-1.3+, GPL-2+, GPL-3+ | `/usr/share/doc/libgdbm6t64/copyright` |
| `libgdk-pixbuf-2.0-0:amd64` | 2.42.10+dfsg-3ubuntu3.3 | CC0-1.0, GPL-2+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and CC0-1.0, LGPL-2.1+ | `/usr/share/doc/libgdk-pixbuf-2.0-0/copyright` |
| `libgdk-pixbuf2.0-common` | 2.42.10+dfsg-3ubuntu3.3 | CC0-1.0, GPL-2+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and CC0-1.0, LGPL-2.1+ | `/usr/share/doc/libgdk-pixbuf2.0-common/copyright` |
| `libgfortran5:amd64` | 14.2.0-4ubuntu2~24.04.1 | текст уведомления | `/usr/share/doc/libgfortran5/copyright` |
| `libgl1:amd64` | 1.7.0-1build1 | Apache-2.0, BSD-1-clause, GPL, GPL-3+, MIT, public-domain | `/usr/share/doc/libgl1/copyright` |
| `libgl1-mesa-dri:amd64` | 25.2.8-0ubuntu0.24.04.4 | (MIT OR Apache-2.0) AND Unicode-DFS-2016, Apache-2.0, Apache-2.0 OR MIT, BSD-2-clause, BSD-3-google, BSL, GPL, GPL-1+, GPL-2, GPL-2 or MIT, Khronos, MIT, MIT OR Apache-2.0, MLAA, SGI, Unicode-DFS-2016 | `/usr/share/doc/libgl1-mesa-dri/copyright` |
| `libgles2:amd64` | 1.7.0-1build1 | Apache-2.0, BSD-1-clause, GPL, GPL-3+, MIT, public-domain | `/usr/share/doc/libgles2/copyright` |
| `libglib2.0-0t64:amd64` | 2.80.0-6ubuntu3.10 | AFL-2.0, AFL-2.0 or LGPL-2.1+, Apache-2.0 with LLVM exception, CC-BY-SA-3.0, CC0-1.0, CC0-1.0 or Mingw-PD, Expat, FSFULLR, GPL-2+, Iconv-PD, Janik-permissive, Janik-permissive and old-glib-tests, Kuchling-PD, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and Kuchling-PD and Plumb-PD, LGPL-3+, Mingw-PD, Plumb-PD, Unicode-DFS-2016, bzip2-1.0.6, cmph, old-glib-tests | `/usr/share/doc/libglib2.0-0t64/copyright` |
| `libglvnd0:amd64` | 1.7.0-1build1 | Apache-2.0, BSD-1-clause, GPL, GPL-3+, MIT, public-domain | `/usr/share/doc/libglvnd0/copyright` |
| `libglx-mesa0:amd64` | 25.2.8-0ubuntu0.24.04.4 | (MIT OR Apache-2.0) AND Unicode-DFS-2016, Apache-2.0, Apache-2.0 OR MIT, BSD-2-clause, BSD-3-google, BSL, GPL, GPL-1+, GPL-2, GPL-2 or MIT, Khronos, MIT, MIT OR Apache-2.0, MLAA, SGI, Unicode-DFS-2016 | `/usr/share/doc/libglx-mesa0/copyright` |
| `libglx0:amd64` | 1.7.0-1build1 | Apache-2.0, BSD-1-clause, GPL, GPL-3+, MIT, public-domain | `/usr/share/doc/libglx0/copyright` |
| `libgme0:amd64` | 0.6.3-7build1 | LGPL-2.1+, MIT | `/usr/share/doc/libgme0/copyright` |
| `libgmp10:amd64` | 2:6.3.0+dfsg-2ubuntu6.1 | GPL-2+, GPL-2+ or LGPL-3+, GPL-3+, GPL-3+ with Bison exception, LGPL-3+ | `/usr/share/doc/libgmp10/copyright` |
| `libgnutls30t64:amd64` | 3.8.3-1.1ubuntu3.6 | Apache-2.0, BSD-3-Clause, CC0 license, Expat, GPLv3+, LGPLv2.1+, LGPLv3+_or_GPLv2+, The main library is licensed under GNU Lesser | `/usr/share/doc/libgnutls30t64/copyright` |
| `libgomp1:amd64` | 14.2.0-4ubuntu2~24.04.1 | текст уведомления | `/usr/share/doc/libgomp1/copyright` |
| `libgpg-error0:amd64` | 1.47-3build2.1 | BSD-3-clause, GPL-3+, LGPL-2.1+, LGPL-2.1+ or BSD-3-clause, g10-permissive | `/usr/share/doc/libgpg-error0/copyright` |
| `libgpm2:amd64` | 1.20.7-11 | GPL-2.0+, GPL-3.0+ | `/usr/share/doc/libgpm2/copyright` |
| `libgraphene-1.0-0:amd64` | 1.10.8-3build2 | Expat | `/usr/share/doc/libgraphene-1.0-0/copyright` |
| `libgraphite2-3:amd64` | 1.3.14-2ubuntu0.24.04.1 | Artistic, Artistic or GPL-1+, GPL-1+, GPL-2+, LGPL-2.1+, LGPL-2.1+ or GPL-2+ or MPL-1.1, LGPL-2.1+ or MPL-1.1 or GPL-2+, MPL-1.1, custom-sil-open-font-license, public-domain | `/usr/share/doc/libgraphite2-3/copyright` |
| `libgsm1:amd64` | 1.0.22-1build1 | TU-Berlin-2.0 | `/usr/share/doc/libgsm1/copyright` |
| `libgssapi-krb5-2:amd64` | 1.20.1-6ubuntu2.10 | текст уведомления | `/usr/share/doc/libgssapi-krb5-2/copyright` |
| `libgssdp-1.6-0:amd64` | 1.6.3-1build3 | LGPL-2.1+ | `/usr/share/doc/libgssdp-1.6-0/copyright` |
| `libgstreamer-gl1.0-0:amd64` | 1.24.2-1ubuntu0.5 | BSD (2 clause), BSD (3 clause), GPL-2+, LGPL-2+, MIT/X11 (BSD like) LGPL-2+ | `/usr/share/doc/libgstreamer-gl1.0-0/copyright` |
| `libgstreamer-plugins-bad1.0-0:amd64` | 1.24.2-1ubuntu4 | BSD (2 clause), BSD (3 clause), GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-2.1,, MIT/X11 (BSD like), MIT/X11 (BSD like) LGPL-2+, MPL-1.1, MPL-1.1 GPL, MPL-1.1 GPL GPL-2+ LGPL (v2 or later) (with incorrect FSF address), MPL-1.1 LGPL-2+, UNKNOWN | `/usr/share/doc/libgstreamer-plugins-bad1.0-0/copyright` |
| `libgstreamer-plugins-base1.0-0:amd64` | 1.24.2-1ubuntu0.5 | BSD (2 clause), BSD (3 clause), GPL-2+, LGPL-2+, MIT/X11 (BSD like) LGPL-2+ | `/usr/share/doc/libgstreamer-plugins-base1.0-0/copyright` |
| `libgstreamer-plugins-good1.0-0:amd64` | 1.24.2-1ubuntu1.8 | BSD, BSD (3 clause), GPL-2+, LGPL, LGPL-2, LGPL-2+, LGPL-2.1+, MIT/X11 (BSD like) LGPL-2+ | `/usr/share/doc/libgstreamer-plugins-good1.0-0/copyright` |
| `libgstreamer1.0-0:amd64` | 1.24.2-1ubuntu0.1 | GPL-2+, GPL-3+, LGPL-2+, LGPL-2.1+ | `/usr/share/doc/libgstreamer1.0-0/copyright` |
| `libgtk-3-0t64:amd64` | 3.24.41-4ubuntu1.3 | Apache-2.0, CC-BY-SA-4.0, Expat, GPL-3+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and Expat, LGPL-2+ and ZPL-2.1, LGPL-2+ or SWL, LGPL-2.1+, SWL, X11R5-permissive, ZPL-2.1, check-gdk-cairo-permissive, other, unencumbered | `/usr/share/doc/libgtk-3-0t64/copyright` |
| `libgtk-3-common` | 3.24.41-4ubuntu1.3 | Apache-2.0, CC-BY-SA-4.0, Expat, GPL-3+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and Expat, LGPL-2+ and ZPL-2.1, LGPL-2+ or SWL, LGPL-2.1+, SWL, X11R5-permissive, ZPL-2.1, check-gdk-cairo-permissive, other, unencumbered | `/usr/share/doc/libgtk-3-common/copyright` |
| `libgtk-4-1:amd64` | 4.14.5+ds-0ubuntu0.10 | Apache-2.0, Apache-2.0 with LLVM exception, BSD-3-clause-Google, CC0-1.0, Expat, Expat or unlicense, GPL-3+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and sun-permissive and lcs-telegraphics-permissive and X11R5-permissive and Expat and BSD-3-clause-Google and Apache-2.0 and CC0-1.0 and ZPL-2.1, LGPL-2.1+, Unicode-DFS-2016, X11R5-permissive, ZPL-2.1, lcs-telegraphics-permissive, sun-permissive, unlicense | `/usr/share/doc/libgtk-4-1/copyright` |
| `libgtk-4-common` | 4.14.5+ds-0ubuntu0.10 | Apache-2.0, Apache-2.0 with LLVM exception, BSD-3-clause-Google, CC0-1.0, Expat, Expat or unlicense, GPL-3+, LGPL-2+, LGPL-2+ and LGPL-2.1+ and sun-permissive and lcs-telegraphics-permissive and X11R5-permissive and Expat and BSD-3-clause-Google and Apache-2.0 and CC0-1.0 and ZPL-2.1, LGPL-2.1+, Unicode-DFS-2016, X11R5-permissive, ZPL-2.1, lcs-telegraphics-permissive, sun-permissive, unlicense | `/usr/share/doc/libgtk-4-common/copyright` |
| `libgudev-1.0-0:amd64` | 1:238-5ubuntu1 | LGPL-2+ | `/usr/share/doc/libgudev-1.0-0/copyright` |
| `libgupnp-1.6-0:amd64` | 1.6.6-1build3 | LGPL-2+ | `/usr/share/doc/libgupnp-1.6-0/copyright` |
| `libgupnp-igd-1.6-0:amd64` | 1.6.0-3build3 | BSD-2-clause, GPL-3, LGPL-2.1+ | `/usr/share/doc/libgupnp-igd-1.6-0/copyright` |
| `libharfbuzz-icu0:amd64` | 8.3.0-2build2 | Apache-2.0, CC0-1.0, Expat, FSFAP, FSFUL, FSFULLR, GPL-2+ with AutoConf exception, GPL-2+ with Font exception, GPL-2+ with LibTool exception, GPL-3+, GPL-3+ with AutoConf exception, ISC, LGPL-2.1+, MIT, Monotype, OFL-1.1, UFL-1.0, Unicode | `/usr/share/doc/libharfbuzz-icu0/copyright` |
| `libharfbuzz0b:amd64` | 8.3.0-2build2 | Apache-2.0, CC0-1.0, Expat, FSFAP, FSFUL, FSFULLR, GPL-2+ with AutoConf exception, GPL-2+ with Font exception, GPL-2+ with LibTool exception, GPL-3+, GPL-3+ with AutoConf exception, ISC, LGPL-2.1+, MIT, Monotype, OFL-1.1, UFL-1.0, Unicode | `/usr/share/doc/libharfbuzz0b/copyright` |
| `libhogweed6t64:amd64` | 3.9.1-2.2build1.1 | Expat, GAP, GPL-2, GPL-2+, GPL-3+ with Autoconf exception, LGPL-2+, LGPL-3+, LGPL-3+ or GPL-2+, public-domain | `/usr/share/doc/libhogweed6t64/copyright` |
| `libhunspell-1.7-0:amd64` | 1.7.2+really1.7.2-10build3 | текст уведомления | `/usr/share/doc/libhunspell-1.7-0/copyright` |
| `libhwy1t64:amd64` | 1.0.7-8.1build1 | Apache-2.0 | `/usr/share/doc/libhwy1t64/copyright` |
| `libhyphen0:amd64` | 2.8.8-7build3 | GPL-2+, GPL-2+ or LGPL-2.1+ or MPL-1.1+, LGPL-2.1+, MPL-1.1+ | `/usr/share/doc/libhyphen0/copyright` |
| `libice6:amd64` | 2:1.0.10-1build3 | текст уведомления | `/usr/share/doc/libice6/copyright` |
| `libicu74:amd64` | 74.2-1ubuntu3.1 | GPL-3, MIT | `/usr/share/doc/libicu74/copyright` |
| `libidn2-0:amd64` | 2.3.7-2build1.1 | GPL-2+, GPL-3+, LGPL-3+, LGPL-3+ or GPL-2+, Unicode | `/usr/share/doc/libidn2-0/copyright` |
| `libiec61883-0:amd64` | 1.2.0-6build1 | текст уведомления | `/usr/share/doc/libiec61883-0/copyright` |
| `libimath-3-1-29t64:amd64` | 3.1.9-3.1ubuntu2 | imath | `/usr/share/doc/libimath-3-1-29t64/copyright` |
| `libinstpatch-1.0-2:amd64` | 1.1.6-1build2 | LGPL-2.1, Public_Domain_1, Public_Domain_2 | `/usr/share/doc/libinstpatch-1.0-2/copyright` |
| `libjack-jackd2-0:amd64` | 1.9.21~dfsg-3ubuntu3 | BSD-2-clause, BSD-3-clause, Expat, GPL-2, GPL-2+, GPL-2~either, GPL-2~or, GPL-3+, LGPL-2+, LGPL-2.1+, public-domain~Kroon | `/usr/share/doc/libjack-jackd2-0/copyright` |
| `libjbig0:amd64` | 2.1-6.1ubuntu2 | GPL-2+ | `/usr/share/doc/libjbig0/copyright` |
| `libjpeg-turbo8:amd64` | 2.1.5-2ubuntu2 | BSD-3-clause, BSD-BY-LC-NE, Expat, NTP, Zlib | `/usr/share/doc/libjpeg-turbo8/copyright` |
| `libjpeg8:amd64` | 8c-2ubuntu11 | LGPL-2.1 | `/usr/share/doc/libjpeg8/copyright` |
| `libjson-c5:amd64` | 0.17-1build1 | Expat | `/usr/share/doc/libjson-c5/copyright` |
| `libjson-glib-1.0-0:amd64` | 1.8.0-2build2 | LGPL-2.1+ | `/usr/share/doc/libjson-glib-1.0-0/copyright` |
| `libjson-glib-1.0-common` | 1.8.0-2build2 | LGPL-2.1+ | `/usr/share/doc/libjson-glib-1.0-common/copyright` |
| `libjxl0.7:amd64` | 0.7.0-10.2ubuntu6.1 | BSD-3-clause-Google, ISC-License | `/usr/share/doc/libjxl0.7/copyright` |
| `libk5crypto3:amd64` | 1.20.1-6ubuntu2.10 | текст уведомления | `/usr/share/doc/libk5crypto3/copyright` |
| `libkeyutils1:amd64` | 1.6.3-3build1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libkeyutils1/copyright` |
| `libkmod2:amd64` | 31+20240202-2ubuntu7.2 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libkmod2/copyright` |
| `libkrb5-3:amd64` | 1.20.1-6ubuntu2.10 | текст уведомления | `/usr/share/doc/libkrb5-3/copyright` |
| `libkrb5support0:amd64` | 1.20.1-6ubuntu2.10 | текст уведомления | `/usr/share/doc/libkrb5support0/copyright` |
| `libksba8:amd64` | 1.6.6-1build1 | FSFUL, LGPL-2.1-or-later | `/usr/share/doc/libksba8/copyright` |
| `liblapack3:amd64` | 3.12.0-3build1.1 | BSD-3-clause, BSD-3-clause-intel | `/usr/share/doc/liblapack3/copyright` |
| `liblc3-1:amd64` | 1.0.4-3build1 | Apache-2.0 | `/usr/share/doc/liblc3-1/copyright` |
| `liblcms2-2:amd64` | 2.14-2ubuntu0.1 | GPL-2+, GPL-3, IJG, MIT | `/usr/share/doc/liblcms2-2/copyright` |
| `libldacbt-enc2:amd64` | 2.0.2.3+git20200429+ed310a0-4ubuntu2 | Apache-2 | `/usr/share/doc/libldacbt-enc2/copyright` |
| `libldap-common` | 2.6.10+dfsg-0ubuntu0.24.04.1 | BSD-3-clause, BSD-3-clause-California, BSD-3-clause-variant, BSD-4-clause-California, Beerware, Expat, Expat-ISC, Expat-UNM, F5, FSF-unlimited, FSF-unlimited and GPL-2+ with Autoconf exception, FSF-unlimited and GPL-2+ with Libtool exception, FSF-unlimited and OpenLDAP-2.8, GPL-2+, GPL-2+ with Autoconf exception, GPL-2+ with Libtool exception, GPL-2+ with Libtool exception and GPL-3+ with Libtool exception and GPL-3+, GPL-3+, GPL-3+ with Autoconf exception, GPL-3+ with Libtool exception, JCG, MIT-XC, NeoSoft-permissive, OpenLDAP-2.8, OpenLDAP-2.8 and BSD-3-clause, OpenLDAP-2.8 and BSD-3-clause-variant, OpenLDAP-2.8 and BSD-4-clause-California, OpenLDAP-2.8 and Beerware, OpenLDAP-2.8 and Expat, OpenLDAP-2.8 and Expat-ISC, OpenLDAP-2.8 and Expat-UNM, OpenLDAP-2.8 and FSF-unlimited and GPL-2+ with Libtool exception, OpenLDAP-2.8 and JCG and UMich, OpenLDAP-2.8 and UMich, OpenLDAP-2.8 and UMich and F5, UMich, public-domain | `/usr/share/doc/libldap-common/copyright` |
| `libldap2:amd64` | 2.6.10+dfsg-0ubuntu0.24.04.1 | BSD-3-clause, BSD-3-clause-California, BSD-3-clause-variant, BSD-4-clause-California, Beerware, Expat, Expat-ISC, Expat-UNM, F5, FSF-unlimited, FSF-unlimited and GPL-2+ with Autoconf exception, FSF-unlimited and GPL-2+ with Libtool exception, FSF-unlimited and OpenLDAP-2.8, GPL-2+, GPL-2+ with Autoconf exception, GPL-2+ with Libtool exception, GPL-2+ with Libtool exception and GPL-3+ with Libtool exception and GPL-3+, GPL-3+, GPL-3+ with Autoconf exception, GPL-3+ with Libtool exception, JCG, MIT-XC, NeoSoft-permissive, OpenLDAP-2.8, OpenLDAP-2.8 and BSD-3-clause, OpenLDAP-2.8 and BSD-3-clause-variant, OpenLDAP-2.8 and BSD-4-clause-California, OpenLDAP-2.8 and Beerware, OpenLDAP-2.8 and Expat, OpenLDAP-2.8 and Expat-ISC, OpenLDAP-2.8 and Expat-UNM, OpenLDAP-2.8 and FSF-unlimited and GPL-2+ with Libtool exception, OpenLDAP-2.8 and JCG and UMich, OpenLDAP-2.8 and UMich, OpenLDAP-2.8 and UMich and F5, UMich, public-domain | `/usr/share/doc/libldap2/copyright` |
| `liblerc4:amd64` | 4.0.0+ds-4ubuntu2 | Apache-2.0 | `/usr/share/doc/liblerc4/copyright` |
| `liblilv-0-0:amd64` | 0.24.22-1build1 | 0BSD, 0BSD or ISC, ISC | `/usr/share/doc/liblilv-0-0/copyright` |
| `libllvm20:amd64` | 1:20.1.2-0ubuntu1~24.04.3 | APACHE-2-LLVM-EXCEPTIONS, BSD-3-Clause, BSD-3-clause, MIT, Python, solar-public-domain | `/usr/share/doc/libllvm20/copyright` |
| `liblrdf0:amd64` | 0.6.1-4build1 | FSFUL~documentation, GPL-2, GPL-2+, LGPL-2.1+, X11, public-domain | `/usr/share/doc/liblrdf0/copyright` |
| `libltc11:amd64` | 1.3.2-1build1 | LGPL-3+ | `/usr/share/doc/libltc11/copyright` |
| `liblz4-1:amd64` | 1.9.4-1build1.1 | BSD-2-clause, GPL-2+, GPL-2+ or BSD-2-clause | `/usr/share/doc/liblz4-1/copyright` |
| `liblzma5:amd64` | 5.6.1+really5.4.5-1ubuntu0.4 | Autoconf, GPL-2, GPL-2+, LGPL-2.1+, PD, PD-debian, config-h, noderivs, none, permissive-fsf, permissive-nowarranty, probably-PD | `/usr/share/doc/liblzma5/copyright` |
| `liblzo2-2:amd64` | 2.10-2build4 | GPL-2+ | `/usr/share/doc/liblzo2-2/copyright` |
| `libmanette-0.2-0:amd64` | 0.2.7-1build2 | LGPL-2.1+ | `/usr/share/doc/libmanette-0.2-0/copyright` |
| `libmbedcrypto7t64:amd64` | 2.28.8-1 | Apache-2.0, Apache-2.0 or GPL-2+, GPL-2+ | `/usr/share/doc/libmbedcrypto7t64/copyright` |
| `libmd0:amd64` | 1.1.0-2build1.1 | BSD-2-clause, BSD-2-clause-NetBSD, BSD-3-clause, BSD-3-clause-Aaron-D-Gifford, Beerware, ISC, public-domain-md4, public-domain-md5, public-domain-sha1 | `/usr/share/doc/libmd0/copyright` |
| `libmfx1:amd64` | 22.5.4-1 | Apache-2.0, BSD-3-clause, MIT, NTP | `/usr/share/doc/libmfx1/copyright` |
| `libmjpegutils-2.1-0t64:amd64` | 1:2.1.0+debian-8.1build1 | текст уведомления | `/usr/share/doc/libmjpegutils-2.1-0t64/copyright` |
| `libmodplug1:amd64` | 1:0.8.9.0-3build1 | Public Domain | `/usr/share/doc/libmodplug1/copyright` |
| `libmount1:amd64` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/libmount1/copyright` |
| `libmp3lame0:amd64` | 3.100-6build1 | BSD-3-clause, GPL-1+, LGPL-2+, LGPL-2.1+, zlib/libpng | `/usr/share/doc/libmp3lame0/copyright` |
| `libmpcdec6:amd64` | 2:0.1~r495-2build1 | текст уведомления | `/usr/share/doc/libmpcdec6/copyright` |
| `libmpeg2encpp-2.1-0t64:amd64` | 1:2.1.0+debian-8.1build1 | текст уведомления | `/usr/share/doc/libmpeg2encpp-2.1-0t64/copyright` |
| `libmpg123-0t64:amd64` | 1.32.5-1ubuntu1.1 | LGPL-2.1 | `/usr/share/doc/libmpg123-0t64/copyright` |
| `libmplex2-2.1-0t64:amd64` | 1:2.1.0+debian-8.1build1 | текст уведомления | `/usr/share/doc/libmplex2-2.1-0t64/copyright` |
| `libmysofa1:amd64` | 1.3.2+dfsg-2ubuntu2 | BSD-3-clause, CC-BY-4.0, CC-BY-SA-3.0, cipic, listen-ircam, mit-kemar, public-domain | `/usr/share/doc/libmysofa1/copyright` |
| `libncurses6:amd64` | 6.4+20240113-1ubuntu2.2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/libncurses6/copyright` |
| `libncursesw6:amd64` | 6.4+20240113-1ubuntu2.2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/libncursesw6/copyright` |
| `libneon27t64:amd64` | 0.33.0-1.1build3 | GPL-2+ | `/usr/share/doc/libneon27t64/copyright` |
| `libnettle8t64:amd64` | 3.9.1-2.2build1.1 | Expat, GAP, GPL-2, GPL-2+, GPL-3+ with Autoconf exception, LGPL-2+, LGPL-3+, LGPL-3+ or GPL-2+, public-domain | `/usr/share/doc/libnettle8t64/copyright` |
| `libnghttp2-14:amd64` | 1.59.0-1ubuntu0.4 | BSD-2-clause, Expat, GPL-3+ with autoconf exception, MIT, all-permissive | `/usr/share/doc/libnghttp2-14/copyright` |
| `libnice10:amd64` | 0.1.21-2build3 | текст уведомления | `/usr/share/doc/libnice10/copyright` |
| `libnorm1t64:amd64` | 1.5.9+dfsg-3.1build1 | BSD-2-clause, BSD-3-clause, BSD-4-clause-UC, NRL-2-clause, NRL-3-clause | `/usr/share/doc/libnorm1t64/copyright` |
| `libnpth0t64:amd64` | 1.6-3.1build1 | LGPL-2.1+ | `/usr/share/doc/libnpth0t64/copyright` |
| `libnspr4:amd64` | 2:4.35-1.1build1 | MPL-2.0 | `/usr/share/doc/libnspr4/copyright` |
| `libnss3:amd64` | 2:3.98-1ubuntu0.3 | BSD-3, MPL-2.0, Zlib, public-domain | `/usr/share/doc/libnss3/copyright` |
| `libnuma1:amd64` | 2.0.18-1ubuntu0.24.04.1 | текст уведомления | `/usr/share/doc/libnuma1/copyright` |
| `libogg0:amd64` | 1.3.5-3build1 | BSD-3-clause, rfc3533-license, rfc5334-license | `/usr/share/doc/libogg0/copyright` |
| `libopenal-data` | 1:1.23.1-4build1 | Apache-2.0, BSD-3-clause, Expat, GPL-2+, GPL-3+, LGPL-2+ | `/usr/share/doc/libopenal-data/copyright` |
| `libopenal1:amd64` | 1:1.23.1-4build1 | Apache-2.0, BSD-3-clause, Expat, GPL-2+, GPL-3+, LGPL-2+ | `/usr/share/doc/libopenal1/copyright` |
| `libopenexr-3-1-30:amd64` | 3.1.5-5.1build3 | BSD-3-clause, openexr | `/usr/share/doc/libopenexr-3-1-30/copyright` |
| `libopenh264-7:amd64` | 2.4.1+dfsg-1 | Apache-2.0, BSD-2-clause, Expat, MPL-2.0 | `/usr/share/doc/libopenh264-7/copyright` |
| `libopenjp2-7:amd64` | 2.5.0-2ubuntu0.5 | BSD-2, BSD-3, LIBPNG, LIBTIFF, LIBTIFF-GLARSON, LIBTIFF-PIXAR, MIT, ZLIB, public-domain | `/usr/share/doc/libopenjp2-7/copyright` |
| `libopenmpt0t64:amd64` | 0.7.3-1.1build3 | BSD-3-clause, BSD-3-clause or BSL-1.0, BSL-1.0, GNU-All-Permissive-License, GNU-All-Permissive-License-FSF, GPL-2+ with Autoconf exception, GPL-2+ with LibTool exception, GPL-3+ with AutoConf exception, GPL-3+ with Autoconf Macros exception, X11 | `/usr/share/doc/libopenmpt0t64/copyright` |
| `libopenni2-0:amd64` | 2.2.0.33+dfsg-18 | APACHE-2.0, BSD-3-clause-NVIDIA-LICENSE, GPL-3+, Google, LGPL-2.1, LibJPEG | `/usr/share/doc/libopenni2-0/copyright` |
| `libopus0:amd64` | 1.4-1build1 | BSD-2-clause, BSD-3-clause | `/usr/share/doc/libopus0/copyright` |
| `liborc-0.4-0t64:amd64` | 1:0.4.38-1ubuntu0.1 | текст уведомления | `/usr/share/doc/liborc-0.4-0t64/copyright` |
| `libp11-kit0:amd64` | 0.25.3-4ubuntu2.2 | Apache-2.0, BSD-3-clause, FSFAP, FSFULLR, GPL-2+ with Autoconf-data exception, GPL-3+ with Autoconf-data exception, ISC, LGPL-2.1+, X11, customFSFUL, customFSFULLRWD | `/usr/share/doc/libp11-kit0/copyright` |
| `libpam-modules:amd64` | 1.5.3-5ubuntu5.7 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam-modules/copyright` |
| `libpam-modules-bin` | 1.5.3-5ubuntu5.7 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam-modules-bin/copyright` |
| `libpam-runtime` | 1.5.3-5ubuntu5.7 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam-runtime/copyright` |
| `libpam-systemd:amd64` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libpam-systemd/copyright` |
| `libpam0g:amd64` | 1.5.3-5ubuntu5.7 | BSD-3-clause or GPL, BSD-tcp_wrappers, Beerware, GPL-2, GPL-2+, GPL-3, GPL-3+ with Bison exception, LGPL-2+, public-domain | `/usr/share/doc/libpam0g/copyright` |
| `libpango-1.0-0:amd64` | 1.52.1+ds-1build1 | Apache-2, Apache-2 and Bitstream-Vera and OFL-1.1, Bitstream-Vera, Chromium-BSD-style, Example, ICU, LGPL-2+, LGPL-2+ and ICU, LGPL-2+ and LGPL-2.1+, LGPL-2+ and TCL, LGPL-2.1+, OFL-1.1, TCL, Unicode | `/usr/share/doc/libpango-1.0-0/copyright` |
| `libpangocairo-1.0-0:amd64` | 1.52.1+ds-1build1 | Apache-2, Apache-2 and Bitstream-Vera and OFL-1.1, Bitstream-Vera, Chromium-BSD-style, Example, ICU, LGPL-2+, LGPL-2+ and ICU, LGPL-2+ and LGPL-2.1+, LGPL-2+ and TCL, LGPL-2.1+, OFL-1.1, TCL, Unicode | `/usr/share/doc/libpangocairo-1.0-0/copyright` |
| `libpangoft2-1.0-0:amd64` | 1.52.1+ds-1build1 | Apache-2, Apache-2 and Bitstream-Vera and OFL-1.1, Bitstream-Vera, Chromium-BSD-style, Example, ICU, LGPL-2+, LGPL-2+ and ICU, LGPL-2+ and LGPL-2.1+, LGPL-2+ and TCL, LGPL-2.1+, OFL-1.1, TCL, Unicode | `/usr/share/doc/libpangoft2-1.0-0/copyright` |
| `libpciaccess0:amd64` | 0.17-3ubuntu0.24.04.3 | текст уведомления | `/usr/share/doc/libpciaccess0/copyright` |
| `libpcre2-8-0:amd64` | 10.42-4ubuntu2.1 | BSD-2-clause, BSD-3-clause, BSD-3-clause-Cambridge with BINARY LIBRARY-LIKE PACKAGES exception, X11, public-domain | `/usr/share/doc/libpcre2-8-0/copyright` |
| `libperl5.38t64:amd64` | 5.38.2-3.2ubuntu0.6 | Artistic, Artistic or GPL-1+ or Artistic-dist, Artistic-2, Artistic-dist, BSD-3-clause, BSD-3-clause-GENERIC, BSD-3-clause-with-weird-numbering, BSD-4-clause-POWERDOG, BZIP, CC0-1.0, DONT-CHANGE-THE-GPL, Expat, Expat or GPL-1+ or Artistic, FSFAP, GPL-1+, GPL-1+ or Artistic, GPL-1+ or Artistic or Artistic-dist, GPL-1+ or Artistic, and BSD-3-clause-GENERIC, GPL-1+ or Artistic, and BSD-4-clause-POWERDOG, GPL-1+ or Artistic, and Expat, GPL-1+ or Artistic, and Unicode, GPL-2+, GPL-2+ or Artistic, GPL-3+-WITH-BISON-EXCEPTION, LGPL-2.1, REGCOMP, REGCOMP, and GPL-1+ or Artistic, SDBM-PUBLIC-DOMAIN, TEXT-TABS, Unicode, ZLIB | `/usr/share/doc/libperl5.38t64/copyright` |
| `libpgm-5.3-0t64:amd64` | 5.3.128~dfsg-2.1build1 | BSD-3-clause, BSD-3-clause and ISC, ISC, LGPL-2+, LGPL-2.1 | `/usr/share/doc/libpgm-5.3-0t64/copyright` |
| `libpipewire-0.3-0t64:amd64` | 1.0.5-1ubuntu3.3 | BZIP2, Expat, Expat and LGPL-2.1+, FFTPACK, GPL-2, LGPL-2+, LGPL-2+ and LGPL-2.1+ and Expat, LGPL-2.1+ | `/usr/share/doc/libpipewire-0.3-0t64/copyright` |
| `libpixman-1-0:amd64` | 0.42.2-1build1 | текст уведомления | `/usr/share/doc/libpixman-1-0/copyright` |
| `libplacebo338:amd64` | 6.338.2-2build1 | CC0, Expat, LGPL-2.1+, LGPL-2.1+ and CC0, LGPL-2.1+ and Zlib, LGPL-2.1+ or Expat, Zlib | `/usr/share/doc/libplacebo338/copyright` |
| `libpng16-16t64:amd64` | 1.6.43-5ubuntu0.7 | Apache-2.0, BSD-3-clause, BSD-like-with-advertising-clause, GPL-2+, GPL-2+ or BSD-like-with-advertising-clause, expat, libpng, libpng OR Apache-2.0 OR BSD-3-clause | `/usr/share/doc/libpng16-16t64/copyright` |
| `libpocketsphinx3:amd64` | 0.8.0+real5prealpha+1-15ubuntu5 | BSD-2, BSD-3-clause, GPL-2+ | `/usr/share/doc/libpocketsphinx3/copyright` |
| `libpostproc57:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libpostproc57/copyright` |
| `libproc2-0:amd64` | 2:4.0.4-4ubuntu3.3 | GPL-2.0+, LGPL-2.0+, LGPL-2.1+ | `/usr/share/doc/libproc2-0/copyright` |
| `libproxy1v5:amd64` | 0.5.4-4build1 | GPL-2+, GPL-3+, LGPL-2.1+, LGPL-2.1+ or GPL-2+ or NPL-1.1, MPL-1.1, NPL-1.1 | `/usr/share/doc/libproxy1v5/copyright` |
| `libpsl5t64:amd64` | 0.21.2-1.1build1 | Chromium, MIT, gnulib | `/usr/share/doc/libpsl5t64/copyright` |
| `libpulse0:amd64` | 1:16.1+dfsg1-2ubuntu10.1 | GPL-2+, LGPL-2+, LGPL-2.1+, other | `/usr/share/doc/libpulse0/copyright` |
| `libpython3-stdlib:amd64` | 3.12.3-0ubuntu2.1 | текст уведомления | `/usr/share/doc/libpython3-stdlib/copyright` |
| `libpython3.12-minimal:amd64` | 3.12.3-1ubuntu0.17 | * Permission to use this software in any way is granted without, By obtaining, using, and/or copying this software and/or its, Permission  is  hereby granted,  free  of charge,  to  any person, Permission is hereby granted, free of charge, to any person obtaining, Permission to use, copy, modify, and distribute this software and, Permission to use, copy, modify, and distribute this software and its, Permission to use, copy, modify, and distribute this software for any, Redistribution and use in source and binary forms, with or without, This software is provided 'as-is', without any express or implied, This software is provided as-is, without express or implied | `/usr/share/doc/libpython3.12-minimal/copyright` |
| `libpython3.12-stdlib:amd64` | 3.12.3-1ubuntu0.17 | * Permission to use this software in any way is granted without, By obtaining, using, and/or copying this software and/or its, Permission  is  hereby granted,  free  of charge,  to  any person, Permission is hereby granted, free of charge, to any person obtaining, Permission to use, copy, modify, and distribute this software and, Permission to use, copy, modify, and distribute this software and its, Permission to use, copy, modify, and distribute this software for any, Redistribution and use in source and binary forms, with or without, This software is provided 'as-is', without any express or implied, This software is provided as-is, without express or implied | `/usr/share/doc/libpython3.12-stdlib/copyright` |
| `libqrencode4:amd64` | 4.1.1-1build2 | LGPL-2.1+, public-domain | `/usr/share/doc/libqrencode4/copyright` |
| `librabbitmq4:amd64` | 0.11.0-1ubuntu0.2 | BSD-Author, Expat | `/usr/share/doc/librabbitmq4/copyright` |
| `libraptor2-0:amd64` | 2.0.16-3ubuntu0.1 | Apache-2.0, GPL-2+, GPL-3+, LGPL-2.1+, LGPL-2.1+ or GPL-2+ or Apache-2.0, public-domain | `/usr/share/doc/libraptor2-0/copyright` |
| `librav1e0:amd64` | 0.7.1-2 | BSD-2-Clause, BSD-2-clause, ISC | `/usr/share/doc/librav1e0/copyright` |
| `libraw1394-11:amd64` | 2.1.2-2build3 | текст уведомления | `/usr/share/doc/libraw1394-11/copyright` |
| `libreadline8t64:amd64` | 8.2-4build1 | GFDL-NIV-1.3+, GPL-2+, GPL-3, GPL-3+, ISC-no-attribution | `/usr/share/doc/libreadline8t64/copyright` |
| `librist4:amd64` | 0.2.10+dfsg-2 | BSD-1-clause, BSD-2-clause, ISC, public-domain | `/usr/share/doc/librist4/copyright` |
| `librsvg2-2:amd64` | 2.58.0+dfsg-1ubuntu0.1 | 0BSD, Apache-2.0, Apache-2.0, and BSD-2-clause, and BSD-3-clause, and Expat, and Apache-2.0 or Expat or 0BSD, and Apache-2.0 or Boost-1.0, and Apache-2.0 or Expat, and Expat or Unlicense, and MPL-2.0, and Sun-permissive, and zlib, BSD-2-clause, BSD-3-clause, Boost-1.0, CC-zero-waive-1.0-us, Expat, FSFAP, LGPL-2+, MPL-2.0, OFL-1.1, Sun-permissive, Unlicense, zlib | `/usr/share/doc/librsvg2-2/copyright` |
| `librtmp1:amd64` | 2.4+20151223.gitfa8646d.1-2build7 | текст уведомления | `/usr/share/doc/librtmp1/copyright` |
| `librubberband2:amd64` | 3.3.0+dfsg-2build1 | BSD-3-clause, Expat, GPL-2+, Zlib, other-1 | `/usr/share/doc/librubberband2/copyright` |
| `libsamplerate0:amd64` | 0.2.2-4build1 | BSD-2-clause, FSFAP, GPL-2+, GPL-3+ | `/usr/share/doc/libsamplerate0/copyright` |
| `libsasl2-2:amd64` | 2.1.28+dfsg1-5ubuntu3.1 | BSD-2-clause, BSD-2-clause and MIT-CMU, BSD-2.2-clause, BSD-3-Clause-Attribution, BSD-3-Clause-Attribution and IBM-as-is, BSD-3-Clause-Attribution and MIT-Export, BSD-3-clause, BSD-3-clause-JANET, BSD-3-clause-JANET and BSD-3-Clause-Attribution, BSD-3-clause-PADL, BSD-3-clause-PADL and MIT-OpenVision, BSD-4-clause-UC, FSFULLR, FSFULLR and MIT-CMU, GPL-3, GPL-3+, IBM-as-is, MIT-CMU, MIT-Export, MIT-OpenVision, OpenLDAP, RSA-MD | `/usr/share/doc/libsasl2-2/copyright` |
| `libsasl2-modules:amd64` | 2.1.28+dfsg1-5ubuntu3.1 | BSD-2-clause, BSD-2-clause and MIT-CMU, BSD-2.2-clause, BSD-3-Clause-Attribution, BSD-3-Clause-Attribution and IBM-as-is, BSD-3-Clause-Attribution and MIT-Export, BSD-3-clause, BSD-3-clause-JANET, BSD-3-clause-JANET and BSD-3-Clause-Attribution, BSD-3-clause-PADL, BSD-3-clause-PADL and MIT-OpenVision, BSD-4-clause-UC, FSFULLR, FSFULLR and MIT-CMU, GPL-3, GPL-3+, IBM-as-is, MIT-CMU, MIT-Export, MIT-OpenVision, OpenLDAP, RSA-MD | `/usr/share/doc/libsasl2-modules/copyright` |
| `libsasl2-modules-db:amd64` | 2.1.28+dfsg1-5ubuntu3.1 | BSD-2-clause, BSD-2-clause and MIT-CMU, BSD-2.2-clause, BSD-3-Clause-Attribution, BSD-3-Clause-Attribution and IBM-as-is, BSD-3-Clause-Attribution and MIT-Export, BSD-3-clause, BSD-3-clause-JANET, BSD-3-clause-JANET and BSD-3-Clause-Attribution, BSD-3-clause-PADL, BSD-3-clause-PADL and MIT-OpenVision, BSD-4-clause-UC, FSFULLR, FSFULLR and MIT-CMU, GPL-3, GPL-3+, IBM-as-is, MIT-CMU, MIT-Export, MIT-OpenVision, OpenLDAP, RSA-MD | `/usr/share/doc/libsasl2-modules-db/copyright` |
| `libsbc1:amd64` | 2.0-1build1 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libsbc1/copyright` |
| `libsdl2-2.0-0:amd64` | 2.30.0+dfsg-1ubuntu3.1 | Apache-2.0, BSD-3-clause, BSD-3-clause or GPL-3 or hidapi-orig, and zlib/libpng, BSD-3-clause-chromium, BSD-3-clause-kitware, BrownUn_UnCalifornia_ErikCorry, Expat, Expat and MIT-open-group, Expat-like, GPL-3, Gareth_McCaughan, LGPL-2.1+, MIT-open-group, Mozilla-permissive, Mozilla-permissive and Expat and zlib/libpng, PublicDomain_David_Ludwig, PublicDomain_Edgar_Simo, PublicDomain_Sam_Lantinga, RSA_Data_Security, SGI-Free-Software-License-B, SunPro, hidapi-orig, zlib-libpng-like-permissive, zlib/libpng, zlib/libpng and Expat-like and Apache-2.0, zlib/libpng and RSA_Data_Security, zlib/libpng and zlib-libpng-like-permissive | `/usr/share/doc/libsdl2-2.0-0/copyright` |
| `libseccomp2:amd64` | 2.5.5-1ubuntu3.1 | LGPL-2.1 | `/usr/share/doc/libseccomp2/copyright` |
| `libsecret-1-0:amd64` | 0.21.4-1build3 | Apache-2.0, BSD-3-clause, GPL-2+, LGPL-2.1+ | `/usr/share/doc/libsecret-1-0/copyright` |
| `libsecret-common` | 0.21.4-1build3 | Apache-2.0, BSD-3-clause, GPL-2+, LGPL-2.1+ | `/usr/share/doc/libsecret-common/copyright` |
| `libselinux1:amd64` | 3.5-2ubuntu2.1 | GPL-2, public-domain | `/usr/share/doc/libselinux1/copyright` |
| `libsemanage-common` | 3.5-1build5 | GPL-2, LGPL-2.1+ | `/usr/share/doc/libsemanage-common/copyright` |
| `libsemanage2:amd64` | 3.5-1build5 | GPL-2, LGPL-2.1+ | `/usr/share/doc/libsemanage2/copyright` |
| `libsensors-config` | 1:3.6.0-9build1 | текст уведомления | `/usr/share/doc/libsensors-config/copyright` |
| `libsensors5:amd64` | 1:3.6.0-9build1 | текст уведомления | `/usr/share/doc/libsensors5/copyright` |
| `libsepol2:amd64` | 3.5-2build1 | GPL-2, GPL-2+, LGPL-2.1+, Zlib | `/usr/share/doc/libsepol2/copyright` |
| `libserd-0-0:amd64` | 0.32.2-1 | 0BSD, BSD-3-clause, ISC | `/usr/share/doc/libserd-0-0/copyright` |
| `libsharpyuv0:amd64` | 1.3.2-0.4build3 | Apache-2.0, BSD-3-Clause | `/usr/share/doc/libsharpyuv0/copyright` |
| `libshine3:amd64` | 3.1.1-2build1 | GPL-2+, LGPL-2 | `/usr/share/doc/libshine3/copyright` |
| `libshout3:amd64` | 2.4.6-1build2 | FSFUL, FSFULLR, FSFULLR and GPL-2+ with Libtool exception, FSFULLR~Makefile.in, GPL-2+, GPL-2+ with Autoconf exception, GPL-3+, GPL-3+~file, GPL-3+~file with Autoconf exception, LGPL-2+, NTP~Rushing, X11 | `/usr/share/doc/libshout3/copyright` |
| `libslang2:amd64` | 2.3.3-3build2 | GPL-2+ | `/usr/share/doc/libslang2/copyright` |
| `libsm6:amd64` | 2:1.2.3-1build3 | текст уведомления | `/usr/share/doc/libsm6/copyright` |
| `libsmartcols1:amd64` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/libsmartcols1/copyright` |
| `libsnappy1v5:amd64` | 1.1.10-1build1 | BSD-3-Clause, CC-BY-3.0, CC-BY-4.0, MIT, public-domain | `/usr/share/doc/libsnappy1v5/copyright` |
| `libsndfile1:amd64` | 1.2.2-1ubuntu5.24.04.1 | Apache-2.0, BSD-2-clause, BSD-3-clause, BSD-3-clause and LGPL-2.1+, FSFAP, GPL-2+, GPL-3+, LGPL-2+, LGPL-2.1+, NTP, gsm, sun | `/usr/share/doc/libsndfile1/copyright` |
| `libsndio7.0:amd64` | 1.9.0-0.3build3 | ISC, ISC-packaging | `/usr/share/doc/libsndio7.0/copyright` |
| `libsodium23:amd64` | 1.0.18-1ubuntu0.24.04.1 | BSD-2-clause, CC0, GPL-2+, ISC, MIT, public-domain | `/usr/share/doc/libsodium23/copyright` |
| `libsord-0-0:amd64` | 0.16.16-2build1 | ISC | `/usr/share/doc/libsord-0-0/copyright` |
| `libsoundtouch1:amd64` | 2.3.2+ds1-1build1 | LGPL-2.1+ | `/usr/share/doc/libsoundtouch1/copyright` |
| `libsoup-3.0-0:amd64` | 3.4.4-5ubuntu0.9 | Expat, LGPL-2+, LGPL-2.1+, MPL-2.0, MPL-2.0 or RSA-Other, RSA-Other | `/usr/share/doc/libsoup-3.0-0/copyright` |
| `libsoup-3.0-common` | 3.4.4-5ubuntu0.9 | Expat, LGPL-2+, LGPL-2.1+, MPL-2.0, MPL-2.0 or RSA-Other, RSA-Other | `/usr/share/doc/libsoup-3.0-common/copyright` |
| `libsoxr0:amd64` | 0.1.3-4build3 | LGPL-2.1+, Spherepack, permissive1, permissive2 | `/usr/share/doc/libsoxr0/copyright` |
| `libspa-0.2-modules:amd64` | 1.0.5-1ubuntu3.3 | BZIP2, Expat, Expat and LGPL-2.1+, FFTPACK, GPL-2, LGPL-2+, LGPL-2+ and LGPL-2.1+ and Expat, LGPL-2.1+ | `/usr/share/doc/libspa-0.2-modules/copyright` |
| `libspandsp2t64:amd64` | 0.0.6+dfsg-2.1build1 | текст уведомления | `/usr/share/doc/libspandsp2t64/copyright` |
| `libspeex1:amd64` | 1.2.1-2ubuntu2.24.04.1 | BSD-3-Clause, BSD-3-Clause and custom-1, GFDL-1.1-or-later, LGPL-2.0-or-later, custom-1 | `/usr/share/doc/libspeex1/copyright` |
| `libsphinxbase3t64:amd64` | 0.8+5prealpha+1-17build2 | BSD-2-clause, BSD-2-clause-beyond, BSD-3-clause, BSD-3-clause-carnegie, GPL-2+, lucent, u-o-tennesee | `/usr/share/doc/libsphinxbase3t64/copyright` |
| `libsqlite3-0:amd64` | 3.45.1-1ubuntu2.8 | GPL-2+, public-domain | `/usr/share/doc/libsqlite3-0/copyright` |
| `libsratom-0-0:amd64` | 0.6.16-1build1 | ISC | `/usr/share/doc/libsratom-0-0/copyright` |
| `libsrt1.5-gnutls:amd64` | 1.5.3-1build2 | BSD-3-clause, LGPL-2.1+, MPL-2.0, Zlib, unlicense | `/usr/share/doc/libsrt1.5-gnutls/copyright` |
| `libsrtp2-1:amd64` | 2.5.0-3build1 | BSD-3-clause~Cisco, BSD-3-clause~Ingate, Expat, FSFUL, GPL-2+, GPL-2+ with Autoconf exception, GPL-3+, X11 | `/usr/share/doc/libsrtp2-1/copyright` |
| `libss2:amd64` | 1.47.0-2.4~exp1ubuntu4.1 | Apache-2, BSD-3-Clause, GPL or MIT-US-export, GPL-2, GPL-2+ with Texinfo exception, ISC, Kazlib, LGPL-2, Latex2e | `/usr/share/doc/libss2/copyright` |
| `libssh-4:amd64` | 0.10.6-2ubuntu0.5 | BSD-2-clause, BSD-3-clause, LGPL-2.1, LGPL-2.1+~OpenSSL, LGPL-2.1+~OpenSSL or BSD-2-clause or BSD-3-clause, public-domain | `/usr/share/doc/libssh-4/copyright` |
| `libssh-gcrypt-4:amd64` | 0.10.6-2ubuntu0.5 | BSD-2-clause, BSD-3-clause, LGPL-2.1, LGPL-2.1+~OpenSSL, LGPL-2.1+~OpenSSL or BSD-2-clause or BSD-3-clause, public-domain | `/usr/share/doc/libssh-gcrypt-4/copyright` |
| `libssl3t64:amd64` | 3.0.13-0ubuntu3.16 | Apache-2.0, Artistic, Artistic or GPL-1+, GPL-1+ | `/usr/share/doc/libssl3t64/copyright` |
| `libstdc++6:amd64` | 14.2.0-4ubuntu2~24.04.1 | GPL-3.0-or-later с GCC Runtime Library Exception 3.1 для библиотеки | `/usr/share/doc/libstdc++6/copyright` |
| `libsvtav1enc1d1:amd64` | 1.7.0+dfsg-2build1 | BSD-2-clause, BSD-3-Clause-Clear, BSD-3-clause, Expat, ISC, LGPL-2.1+ | `/usr/share/doc/libsvtav1enc1d1/copyright` |
| `libswresample4:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libswresample4/copyright` |
| `libswscale7:amd64` | 7:6.1.1-3ubuntu5 | BSD-1-clause, BSD-2-clause, BSD-3-clause, BSL, Expat, GPL-2+, GPL-3+, IJG, ISC, LGPL-2+, LGPL-2.1+, LGPL-2.1+ and BSD-2-clause, LGPL-2.1+ and BSD-3-clause, LGPL-2.1+ and BSL, LGPL-2.1+ and Expat, LGPL-2.1+ and Sundry, Sundry, Zlib, man-page, public-domain | `/usr/share/doc/libswscale7/copyright` |
| `libsystemd-shared:amd64` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libsystemd-shared/copyright` |
| `libsystemd0:amd64` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libsystemd0/copyright` |
| `libtag1v5:amd64` | 1.13.1-1build1 | BSD-2-clause, BSL-1.0, LGPL-2.1, LGPL-2.1 or MPL-1.1, MPL-1.1 | `/usr/share/doc/libtag1v5/copyright` |
| `libtag1v5-vanilla:amd64` | 1.13.1-1build1 | BSD-2-clause, BSL-1.0, LGPL-2.1, LGPL-2.1 or MPL-1.1, MPL-1.1 | `/usr/share/doc/libtag1v5-vanilla/copyright` |
| `libtasn1-6:amd64` | 4.19.0-3ubuntu0.24.04.2 | текст уведомления | `/usr/share/doc/libtasn1-6/copyright` |
| `libtext-iconv-perl:amd64` | 1.7-8build3 | Artistic, Artistic or GPL-1+, GPL-1+ | `/usr/share/doc/libtext-iconv-perl/copyright` |
| `libthai-data` | 0.1.29-2build1 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libthai-data/copyright` |
| `libthai0:amd64` | 0.1.29-2build1 | GPL-2+, LGPL-2.1+ | `/usr/share/doc/libthai0/copyright` |
| `libtheora0:amd64` | 1.1.1+dfsg.1-16.1build3 | BSD-3-Clause | `/usr/share/doc/libtheora0/copyright` |
| `libtiff6:amd64` | 4.5.1+git230720-4ubuntu2.5 | Hylafax | `/usr/share/doc/libtiff6/copyright` |
| `libtinfo6:amd64` | 6.4+20240113-1ubuntu2.2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/libtinfo6/copyright` |
| `libtwolame0:amd64` | 0.4.0-2build3 | LGPL-2+ | `/usr/share/doc/libtwolame0/copyright` |
| `libudev1:amd64` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/libudev1/copyright` |
| `libudfread0:amd64` | 1.1.2-1build1 | GPL-2+ with autoconf-macro exception, LGPL-2.1+ | `/usr/share/doc/libudfread0/copyright` |
| `libunibreak5:amd64` | 5.1-2build1 | Zlib, unicode-data | `/usr/share/doc/libunibreak5/copyright` |
| `libunistring5:amd64` | 1.1-2build1.1 | FreeSoftware, GFDL-NIV-1.2+, GPL-2+, GPL-2+ with distribution exception, GPL-2+ with distribution exception, Expat and GPL-2+, GPL-3+, GPL-3+ or GFDL-NIV-1.2+, LGPL-3+, LGPL-3+ or GPL-2+, X11 | `/usr/share/doc/libunistring5/copyright` |
| `libunwind8:amd64` | 1.6.2-3build1.1 | Expat, GPL-2+ | `/usr/share/doc/libunwind8/copyright` |
| `libusb-1.0-0:amd64` | 2:1.0.27-1 | текст уведомления | `/usr/share/doc/libusb-1.0-0/copyright` |
| `libuuid1:amd64` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/libuuid1/copyright` |
| `libv4l-0t64:amd64` | 1.26.1-4build3 | BSD-2-clause, BSD-3-clause, BSD-3-clause or GPL-2, BSD-3-clause or GPL-2+, BSD-3-clause or LGPL-2.1, Expat, FSFULLR, GPL-2, GPL-2+, GPL-3+, HPND-sell-variant, LGPL, LGPL-2+, LGPL-2.1, LGPL-2.1+, jpeg-group | `/usr/share/doc/libv4l-0t64/copyright` |
| `libv4lconvert0t64:amd64` | 1.26.1-4build3 | BSD-2-clause, BSD-3-clause, BSD-3-clause or GPL-2, BSD-3-clause or GPL-2+, BSD-3-clause or LGPL-2.1, Expat, FSFULLR, GPL-2, GPL-2+, GPL-3+, HPND-sell-variant, LGPL, LGPL-2+, LGPL-2.1, LGPL-2.1+, jpeg-group | `/usr/share/doc/libv4lconvert0t64/copyright` |
| `libva-drm2:amd64` | 2.20.0-2ubuntu0.2 | Expat, Expat-advertising, GPL-2+, other | `/usr/share/doc/libva-drm2/copyright` |
| `libva-x11-2:amd64` | 2.20.0-2ubuntu0.2 | Expat, Expat-advertising, GPL-2+, other | `/usr/share/doc/libva-x11-2/copyright` |
| `libva2:amd64` | 2.20.0-2ubuntu0.2 | Expat, Expat-advertising, GPL-2+, other | `/usr/share/doc/libva2/copyright` |
| `libvdpau1:amd64` | 1.5-2build1 | Expat, other | `/usr/share/doc/libvdpau1/copyright` |
| `libvidstab1.1:amd64` | 1.1.0-2build1 | GPL-2.0+ | `/usr/share/doc/libvidstab1.1/copyright` |
| `libvisual-0.4-0:amd64` | 0.4.2-2build1 | GPL-2+, LGPL-2+, LGPL-2.1+ | `/usr/share/doc/libvisual-0.4-0/copyright` |
| `libvo-aacenc0:amd64` | 0.1.3-2build1 | Apache-2.0 | `/usr/share/doc/libvo-aacenc0/copyright` |
| `libvo-amrwbenc0:amd64` | 0.1.3-2build1 | Apache-2.0 | `/usr/share/doc/libvo-amrwbenc0/copyright` |
| `libvorbis0a:amd64` | 1.3.7-1build3 | BSD-3-Clause, RFC-special | `/usr/share/doc/libvorbis0a/copyright` |
| `libvorbisenc2:amd64` | 1.3.7-1build3 | BSD-3-Clause, RFC-special | `/usr/share/doc/libvorbisenc2/copyright` |
| `libvorbisfile3:amd64` | 1.3.7-1build3 | BSD-3-Clause, RFC-special | `/usr/share/doc/libvorbisfile3/copyright` |
| `libvpl2` | 2023.3.0-1build1 | Apache-2.0, BSD-3-clause, MIT | `/usr/share/doc/libvpl2/copyright` |
| `libvpx9:amd64` | 1.14.0-1ubuntu2.3 | BSD-3-Clause, ISC, public-domain | `/usr/share/doc/libvpx9/copyright` |
| `libvulkan1:amd64` | 1.3.275.0-1build1 | Apache-2.0, MIT, MIT or Apache-2.0 | `/usr/share/doc/libvulkan1/copyright` |
| `libwavpack1:amd64` | 5.6.0-1build1 | BSD-2-clause, BSD-3-clause, public-domain | `/usr/share/doc/libwavpack1/copyright` |
| `libwayland-client0:amd64` | 1.22.0-2.1build1 | X11 | `/usr/share/doc/libwayland-client0/copyright` |
| `libwayland-cursor0:amd64` | 1.22.0-2.1build1 | X11 | `/usr/share/doc/libwayland-cursor0/copyright` |
| `libwayland-egl1:amd64` | 1.22.0-2.1build1 | X11 | `/usr/share/doc/libwayland-egl1/copyright` |
| `libwayland-server0:amd64` | 1.22.0-2.1build1 | X11 | `/usr/share/doc/libwayland-server0/copyright` |
| `libwebp7:amd64` | 1.3.2-0.4build3 | Apache-2.0, BSD-3-Clause | `/usr/share/doc/libwebp7/copyright` |
| `libwebpdemux2:amd64` | 1.3.2-0.4build3 | Apache-2.0, BSD-3-Clause | `/usr/share/doc/libwebpdemux2/copyright` |
| `libwebpmux3:amd64` | 1.3.2-0.4build3 | Apache-2.0, BSD-3-Clause | `/usr/share/doc/libwebpmux3/copyright` |
| `libwebrtc-audio-processing1:amd64` | 0.3.1-0ubuntu6 | BSD-3-clause | `/usr/share/doc/libwebrtc-audio-processing1/copyright` |
| `libwildmidi2:amd64` | 0.4.3-1build3 | CC-BY-SA-4.0, GPL-3+, LGPL-3+ | `/usr/share/doc/libwildmidi2/copyright` |
| `libwoff1:amd64` | 1.0.2-2build1 | Expat | `/usr/share/doc/libwoff1/copyright` |
| `libx11-6:amd64` | 2:1.8.7-1ubuntu0.1 | текст уведомления | `/usr/share/doc/libx11-6/copyright` |
| `libx11-data` | 2:1.8.7-1ubuntu0.1 | текст уведомления | `/usr/share/doc/libx11-data/copyright` |
| `libx11-xcb1:amd64` | 2:1.8.7-1ubuntu0.1 | текст уведомления | `/usr/share/doc/libx11-xcb1/copyright` |
| `libx264-164:amd64` | 2:0.164.3108+git31e19f9-1 | BSD-3-clause, Expat, GPL-2+, GPL-2+ with other exception, ISC, LGPL-2.1+, public-domain | `/usr/share/doc/libx264-164/copyright` |
| `libx265-199:amd64` | 3.5-2build1 | Expat, GPL-2+, ISC, LGPL-2.1+ | `/usr/share/doc/libx265-199/copyright` |
| `libxau6:amd64` | 1:1.0.9-1build6 | текст уведомления | `/usr/share/doc/libxau6/copyright` |
| `libxaw7:amd64` | 2:1.0.14-1build2 | текст уведомления | `/usr/share/doc/libxaw7/copyright` |
| `libxcb-dri3-0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-dri3-0/copyright` |
| `libxcb-glx0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-glx0/copyright` |
| `libxcb-present0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-present0/copyright` |
| `libxcb-randr0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-randr0/copyright` |
| `libxcb-render0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-render0/copyright` |
| `libxcb-shm0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-shm0/copyright` |
| `libxcb-sync1:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-sync1/copyright` |
| `libxcb-xfixes0:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-xfixes0/copyright` |
| `libxcb-xkb1:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb-xkb1/copyright` |
| `libxcb1:amd64` | 1.15-1ubuntu2 | текст уведомления | `/usr/share/doc/libxcb1/copyright` |
| `libxcomposite1:amd64` | 1:0.4.5-1build3 | текст уведомления | `/usr/share/doc/libxcomposite1/copyright` |
| `libxcursor1:amd64` | 1:1.2.1-1build1 | текст уведомления | `/usr/share/doc/libxcursor1/copyright` |
| `libxdamage1:amd64` | 1:1.1.6-1build1 | текст уведомления | `/usr/share/doc/libxdamage1/copyright` |
| `libxdmcp6:amd64` | 1:1.1.3-0ubuntu6 | текст уведомления | `/usr/share/doc/libxdmcp6/copyright` |
| `libxext6:amd64` | 2:1.3.4-1build2 | текст уведомления | `/usr/share/doc/libxext6/copyright` |
| `libxfixes3:amd64` | 1:6.0.0-2build1 | текст уведомления | `/usr/share/doc/libxfixes3/copyright` |
| `libxfont2:amd64` | 1:2.0.6-1+deb13u1build0.24.04.2 | текст уведомления | `/usr/share/doc/libxfont2/copyright` |
| `libxi6:amd64` | 2:1.8.1-1build1 | текст уведомления | `/usr/share/doc/libxi6/copyright` |
| `libxinerama1:amd64` | 2:1.1.4-3build1 | текст уведомления | `/usr/share/doc/libxinerama1/copyright` |
| `libxkbcommon-x11-0:amd64` | 1.6.0-1build1 | текст уведомления | `/usr/share/doc/libxkbcommon-x11-0/copyright` |
| `libxkbcommon0:amd64` | 1.6.0-1build1 | текст уведомления | `/usr/share/doc/libxkbcommon0/copyright` |
| `libxkbfile1:amd64` | 1:1.1.0-1build4 | текст уведомления | `/usr/share/doc/libxkbfile1/copyright` |
| `libxml2:amd64` | 2.9.14+dfsg-1.3ubuntu3.10 | ISC, MIT-1 | `/usr/share/doc/libxml2/copyright` |
| `libxmu6:amd64` | 2:1.1.3-3build2 | текст уведомления | `/usr/share/doc/libxmu6/copyright` |
| `libxmuu1:amd64` | 2:1.1.3-3build2 | текст уведомления | `/usr/share/doc/libxmuu1/copyright` |
| `libxpm4:amd64` | 1:3.5.17-1ubuntu0.24.04.2 | текст уведомления | `/usr/share/doc/libxpm4/copyright` |
| `libxrandr2:amd64` | 2:1.5.2-2build1 | текст уведомления | `/usr/share/doc/libxrandr2/copyright` |
| `libxrender1:amd64` | 1:0.9.10-1.1build1 | текст уведомления | `/usr/share/doc/libxrender1/copyright` |
| `libxshmfence1:amd64` | 1.3-1build5 | текст уведомления | `/usr/share/doc/libxshmfence1/copyright` |
| `libxslt1.1:amd64` | 1.1.39-0exp1ubuntu0.24.04.3 | текст уведомления | `/usr/share/doc/libxslt1.1/copyright` |
| `libxss1:amd64` | 1:1.2.3-1build3 | текст уведомления | `/usr/share/doc/libxss1/copyright` |
| `libxt6t64:amd64` | 1:1.2.1-1.2build1 | текст уведомления | `/usr/share/doc/libxt6t64/copyright` |
| `libxtst6:amd64` | 2:1.2.3-1.1ubuntu0.1 | текст уведомления | `/usr/share/doc/libxtst6/copyright` |
| `libxvidcore4:amd64` | 2:1.3.7-1build1 | GPL-2+, LGPL-2+ | `/usr/share/doc/libxvidcore4/copyright` |
| `libxxf86vm1:amd64` | 1:1.1.4-1build4 | текст уведомления | `/usr/share/doc/libxxf86vm1/copyright` |
| `libxxhash0:amd64` | 0.8.2-2build1 | BSD-2-clause, BSD-2-clause or GPL-2+, GPL-2+ | `/usr/share/doc/libxxhash0/copyright` |
| `libyajl2:amd64` | 2.1.0-5build1 | ISC | `/usr/share/doc/libyajl2/copyright` |
| `libyuv0:amd64` | 0.0~git202401110.af6ac82-1 | BSD-3-Clause, public-domain | `/usr/share/doc/libyuv0/copyright` |
| `libzbar0t64:amd64` | 0.23.93-4build3 | текст уведомления | `/usr/share/doc/libzbar0t64/copyright` |
| `libzimg2:amd64` | 3.0.5+ds1-1build1 | GPL-3+ with AutoConf exception, WTFPL-2 | `/usr/share/doc/libzimg2/copyright` |
| `libzix-0-0:amd64` | 0.4.2-2build1 | 0BSD, 0BSD or ISC, ISC | `/usr/share/doc/libzix-0-0/copyright` |
| `libzmq5:amd64` | 4.3.5-1build2 | LGPL-2.0+, MIT, MPL-2.0 | `/usr/share/doc/libzmq5/copyright` |
| `libzstd1:amd64` | 1.5.5+dfsg2-2build1.1 | BSD-3-clause, BSD-3-clause or GPL-2, Expat, GPL-2, zlib | `/usr/share/doc/libzstd1/copyright` |
| `libzvbi-common` | 0.2.42-2 | BSD-2-Clause, BSD-3-Clause, GPL-2, GPL-2+, GPL-2+ or BSD-3-Clause, LGPL-2+, LGPL-2.1+, MIT | `/usr/share/doc/libzvbi-common/copyright` |
| `libzvbi0t64:amd64` | 0.2.42-2 | BSD-2-Clause, BSD-3-Clause, GPL-2, GPL-2+, GPL-2+ or BSD-3-Clause, LGPL-2+, LGPL-2.1+, MIT | `/usr/share/doc/libzvbi0t64/copyright` |
| `libzxing3:amd64` | 2.2.1-3 | Apache-2.0, BSD-3-Clause, CC0-1.0, CC0-1.0 or Apache-2.0, Unicode-license-v3 | `/usr/share/doc/libzxing3/copyright` |
| `login` | 1:4.13+dfsg1-4ubuntu3.2 | BSD-3-clause, GPL-1, GPL-2+, public-domain | `/usr/share/doc/login/copyright` |
| `logsave` | 1.47.0-2.4~exp1ubuntu4.1 | Apache-2, BSD-3-Clause, GPL or MIT-US-export, GPL-2, GPL-2+ with Texinfo exception, ISC, Kazlib, LGPL-2, Latex2e | `/usr/share/doc/logsave/copyright` |
| `mawk` | 1.3.4.20240123-1build1 | CC-BY-3.0, GPL-2.0-only, X11 | `/usr/share/doc/mawk/copyright` |
| `media-types` | 10.1.0 | ad-hoc | `/usr/share/doc/media-types/copyright` |
| `mesa-libgallium:amd64` | 25.2.8-0ubuntu0.24.04.4 | (MIT OR Apache-2.0) AND Unicode-DFS-2016, Apache-2.0, Apache-2.0 OR MIT, BSD-2-clause, BSD-3-google, BSL, GPL, GPL-1+, GPL-2, GPL-2 or MIT, Khronos, MIT, MIT OR Apache-2.0, MLAA, SGI, Unicode-DFS-2016 | `/usr/share/doc/mesa-libgallium/copyright` |
| `mount` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/mount/copyright` |
| `ncurses-base` | 6.4+20240113-1ubuntu2.2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/ncurses-base/copyright` |
| `ncurses-bin` | 6.4+20240113-1ubuntu2.2 | BSD-3-clause, MIT/X11, X11 | `/usr/share/doc/ncurses-bin/copyright` |
| `netbase` | 6.4 | GPL-2 | `/usr/share/doc/netbase/copyright` |
| `nodejs` | 26.13.0-1nodesource1 | текст уведомления | `/usr/share/doc/nodejs/copyright` |
| `ocl-icd-libopencl1:amd64` | 2.3.2-1build1 | BSD-2-Clause | `/usr/share/doc/ocl-icd-libopencl1/copyright` |
| `openssh-client` | 1:9.6p1-3ubuntu13.20 | BSD-2-clause, BSD-3-clause, Expat-with-advertising-restriction, Mazieres-BSD-style, OpenSSH, Powell-BSD-style, public-domain | `/usr/share/doc/openssh-client/copyright` |
| `openssl` | 3.0.13-0ubuntu3.16 | Apache-2.0, Artistic, Artistic or GPL-1+, GPL-1+ | `/usr/share/doc/openssl/copyright` |
| `passwd` | 1:4.13+dfsg1-4ubuntu3.2 | BSD-3-clause, GPL-1, GPL-2+, public-domain | `/usr/share/doc/passwd/copyright` |
| `perl` | 5.38.2-3.2ubuntu0.6 | Artistic, Artistic or GPL-1+ or Artistic-dist, Artistic-2, Artistic-dist, BSD-3-clause, BSD-3-clause-GENERIC, BSD-3-clause-with-weird-numbering, BSD-4-clause-POWERDOG, BZIP, CC0-1.0, DONT-CHANGE-THE-GPL, Expat, Expat or GPL-1+ or Artistic, FSFAP, GPL-1+, GPL-1+ or Artistic, GPL-1+ or Artistic or Artistic-dist, GPL-1+ or Artistic, and BSD-3-clause-GENERIC, GPL-1+ or Artistic, and BSD-4-clause-POWERDOG, GPL-1+ or Artistic, and Expat, GPL-1+ or Artistic, and Unicode, GPL-2+, GPL-2+ or Artistic, GPL-3+-WITH-BISON-EXCEPTION, LGPL-2.1, REGCOMP, REGCOMP, and GPL-1+ or Artistic, SDBM-PUBLIC-DOMAIN, TEXT-TABS, Unicode, ZLIB | `/usr/share/doc/perl/copyright` |
| `perl-base` | 5.38.2-3.2ubuntu0.6 | Artistic, Artistic or GPL-1+ or Artistic-dist, Artistic-2, Artistic-dist, BSD-3-clause, BSD-3-clause-GENERIC, BSD-3-clause-with-weird-numbering, BSD-4-clause-POWERDOG, BZIP, CC0-1.0, DONT-CHANGE-THE-GPL, Expat, Expat or GPL-1+ or Artistic, FSFAP, GPL-1+, GPL-1+ or Artistic, GPL-1+ or Artistic or Artistic-dist, GPL-1+ or Artistic, and BSD-3-clause-GENERIC, GPL-1+ or Artistic, and BSD-4-clause-POWERDOG, GPL-1+ or Artistic, and Expat, GPL-1+ or Artistic, and Unicode, GPL-2+, GPL-2+ or Artistic, GPL-3+-WITH-BISON-EXCEPTION, LGPL-2.1, REGCOMP, REGCOMP, and GPL-1+ or Artistic, SDBM-PUBLIC-DOMAIN, TEXT-TABS, Unicode, ZLIB | `/usr/share/doc/perl-base/copyright` |
| `perl-modules-5.38` | 5.38.2-3.2ubuntu0.6 | Artistic, Artistic or GPL-1+ or Artistic-dist, Artistic-2, Artistic-dist, BSD-3-clause, BSD-3-clause-GENERIC, BSD-3-clause-with-weird-numbering, BSD-4-clause-POWERDOG, BZIP, CC0-1.0, DONT-CHANGE-THE-GPL, Expat, Expat or GPL-1+ or Artistic, FSFAP, GPL-1+, GPL-1+ or Artistic, GPL-1+ or Artistic or Artistic-dist, GPL-1+ or Artistic, and BSD-3-clause-GENERIC, GPL-1+ or Artistic, and BSD-4-clause-POWERDOG, GPL-1+ or Artistic, and Expat, GPL-1+ or Artistic, and Unicode, GPL-2+, GPL-2+ or Artistic, GPL-3+-WITH-BISON-EXCEPTION, LGPL-2.1, REGCOMP, REGCOMP, and GPL-1+ or Artistic, SDBM-PUBLIC-DOMAIN, TEXT-TABS, Unicode, ZLIB | `/usr/share/doc/perl-modules-5.38/copyright` |
| `pinentry-curses` | 1.2.1-3ubuntu5 | GPL-2, GPL-2+, LGPL-3+, LGPL-3+ or GPL-2+, X11 | `/usr/share/doc/pinentry-curses/copyright` |
| `procps` | 2:4.0.4-4ubuntu3.3 | GPL-2.0+, LGPL-2.0+, LGPL-2.1+ | `/usr/share/doc/procps/copyright` |
| `publicsuffix` | 20231001.0357-0.1 | CC0, MPL-2.0 | `/usr/share/doc/publicsuffix/copyright` |
| `python3` | 3.12.3-0ubuntu2.1 | текст уведомления | `/usr/share/doc/python3/copyright` |
| `python3-minimal` | 3.12.3-0ubuntu2.1 | текст уведомления | `/usr/share/doc/python3-minimal/copyright` |
| `python3.12` | 3.12.3-1ubuntu0.17 | * Permission to use this software in any way is granted without, By obtaining, using, and/or copying this software and/or its, Permission  is  hereby granted,  free  of charge,  to  any person, Permission is hereby granted, free of charge, to any person obtaining, Permission to use, copy, modify, and distribute this software and, Permission to use, copy, modify, and distribute this software and its, Permission to use, copy, modify, and distribute this software for any, Redistribution and use in source and binary forms, with or without, This software is provided 'as-is', without any express or implied, This software is provided as-is, without express or implied | `/usr/share/doc/python3.12/copyright` |
| `python3.12-minimal` | 3.12.3-1ubuntu0.17 | * Permission to use this software in any way is granted without, By obtaining, using, and/or copying this software and/or its, Permission  is  hereby granted,  free  of charge,  to  any person, Permission is hereby granted, free of charge, to any person obtaining, Permission to use, copy, modify, and distribute this software and, Permission to use, copy, modify, and distribute this software and its, Permission to use, copy, modify, and distribute this software for any, Redistribution and use in source and binary forms, with or without, This software is provided 'as-is', without any express or implied, This software is provided as-is, without express or implied | `/usr/share/doc/python3.12-minimal/copyright` |
| `readline-common` | 8.2-4build1 | GFDL-NIV-1.3+, GPL-2+, GPL-3, GPL-3+, ISC-no-attribution | `/usr/share/doc/readline-common/copyright` |
| `sed` | 4.9-2ubuntu0.24.04.1 | BSD-4-clause-UC, BSL-1, GFDL-NIV-1.3+, GPL-3+, GPL-3+ and ISC, ISC, X11, pcre | `/usr/share/doc/sed/copyright` |
| `sensible-utils` | 0.0.22 | All-permissive, BSD-2-clause, GPL-2+, configure, installsh | `/usr/share/doc/sensible-utils/copyright` |
| `session-migration` | 0.3.9build1 | LGPL-3+ | `/usr/share/doc/session-migration/copyright` |
| `shared-mime-info` | 2.4-4 | текст уведомления | `/usr/share/doc/shared-mime-info/copyright` |
| `systemd` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/systemd/copyright` |
| `systemd-dev` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/systemd-dev/copyright` |
| `systemd-sysv` | 255.4-1ubuntu8.18 | CC0-1.0, Expat, GPL-2 with Linux-syscall-note exception, GPL-2+, LGPL-2.1+, public-domain | `/usr/share/doc/systemd-sysv/copyright` |
| `sysvinit-utils` | 3.08-6ubuntu3 | GPL-2.0, GPL-2.0+, GPL-3.0, LGPL-2.1+ | `/usr/share/doc/sysvinit-utils/copyright` |
| `tar` | 1.35+dfsg-3ubuntu0.4 | GPL-2+, GPL-3+, GPL-3+ with Bison exception, LGPL-2.1+, LGPL-3+ | `/usr/share/doc/tar/copyright` |
| `timgm6mb-soundfont` | 1.3-5 | GPL-2, GPL-3+ | `/usr/share/doc/timgm6mb-soundfont/copyright` |
| `tzdata` | 2026e-0ubuntu0.24.04.1 | ICU, public-domain | `/usr/share/doc/tzdata/copyright` |
| `ubuntu-keyring` | 2023.11.28.1 | текст уведомления | `/usr/share/doc/ubuntu-keyring/copyright` |
| `ubuntu-mono` | 24.04-0ubuntu1 | CC-BY-SA-3.0, GPL-3 | `/usr/share/doc/ubuntu-mono/copyright` |
| `unminimize` | 0.2.1 | GPL-2.0+ | `/usr/share/doc/unminimize/copyright` |
| `util-linux` | 2.39.3-9ubuntu6.6 | BSD-3-clause, BSD-4-clause, BSLA, GPL-2, GPL-2+, GPL-3+, LGPL, LGPL-2+, LGPL-2.1+, LGPL-3+, MIT, public-domain | `/usr/share/doc/util-linux/copyright` |
| `wget` | 1.21.4-1ubuntu4.5 | текст уведомления | `/usr/share/doc/wget/copyright` |
| `x11-common` | 1:7.7+23ubuntu3 | текст уведомления | `/usr/share/doc/x11-common/copyright` |
| `x11-xkb-utils` | 7.7+8build2 | текст уведомления | `/usr/share/doc/x11-xkb-utils/copyright` |
| `xauth` | 1:1.1.2-1build1 | текст уведомления | `/usr/share/doc/xauth/copyright` |
| `xfonts-cyrillic` | 1:1.0.5+nmu1 | текст уведомления | `/usr/share/doc/xfonts-cyrillic/copyright` |
| `xfonts-encodings` | 1:1.0.5-0ubuntu2 | текст уведомления | `/usr/share/doc/xfonts-encodings/copyright` |
| `xfonts-scalable` | 1:1.0.3-1.3 | текст уведомления | `/usr/share/doc/xfonts-scalable/copyright` |
| `xfonts-utils` | 1:7.7+6build3 | текст уведомления | `/usr/share/doc/xfonts-utils/copyright` |
| `xkb-data` | 2.41-2ubuntu1.1 | текст уведомления | `/usr/share/doc/xkb-data/copyright` |
| `xserver-common` | 2:21.1.12-1ubuntu1.9 | текст уведомления | `/usr/share/doc/xserver-common/copyright` |
| `xvfb` | 2:21.1.12-1ubuntu1.9 | текст уведомления | `/usr/share/doc/xvfb/copyright` |
| `zlib1g:amd64` | 1:1.3.dfsg-3.1ubuntu2.3 | Zlib | `/usr/share/doc/zlib1g/copyright` |
| `zstd` | 1.5.5+dfsg2-2build1.1 | BSD-3-clause, BSD-3-clause or GPL-2, Expat, GPL-2, zlib | `/usr/share/doc/zstd/copyright` |

</details>

<details>
<summary>Браузеры и FFmpeg из образа QA</summary>

| Компонент | Файлы уведомлений в каталоге /ms-playwright |
| --- | --- |
| `chromium-1248` | `chromium-1248/chrome-linux64/WidevineCdm/LICENSE` |
| `chromium_headless_shell-1248` | `chromium_headless_shell-1248/chrome-headless-shell-linux64/LICENSE.headless_shell` |
| `ffmpeg-1013` | `ffmpeg-1013/COPYING.LGPLv2.1` |
| `firefox-1555` | отдельный файл не найден |
| `webkit-2370` | отдельный файл не найден |

</details>
