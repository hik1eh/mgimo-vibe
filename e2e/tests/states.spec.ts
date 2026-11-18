import { test, expect } from "@playwright/test";
import { login, secret, scrub, noOverflow } from "./helpers";

test("login error, all profiles, session reload and logout", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Логин", { exact: true }).fill("student.a");
  await page.getByLabel("Пароль", { exact: true }).fill("incorrect-test-value");
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Неверный логин или пароль",
  );
  for (const account of ["student.a", "student.b", "staff.a"]) {
    await login(page, account);
    await page.goto("/profile");
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name:
          account === "student.a"
            ? "Алина Ветрова"
            : account === "student.b"
              ? "Марк Леснов"
              : "Ирина Речная",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Выйти", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Войти в кабинет" }),
    ).toBeVisible();
    expect((await page.request.get("/api/v1/me")).status()).toBe(401);
  }
});

test("network failure preserves text, retry and rapid submit create one request", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await login(page);
  await page.goto("/requests/new");
  const purpose = `Сетевой прогон ${Date.now()}`;
  await page.getByLabel("Место предъявления").fill(purpose);
  let fail = true;
  await page.route("**/api/v1/requests", (route) => {
    if (route.request().method() === "POST" && fail) {
      fail = false;
      return route.abort("failed");
    }
    return route.continue();
  });
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Не удалось связаться");
  await expect(page.getByLabel("Место предъявления")).toHaveValue(purpose);
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click({ clickCount: 2 });
  await expect(page).toHaveURL(/\/requests\/\d+$/);
  const url = page.url();
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(page.getByText(purpose, { exact: true })).toBeVisible();
  const rows = await (await page.request.get("/api/v1/requests")).json();
  expect(rows.filter((r: any) => r.purpose === purpose)).toHaveLength(1);
  await noOverflow(page);
});

test("expired session keeps the draft and traps focus during reauthentication", async ({
  page,
  context,
}) => {
  await login(page);
  await page.goto("/requests/new");
  const purpose = `Черновик после истечения ${Date.now()}`;
  await page.getByLabel("Место предъявления").fill(purpose);
  await context.clearCookies();
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Войдите снова" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Логин", { exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Войти в кабинет" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Логин", { exact: true })).toBeFocused();
  expect(await page.locator("[inert]").count()).toBe(1);
  try {
    await dialog.getByLabel("Логин", { exact: true }).fill("student.a");
    await dialog
      .getByLabel("Пароль", { exact: true })
      .fill(secret("student.a"));
    await dialog.getByRole("button", { name: "Войти в кабинет" }).click();
  } catch (e) {
    throw new Error(scrub(String(e)));
  }
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("Место предъявления")).toHaveValue(purpose);
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(page).toHaveURL(/\/requests\/\d+$/);
});

test("loading and empty announcements; long text and enlarged type stay inside page", async ({
  page,
}) => {
  await login(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/announcements", async (route) => {
    await gate;
    await route.fulfill({ json: [] });
  });
  await page.goto("/today");
  await expect(
    page.getByRole("status").filter({ hasText: "Загружаем объявления" }),
  ).toBeVisible();
  release();
  await expect(
    page.getByText("Новых объявлений нет.", { exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/v1/announcements");
  await page.route("**/api/v1/me", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({
      json: {
        ...data,
        full_name: "Александра-Мирослава Длиннофамильцева-Севернокампусная",
        direction:
          "Междисциплинарные исследования общественных коммуникаций и цифровой среды",
      },
    });
  });
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/profile");
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Александра-Мирослава Длиннофамильцева-Севернокампусная",
        exact: true,
      }),
    ).toBeVisible();
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "32px"),
    );
    await noOverflow(page);
    await page.screenshot({
      path: `/artifacts/after/large-type-${width}.png`,
      fullPage: true,
    });
  }
});
