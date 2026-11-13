import { expect, type Page } from "@playwright/test";
export const secret = (login: string) =>
  process.env[
    login === "student.a"
      ? "DEMO_STUDENT_A_PASSWORD"
      : login === "student.b"
        ? "DEMO_STUDENT_B_PASSWORD"
        : "DEMO_STAFF_PASSWORD"
  ]!;
export function scrub(message: string) {
  for (const login of ["student.a", "student.b", "staff.a"])
    if (secret(login)) message = message.replaceAll(secret(login), "[secret]");
  return message;
}
export async function login(page: Page, account = "student.a") {
  try {
    await page.goto("/");
    await page.getByLabel("Логин", { exact: true }).fill(account);
    await page.getByLabel("Пароль", { exact: true }).fill(secret(account));
    await page.getByRole("button", { name: "Войти в кабинет" }).click();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main h1")).toBeVisible();
  } catch (error) {
    throw new Error(scrub(String(error)));
  }
}
export async function noOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(
    sizes.content,
    `Page overflow at ${sizes.viewport}px on ${new URL(page.url()).pathname}`,
  ).toBeLessThanOrEqual(sizes.viewport + 1);
}
export async function settled(page: Page) {
  await expect(page.locator("main h1")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: /Загружаем|Открываем/ }),
  ).toHaveCount(0);
}
