# Уточнение экрана входа по дополнениям владельца

15 ноября 2026. Более поздние указания владельца заменяют соответствующие части `2-front-sign-in`: убрать рамку страницы и обрезание фотографий внутренним окном, не останавливать сцену при наведении, убрать стрелки/индикаторы перелистывания, заменить голову студенческим билетом по приложенной фотографии. Мобильная версия по-прежнему содержит только форму.

До изменений просмотрены новые локальные видео через кадры 30 fps: `00-40-16` — 491 кадр / 16,367 с, `00-42-38` — 386 / 12,867 с. Это записи референсов Carousel и Type Face; исходные файлы и декодированные кадры не копируются в Git. Дополнительно снят текущий экран в Docker Playwright, чтобы воспроизвести проблему.

## Что меняется

- Оболочка занимает весь viewport без внешних отступов, максимальной ширины или скруглённой внешней рамки. Десктопная сетка остаётся 65/35.
- Поток фотографий проходит по всей высоте левой сцены. Удаляется внутренний clipping-window 500 px. Полное центральное изображение видно целиком, соседние входят/выходят за границей всей сцены, как в видео.
- Пять пространственных карточек используют три фотографии с повторением, равномерные фазы и период 14,4 с. Вертикальное движение постоянно; наклон и глубина меняются вдоль траектории. На hover/focus нет паузы. Стрелки, точки, ручной выбор и подписи поверх фотографий убраны.
- Одна явная кнопка паузы остаётся для доступности длинной автоматической анимации. Только она, reduced motion, скрытая вкладка/сцена останавливают движение.
- Вместо головы — закрытая объёмная обложка студенческого билета: navy-материал, бумажный торец, корешок, золотая надпись «СТУДЕНЧЕСКИЙ БИЛЕТ». Front-cover texture подготовлена редактированием предоставленного образца через Image Gen; личных данных/новых логотипов нет.
- Билет проявляется горизонтальными полосами 0–2 с, вращается с периодом 9,6 с, распадается/исчезает после 7 с. Это адаптация характера Type Face к новому объекту; скульптуры головы больше нет. В reduced motion показывается целая читаемая обложка без вращения.

## Переиспользование и проверка

Сохраняются AuthPanel, API входа, поля/ошибки, existing navy/blue/ivory токены, 500 мс света, Three.js и Phosphor. Новых библиотек нет. Новые параметры: размеры фото/радиус пространственного потока и материалы билета; общие motion-периоды остаются именованными константами.

Проверки до передачи: пять ширин, края full-bleed 65/35, целые фото в нескольких фазах цикла, отсутствие стрелок/точек, продолжение движения на hover, явная pause/resume, сборка и вращение билета, reduced motion/fallback, отсутствие desktop-ресурсов на телефоне, вход трёх аккаунтов и сохранение черновика. Встроенный браузер ранее недоступен; разрешение владельца на Docker Playwright сохраняется.

## Фактические результаты

Реализация зафиксирована в `952e1d5`: `auth.tsx`, `auth.css`, `student-card.tsx`, `auth-motion.ts` и общие токены. Прежний `type-face.tsx` удалён. Модель состоит из двух обложек, бумажного блока и корешка. Проявление сделано шейдером, вращение — Three.js; фотографии двигаются CSS transforms. Счётчик 3D использует реальное прошедшее время, поэтому низкая частота кадров не растягивает сборку. Пауза сохраняет фазу.

| Команда | Реальный результат |
|---|---|
| `docker compose up --build -d --wait` | TypeScript/Vite и Docker-образ собраны; основной app/db healthy |
| `npm.cmd --prefix frontend test` | 4 passed |
| `docker compose -p dekanat-qa -f compose.qa.yaml run --rm --no-deps browser npx playwright test auth.spec.ts states.spec.ts workflow.spec.ts compatibility.spec.ts` | 18 passed за 101,9 с; 0 skipped/unexpected/flaky |
| `.\.venv\Scripts\python.exe scripts/check_demo.py --base http://127.0.0.1:8000 --origin http://localhost:8000 --output artifacts/browser/auth-revision/local-readiness.json` | 54 passed, 0 warnings |
| `.\.venv\Scripts\python.exe scripts/verify_pdf.py artifacts/browser/certificate-ui.pdf` | PASS: одна страница, кириллица, владелец и отметка демонстрационного документа |

