import Image from "next/image";
import type { Shot } from "@/content/projects/case-studies";

// 한 줄에 몇 장이냐에 따라 높이·그리드·이미지 요청 크기가 정해진다.
const ROW = {
  1: {
    grid: "grid-cols-1",
    height: "h-[240px] md:h-[440px]",
    sizes: "(max-width: 1040px) 100vw, 880px",
  },
  2: {
    grid: "grid-cols-1 sm:grid-cols-2",
    height: "h-[220px] md:h-[340px]",
    sizes: "(max-width: 640px) 100vw, (max-width: 1040px) 50vw, 440px",
  },
  3: {
    grid: "grid-cols-1 sm:grid-cols-3",
    height: "h-[200px] md:h-[260px]",
    sizes: "(max-width: 640px) 100vw, (max-width: 1040px) 33vw, 290px",
  },
} as const;

export function CaseStudyShots({
  rows,
  caption,
}: {
  rows: Shot[][];
  caption?: string;
}) {
  return (
    <figure className="my-10 flex flex-col gap-3.5">
      {rows.map((row, index) => {
        const layout = ROW[Math.min(row.length, 3) as 1 | 2 | 3];
        return (
          <div key={index} className={`grid gap-3.5 ${layout.grid}`}>
            {row.map((shot) => (
              <div
                key={shot.src}
                className={`relative overflow-hidden rounded-lg bg-card ${layout.height}`}
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes={layout.sizes}
                  className="object-cover object-top"
                />
              </div>
            ))}
          </div>
        );
      })}
      {caption && (
        <figcaption className="font-mono text-[11px] text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
