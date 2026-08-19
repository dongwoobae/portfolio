import { expect, test, type Locator } from "@playwright/test";
import { gotoPage } from "./navigation";

const PROJECT_SLUGS = [
  "modu-campus",
  "ankang-sumgim",
  "ycc-website",
  "worldengco",
  "hmsu",
];

test("메인에 레일·히어로·전 섹션이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("배동우");
  // 후킹 문장은 타이핑을 기다리지 않고 첫 화면에 바로 떠 있어야 한다.
  await expect(page.getByText("도메인을 먼저")).toBeInViewport();
  await expect(page.getByText("기능을 설계합니다.")).toBeInViewport();
  await expect(
    page.getByRole("img", { name: "배동우 프로필 사진" }),
  ).toBeVisible();
  // 타이핑 중에도 DOM에는 전문이 있어야 한다 (sr-only).
  await expect(
    page.getByRole("heading", { name: "Backend-driven Fullstack Developer" }),
  ).toBeAttached();

  for (const prompt of [
    "$ cat perspective.md",
    "$ git log --career",
    "$ ls team/",
  ]) {
    await expect(page.getByText(prompt, { exact: true })).toBeVisible();
  }
  for (const label of [
    "경력",
    "하이라이트",
    "프로젝트",
    "교육과정 팀 프로젝트",
  ]) {
    await expect(
      page.getByRole("region", { name: label, exact: true }),
    ).toBeVisible();
  }
});

test("메인 프로젝트 목록이 5행이고 상세로 연결된다", async ({ page }) => {
  await page.goto("/");

  const rows = page
    .getByRole("region", { name: "프로젝트", exact: true })
    .getByRole("link");
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText("모두의 캠퍼스");

  await rows.first().click();
  await expect(page).toHaveURL("/projects/modu-campus");
});

test("레일 네비가 해당 섹션으로 이동시킨다", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "섹션 바로가기" })
    .getByRole("link", { name: "projects" })
    .click();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("region", { name: "프로젝트", exact: true }),
  ).toBeInViewport();
});

test("프로젝트 상세 5장이 모두 뜨고 스크린샷이 로드된다", async ({ page }) => {
  for (const slug of PROJECT_SLUGS) {
    const response = await gotoPage(page, `/projects/${slug}`);
    expect(response?.status(), `${slug} 응답`).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(`projects/${slug}`)).toBeVisible();

    // 바이트가 실제로 도착하는지는 페이지마다 대표 한 장으로만 확인한다.
    const hero = page.getByRole("img").first();
    await expect(hero).toBeVisible();
    await expectLoaded(hero, `${slug} 대표 스크린샷`);
    await expectUncropped(hero, `${slug} 대표 스크린샷`);
  }
});

/**
 * 경로가 틀리거나 최적화가 실패하면 자연 크기가 0으로 남는다.
 * 실제로 바이트가 도착했는지는 이 함수만 본다 — 대표 스크린샷에만 쓴다.
 */
async function expectLoaded(shot: Locator, label: string) {
  await expect
    .poll(() => shot.evaluate((img: HTMLImageElement) => img.naturalWidth), {
      message: `${label} 로드`,
      timeout: 60_000,
    })
    .toBeGreaterThan(0);
}

/**
 * 고정 높이 + object-cover로 그리면 와이드 스크린샷의 좌우가 잘려 나간다.
 * 그려진 비율이 원본 비율과 같은지로 잘림을 잡는다.
 *
 * 원본 비율은 `naturalWidth`가 아니라 **width/height 속성**에서 읽는다.
 * next/image가 정적 임포트의 원본 치수를 그대로 심어 두므로 이미지 바이트가
 * 한 장도 도착하지 않아도 값이 있다. 실제로 /_next/image 응답을 전부 막고
 * 재 봐도 그려진 비율과 최대 0.004 차이로 일치한다.
 *
 * 이 구분이 중요하다 — 예전에는 잘림 판정이 로드 완료를 기다렸고, 그래서
 * dev 서버 이미지 최적화가 밀리면 레이아웃과 무관한 이유로 깨졌다. CI에서
 * 재시도 2회까지 전부 실패한 것이 이 경우이고, 한 번 실패에 192초를 썼다.
 */
async function expectUncropped(shot: Locator, label: string) {
  const ratios = await shot.evaluate((img: HTMLImageElement) => ({
    drawn: img.clientWidth / img.clientHeight,
    source:
      Number(img.getAttribute("width")) / Number(img.getAttribute("height")),
  }));
  expect(
    Number.isFinite(ratios.source) && ratios.source > 0,
    `${label}에 원본 치수 속성이 없다 — next/image가 정적 임포트를 못 받았다`,
  ).toBe(true);
  expect(
    Math.abs(ratios.drawn - ratios.source),
    `${label}이 잘렸다 (그려진 ${ratios.drawn.toFixed(3)} vs 원본 ${ratios.source.toFixed(3)})`,
  ).toBeLessThan(0.02);
}

