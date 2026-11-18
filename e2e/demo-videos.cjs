const { chromium } = require("playwright");
const { mkdir } = require("node:fs/promises");

const baseURL = process.env.BASE_URL || "http://web:8000";
const output = "/artifacts/final-mvp/video";
const viewport = { width: 1280, height: 900 };
const secrets = [
  process.env.DEMO_STUDENT_A_PASSWORD,
  process.env.DEMO_STAFF_PASSWORD,
];
const options = {
  baseURL,
  viewport,
  locale: "ru-RU",
  timezoneId: "Europe/Moscow",
  reducedMotion: "reduce",
};

async function session(browser, username, password) {
  const context = await browser.newContext(options);
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByLabel("Логин", { exact: true }).fill(username);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Войти в кабинет" }).click();
    await page.locator(".cabinet-app").waitFor();
    return (await context.storageState()).cookies;
  } finally {
    await context.close();
  }
}

async function as(page, cookies, target) {
  await page.evaluate(() => {
    try {
      sessionStorage.clear();
    } catch {
      /* Initial blank page. */
    }
  });
  await page.context().clearCookies();
  await page.context().addCookies(cookies);
  await page.goto(target);
  await page.locator("main h1").waitFor();
}

async function beat(page, label, duration = 1500) {
  await page.locator("main").evaluate(
    (main, { text }) => {
      const tag = document.createElement("span");
      tag.textContent = text;
      tag.dataset.videoCaption = "";
      Object.assign(tag.style, {
        position: "fixed",
        zIndex: "100",
        bottom: "16px",
        left: "16px",
        padding: "10px 14px",
        borderRadius: "9px",
        background: "#102a40",
        color: "white",
        font: "650 14px Manrope, sans-serif",
        pointerEvents: "none",
        boxShadow: "0 3px 15px #102a4044",
      });
      document.querySelector("[data-video-caption]")?.remove();
      main.append(tag);
    },
    { text: label },
  );
  await page.waitForTimeout(duration);
}

async function record(browser, name, run) {
  const context = await browser.newContext({
    ...options,
    recordVideo: { dir: output, size: viewport },
  });
  const page = await context.newPage();
  const video = page.video();
  try {
    await run(page);
    await context.close();
    await video.saveAs(`${output}/${name}.webm`);
    await video.delete();
    console.log(`PASS ${name}.webm`);
  } catch (error) {
    await context.close();
    await video.delete();
    throw error;
  }
}

(async () => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const student = await session(browser, "student.a", secrets[0]);
    const staff = await session(browser, "staff.a", secrets[1]);
    await record(browser, "lesson-move-and-route", async (page) => {
      await as(page, staff, "/staff/schedule");
      await page
        .getByLabel("Дисциплина или преподаватель")
        .fill("Консультация");
      await page
        .getByRole("link")
        .filter({
          has: page.getByRole("heading", {
            name: "Консультация по социологии",
            exact: true,
          }),
        })
        .click();
      await page.waitForURL(/\/staff\/schedule\/\d+$/);
      const id = new URL(page.url()).pathname.split("/").at(-1);
      const room = page.getByLabel("Аудитория", { exact: true });
      await room.waitFor();
      if ((await room.inputValue()) !== "305")
        throw new Error("Use clean QA records for the 305 → 412 recording.");
      await beat(page, "Сотрудник · меняет аудиторию 305 → 412");
      await room.fill("412");
      await page
        .getByLabel("Причина изменения или отмены")
        .fill("Консультация переносится в аудиторию 412.");
      await page
        .getByRole("button", { name: "Сохранить изменение", exact: true })
        .click();
      await page.getByRole("link", { name: /Опубликовать объявление/ }).click();
      const title = "Консультация в новой аудитории";
      await page.getByLabel("Заголовок", { exact: true }).fill(title);
      await page
        .getByLabel("Состояние", { exact: true })
        .selectOption("published");
      await beat(page, "Сотрудник · публикация своей группе");
      await page
        .getByRole("button", { name: "Сохранить и опубликовать", exact: true })
        .click();
      await page.waitForURL(/\/staff\/announcements\/\d+$/);
      const publishedId = new URL(page.url()).pathname.split("/").at(-1);

      await as(page, student, "/notifications");
      const notice = page.locator(".notice").filter({ hasText: title });
      await notice.scrollIntoViewIfNeeded();
      await beat(page, "Студент · открывает уведомление о переносе");
      await notice.click();
      await page.waitForURL(`**/announcements/${publishedId}`);
      await page.locator(`.linked-lesson a[href="/schedule/${id}"]`).click();
      await page.waitForURL(new RegExp(`/schedule/${id}(?:\\?|$)`));
      const destination = page.locator(".room-number");
      await destination.waitFor();
      if ((await destination.textContent())?.trim() !== "412")
        throw new Error("Unexpected route destination.");
      await beat(page, "Карточка занятия · новая аудитория 412");
      await page
        .getByRole("link", { name: "Показать маршрут", exact: true })
        .click();
      await page.locator('[data-route-segment="1"]').waitFor();
      await beat(page, "Первый этаж · главный вход и лифт", 2300);
      await page.getByRole("button", { name: /Подняться на 4-й этаж/ }).click();
      await page.locator('[data-route-segment="4"]').waitFor();
      await beat(page, "Четвёртый этаж · от лифта до двери 412", 2600);
    });
    await record(browser, "certificate-and-pdf", async (page) => {
      await as(page, student, "/requests/new");
      await page
        .getByLabel("Место предъявления")
        .fill("Вымышленный учебный центр «Орбита»");
      await beat(page, "Студент · заказывает справку об обучении");
      await page
        .getByRole("button", { name: "Отправить заявку", exact: true })
        .click();
      await page.waitForURL(/\/requests\/\d+$/);
      const id = new URL(page.url()).pathname.split("/").at(-1);
      const request = await (
        await page.request.get(`/api/v1/requests/${id}`)
      ).json();
      await page
        .getByText(`Заявка ${request.number} принята.`, { exact: true })
        .waitFor();
      await beat(page, "Номер заявки и текущий этап");

      await as(page, staff, "/requests");
      await page
        .locator(".request-picker-row")
        .filter({ hasText: request.number })
        .click();
      await beat(page, "Сотрудник · открывает заявку своего факультета");
      await page
        .getByRole("button", { name: "Взять в работу", exact: true })
        .click();
      const complete = page.getByRole("button", {
        name: "Отметить готовой",
        exact: true,
      });
      await complete.waitFor();
      await beat(page, "Сотрудник · выдаёт демонстрационный PDF");
      await complete.click();
      await page
        .getByRole("heading", { name: "Документ готов", exact: true })
        .waitFor();
      await beat(page, "Справка готова");

      await as(page, student, "/notifications");
      await page
        .locator(".notice")
        .filter({ hasText: "Ваша справка готова" })
        .first()
        .click();
      const button = page.getByRole("button", {
        name: "Скачать PDF",
        exact: true,
      });
      await button.waitFor();
      await beat(page, "Студент · получает готовую справку");
      const event = page.waitForEvent("download");
      await button.click();
      const download = await event;
      if (await download.failure())
        throw new Error("Could not download the PDF.");
      await download.saveAs(`${output}/certificate-demo.pdf`);
      await beat(page, "PDF скачан в кабинете студента", 2500);
    });
  } finally {
    await browser.close();
  }
})().catch((failure) => {
  let message = failure.message;
  for (const secret of secrets)
    if (secret) message = message.replaceAll(secret, "[secret]");
  console.error(message);
  process.exitCode = 1;
});
