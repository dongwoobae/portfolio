import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/projects/case-studies";
import { projects } from "@/content/projects/meta";

describe("프로젝트 메타", () => {
  it("6개 프로젝트가 등록되어 있다", () => {
    expect(projects).toHaveLength(6);
  });

  it("slug가 유일하다", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("착수 순서(order)가 유일하다", () => {
    const orders = projects.map((p) => p.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("모든 프로젝트가 상세 페이지 본문을 갖는다", () => {
    for (const project of projects) {
      expect(caseStudies[project.slug]).toBeDefined();
    }
  });

  it("본문만 있고 목록에 없는 slug는 없다", () => {
    const slugs = new Set(projects.map((p) => p.slug));
    for (const slug of Object.keys(caseStudies)) {
      expect(slugs.has(slug)).toBe(true);
    }
  });
});
