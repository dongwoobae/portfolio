import { describe, expect, it } from "vitest";
import { career } from "@/content/home";
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
