import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type { User } from "./api";
import type { Lesson, StudyContext } from "./study-types";
import { ErrorBox, useResource } from "./ui";
import {
  addDays,
  campusDay,
  campusTime,
  dayLabel,
  monday,
  weekdayLabel,
} from "./study-dates";
import {
  filterLessons,
  identityParts,
  lessonPath,
  readScheduleState,
  roomKey,
  scheduleParams,
  scheduleRequest,
  teacherKey,
  type ScheduleState,
} from "./schedule-model";

export function StudentSchedule({ user }: { user: User }) {
  const context = useResource<StudyContext>("/study-context");
  return (
    <>
      <ErrorBox error={context.error} />
      {context.error && (
        <button className="secondary" onClick={context.reload}>
          Повторить
        </button>
      )}
      {!context.data && !context.error && (
        <p role="status">Загружаем учебный календарь…</p>
      )}
      {context.data && <CalendarContent context={context.data} user={user} />}
    </>
  );
}

function periodLabel(state: ScheduleState) {
  if (state.view === "day")
    return new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Moscow",
    }).format(new Date(`${state.date}T12:00:00Z`));
  const start = monday(state.date),
    end = addDays(start, 6);
  return `${dayLabel(start, true)} — ${dayLabel(end, true)}`;
}

function LessonRow({
  lesson,
  query,
  multiple,
}: {
  lesson: Lesson;
  query: string;
  multiple: boolean;
}) {
  const old = lesson.changes.at(-1)?.before.room;
  return (
    <Link
      to={lessonPath(lesson.id, query)}
      className="schedule-row"
      data-status={lesson.status}
    >
      <span className="agenda-time">
        <strong>{campusTime(lesson.starts_at)}</strong>
        <span>– {campusTime(lesson.ends_at)}</span>
      </span>
      <span className="agenda-subject">
        <span className="agenda-kind">
          {lesson.kind}
          {multiple ? ` · ${lesson.group}` : ""}
        </span>
        <strong>{lesson.subject}</strong>
        <span>{lesson.teacher}</span>
      </span>
      <span className="agenda-place">
        <strong>{lesson.room}</strong>
        <span>{lesson.building}</span>
        {lesson.status !== "scheduled" && (
          <span className={`schedule-status ${lesson.status}`}>
            {lesson.status === "cancelled"
              ? "Отменено"
              : old && old !== lesson.room
                ? `Перенос · ${old} → ${lesson.room}`
                : "Перенос"}
          </span>
        )}
      </span>
      <ArrowRight className="agenda-arrow" aria-hidden="true" />
    </Link>
  );
}

