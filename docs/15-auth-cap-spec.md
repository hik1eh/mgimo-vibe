# Финальная сцена входа: шапочка и Allura

15 ноября 2026. Владелец уточнил: шапочка заменяет билет целиком. Убирается «Твой студенческий мир», обычный текст приводится к одному стилю, расстояние между фотографиями увеличивается. Прикреплены образец чёрной шапочки с золотыми деталями и макет фоновой надписи.

## Решение до реализации

- Обычный текст экрана — Manrope, без отдельного Golos Text. Тёмная панель, доступность, API и мобильная форма сохраняются.
- Вместо билета — кодовая 3D-шапочка: квадратная доска, тёмная тулья, золотая окантовка, шнур и кисточка. Сборка полосами снизу, вращение и исчезновение повторяют характер ранее изученного Type Face: цикл 9,6 с, появление 0–2 с, исчезновение после 7 с. Без ручной паузы; системное reduced motion показывает целый неподвижный объект.
- Для WebGL fallback используется отдельный прозрачный растровый вид шапочки по приложенному образцу, подготовленный встроенным Image Gen. Основной объект остаётся настоящей 3D-сценой.
- Фоновая надпись — три строки `University` / `North` / `Campus`, без точки. Локальный Allura Regular и OFL из официального Google Fonts, подключение через @font-face как у остальных шрифтов.
- Параметры фона: белый, opacity 0,2, font-size clamp(130px, 13vw, 190px), line-height 0,95, rotate(-9deg), transform-origin left center. Задний слой ниже фото/голограммы, ниже логотипа; начала слов остаются в левой части. aria-hidden, pointer-events none, user-select none. Отдельной анимации фона нет.
- Поток содержит четыре карточки вместо пяти, с дополнительным запасом расстояния в траектории. Сохраняются настоящие фотографии, непрерывность и отсутствие остановки на hover.

## Проверка

Проверить 360/390/768/1000/1440, три строки и параметры Allura, общую гарнитуру формы, видимые начала слов, слои, увеличенные промежутки в нескольких фазах, сборку/вращение шапочки, reduced motion и fallback. На мобильном не загружать сцену/Allura. Выполнить браузерные сценарии на изолированном Docker, обновить визуальную оценку и оставить основной сервер работающим.

## Реализация и фактические результаты

Код и проверки зафиксированы в `6a8904f`.

`graduation-cap.tsx` заменяет прежний `student-card.tsx`: кодовая геометрия доски, тульи, золотой окантовки, шнура и кисточки. Существующий Three.js и механизм сборки/вращения переиспользованы. После первого снимка увеличены высота тульи и наклон: первоначальный ракурс был слишком плоским. Фон — отдельный статичный слой z=0; фотографии z=1, голограмма z=2, логотип z=3. Появление оболочки теперь меняет только opacity, без сдвига.

