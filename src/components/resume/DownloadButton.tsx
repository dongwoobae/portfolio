"use client";

import { useEffect, useRef, useState } from "react";
import { useUnlock } from "@/components/resume/UnlockContext";

export function DownloadButton() {
  const { setPhone } = useUnlock();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setPassword("");
    setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/resume-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? "시도가 너무 잦습니다. 잠시 후 다시 시도하세요."
            : "비밀번호가 올바르지 않습니다.",
        );
        return;
      }
      const data = (await response.json()) as { phone: string };
      setPhone(data.phone);
      close();
      // 전화번호가 DOM에 반영된 뒤 인쇄 다이얼로그를 연다.
      // 같은 틱에 호출하면 번호가 빠진 채로 인쇄될 수 있다.
      requestAnimationFrame(() => window.print());
    } catch {
      setError("요청에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded border border-line px-3 py-1.5 font-mono text-[11.5px] text-accent hover:border-accent print:hidden"
      >
        ↓ 이력서 다운로드
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="이력서 다운로드"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 print:hidden"
          onClick={close}
        >
          <form
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-[320px] flex-col gap-3 rounded-lg border border-line bg-card p-6"
          >
            <p className="font-mono text-[11.5px] text-faint">
              $ unlock resume.pdf
            </p>
            <p className="text-[12.5px] leading-[1.7] text-muted">
              연락처가 포함된 이력서를 내려받습니다. 비밀번호를 입력하세요.
            </p>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label="이력서 다운로드 비밀번호"
              className="rounded border border-line bg-page px-3 py-2 font-mono text-[13px] text-ink"
            />
            <span aria-live="polite" className="text-[11.5px] text-muted">
              {error}
            </span>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="cursor-pointer px-3 py-1.5 font-mono text-[11.5px] text-faint"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={pending || password.length === 0}
                className="cursor-pointer rounded border border-line px-3 py-1.5 font-mono text-[11.5px] text-accent disabled:opacity-40"
              >
                {pending ? "확인 중" : "다운로드"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
