import Image from "next/image";
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

export function CaseStudyShots({
  rows,
  mobile,
}: {
  rows: Shot[][];
  mobile?: MobileShot;
}) {
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
              />
            ))}
          </div>
        );
      })}
      {mobile && <MobileFrame shot={mobile} />}
    </figure>
  );
}

/**
 * 데스크톱 스크린샷을 브라우저 창처럼 감싼다. 제목 줄이 화면 이름을 들고 있어
 * 스크린샷마다 무엇을 보는 중인지 바로 읽힌다 — 캡션 한 줄로 몰아 적지 않는다.
 */
function BrowserFrame({
  shot,
  sizes,
  priority,
}: {
  shot: Shot;
  sizes: string;
  priority: boolean;
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
      <Image
        src={getScreenshot(shot.src)}
        alt={shot.alt}
        sizes={sizes}
        placeholder="blur"
        priority={priority}
        className="h-auto w-full bg-card"
      />
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
