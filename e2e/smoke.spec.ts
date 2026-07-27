import { expect, test } from "@playwright/test";

test("홈에 이름과 포지셔닝이 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("배동우");
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