Браузерный набор: 10 auth, 4 states, 2 workflow, 2 compatibility. Проверены 360/390/768/1000/1440 px, края страницы и 35% формы, реальные изображения/WebGL, восемь фаз потока с целой фотографией в каждой, продолжение движения на hover, pause/resume, reduced motion и отсутствие desktop-ресурсов на мобильном. Входы трёх аккаунтов, reload/logout, сохранение черновика при повторном входе, обработка справки и отказ чужой заявке/документу повторно прошли. Firefox/WebKit входят в compatibility. Axe на пяти ширинах не нашёл нарушений выбранных WCAG-правил; JS/HTTP/WebGL ошибки в auth-наборе отсутствуют, ожидаемый гостевой `/me` 401 исключён явно.

При повторной сборке QA Docker Hub один раз вернул TLS handshake timeout. Финальный образ основного приложения уже был собран: его локально пометили как `dekanat-qa-app:latest` и запустили QA с `--no-build`. Итоговые тесты и видео используют один и тот же образ приложения с отдельными БД/окружением. Сброшена только `dekanat_e2e_test`, рабочая база не сбрасывалась. После проверок QA остановлен с сохранением тома; основной Docker оставлен работающим.

Снимок до исправлений показал внутреннее окно высотой 500 px и `data-running=false` на hover. Сравнение [до/после](screenshots/auth-revised-before-after.png), [десктоп](screenshots/auth-revised-1440.png), [узкий десктоп](screenshots/auth-revised-1000.png), [телефон](screenshots/auth-revised-360.png). Подробная визуальная оценка — [design-qa.md](../design-qa.md). Анонимное видео без ввода паролей: `artifacts/browser/auth-revision/demo.mp4`. JSON последнего прогона и готовности — в той же локальной папке. Исходные видеореференсы и их кадры остались в системном Temp вне проекта/Git.

## Изображение обложки

Runtime: `frontend/src/assets/student-card-cover.webp`, 1516×1038, 455 930 байт. Исходный PNG — локально в игнорируемом `artifacts/auth-image-sources/`. Image Gen использован в режиме редактирования приложенной фотографии; WebP сохраняет navy-фактуру и золотой заголовок. Личных данных нет.

Промпт редактирования:

> Edit the attached Russian student booklet photo into a production-ready front-cover texture for a 3D model. Use the latest attached image as the edit target. Preserve its design: deep navy blue textured cloth/leather, realistic fine grain, gold foil serif Cyrillic title exactly on two centered lines: first line “СТУДЕНЧЕСКИЙ”, second line “БИЛЕТ”. The title should sit in the upper-middle as on the original cover. Produce a perfectly straight-on, orthographic landscape rectangle, aspect ratio about 1.46:1, tightly filled edge-to-edge with the cover material. Remove the white surroundings, perspective, drop shadow, book thickness and spine from the photo; this must be a flat front-face texture, not a product mockup. A subtle narrow seam close to the left edge is okay. Do not add any logos, badges, names, dates, personal data, icons, extra text or watermark. Keep the material deep navy and title metallic muted gold. Opaque background, no white border.

## Границы проверки

Сцена адаптирует характер движения референсов, с новым объектом и фотографиями; точное совпадение исходного меша/тайминга не заявляется. Нормальное движение проверено в Chromium Docker с программным WebGL. Физические телефоны, Safari/iOS на устройстве, аппаратные GPU и ручной скринридер не проверены. Vite предупреждает о ленивом 3D-чанке около 557,5 kB (142 kB gzip); на мобильном он не загружается. Backend не менялся, прежние 36 серверных тестов в этой итерации не запускались. Публичная часть T07 по-прежнему отложена владельцем.
