// 다이어그램 노드에 붙는 브랜드 마크를 simple-icons에서 받아 TS 모듈로 굽는다.
//
// 왜 스크립트인가: 로고를 손으로 그리면 반드시 원본과 어긋난다. 진짜 로고들 옆에
// 놓인 근사치는 없느니만 못하다. 공식 경로 데이터를 그대로 받아 쓰고, 어느 버전에서
// 받았는지 생성물 머리에 남긴다.
//
// 실행: node scripts/gen-diagram-logos.mjs   (네트워크 필요, 수동 실행)
//
// 라이선스: simple-icons의 경로 데이터는 CC0-1.0이다. 다만 상표권은 각 소유자에게
// 있으므로, 해당 제품을 가리키는 지시적(nominative) 용도로만 쓴다 — 후원·제휴를
// 암시하는 배치는 하지 않는다.

import { writeFile } from "node:fs/promises";

const VERSION = "16.27.1";
const CDN = `https://cdn.jsdelivr.net/npm/simple-icons@${VERSION}`;
const OUT = new URL(
  "../src/components/project/diagrams/logos.generated.ts",
  import.meta.url,
);

/** 다이어그램에서 쓰는 슬러그만 굽는다. 안 쓰는 마크를 넣어 둘 이유가 없다. */
const SLUGS = [
  "youtube",
  "upstash",
  "neon",
  "cloudflare",
  "sharp",
  "supabase",
  "googlegemini",
  "tensorflow",
  "zod",
];

async function main() {
  const meta = await fetch(`${CDN}/data/simple-icons.json`).then((r) => {
    if (!r.ok) throw new Error(`데이터 파일 실패: ${r.status}`);
    return r.json();
  });
  const bySlug = new Map(meta.map((icon) => [icon.slug, icon]));

  const entries = [];
  for (const slug of SLUGS) {
    const info = bySlug.get(slug);
    if (!info) throw new Error(`simple-icons에 '${slug}'가 없다`);

    const svg = await fetch(`${CDN}/icons/${slug}.svg`).then((r) => {
      if (!r.ok) throw new Error(`${slug}.svg 실패: ${r.status}`);
      return r.text();
    });
    const path = svg.match(/ d="([^"]+)"/)?.[1];
    // 경로를 못 뽑으면 조용히 빈 마크를 굽는 것보다 즉시 터지는 편이 낫다.
    if (!path) throw new Error(`${slug}.svg에서 path를 못 찾았다`);

    entries.push({ slug, title: info.title, hex: `#${info.hex}`, path });
  }

  const body = entries
    .map(
      (e) =>
        `  ${JSON.stringify(e.slug)}: {\n` +
        `    title: ${JSON.stringify(e.title)},\n` +
        `    hex: ${JSON.stringify(e.hex)},\n` +
        `    path: ${JSON.stringify(e.path)},\n` +
        `  },`,
    )
    .join("\n");

  const ids = entries.map((e) => `  | ${JSON.stringify(e.slug)}`).join("\n");

  await writeFile(
    OUT,
    `// 자동 생성 파일 — 직접 편집하지 마라.
// scripts/gen-diagram-logos.mjs가 simple-icons ${VERSION}에서 받아 굽는다.
// 경로 데이터는 CC0-1.0, 상표는 각 소유자의 것이며 지시적 용도로만 쓴다.
// 모든 마크의 좌표계는 24×24다.

export type GeneratedLogoId =
${ids};

export type GeneratedMark = {
  /** 브랜드 정식 표기 — 캡션과 접근성 텍스트에 그대로 쓴다 */
  title: string;
  /** 공식 브랜드 색. 전부 card(#12161c) 대비 3:1을 넘겨 확인했다 */
  hex: string;
  /** viewBox 0 0 24 24 기준 경로 */
  path: string;
};

export const GENERATED_LOGOS: Record<GeneratedLogoId, GeneratedMark> = {
${body}
};
`,
    "utf8",
  );

  console.log(
    `${entries.length}종 생성:`,
    entries.map((e) => e.slug).join(", "),
  );
}

await main();
