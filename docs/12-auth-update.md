# Обновление входа по 2-front-sign-in

15 ноября 2026, Москва. Выполнено по локальной инструкции `docs/2-front-sign-in`, приложенному изображению и трём видео. Спецификация состояний записана **до реализации** в [11-auth-interaction-spec.md](11-auth-interaction-spec.md).

## Что сделано

Десктопная оболочка делится на **65% сцены / 35% формы**. В сцене слева — настоящий WebGL-бюст из строк **University North Campus**, справа — вертикальная карусель фотографий с перспективой, наклоном и изменением масштаба. Общая палитра сохранена: navy, синий, холодные нейтральные поверхности. В форме — логин, пароль с переключением видимости, рабочий вход, загрузка и сообщение ошибки. Авторизация по-прежнему использует существующие API и серверную сессию.

При ширине меньше 1000 px монтируется только форма: не запрашиваются фото кампуса и отдельный 3D-chunk. Световые эффекты тоже скрыты. На десктопе пользователь может остановить сцену, выбрать фото кнопками/стрелками, продолжить движение. Наведение/фокус карусели приостанавливает сцену. Скрытая вкладка или сцена не продолжает рендериться. `prefers-reduced-motion` даёт статичную композицию; при недоступном WebGL остаётся текстовый fallback, а вход работает.

`Login` управляет запросом входа; `AuthPanel` — переиспользуемая управляемая форма, принимающая `AuthPanelState` и callbacks. Она используется как при первом входе, так и в диалоге истёкшей сессии. Focus trap, inert-фон и сохранение черновика проверены повторно.

## Компоненты и токены

| Файл | Назначение |
|---|---|
| `frontend/src/auth.tsx` | Контроллер входа, управляемая панель, сцена и карусель |
| `frontend/src/type-face.tsx` | Процедурная поверхность бюста, текстура из живого текста, WebGL, освобождение ресурсов и fallback |
| `frontend/src/auth-motion.ts` | Общие периоды и фазы 3D-анимации |
| `frontend/src/auth.css` | Оболочка, адаптивность, свет и состояния формы; стили с префиксом auth |
| `frontend/src/tokens.css` | Общие существующие и новые auth/motion-токены |
| `frontend/src/assets/*.webp` | Три кампусных изображения и прозрачный световой луч |
| `e2e/tests/auth.spec.ts` | Девять новых браузерных проверок входа |

Переиспользованы `signIn`, `User`, `ErrorBox`, стили `primary`, `--font-sans`, `--navy`, `--blue`, `--bg`, `--surface`, `--on-navy`, `--muted`, spacing/radius и семантические токены ошибки. Добавлены группы `--auth-*` для рамки, поверхностей, заголовков, света и тени, `--font-serif`, `--motion-press/field/ui/spinner`, `--ease-out`, `--ease-in-out`. Значения находятся в одной палитре; рабочие кабинеты не перекрашивались.

Точечные новые зависимости: Three.js 0.187.0 для настоящего 3D и Phosphor React 2.1.10 для единых иконок. Библиотека DOM-анимации не добавлялась. React Router обновлён 7.6.2 → 7.18.5 и Vite 6.3.5 → 6.4.6 после реальных предупреждений npm audit; финальная проверка сообщает **0 vulnerabilities**. Основные версии сохранены.

## Движение

| Эффект | Значение |
|---|---|
| Однократное появление оболочки | 500 мс; transform/opacity; `cubic-bezier(0.23, 1, 0.32, 1)` |
| Свет на активном поле | 500 мс; transform/opacity, ошибка меняет фильтр цвета |
| Нажатие кнопки | 160 мс, scale 0,985; hover только для fine pointer |
| Индикатор входа | 800 мс linear, на реальное время запроса |
| Бюст | Цикл 9,6 с; проявление строк 0–2 с, исчезновение с 7 с; линейное вращение |
| Карусель | 14,4 с linear; три равномерно сдвинутые карточки |

Из видео измерены период Type Face и примерная длительность появления света. Исходный CSS не получен: выбранная easing-кривая — воспроизведение характера перехода, а не извлечённое значение автора. Длительность 14,4 с — наш цикл, близкий к наблюдаемому движению в ролике; точная длина оригинального бесконечного цикла неизвестна.

## Изображения

Все четыре изображения созданы встроенным **Image Gen**, затем закодированы в WebP с сохранением прозрачности света. Фото — вымышленные пространства, а не фотографии реального университета. Их можно заменить файлами/импортами в `auth.tsx`. Исходные PNG сохранены локально в `artifacts/auth-image-sources`, в Git входят оптимизированные WebP.