Allura: `frontend/src/assets/fonts/Allura-Regular.ttf`, 246 632 байта. Источник: [официальный Google Fonts](https://github.com/google/fonts/tree/main/ofl/allura). Лицензия доставляется в сборке как `frontend/public/assets/font-licenses/Allura-OFL.txt`; HTTP 200 и побайтное совпадение проверены. Подключение через @font-face/font-display: swap. Обычный текст формы и заголовок используют Manrope; Golos Text не подключается на экране.

На 1440×900 измерено: Allura 187,2 px, line-height 177,84 px, opacity 0,2, белый цвет, rotate −9°, transform-origin 0 px по X и центр по Y. Все три начала слов находятся левее области фотографий. На восьми фазах нормального движения видимые промежутки между bounding boxes фотографий составили **46,94–133,85 px**; в каждой выборке есть целая фотография. Это выборки фаз, а не заявление о математическом минимуме на каждом кадре.

| Команда | Реальный результат |
|---|---|
| `docker compose -p dekanat-qa -f compose.qa.yaml up --build -d --wait db app` | TypeScript/Vite и образ собраны, QA healthy |
| `npm.cmd --prefix frontend test` | 4 passed |
| `docker compose -p dekanat-qa -f compose.qa.yaml run --rm --no-deps browser npx playwright test auth.spec.ts states.spec.ts workflow.spec.ts compatibility.spec.ts` | Финально 18 passed за 54,0 с; 0 skipped/unexpected/flaky |
| `.\.venv\Scripts\python.exe scripts/check_demo.py --base http://127.0.0.1:8000 --origin http://localhost:8000 --output artifacts/browser/auth-cap/local-readiness.json` | 54 passed, 0 warnings |
| `.\.venv\Scripts\python.exe scripts/verify_pdf.py artifacts/browser/certificate-ui.pdf` | PASS: кириллица, владелец, демонстрационная пометка, одна страница |

Проверены пять ширин, кириллица и загрузка Allura, единая гарнитура формы, aria-hidden/pointer-events/user-select фона, отсутствие его собственной анимации, появление оболочки без transform, сохранённые начала слов, восемь фаз интервалов, настоящий WebGL, движение на hover, reduced motion и загруженное fallback-изображение. На мобильном фото/3D/Allura не запрашиваются. Сохранились проверки трёх аккаунтов, повторного входа с черновиком, полного пути справки и отказов чужой заявке/документу. Axe на пяти ширинах не нашёл нарушений выбранных правил.

В одном промежуточном прогоне было 17 passed / 1 failed: WebKit сообщил pageerror при последовательных полных page.goto с прерыванием fetch расписания. Тест совместимости переведён на реальные ссылки интерфейса и кнопку «Неделя»; проверка reload карточки и строгий сбор pageerror сохранены. Последний полный прогон прошёл. Backend/API не менялись, прежние 36 серверных тестов повторно не запускались.

Результаты и анонимное видео без ввода учётных данных — `artifacts/browser/auth-cap/`; репрезентативные снимки — `docs/screenshots/auth-cap-*.png`. [Визуальная оценка](../design-qa.md). Основной Docker получает тот же образ, что QA, через локальный docker tag и `docker compose up --no-build -d --wait`; рабочая БД не сбрасывается. После проверки QA остановлен с сохранением тома, основной сервер оставлен работать.

## Fallback-изображение

Встроенный Image Gen, режим edit, две последние картинки: первая — целевой образец шапочки, вторая — только контекст макета. Прозрачность сохранена. Runtime: `frontend/src/assets/graduation-cap.webp`, lossless RGBA, 1254×1254, 380 158 байт. Исходный PNG — в игнорируемом `artifacts/auth-image-sources/graduation-cap.png`.

Точный prompt:

> Edit the FIRST of the user's latest two attached images: the isolated black academic mortarboard with gold trim and gold tassel on white. The SECOND attached image is a UI lettering layout and is only context: do not include any of its content. Create a clean production-ready cutout of the first image's single graduation cap. Preserve its square slightly rounded top board, black rounded crown, rich gold lower band and dangling gold tassel, the same three-quarter view, smooth 3D material/shading and proportions. Remove the white background completely. Keep all tassel edges. No ground shadow, no text, no logos, no additional objects or decorations. Genuine transparent background, not a white or checkerboard backdrop. Center the complete subject on a square canvas, filling approximately 85% while leaving clean safety space at every edge.

## Границы проверки

Новая модель адаптирует форму и характер появления/вращения; исходный меш фотографии не используется, точное совпадение материалов/ракурса не заявляется. Прикреплённый макет — ориентир композиции, его исходный CSS viewport не указан; конкретные параметры надписи проверены по числам владельца. Нормальное движение проверено в Chromium Docker с программным WebGL; Firefox/WebKit — основные сценарии. Физические телефоны, аппаратные GPU и ручной скринридер не проверены. Vite предупреждает о ленивом 3D-чанке около 560,2 kB / 142,7 kB gzip; на мобильном он не загружается. Публичный релиз остаётся отложенным.
