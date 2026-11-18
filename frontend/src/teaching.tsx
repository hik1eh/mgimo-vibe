import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type User } from "./api";
import { campusDay, campusTime, dayLabel } from "./study-dates";
import type { Lesson } from "./study-types";
import { ErrorBox, useResource } from "./ui";

type TeachingLesson = Lesson & { semester: number | null };
type JournalEntry = {
  student_id: number;
  full_name: string;
  attendance: "present" | "absent" | null;
  checkpoint: "completed" | "pending" | null;
  version: number;
};

function lessonTime(lesson: Lesson) {
  return `${dayLabel(campusDay(lesson.starts_at), true)} · ${campusTime(lesson.starts_at)}`;
}

export function TeachingPage({ user }: { user: User }) {
  const { data, error, reload } = useResource<TeachingLesson[]>("/teaching/lessons");
  return (
    <section aria-labelledby="teaching-schedule-title">
      <div className="section-heading directory-heading">
        <div>
          <h2 id="teaching-schedule-title">Мои занятия</h2>
          <p className="muted">{user.full_name} · посещаемость и контрольные точки</p>
        </div>
      </div>
      <ErrorBox error={error} />
      {error && <button className="secondary" onClick={reload}>Повторить</button>}
      {!data && !error && <p role="status">Загружаем занятия…</p>}
      {data?.length === 0 && <p className="panel">Вам пока не назначены занятия.</p>}
      {data && data.length > 0 && (
        <ul className="faculty-directory teaching-directory">
          {data.map((lesson) => (
            <li className="panel" key={lesson.id}>
              <small className="muted">{lesson.group} · {lesson.kind}</small>
              <h3>{lesson.subject}</h3>
              <p>{lessonTime(lesson)}</p>
              <p className="muted">{lesson.status === "cancelled"
                ? "Занятие отменено"
                : `${lesson.building} · ауд. ${lesson.room}`}</p>
              <Link className="secondary" to={`/teaching/lessons/${lesson.id}`}>
                Открыть журнал<span className="sr-only"> · {lesson.subject}, {lessonTime(lesson)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function JournalForm({ lessonId, entry }: { lessonId: number; entry: JournalEntry }) {
  const [saved, setSaved] = useState(entry);
  const [draft, setDraft] = useState(entry);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setSaved(entry);
    setDraft(entry);
    setError("");
    setMessage("");
  }, [entry]);
  const changed = draft.attendance !== saved.attendance || draft.checkpoint !== saved.checkpoint;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !changed) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await api<JournalEntry>(`/teaching/lessons/${lessonId}/journal/${entry.student_id}`, "PUT", {
        attendance: draft.attendance,
        checkpoint: draft.checkpoint,
        version: saved.version,
      });
      setSaved(updated);
      setDraft(updated);
      setMessage("Отметки сохранены.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel journal-entry" onSubmit={save}>
      <fieldset disabled={busy}>
        <legend>{entry.full_name}</legend>
        <div className="journal-fields">
          <label>
            Посещаемость
            <select
              value={draft.attendance ?? ""}
              onChange={(event) => {
                setDraft({ ...draft, attendance: (event.target.value || null) as JournalEntry["attendance"] });
                setMessage("");
              }}
            >
              <option value="">Нет отметки</option>
              <option value="present">Присутствовал</option>
              <option value="absent">Отсутствовал</option>
            </select>
          </label>
          <label>
            Контрольная точка
            <select
              value={draft.checkpoint ?? ""}
              onChange={(event) => {
                setDraft({ ...draft, checkpoint: (event.target.value || null) as JournalEntry["checkpoint"] });
                setMessage("");
              }}
            >
              <option value="">Нет отметки</option>
              <option value="completed">Выполнена</option>
              <option value="pending">Не выполнена</option>
            </select>
          </label>
          <button className="primary" disabled={!changed}>
            {busy ? "Сохраняем…" : "Сохранить отметки"}
          </button>
        </div>
      </fieldset>
      <ErrorBox error={error} />
      {message && <p className="success" role="status">{message}</p>}
    </form>
  );
}

export function TeachingJournal() {
  const { id } = useParams();
  const { data, error, reload } = useResource<{ lesson: TeachingLesson; roster: JournalEntry[] }>(
    `/teaching/lessons/${id}`,
  );
  const lesson = data?.lesson;
  return (
    <article>
      <Link className="back" to="/teaching">← К моим занятиям</Link>
      <div className="page-title">
        <h1>{lesson?.subject ?? "Журнал занятия"}</h1>
        {lesson && <p>{lesson.group} · {lessonTime(lesson)} · {lesson.kind}</p>}
      </div>
      <ErrorBox error={error} />
      {error && <button className="secondary" onClick={reload}>Повторить</button>}
      {!data && !error && <p role="status">Загружаем журнал…</p>}
      {data && (
        <section className="journal" aria-labelledby="journal-title">
          <div className="section-heading">
            <h2 id="journal-title">Журнал занятия</h2>
            <button className="text-button" onClick={reload}>Обновить журнал</button>
          </div>
          {data.lesson.status === "cancelled" || data.lesson.semester === null
            ? <p className="panel">{data.lesson.status === "cancelled"
                ? "Занятие отменено. Журнал закрыт."
                : "Для занятия пока не указан семестр."}</p>
            : data.roster.map((entry) => <JournalForm key={entry.student_id} entry={entry} lessonId={data.lesson.id} />)}
          {data.roster.length === 0 && <p className="muted">В группе нет активных студентов.</p>}
        </section>
      )}
    </article>
  );
}
