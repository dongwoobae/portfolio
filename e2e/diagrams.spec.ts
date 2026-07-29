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

  /**
   * 다이어그램도 컨테이너 폭에 맞춰 축소되므로 원본 크기로 되돌리는 경로가
   * 있어야 한다 — 좁은 화면에서 라벨을 읽는 유일한 방법이다. 벡터라 확대
   * 개념이 없다고 보고 이 버튼을 뺐던 것이 가로 스크롤을 없애면서 뒤집혔다.
   */
  test("다이어그램 라이트박스에서 1:1로 원본 크기를 볼 수 있다", async ({
    page,
  }) => {
    await page.goto("/projects/ycc-website");
    const trigger = page
      .getByRole("button", { name: /^크게 보기: 설교 자동 동기화/ })
      .first();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const svg = dialog.locator('svg[role="img"]');
    const viewBoxWidth = Number(
      (await svg.getAttribute("viewBox"))!.split(" ")[2],
    );

    const zoom = dialog.getByRole("button", { name: "1:1" });
    await expect(zoom).toHaveAttribute("aria-pressed", "false");
    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");

    // 원본 크기는 좌표계 폭 그대로여야 한다. 1px은 소수 배율 반올림 여유다.
    const shown = (await svg.boundingBox())!.width;
    expect(Math.abs(shown - viewBoxWidth)).toBeLessThanOrEqual(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  /**
   * 다이어그램은 컨테이너 폭에 맞춰 축소된다 — 좌표계가 컨테이너보다 넓으면
   * 데스크톱에서까지 글자가 작아진다(11.5px 보조 문구가 10px 아래로 떨어진다).
   * 폭을 넓히는 편집이 조용히 가독성을 깎지 못하게 여기서 막는다.
   */
  for (const { slug } of DIAGRAM_PAGES) {
    test(`${slug} — 데스크톱에서 축소 없이 렌더된다`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/projects/${slug}`);
      const shrunk = await page.evaluate(() =>
        [...document.querySelectorAll('svg[role="img"]')]
          .map((svg) => ({
            title: svg.querySelector("title")!.textContent,
            좌표계: Number(svg.getAttribute("viewBox")!.split(" ")[2]),
            렌더: svg.getBoundingClientRect().width,
          }))
          .filter((d) => d.렌더 < d.좌표계)
          .map((d) => `${d.title}: ${d.좌표계} → ${Math.round(d.렌더)}px`),
      );
      expect(shrunk, shrunk.join(" / ")).toEqual([]);
    });
  }

  /**
   * 노드 문구를 한 글자 고치거나 글자 크기를 올리면 보조 문구가 박스를 넘친다.
   * 좌표는 타입도 단위 테스트도 통과하므로 실제 렌더에서 재는 수밖에 없다
   * (이 작업 중 라벨 잘림이 두 번 났다). getBBox()로 실측해 고정한다.
   */
  for (const { slug } of DIAGRAM_PAGES) {
    test(`${slug} — 노드 문구가 박스를 넘치지 않는다`, async ({ page }) => {
      await page.goto(`/projects/${slug}`);
      await expect(page.locator('svg[role="img"]').first()).toBeVisible();

      const overflows = await page.evaluate(() => {
        const found: string[] = [];
        for (const svg of document.querySelectorAll('svg[role="img"]')) {
          for (const g of svg.querySelectorAll("g")) {
            const rect = g.querySelector(":scope > rect");
            // 노드 박스는 rx=8, 레인은 rx=10이라 이걸로 구분한다.
            if (!rect || rect.getAttribute("rx") !== "8") continue;
            const right =
              Number(rect.getAttribute("x")) +
              Number(rect.getAttribute("width"));
            const bottom =
              Number(rect.getAttribute("y")) +
              Number(rect.getAttribute("height"));
            const label = g.querySelector(":scope > text")?.textContent ?? "?";
            for (const t of g.querySelectorAll(":scope > text")) {
              const b = (t as SVGGraphicsElement).getBBox();
              // 왼쪽 패딩이 14px이므로 오른쪽도 최소 8px은 남아야 한다.
              if (b.x + b.width > right - 8) {
                found.push(`[${label}] "${t.textContent}" 우측 넘침`);
              }
              if (b.y + b.height > bottom - 4) {
                found.push(`[${label}] "${t.textContent}" 하단 넘침`);
              }
            }
          }
        }
        return found;
      });

      expect(overflows, overflows.join(" / ")).toEqual([]);
    });
  }

  /**
   * 화살표가 무관한 노드 상자를 관통하면, 노드가 선보다 나중에 그려지므로
   * 선이 상자 뒤로 사라져 화살표가 중간에 끊긴 것처럼 보인다. 좌표를 옮길
   * 때마다 나는 사고라 선분 대 사각형 교차로 고정한다 (실제로 worldengco에서
   * 이 방식으로 22px 관통을 찾아냈다).
   */
  for (const { slug } of DIAGRAM_PAGES) {
    test(`${slug} — 화살표가 노드 상자를 관통하지 않는다`, async ({ page }) => {
      await page.goto(`/projects/${slug}`);
      await expect(page.locator('svg[role="img"]').first()).toBeVisible();

      const crossings = await page.evaluate(() => {
        // Liang-Barsky. 겹치는 구간의 길이를 돌려준다.
        const overlap = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          r: { x: number; y: number; w: number; h: number },
          pad: number,
        ) => {
          let t0 = 0;
          let t1 = 1;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const limits: [number, number][] = [
            [-dx, x1 - (r.x + pad)],
            [dx, r.x + r.w - pad - x1],
            [-dy, y1 - (r.y + pad)],
            [dy, r.y + r.h - pad - y1],
          ];
          for (const [p, q] of limits) {
            if (p === 0) {
              if (q < 0) return 0;
            } else if (p < 0) t0 = Math.max(t0, q / p);
            else t1 = Math.min(t1, q / p);
          }
          return t1 > t0 ? (t1 - t0) * Math.hypot(dx, dy) : 0;
        };

        const found: string[] = [];
        for (const svg of document.querySelectorAll('svg[role="img"]')) {
          const boxes: {
            x: number;
            y: number;
            w: number;
            h: number;
            label: string;
          }[] = [];
          for (const g of svg.querySelectorAll("g")) {
            const rect = g.querySelector(":scope > rect");
            if (!rect || rect.getAttribute("rx") !== "8") continue;
            boxes.push({
              x: Number(rect.getAttribute("x")),
              y: Number(rect.getAttribute("y")),
              w: Number(rect.getAttribute("width")),
              h: Number(rect.getAttribute("height")),
              label: g.querySelector(":scope > text")?.textContent ?? "?",
            });
          }
          for (const line of svg.querySelectorAll("line")) {
            const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((a) =>
              Number(line.getAttribute(a)),
            );
            for (const b of boxes) {
              // 선이 붙는 노드는 경계에서 시작·끝난다. 6px 안쪽으로 파고들고
              // 그 구간이 4px을 넘을 때만 관통으로 본다.
              const len = overlap(x1, y1, x2, y2, b, 6);
              if (len > 4) {
                found.push(`[${b.label}] 선이 ${Math.round(len)}px 파고듦`);
              }
            }
          }
        }
        return found;
      });

      expect(crossings, crossings.join(" / ")).toEqual([]);
    });
  }

  /**
   * 브랜드 마크는 simple-icons에서 구운 경로를 그대로 쓴다. 생성 파일이
   * 비거나 색이 빠지면 노드에 빈 자리만 남으므로 렌더 여부를 확인한다.
   */
  test("노드 브랜드 마크가 공식 색으로 렌더된다", async ({ page }) => {
    await page.goto("/projects/ycc-website");
    const marks = await page.evaluate(() =>
      [...document.querySelectorAll('svg[role="img"] g[transform] > path')].map(
        (p) => ({
          d: p.getAttribute("d") ?? "",
          fill: p.getAttribute("fill") ?? "",
        }),
      ),
    );
    expect(marks.length, "브랜드 마크가 하나도 없다").toBeGreaterThan(0);
    for (const m of marks) {
      // 길이로 재지 않는다 — PubSubHubbub의 정사각형은 "M0 0h24v24H0z" 13자다.
      // 경로 명령으로 시작하는 비어 있지 않은 문자열인지만 본다.
      expect(m.d, "마크 경로가 비었다").toMatch(/^M\s*-?[\d.]/);
      expect(m.fill, `마크 색이 hex가 아니다: ${m.fill}`).toMatch(
        /^#[0-9A-F]{6}$/i,
      );
    }
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

  /**
   * 장을 넘기면 확대가 풀려야 한다 — 다음 장을 확대 상태로 맞이하면 어디를
   * 보는지 잃는다. 되돌아오기(←)와 닫았다 다시 열기까지 함께 본다. 앞으로
   * 넘기는 것만 검사하면 확대 상태를 장 번호에 묶어 둔 구현이 통과해 버린다.
   */
  test("장을 넘기거나 닫았다 열면 1:1이 풀린다", async ({ page }) => {
    await page.goto("/projects/ycc-website");
    const thumb = page
      .locator('button[aria-label^="크게 보기:"]')
      .filter({ has: page.locator("img") })
      .first();
    await thumb.click();

    const dialog = page.getByRole("dialog");
    const zoom = dialog.getByRole("button", { name: "1:1" });
    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("ArrowRight");
    await expect(zoom).toHaveAttribute("aria-pressed", "false");

    // 확대했던 장으로 되돌아와도 풀린 채여야 한다.
    await page.keyboard.press("ArrowLeft");
    await expect(zoom).toHaveAttribute("aria-pressed", "false");

    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // 같은 장을 다시 열어도 fit으로 시작해야 한다.
    await thumb.click();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "1:1" }),
    ).toHaveAttribute("aria-pressed", "false");
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
