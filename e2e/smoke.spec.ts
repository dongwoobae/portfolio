import { expect, test, type Locator } from "@playwright/test";

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
  await expect(page.getByText("운영자가 매일 반복하던 일을,")).toBeInViewport();
  await expect(page.getByText("코드가 대신하게")).toBeInViewport();
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
  for (const label of ["경력", "하이라이트", "프로젝트", "팀 프로젝트"]) {
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
    const response = await page.goto(`/projects/${slug}`);
    expect(response?.status(), `${slug} 응답`).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(`projects/${slug}`)).toBeVisible();

    // 경로가 틀리거나 최적화가 실패하면 자연 크기가 0으로 남는다.
    const hero = page.getByRole("img").first();
    await expect(hero).toBeVisible();
    await expectUncropped(hero, `${slug} 대표 스크린샷`);
  }
});

/**
 * 고정 높이 + object-cover로 그리면 와이드 스크린샷의 좌우가 잘려 나간다.
 * 그려진 비율이 원본 비율과 같은지로 잘림을 잡는다.
 * (원본 PNG가 커서 dev 서버의 이미지 최적화가 느리다 — 넉넉히 기다린다.)
 */
async function expectUncropped(shot: Locator, label: string) {
  await expect
    .poll(() => shot.evaluate((img: HTMLImageElement) => img.naturalWidth), {
      message: `${label} 로드`,
      timeout: 60_000,
    })
    .toBeGreaterThan(0);

  const ratios = await shot.evaluate((img: HTMLImageElement) => ({
    drawn: img.clientWidth / img.clientHeight,
    natural: img.naturalWidth / img.naturalHeight,
  }));
  expect(
    Math.abs(ratios.drawn - ratios.natural),
    `${label}이 잘렸다 (그려진 ${ratios.drawn.toFixed(3)} vs 원본 ${ratios.natural.toFixed(3)})`,
  ).toBeLessThan(0.02);
}

// 잘림은 CaseStudyShots의 레이아웃 문제라 한 페이지를 전수로 보면 잡힌다.
// 스크린샷이 제일 많고 1장·3장 줄이 섞인 modu-campus를 대표로 훑는다.
// (나머지 4장은 위 테스트가 대표 스크린샷 한 장씩 확인한다.)
test("상세 스크린샷이 줄 구성과 무관하게 잘리지 않는다", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/projects/modu-campus");

  const shots = page.locator("figure img");
  await expect(shots.first()).toBeVisible();

  // 지연 로드분까지 한 번에 요청이 나가게 끝까지 내린다.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});

  const count = await shots.count();
  expect(count, "데스크톱 4장 + 모바일 1장").toBe(5);
  for (let index = 0; index < count; index += 1) {
    await expectUncropped(shots.nth(index), `modu-campus 스크린샷 ${index}`);
  }
});

test("상세마다 모바일 화면이 함께 뜬다", async ({ page }) => {
  for (const slug of PROJECT_SLUGS) {
    await page.goto(`/projects/${slug}`);

    const mobile = page.getByRole("img", { name: /모바일/ });
    await expect(mobile, `${slug} 모바일 화면`).toBeVisible();
    // 촬영 당시 논리 해상도를 원본 PNG에서 계산해 붙인다.
    await expect(
      page.getByText(/^390 × \d+ · 실제 서비스 화면$/),
    ).toBeVisible();
  }
});

test("상세 이전/다음이 목록 순서대로 순환한다", async ({ page }) => {
  await page.goto("/projects/modu-campus");
  // 첫 프로젝트의 이전은 목록(홈)이다.
  await expect(page.getByRole("link", { name: "← 목록으로" })).toBeVisible();

  await page.getByRole("link", { name: /다음:/ }).click();
  await expect(page).toHaveURL("/projects/ankang-sumgim");

  await page.goto("/projects/hmsu");
  // 마지막 프로젝트의 다음도 목록으로 빠진다.
  await expect(page.getByRole("link", { name: "목록으로 →" })).toBeVisible();
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
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText("5586");
  }
});

// 레일과 4열 그리드가 좁은 화면에서 접히지 않으면 바로 가로 스크롤이 생긴다.
test("375px에서 어느 페이지도 가로로 밀리지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });

  for (const path of ["/", ...PROJECT_SLUGS.map((s) => `/projects/${s}`)]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `${path}에서 가로 넘침`).toBeLessThanOrEqual(0);
  }
});