// 잘림은 CaseStudyShots의 레이아웃 문제라 줄 구성별로 한 장씩만 보면 잡힌다.
// ROW에 있는 1·2·3장 줄을 전부 지나가도록 두 페이지를 훑는다 —
// modu-campus가 2장·3장·1장, worldengco가 2장·3장이다.
// (나머지 3장은 위 테스트가 대표 스크린샷 한 장씩 확인한다.)
const UNCROPPED_PAGES = [
  { slug: "modu-campus", shots: 7 }, // 데스크톱 6 + 모바일 1
  { slug: "worldengco", shots: 6 }, // 데스크톱 5 + 모바일 1
];

test("상세 스크린샷이 줄 구성과 무관하게 잘리지 않는다", async ({ page }) => {
  for (const { slug, shots: expected } of UNCROPPED_PAGES) {
    await gotoPage(page, `/projects/${slug}`);

    const shots = page.locator("figure img");
    await expect(shots.first()).toBeVisible();

    const count = await shots.count();
    expect(count, `${slug}의 스크린샷 장수`).toBe(expected);

    // 이미지 바이트를 기다리지 않는다 — 레이아웃만 보는 테스트다.
    // 실제 로드 여부는 위 "프로젝트 상세 5장이 …" 테스트가 대표 한 장씩 확인한다.
    for (let index = 0; index < count; index += 1) {
      await expectUncropped(shots.nth(index), `${slug} 스크린샷 ${index}`);
    }
  }
});

test("상세마다 모바일 화면이 함께 뜬다", async ({ page }) => {
  for (const slug of PROJECT_SLUGS) {
    await gotoPage(page, `/projects/${slug}`);

    const mobile = page.getByRole("img", { name: /모바일/ });
    await expect(mobile, `${slug} 모바일 화면`).toBeVisible();
    // 촬영 당시 논리 해상도를 원본 PNG에서 계산해 붙인다.
    await expect(
      page.getByText(/^390 × \d+ · 실제 서비스 화면$/),
    ).toBeVisible();
  }
});

test("상세 이전/다음이 목록 순서대로 순환한다", async ({ page }) => {
  await gotoPage(page, "/projects/modu-campus");
  // 첫 프로젝트의 이전은 목록(홈)이다.
  await expect(page.getByRole("link", { name: "← 목록으로" })).toBeVisible();
  await expect(page.getByRole("link", { name: /다음:/ })).toHaveAttribute(
    "href",
    "/projects/ankang-sumgim",
  );

  await gotoPage(page, "/projects/hmsu");
  // 마지막 프로젝트의 다음도 목록으로 빠진다.
  await expect(page.getByRole("link", { name: "목록으로 →" })).toHaveAttribute(
    "href",
    "/",
  );
});

test("없는 경로는 404를 반환한다", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);

  const project = await page.goto("/projects/no-such-project");
  expect(project?.status()).toBe(404);
});

test("옛 URL은 새 위치로 리다이렉트된다", async ({ page }) => {
  for (const [from, to] of [
    ["/projects", "/"],
    ["/about", "/"],
    ["/projects/ycc-church", "/projects/ycc-website"],
    ["/projects/ankang-welfare", "/projects/ankang-sumgim"],
  ]) {
    await page.goto(from);
    await expect(page, `${from} → ${to}`).toHaveURL(to);
  }
});

test("sitemap과 robots가 서빙된다", async ({ page }) => {
  const sitemap = await page.goto("/sitemap.xml");
  expect(sitemap?.status()).toBe(200);
  const body = await sitemap?.text();
  for (const slug of PROJECT_SLUGS) {
    expect(body).toContain(`/projects/${slug}`);
  }

  const robots = await page.goto("/robots.txt");
  expect(robots?.status()).toBe(200);
  expect(await robots?.text()).toContain("Sitemap:");
});

test("연락처가 mailto 없이 복사 방식으로 동작한다", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  // mailto:는 윈도우 데스크톱에서 Outlook을 깨우므로 한 곳도 남기지 않는다.
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);

  await page.getByRole("button", { name: "dw5817@gmail.com" }).first().click();
  await expect(page.getByText("copied ✓").first()).toBeVisible();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe("dw5817@gmail.com");
});

test("전화번호가 어느 페이지에도 노출되지 않는다", async ({ page }) => {
  for (const path of ["/", "/projects/modu-campus"]) {
    await gotoPage(page, path);
    await expect(page.locator("body")).not.toContainText("5586");
  }
});

// 레일과 4열 그리드가 좁은 화면에서 접히지 않으면 바로 가로 스크롤이 생긴다.
test("375px에서 어느 페이지도 가로로 밀리지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });

  for (const path of ["/", ...PROJECT_SLUGS.map((s) => `/projects/${s}`)]) {
    await gotoPage(page, path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `${path}에서 가로 넘침`).toBeLessThanOrEqual(0);
  }
});
