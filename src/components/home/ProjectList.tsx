"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState } from "react";

export type ProjectRow = {
  slug: string;
  title: string;
  summary: string;
  stackLine: string;
  badge: { label: string; tone: "accent" | "muted" };
  /** 서버에서 매니페스트로 풀어 넘긴다 — 원본 비율을 알아야 잘라내지 않고 그린다. */
  preview: StaticImageData;
};

export function ProjectList({ projects }: { projects: ProjectRow[] }) {
  const [preview, setPreview] = useState<StaticImageData | null>(null);

  return (
    <>
      <div className="flex flex-col" onMouseLeave={() => setPreview(null)}>
        {projects.map((project, index) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            onMouseEnter={() => setPreview(project.preview)}
            className={`grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 rounded-sm px-2 py-4 text-[13.5px] hover:bg-card md:grid-cols-[190px_1fr_170px_70px] md:gap-x-[18px] md:gap-y-0 ${
              index < projects.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <strong className="text-ink md:order-1">{project.title} ↗</strong>
            <span
              className={`text-right font-mono text-[10.5px] md:order-4 ${
                project.badge.tone === "accent"
                  ? "text-accent"
                  : "text-tertiary"
              }`}
            >
              {project.badge.label}
            </span>
            <span className="col-span-2 text-muted md:order-2 md:col-span-1">
              {project.summary}
            </span>
            <span className="col-span-2 font-mono text-[11px] text-faint md:order-3 md:col-span-1">
              {project.stackLine}
            </span>
          </Link>
        ))}
      </div>

      {/* 우하단 미리보기. 포인터가 있는 넓은 화면에서만 띄운다.
          화면 전체가 보여야 미리보기 구실을 하므로 잘라내지 않고 담는다. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed right-7 bottom-7 z-50 hidden h-[215px] w-[360px] items-center justify-center overflow-hidden rounded-lg border border-line-accent bg-card shadow-[0_16px_48px_rgba(0,0,0,.55)] transition-[opacity,transform] duration-[180ms] xl:flex ${
          preview ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {preview && (
          <Image
            src={preview}
            alt=""
            sizes="360px"
            className="h-auto max-h-full w-full object-contain"
          />
        )}
      </div>
    </>
  );
}
