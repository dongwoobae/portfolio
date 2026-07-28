// 정적 임포트한 이미지(`import x from "../../public/....png"`)의 타입 선언.
//
// 같은 참조가 next-env.d.ts에도 있지만 그 파일은 gitignore 대상이고 `next build`가
// 만든다. CI는 build보다 typecheck를 먼저 돌리므로 그때는 존재하지 않는다 —
// 그러면 src/content/projects/screenshots.ts의 PNG 임포트가 전부 TS2307로 깨진다.
// 빌드 산출물에 기대지 않도록 여기에 못박아 둔다.
/// <reference types="next/image-types/global" />
