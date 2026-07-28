import { describe, expect, it } from "vitest";
import { career, highlights } from "@/content/home";
import { caseStudies } from "@/content/projects/case-studies";
import { resume } from "@/content/resume";

describe("이력서 콘텐츠", () => {
  it("요약이 3줄이다", () => {
    expect(resume.summary).toHaveLength(3);
  });

  // 키가 어긋나면 이력서 경력 절에 성과가 통째로 비어 출력된다.
  it("성과 키가 재직 경력 title과 일치한다", () => {
    const jobs = career
      .filter((item) => item.kind === "job")
      .map((item) => item.title);
    expect(Object.keys(resume.achievements).sort()).toEqual([...jobs].sort());
  });

  it("모든 재직 경력에 성과가 2줄 이상 있다", () => {
    for (const [company, lines] of Object.entries(resume.achievements)) {
      expect(lines.length, `${company} 성과`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("대표 프로젝트 케이스", () => {
  const shown = highlights.slice(0, 3).map((item) => item.slug);

  // 키가 어긋나면 이력서에 프로젝트만 뜨고 케이스가 통째로 비어 출력된다.
  it("이력서에 싣는 3건 모두 케이스를 갖는다", () => {
    for (const slug of shown) {
      expect(resume.projectCases[slug], `${slug} 케이스`).toBeDefined();
    }
  });

  it("케이스 키에 이력서에 싣지 않는 slug가 섞여 있지 않다", () => {
    expect(Object.keys(resume.projectCases).sort()).toEqual([...shown].sort());
  });

  // 프로젝트 설명(overview)과 라이브·저장소 링크를 case-studies에서 가져온다.
  it("3건 모두 케이스 스터디의 설명과 링크를 갖는다", () => {
    for (const slug of shown) {
      const study = caseStudies[slug];
      expect(study?.overview, `${slug} overview`).toBeTruthy();
      const links = study?.meta.find((cell) => cell.label === "LINKS")?.links;
      expect(links?.length, `${slug} 링크`).toBeGreaterThan(0);
    }
  });
});
