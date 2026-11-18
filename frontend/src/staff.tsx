import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api, type User } from "./api";
import type { Lesson } from "./study-types";
import { campusDay, campusTime, dayLabel } from "./study-dates";
import { ErrorBox, useResource } from "./ui";
import { submissionKey } from "./ids";
import { LinkedLesson } from "./campus";
import {
  type Announcement,
  type Group,
  type Prefill,
  publicationLabel,
} from "./campus-types";

function useDraft<T>(key: string, initial: T) {
  const [draft, setDraft] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) return { ...initial, ...JSON.parse(saved) };
    } catch {
      /* Start with the server values. */
    }
    return initial;
  });
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(draft));
  }, [key, draft]);
  return [draft, setDraft] as const;
}
const localTime = (value: string) => `${campusDay(value)}T${campusTime(value)}`;
const isoTime = (value: string) => new Date(`${value}:00+03:00`).toISOString();

export function StaffSchedulePage() {
  const [params, setParams] = useSearchParams();
  const groups = useResource<Group[]>("/staff/groups");
  const rows = useResource<Lesson[]>(`/staff/schedule?${params}`, true);
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  return (
    <>
      <section className="panel">
        <div className="staff-schedule-filters">
          <label>
            Группа
            <select
              aria-label="Группа"
              value={params.get("group_id") || ""}
              onChange={(e) => filter("group_id", e.target.value)}
            >
              <option value="">Все свои группы</option>
              {groups.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            С даты
            <input
              type="date"
              value={params.get("start") || ""}
              onChange={(e) => filter("start", e.target.value)}
            />
          </label>
          <label>
            По дату
            <input
              type="date"
              value={params.get("end") || ""}
              onChange={(e) => filter("end", e.target.value)}
            />
          </label>
          <label>
            Дисциплина или преподаватель
            <input
              type="search"
              maxLength={120}
              value={params.get("q") || ""}
              onChange={(e) => filter("q", e.target.value)}
              placeholder="Найти консультацию"
            />
          </label>
        </div>
        <p className="fine">
          Без дат показывается неделя демонстрационного сценария. Время
          московское.
        </p>
        <ErrorBox error={rows.error || groups.error} />
        <button
          className="text-button"
          onClick={() => {
            rows.reload();
            groups.reload();
          }}
        >
          Обновить
        </button>
        {!rows.data && !rows.error && <p role="status">Загружаем занятия…</p>}
        {rows.data?.length === 0 && (
          <div className="empty">
            <h3>Занятия не найдены</h3>
            <p>Проверьте группу, даты и строку поиска.</p>
          </div>
        )}
        {rows.data?.map((row) => (
          <Link
            className="request-row"
            key={row.id}
            to={`/staff/schedule/${row.id}`}
          >
            <div>
              <span className="eyebrow">
                {row.group} · {row.kind}
              </span>
              <h3>{row.subject}</h3>
              <p>
                {dayLabel(campusDay(row.starts_at), true)} ·{" "}
                {campusTime(row.starts_at)}–{campusTime(row.ends_at)} ·{" "}
                {row.teacher}
              </p>
              <small>
                {row.building} · аудитория {row.room}
              </small>
            </div>
            <span className={`badge lesson-${row.status}`}>
              {row.status === "cancelled"
                ? "Отменено"
                : row.status === "moved"
                  ? "Изменено"
                  : "По расписанию"}{" "}
              ↗
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}

type LessonDraft = {
  version: number;
  starts_at: string;
  ends_at: string;
  building: string;
  room: string;
  reason: string;
};
const lessonDraft = (row: Lesson): LessonDraft => ({
  version: row.version,
  starts_at: localTime(row.starts_at),
  ends_at: localTime(row.ends_at),
  building: row.building,
  room: row.room,
  reason: "",
});
export function StaffLessonPage({ user }: { user: User }) {
  const { id } = useParams();
  const resource = useResource<Lesson>(`/staff/schedule/${id}`);
  return (
    <>
      <Link className="back" to="/staff/schedule">
        ← Расписание факультета
      </Link>
      <ErrorBox error={resource.error} />
      {resource.error && (
        <button className="secondary" onClick={resource.reload}>
          Повторить
        </button>
      )}
      {!resource.data && !resource.error && <p>Загружаем карточку…</p>}
      {resource.data && (
        <LessonEditor key={id} initial={resource.data} user={user} />
      )}
    </>
  );
}
function LessonEditor({ initial, user }: { initial: Lesson; user: User }) {
  const [row, setRow] = useState(initial);
  const [draft, setDraft] = useDraft(
    `lesson-edit-${user.id}-${row.id}`,
    lessonDraft(row),
  );
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const field = (key: keyof LessonDraft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  async function refresh() {
    try {
      setRow(await api<Lesson>(`/staff/schedule/${row.id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function act(action: "update" | "cancel") {
    setError("");
    setMessage("");
    if (draft.reason.trim().length < 3) {
      setError("Укажите причину изменения (от 3 символов).");
      return;
    }
    setBusy(true);
    try {
      const body =
        action === "cancel"
          ? { action, version: draft.version, reason: draft.reason }
          : {
              ...draft,
              action,
              starts_at: isoTime(draft.starts_at),
              ends_at: isoTime(draft.ends_at),
            };
      const result = await api<Lesson & { announcement_prefill: Prefill }>(
        `/staff/schedule/${row.id}`,
        "PATCH",
        body,
      );
      setRow(result);
      setDraft(lessonDraft(result));
      setPrefill(result.announcement_prefill);
      setMessage(
        "Изменения и история сохранены. Теперь можно сообщить группе.",
      );
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">
          {row.group} · {row.kind}
        </span>
        <h1>{row.subject}</h1>
        <p>{row.teacher} · московское время</p>
      </div>
      <ErrorBox error={error} />
      {message && (
        <div className="success" role="status">
          {message}
        </div>
      )}
      {prefill && (
        <div className="publish-prompt panel">
          <div>
            <h2>Сообщите об изменении</h2>
            <p>Группа и ссылка на занятие будут подставлены в форму.</p>
          </div>
          <Link
            className="primary"
            to={`/staff/announcements/new?lesson_id=${prefill.lesson_id}`}
          >
            Опубликовать объявление →
          </Link>
        </div>
      )}
      <div className="two-columns">
        <section className="panel">
          <h2>Правка занятия</h2>
          {row.status === "cancelled" ? (
            <p className="cancellation-note">
              Занятие отменено. Повторная отмена и правка закрыты.
            </p>
          ) : (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void act("update");
              }}
            >
              {draft.version !== row.version && (
                <div className="error">
                  Черновик основан на другой версии. Сравните его с актуальными
                  данными справа.{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setDraft(lessonDraft(row))}
                  >
                    Загрузить актуальные данные в форму
                  </button>
                </div>
              )}
              <label>
                Начало
                <input
                  required
                  type="datetime-local"
                  value={draft.starts_at}
                  onChange={(e) => field("starts_at", e.target.value)}
                />
              </label>
              <label>
                Окончание
                <input
                  required
                  type="datetime-local"
                  value={draft.ends_at}
                  onChange={(e) => field("ends_at", e.target.value)}
                />
              </label>
              <label>
                Корпус
                <input
                  required
                  maxLength={120}
                  value={draft.building}
                  onChange={(e) => field("building", e.target.value)}
                />
              </label>
              <label>
                Аудитория
                <input
                  required
                  maxLength={40}
                  value={draft.room}
                  onChange={(e) => field("room", e.target.value)}
                />
              </label>
              <label>
                Причина изменения или отмены
                <textarea
                  aria-label="Причина изменения или отмены"
                  required
                  minLength={3}
                  maxLength={500}
                  value={draft.reason}
                  onChange={(e) => field("reason", e.target.value)}
                />
              </label>
              <div className="edit-preview">
                <strong>После сохранения</strong>
                <p>
                  {draft.starts_at.replace("T", ", ")} —{" "}
                  {draft.ends_at.replace("T", ", ")}
                  <br />
                  {draft.building} · аудитория {draft.room}
                </p>
              </div>
              <div className="form-actions">
                <button className="primary" disabled={busy}>
                  Сохранить изменение
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={busy}
                  onClick={() => act("cancel")}
                >
                  Отменить занятие
                </button>
              </div>
            </form>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Сейчас в расписании</h2>
            <button className="text-button" onClick={refresh}>
              Обновить
            </button>
          </div>
          <LinkedLesson staff lesson={row} />
          <Link to={`/staff/announcements/new?lesson_id=${row.id}`}>
            Создать связанное объявление →
          </Link>
          <h2 className="history-title">История изменений</h2>
          {!row.changes.length && (
            <p className="muted">Изменений пока не было.</p>
          )}
          {row.changes.map((change) => (
            <article className="staff-change" key={change.id}>
              <small>
                {dayLabel(campusDay(change.created_at), true)} ·{" "}
                {campusTime(change.created_at)}
              </small>
              <h3>{change.reason}</h3>
              <p>
                Было: {localTime(change.before.starts_at).replace("T", ", ")}–
                {campusTime(change.before.ends_at)}, {change.before.building},
                аудитория {change.before.room}
              </p>
              <p>
                Стало: {localTime(change.after.starts_at).replace("T", ", ")}–
                {campusTime(change.after.ends_at)}, {change.after.building},
                аудитория {change.after.room} ·{" "}
                {change.after.status === "cancelled"
                  ? "Отменено"
                  : "Запланировано"}
              </p>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}

export function StaffAnnouncementsPage() {
  const resource = useResource<Announcement[]>("/staff/announcements", true);
  const [status, setStatus] = useState("");
  const rows = resource.data?.filter((r) => !status || r.status === status);
  return (
    <>
      <div className="page-title title-row">
        <Link className="primary" to="/staff/announcements/new">
          Создать объявление ＋
        </Link>
      </div>
      <section className="panel">
        <div className="results-toolbar">
          <label>
            Состояние
            <select
              aria-label="Состояние"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Все состояния</option>
              {Object.entries(publicationLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="text-button" onClick={resource.reload}>
            Обновить
          </button>
        </div>
        <ErrorBox error={resource.error} />
        {!rows && !resource.error && <p>Загружаем…</p>}
        {rows?.length === 0 && (
          <div className="empty">
            <h3>Объявлений пока нет</h3>
            <p>Создайте сообщение факультету или своей группе.</p>
          </div>
        )}
        {rows?.map((row) => (
          <Link
            className="request-row"
            key={row.id}
            to={`/staff/announcements/${row.id}`}
          >
            <div>
              <h3>{row.title}</h3>
              <p>
                {row.audience === "group"
                  ? `Группа · ${row.lesson?.group || "адресная публикация"}`
                  : "Факультет"}
              </p>
              <small>
                {row.source}
                {row.expires_at &&
                  ` · показ до ${dayLabel(campusDay(row.expires_at))}`}
              </small>
            </div>
            <span className={`badge publication-${row.status}`}>
              {publicationLabel[row.status]} ↗
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}

type AnnouncementDraft = {
  title: string;
  fact: string;
  text: string;
  audience: "faculty" | "group";
  group_id: string;
  lesson_id: string;
  status: Announcement["status"];
  pinned: boolean;
  expires_at: string;
  version: number;
  key: string;
};
function announcementDraft(
  row: Announcement | null,
  lesson: Lesson | null,
): AnnouncementDraft {
  return {
    title:
      row?.title ||
      (lesson ? `Изменение занятия: ${lesson.subject}`.slice(0, 160) : ""),
    fact: row?.fact || "",
    text:
      row?.text ||
      (lesson
        ? "Проверьте актуальные время и место в связанной карточке занятия."
        : ""),
    audience: row?.audience === "group" || lesson ? "group" : "faculty",
    group_id: String(row?.group_id || lesson?.group_id || ""),
    lesson_id: String(row?.lesson_id || lesson?.id || ""),
    status: row?.status || "draft",
    pinned: row?.pinned || false,
    expires_at: row?.expires_at ? localTime(row.expires_at) : "",
    version: row?.version || 1,
    key: submissionKey(),
  };
}
export function StaffAnnouncementPage({
  user,
  create = false,
}: {
  user: User;
  create?: boolean;
}) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const lessonId = params.get("lesson_id");
  if (create && lessonId)
    return (
      <PrefilledAnnouncement key={lessonId} user={user} lessonId={lessonId} />
    );
  if (create)
    return <AnnouncementEditor user={user} initial={null} linked={null} />;
  return <ExistingAnnouncement key={id} id={id!} user={user} />;
}
function ExistingAnnouncement({ id, user }: { id: string; user: User }) {
  const resource = useResource<Announcement>(`/staff/announcements/${id}`);
  return (
    <>
      <ErrorBox error={resource.error} />
      {resource.error && (
        <button className="secondary" onClick={resource.reload}>
          Повторить загрузку
        </button>
      )}
      {!resource.data && !resource.error && <p>Загружаем объявление…</p>}
      {resource.data && (
        <AnnouncementEditor
          user={user}
          initial={resource.data}
          linked={resource.data.lesson}
        />
      )}
    </>
  );
}
function PrefilledAnnouncement({
  lessonId,
  user,
}: {
  lessonId: string;
  user: User;
}) {
  const resource = useResource<Lesson>(`/staff/schedule/${lessonId}`);
  return (
    <>
      <ErrorBox error={resource.error} />
      {resource.error && (
        <button className="secondary" onClick={resource.reload}>
          Повторить загрузку
        </button>
      )}
      {!resource.data && !resource.error && (
        <p>Подставляем группу и занятие…</p>
      )}
      {resource.data && (
        <AnnouncementEditor user={user} initial={null} linked={resource.data} />
      )}
    </>
  );
}
function AnnouncementEditor({
  user,
  initial,
  linked,
}: {
  user: User;
  initial: Announcement | null;
  linked: Lesson | null;
}) {
  const [row, setRow] = useState(initial);
  const navigate = useNavigate();
  const storage = `announcement-${user.id}-${initial?.id || `new-${linked?.id || "plain"}`}`;
  const [draft, setDraft] = useDraft(
    storage,
    announcementDraft(initial, linked),
  );
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const groups = useResource<Group[]>("/staff/groups");
  const lessons = useResource<Lesson[]>(
    `/staff/schedule${draft.group_id ? `?group_id=${draft.group_id}` : ""}`,
  );
  const choices = [
    ...(lessons.data || []),
    ...(linked && !lessons.data?.some((r) => r.id === linked.id)
      ? [linked]
      : []),
  ];
  const field = (key: keyof AnnouncementDraft, value: string | boolean) =>
    setDraft((d) => ({ ...d, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const body = {
        title: draft.title,
        fact: draft.fact || null,
        text: draft.text,
        audience: draft.audience,
        group_id:
          draft.audience === "group" && draft.group_id
            ? Number(draft.group_id)
            : null,
        lesson_id: draft.lesson_id ? Number(draft.lesson_id) : null,
        status: draft.status,
        pinned: draft.pinned,
        expires_at: draft.expires_at ? isoTime(draft.expires_at) : null,
        ...(row ? { version: draft.version } : { idempotency_key: draft.key }),
      };
      const result = await api<Announcement>(
        row ? `/staff/announcements/${row.id}` : "/staff/announcements",
        row ? "PATCH" : "POST",
        body,
      );
      sessionStorage.removeItem(storage);
      if (!row) {
        navigate(`/staff/announcements/${result.id}`);
        return;
      }
      setRow(result);
      setDraft(announcementDraft(result, result.lesson));
      setMessage(
        "Объявление сохранено. Адресаты увидят только действующую публикацию.",
      );
    } catch (e) {
      setError((e as Error).message);
      if (row)
        try {
          setRow(await api<Announcement>(`/staff/announcements/${row.id}`));
        } catch {
          /* Keep the draft. */
        }
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to="/staff/announcements">
        ← Объявления факультета
      </Link>
      <div className="page-title">
        <span className="eyebrow">
          {row ? publicationLabel[row.status] : "НОВОЕ СООБЩЕНИЕ"}
        </span>
        <h1>{row ? "Редактирование объявления" : "Создать объявление"}</h1>
        <p>
          Общевузовские сообщения загружает команда. Здесь доступен ваш
          факультет и его группы.
        </p>
      </div>
      <div className="two-columns">
        <section className="panel">
          <form onSubmit={submit}>
            {row && row.version !== draft.version && (
              <div className="error">
                На сервере есть новая версия. Ваш текст сохранён.{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setDraft(announcementDraft(row, row.lesson))}
                >
                  Загрузить серверную версию в форму
                </button>
              </div>
            )}
            <label>
              Заголовок
              <input
                required
                minLength={3}
                maxLength={160}
                value={draft.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </label>
            <label>
              Краткий факт
              <input
                maxLength={140}
                value={draft.fact || ""}
                onChange={(e) => field("fact", e.target.value)}
              />
            </label>
            <label>
              Текст
              <textarea
                aria-label="Текст"
                required
                minLength={3}
                maxLength={5000}
                value={draft.text}
                onChange={(e) => field("text", e.target.value)}
              />
            </label>
            <label>
              Кому
              <select
                aria-label="Кому"
                value={draft.audience}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    audience: e.target.value as "faculty" | "group",
                    group_id: "",
                    lesson_id: "",
                  }))
                }
              >
                <option value="faculty">Моему факультету</option>
                <option value="group">Группе моего факультета</option>
              </select>
            </label>
            {draft.audience === "group" && (
              <>
                <label>
                  Группа
                  <select
                    aria-label="Группа"
                    required
                    value={draft.group_id}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        group_id: e.target.value,
                        lesson_id: "",
                      }))
                    }
                  >
                    <option value="">Выберите группу</option>
                    {groups.data?.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Связанное занятие
                  <select
                    aria-label="Связанное занятие"
                    value={draft.lesson_id}
                    onChange={(e) => field("lesson_id", e.target.value)}
                  >
                    <option value="">Без ссылки на занятие</option>
                    {choices
                      .filter((l) => String(l.group_id) === draft.group_id)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.subject} · {dayLabel(campusDay(l.starts_at), true)}
                        </option>
                      ))}
                  </select>
                </label>
                <p className="fine">
                  Актуальные время и аудитория подтягиваются из расписания. Не
                  нужно дублировать их в тексте.
                </p>
              </>
            )}
            <label>
              Состояние
              <select
                aria-label="Состояние"
                value={draft.status}
                onChange={(e) => field("status", e.target.value)}
              >
                {Object.entries(publicationLabel).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Показ до (необязательно, по Москве)
              <input
                type="datetime-local"
                value={draft.expires_at}
                onChange={(e) => field("expires_at", e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) => field("pinned", e.target.checked)}
              />
              Закрепить в начале ленты
            </label>
            <ErrorBox error={error || groups.error || lessons.error} />
            {message && (
              <p className="success" role="status">
                {message}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy
                ? "Сохраняем…"
                : draft.status === "published"
                  ? "Сохранить и опубликовать"
                  : draft.status === "withdrawn"
                    ? "Снять с публикации"
                    : "Сохранить черновик"}
            </button>
          </form>
        </section>
        <aside className="panel">
          <span className="eyebrow">ПРЕДПРОСМОТР</span>
          <h2>{draft.title || "Заголовок объявления"}</h2>
          <p className="announcement-text">
            {draft.text || "Текст сообщения появится здесь."}
          </p>
          <span className={`badge publication-${draft.status}`}>
            {publicationLabel[draft.status]}
          </span>
          {choices.find((l) => String(l.id) === draft.lesson_id) && (
            <LinkedLesson
              staff
              lesson={choices.find((l) => String(l.id) === draft.lesson_id)!}
            />
          )}
          <p className="fine">
            Черновик и снятое сообщение студентам недоступны. Публикация
            появится у адресатов после сохранения и обновления ленты.
          </p>
        </aside>
      </div>
    </>
  );
}
