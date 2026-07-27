import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 정적 콘텐츠만 서빙하므로 증분 캐시 오버라이드가 필요 없다.
// 온디맨드 재검증이 필요해지면 r2IncrementalCache를 추가하고 wrangler에 버킷을 연결한다.
export default defineCloudflareConfig({});
