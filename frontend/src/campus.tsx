import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { User, Notice, RequestRecord } from "./api";
import type { AcademicPayload, Lesson, StudyContext } from "./study-types";
import { addDays, campusDay, campusTime, dayLabel } from "./study-dates";
import { ErrorBox, useResource } from "./ui";
import { type Announcement, audienceLabel } from "./campus-types";
import { LessonCard } from "./study";

export function StudentAccount() {
  const { data } = useResource<Notice[]>("/notifications", true);
  const unread = data?.filter((n) => !n.read).length || 0;
  return (
    <>
      <Link
        className="account-link"
        to="/notifications"
        aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4zM10 20h4" />
        </svg>
        <span className="account-text">Уведомления</span>
        {unread > 0 && <b className="unread-count">{unread}</b>}
      </Link>
      <Link className="account-link" to="/profile" aria-label="Профиль">
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
        <span className="account-text">Профиль</span>
      </Link>
    </>
  );
}

export function LinkedLesson({
  lesson,
  staff = false,
}: {
  lesson: Lesson;
  staff?: boolean;
}) {
  const change = lesson.changes.at(-1);
  return (
    <div className="linked-lesson">
      <span className="eyebrow">АКТУАЛЬНОЕ ЗАНЯТИЕ</span>
      <h3>{lesson.subject}</h3>
      <p>
        {dayLabel(campusDay(lesson.starts_at), true)} ·{" "}
        {campusTime(lesson.starts_at)}–{campusTime(lesson.ends_at)}
      </p>
      {lesson.status === "cancelled" ? (
        <p className="cancellation-note">Отменено. Приходить не нужно.</p>
      ) : (
        <p>
          {lesson.building} · аудитория <strong>{lesson.room}</strong>
          {change && change.before.room !== lesson.room && (
            <small className="block">
              Прежде: аудитория {change.before.room}
            </small>
          )}
        </p>
      )}
      <Link to={`${staff ? "/staff" : ""}/schedule/${lesson.id}`}>
        Открыть занятие →
      </Link>
    </div>
  );
}

function AnnouncementCard({
  item,
  full = false,
}: {
  item: Announcement;
  full?: boolean;
}) {
  const Heading = full ? "h1" : "h2";
  return (
    <article className={`announcement-card ${item.pinned ? "pinned" : ""}`}>
      <div className="announcement-meta">
        <span>{audienceLabel[item.audience]}</span>
        {item.pinned && <span>Закреплено</span>}
      </div>
      <Heading>
        {full ? (
          item.title
        ) : (
          <Link to={`/announcements/${item.id}`}>{item.title}</Link>
        )}
      </Heading>
      <p className="announcement-text">{item.text}</p>
      {item.lesson && <LinkedLesson lesson={item.lesson} />}
      <small>
        {item.source}
        {item.published_at &&
          ` · ${dayLabel(campusDay(item.published_at), true)}`}
      </small>
      {!full && (
        <Link className="announcement-open" to={`/announcements/${item.id}`}>
          Подробнее ↗
        </Link>
      )}
    </article>
  );
}

