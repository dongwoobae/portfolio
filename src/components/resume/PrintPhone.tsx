"use client";

import { useUnlock } from "@/components/resume/UnlockContext";

// 해제 전에는 아무것도 렌더하지 않고, 해제 후에도 화면에는 보이지 않는다.
// hidden print:flex — 오직 인쇄 결과물에만 나타난다.
export function PrintPhone() {
  const { phone } = useUnlock();
  if (!phone) return null;

  return (
    <span className="hidden items-baseline gap-2.5 print:flex">
      <span className="w-10 flex-none font-mono text-[10.5px] text-[#666]">
        phone
      </span>
      <span>{phone}</span>
    </span>
  );
}
