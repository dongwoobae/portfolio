"use client";

import { createContext, useContext, useState } from "react";

type UnlockValue = {
  phone: string | null;
  setPhone: (phone: string) => void;
};

const UnlockContext = createContext<UnlockValue | null>(null);

// 전화번호는 어디에도 상수로 들어가지 않는다. 정적 HTML과 JS 번들에 값이 없고,
// /api/resume-contact 응답으로만 이 상태에 들어온다.
export function UnlockProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  return (
    <UnlockContext.Provider value={{ phone, setPhone }}>
      {children}
    </UnlockContext.Provider>
  );
}

export function useUnlock(): UnlockValue {
  const value = useContext(UnlockContext);
  if (!value) throw new Error("UnlockProvider 안에서만 쓸 수 있다");
  return value;
}
