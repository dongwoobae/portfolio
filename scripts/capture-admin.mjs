// 로그인이 필요한 관리자 화면을 사람과 나눠서 찍는다.
//
//   node scripts/capture-admin.mjs <제어폴더>
//
// capture-desktop.mjs는 공개 화면만 찍는다. 관리자 화면은 자격증명이 있어야 하는데
// 그걸 스크립트에 넣고 싶지 않다. 그래서 이 스크립트는 창만 띄워 두고 기다린다 —
// 로그인과 화면 이동은 사람이 직접 하고, 셔터만 여기서 누른다. 뷰포트·스크롤바 제거·
// 애니메이션 정지가 capture-desktop.mjs와 같으므로 결과물이 나머지와 어긋나지 않는다.
//
// 제어는 <제어폴더>의 파일로 한다(터미널이 대화형이 아니라서 키 입력을 못 받는다).
//
//   shoot.json  {"slug":"ycc-admin-sermons","height":915,"url":"..."}  → 찍고 지운다
//   quit        아무 내용    → 창을 닫고 끝낸다
//
// 한 장 찍을 때마다 done-<slug>.json에 실제 저장 크기를 남긴다.

import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "screenshots");
const WIDTH = 1920;

const CONTROL_DIR = process.argv[2];
if (!CONTROL_DIR) {
  console.error("제어 폴더 경로를 인자로 줘야 한다.");
  process.exit(1);
}

// capture-desktop.mjs와 같은 정리 규칙이다. 둘이 어긋나면 결과물이 티가 난다.
const CLEANUP_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
  }
  ::-webkit-scrollbar { display: none !important; }
  html { scrollbar-width: none !important; }
`;

/** PNG 헤더(IHDR)에서 실제 저장 크기를 읽는다 — 요청한 뷰포트와 어긋나면 알아야 한다. */
async function pngSize(path) {
  const bytes = await readFile(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

await mkdir(CONTROL_DIR, { recursive: true });
await mkdir(OUT_DIR, { recursive: true });

// 헤드리스가 아니어야 사람이 로그인할 수 있다. 설치된 Chrome을 쓴다 —
// 번들 Chromium은 H.264 디코더가 없어 mp4가 검은 사각형으로 찍힌다.
const browser = await chromium
  .launch({ channel: "chrome", headless: false })
  .catch(() => chromium.launch({ headless: false }));
const context = await browser.newContext({
  viewport: { width: WIDTH, height: 917 },
  deviceScaleFactor: 1,
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
  reducedMotion: "reduce",
});
await context.newPage();

console.log(`창을 띄웠다. 제어 폴더: ${CONTROL_DIR}`);
console.log("로그인하고 찍을 화면까지 이동한 뒤 shoot.json을 넣어라.");

const shootPath = join(CONTROL_DIR, "shoot.json");
const quitPath = join(CONTROL_DIR, "quit");

for (;;) {
  const names = await readdir(CONTROL_DIR).catch(() => []);

  if (names.includes("quit")) {
    await unlink(quitPath).catch(() => {});
    break;
  }

  if (!names.includes("shoot.json")) {
    await sleep(1000);
    continue;
  }

  let order;
  try {
    order = JSON.parse(await readFile(shootPath, "utf8"));
  } catch {
    // 아직 쓰는 중일 수 있다. 다음 바퀴에 다시 본다.
    await sleep(300);
    continue;
  }
  await unlink(shootPath).catch(() => {});

  // 사람이 새 탭을 열었을 수 있으니 가장 최근 탭을 쓴다.
  const page = context.pages().at(-1);
  try {
    await page.bringToFront();
    if (order.url) {
      await page.goto(order.url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => {});
    }
    await page.setViewportSize({ width: WIDTH, height: order.height ?? 917 });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: CLEANUP_CSS });
    await sleep(order.settleMs ?? 1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(800);
    await page.evaluate((y) => window.scrollTo(0, y), order.scrollTo ?? 0);
    await sleep(800);

    const path = join(OUT_DIR, `${order.slug}.png`);
    await page.screenshot({ path });
    const size = await pngSize(path);
    console.log(`✓ ${order.slug} → ${size.width}x${size.height}`);
    await writeFile(
      join(CONTROL_DIR, `done-${order.slug}.json`),
      JSON.stringify({ ok: true, url: page.url(), ...size }),
    );
  } catch (error) {
    console.error(`✗ ${order.slug} ${error.message}`);
    await writeFile(
      join(CONTROL_DIR, `done-${order.slug}.json`),
      JSON.stringify({ ok: false, error: error.message }),
    );
  }
}

await browser.close();
console.log("끝.");
