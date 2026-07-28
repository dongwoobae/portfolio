// Workers 바인딩 타입. `wrangler types`(npm run cf-typegen) 생성물은 workerd 런타임
// 타입 14,000줄을 통째로 쏟아내고 재생성할 때마다 수동 추가분을 지운다. 그래서
// 생성물은 gitignore에 두고, 실제로 코드가 쓰는 값만 여기에 손으로 선언한다.
// 값은 운영은 `wrangler secret put`, 로컬은 `.dev.vars`로 주입한다.
interface CloudflareEnv {
  RESUME_PASSWORD?: string;
  RESUME_PHONE?: string;
  // wrangler.jsonc의 ratelimits 바인딩. @cloudflare/workers-types의 RateLimit과
  // 같은 모양이지만, 이 파일은 import 없는 전역 선언이라 구조만 손으로 적는다
  // (import를 넣으면 모듈이 되어 CloudflareEnv 전역 선언이 깨진다).
  RESUME_RATE_LIMIT?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}