function Feed({ rows }: { rows: Announcement[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const update = () =>
      setEdges({
        prev: el.scrollLeft > 2,
        next: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [rows.length]);
  function scroll(direction: number) {
    const el = viewport.current;
    if (el)
      el.scrollBy({
        left:
          direction *
            (el.firstElementChild?.getBoundingClientRect().width ||
              el.clientWidth) +
          direction * 18,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
  return (
    <section className="feed-region" aria-label="Адресные объявления">
      <div className="section-heading">
        <h2>На связи с кампусом</h2>
        <div className="feed-actions">
          <Link to="/announcements">Все объявления</Link>
          <button
            className="secondary square"
            disabled={!edges.prev}
            aria-label="Предыдущие объявления"
            onClick={() => scroll(-1)}
          >
            ←
          </button>
          <button
            className="secondary square"
            disabled={!edges.next}
            aria-label="Следующие объявления"
            onClick={() => scroll(1)}
          >
            →
          </button>
        </div>
      </div>
      {rows.length ? (
        <div
          className="announcement-carousel"
          ref={viewport}
          tabIndex={0}
          aria-label="Лента, используйте стрелки или прокрутку"
          onKeyDown={(e) => {
            if (
              e.target === e.currentTarget &&
              ["ArrowLeft", "ArrowRight"].includes(e.key)
            ) {
              e.preventDefault();
              scroll(e.key === "ArrowLeft" ? -1 : 1);
            }
          }}
        >
          {rows.map((row) => (
            <AnnouncementCard key={row.id} item={row} />
          ))}
        </div>
      ) : (
        <div className="panel muted">Новых объявлений нет.</div>
      )}
    </section>
  );
}

function HomeStudy({ context }: { context: StudyContext }) {
  const lessons = useResource<Lesson[]>(
    `/schedule?start=${context.today}&end=${addDays(context.today, 6)}`,
    true,
  );
  const clock = campusTime(new Date().toISOString());
  const instant = new Date(`${context.today}T${clock}:00+03:00`).getTime();
  const next = lessons.data?.find(
    (row) =>
      row.status !== "cancelled" && new Date(row.ends_at).getTime() > instant,
  );
  return (
    <section className="home-study">
      <div className="section-heading">
        <h2>Ближайшее занятие</h2>
        <Link to="/schedule">Расписание →</Link>
      </div>
      <ErrorBox error={lessons.error} />
      {lessons.error && (
        <button className="secondary" onClick={lessons.reload}>
          Повторить
        </button>
      )}
      {!lessons.data && !lessons.error && (
        <p role="status">Загружаем расписание…</p>
      )}
      {lessons.data &&
        (next ? (
          <>
            <p className="study-caption">
              {dayLabel(campusDay(next.starts_at))} · московское время
            </p>
            <LessonCard
              lesson={next}
              query={`date=${campusDay(next.starts_at)}`}
            />
          </>
        ) : (
          <div className="panel empty">
            <h3>Ближайших занятий нет</h3>
            <p>
              Сегодня занятия завершены или не запланированы. Можно открыть
              расписание и выбрать другой день.
            </p>
            <Link to="/schedule?view=week">Открыть неделю →</Link>
          </div>
        ))}
    </section>
  );
}

export function TodayPage({ user }: { user: User }) {
  const feed = useResource<Announcement[]>("/announcements", true);
  const requests = useResource<RequestRecord[]>("/requests", true);
  const context = useResource<StudyContext>("/study-context");
  const results = useResource<AcademicPayload>("/academic-results", true);
  const tasks =
    requests.data?.filter((r) => ["needs_info", "ready"].includes(r.status)) ||
    [];
  return (
    <>
      <div className="page-title home-title">
        <div>
          <span className="eyebrow">{user.group} · СЕВЕРНЫЙ КАМПУС</span>
          <h1>Сегодня</h1>
          <p>{user.full_name}, всё важное — в вашем кабинете.</p>
        </div>
        <Link className="primary" to="/requests/new">
          Заказать справку ＋
        </Link>
      </div>
      <ErrorBox error={feed.error} />
      {feed.error && (
        <button className="secondary" onClick={feed.reload}>
          Повторить загрузку ленты
        </button>
      )}
      {feed.data ? (
        <Feed rows={feed.data} />
      ) : (
        !feed.error && <p role="status">Загружаем объявления…</p>
      )}
      <ErrorBox error={context.error} />
      {context.error && (
        <button className="secondary" onClick={context.reload}>
          Повторить загрузку календаря
        </button>
      )}
      {context.data && (
        <p className="study-caption">
          Демонстрационный учебный день: {dayLabel(context.data.today)}. Все
          данные вымышлены.
        </p>
      )}
      <div className="home-grid">
        {context.data && <HomeStudy context={context.data} />}
        <section>
          <div className="section-heading">
            <h2>Требует внимания</h2>
            <Link to="/notifications">Уведомления →</Link>
          </div>
          <ErrorBox error={requests.error} />
          {requests.error && (
            <button className="secondary" onClick={requests.reload}>
              Повторить
            </button>
          )}
          {!requests.data && !requests.error && <p>Загружаем заявки…</p>}
          {tasks.map((req) => (
            <Link
              key={req.id}
              className={`attention-card ${req.status}`}
              to={`/requests/${req.id}`}
            >
              <span className="eyebrow">{req.number}</span>
              <h3>
                {req.status === "needs_info"
                  ? "Ответьте на уточнение"
                  : "Ваша справка готова"}
              </h3>
              <p>
                {req.status === "needs_info"
                  ? "Сотрудник ждёт ответа в карточке заявки."
                  : "Откройте заявку и скачайте демонстрационный PDF."}
              </p>
              <span>Открыть заявку →</span>
            </Link>
          ))}
          {requests.data && !tasks.length && (
            <div className="panel">
              <h3>Срочных действий по заявкам нет</h3>
              <p className="muted">
                Изменения статуса появятся в уведомлениях.
              </p>
            </div>
          )}
          <ErrorBox error={results.error} />
          {results.error && (
            <button className="secondary" onClick={results.reload}>
              Повторить загрузку успеваемости
            </button>
          )}
          {results.data?.summary.next_credit && (
            <Link
              className="attention-card next-credit-attention"
              to="/academic-results"
            >
              <span className="eyebrow">ПРЕДСТОИТ ЗАЧЁТ</span>
              <h3>{results.data.summary.next_credit.subject}</h3>
              <p>
                {dayLabel(
                  campusDay(results.data.summary.next_credit.control_at),
                )}
              </p>
              <span>Открыть успеваемость →</span>
            </Link>
          )}
        </section>
      </div>
    </>
  );
}

export function AnnouncementsPage() {
  const { data, error, reload } = useResource<Announcement[]>(
    "/announcements",
    true,
  );
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">ВУЗ · ФАКУЛЬТЕТ · ГРУППА</span>
        <h1>Все объявления</h1>
        <p>Только опубликованные сообщения, адресованные вам.</p>
      </div>
      <button className="text-button" onClick={reload}>
        Обновить
      </button>
      <ErrorBox error={error} />
      {!data && !error && <p role="status">Загружаем…</p>}
      {data?.length === 0 && (
        <div className="panel empty">
          <h3>Новых объявлений нет</h3>
          <p>
            Когда деканат опубликует сообщение вашей группе, оно появится здесь.
          </p>
        </div>
      )}
      <div className="announcements-grid">
        {data?.map((row) => <AnnouncementCard key={row.id} item={row} />)}
      </div>
    </>
  );
}

export function NotificationExtras() {
  const feed = useResource<Announcement[]>("/announcements", true);
  const results = useResource<AcademicPayload>("/academic-results", true);
  const credit = results.data?.summary.next_credit;
  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <h2>Учебные напоминания</h2>
          <button className="text-button" onClick={results.reload}>
            Обновить
          </button>
        </div>
        <ErrorBox error={results.error} />
        {!results.data && !results.error && <p>Загружаем…</p>}
        {results.data &&
          (credit ? (
            <Link
              className="attention-card next-credit-attention"
              to="/academic-results"
            >
              <span className="eyebrow">ПРЕДСТОИТ ЗАЧЁТ</span>
              <h3>{credit.subject}</h3>
              <p>
                {dayLabel(campusDay(credit.control_at))} ·{" "}
                {campusTime(credit.control_at)}
              </p>
              <span>Открыть успеваемость →</span>
            </Link>
          ) : (
            <p className="muted">
              Предстоящих зачётов в выбранном учебном семестре нет.
            </p>
          ))}
      </section>
      <section className="feed-region">
        <div className="section-heading">
          <h2>Новости и объявления</h2>
          <Link to="/announcements">Все объявления →</Link>
        </div>
        <ErrorBox error={feed.error} />
        {feed.error && (
          <button className="secondary" onClick={feed.reload}>
            Повторить
          </button>
        )}
        {!feed.data && !feed.error && <p>Загружаем…</p>}
        {feed.data?.length === 0 && (
          <div className="panel muted">Новых объявлений нет.</div>
        )}
        <div className="announcements-grid">
          {feed.data?.map((row) => (
            <AnnouncementCard key={row.id} item={row} />
          ))}
        </div>
      </section>
    </>
  );
}
export function AnnouncementPage() {
  const { id } = useParams();
  const { data, error, reload } = useResource<Announcement>(
    `/announcements/${id}`,
    true,
  );
  return (
    <>
      <Link className="back" to="/announcements">
        ← Все объявления
      </Link>
      <ErrorBox error={error} />
      {error && (
        <button className="secondary" onClick={reload}>
          Обновить
        </button>
      )}
      {!data && !error && <p>Загружаем объявление…</p>}
      {data && <AnnouncementCard item={data} full />}
    </>
  );
}
