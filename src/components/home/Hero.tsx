import Image from "next/image";
import Link from "next/link";
import { getProjectsInOrder } from "@/lib/projects";
import { site } from "@/lib/site";

export function Hero() {
  const operating = getProjectsInOrder().filter(
    (p) => p.status === "operating",
  );

  return (
    <section className="border-b border-line py-20">
      {/* 원본은 354×472 증명사진이다. 112px 원형이면 2x(224px)에서도 선명하고,
          흰 배경 경계가 원형 마스크에 가려 아이보리 페이지 배경과 충돌하지 않는다.
          object-top으로 잘라야 정사각 크롭에서 얼굴이 남는다. */}
      <div className="relative h-28 w-28 overflow-hidden rounded-full border border-line">
        <Image
          src="/photo/dongwoo_photo.jpg"
          alt="배동우 프로필 사진"
          fill
          sizes="112px"
          priority
          className="object-cover object-top"
        />
      </div>
      <p className="mt-6 font-mono text-sm text-accent">{site.role}</p>
      <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        {site.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        {site.tagline} 기획부터 인프라 운영까지 혼자 맡았고, 프론트엔드도 직접
        구현합니다.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {operating.map((project) => (
          <a
            key={project.slug}
            href={project.liveUrl}
            className="bg-surface inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-ink"
            rel="noreferrer"
            target="_blank"
          >
            <span aria-hidden className="bg-live h-2 w-2 rounded-full" />
            {project.title.replace(" 홈페이지", "")} 운영 중 ↗
          </a>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/projects"
          className="hover:text-accent-hover font-bold text-accent"
        >
          프로젝트 전체 보기 →
        </Link>
      </div>
    </section>
  );
}
