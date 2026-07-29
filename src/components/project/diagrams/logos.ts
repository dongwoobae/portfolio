// 다이어그램 노드에 붙는 브랜드 마크 레지스트리.
//
// 대부분은 simple-icons에서 구워 온다(logos.generated.ts). 공식 배포처가 없는
// 것들은 아래 MANUAL_LOGOS에 직접 넣는다 — 다만 **없는 로고를 지어내지는 않는다.**
// 원본 이미지가 있을 때만 넣고, 색과 비율은 눈으로 짐작하지 말고 원본 픽셀에서 뽑는다.

import { GENERATED_LOGOS, type GeneratedLogoId } from "./logos.generated";

/**
 * 렌더에 쓰는 마크 표현. 세로 24 좌표계로 정규화하고, 가로는 `aspect`가 정한다
 * (simple-icons는 전부 정사각이라 1). 도형마다 색이 다른 마크가 있어
 * 단일 `path` + `hex`로는 부족하다 — PubSubHubbub이 그렇다.
 */
export type LogoMark = {
  /** 브랜드 정식 표기 — 캡션과 desc에 그대로 쓴다 */
  title: string;
  /** 가로/세로 비. 이 값이 제목의 들여쓰기를 정한다 */
  aspect: number;
  shapes: { d: string; fill: string }[];
};

/**
 * 공식 마크가 없거나 simple-icons에 없는 것들.
 *
 * 색은 카드 배경(#12161c) 대비 3:1 이상이어야 한다 — 마크는 그래픽 객체다.
 * 아래 두 마크의 색·치수는 원본 PNG 픽셀에서 직접 뽑았다.
 */
const MANUAL_LOGOS = {
  // 초록 정사각 · 노랑 원 · 분홍 정사각이 5px 간격으로 늘어선 마크.
  // 원본(264×200)에서 도형은 25px, 간격은 5px, 전체는 85×25였다.
  // 세로 24 기준으로 환산하면 24 / 5 / 24 / 5 / 24 = 82 → aspect 82/24.
  // 대비: 초록 9.50 · 노랑 16.90 · 분홍 7.28.
  pubsubhubbub: {
    title: "PubSubHubbub",
    aspect: 82 / 24,
    shapes: [
      { d: "M0 0h24v24H0z", fill: "#99CC00" },
      { d: "M53 12A12 12 0 1 1 29 12 12 12 0 1 1 53 12z", fill: "#FFFF00" },
      { d: "M58 0h24v24H58z", fill: "#FF6FCF" },
    ],
  },
  // TensorFlow.js 마크의 TF 글리프만 쓴다. 경로는 simple-icons의 공식 TensorFlow
  // 것이고, 색은 TF.js 로고 원본에서 뽑은 #FF8500이다(simple-icons의 TensorFlow
  // 주황 #FF6F00보다 밝은 TF.js 쪽 톤).
  //
  // 오른쪽 아래 JS 배지는 **일부러 뺐다.** 배지 남색 #425066은 카드 배경 대비가
  // 2.22:1이라 기준(3:1) 미달이고, 어두운 배경 위에서 배지가 글리프를 베어 문
  // 자국처럼 보인다. 16px에서는 안의 "JS" 글자도 어차피 읽히지 않는다.
  tensorflowjs: {
    title: "TensorFlow.js",
    aspect: 1,
    shapes: [{ d: GENERATED_LOGOS.tensorflow.path, fill: "#FF8500" }],
  },
} satisfies Record<string, LogoMark>;

export type LogoId = GeneratedLogoId | keyof typeof MANUAL_LOGOS;

export const LOGOS: Record<LogoId, LogoMark> = {
  ...Object.fromEntries(
    Object.entries(GENERATED_LOGOS).map(([id, mark]) => [
      id,
      {
        title: mark.title,
        aspect: 1,
        shapes: [{ d: mark.path, fill: mark.hex }],
      },
    ]),
  ),
  ...MANUAL_LOGOS,
} as Record<LogoId, LogoMark>;
