import type { Page } from "@playwright/test";

export const lessons = [
  {
    id: 901,
    group_id: 1,
    group: "ОН-201",
    subject: "Социология повседневности",
    teacher: "Елена Лазурная",
    kind: "Семинар",
    starts_at: "2026-11-18T09:00:00+03:00",
    ends_at: "2026-11-18T10:30:00+03:00",
    building: "Северный корпус",
    room: "412",
    status: "moved",
    version: 2,
    changes: [
      {
        id: 1,
        before: {
          room: "305",
          building: "Северный корпус",
          starts_at: "2026-11-18T09:00:00+03:00",
          ends_at: "2026-11-18T10:30:00+03:00",
          status: "scheduled",
        },
        after: {
          room: "412",
          building: "Северный корпус",
          starts_at: "2026-11-18T09:00:00+03:00",
          ends_at: "2026-11-18T10:30:00+03:00",
          status: "moved",
        },
        reason: "Перенос аудитории",
        created_at: "2026-11-17T10:00:00+03:00",
      },
    ],
  },
  {
    id: 902,
    group_id: 2,
    group: "ОН-202",
    subject: "Параллельный семинар",
    teacher: "Марк Леснов",
    kind: "Семинар",
    starts_at: "2026-11-18T09:00:00+03:00",
    ends_at: "2026-11-18T10:30:00+03:00",
    building: "Южный корпус",
    room: "412",
    status: "scheduled",
    version: 1,
    changes: [],
  },
  {
    id: 903,
    group_id: 1,
    group: "ОН-201",
    subject: "История общественных наук",
    teacher: "Марк Леснов",
    kind: "Лекция",
    starts_at: "2026-11-18T11:00:00+03:00",
    ends_at: "2026-11-18T12:30:00+03:00",
    building: "Северный корпус",
    room: "305",
    status: "cancelled",
    version: 1,
    changes: [],
  },
  {
    id: 904,
    group_id: 1,
    group: "ОН-201",
    subject: "Методы исследования",
    teacher: "Елена Лазурная",
    kind: "Практика",
    starts_at: "2026-11-20T13:00:00+03:00",
    ends_at: "2026-11-20T14:30:00+03:00",
    building: "Южный корпус",
    room: "412",
    status: "scheduled",
    version: 1,
    changes: [],
  },
];
export function news(count = 7) {
  return Array.from({ length: count }, (_, index) => ({
    id: 700 + index,
    title:
      index === 0
        ? "Изменена аудитория семинара"
        : `Объявление кампуса ${index + 1}`,
    text:
      index === 0
        ? "Семинар пройдёт в аудитории 412 вместо 305."
        : `Полный текст объявления ${index + 1}. Учебный отдел принимает по будням с 10:00 до 16:00.`,
    source: "Университет Северного кампуса",
    audience: ["group", "university", "faculty"][index % 3],
    faculty_id: 1,
    group_id: index % 3 === 0 ? 1 : null,
    lesson_id: index === 0 ? 901 : null,
    lesson: index === 0 ? lessons[0] : null,
    status: "published",
    pinned: index === 0,
    published_at: `2026-11-${17 - index}T12:00:00+03:00`,
    expires_at: null,
    version: 1,
  }));
}
export async function mockRedesign(page: Page, count = 7) {
  await page.route("**/api/v1/study-context", (route) =>
    route.fulfill({
      json: {
        today: "2026-11-18",
        demo_day: "2026-11-18",
        timezone: "Europe/Moscow",
        demo_dates: true,
      },
    }),
  );
  await page.route("**/api/v1/announcements**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const id = Number(pathname.split("/").at(-1));
    const item = news(count).find((row) => row.id === id);
    return route.fulfill({ json: Number.isFinite(id) ? item : news(count) });
  });
  await page.route("**/api/v1/schedule**", (route) => {
    const url = new URL(route.request().url());
    const id = Number(url.pathname.split("/").at(-1));
    const rows = lessons.filter(
      (row) =>
        row.starts_at.slice(0, 10) >= (url.searchParams.get("start") || "") &&
        row.starts_at.slice(0, 10) <= (url.searchParams.get("end") || "9999"),
    );
    return route.fulfill({
      json: Number.isFinite(id) ? lessons.find((row) => row.id === id) : rows,
    });
  });
}
