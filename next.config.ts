import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // MDX를 페이지·import 대상으로 인식시킨다.
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // OpenNext는 standalone 출력을 번들한다. 어댑터 자체 빌드를 쓰면 자동 주입되지만,
  // 우리는 `next build --webpack`으로 직접 빌드하고 `--skipNextBuild`로 번들하므로
  // standalone을 명시해야 한다.
  output: "standalone",
  // 워크스페이스 루트를 이 프로젝트로 고정한다. 그러지 않으면 Next가 상위 디렉터리의
  // lockfile을 보고 루트를 추론해, standalone 출력이 하위 경로로 밀려나 OpenNext가 찾지 못한다.
  outputFileTracingRoot: import.meta.dirname,
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

// remark/rehype 플러그인은 추가하지 않는다. Turbopack(dev)은 함수형 플러그인 옵션을
// 직렬화하지 못해 dev/prod 동작이 갈린다. 메타데이터는 MDX frontmatter 대신
// src/content/projects/meta.ts에서 관리한다.
const withMDX = createMDX({});

export default withMDX(nextConfig);

// `next dev`에서 Cloudflare 바인딩을 사용할 수 있게 한다. 모듈 스코프에서 호출해야 한다.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
