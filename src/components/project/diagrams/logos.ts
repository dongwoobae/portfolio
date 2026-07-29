// 다이어그램 노드에 붙는 브랜드 마크 레지스트리.
//
// 대부분은 simple-icons에서 구워 온다(logos.generated.ts). 공식 마크가 존재하지
// 않는 것들 — PubSubHubbub(W3C WebSub 프로토콜), face-api.js(개인 오픈소스) —은
// 여기 MANUAL_LOGOS에 직접 넣는다. 없는 로고를 지어내지는 않는다: 진짜 마크들
// 옆에 놓인 근사치는 없느니만 못하다.

import {
  GENERATED_LOGOS,
  type GeneratedLogoId,
  type LogoMark,
} from "./logos.generated";

/**
 * 공식 배포처가 없어 직접 받은 마크. 경로는 viewBox 0 0 24 24로 정규화해서 넣는다.
 * 색은 card(#12161c) 대비 3:1 이상이어야 한다 — 마크는 그래픽 객체다.
 */
const MANUAL_LOGOS = {} satisfies Record<string, LogoMark>;

export type LogoId = GeneratedLogoId | keyof typeof MANUAL_LOGOS;

export const LOGOS: Record<LogoId, LogoMark> = {
  ...GENERATED_LOGOS,
  ...MANUAL_LOGOS,
};

export type { LogoMark };
