import type { NextConfig } from "next";

// 옛 URL → 새 URL. 프로젝트 목록·소개는 메인 한 장으로 합쳐졌고,
// slug는 상세 페이지 상단의 `projects/<slug>` 표기와 맞추려고 저장소명 기준으로 바꿨다.
const legacySlugs = {
  "ku-barrier-free-map": "modu-campus",
  "ankang-welfare": "ankang-sumgim",
  "ycc-church": "ycc-website",
  "vehicle-manufacturer": "worldengco",
  "herbal-medicine-platform": "hmsu",
};

const nextConfig: NextConfig = {
  // E2E는 별도 dist를 써서 개발 중인 next dev와 빌드 산출물이 충돌하지 않게 한다.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // E2E에서는 이미지 최적화를 끈다. dev의 `/_next/image`는 정적 원본을 자기 서버에
  // 다시 요청해서 가져오는데 그 대기에는 타임아웃이 없다. 상세 페이지를 동시에 열면
  // 이 재진입 요청이 풀리지 않은 채 dev 서버가 CPU만 태우며 멎고, webServer는 실행당
  // 하나뿐이라 재시도도 같은 서버를 물고 죽는다.
  // 배포는 OpenNext가 이미지를 처리하므로 이 경로는 어차피 프로덕션과 다르다.
  images: { unoptimized: !!process.env.NEXT_E2E },
  // OpenNext는 standalone 출력을 번들한다. 어댑터 자체 빌드를 쓰면 자동 주입되지만,
  // 우리는 `next build --webpack`으로 직접 빌드하고 `--skipNextBuild`로 번들하므로
  // standalone을 명시해야 한다.
  output: "standalone",
  // 워크스페이스 루트를 이 프로젝트로 고정한다. 그러지 않으면 Next가 상위 디렉터리의
  // lockfile을 보고 루트를 추론해, standalone 출력이 하위 경로로 밀려나 OpenNext가 찾지 못한다.
  outputFileTracingRoot: import.meta.dirname,
  async redirects() {
    return [
      { source: "/projects", destination: "/", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      ...Object.entries(legacySlugs).map(([from, to]) => ({
        source: `/projects/${from}`,
        destination: `/projects/${to}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

// `next dev`에서 Cloudflare 바인딩을 사용할 수 있게 한다. 모듈 스코프에서 호출해야 한다.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
