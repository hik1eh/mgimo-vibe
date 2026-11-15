import { useLocation } from "react-router-dom";
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

export function SectionBanner() {
  const { pathname } = useLocation();
  const banner = banners[pathname as keyof typeof banners];
  if (!banner) return null;
  return (
    <section className="section-banner" aria-labelledby="section-title">
      <img
        className="section-banner__photo"
        src={banner.photo}
        alt=""
        style={{ objectPosition: banner.position }}
      />
      <div className="section-banner__body">
        <p className="section-banner__eyebrow">Светлый кампус</p>
        <h1 id="section-title">{banner.title}</h1>
      </div>
    </section>
  );
}
