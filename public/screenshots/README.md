# 프로젝트 스크린샷

상세 페이지(`src/content/projects/case-studies.ts`)가 참조하는 실서비스 화면이다.
파일을 추가하면 [`src/content/projects/screenshots.ts`](../../src/content/projects/screenshots.ts)에도
한 줄 등록해야 한다 — 거기서 정적 임포트한 원본 치수로 `next/image`가 비율을 잡는다.
등록이 빠지면 `src/content/projects/assets.test.ts`가 깨진다.

## 데스크톱 (`./`)

디자인 핸드오프(`design_handoff_portfolio/assets`)에서 그대로 가져온 원본 PNG다.

| 프로젝트     | 파일                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| 모두의캠퍼스 | `modu-map` · `modu-admin-buildings` · `modu-facility-add` · `modu-building-detail`           |
| 안강섬김     | `sumgim-home` · `sumgim-admin-dashboard` · `sumgim-blur-gallery`                             |
| 영천중앙교회 | `ycc-home` · `ycc-admin-sermons`                                                             |
| 한약안전사용 | `hmsu-home`                                                                                  |
| 월드ENC      | `worldeng-home` · `worldeng-admin-booking` · `worldeng-admin-board` · `worldeng-admin-staff` |

`*-home` / `modu-map`은 메인 프로젝트 목록의 hover 미리보기에도 쓴다.

## 모바일 (`./mobile/`)

`npm run shots:mobile`이 라이브 사이트를 찍어 만든다(재실행하면 덮어쓴다).
폭은 항상 390논리px × 2배율 = 780px이고, 세로는 화면마다 다르다 —
설교 목록처럼 히어로·탭·목록을 한 장에 담아야 하는 곳만 길게 잡았다.

촬영 URL·높이·대기 시간은 `scripts/capture-mobile.mjs`의 `TARGETS`에 있다.
로그인이 필요한 관리자 화면은 자동 촬영 대상이 아니라 공개 화면만 있다.

사진 게시판 화면(`sumgim-blur-gallery`)은 **얼굴 블러가 적용된 공개본**만 쓴다.
