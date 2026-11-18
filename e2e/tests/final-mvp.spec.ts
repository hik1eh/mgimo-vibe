import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, noOverflow, settled } from "./helpers";

const root = "/artifacts/final-mvp/screens";
const gpu = {
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
};
test.use({ launchOptions: gpu });

async function capture(
  page: Page,
  width: number,
  state: string,
  fullPage = true,
) {
  await page.evaluate(() => document.fonts.ready);
  await noOverflow(page);
  await page.screenshot({
    path: `${root}/${state}-${width}.jpg`,
    fullPage,
    animations: "disabled",
    quality: 89,
  });
}

async function axe(page: Page, include: string) {
  const scan = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    scan.violations.map((row) => ({
      id: row.id,
      nodes: row.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

for (const width of [1440, 390]) {
  test(`final MVP screen matrix at ${width}px on real API data`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Войти в кабинет" }),
    ).toBeVisible();
    await expect(page.locator(".auth-page canvas[data-graduation-cap]")).toBeVisible();
    await capture(page, width, "login");
    await login(page);
    const study = await (
      await page.request.get("/api/v1/study-context")
    ).json();
    const me = await (await page.request.get("/api/v1/me")).json();
    const news = await (await page.request.get("/api/v1/announcements")).json();
    const move = news.find(
      (row: { lesson?: { room: string } }) => row.lesson?.room === "412",
    );
    const query = new URLSearchParams({
      view: "day",
      date: study.demo_day,
      group: "mine",
    });
    await page.clock.setFixedTime(new Date(`${study.today}T05:00:00Z`));
    await page.goto("/today");
    const tile = page.locator(`.news-tile[data-news-id="${move.id}"]`);
    await expect(tile).toBeVisible();
    await expect(page.locator(".campus-banner .campus-object")).toHaveAttribute(
      "data-render",
      "webgl",
    );
    await capture(page, width, "today");
    if (width === 1440) {
      await page.locator(".news-tile").first().hover();
      await capture(page, width, "today-hover");
    }
    await tile.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("link", { name: /Открыть занятие/ }),
    ).toBeVisible();
    await capture(page, width, "news-dialog", false);
    await dialog.getByRole("link", { name: /Открыть занятие/ }).click();
    await expect(page.locator(".room-number")).toHaveText("412");
    await capture(page, width, "lesson");
    await page
      .getByRole("link", { name: "Показать маршрут", exact: true })
      .click();
    await expect(page.locator('[data-route-segment="1"]')).toBeVisible();
    await capture(page, width, "route-entry");
    await page.getByRole("button", { name: /Подняться на 4-й этаж/ }).click();
    await expect(page.locator('[data-route-segment="4"]')).toBeVisible();
    await axe(page, ".route-layout");
    await capture(page, width, "route-412");
    await page.getByRole("link", { name: "К занятию" }).click();
    await expect(page.locator(".room-number")).toHaveText("412");
    await page.goto(`/schedule?${query}`);
    await expect(
      page.locator(".day-agenda .schedule-row").first(),
    ).toBeVisible();
    const lessons = await (
      await page.request.get(`/api/v1/schedule?start=${study.demo_day}`)
    ).json();
    const currentRoom = lessons.find(
      (row: { room: string }) => row.room === "412",
    );
    await page
      .getByLabel("Аудитория", { exact: true })
      .selectOption(String(currentRoom.room_id));
    await expect(page.locator(".day-agenda .schedule-row")).toHaveCount(1);
    await page.reload();
    await expect(page.getByLabel("Аудитория", { exact: true })).toHaveValue(
      String(currentRoom.room_id),
    );
    await capture(page, width, "schedule-day");
    await page.getByRole("button", { name: "Неделя", exact: true }).click();
    await expect(
      page.locator(width > 900 ? ".week-calendar" : ".week-agenda"),
    ).toBeVisible();
    await capture(page, width, "schedule-week");
    const alternative = lessons.find(
      (row: { room: string; has_route: boolean }) =>
        row.room === "210" && row.has_route,
    );
    if (alternative) {
      await page.goto(`/schedule/${alternative.id}/route`);
      await page.getByRole("button", { name: /Подняться на 2-й этаж/ }).click();
      await expect(page.locator('[data-route-segment="2"]')).toBeVisible();
      await expect(
        page.getByText("Аудитория 210", { exact: true }),
      ).toBeVisible();
    }
    await page.goto("/announcements");
    await expect(page.locator(".announcement-card").first()).toBeVisible();
    await capture(page, width, "news-list");
    await page.goto(`/announcements/${move.id}`);
    await expect(
      page.getByRole("link", { name: /Открыть занятие/ }),
    ).toBeVisible();
    await capture(page, width, "news-detail");

    await page.goto("/academic-results?semester=3");
    await expect(page.locator(".mvp-academic-summary")).toBeVisible();
    const results = await (
      await page.request.get("/api/v1/academic-results?semester=3")
    ).json();
    await capture(page, width, "results");
    const stories = page.getByRole("button", { name: "Смотреть итоги" });
    await stories.click();
    await expect(dialog.locator(".story-stat strong")).toHaveText(
      String(results.summary.closed),
    );
    await expect(dialog).toContainText(`из ${results.summary.total}`);
    await axe(page, ".semester-dialog");
    await capture(page, width, "stories-progress", false);
    await dialog.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: "Опубликованные результаты" }),
    ).toBeVisible();
    await capture(page, width, "stories-results", false);
    await page.keyboard.press("ArrowRight");
    await expect(
      dialog.getByRole("heading", { name: "Что дальше" }),
    ).toBeVisible();
    await capture(page, width, "stories-next", false);
    await page.keyboard.press("Escape");
    await expect(stories).toBeFocused();
    await expect(page.getByLabel("Семестр", { exact: true })).toHaveValue("3");
    await page.getByLabel("Семестр", { exact: true }).selectOption("2");
    await stories.click();
    await expect(dialog.locator(".story-stat strong")).toHaveText("1");
    await dialog.getByRole("button", { name: "Закрыть итоги" }).click();

    await page.goto("/requests/new");
    await capture(page, width, "request-new");
    const purpose = `Вымышленный учебный центр · проверка ${width}`;
    await page.getByLabel("Место предъявления").fill(purpose);
    await page.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(page).toHaveURL(/\/requests\/\d+$/);
    const requestId = new URL(page.url()).pathname.split("/").at(-1)!;
    const request = await (
      await page.request.get(`/api/v1/requests/${requestId}`)
    ).json();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: `Заявка ${request.number} принята` }),
    ).toBeVisible();

    const staffContext = await browser.newContext({
      baseURL: process.env.BASE_URL,
      viewport: { width, height: width > 800 ? 1000 : 844 },
      reducedMotion: "reduce",
    });
    try {
      const staff = await staffContext.newPage();
      await login(staff, "staff.a");
      await expect(
        staff
          .locator(".request-picker-row")
          .filter({ hasText: request.number }),
      ).toBeVisible();
      await settled(staff);
      await capture(staff, width, "staff-queue");
      await staff
        .locator(".request-picker-row")
        .filter({ hasText: request.number })
        .click();
      await staff.getByRole("button", { name: "Взять в работу" }).click();
      await expect(
        staff.getByRole("button", { name: "Отметить готовой" }),
      ).toBeVisible();
      await capture(staff, width, "staff-request");
      await staff.getByRole("button", { name: "Отметить готовой" }).click();
      await expect(
        staff.getByRole("heading", { name: "Документ готов" }),
      ).toBeVisible();
      await staff.goto("/staff/announcements");
      await expect(
        staff.getByRole("link", { name: /Создать объявление/ }),
      ).toBeVisible();
      await staff.waitForLoadState("networkidle");
      await capture(staff, width, "staff-news");
      await staff.getByRole("link", { name: /Создать объявление/ }).click();
      await expect(staff.getByLabel("Краткий факт")).toBeVisible();
      await capture(staff, width, "staff-news-new");
      const staffNews = await (
        await staff.request.get("/api/v1/staff/announcements")
      ).json();
      await staff.goto(`/staff/announcements/${staffNews[0].id}`);
      await expect(
        staff.getByRole("heading", { name: "Редактирование объявления" }),
      ).toBeVisible();
      await capture(staff, width, "staff-news-edit");
      await staff.goto("/staff/schedule");
      await expect(
        staff.getByRole("heading", { name: "Консультация по социологии" }),
      ).toBeVisible();
      await capture(staff, width, "staff-schedule");
      await staff
        .getByRole("link")
        .filter({
          has: staff.getByRole("heading", {
            name: "Консультация по социологии",
          }),
        })
        .click();
      await expect(
        staff.getByLabel("Аудитория", { exact: true }),
      ).toBeVisible();
      await capture(staff, width, "staff-lesson");
      await staff.goto("/staff/academic-results");
      await expect(staff.locator(".faculty-results")).toContainText("ОН-201");
      await expect(staff.locator(".faculty-results")).not.toContainText(
        "ЦТ-202",
      );
      await capture(staff, width, "staff-results");
      await staff.goto("/profile");
      await expect(
        staff.getByRole("heading", { name: "Ирина Речная" }),
      ).toBeVisible();
      await capture(staff, width, "staff-profile");
    } finally {
      await staffContext.close();
    }

    await page.goto("/requests");
    await page.getByRole("button", { name: "Готовые", exact: true }).click();
    await expect(
      page.locator(".request-picker-row").filter({ hasText: request.number }),
    ).toBeVisible();
    if (width > 1000)
      await expect(
        page.getByRole("button", { name: "Скачать PDF" }),
      ).toBeVisible();
    await capture(page, width, "requests");
    await page
      .locator(".request-picker-row")
      .filter({ hasText: request.number })
      .click();
    const download = page.getByRole("button", { name: "Скачать PDF" });
    await expect(download).toBeVisible();
    await capture(page, width, "request-ready");
    const pdf = page.waitForEvent("download");
    await download.click();
    expect(await (await pdf).failure()).toBeNull();
    await expect(page.getByText("Справка скачана.")).toBeVisible();
    await capture(page, width, "request-downloaded");
    await page.goto("/notifications");
    await expect(
      page
        .locator(".notice")
        .filter({ hasText: "Ваша справка готова" })
        .first(),
    ).toBeVisible();
    await capture(page, width, "notifications");
    await page.getByRole("button", { name: "Прочитать все" }).click();
    await expect(
      page.getByRole("link", { name: "Уведомления", exact: true }),
    ).toBeVisible();

    await page.goto("/profile");
    await expect(page.locator(".id-card")).toContainText(me.full_name);
    await capture(page, width, "profile");
    await page.getByRole("button", { name: "Данные студента" }).click();
    await expect(page.locator("#student-data")).toContainText(me.faculty);
    await capture(page, width, "profile-expanded");
    await page
      .getByRole("button", { name: "Редактировать контакты", exact: true })
      .click();
    await expect(page.getByLabel("Электронная почта")).toBeFocused();
    await page
      .getByLabel("Электронная почта")
      .fill(`campus.${width}@example.test`);
    await page.getByLabel("Телефон", { exact: true }).fill("123");
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("7–15 цифрами");
    await page
      .getByLabel("Телефон", { exact: true })
      .fill("+7 (000) 100-20-30");
    await capture(page, width, "profile-edit");
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Контакты сохранены");
    await page.reload();
    await page.getByRole("button", { name: "Данные студента" }).click();
    await expect(
      page.getByText(`campus.${width}@example.test`, { exact: true }),
    ).toBeVisible();
  });
}
