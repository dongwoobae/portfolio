"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/project/Lightbox";
import type { MobileShot, Shot } from "@/content/projects/case-studies";
import { getScreenshot } from "@/content/projects/screenshots";

// 한 줄에 몇 장이냐에 따라 그리드와 이미지 요청 크기가 정해진다.
// 높이는 지정하지 않는다 — 화면을 잘라내지 않으려면 원본 비율을 그대로 둬야 한다.
const ROW = {
  1: {
    grid: "grid-cols-1",
    sizes: "(max-width: 1040px) 100vw, 880px",
  },
  2: {
    grid: "grid-cols-1 sm:grid-cols-2",
    sizes: "(max-width: 640px) 100vw, (max-width: 1040px) 50vw, 440px",
  },
  3: {
    grid: "grid-cols-1 sm:grid-cols-3",
    sizes: "(max-width: 640px) 100vw, (max-width: 1040px) 33vw, 290px",
  },
} as const;

export function ShotGallery({
  rows,
  mobile,
}: {
  rows: Shot[][];
  mobile?: MobileShot;
}) {
  // 줄 구분 없이 평탄화한 순서가 라이트박스의 탐색 순서다. 모바일 프레임은
  // 이미 실제 크기로 보이므로 넣지 않는다.
  const items: LightboxItem[] = rows.flat().map((shot) => ({
    kind: "image",
    // 그리드는 next/image가 리사이즈한 것을 쓰지만 라이트박스 1:1은 원본이어야
    // 관리자 화면 글자가 읽힌다.
    src: getScreenshot(shot.src).src,
    path: shot.src,
    alt: shot.alt,
  }));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /**
   * 줄을 넘어가도 이어지는 평탄 인덱스. 렌더 중 카운터를 증가시키면 React
   * Compiler가 막으므로(react-hooks/immutability) 앞선 줄의 장수를 그때그때
   * 더한다 — 한 페이지에 줄이 서너 개뿐이라 비용이 없다.
   */
  const flatIndexOf = (row: number, column: number) =>
    rows.slice(0, row).reduce((n, r) => n + r.length, 0) + column;

  return (
    <figure className="my-10 flex flex-col gap-3.5">
      {rows.map((row, index) => {
        const layout = ROW[Math.min(row.length, 3) as 1 | 2 | 3];
        return (
          // 비율이 다른 스크린샷이 한 줄에 섞이면 위쪽을 기준으로 맞춘다.
          <div
            key={index}
            className={`grid items-start gap-3.5 ${layout.grid}`}
          >
            {row.map((shot, column) => (
              <BrowserFrame
                key={shot.src}
                shot={shot}
                sizes={layout.sizes}
                // 첫 장이 이 페이지의 LCP다. 나머지는 기본값(지연 로드).
                priority={index === 0 && column === 0}
                onOpen={() => setOpenIndex(flatIndexOf(index, column))}
              />
            ))}
          </div>
        );
      })}
      {mobile && <MobileFrame shot={mobile} />}
      <Lightbox
        items={items}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </figure>
  );
}

/**
 * 데스크톱 스크린샷을 브라우저 창처럼 감싼다. 제목 줄이 화면 이름을 들고 있어
 * 스크린샷마다 무엇을 보는 중인지 바로 읽힌다 — 캡션 한 줄로 몰아 적지 않는다.
 *
 * 제목 줄은 그대로 두고 이미지 영역만 버튼으로 만든다. 창틀 전체를 버튼으로
 * 감싸면 제목 줄 텍스트까지 버튼 이름에 섞여 접근가능 이름이 지저분해진다.
 */
function BrowserFrame({
  shot,
  sizes,
  priority,
  onOpen,
}: {
  shot: Shot;
  sizes: string;
  priority: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card-deep">
      <div className="flex items-center gap-2.5 border-b border-line px-3 py-2">
        <span aria-hidden="true" className="flex flex-none gap-1.5">
          <span className="size-2 rounded-full bg-ghost" />
          <span className="size-2 rounded-full bg-ghost" />
          <span className="size-2 rounded-full bg-ghost" />
        </span>
        <span className="truncate font-mono text-[10.5px] text-tertiary">
          {shot.label}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`크게 보기: ${shot.alt}`}
        className="group relative block w-full cursor-pointer"
      >
        <Image
          src={getScreenshot(shot.src)}
          alt={shot.alt}
          sizes={sizes}
          placeholder="blur"
          priority={priority}
          className="h-auto w-full bg-card"
        />
        {/* 그리드에서는 폭에 맞춰 축소돼 있다 — 원본 크기로 보려면 누르라는 신호 */}
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 rounded border border-line bg-rail/90 px-1.5 py-0.5 font-mono text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          ⤢
        </span>
      </button>
    </div>
  );
}

// scripts/capture-mobile.mjs가 deviceScaleFactor 2로 찍는다 —
// PNG 픽셀을 이 값으로 나누면 촬영 당시의 논리 해상도가 나온다.
const CAPTURE_SCALE = 2;
const FRAME_WIDTH = 232;
// 화면을 길게 찍은 프로젝트(설교 목록 등)는 프레임이 너무 커지지 않게 폭을 줄인다.
const FRAME_MAX_HEIGHT = 560;

/** 실제 휴대폰 폭(390px)으로 찍은 스크린샷을 기기 프레임에 넣어 보여준다. */
function MobileFrame({ shot }: { shot: MobileShot }) {
  const image = getScreenshot(shot.src);
  const ratio = image.width / image.height;
  const width = Math.round(Math.min(FRAME_WIDTH, FRAME_MAX_HEIGHT * ratio));

  return (
    <div className="mt-7 grid items-center gap-6 border-t border-line pt-8 md:grid-cols-[auto_1fr] md:gap-9">
      <div
        style={{ width }}
        className="mx-auto rounded-[30px] border-[7px] border-line-accent bg-card shadow-[0_18px_44px_rgba(0,0,0,.5)] md:mx-0"
      >
        <Image
          src={image}
          alt={shot.alt}
          sizes={`${width}px`}
          placeholder="blur"
          className="h-auto w-full rounded-[23px]"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-[11px] text-accent">
          $ open --device mobile
        </span>
        <p className="max-w-[420px] text-[13px] leading-[1.85] text-pretty text-muted">
          {shot.note}
        </p>
        <span className="font-mono text-[11px] text-faint">
          {image.width / CAPTURE_SCALE} × {image.height / CAPTURE_SCALE} · 실제
          서비스 화면
        </span>
      </div>
    </div>
  );
}
