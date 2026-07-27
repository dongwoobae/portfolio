import type { Metadata } from "next";
import { getProjectsInOrder } from "@/lib/projects";
import { formatPeriod } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "소개",
  description: "배동우 — 백엔드 중심 풀스택 개발자. 경력과 개발 철학.",
};

const BACKGROUND = [
  { period: "~ 2024.02", label: "고려대학교 지구환경과학과 졸업" },
  {
    period: "2024.03 ~ 2024.09",
    label: "네이버클라우드 클라우드 기반 웹 데브옵스 과정 수료",
  },
  {
    period: "2024.11 ~",
    label: "Java·Spring Boot, TypeScript·NestJS·Next.js 실무",
  },
];

export default function AboutPage() {
  const projects = getProjectsInOrder();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">소개</h1>

      <p className="mt-6 leading-relaxed text-muted">
        실제 사용자와 운영자의 문제를 제품으로 해결하고, 기획부터 배포·운영까지
        책임지는 것을 지향합니다. AI가 코드를 빠르게 생성할 수 있는 시대일수록
        중요한 것은 &ldquo;무엇을 왜 만들어야 하는가&rdquo;라고 생각합니다.
      </p>

      <p className="mt-4 leading-relaxed text-muted">
        기관 웹서비스 의뢰를 받아 개발·운영하고 있습니다. 첫 프로젝트가 잘
        마무리된 뒤 소개를 통해 후속 프로젝트로 이어졌고, 지금은
        접근성·공공서비스·운영자 CMS 쪽 경험이 쌓였습니다.
      </p>

      <section className="mt-16">
        <h2 className="text-xl font-bold">배경</h2>
        <ul className="mt-6 space-y-4">
          {BACKGROUND.map((item) => (
            <li
              key={item.label}
              className="flex flex-col gap-1 sm:flex-row sm:gap-6"
            >
              <span className="font-mono text-sm text-faint sm:w-44 sm:shrink-0">
                {item.period}
              </span>
              <span className="text-muted">{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-bold">프로젝트 타임라인</h2>
        <ul className="mt-6 space-y-6">
          {projects.map((project) => (
            <li key={project.slug} className="border-l-2 border-line pl-5">
              <p className="font-mono text-sm text-faint">
                {formatPeriod({
                  start: project.periodStart,
                  end: project.periodEnd,
                  note: project.periodNote,
                })}
              </p>
              <p className="mt-1 font-bold">{project.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {project.summary}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-bold">연락</h2>
        <ul className="mt-6 space-y-2 text-muted">
          <li>
            <a href={`mailto:${site.email}`} className="hover:text-ink">
              {site.email}
            </a>
          </li>
          <li>
            <a href={site.github} className="hover:text-ink">
              github.com/dongwoobae
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
