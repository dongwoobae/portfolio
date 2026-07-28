import { describe, expect, it } from "vitest";
import { highlights } from "@/content/home";
import { projects } from "@/content/projects/meta";

describe("랜딩 하이라이트", () => {
  // 구 slug를 두면 next.config.ts의 301을 거쳐야 상세에 닿는다.
  // 사이트 내부 링크는 최종 URL을 직접 가리켜야 한다.
  it("모든 하이라이트 slug가 현행 프로젝트에 존재한다", () => {
    const slugs = new Set(projects.map((project) => project.slug));
    for (const item of highlights) {
      expect(slugs.has(item.slug), `${item.slug}는 현행 slug가 아니다`).toBe(
        true,
      );
    }
  });
});
