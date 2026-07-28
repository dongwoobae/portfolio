import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { projects } from "@/content/projects/meta";
import { getProjectBySlug } from "@/lib/projects";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 5개 slug 전부를 빌드타임에 굽는다. 이 목록이 곧 생성 대상이고, 덕분에
// 폰트 파일(assets/fonts)이 Worker 번들에 실리지 않는다.
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  // ImageResponse는 next/font를 쓸 수 없다. 폰트 바이트를 직접 넘긴다.
  // 프로젝트 제목·요약이 한글이라 한글 글리프가 있는 폰트가 반드시 필요하다.
  // 없으면 satori 기본 폰트로 떨어져 전부 네모(두부)로 렌더된다.
  // process.cwd()는 Next.js 프로젝트 루트다.
  const font = await readFile(
    join(process.cwd(), "assets/fonts/IBMPlexSansKR-Bold.ttf"),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 80px",
        background: "#0f1216",
        color: "#dfe5ec",
      }}
    >
      {/* satori는 자식이 둘 이상인 div에 명시적 display를 요구한다.
          텍스트와 {slug}를 나누지 않고 한 문자열로 합쳐 자식을 하나로 둔다. */}
      <div style={{ fontSize: 26, color: "#7ee2a8" }}>
        {`$ cat projects/${slug}`}
      </div>
      <div style={{ fontSize: 64, marginTop: 24 }}>{project?.title}</div>
      <div style={{ fontSize: 30, color: "#9aa4b2", marginTop: 18 }}>
        {project?.summary}
      </div>
      <div style={{ fontSize: 24, color: "#5b6572", marginTop: 40 }}>
        {site.url.replace(/^https?:\/\//, "")}
      </div>
    </div>,
    // 폰트를 weight 없이 등록하면 satori가 400으로 잡는다. 카드 본문이 모두
    // 기본 weight라 이 한 벌로 전부 매칭된다(파일 자체가 Bold 컷이다).
    { ...size, fonts: [{ name: "PlexKR", data: font, style: "normal" }] },
  );
}
