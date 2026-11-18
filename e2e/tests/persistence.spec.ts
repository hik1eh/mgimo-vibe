import { test, expect } from "@playwright/test";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { login } from "./helpers";

test("browser sessions and all records survive app and database container restart", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  await login(page);
  await page.goto("/requests/new");
  const purpose = `Сохранность Docker ${Date.now()}`;
  await page.getByLabel("Место предъявления").fill(purpose);
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await expect(page).toHaveURL(/\/requests\/\d+$/);
  const teacherContext = await browser.newContext({ baseURL: process.env.BASE_URL });
  const teacher = await teacherContext.newPage();
  await login(teacher, "teacher.a");
  const lessons = await (await teacher.request.get("/api/v1/teaching/lessons")).json();
  const taught = lessons.find((lesson: { status: string; semester: number | null }) =>
    lesson.status !== "cancelled" && lesson.semester !== null,
  );
  const journalPath = `/api/v1/teaching/lessons/${taught.id}`;
  await teacher.goto(`/teaching/lessons/${taught.id}`);
  const checkpoint = teacher.getByLabel("Контрольная точка");
  const nextCheckpoint = await checkpoint.inputValue() === "completed" ? "pending" : "completed";
  await checkpoint.selectOption(nextCheckpoint);
  await teacher.getByRole("button", { name: "Сохранить отметки" }).click();
  await expect(teacher.getByRole("status").filter({ hasText: "Отметки сохранены" })).toBeVisible();
  const savedJournal = await (await teacher.request.get(journalPath)).json();
  const paths = [
    "/me",
    "/requests",
    "/notifications",
    "/schedule",
    "/academic-results",
    "/announcements",
  ];
  const snapshots = new Map();
  for (const path of paths)
    snapshots.set(
      path,
      await (await page.request.get("/api/v1" + path)).json(),
    );
  const staffContext = await browser.newContext({
    baseURL: process.env.BASE_URL,
  });
  const staff = await staffContext.newPage();
  await login(staff, "staff.a");
  const staffPaths = ["/staff/schedule", "/staff/announcements"];
  for (const path of staffPaths)
    snapshots.set(
      path,
      await (await staff.request.get("/api/v1" + path)).json(),
    );
  const run = String(Date.now());
  writeFileSync("/artifacts/restart-ready.json", JSON.stringify({ run }));
  console.log(
    "READY: waiting for app and database restart; credentials remain only in browser memory.",
  );
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    if (
      existsSync("/artifacts/restart-done.json") &&
      JSON.parse(readFileSync("/artifacts/restart-done.json", "utf8")).run ===
        run
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  expect(Date.now()).toBeLessThan(deadline);
  for (const path of paths)
    expect(
      await (await page.request.get("/api/v1" + path)).json(),
      path,
    ).toEqual(snapshots.get(path));
  expect(await (await teacher.request.get(journalPath)).json()).toEqual(savedJournal);
  await teacher.reload();
  await expect(checkpoint).toHaveValue(nextCheckpoint);
  for (const path of staffPaths)
    expect(
      await (await staff.request.get("/api/v1" + path)).json(),
      path,
    ).toEqual(snapshots.get(path));
  await page.reload();
  await expect(page.getByText(purpose, { exact: true })).toBeVisible();
  await page.screenshot({
    path: "/artifacts/after/persisted-after-docker-restart.png",
    fullPage: true,
  });
  await staffContext.close();
  await teacherContext.close();
});
