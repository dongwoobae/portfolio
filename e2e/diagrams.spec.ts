import { expect, test } from "@playwright/test";

const DIAGRAM_PAGES = [
  { slug: "ycc-website", count: 2 },
  { slug: "ankang-sumgim", count: 1 },
  { slug: "worldengco", count: 1 },
];

test.describe("아키텍처 다이어그램", () => {
  for (const { slug, count } of DIAGRAM_PAGES) {
    test(`${slug} — 다이어그램이 접근가능 이름과 함께 렌더된다`, async ({
      page,
    }) => {
      await page.goto(`/projects/${slug}`);
      const diagrams = page.locator('figure svg[role="img"]');
      await expect(diagrams).toHaveCount(count);
      for (let i = 0; i < count; i++) {
        await expect(diagrams.nth(i)).toHaveAttribute("aria-labelledby", /\S/);
        await expect(diagrams.nth(i).locator("title")).not.toBeEmpty();
        await expect(diagrams.nth(i).locator("desc")).not.toBeEmpty();
      }
    });
  }

  test("다이어그램 라이트박스는 1:1 토글이 없다", async ({ page }) => {
    await page.goto("/projects/ycc-website");
    const trigger = page
      .getByRole("button", { name: /^크게 보기: 설교 자동 동기화/ })
      .first();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "1:1" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  /**
   * 이 작업의 최대 위험. 라이트박스를 열면 같은 다이어그램이 문서에 두 벌
   * 존재하는데, <marker> id가 겹치면 url(#head)가 먼저 나온 쪽에 붙어 한쪽
   * 화살촉이 통째로 사라진다. id 유일성과 참조 무결성을 함께 본다.
   */
  test("라이트박스를 열어도 marker id가 충돌하지 않는다", async ({ page }) => {
    await page.goto("/projects/ycc-website");
    await page
      .getByRole("button", { name: /^크게 보기: 설교 자동 동기화/ })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const markers = await page.evaluate(() => {
      const refs = [...document.querySelectorAll("[marker-end]")].map((el) =>
        (el.getAttribute("marker-end") ?? "").replace(/^url\(#|\)$/g, ""),
      );
      const ids = [...document.querySelectorAll("marker")].map((m) => m.id);
      return {
        refCount: refs.length,
        idCount: ids.length,
        uniqueIdCount: new Set(ids).size,
        dangling: [...new Set(refs.filter((r) => !ids.includes(r)))],
      };
    });

    expect(markers.refCount, "화살표가 그려져 있어야 한다").toBeGreaterThan(0);
    expect(markers.uniqueIdCount, "marker id가 중복됐다").toBe(markers.idCount);
    expect(markers.dangling, "가리키는 marker가 없는 화살표").toEqual([]);
  });
});

test.describe("스크린샷 라이트박스", () => {
  test("열기 → 이동 → 1:1 → 닫기 → 포커스 복귀", async ({ page }) => {
    await page.goto("/projects/ycc-website");

    // 다이어그램 확대 버튼과 구분하려고 img를 품은 버튼만 고른다.
    const first = page
      .locator('button[aria-label^="크게 보기:"]')
      .filter({ has: page.locator("img") })
      .first();
    await first.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("[1/")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText("[2/")).toBeVisible();

    const zoom = dialog.getByRole("button", { name: "1:1" });
    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(first).toBeFocused();
  });

  /** 장을 넘기면 확대가 풀려야 한다 — 다음 장을 확대 상태로 맞이하면 혼란스럽다. */
  test("장을 넘기면 1:1이 풀린다", async ({ page }) => {
    await page.goto("/projects/ycc-website");
    await page
      .locator('button[aria-label^="크게 보기:"]')
      .filter({ has: page.locator("img") })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    const zoom = dialog.getByRole("button", { name: "1:1" });
    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("ArrowRight");
    await expect(zoom).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("반응형", () => {
  for (const { slug } of DIAGRAM_PAGES) {
    test(`${slug} — 375px에서 페이지 본문이 가로 스크롤되지 않는다`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(`/projects/${slug}`);
      // 다이어그램은 자기 컨테이너 안에서만 스크롤해야 한다.
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
