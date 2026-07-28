// Workers 런타임에는 Node의 crypto.timingSafeEqual이 없다. Web Crypto만 쓴다.

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return new Uint8Array(digest);
}

function equalInConstantTime(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

// 입력과 정답을 각각 해시해 고정 길이(32바이트)끼리 비교한다.
// 문자열을 직접 비교하면 길이와 첫 불일치 위치가 타이밍으로 새어 나간다.
export async function verifyPassword(
  input: string,
  expected: string,
): Promise<boolean> {
  // secret 주입 실패 시 빈 문자열로 뚫리는 것을 막는다.
  if (!expected || !input) return false;
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  return equalInConstantTime(a, b);
}
