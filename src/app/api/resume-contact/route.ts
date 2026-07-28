import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { verifyPassword } from "@/lib/password";

// 이 라우트는 절대 정적화·캐시되면 안 된다. 성공 응답이 한 번이라도 캐시되면
// 비밀번호 없이 전화번호를 받을 수 있게 되어 잠금이 통째로 무의미해진다.
// (라우트 핸들러는 기본적으로 캐시되지 않지만, GET 외 메서드까지 포함해
//  의도를 못박아 둔다. POST만 export하므로 GET은 Next.js가 405로 돌려준다.)
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: HEADERS },
    );
  }

  // OpenNext Workers에서는 process.env로 바인딩된 secret이 잡히지 않는다.
  const { env } = getCloudflareContext();

  // IP 단위로 시도 속도를 제한한다. POP별 최종 일관성이라 완벽한 차단은 아니고,
  // 자동화된 대입의 속도를 떨어뜨리는 것이 목적이다.
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const limiter = env.RESUME_RATE_LIMIT;
  if (limiter) {
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      return Response.json(
        { error: "too_many" },
        { status: 429, headers: HEADERS },
      );
    }
  }

  const ok = await verifyPassword(
    parsed.data.password,
    env.RESUME_PASSWORD ?? "",
  );
  if (!ok) {
    // 실패 사유를 구분해 주지 않는다. secret 미주입도 같은 401로 떨어진다.
    return Response.json(
      { error: "invalid" },
      { status: 401, headers: HEADERS },
    );
  }

  return Response.json({ phone: env.RESUME_PHONE ?? "" }, { headers: HEADERS });
}
