import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET(): Response {
  // RFC 9116은 Expires를 필수로 요구하고 1년 미만을 권한다. 빌드 시점 기준으로
  // 잡으므로 배포할 때마다 갱신된다. 1년 넘게 배포가 없으면 만료되는데, 그때는
  // 연락처를 신뢰하지 말라는 뜻이라 RFC 의도와 어긋나지 않는다.
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const body =
    [
      `Contact: mailto:${site.email}`,
      `Expires: ${expires.toISOString()}`,
      "Preferred-Languages: ko, en",
      `Canonical: ${site.url}/.well-known/security.txt`,
    ].join("\n") + "\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
