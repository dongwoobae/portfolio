import { describe, expect, it } from "vitest";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getProjectsInOrder,
} from "@/lib/projects";

describe("getProjectsInOrder", () => {
  it("착수 순으로 정렬한다", () => {
    const orders = getProjectsInOrder().map((p) => p.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("getProjectBySlug", () => {
  it("존재하는 slug를 찾는다", () => {
    expect(getProjectBySlug("ycc-website")?.title).toContain("영천중앙교회");
  });

  it("없는 slug는 undefined를 반환한다", () => {
    expect(getProjectBySlug("nope")).toBeUndefined();
  });
});

describe("getAdjacentProjects", () => {
  it("가운데 프로젝트는 앞뒤가 모두 있다", () => {
    const ordered = getProjectsInOrder();
    const middle = ordered[1];
    const { previous, next } = getAdjacentProjects(middle.slug);
    expect(previous?.slug).toBe(ordered[0].slug);
    expect(next?.slug).toBe(ordered[2].slug);
  });

  it("첫 프로젝트는 이전이 없다", () => {
    const first = getProjectsInOrder()[0];
    expect(getAdjacentProjects(first.slug).previous).toBeUndefined();
  });

  it("마지막 프로젝트는 다음이 없다", () => {
    const ordered = getProjectsInOrder();
    const last = ordered[ordered.length - 1];
    expect(getAdjacentProjects(last.slug).next).toBeUndefined();
  });

  it("없는 slug는 빈 결과를 반환한다", () => {
    expect(getAdjacentProjects("nope")).toEqual({});
  });
});
