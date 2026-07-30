import type { Page } from "@playwright/test";

/**
 * Next 개발 서버의 이미지 최적화가 밀려도 페이지 탐색 자체는 끝나야 한다.
 * 각 테스트가 필요한 UI와 이미지 로드는 별도 assertion으로 검증한다.
 */
export function gotoPage(page: Page, url: string) {
  return page.goto(url, { waitUntil: "domcontentloaded" });
}
