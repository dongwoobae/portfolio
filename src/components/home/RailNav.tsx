"use client";

import { useEffect, useState } from "react";
import { sections } from "@/lib/site";

// 뷰포트 중앙 40% 밴드(위 35%·아래 55%를 잘라낸 영역)에 들어온 섹션을 활성으로 본다.
const ROOT_MARGIN = "-35% 0px -55% 0px";

export function RailNav() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: ROOT_MARGIN },
    );

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="섹션 바로가기">
      <p className="mb-2 font-mono text-[11px] text-ghost">$ cat nav.txt</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11.5px] lg:flex-col lg:gap-[9px]">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={`transition-colors duration-200 ${
                active === section.id ? "text-accent" : "text-faint"
              }`}
            >
              → {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
