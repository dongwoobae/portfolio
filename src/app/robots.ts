import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// 학습 데이터만 수집하고 유입은 돌려주지 않는 크롤러들. AI 검색봇
// (OAI-SearchBot·Claude-SearchBot·PerplexityBot 등)은 질문한 사용자에게 이 사이트를
// 노출해 주므로 검색엔진과 같은 취급 — 위의 "*" 규칙에 그대로 남긴다.
// Google-Extended·Applebot-Extended는 각각 Googlebot·Applebot과 분리된 토큰이라
// 막아도 구글 검색·Spotlight 노출에는 영향이 없다.
const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
  "FacebookBot",
  "Amazonbot",
  "Diffbot",
  "Omgilibot",
  "cohere-ai",
  "ImagesiftBot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: TRAINING_CRAWLERS, disallow: "/" },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
