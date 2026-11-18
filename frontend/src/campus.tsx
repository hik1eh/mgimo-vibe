import { Link, NavLink, useParams } from "react-router-dom";
import { statusLabels, type User, type RequestRecord } from "./api";
import { NewsFeed } from "./news-feed";
import type { AcademicPayload, Lesson, StudyContext } from "./study-types";
import { addDays, campusDay, campusTime, dayLabel } from "./study-dates";
import { ErrorBox, useResource } from "./ui";
import { type Announcement, audienceLabel } from "./campus-types";
import { LessonCard } from "./study";
import { RouteLink } from "./lesson-route";
import { useLessonAttention, type LessonAttention } from "./lesson-attention";
import {
  Bell,
  User as UserIcon,
  CalendarBlank,
  ArrowRight,
} from "@phosphor-icons/react";

export function StudentAccount({ unread }: { unread: number }) {
  return (
    <>
      <NavLink
        className="account-link"
        to="/notifications"
        aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ""}`}
      >
        <span className="account-icon">
          <Bell size={23} weight="light" aria-hidden="true" />
          {unread > 0 && (
            <span className="unread-dot" aria-hidden="true">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
        <span className="account-text">Уведомления</span>
      </NavLink>
      <NavLink className="account-link" to="/profile" aria-label="Профиль">
        <UserIcon size={23} weight="light" aria-hidden="true" />
        <span className="account-text">Профиль</span>
      </NavLink>
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
  compact = false,
}: {
  item: Announcement;
  full?: boolean;
  compact?: boolean;
}) {
  const Heading = full ? "h1" : compact ? "h3" : "h2";
  return (
    <article
      className={`announcement-card ${item.pinned ? "pinned" : ""} ${compact ? "feed-card" : ""}`}
    >
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
      {compact && item.lesson && (
        <p className="feed-lesson">
          {item.lesson.status === "cancelled" ? (
            "Занятие отменено"
          ) : (
            <>
              Аудитория <strong>{item.lesson.room}</strong>
            </>
          )}
        </p>
      )}
      {!compact && <p className="announcement-text">{item.text}</p>}
      {!compact && item.lesson && <LinkedLesson lesson={item.lesson} />}
      {!compact && (
        <small>
          {item.source}
          {item.published_at &&
            ` · ${dayLabel(campusDay(item.published_at), true)}`}
        </small>
      )}
      {compact && item.lesson && (
        <Link className="feed-open" to={`/schedule/${item.lesson.id}`}>
          Открыть занятие <ArrowRight aria-hidden="true" />
        </Link>
      )}
      {!full && (!compact || !item.lesson) && (
        <Link className="announcement-open" to={`/announcements/${item.id}`}>
          Подробнее ↗
        </Link>
      )}
    </article>
  );
}

function HomeStudy({
  context,
  attention,
}: {
  context: StudyContext;
  attention: LessonAttention;
}) {
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
    <section
      className="home-study panel"
      data-move-pending={attention.pending(next) || undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") attention.acknowledge(next);
      }}
      onClick={() => attention.acknowledge(next)}
    >
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
            <RouteLink
              lesson={next}
              search={`?date=${campusDay(next.starts_at)}`}
            />
          </>
        ) : (
          <div className="empty">
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
  const attention = useLessonAttention(user.id);
  const feed = useResource<Announcement[]>("/announcements", true);
  const requests = useResource<RequestRecord[]>("/requests", true);
  const context = useResource<StudyContext>("/study-context");
  const results = useResource<AcademicPayload>("/academic-results", true);
  const credit =
    results.data?.summary.next_control ?? results.data?.summary.next_credit;
  const records =
    requests.data
      ?.slice()
      .sort(
        (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id,
      ) || [];
  const current =
    records.find((row) => row.status === "needs_info") ||
    records.find((row) => row.status !== "ready") ||
    records[0];
  return (
    <div className="today-dashboard">
      <ErrorBox error={feed.error} />
      {feed.error && (
        <button className="secondary" onClick={feed.reload}>
          Повторить загрузку ленты
        </button>
      )}
      {feed.data ? (
        <NewsFeed rows={feed.data} group={user.group} attention={attention} />
      ) : (
        !feed.error && (
          <section className="dean-feed">
            <h2>Лента деканата</h2>
            <p role="status">Загружаем объявления…</p>
          </section>
        )
      )}
      <ErrorBox error={context.error} />
      {context.error && (
        <button className="secondary" onClick={context.reload}>
          Повторить загрузку календаря
        </button>
      )}
      <div className="student-overview">
        {context.data && <HomeStudy context={context.data} attention={attention} />}
        {credit && (
          <Link className="overview-card" to="/academic-results">
            <CalendarBlank size={24} aria-hidden="true" />
            <h2>
              {credit.kind === "credit"
                ? "Ближайший зачёт"
                : "Ближайший экзамен"}
            </h2>
            <strong>
              {dayLabel(campusDay(credit.control_at), true)},{" "}
              {campusTime(credit.control_at)}
            </strong>
            <p>{credit.subject}</p>
            <span>
              К успеваемости <ArrowRight aria-hidden="true" />
            </span>
          </Link>
        )}
        {current && (
          <Link className="overview-card" to={`/requests/${current.id}`}>
            <h2>Моя заявка</h2>
            <strong>{current.number}</strong>
            <p>{current.type}</p>
            <span className={`badge ${current.status}`}>
              {statusLabels[current.status]}
            </span>
            <span>
              Открыть заявку <ArrowRight aria-hidden="true" />
            </span>
          </Link>
        )}
      </div>
      <ErrorBox error={requests.error} />
      {requests.error && (
        <button className="secondary" onClick={requests.reload}>
          Повторить загрузку заявок
        </button>
      )}
      <ErrorBox error={results.error} />
      {results.error && (
        <button className="secondary" onClick={results.reload}>
          Повторить загрузку успеваемости
        </button>
      )}
      <div className="student-service-actions">
        <Link className="primary" to="/requests/new">
          Заказать справку ＋
        </Link>
      </div>
    </div>
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
        {data?.map((row) => (
          <AnnouncementCard key={row.id} item={row} />
        ))}
      </div>
    </>
  );
}

export function NotificationExtras() {
  const feed = useResource<Announcement[]>("/announcements", true);
  const results = useResource<AcademicPayload>("/academic-results", true);
  const credit =
    results.data?.summary.next_control ?? results.data?.summary.next_credit;
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
              <span className="eyebrow">{credit.label}</span>
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
