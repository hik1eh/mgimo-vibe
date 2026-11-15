# Ещё четыре фотографии в карусели входа

15 ноября 2026. Запрос владельца: добавить 3–4 фотографии вымышленного вуза или студентов именно в карусель авторизации. Добавлены четыре фотографии; вместе с прежними корпусом, библиотекой и атриумом в наборе теперь семь уникальных изображений. Коммит реализации: `969d986`.

## Изображения

Все новые изображения созданы встроенным ImageGen как самостоятельные фотографии без входных изображений. Вуз и взрослые студенты вымышлены. Общая палитра: светлый камень, дерево, синие кресла, естественный дневной свет. После генерации исходные PNG механически преобразованы Pillow в RGB WebP с quality 82, без изменения композиции. Размер каждого файла — 1536×1024, пропорции 3:2.

| Файл в `frontend/src/assets/` | Сцена | Байты WebP |
|---|---|---:|
| `campus-study-group.webp` | Совместная работа студентов в библиотеке | 163146 |
| `campus-computer-lab.webp` | Учебный проект в компьютерной лаборатории | 175850 |
| `campus-seminar.webp` | Обсуждение на семинаре | 116176 |
| `campus-cafe.webp` | Разговор студентов за кофе в атриуме | 187948 |

Всего новых WebP: 643120 байт. Исходные PNG сохранены локально в `artifacts/auth-image-sources/` под теми же именами; точные промпты — `artifacts/auth-photos/prompts.json`. Эти служебные материалы не входят в Git. [Обзор четырёх фотографий](screenshots/auth-carousel-new-photos.png) и [реальный экран 1440×900](screenshots/auth-carousel-students-1440.png) входят в репозиторий.

## Поведение карусели

В сцене сохранены четыре постоянных DOM-карточки, прежние интервалы и цикл 14,4 с. Содержимое карточки заменяется очередной загруженной фотографией в конце её CSS-цикла, за пределами видимой сцены. Ключ карточки не зависит от изображения, поэтому замена не перезапускает её движение. Одновременно показанные фотографии не повторяются.

Набор заранее загружается после монтирования десктопной карусели. При медленной загрузке остаётся готовая фотография. На мобильной ширине карусель не монтируется, новые изображения не запрашиваются. Hover не останавливает движение; стрелок и кнопки паузы нет. Режим reduced motion сохранён. Форма, шапочка, Allura, CSS-траектории и API не менялись.

## Фактические проверки

Проверки выполнялись в отдельном Docker-проекте `dekanat-qa`, основная БД не сбрасывалась:

```powershell
docker compose -p dekanat-qa -f compose.qa.yaml up --build -d --wait db app
docker compose -p dekanat-qa -f compose.qa.yaml build browser
docker compose -p dekanat-qa -f compose.qa.yaml run --rm --no-deps browser npx playwright test auth.spec.ts
```

TypeScript и Vite в Docker собрали приложение. Итог Playwright: **11 passed за 29,0 с**, 0 skipped/unexpected/flaky. Проверены пять ширин 360/390/768/1000/1440, шрифты, ARIA/axe, состояния формы, движение при наведении, reduced motion, WebGL/fallback, интервалы между изображениями и текст 200%. Новый тест дождался загрузки семи файлов, ускорил настоящие CSS-анимации и подтвердил смену всех семи фотографий в четырёх исходных DOM-узлах без ошибок JS/HTTP.

Первый прогон дал 10 passed / 1 failed: сравнение двух статичных кадров выполнялось до завершения перерисовки при переключении reduced motion. Тест теперь ждёт загрузки шрифтов и два animation frame перед первым снимком; продуктовый код ради этого не менялся. Протоколы: `artifacts/browser/auth-photos/results-first-pass.json` и `results.json`.

Дополнительно записан нормальный, не ускоренный цикл: `artifacts/browser/auth-photos/demo.webm`, семь снимков `normal-0.png`…`normal-6.png` и `capture.json`. Наблюдатель зафиксировал **7 уникальных фото / 4 карточки**. Реальный снимок `normal-3.png` открыт и проверен: фотографии заполнены, промежутки сохранены, форма и фон читаются. Учётные данные при записи не вводились.

Проверенный образ QA `sha256:6dd9442bc7f4e0d0d354a90828e38588dc2fbe4e425789eb8a782d88a3920920` использован для основного приложения:

```powershell
docker tag dekanat-qa-app:latest dekanat-handoff-app:latest
docker compose up --no-build -d --wait
docker compose ps
```

Основные `app` и `db` — healthy, `http://localhost:8000` — HTTP 200. Четыре новых файла на основном сервере возвращают HTTP 200 и побайтно совпадают с локальными WebP по SHA-256. Рабочая БД и пользовательские записи сохранены. Для обычного обновления из исходников достаточно `docker compose up --build -d --wait`.

После проверки отдельный QA остановлен командой `docker compose -p dekanat-qa -f compose.qa.yaml stop`, его том сохранён. Основной сервер оставлен работать.

Прежние 18 сценарных браузерных, 36 серверных, 4 теста утилит и 54 проверки готовности относятся к предыдущим прогонам и в этой небольшой итерации повторно не запускались. Физические устройства, аппаратные GPU, ручной скринридер и внешний HTTPS по-прежнему не проверены; публичный релиз отложен владельцем.

## Промпты ImageGen

Для каждого из четырёх вызовов использованы общий префикс ниже и соответствующее продолжение. Новая генерация, без reference images, прозрачный фон выключен.

Общий префикс:

```text
Photorealistic editorial university campus photograph for a website carousel. Landscape 3:2 composition, ideally 1536x1024. A completely fictional contemporary European university, cream limestone architecture, warm oak details, large daylight windows, restrained navy furniture, natural soft daylight and realistic neutral colors. Realistic photography, not illustration or a 3D render. All people must be entirely fictional adults aged 20-25, naturally proportioned faces and hands, candid mid-distance framing that shows the environment. No identifiable real university, logos, watermarks, posters with readable text, prominent branding, or readable screen content. No borders, no collage.
```

`campus-study-group`:

```text
Three adult students (two women and one man) collaborate around a library table with a laptop and open notebooks, relaxed focused discussion, light stone arches and bookshelves in the background. Off-center candid composition with visible spacious reading room, sophisticated calm academic atmosphere.
```

`campus-computer-lab`:

```text
Two adult students (a woman and a man) work together in a bright modern computer laboratory, seated at a long oak desk with monitors and a small electronics project, glass partitions and cream stone columns, no futuristic sci-fi equipment. Wide environmental view, naturally engaged in their work, no posing for camera.
```

`campus-seminar`:

```text
A small seminar in a sunlit university classroom: four adult students of varied appearances around curved oak desks, one adult student standing beside a blank whiteboard explaining an idea. Navy upholstered chairs, tall windows and cream walls. Natural attentive gestures and notebooks; no readable writing or text.
```

`campus-cafe`:

```text
Four adult students in a university cafe inside a bright glass-roofed atrium, sitting around a small oak table with unbranded coffee cups and a notebook, relaxed friendly conversation between classes. Plants, cream limestone and navy lounge seats in the background. Wide candid environmental photo, no one looking at the camera.
```
