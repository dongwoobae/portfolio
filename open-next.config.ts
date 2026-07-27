import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// `generateStaticParams`로 만든 SSG 페이지(●)는 정적 에셋이 아니라 **증분 캐시**를 거쳐 서빙된다.
// 캐시를 지정하지 않으면 매 요청이 MISS로 떨어지고, dynamicParams = false와 겹쳐 404가 된다
// (배포 후 /projects/[slug]가 실제로 404였다. 응답 헤더의 x-nextjs-cache: MISS로 확인).
// 순수 정적 페이지(○)는 에셋에서 바로 나가므로 이 증상이 홈·목록에는 나타나지 않아 놓치기 쉽다.
//
// 이 사이트는 온디맨드 재검증이 없고 빌드 시점 프리렌더 결과만 서빙하므로,
// 빌드 산출물을 Workers Assets에 얹어 읽는 static-assets 캐시가 정확히 맞는다.
// 온디맨드 재검증이 필요해지면 r2IncrementalCache로 바꾸고 wrangler에 버킷을 연결한다.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
