import { Link, useParams, useSearchParams } from "react-router-dom";
import { type User } from "./api";
import { ErrorBox, useResource } from "./ui";
import {
  type StudyContext,
  type Lesson,
  type LessonSnapshot,
  type AcademicPayload,
  type AcademicResult,
} from "./study-types";
import {
  addDays,
  monday,
  validDay,
  campusDay,
  campusTime,
  dayLabel,
  weekdayLabel,
} from "./study-dates";
import "./study.css";

function ResourceError({
  error,
  reload,
}: {
  error: string;
  reload: () => void;
}) {
  return error ? (
    <>
      <ErrorBox error={error} />
      <button className="secondary" onClick={reload}>
        Повторить загрузку
      </button>
    </>
  ) : null;
}
function DemoDates({ day }: { day: string }) {
  return (
    <p className="study-caption">
      Учебные даты демонстрационные. «Сегодня» в сценарии — {dayLabel(day)}.
      Время московское.
    </p>
  );
}
function LessonBadge({ status }: { status: Lesson["status"] }) {
  return (
    <span className={`badge lesson-${status}`}>
      {
        { scheduled: "По расписанию", moved: "Перенос", cancelled: "Отменено" }[
          status
        ]
      }
    </span>
  );
}
function Snapshot({
  snapshot,
  title,
}: {
  snapshot: LessonSnapshot;
  title: string;
}) {
  return (
    <div className="lesson-snapshot">
      <strong>{title}</strong>
      <p>
        {dayLabel(campusDay(snapshot.starts_at), true)} ·{" "}
        {campusTime(snapshot.starts_at)}–{campusTime(snapshot.ends_at)}
        <br />
        {snapshot.building} · аудитория {snapshot.room}
        <br />
        {snapshot.status === "cancelled" ? "Отменено" : "Занятие запланировано"}
      </p>
    </div>
  );
}
function Changes({ lesson }: { lesson: Lesson }) {
  const change = lesson.changes.at(-1);
  if (!change || lesson.status === "cancelled") return null;
  const old = change.before,
    next = change.after;
  return (
    <div className="lesson-change">
      {old.room !== next.room && (
        <p>
          Аудитория: <s>{old.room}</s> → <strong>{next.room}</strong>
        </p>
      )}
      {old.building !== next.building && (
        <p>
          Корпус: <s>{old.building}</s> → <strong>{next.building}</strong>
        </p>
      )}
      {(new Date(old.starts_at).getTime() !==
        new Date(next.starts_at).getTime() ||
        new Date(old.ends_at).getTime() !==
          new Date(next.ends_at).getTime()) && (
        <p>
          Было: {dayLabel(campusDay(old.starts_at), true)},{" "}
          {campusTime(old.starts_at)}–{campusTime(old.ends_at)}
          <br />
          Стало: {dayLabel(campusDay(next.starts_at), true)},{" "}
          {campusTime(next.starts_at)}–{campusTime(next.ends_at)}
        </p>
      )}
    </div>
  );
}
export function LessonCard({
  lesson,
  query,
}: {
  lesson: Lesson;
  query: string;
}) {
  return (
    <article
      className={`lesson-card ${lesson.status === "cancelled" ? "cancelled-card" : ""}`}
    >
      <div className="lesson-card-top">
        <span className="lesson-time">
          {campusTime(lesson.starts_at)}
          <small>— {campusTime(lesson.ends_at)}</small>
        </span>
        <LessonBadge status={lesson.status} />
      </div>
      <span className="eyebrow">{lesson.kind}</span>
      <h3>
        <Link to={`/schedule/${lesson.id}?${query}`}>{lesson.subject}</Link>
      </h3>
      <p className="lesson-teacher">{lesson.teacher}</p>
      {lesson.status === "cancelled" ? (
        <p className="cancellation-note">Приходить на занятие не нужно.</p>
      ) : (
        <p className="lesson-location">
          {lesson.building}
          <br />
          Аудитория <strong>{lesson.room}</strong>
        </p>
      )}
      <Changes lesson={lesson} />
      <Link
        className="lesson-detail-link"
        to={`/schedule/${lesson.id}?${query}`}
      >
        Карточка занятия <span aria-hidden>↗</span>
      </Link>
    </article>
  );
}

