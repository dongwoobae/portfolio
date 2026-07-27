/** 메인의 섹션 한 칸. 제목 자리에 `$ 명령` 프롬프트가 온다. */
export function Section({
  id,
  label,
  prompt,
  comment,
  children,
}: {
  id?: string;
  /** 화면에 보이는 제목이 프롬프트뿐이라 랜드마크 이름은 따로 준다. */
  label: string;
  prompt: string;
  comment?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className="scroll-mt-6 border-t border-line px-6 py-9 md:px-13 md:py-[38px]"
    >
      <p className="mb-5 font-mono text-[13px] text-faint">
        {prompt}
        {comment && <span className="text-ghost"> {comment}</span>}
      </p>
      {children}
    </section>
  );
}
