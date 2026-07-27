import { expect, test } from "@playwright/test";

test("홈에 이름·개발 방식·기술 스택·성장 서사·대표 케이스가 보인다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("배동우");
  await expect(
    page.getByRole("img", { name: "배동우 프로필 사진" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /AI로 빠르게/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "기술 스택" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "진행하면서 배운 것" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "대표 케이스 스터디" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /운영 중/ })).toHaveCount(2);
});

test("없는 경로는 404를 반환한다", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
});

test("프로젝트 목록에 5개 프로젝트가 착수 순으로 보인다", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("프로젝트");
  await expect(page.locator("article")).toHaveCount(5);
  await expect(page.locator("article").first()).toContainText("모두의 캠퍼스");
});

test("케이스 스터디 상세가 메타와 본문을 보여준다", async ({ page }) => {
  await page.goto("/projects/ycc-church");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "영천중앙교회",
  );
  await expect(
    page.getByRole("link", { name: /라이브 사이트 보기/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "배경" })).toBeVisible();
});

test("케이스 스터디가 없는 프로젝트는 404다", async ({ page }) => {
  const response = await page.goto("/projects/herbal-medicine-platform");
  expect(response?.status()).toBe(404);
});