export function SchedulePage({ user }: { user: User }) {
  const context = useResource<StudyContext>("/study-context");
  return (
    <>
      <div className="section-intro">
        <span className="eyebrow">УЧЕБНАЯ НЕДЕЛЯ</span>
        <p>
          {user.group} · {user.faculty}
        </p>
      </div>
      <ResourceError error={context.error} reload={context.reload} />
      {!context.data && !context.error && (
        <p role="status">Загружаем учебный календарь…</p>
      )}
      {context.data && <ScheduleContent context={context.data} />}
    </>
  );
}
function ScheduleContent({ context }: { context: StudyContext }) {
  const [params, setParams] = useSearchParams();
  const rawDate = params.get("date");
  const selected = validDay(rawDate) ? rawDate : context.today;
  const view = params.get("view") === "week" ? "week" : "day";
  const start = view === "week" ? monday(selected) : selected;
  const end = view === "week" ? addDays(start, 6) : start;
  const { data, error, reload } = useResource<Lesson[]>(
    `/schedule?start=${start}&end=${end}`,
    true,
  );
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(monday(selected), i),
  );
  const choose = (day: string, mode = view) =>
    setParams({ view: mode, date: day });
  const lessonsFor = (day: string) =>
    (data || []).filter((lesson) => campusDay(lesson.starts_at) === day);
  return (
    <>
      <DemoDates day={context.today} />
      <section
        className="schedule-controls panel"
        aria-label="Настройка расписания"
      >
        <div className="segmented">
          <button
            aria-pressed={view === "day"}
            className={view === "day" ? "selected" : ""}
            onClick={() => choose(context.today, "day")}
          >
            {selected === context.today ? "Сегодня" : "День"}
          </button>
          <button
            aria-pressed={view === "week"}
            className={view === "week" ? "selected" : ""}
            onClick={() => choose(selected, "week")}
          >
            Неделя
          </button>
        </div>
        <div className="date-navigation">
          <button
            className="secondary square"
            aria-label={
              view === "week" ? "Предыдущая неделя" : "Предыдущий день"
            }
            onClick={() => choose(addDays(selected, view === "week" ? -7 : -1))}
          >
            ←
          </button>
          <label>
            Дата
            <input
              aria-label="Дата расписания"
              type="date"
              value={selected}
              onChange={(e) => {
                if (validDay(e.target.value)) choose(e.target.value);
              }}
            />
          </label>
          <button
            className="secondary square"
            aria-label={view === "week" ? "Следующая неделя" : "Следующий день"}
            onClick={() => choose(addDays(selected, view === "week" ? 7 : 1))}
          >
            →
          </button>
        </div>
        <button
          className="text-button"
          onClick={() => choose(context.demo_day, "day")}
        >
          Демонстрационный день
        </button>
      </section>
      <div className="section-heading schedule-heading">
        <h2>
          {view === "week"
            ? `${dayLabel(start, true)} — ${dayLabel(end, true)}`
            : `${selected === context.today ? "Сегодня · " : ""}${dayLabel(selected)}`}
        </h2>
        <button className="text-button" onClick={reload}>
          Обновить
        </button>
      </div>
      <ResourceError error={error} reload={reload} />
      {!data && !error && <p role="status">Загружаем занятия…</p>}
      {data && (
        <>
          {view === "week" && (
            <>
              <div className="week-grid">
                {days.map((day) => (
                  <section
                    className={`week-day ${day === context.today ? "is-today" : ""}`}
                    key={day}
                    aria-label={dayLabel(day)}
                  >
                    <h3>
                      {weekdayLabel(day)}
                      <span>{dayLabel(day, true)}</span>
                    </h3>
                    {lessonsFor(day).length ? (
                      lessonsFor(day).map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          query={params.toString()}
                        />
                      ))
                    ) : (
                      <p className="week-empty">Занятий нет</p>
                    )}
                  </section>
                ))}
              </div>
              <div
                className="mobile-day-tabs"
                role="group"
                aria-label="Дни недели"
              >
                {days.map((day) => (
                  <button
                    key={day}
                    aria-pressed={day === selected}
                    className={day === selected ? "selected" : ""}
                    onClick={() => choose(day)}
                  >
                    <span>{weekdayLabel(day)}</span>
                    <strong>{day.slice(-2)}</strong>
                  </button>
                ))}
              </div>
            </>
          )}
          <div
            className={
              view === "week"
                ? "daily-lessons mobile-week-lessons"
                : "daily-lessons"
            }
          >
            {lessonsFor(selected).length ? (
              lessonsFor(selected).map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  query={params.toString()}
                />
              ))
            ) : (
              <div className="panel empty empty-day">
                <span aria-hidden>☀</span>
                <h3>В этот день занятий нет</h3>
                <p>
                  {dayLabel(selected)} свободен от занятий в расписании вашей
                  группы. Выберите другой день или откройте неделю.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function LessonPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const {
    data: lesson,
    error,
    reload,
  } = useResource<Lesson>(`/schedule/${id}`, true);
  return (
    <>
      <Link className="back" to={`/schedule?${params}`}>
        ← К расписанию
      </Link>
      <ResourceError error={error} reload={reload} />
      {!lesson && !error && <p role="status">Загружаем занятие…</p>}
      {lesson && (
        <>
          <div className="page-title title-row">
            <div>
              <span className="eyebrow">
                {lesson.kind} · {lesson.group}
              </span>
              <h1>{lesson.subject}</h1>
              <p>{dayLabel(campusDay(lesson.starts_at))} · Время московское</p>
            </div>
            <LessonBadge status={lesson.status} />
          </div>
          <div className="two-columns">
            <section className="panel">
              <h2>
                {lesson.status === "cancelled"
                  ? "Занятие отменено"
                  : "Актуальные сведения"}
              </h2>
              {lesson.status === "cancelled" && (
                <p className="cancellation-note">
                  Приходить на занятие не нужно. Исходные сведения сохранены для
                  истории.
                </p>
              )}
              <dl>
                <dt>Время</dt>
                <dd>
                  {campusTime(lesson.starts_at)}–{campusTime(lesson.ends_at)}
                </dd>
                <dt>Преподаватель</dt>
                <dd>{lesson.teacher}</dd>
                <dt>Корпус</dt>
                <dd>{lesson.building}</dd>
                <dt>Аудитория</dt>
                <dd>
                  <strong className="room-number">{lesson.room}</strong>
                </dd>
              </dl>
              <Changes lesson={lesson} />
            </section>
            <section className="panel lesson-history">
              <h2>История изменений</h2>
              {!lesson.changes.length && (
                <p className="muted">
                  Изменений не было. Занятие идёт по расписанию.
                </p>
              )}
              {lesson.changes.map((change) => (
                <article key={change.id}>
                  <small>
                    {dayLabel(campusDay(change.created_at), true)} ·{" "}
                    {campusTime(change.created_at)} · Деканат
                  </small>
                  <h3>{change.reason}</h3>
                  <div className="snapshot-grid">
                    <Snapshot snapshot={change.before} title="Было" />
                    <Snapshot snapshot={change.after} title="Стало" />
                  </div>
                </article>
              ))}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function AcademicBadge({ result }: { result: AcademicResult }) {
  return (
    <span
      className={`badge academic-${result.status} ${result.status === "published" && !result.passed ? "academic-failed" : ""}`}
    >
      {result.label}
    </span>
  );
}
export function ResultsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("semester");
  const selected = raw && /^(?:[1-9]|1[0-2])$/.test(raw) ? Number(raw) : null;
  const { data, error, reload } = useResource<AcademicPayload>(
    `/academic-results${selected ? `?semester=${selected}` : ""}`,
    true,
  );
  return (
    <>
      <div className="section-intro">
        <span className="eyebrow">УЧЁБА И СЕССИЯ</span>
        <p>Ваши результаты, даты контроля и ближайший зачёт.</p>
      </div>
      <ResourceError error={error} reload={reload} />
      {!data && !error && <p role="status">Загружаем результаты…</p>}
      {data && (
        <>
          <DemoDates day={data.as_of} />
          <div className="results-toolbar">
            <label>
              Семестр
              <select
                aria-label="Семестр"
                value={data.semester ?? ""}
                disabled={!data.semesters.length}
                onChange={(e) => setParams({ semester: e.target.value })}
              >
                {!data.semesters.length && (
                  <option value="">Нет семестров</option>
                )}
                {data.semester && !data.semesters.includes(data.semester) && (
                  <option value={data.semester}>{data.semester} семестр</option>
                )}
                {data.semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester} семестр
                  </option>
                ))}
              </select>
            </label>
            <button className="text-button" onClick={reload}>
              Обновить
            </button>
          </div>
          <div className="academic-summary">
            <section className="panel progress-panel">
              <span className="eyebrow">ПРОГРЕСС СЕМЕСТРА</span>
              <h2>
                Закрыто <strong>{data.summary.closed}</strong> из{" "}
                {data.summary.total}
              </h2>
              <progress
                max={data.summary.total || 1}
                value={data.summary.closed}
                aria-label={`Закрыто ${data.summary.closed} из ${data.summary.total}`}
              />
              <p>Учитываются полученные зачёты и экзамены с оценкой от 3.</p>
            </section>
            <section className="panel next-credit">
              <span className="eyebrow">БЛИЖАЙШИЙ ЗАЧЁТ</span>
              {data.summary.next_credit ? (
                <>
                  <h2>{data.summary.next_credit.subject}</h2>
                  <p>
                    {dayLabel(campusDay(data.summary.next_credit.control_at))} ·{" "}
                    {campusTime(data.summary.next_credit.control_at)}
                  </p>
                  <span className="badge academic-upcoming">
                    Предстоит зачёт
                  </span>
                </>
              ) : (
                <>
                  <h2>Предстоящих зачётов нет</h2>
                  <p>В выбранном семестре нет зачёта с будущей датой.</p>
                </>
              )}
            </section>
            <section className="panel awaiting-panel">
              <span className="eyebrow">ЖДЁМ ПУБЛИКАЦИИ</span>
              <h2>
                Ожидается результат{" "}
                <span className="count">{data.summary.awaiting}</span>
              </h2>
              {data.results
                .filter((result) => result.status === "awaiting")
                .map((result) => (
                  <p key={result.id}>{result.subject}</p>
                ))}
              {!data.summary.awaiting && (
                <p>Нет результатов, ожидающих публикации.</p>
              )}
            </section>
          </div>
          <section className="panel results-panel">
            <h2>Результаты по дисциплинам</h2>
            {data.session_period && (
              <p className="study-caption session-period">
                Контрольные даты сессии:{" "}
                {dayLabel(data.session_period.start, true)} —{" "}
                {dayLabel(data.session_period.end)}.
              </p>
            )}
            {!data.results.length ? (
              <div className="empty">
                <h3>Результатов за этот семестр нет</h3>
                <p>
                  Выберите другой семестр. Пустая запись не считается полученным
                  зачётом.
                </p>
              </div>
            ) : (
              <>
                <table className="results-table">
                  <caption className="sr-only">
                    Результаты за {data.semester} семестр
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Дисциплина</th>
                      <th scope="col">Контроль</th>
                      <th scope="col">Дата</th>
                      <th scope="col">Результат</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((result) => (
                      <tr key={result.id}>
                        <th scope="row">{result.subject}</th>
                        <td>
                          {result.kind === "credit" ? "Зачёт" : "Экзамен"}
                        </td>
                        <td>
                          {dayLabel(campusDay(result.control_at), true)}
                          <small className="block">
                            {campusTime(result.control_at)}
                          </small>
                        </td>
                        <td>
                          <AcademicBadge result={result} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="result-cards">
                  {data.results.map((result) => (
                    <article key={result.id}>
                      <span className="eyebrow">
                        {result.kind === "credit" ? "Зачёт" : "Экзамен"}
                      </span>
                      <h3>{result.subject}</h3>
                      <p>
                        {dayLabel(campusDay(result.control_at), true)} ·{" "}
                        {campusTime(result.control_at)}
                      </p>
                      <AcademicBadge result={result} />
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
