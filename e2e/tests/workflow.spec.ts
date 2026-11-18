import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, noOverflow } from "./helpers";

test("certificate UI end to end, clarification, notification, PDF and foreign denials", async ({
  browser,
  page,
}) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 360, height: 1000 });
  await login(page);
  await page.getByRole("link", { name: "Заказать справку ＋" }).click();
  const purpose = `Браузерный сценарий ${Date.now()}`;
  await page.getByLabel("Место предъявления").fill(purpose);
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(page).toHaveURL(/\/requests\/\d+$/);
  const id = page.url().split("/").at(-1)!;
  await page.reload();
  await expect(page.getByText(purpose, { exact: true })).toBeVisible();
  const staffContext = await browser.newContext({
    baseURL: process.env.BASE_URL,
    locale: "ru-RU",
    viewport: { width: 1440, height: 1000 },
  });
  const staff = await staffContext.newPage();
  await login(staff, "staff.a");
  const number = (
    await (await page.request.get(`/api/v1/requests/${id}`)).json()
  ).number;
  await staff
    .locator(".request-picker-row")
    .filter({ hasText: number })
    .click();
  await staff
    .getByRole("button", { name: "Взять в работу", exact: true })
    .click();
  await staff
    .getByLabel("Вопрос студенту")
    .fill("Для какой вымышленной организации нужна справка?");
  await staff
    .getByRole("button", { name: "Запросить уточнение", exact: true })
    .click();
  await expect(
    staff.getByRole("heading", { name: "Ждём ответ студента" }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Ваш ответ").fill("Для учебного центра «Орбита».");
  await noOverflow(page);
  await page.screenshot({
    path: "/artifacts/after/clarification-360.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Отправить ответ", exact: true })
    .click();
  await expect(
    page.getByText("Для учебного центра «Орбита».", { exact: true }),
  ).toBeVisible();
  await staff.reload();
  await staff
    .getByRole("button", { name: "Отметить готовой", exact: true })
    .click();
  await expect(
    staff.getByRole("heading", { name: "Документ готов" }),
  ).toBeVisible();
  await page.goto("/notifications");
  await page
    .getByRole("button")
    .filter({ hasText: "Ваша справка готова" })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/requests/${id}$`));
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать PDF", exact: true }).click();
  const download = await downloaded;
  await download.saveAs("/artifacts/certificate-ui.pdf");
  expect(await download.failure()).toBeNull();
  await expect(page.getByText("Демонстрационная справка скачана.")).toBeVisible();
  const scan = await new AxeBuilder({ page })
    .include(".ready-document .success")
    .withRules(["color-contrast"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.screenshot({
    path: "/artifacts/after/certificate-ready-360.png",
    fullPage: true,
  });
  const notices = await (
    await page.request.get("/api/v1/notifications")
  ).json();
  const notice = notices.find((n: any) => String(n.request_id) === id);
  expect(notice.read).toBe(true);
  const otherContext = await browser.newContext({
    baseURL: process.env.BASE_URL,
    locale: "ru-RU",
  });
  const other = await otherContext.newPage();
  await login(other, "student.b");
  await other.goto(`/requests/${id}`);
  await expect(other.getByRole("alert")).toContainText("Заявка недоступна");
  for (const path of [
    `/requests/${id}`,
    `/requests/${id}/document`,
    `/notifications/${notice.id}`,
  ])
    expect((await other.request.get("/api/v1" + path)).status()).toBe(404);
  await other.goto("/requests/new");
  await other
    .getByLabel("Место предъявления")
    .fill("Проверка чужого факультета");
  await other
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(other).toHaveURL(/\/requests\/\d+$/);
  const foreignId = other.url().split("/").at(-1)!;
  await staff.goto(`/requests/${foreignId}`);
  await expect(staff.getByRole("alert")).toContainText("Заявка недоступна");
  await staffContext.close();
  await otherContext.close();
});

test("staff UI changes lesson, publishes, edits and withdraws targeted announcement", async ({
  browser,
  page,
}) => {
  test.setTimeout(180000);
  await login(page, "staff.a");
  await page.goto("/staff/schedule");
  await page.getByLabel("Дисциплина или преподаватель").fill("Консультация");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "Консультация по социологии",
        exact: true,
      }),
    })
    .click();
  const lessonId = page.url().split("/").at(-1)!;
  await page.getByLabel("Аудитория", { exact: true }).fill("412");
  await page
    .getByLabel("Причина изменения или отмены")
    .fill("Перенос для браузерного прогона.");
  await page
    .getByRole("button", { name: "Сохранить изменение", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Опубликовать объявление →", exact: true })
    .click();
  const title = `Консультация группы — UI ${Date.now()}`;
  await page.getByLabel("Заголовок", { exact: true }).fill(title);
  await page.getByLabel("Состояние", { exact: true }).selectOption("published");
  await expect(page.getByLabel("Группа", { exact: true })).not.toHaveValue("");
  await expect(page.getByLabel("Связанное занятие")).toHaveValue(lessonId);
  await page
    .getByRole("button", { name: "Сохранить и опубликовать", exact: true })
    .click();
  await expect(page).toHaveURL(/\/staff\/announcements\/\d+$/);
  const announcementId = page.url().split("/").at(-1)!;
  const aContext = await browser.newContext({
    baseURL: process.env.BASE_URL,
    locale: "ru-RU",
    viewport: { width: 360, height: 1000 },
  });
  const a = await aContext.newPage();
  await login(a);
  const card = a.locator(".news-tile").filter({ hasText: title });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText("412");
  await card.click();
  await a
    .getByRole("dialog")
    .getByRole("link", { name: /^Открыть занятие/ })
    .click();
  await expect(a.locator(".room-number")).toHaveText("412");
  await expect(a.locator(".lesson-change")).toContainText("305");
  await a.getByRole("link", { name: "Показать маршрут", exact: true }).click();
  await expect(a.locator("main h1")).toHaveText("Маршрут до аудитории");
  await expect(a.locator('[data-route-segment="1"]')).toBeVisible();
  await a.getByRole("button", { name: /Подняться на 4-й этаж/ }).click();
  await expect(a.locator('[data-route-segment="4"]')).toBeVisible();
  await expect(a.getByText("Аудитория 412", { exact: true })).toBeVisible();
  await a.goto("/notifications");
  const unread = a.getByRole("link", { name: /^Уведомления, непрочитанных:/ });
  await expect(unread).toBeVisible();
  await a
    .getByRole("button", {
      name: /Занятие перенесено.*Консультация по социологии/,
    })
    .click();
  await expect(a.locator(".room-number")).toHaveText("412");
  const bContext = await browser.newContext({
    baseURL: process.env.BASE_URL,
    locale: "ru-RU",
  });
  const b = await bContext.newPage();
  await login(b, "student.b");
  await expect(b.getByText(title, { exact: true })).toHaveCount(0);
  await b.goto(`/announcements/${announcementId}`);
  await expect(b.getByRole("alert")).toContainText("Объявление недоступно");
  await page
    .getByLabel("Текст", { exact: true })
    .fill("Исправленный текст адресного объявления.");
  await page
    .getByRole("button", { name: "Сохранить и опубликовать", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Объявление сохранено");
  await a.goto(`/announcements/${announcementId}`);
  await expect(
    a.getByText("Исправленный текст адресного объявления.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Состояние", { exact: true }).selectOption("withdrawn");
  await page
    .getByRole("button", { name: "Снять с публикации", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Объявление сохранено");
  await a.reload();
  await expect(a.getByRole("alert")).toContainText("Объявление недоступно");
  await page.goto("/staff/schedule?q=Методы");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "Методы социальных исследований",
        exact: true,
      }),
    })
    .click();
  await page
    .getByLabel("Причина изменения или отмены")
    .fill("Отмена для браузерного прогона.");
  await page
    .getByRole("button", { name: "Отменить занятие", exact: true })
    .click();
  await expect(
    page.getByText("Занятие отменено. Повторная отмена и правка закрыты."),
  ).toBeVisible();
  const cancelledId = page.url().split("/").at(-1)!;
  await a.goto(`/schedule/${cancelledId}`);
  await expect(
    a.getByRole("heading", { name: "Занятие отменено" }),
  ).toBeVisible();
  await aContext.close();
  await bContext.close();
});
