// Capture transparent fallback frames from the running application's WebGL scene.
const { chromium } = require("playwright");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");

async function shot(page, kind, output) {
  const scene = page.locator(`[data-campus-model="${kind}"]`).first();
  await scene.waitFor();
  await scene.evaluate((element) => {
    for (let parent = element; parent; parent = parent.parentElement) {
      parent.style.setProperty("background", "transparent", "important");
      parent.style.setProperty("overflow", "visible", "important");
      parent.style.setProperty("transform", "none", "important");
    }
    element.classList.add("capture-webgl");
    const style = document.createElement("style");
    style.textContent = `
      body * { visibility: hidden !important; }
      .capture-webgl, .capture-webgl canvas { visibility: visible !important; }
      .capture-webgl { position: fixed !important; inset: 0 auto auto 0 !important; width: 900px; height: 400px; }
    `;
    document.head.append(style);
  });
  const canvas = scene.locator("canvas[data-campus-canvas]");
  await canvas.waitFor();
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".capture-webgl canvas");
    return (
      canvas?.width === 900 && canvas?.height === 400 && canvas.dataset.yaw
    );
  });
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: 900, height: 400 },
    omitBackground: true,
  });
  const webp = await page.evaluate(
    async (pngUrl) => {
      const image = new Image();
      image.src = pngUrl;
      await image.decode();
      const raster = document.createElement("canvas");
      raster.width = image.width;
      raster.height = image.height;
      raster.getContext("2d").drawImage(image, 0, 0);
      return raster.toDataURL("image/webp", 0.94).split(",")[1];
    },
    `data:image/png;base64,${png.toString("base64")}`,
  );
  await writeFile(
    path.join(output, `${kind}.webp`),
    Buffer.from(webp, "base64"),
  );
  console.log(`${kind}: WebGL frame · 900 × 400`);
}

async function signIn(context, login, password) {
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Логин", { exact: true }).fill(login);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  await page.locator(".cabinet-app").waitFor();
  return page;
}

(async () => {
  const output = "/artifacts/final-mvp/models";
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const options = {
    baseURL: process.env.BASE_URL || "http://web:8000",
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  };
  try {
    const student = await signIn(
      await browser.newContext(options),
      "student.a",
      process.env.DEMO_STUDENT_A_PASSWORD,
    );
    for (const [kind, url] of Object.entries({
      campus: "/today",
      atrium: "/schedule",
      record: "/academic-results",
      letter: "/requests",
      bell: "/notifications",
      clip: "/profile",
    })) {
      await student.goto(url);
      await shot(student, kind, output);
    }
    const staff = await signIn(
      await browser.newContext(options),
      "staff.a",
      process.env.DEMO_STAFF_PASSWORD,
    );
    await shot(staff, "archive", output);
  } finally {
    await browser.close();
  }
})().catch((failure) => {
  let message = failure.message;
  for (const secret of [
    process.env.DEMO_STUDENT_A_PASSWORD,
    process.env.DEMO_STAFF_PASSWORD,
  ]) {
    if (secret) message = message.replaceAll(secret, "[secret]");
  }
  console.error(message);
  process.exitCode = 1;
});
