import Link from "next/link";
import { CopyEmail } from "@/components/contact/CopyEmail";
import { HeroTitle } from "@/components/home/HeroTitle";
import { ProjectList } from "@/components/home/ProjectList";
import { Section } from "@/components/home/Section";
import { SideRail } from "@/components/home/SideRail";
import { career, heroHook, heroIntro, highlights, team } from "@/content/home";
import { getScreenshot } from "@/content/projects/screenshots";
import { getProjectsInOrder } from "@/lib/projects";
import { site } from "@/lib/site";

export default function HomePage() {
  const projects = getProjectsInOrder();

  return (
    <div className="flex min-h-screen flex-col bg-page lg:flex-row">
      <SideRail />

      <main id="main" className="min-w-0 flex-1 lg:max-w-[1080px]">
        <div className="px-6 py-12 md:px-13 md:pt-18 md:pb-14">
          <p className="mb-5 font-mono text-[13px] text-faint">$ whoami</p>
          <HeroTitle />

          {/* 첫 화면에서 제일 먼저 읽혀야 하는 문장. 타이핑을 기다리지 않고 바로 떠 있다. */}
          <p className="mt-6 max-w-[620px] text-[21px] leading-[1.5] font-medium tracking-[-0.01em] text-ink sm:text-[23px] md:text-[26px]">
            {heroHook.map((line, index) => (
              <span key={index} className="block">
                {line.map((segment) => (
                  <span
                    key={segment.text}
                    className={segment.accent ? "text-accent" : undefined}
                  >
                    {segment.text}
                  </span>
                ))}
              </span>
            ))}
          </p>

          <p className="mt-6 max-w-[620px] text-[15px] leading-[1.8] text-pretty text-muted">
            {heroIntro.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>

        <Section label="개발 관점" prompt="$ cat perspective.md">
          <p className="max-w-[680px] text-sm leading-[1.9] text-pretty text-muted">
            웹사이트를 화면과 기능의 조합이 아니라{" "}
            <span className="text-ink">
              각 도메인의 운영 문제를 줄이는 도구
            </span>
            로 설계합니다. AI가 코드를 빠르게 생성하는 시대일수록 중요한 것은
            &ldquo;무엇을 왜 만들어야 하는가&rdquo; — 사용자의 업무 흐름과
            운영자의 반복 작업을 먼저 이해하고, 운영자가 체감할 수 있는 차별화
            기능을 제품 안에 녹입니다.
          </p>
        </Section>

        <Section id="career" label="경력" prompt="$ git log --career">
          <div className="flex flex-col gap-3.5 text-[13.5px]">
            {career.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-[18px]"
              >
                <span
                  className={`font-mono text-[11.5px] sm:w-24 sm:flex-none ${
                    item.current ? "text-accent" : "text-faint"
                  }`}
                >
                  {item.period}
                </span>
                <span>
                  <strong>{item.title}</strong>{" "}
                  <span className="text-muted">{item.description}</span>
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="highlights"
          label="하이라이트"
          prompt="$ cat highlights.md"
          comment="# 실서비스에서 공들인 엔지니어링"
        >
          <div className="grid gap-3.5 md:grid-cols-2">
            {highlights.map((item) => (
              <Link
                key={item.title}
                href={`/projects/${item.slug}`}
                className={`flex flex-col gap-2.5 rounded-md border p-[22px_24px] transition-colors hover:border-accent ${
                  item.accent
                    ? "border-line-accent bg-linear-to-b from-card-hi to-card"
                    : "border-line bg-card"
                }`}
              >
                <span
                  className={`font-mono text-[11px] font-medium ${
                    item.accent ? "text-accent" : "text-tertiary"
                  }`}
                >
                  {item.kicker}
                </span>
                <strong className="text-[15px] text-ink">{item.title}</strong>
                <p className="text-[12.5px] leading-[1.7] text-muted">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          id="projects"
          label="프로젝트"
          prompt="$ ls projects/"
          comment="# 클릭하면 세부 페이지 · hover로 미리보기"
        >
          <ProjectList
            projects={projects.map((project) => ({
              slug: project.slug,
              title: project.title,
              summary: project.summary,
              stackLine: project.stackLine,
              badge: project.badge,
              preview: getScreenshot(project.preview),
            }))}
          />
        </Section>

        <Section id="team" label="팀 프로젝트" prompt="$ ls team/">
          <div className="grid gap-3.5 md:grid-cols-2">
            {team.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-2 rounded-md border border-line bg-card p-[20px_22px]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <strong className="text-[15px]">{item.name}</strong>
                  <span className="font-mono text-[10.5px] text-faint">
                    {item.meta}
                  </span>
                </div>
                <p className="text-[12.5px] leading-[1.7] text-muted">
                  {item.description}{" "}
                  <span className="text-ink">{item.role}</span>
                </p>
                <span className="font-mono text-[11px] text-faint">
                  {item.stack}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <footer className="flex flex-col gap-3 border-t border-line px-6 py-7 md:flex-row md:items-center md:justify-between md:px-13">
          <span className="font-mono text-[13px] text-faint">
            $ mail <CopyEmail />
          </span>
          <span className="font-mono text-xs text-faint">
            {site.githubLabel}
          </span>
        </footer>
      </main>
    </div>
  );
}
