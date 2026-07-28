import { expect, test } from "@playwright/test";

// .dev.vars에 넣은 로컬 개발용 값과 같아야 한다.
const PASSWORD = process.env.RESUME_PASSWORD ?? "123456789a";
const PHONE = process.env.RESUME_PHONE ?? "010-0000-0000";

// 트리거는 "↓ 이력서 다운로드", 모달 제출 버튼은 "다운로드"다.
// 이름만으로 고르면 둘 다 잡혀 strict mode violation이 나므로 분리해 둔다.
const TRIGGER = { name: /이력서 다운로드/ } as const;
const SUBMIT = { name: "다운로드", exact: true } as const;

test("이력서 페이지가 전 섹션을 렌더한다", async ({ page }) => {
  const response = await page.goto("/resume");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("배동우");
  for (const section of [
    "요약",
    "경력",
    "대표 프로젝트",
    "기술 스택",
    "학력",
    "자격증 · 어학",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name: section }),
    ).toBeVisible();
  }

  await expect(page.getByText("모바일이앤엠애드")).toBeVisible();
  await expect(page.getByText("메디케이시스템")).toBeVisible();
});

test("공개 열람 화면에는 전화번호가 없다", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.locator("body")).not.toContainText(PHONE);

  // 정적 HTML 자체에도 없어야 한다. CSS로 가려두는 것과는 다르다.
  const html = await page.content();
  expect(html).not.toContain(PHONE);
});

test("오답을 넣으면 전화번호가 나오지 않는다", async ({ page }) => {
  await page.goto("/resume");

  await page.getByRole("button", TRIGGER).click();
  await page.getByLabel("이력서 다운로드 비밀번호").fill("definitely-wrong");
  await page.getByRole("button", SUBMIT).click();

  await expect(page.getByText("비밀번호가 올바르지 않습니다.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(PHONE);
});

test("정답을 넣어도 화면에는 없고 인쇄에만 전화번호가 나타난다", async ({
  page,
}) => {
  // window.print()는 헤드리스에서 다이얼로그를 띄우려다 멈출 수 있어 막아 둔다.
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto("/resume");

  await page.getByRole("button", TRIGGER).click();
  await page.getByLabel("이력서 다운로드 비밀번호").fill(PASSWORD);
  await page.getByRole("button", SUBMIT).click();

  // 모달이 닫힌다.
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // PrintPhone은 hidden print:flex라 해제 뒤에도 화면에는 절대 나타나지 않는다.
  // DOM에는 붙어 있지만 screen 미디어에서는 display:none이다.
  await page.emulateMedia({ media: "screen" });
  const phone = page.getByText(PHONE);
  await expect(phone).toBeAttached();
  await expect(phone).toBeHidden();

  // 인쇄 미디어로 바꿔야 비로소 보인다. 즉 종이에만 찍힌다.
  await page.emulateMedia({ media: "print" });
  await expect(phone).toBeVisible();
});

test("모달을 ESC로 닫을 수 있다", async ({ page }) => {
  await page.goto("/resume");

  await page.getByRole("button", TRIGGER).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// 이 헤더가 없으면 엣지가 성공 응답을 캐시할 수 있고, 그 순간 잠금이 무의미해진다.
test("연락처 응답이 캐시 금지 헤더를 단다", async ({ request }) => {
  const ok = await request.post("/api/resume-contact", {
    data: { password: PASSWORD },
  });
  expect(ok.status()).toBe(200);
  expect(ok.headers()["cache-control"]).toContain("no-store");

  const fail = await request.post("/api/resume-contact", {
    data: { password: "wrong" },
  });
  expect(fail.status()).toBe(401);
  expect(fail.headers()["cache-control"]).toContain("no-store");
});

test("이력서는 검색 색인에서 빠진다", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  const sitemap = await page.goto("/sitemap.xml");
  expect(await sitemap?.text()).not.toContain("/resume");
});
