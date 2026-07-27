import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/projects/case-studies";
import { projects } from "@/content/projects/meta";

// 이미지 경로는 문자열이라 오타가 나도 빌드가 통과한다.
// 상세 페이지에서 깨진 이미지로 드러나기 전에 여기서 잡는다.
const PUBLIC_DIR = join(process.cwd(), "public");

function assertExists(path: string) {
  expect(existsSync(join(PUBLIC_DIR, path)), `${path}가 없다`).toBe(true);
}

describe("스크린샷 자산", () => {
  it("목록 hover 미리보기 이미지가 모두 존재한다", () => {
    for (const project of projects) assertExists(project.preview);
  });

  it("상세 페이지 스크린샷이 모두 존재한다", () => {
    for (const study of Object.values(caseStudies)) {
      for (const row of study.shotRows) {
        for (const shot of row) assertExists(shot.src);
      }
    }
  });

  it("모든 스크린샷에 대체 텍스트가 있다", () => {
    for (const study of Object.values(caseStudies)) {
      for (const row of study.shotRows) {
        for (const shot of row) expect(shot.alt.length).toBeGreaterThan(0);
      }
    }
  });
});
