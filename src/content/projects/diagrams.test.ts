import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/projects/case-studies";
import { DIAGRAM_META } from "@/content/projects/diagrams";

/** 케이스 스터디 전체에서 실제로 참조된 다이어그램 id */
function usedDiagramIds(): Set<string> {
  const used = new Set<string>();
  for (const study of Object.values(caseStudies)) {
    for (const section of study.sections) {
      if ("cards" in section && section.diagram) used.add(section.diagram);
    }
  }
  return used;
}

describe("DIAGRAM_META", () => {
  it("케이스 스터디가 참조하는 id가 전부 정의돼 있다", () => {
    for (const id of usedDiagramIds()) {
      expect(DIAGRAM_META, `${id}에 메타가 없다`).toHaveProperty(id);
    }
  });

  it("정의만 해두고 안 쓰는 다이어그램이 없다", () => {
    const used = usedDiagramIds();
    const orphans = Object.keys(DIAGRAM_META).filter((id) => !used.has(id));
    expect(orphans).toEqual([]);
  });

  it("모든 항목이 비어 있지 않은 title·desc와 양수 크기를 갖는다", () => {
    for (const [id, meta] of Object.entries(DIAGRAM_META)) {
      expect(meta.title.trim(), `${id}.title`).not.toBe("");
      expect(meta.desc.trim(), `${id}.desc`).not.toBe("");
      expect(meta.width, `${id}.width`).toBeGreaterThan(0);
      expect(meta.height, `${id}.height`).toBeGreaterThan(0);
    }
  });

  it("desc는 스크린리더가 흐름을 파악할 만큼 서술적이다", () => {
    for (const [id, meta] of Object.entries(DIAGRAM_META)) {
      expect(meta.desc.length, `${id}.desc가 너무 짧다`).toBeGreaterThan(80);
    }
  });
});
