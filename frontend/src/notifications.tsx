import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  CalendarBlank,
  CheckCircle,
  FileText,
  Megaphone,
} from "@phosphor-icons/react";
import { api, type Notice } from "./api";
import { NotificationExtras } from "./campus";
import { lessonPath } from "./schedule-model";
import { campusDay, campusTime, dayLabel } from "./study-dates";
import { ErrorBox, useResource } from "./ui";

const kinds = {
  request: { label: "Заявка", Icon: FileText },
  lesson: { label: "Расписание", Icon: CalendarBlank },
  announcement: { label: "Объявление", Icon: Megaphone },
};

export function Notifications({
  resource,
}: {
  resource: ReturnType<typeof useResource<Notice[]>>;
}) {
  const { data, error, reload } = resource;
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();
  const days = new Map<string, Notice[]>();
  for (const item of data || []) {
    const day = campusDay(item.created_at);
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(item);
  }

  async function mark(notice?: Notice) {
    if (busy != null) return;
    setBusy(notice?.id || "all");
    setActionError("");
    try {
      if (notice) {
        const current = await api<Notice>(
          `/notifications/${notice.id}`,
          "PATCH",
        );
        reload();
        if (!current.available) return;
        if (current.kind === "lesson" && current.lesson_id)
          navigate(lessonPath(current.lesson_id));
        if (current.kind === "announcement" && current.announcement_id)
          navigate(`/announcements/${current.announcement_id}`);
        if (current.kind === "request" && current.request_id)
          navigate(`/requests/${current.request_id}`);
      } else {
        await api("/notifications/read-all", "POST");
        reload();
      }
    } catch (failure) {
      setActionError((failure as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="notification-center">
      <section className="panel notice-panel">
        <div className="section-heading">
          <h2>Личные уведомления</h2>
          {data?.some((item) => !item.read) ? (
            <button
              className="text-button"
              disabled={busy !== null}
              onClick={() => void mark()}
            >
              Прочитать все
            </button>
          ) : (
            <button className="text-button" onClick={reload}>
              Обновить
            </button>
          )}
        </div>
        <ErrorBox error={error || actionError} />
        {error && (
          <button className="secondary" onClick={reload}>
            Повторить
          </button>
        )}
        {!data && !error && <p role="status">Загружаем уведомления…</p>}
        {data?.length === 0 && (
          <div className="empty">
            <Bell aria-hidden="true" size={28} />
            <h3>Новых событий пока нет</h3>
          </div>
        )}
        {[...days.entries()].map(([day, rows]) => (
          <section key={day} className="notice-date">
            <h3>{dayLabel(day)}</h3>
            {rows.map((item) => {
              const { Icon, label } = kinds[item.kind];
              return (
                <button
                  key={item.id}
                  className={`notice ${item.read ? "read" : ""}`}
                  onClick={() => void mark(item)}
                  disabled={busy !== null || (!item.available && item.read)}
                >
                  <span className="notice-type-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="notice-message">
                    <small>
                      {label} · {campusTime(item.created_at)}
                    </small>
                    <strong>{item.title}</strong>
                    <small>
                      {item.read ? "Прочитано" : "Новое"}
                      {!item.available && !item.read
                        ? " · отметить прочитанным"
                        : ""}
                    </small>
                  </span>
                  {item.available ? (
                    <ArrowUpRight size={17} aria-hidden="true" />
                  ) : (
                    <CheckCircle size={18} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </section>
        ))}
      </section>
      <NotificationExtras />
    </div>
  );
}
