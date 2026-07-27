import { describe, expect, it } from "vitest";
import {
  getCaseStudyProjects,
  getProjectBySlug,
  getProjectsInOrder,
} from "@/lib/projects";

describe("getProjectsInOrder", () => {
  it("착수 순으로 정렬한다", () => {
    const orders = getProjectsInOrder().map((p) => p.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("getCaseStudyProjects", () => {
  it("본문이 준비된 프로젝트만 반환한다", () => {
    expect(getCaseStudyProjects().every((p) => p.hasCaseStudy)).toBe(true);
  });
});

describe("getProjectBySlug", () => {
  it("존재하는 slug를 찾는다", () => {
    expect(getProjectBySlug("ycc-church")?.title).toContain("영천중앙교회");
  });

  it("없는 slug는 undefined를 반환한다", () => {
    expect(getProjectBySlug("nope")).toBeUndefined();
  });
});
