import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyEmail } from "@/components/contact/CopyEmail";
import { DownloadButton } from "@/components/resume/DownloadButton";
import { PrintPhone } from "@/components/resume/PrintPhone";
import { UnlockProvider } from "@/components/resume/UnlockContext";
import { career, highlights, stackLines } from "@/content/home";
import { resume } from "@/content/resume";
import { site } from "@/lib/site";

// noindex는 접근 통제가 아니라 검색 노출 방지일 뿐이다. URL을 아는 사람은
// 누구나 열람할 수 있으므로 본문은 공개 전제로 쓴다. 잠그는 값은 전화번호뿐이다.
export const metadata: Metadata = {
  title: "이력서",
  robots: { index: false, follow: false },
};

const jobs = career.filter((item) => item.kind === "job");

function SectionHead({ children }: { children: React.ReactNode }) {
  // print:text-(--print-accent) — Tailwind v4의 CSS 변수 참조 문법이다.
  // v3의 text-[--print-accent]는 v4에서 var()로 감싸지지 않아 색이 적용되지 않는다.
  return (
    <h2 className="mt-9 mb-3 border-b border-line pb-1.5 text-[15px] font-bold text-accent print:mt-7 print:border-[#ddd] print:text-[11pt] print:text-(--print-accent)">
      {children}
    </h2>
  );
}

// 좌측 라벨(기간) + 우측 내용. 랜딩 경력 섹션과 같은 문법이라 화면과 종이의
// 인상이 이어지고, 1열 나열보다 밀도가 높아 A4 1장에 들어간다.
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="resume-row flex flex-col gap-1 py-2 sm:flex-row sm:gap-[18px] print:break-inside-avoid print:flex-row">
      <span className="font-mono text-[11.5px] text-faint sm:w-24 sm:flex-none print:w-[22mm] print:text-[8.5pt] print:text-[#666]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function ResumePage() {
  return (
    // 전화번호 상태를 다운로드 버튼(우측 상단)과 인쇄 전용 행(연락처 블록)이
    // 함께 봐야 하므로 페이지 전체를 provider로 감싼다.
    <UnlockProvider>
      <main id="main" className="min-h-screen bg-page print:bg-white">
        <div className="resume-sheet mx-auto max-w-[860px] px-5 pb-20 md:px-10 print:max-w-none print:px-0 print:pb-0">
          <div className="flex items-center justify-between gap-4 border-b border-line py-[22px] font-mono print:hidden">
            <Link href="/" className="text-[12.5px] text-tertiary">
              ← cd ~/dongwoobae
            </Link>
            <DownloadButton />
          </div>

          <header className="flex items-start justify-between gap-6 pt-10 print:pt-0">
            <div>
              <h1 className="text-[28px] font-bold print:text-[18pt]">
                {site.name}
              </h1>
              <p className="mt-1.5 font-mono text-[12px] text-tertiary print:text-[9pt]">
                backend-driven fullstack
              </p>
              <div className="resume-contact mt-4 flex flex-col gap-1.5 text-[13px] print:text-[9pt]">
                <span className="flex items-baseline gap-2.5">
                  <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
                    mail
                  </span>
                  <CopyEmail />
                </span>
                {/* 화면에는 전화번호가 없다. 해제 후에도 인쇄에만 나타난다. */}
                <PrintPhone />
                <span className="flex items-baseline gap-2.5">
                  <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
                    web
                  </span>
                  <span className="text-muted">
                    {site.url.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <span className="flex items-baseline gap-2.5">
                  <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
                    git
                  </span>
                  <span className="text-muted">{site.githubLabel}</span>
                </span>
              </div>
            </div>
            <Image
              src="/photo/dongwoo_photo.jpg"
              alt="배동우 프로필 사진"
              width={98}
              height={124}
              className="h-[124px] w-[98px] flex-none rounded border border-line object-cover object-top print:h-[33mm] print:w-[26mm] print:rounded-none"
            />
          </header>

          <SectionHead>요약</SectionHead>
          <ul className="flex flex-col gap-1.5 text-[13px] leading-[1.7] text-muted print:gap-0 print:text-[9.5pt] print:text-[#111]">
            {resume.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <SectionHead>경력</SectionHead>
          {jobs.map((job) => (
            <Row key={job.title} label={job.period}>
              <strong className="text-[14px] print:text-[10pt]">
                {job.title}
              </strong>
              <ul className="mt-1 flex flex-col gap-1 text-[12.5px] leading-[1.7] text-muted print:gap-0 print:text-[9.5pt] print:text-[#111]">
                {resume.achievements[job.title]?.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </Row>
          ))}

          <SectionHead>대표 프로젝트</SectionHead>
          {/* A4 1장 제약. 3건을 실으면 인쇄가 2장으로 넘어간다. */}
          {highlights.slice(0, 2).map((item) => (
            <Row key={item.slug} label={item.kicker}>
              <strong className="text-[14px] print:text-[10pt]">
                {item.title}
              </strong>
              <p className="mt-1 text-[12.5px] leading-[1.7] text-muted print:text-[9.5pt] print:text-[#111]">
                {item.description}
              </p>
            </Row>
          ))}

          <SectionHead>기술 스택</SectionHead>
          <div className="flex flex-col gap-1.5 text-[12.5px] print:gap-0 print:text-[9.5pt]">
            {stackLines.map((line) => (
              <Row key={line.label} label={line.label}>
                <span className="text-muted print:text-[#111]">
                  {line.value}
                </span>
              </Row>
            ))}
          </div>

          <SectionHead>학력</SectionHead>
          {resume.education.map((item) => (
            <Row key={item.school} label={item.period}>
              <strong className="text-[13.5px] print:text-[10pt]">
                {item.school}
              </strong>{" "}
              <span className="text-[12.5px] text-muted print:text-[9.5pt] print:text-[#111]">
                {item.detail}
              </span>
            </Row>
          ))}

          <SectionHead>자격증 · 어학</SectionHead>
          {resume.certificates.map((item) => (
            <Row key={item.name} label={item.date}>
              <span className="text-[12.5px] text-muted print:text-[9.5pt] print:text-[#111]">
                {item.name}
              </span>
            </Row>
          ))}
          {resume.languages.map((item) => (
            <Row key={item.name} label={item.name}>
              <span className="text-[12.5px] text-muted print:text-[9.5pt] print:text-[#111]">
                {item.score}
              </span>
            </Row>
          ))}
        </div>
      </main>
    </UnlockProvider>
  );
}
