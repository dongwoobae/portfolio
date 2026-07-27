import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects/meta";

describe("프로젝트 메타", () => {
  it("5개 프로젝트가 등록되어 있다", () => {
    expect(projects).toHaveLength(5);
  });

  it("slug가 유일하다", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("착수 순서(order)가 유일하다", () => {
    const orders = projects.map((p) => p.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("케이스 스터디가 있는 프로젝트는 라이브 또는 저장소 링크를 갖는다", () => {
    for (const project of projects.filter((p) => p.hasCaseStudy)) {
      expect(project.liveUrl ?? project.repoUrl).toBeDefined();
    }
  });

  it("1차 릴리스에서는 케이스 스터디 2편만 공개한다", () => {
    expect(projects.filter((p) => p.hasCaseStudy)).toHaveLength(2);
  });
});
