"use client";

import { useRef, useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "copied" | "failed";

const LABEL: Record<Status, string> = {
  idle: "",
  copied: "copied ✓",
  failed: "복사 실패 — 직접 선택하세요",
};

// 클릭 = 클립보드 복사. mailto:를 쓰지 않는 이유는 윈도우 데스크톱에서
// Outlook이나 앱 선택 대화상자가 뜨기 때문이다. 웹메일 사용자에게는 방해다.
// Gmail 바로가기는 보조 수단이고, 기본 동작은 어디까지나 복사다.
export function CopyEmail({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const addressRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(next: Status) {
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.email);
      flash("copied");
    } catch {
      // 권한 거부·비보안 컨텍스트 등. 사용자가 직접 복사할 수 있게 선택해 준다.
      const node = addressRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      flash("failed");
    }
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer font-medium text-accent underline-offset-4 hover:underline"
      >
        <span ref={addressRef}>{site.email}</span>
      </button>
      <a
        href={`https://mail.google.com/mail/?view=cm&to=${site.email}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[10.5px] text-faint hover:text-muted"
      >
        [Gmail]
      </a>
      <span aria-live="polite" className="font-mono text-[10.5px] text-accent">
        {LABEL[status]}
      </span>
    </span>
  );
}
