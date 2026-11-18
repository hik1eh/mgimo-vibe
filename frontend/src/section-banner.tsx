import { useLocation } from "react-router-dom";
import { useRef } from "react";
import { useResource } from "./ui";
import { CampusObject, type CampusModel } from "./campus-object";
import type { StudyContext } from "./study-types";
import { CampusPreview } from "./campus-preview";

type Banner = { title: string; subtitle?: string; model: CampusModel };

const studentBanners: Record<string, Banner> = {
  "/today": { title: "Сегодня", model: "campus" },
  "/schedule": { title: "Расписание", model: "atrium" },
  "/academic-results": { title: "Оценки", model: "record" },
  "/requests": {
    title: "Заявки",
    subtitle: "Справки об обучении",
    model: "letter",
  },
  "/notifications": { title: "Уведомления", model: "bell" },
  "/profile": { title: "Информация о студенте", model: "clip" },
};

const staffBanners: Record<string, Banner> = {
  "/requests": { title: "Очередь заявок", model: "archive" },
  "/staff/schedule": { title: "Расписание факультета", model: "archive" },
  "/staff/announcements": { title: "Объявления факультета", model: "archive" },
  "/staff/academic-results": { title: "Успеваемость", model: "archive" },
  "/profile": { title: "Профиль сотрудника", model: "clip" },
};

function TodayDate() {
  const { data } = useResource<StudyContext>("/study-context");
  if (!data) return null;
  const label = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(`${data.today}T12:00:00Z`));
  return (
    <p className="section-banner__date">
      <time dateTime={data.today}>
        {label[0].toUpperCase() + label.slice(1)}
      </time>
    </p>
  );
}

export function SectionBanner({
  staff,
  faculty,
  keyboard,
}: {
  staff: boolean;
  faculty: string;
  keyboard: boolean;
}) {
  const { pathname } = useLocation();
  const banner = (staff ? staffBanners : studentBanners)[pathname];
  const entry = useRef({
    path: pathname,
    seen: Boolean(banner),
    animate: false,
  });
  if (entry.current.path !== pathname) {
    entry.current = {
      path: pathname,
      seen: entry.current.seen || Boolean(banner),
      animate: entry.current.seen,
    };
  }
  if (!banner) return null;
  const animate = entry.current.animate && !keyboard;
  return (
    <section
      className="section-banner campus-banner"
      data-section={pathname}
      data-staff={staff || undefined}
      aria-labelledby="section-title"
    >
      <div className="campus-banner-inner">
        <div
          key={pathname}
          className="campus-banner-title"
          data-enter={animate || undefined}
        >
          <p className="campus-banner-eyebrow">
            {staff ? "Кабинет сотрудника" : "Северный кампус"}
          </p>
          <h1 id="section-title">{banner.title}</h1>
          {pathname === "/today" ? (
            <>
              <TodayDate />
              <CampusPreview className="campus-banner-preview" />
            </>
          ) : (
            (staff || banner.subtitle) && (
              <p className="section-banner__date">
                {staff ? faculty : banner.subtitle}
              </p>
            )
          )}
        </div>
        <div className="campus-banner-object">
          <CampusObject kind={banner.model} animated={animate} />
        </div>
      </div>
    </section>
  );
}