| Файл | Финальный промпт |
|---|---|
| `campus-exterior.webp` | Photorealistic editorial architectural photograph of a fictional contemporary northern European university, pale ivory limestone, precise colonnade and glass facade, stone courtyard and birch trees; cool blue-hour daylight, navy/slate/ivory palette, Scandinavian mood, landscape 3:2 with centered architecture for portrait crop. No faces, logos, text, signage or watermarks. |
| `campus-library.webp` | Photorealistic fictional University North Campus library: pale limestone arches, double-height light oak bookshelves, large reading-room windows, deep navy chairs and pale oak desks; cool northern daylight, navy/slate/ivory, landscape 3:2 centered for portrait crop. No people, logos, readable text, watermarks or orange cast. |
| `campus-atrium.webp` | Photorealistic fictional contemporary university atrium: sculptural limestone stairs, glass roof, curved gallery balconies, brushed steel, neutral stone floor, navy benches; soft northern skylight and cool navy/slate/ivory palette, landscape 3:2 centered architecture. No people, logos, lettering, watermarks or bright colors. |
| `auth-light.webp` | One realistic soft volumetric cool-blue spotlight beam, narrow source at top center, gently widening atmospheric shaft, feathered edges and pale silver-blue scattering, fading into true transparency. Tall 1:2 overlay for an ivory form. No solid triangle, hardware, objects, floor, circles, frames, text, logos or symbols. |

## Фактические проверки

| Прогон | Результат |
|---|---|
| TypeScript/Vite внутри Docker | Сборка успешна |
| `npm.cmd --prefix frontend test` | **4 passed** |
| `auth.spec.ts` | **9 passed**: 360/390/768/1000/1440, 65/35, axe, keyboard, loading/error, реальные WebGL-кадры, pause/resume/выбор, fallback, 200% текста |
| `states.spec.ts` | **4 passed**: три аккаунта, reload/logout, сеть, повторная отправка, повторный вход и черновик |
| `workflow.spec.ts` | **2 passed**: справка с уточнением/PDF/чужими отказами и расписание с адресным объявлением |
| `compatibility.spec.ts` | **2 passed**: WebKit 360 и Firefox 1440 |
| Основной Docker `check_demo.py` | **54 проверки, PASS, 0 предупреждений**; пользовательские записи не менялись |
| PDF из браузерного сценария, `verify_pdf.py` | PASS: кириллица, владелец, демонстрационная отметка, одна страница |

Итого **17 финальных браузерных проверок**, без unexpected/flaky/skipped. Скриншоты просмотрены; визуальные сравнения исходных кадров и реализации составлены на одних досках. [design-qa.md](../design-qa.md) фиксирует сравнение и исправления. Первоначально фото не загружались из `public/images`, поскольку API раздаёт `/assets`: исправлено импортом WebP через Vite. Жёсткие границы первоначального светового эффекта заменены прозрачным растровым лучом. После сравнения дополнительно уточнены профиль головы и основание шеи. В WebKit добавлено ожидание завершения первой загрузки перед жёстким переходом теста; ожидаемый 401 гостевого `/me` отдельно отличён от ошибок UI, ресурсов и WebGL.

Полный локальный JSON: `artifacts/auth-sign-in/results.json`; снимки — `artifacts/browser/after/auth-*.png`, доски сравнения — `artifacts/auth-sign-in/comparison-*.png`. В Git сохранены репрезентативные [1440 px](screenshots/auth-1440.png), [360 px](screenshots/auth-360.png) и [состояние ошибки](screenshots/auth-error-1440.png). Trace/storageState не сохраняются; пароли берутся из окружения и скрыты на изображениях.

## Отличия и границы

Это адаптация к заданию 65/35 и нашей палитре, а не копия чёрной страницы регистрации с зелёной иллюстрацией. Google/Apple, регистрация и имя/email не добавлены: здесь существует вход по логину и паролю. Свет мягче и холоднее, чтобы поддерживать светлую форму и читаемые подписи. Форма не затеняет остальные поля так сильно, как видео.

Оригинальный 3D-меш недоступен. Используется **собственная упрощённая процедурная голова с шеей**, поэтому скульптура, черты и точная траектория строк отличаются от Type Face. Цветные исходные изображения Carousel заменены собственным кампусом, период и траектория воспроизведены по наблюдению. Эти отличия явно отделены от измеренных таймингов.

На физическом телефоне, ручным скринридером и на реальной видеокарте производительность не измерялась: GPU в Docker — software renderer. Отдельный desktop-only 3D-chunk около 526 КБ / 132 КБ gzip вызывает предупреждение Vite о размере; он не загружается на телефоне. Public HTTPS и внешняя приёмка по-прежнему отложены владельцем. Основное приложение остаётся на http://localhost:8000, QA после прогона останавливается без удаления тома.