function WeekCalendar({
  days,
  rows,
  allRows,
  today,
  query,
  onDay,
  multiple,
}: {
  days: string[];
  rows: Lesson[];
  allRows: Lesson[];
  today: string;
  query: string;
  onDay: (day: string) => void;
  multiple: boolean;
}) {
  const slots = [
    ...new Set(allRows.map((row) => campusTime(row.starts_at))),
  ].sort();
  return (
    <div className="week-calendar">
      <table>
        <caption className="sr-only">
          Расписание недели {dayLabel(days[0], true)} —{" "}
          {dayLabel(days[6], true)}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="time-axis">
              Начало
            </th>
            {days.map((day, i) => (
              <th
                key={day}
                scope="col"
                className={`${i > 4 ? "weekend" : ""} ${day === today ? "calendar-today" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onDay(day)}
                  aria-current={day === today ? "date" : undefined}
                  aria-label={`Открыть день: ${dayLabel(day)}`}
                >
                  <span>{weekdayLabel(day)}</span>
                  <strong>{dayLabel(day, true)}</strong>
                  {day === today && <small>Сегодня</small>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot}>
              <th scope="row" className="time-axis">
                {slot}
              </th>
              {days.map((day, i) => (
                <td
                  key={day}
                  className={`${i > 4 ? "weekend" : ""} ${day === today ? "calendar-today" : ""}`}
                >
                  {rows
                    .filter(
                      (row) =>
                        campusDay(row.starts_at) === day &&
                        campusTime(row.starts_at) === slot,
                    )
                    .map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={lessonPath(lesson.id, query)}
                        className="calendar-lesson"
                        data-status={lesson.status}
                      >
                        <span className="calendar-subject">
                          {lesson.subject}
                        </span>
                        <strong className="calendar-room">{lesson.room}</strong>
                        <span>{multiple ? lesson.group : lesson.kind}</span>
                        <small>
                          {campusTime(lesson.starts_at)}–
                          {campusTime(lesson.ends_at)}
                        </small>
                        {lesson.status !== "scheduled" && (
                          <span className="schedule-status">
                            {lesson.status === "cancelled"
                              ? "Отменено"
                              : "Перенос"}
                          </span>
                        )}
                      </Link>
                    ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarContent({
  context,
  user,
}: {
  context: StudyContext;
  user: User;
}) {
  const [params, setParams] = useSearchParams();
  const state = readScheduleState(params, context.today);
  const resource = useResource<Lesson[]>(scheduleRequest(state), true);
  const rows = resource.data || [];
  const groups = [
    ...new Map(rows.map((row) => [String(row.group_id), row.group])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "ru"));
  const own = groups.find(([id, label]) =>
    user.group_id != null ? id === String(user.group_id) : label === user.group,
  )?.[0];
  // An empty week is not an authorization directory: keep the selected ID.
  // The server already limits every returned lesson to the user's scope.
  const effective = state;
  const filtered = filterLessons(rows, effective, user.group, user.group_id);
  const query = scheduleParams(effective).toString();
  const teachers = [
    ...new Map(rows.map((row) => [teacherKey(row), row.teacher])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "ru"));
  const rooms = [
    ...new Map(
      rows.map((row) => [roomKey(row), `${row.room} · ${row.building}`]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "ru", { numeric: true }));
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(monday(state.date), i),
  );
  const multiple = new Set(filtered.map((row) => row.group_id)).size > 1;
  function update(patch: Partial<ScheduleState>) {
    setParams(scheduleParams({ ...effective, ...patch }));
  }
  function reset() {
    update({ group: "all", teacher: "all", room: "all" });
  }
  useEffect(() => {
    try {
      sessionStorage.setItem("dekanat.schedule.query", query);
    } catch {
      /* Storage is optional. */
    }
  }, [query]);
  const periodRows = rows.filter(
    (row) => state.view === "week" || campusDay(row.starts_at) === state.date,
  );
  return (
    <div className="student-calendar">
      <section className="calendar-controls" aria-label="Настройка расписания">
        <div className="calendar-toolbar">
          <h2>{periodLabel(state)}</h2>
          <div className="calendar-date-actions">
            <button
              className="secondary square"
              aria-label={
                state.view === "week" ? "Предыдущая неделя" : "Предыдущий день"
              }
              onClick={() =>
                update({
                  date: addDays(state.date, state.view === "week" ? -7 : -1),
                })
              }
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              className="secondary square"
              aria-label={
                state.view === "week" ? "Следующая неделя" : "Следующий день"
              }
              onClick={() =>
                update({
                  date: addDays(state.date, state.view === "week" ? 7 : 1),
                })
              }
            >
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              className="secondary"
              onClick={() => update({ date: context.today })}
            >
              Сегодня
            </button>
            <label className="calendar-date-picker">
              <CalendarBlank aria-hidden="true" />
              <span className="sr-only">Дата расписания</span>
              <input
                aria-label="Дата расписания"
                type="date"
                value={state.date}
                min="1900-01-01"
                max="9998-12-31"
                onChange={(event) => {
                  const next = readScheduleState(
                    new URLSearchParams({ date: event.target.value }),
                    context.today,
                  );
                  update({ date: next.date });
                }}
              />
            </label>
          </div>
          <div className="segmented" aria-label="Режим расписания">
            <button
              aria-pressed={state.view === "day"}
              className={state.view === "day" ? "selected" : ""}
              onClick={() => update({ view: "day" })}
            >
              День
            </button>
            <button
              aria-pressed={state.view === "week"}
              className={state.view === "week" ? "selected" : ""}
              onClick={() => update({ view: "week" })}
            >
              Неделя
            </button>
          </div>
        </div>
        <div className="calendar-filters">
          <label>
            Группа
            <select
              aria-label="Группа"
              value={
                effective.group === "mine" ? own || "mine" : effective.group
              }
              onChange={(event) => update({ group: event.target.value })}
            >
              <option value="all">Все группы</option>
              {!own && (
                <option value="mine">{user.group || "Моя группа"}</option>
              )}
              {!["all", "mine"].includes(state.group) &&
                !groups.some(([id]) => id === state.group) && (
                  <option value={state.group} disabled>
                    Группа №{state.group} · нет в периоде
                  </option>
                )}
              {groups.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Преподаватель
            <select
              aria-label="Преподаватель"
              value={state.teacher}
              onChange={(event) => update({ teacher: event.target.value })}
            >
              <option value="all">Все преподаватели</option>
              {state.teacher !== "all" &&
                !teachers.some(([key]) => key === state.teacher) && (
                  <option value={state.teacher}>
                    {identityParts(state.teacher, "teacher")?.[1] ||
                      "Преподаватель №" + state.teacher}{" "}
                    · нет в периоде
                  </option>
                )}
              {teachers.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Аудитория
            <select
              aria-label="Аудитория"
              value={state.room}
              onChange={(event) => update({ room: event.target.value })}
            >
              <option value="all">Все аудитории</option>
              {state.room !== "all" &&
                !rooms.some(([key]) => key === state.room) && (
                  <option value={state.room}>
                    {identityParts(state.room, "room")
                      ?.slice(1)
                      .reverse()
                      .join(" · ") || "Аудитория №" + state.room}{" "}
                    · нет в периоде
                  </option>
                )}
              {rooms.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="text-button calendar-reset" onClick={reset}>
            <ArrowCounterClockwise aria-hidden="true" />
            Сбросить
          </button>
        </div>
      </section>
      <div className="calendar-result-line">
        <span role="status" aria-live="polite">
          {resource.data
            ? `Найдено занятий: ${filtered.length}`
            : resource.error
              ? "Не удалось загрузить расписание"
              : "Загружаем занятия…"}
        </span>
        <button className="text-button" onClick={resource.reload}>
          Обновить
        </button>
      </div>
      <ErrorBox error={resource.error} />
      {resource.error && (
        <button className="secondary" onClick={resource.reload}>
          Повторить
        </button>
      )}
      {!resource.data && !resource.error && (
        <div className="calendar-loading" aria-hidden="true" />
      )}
      {resource.data &&
        (!filtered.length ? (
          <section className="calendar-empty">
            <h3>
              {periodRows.length
                ? "Нет совпадений"
                : state.view === "day"
                  ? "Нет занятий"
                  : "На этой неделе занятий нет"}
            </h3>
            <p>
              {periodRows.length
                ? "Измените ограничения, чтобы увидеть занятия этого периода."
                : "Выберите другую дату или посмотрите соседний период."}
            </p>
            {periodRows.length ? (
              <button className="secondary" onClick={reset}>
                Сбросить фильтры
              </button>
            ) : (
              <button
                className="secondary"
                onClick={() => update({ date: context.demo_day })}
              >
                К учебному дню
              </button>
            )}
          </section>
        ) : (
          <>
            {state.view === "week" && (
              <WeekCalendar
                days={days}
                rows={filtered}
                allRows={rows}
                today={context.today}
                query={query}
                multiple={multiple}
                onDay={(date) => update({ date, view: "day" })}
              />
            )}
            <div
              className={`schedule-agenda ${state.view === "week" ? "week-agenda" : "day-agenda"}`}
            >
              {(state.view === "week" ? days : [state.date]).map((day) => {
                const lessons = filtered.filter(
                  (row) => campusDay(row.starts_at) === day,
                );
                return (
                  <section
                    key={day}
                    className="agenda-day"
                    aria-label={dayLabel(day)}
                  >
                    {state.view === "week" && (
                      <h3>
                        {dayLabel(day)}
                        {day === context.today && <small>Сегодня</small>}
                      </h3>
                    )}
                    {lessons.length ? (
                      lessons.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          query={query}
                          multiple={multiple}
                        />
                      ))
                    ) : (
                      <p className="agenda-no-lessons">Нет занятий</p>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        ))}
      <p className="calendar-caption">
        Время московское
      </p>
    </div>
  );
}
