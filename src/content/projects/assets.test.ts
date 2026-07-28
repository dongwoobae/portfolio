import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/projects/case-studies";
import { projects } from "@/content/projects/meta";
import { screenshots } from "@/content/projects/screenshots";

// 이미지 경로는 문자열이라 오타가 나도 빌드가 통과한다.
// 상세 페이지에서 깨진 이미지로 드러나기 전에 여기서 잡는다.
const PUBLIC_DIR = join(process.cwd(), "public");
const SCREENSHOT_DIR = join(PUBLIC_DIR, "screenshots");

function assertRegistered(path: string) {
  expect(
    Object.hasOwn(screenshots, path),
    `${path}가 screenshots.ts 매니페스트에 없다`,
  ).toBe(true);
}

/** PNG 헤더(IHDR)의 가로·세로. 원본 비율을 검증할 때만 쓴다. */
function readPngSize(path: string) {
  const bytes = readFileSync(join(PUBLIC_DIR, path));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("스크린샷 자산", () => {
  it("매니페스트에 등록된 파일이 모두 존재한다", () => {
    for (const path of Object.keys(screenshots)) {
      expect(existsSync(join(PUBLIC_DIR, path)), `${path}가 없다`).toBe(true);
    }
  });

  // 치수 자체는 next/image가 빌드 때 원본에서 읽어 채우므로 검증할 게 없다.
  // 대신 등록을 빠뜨린 파일을 잡는다 — 빠뜨리면 getScreenshot이 런타임에 던진다.
  it("public의 스크린샷이 모두 매니페스트에 등록돼 있다", () => {
    const onDisk = [
      ...readdirSync(SCREENSHOT_DIR)
        .filter((name) => name.endsWith(".png"))
        .map((name) => `/screenshots/${name}`),
      ...readdirSync(join(SCREENSHOT_DIR, "mobile"))
        .filter((name) => name.endsWith(".png"))
        .map((name) => `/screenshots/mobile/${name}`),
    ];

    expect(onDisk.sort()).toEqual(Object.keys(screenshots).sort());
  });

  it("목록 hover 미리보기 이미지가 모두 매니페스트에 있다", () => {
    for (const project of projects) assertRegistered(project.preview);
  });

  it("상세 페이지 스크린샷이 모두 매니페스트에 있다", () => {
    for (const study of Object.values(caseStudies)) {
      for (const row of study.shotRows) {
        for (const shot of row) assertRegistered(shot.src);
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

  // 모바일 화면은 프로젝트마다 한 장씩. 세로 길이는 화면마다 다르게 잡지만
  // 가로폭은 항상 390논리px × 2배율 = 780이어야 한다 —
  // CaseStudyShots가 이 배율로 캡션의 논리 해상도를 계산한다.
  it("모바일 화면이 프로젝트 5장 모두에 있고 촬영 규격을 지킨다", () => {
    const studies = Object.entries(caseStudies);
    expect(studies).toHaveLength(5);

    for (const [slug, study] of studies) {
      const mobile = study.mobileShot;
      expect(mobile, `${slug}에 모바일 화면이 없다`).toBeDefined();
      if (!mobile) continue;

      assertRegistered(mobile.src);
      expect(mobile.alt.length, `${slug} 모바일 alt`).toBeGreaterThan(0);
      expect(mobile.note.length, `${slug} 모바일 설명`).toBeGreaterThan(0);

      const { width, height } = readPngSize(mobile.src);
      expect(width, `${slug} 모바일 가로폭`).toBe(390 * 2);
      expect(height, `${slug} 모바일 세로`).toBeGreaterThan(width);
    }
  });
});
