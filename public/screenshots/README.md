# 프로젝트 스크린샷

상세 페이지(`src/content/projects/case-studies.ts`)가 참조하는 실서비스 화면이다.
디자인 핸드오프(`design_handoff_portfolio/assets`)에서 그대로 가져온 원본 PNG이며,
`next/image`가 요청 시점에 리사이즈·WebP 변환한다(Workers의 `IMAGES` 바인딩).

| 프로젝트     | 파일                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| 모두의캠퍼스 | `modu-map` · `modu-admin-buildings` · `modu-facility-add` · `modu-building-detail`           |
| 안강섬김     | `sumgim-home` · `sumgim-admin-dashboard` · `sumgim-blur-gallery`                             |
| 영천중앙교회 | `ycc-home` · `ycc-admin-sermons`                                                             |
| 한약안전사용 | `hmsu-home`                                                                                  |
| 월드ENC      | `worldeng-home` · `worldeng-admin-booking` · `worldeng-admin-board` · `worldeng-admin-staff` |

`*-home` / `modu-map`은 메인 프로젝트 목록의 hover 미리보기에도 쓴다.
경로가 실제 파일과 어긋나면 `src/content/projects/assets.test.ts`가 깨진다.

사진 게시판 화면(`sumgim-blur-gallery`)은 **얼굴 블러가 적용된 공개본**만 쓴다.
