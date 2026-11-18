import { expect, type Page } from "@playwright/test";
const passwords: Record<string, string> = {
  "student.a": "DEMO_STUDENT_A_PASSWORD",
  "student.b": "DEMO_STUDENT_B_PASSWORD",
  "staff.a": "DEMO_STAFF_PASSWORD",
  "teacher.a": "DEMO_TEACHER_PASSWORD",
};
export const secret = (login: string) => process.env[passwords[login]]!;
export function scrub(message: string) {
  for (const login of Object.keys(passwords))
    if (secret(login)) message = message.replaceAll(secret(login), "[secret]");
  return message;
}
export async function login(page: Page, account = "student.a", method: "click" | "tap" = "click") {
  try {
    await page.goto("/");
    await page.getByLabel("Логин", { exact: true }).fill(account);
    await page.getByLabel("Пароль", { exact: true }).fill(secret(account));
    await page.getByRole("button", { name: "Войти в кабинет" })[method]();
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
