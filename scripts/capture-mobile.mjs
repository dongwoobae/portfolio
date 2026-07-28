// 프로젝트 상세 페이지에 쓰는 모바일 스크린샷을 라이브 사이트에서 다시 찍는다.
//
//   node scripts/capture-mobile.mjs            # 전부
//   node scripts/capture-mobile.mjs ycc-website worldengco   # 일부만
//
// 데스크톱 스크린샷은 디자인 핸드오프에서 가져온 원본이라 여기서 건드리지 않는다.
// 관리자 화면은 로그인이 필요해 자동 촬영 대상이 아니다 — 공개 화면만 찍는다.

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "screenshots", "mobile");

// 논리 가로폭은 iPhone 14 기준으로 고정한다. deviceScaleFactor 2로 찍으므로
// PNG 가로는 항상 780이다(assets.test.ts가 이 약속을 검사한다).
const WIDTH = 390;
const SCALE = 2;
// 세로는 기기 높이(844)가 기본이고, 한 화면에 더 담아야 하는 곳만 target에서 늘린다.
const DEFAULT_HEIGHT = 844;

const TARGETS = [
  {
    slug: "modu-campus",
    url: "https://korea-univ-project.vercel.app",
    // 지도 타일과 마커가 다 그려질 때까지 기다린다.
    settleMs: 4000,
  },
  { slug: "ankang-sumgim", url: "https://sumgim-welfare.com" },
  {
    slug: "ycc-website",
    // 홈 첫 화면은 로고만 있는 인트로 스플래시라 찍어도 빈 화면이다.
    // 설교 목록이 이 사이트에서 제일 많이 쓰이는 화면이라 그쪽을 찍는다.
    url: "https://www.ycjc.kr/sermons",
    // 서브 히어로·서브내비·필터·영상 카드까지 한 장에 담으려면 기기 높이로는 모자란다.
    height: 1200,
    settleMs: 3500,
  },
  {
    slug: "worldengco",
    url: "https://worldengco-website.dongwoobae.workers.dev/",
  },
  { slug: "hmsu", url: "https://hmsu.kr" },
];

// 스크롤바와 진입 애니메이션이 화면에 남으면 정지 이미지에서 어색하다.
const CLEANUP_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
  }
  ::-webkit-scrollbar { display: none !important; }
  html { scrollbar-width: none !important; }
`;

async function capture(browser, target) {
  const context = await browser.newContext({
    ...devices["iPhone 14"],
    viewport: { width: WIDTH, height: target.height ?? DEFAULT_HEIGHT },
    deviceScaleFactor: SCALE,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto(target.url, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    // networkidle은 폴링·소켓을 쓰는 사이트에서 영영 안 오기도 한다. 실패해도 계속 간다.
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: CLEANUP_CSS });
    await page.waitForTimeout(target.settleMs ?? 1500);
    // 지연 로드 이미지를 깨운 뒤 찍을 위치로 돌아온다(기본은 맨 위).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.evaluate((y) => window.scrollTo(0, y), target.scrollTo ?? 0);
    await page.waitForTimeout(800);

    const path = join(OUT_DIR, `${target.slug}-mobile.png`);
    await page.screenshot({ path });
    console.log(`✓ ${target.slug.padEnd(16)} ${target.url}`);
    return true;
  } catch (error) {
    console.error(`✗ ${target.slug.padEnd(16)} ${error.message}`);
    return false;
  } finally {
    await context.close();
  }
}

const only = process.argv.slice(2);
const targets = only.length
  ? TARGETS.filter((t) => only.includes(t.slug))
  : TARGETS;

if (!targets.length) {
  console.error(
    `대상 없음. 사용 가능: ${TARGETS.map((t) => t.slug).join(", ")}`,
  );
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const target of targets) results.push(await capture(browser, target));
await browser.close();

const failed = results.filter((ok) => !ok).length;
if (failed) {
  console.error(`\n${failed}장 실패 — 위 오류를 보고 다시 실행한다.`);
  process.exit(1);
}
console.log(`\n${results.length}장 저장 → public/screenshots/mobile/`);
