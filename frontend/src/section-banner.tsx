import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useResource } from "./ui";
import type { StudyContext } from "./study-types";
import campus from "./assets/banners/facade.webp";
import stairs from "./assets/banners/atrium.webp";
import library from "./assets/banners/library.webp";
import services from "./assets/banners/student-services.webp";

const banners = {
  "/today": { title: "Сегодня", photo: campus, position: "center" },
  "/schedule": { title: "Расписание", photo: stairs, position: "center 65%" },
  "/academic-results": {
    title: "Оценки",
    photo: library,
    position: "center 45%",
  },
  "/requests": { title: "Заявки", photo: services, position: "center" },
} as const;

function BannerPhoto({ photo, position }: { photo: string; position: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, []);
  return (
    <div className="section-banner__visual" aria-hidden="true">
      <img
        ref={ref}
        className="section-banner__photo"
        src={photo}
        alt=""
        data-loaded={loaded || undefined}
        onLoad={() => setLoaded(true)}
        style={{ objectPosition: position }}
      />
    </div>
  );
}

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
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </time>
    </p>
  );
}

export function SectionBanner() {
  const { pathname } = useLocation();
  const banner = banners[pathname as keyof typeof banners];
  if (!banner) return null;
  return (
    <section
      className="section-banner"
      data-section={pathname}
      aria-labelledby="section-title"
    >
      <BannerPhoto
        key={banner.photo}
        photo={banner.photo}
        position={banner.position}
      />
      <div className="section-banner__body">
        <p className="section-banner__eyebrow">Светлый кампус</p>
        <h1 id="section-title">{banner.title}</h1>
        {pathname === "/today" && <TodayDate />}
      </div>
    </section>
  );
}
