"use client";

import { useEffect, useState } from "react";

const LINE_1 = "Backend-driven";
const LINE_2 = "Fullstack Developer";
const FULL = `${LINE_1}\n${LINE_2}`;

// 사람이 치는 것처럼 불규칙하게. 공백·하이픈 뒤는 살짝 멈칫한다.
const DELAY_BASE = 45;
const DELAY_PAUSE = 160;
const DELAY_JITTER = 90;
const START_DELAY = 500;

/**
 * 히어로 타이틀. 화면에는 한 글자씩 찍히지만 DOM에는 전문이 항상 들어 있다
 * (sr-only + noscript) — 스크린리더·크롤러·JS 미실행 환경에서도 제목이 읽힌다.
 */
export function HeroTitle() {
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    const tick = () => {
      // 애니메이션을 끈 사용자에게는 타이핑 없이 전문을 한 번에 보여준다.
      if (reduced) {
        setTyped(FULL.length);
        return;
      }
      index += 1;
      setTyped(index);
      if (index >= FULL.length) return;
      // 다음에 찍을 글자를 보고 간격을 정한다.
      const next = FULL[index];
      const base = next === " " || next === "-" ? DELAY_PAUSE : DELAY_BASE;
      timer = setTimeout(tick, base + Math.random() * DELAY_JITTER);
    };

    timer = setTimeout(tick, reduced ? 0 : START_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <h2 className="min-h-[2.7em] text-[30px] leading-[1.35] font-bold tracking-[-0.01em] sm:text-[34px] md:text-[40px]">
      <span className="sr-only">{`${LINE_1} ${LINE_2}`}</span>
      <noscript>
        <span aria-hidden="true" className="whitespace-pre-line">
          {FULL}
        </span>
      </noscript>
      <span aria-hidden="true" className="whitespace-pre-line">
        {FULL.slice(0, typed)}
      </span>
      <span
        aria-hidden="true"
        className="ml-0.5 text-accent"
        style={{ animation: "blink 1s step-end infinite" }}
      >
        ▊
      </span>
    </h2>
  );
}
