import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, noOverflow } from "./helpers";

const baseURL = process.env.BASE_URL;

for (const width of [360, 1440]) {
  test(`directory, direction and a private dean message at ${width}px`, async ({ page, browser }) => {
    await page.setViewportSize({ width, height: 920 });
    await login(page);
    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    await expect(nav.getByRole("link")).toHaveText(["Сегодня", "Расписание", "Оценки", "Заявки"]);
    const trigger = page.getByRole("button", { name: "Дополнительно" });
    const before = await nav.boundingBox();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await nav.boundingBox()).toEqual(before);
    await page.getByRole("menuitem", { name: "Преподаватели" }).click();
    await expect(page).toHaveURL(/\/teachers$/);
    const directory = page.getByRole("region", { name: "Преподаватели моей группы" });
    await expect(directory.getByRole("heading", { name: "Лазурная Елена Андреевна" })).toBeVisible();
    await expect(directory).toContainText("Социология повседневности");
    await expect(directory).toContainText("e.lazurnaya@north-campus.example");
    await expect(directory).not.toContainText("Константин Денисович");
    await noOverflow(page);
    expect((await new AxeBuilder({ page }).include(".faculty-directory")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `/artifacts/other-functional/teachers-${width}.png`, fullPage: true });

    await page.getByRole("link", { name: "Профиль" }).click();
    await page.getByRole("button", { name: "Данные студента" }).click();
    const details = page.locator("#student-data");
    await expect(details.getByText("Направление", { exact: true })).toBeVisible();
    await expect(details.getByText("Социология", { exact: true })).toBeVisible();

    await nav.getByRole("link", { name: "Заявки" }).click();
    await page.getByRole("link", { name: "Заказать справку" }).click();
    const options = page.getByLabel("Тип заявки", { exact: true });
    await expect(options.locator("option")).toHaveText([
      "Справка об обучении", "Справка для стажировки или практики", "Справка для военкомата",
      "Направление на пересдачу", "Академический отпуск", "Обращение в деканат",
    ]);
    await options.selectOption("academic_leave");
    await expect(page.getByLabel("Период и причина")).toBeVisible();
    await nav.getByRole("link", { name: "Заявки" }).click();
    await page.getByRole("link", { name: "Написать в деканат" }).click();
    await expect(page.getByLabel("Тип заявки", { exact: true })).toHaveValue("dean_message");
    const question = `Когда можно уточнить расписание вымышленной практики? Проверка ${width}`;
    await page.getByLabel("Ваше сообщение").fill(question);
    await noOverflow(page);
    await page.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(page).toHaveURL(/\/requests\/\d+$/);
    const path = new URL(page.url()).pathname;
    await page.reload();
    await expect(page.getByText(question, { exact: true })).toBeVisible();

    const staff = await browser.newContext({ baseURL, viewport: { width, height: 920 } });
    try {
      const dean = await staff.newPage();
      await login(dean, "staff.a");
      await dean.goto(path);
      await dean.getByRole("button", { name: "Взять в работу" }).click();
      const answer = `Вымышленная практика обсуждается на консультации. Ответ ${width}`;
      await dean.getByLabel("Ответ или уточнение").fill(answer);
      await dean.getByRole("button", { name: "Отправить ответ", exact: true }).click();
      await expect(dean.getByText(answer, { exact: true })).toBeVisible();
      await page.reload();
      await page.getByRole("link", { name: "Читать ответ деканата" }).click();
      await expect(page.getByText(answer, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Скачать PDF" })).toHaveCount(0);
      await noOverflow(page);
      await page.screenshot({ path: `/artifacts/other-functional/dean-reply-${width}.png`, fullPage: true });
    } finally {
      await staff.close();
    }
  });

  test(`teacher journal updates student and semester stories at ${width}px`, async ({ page, browser }) => {
    await page.setViewportSize({ width, height: 920 });
    await login(page, "teacher.a");
    await expect(page).toHaveURL(/\/teaching$/);
    await expect(page.getByRole("heading", { name: "Учебный журнал" })).toBeVisible();
    await page.getByRole("link", { name: /Открыть журнал · Социология повседневности/ }).first().click();
    await expect(page).toHaveURL(/\/teaching\/lessons\/\d+$/);
    const attendance = page.getByLabel("Посещаемость");
    const checkpoint = page.getByLabel("Контрольная точка");
    await expect(attendance).toBeVisible();
    const nextAttendance = await attendance.inputValue() === "absent" ? "present" : "absent";
    const nextCheckpoint = await checkpoint.inputValue() === "pending" ? "completed" : "pending";
    await attendance.selectOption(nextAttendance);
    await checkpoint.selectOption(nextCheckpoint);
    await page.getByRole("button", { name: "Сохранить отметки" }).click();
    await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Отметки сохранены" })).toBeVisible();
    await page.reload();
    await expect(attendance).toHaveValue(nextAttendance);
    await expect(checkpoint).toHaveValue(nextCheckpoint);
    await noOverflow(page);
    await page.screenshot({ path: `/artifacts/other-functional/journal-${width}.png`, fullPage: true });

    const student = await browser.newContext({ baseURL, viewport: { width, height: 920 } });
    try {
      const learner = await student.newPage();
      await login(learner);
      await learner.getByRole("link", { name: "Оценки", exact: true }).click();
      const scores = await (await learner.request.get("/api/v1/academic-results?semester=3")).json();
      const engagement = scores.engagement;
      expect(engagement[nextAttendance]).toBeGreaterThanOrEqual(1);
      expect(engagement[nextCheckpoint]).toBeGreaterThanOrEqual(1);
      const summary = learner.getByRole("region", { name: "Посещаемость и контрольные точки" });
      const lessons = `${engagement.present} из ${engagement.present + engagement.absent}`;
      const checkpoints = `Выполнено ${engagement.completed} из ${engagement.completed + engagement.pending}`;
      await expect(summary).toContainText(lessons);
      await expect(summary).toContainText(checkpoints);
      await learner.getByRole("button", { name: "Смотреть итоги" }).click();
      const dialog = learner.getByRole("dialog");
      for (let index = 0; index < 3; index++)
        await dialog.getByRole("button", { name: "Далее", exact: true }).click();
      await expect(dialog.getByRole("heading", { name: "Посещаемость и контрольные точки" })).toBeVisible();
      await expect(dialog).toContainText(lessons);
      await expect(dialog).toContainText(checkpoints);
      await noOverflow(learner);
      await learner.screenshot({ path: `/artifacts/other-functional/stories-${width}.png` });
    } finally {
      await student.close();
    }
  });
}
