# 프로젝트 스크린샷

상세 페이지(`src/content/projects/case-studies.ts`)가 참조하는 실서비스 화면이다.
파일을 추가하면 [`src/content/projects/screenshots.ts`](../../src/content/projects/screenshots.ts)에도
한 줄 등록해야 한다 — 거기서 정적 임포트한 원본 치수로 `next/image`가 비율을 잡는다.
등록이 빠지면 `src/content/projects/assets.test.ts`가 깨진다.

## 데스크톱 (`./`)

가로는 1920 고정, 세로는 화면마다 다르다 — 대부분 912~920이고
`sumgim-calculator`만 계산 결과까지 담느라 1080이다.

| 프로젝트     | 파일                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 모두의캠퍼스 | `modu-map` · `modu-slope` · `modu-admin-buildings` · `modu-facility-add` · `modu-polygon-draw` · `modu-building-detail` |
| 안강섬김     | `sumgim-home` · `sumgim-calculator` · `sumgim-admin-dashboard` · `sumgim-blur-gallery`                                  |
| 영천중앙교회 | `ycc-home` · `ycc-sermon-detail` · `ycc-admin-sermons`                                                                  |
| 한약안전사용 | `hmsu-home` · `hmsu-search`                                                                                             |
| 월드ENC      | `worldeng-home` · `worldeng-reserve` · `worldeng-admin-booking` · `worldeng-admin-board` · `worldeng-admin-staff`       |

`*-home` / `modu-map`은 메인 프로젝트 목록의 hover 미리보기에도 쓴다.

원래는 디자인 핸드오프(`design_handoff_portfolio/assets`)에서 가져온 원본이었다.
그런데 사람이 띄운 창을 캡처한 것이라 **14장 중 13장에 "Windows 정품 인증" 워터마크**가,
9장에 브라우저 스크롤바가 함께 찍혀 있었다. 썸네일에서는 안 보이지만 라이트박스 `1:1`에서
그대로 드러난다. 그래서 `sumgim-blur-gallery`를 뺀 13장을 헤드리스로 다시 찍었다 —
헤드리스는 OS 워터마크가 원천적으로 없고 스크롤바는 CSS로 지운다.

### 다시 찍기

```
npm run shots:desktop              # 공개 화면 전부
npm run shots:desktop ycc-home     # 일부만
```

`TARGETS`에 `manual: true`가 붙은 것은 이름을 직접 대야만 찍힌다 — 결과가 아직
쓸 만하지 않아 기본 실행에서 뺀 것들이다(아래 "남은 것" 참고).

촬영 URL·뷰포트 높이·대기 시간은 `scripts/capture-desktop.mjs`의 `TARGETS`에 있다.
히어로가 캐러셀인 곳(`sumgim-home`)은 `prepare`에서 첫 슬라이드로 고정한다 —
안 그러면 찍을 때마다 슬라이드가 달라진다.

로그인이 필요한 관리자 화면 7장은 자격증명을 스크립트에 두지 않으려고 따로 뺐다.
`scripts/capture-admin.mjs`가 창만 띄워 두고 기다리므로, 사람이 로그인·화면 이동을
마친 뒤 제어 폴더에 `shoot.json`을 넣으면 그때 셔터를 누른다. 뷰포트·스크롤바 제거·
애니메이션 정지 규칙은 `capture-desktop.mjs`와 같게 맞춰 뒀다.

```
node scripts/capture-admin.mjs <제어폴더>
echo '{"slug":"ycc-admin-sermons","height":915,"url":"..."}' > <제어폴더>/shoot.json
```

### 남은 것

- `modu-building-detail`의 시설 영상 자리가 검은 사각형이다. R2에 올라간 mp4의 비디오
  트랙이 HEVC(`hvc1`)라 Chrome이 디코드를 못 한다(`readyState`는 4인데 `videoWidth`가 0).
  촬영 문제가 아니라 실제 사이트에서도 같으므로, `korea-univ-project`에서 H.264로
  재인코딩한 뒤 `npm run shots:desktop modu-building-detail`로 다시 찍어야 한다.
- `modu-admin-buildings`의 상단 통계 카드 6개가 전부 `—`다. 이건 원본도 같았다.

### 찍었다가 뺀 것

케이스 스터디에 대응 화면이 없던 자리를 메우면서 두 장은 넣지 않기로 했다.
`TARGETS`에는 `manual: true`로 남겨 뒀으니, 판단이 바뀌면 이름을 대서 찍으면 된다.

- `ycc-bulletin-detail` — HWP 주보 파싱 결과가 표로 잘 드러나지만, 봉사 일정표에
  교인 실명이 수십 개 딸려 온다. 교회 사이트에 공개돼 있는 것과 그걸 이력용
  포트폴리오로 옮겨 싣는 것은 다른 문제라 뺐다. 출석현황 표만 담기게 `height`를
  660쯤으로 줄여 찍으면 이름 없이 구조만 보여줄 수 있다.
- `sumgim-photos` — 공개 사진 게시판. 블러는 사진마다 켜고 끌 수 있어서(관리자
  화면의 원본/블러 토글) 앨범 목록에 블러가 안 걸린 얼굴이 섞인다. 이 폴더의
  규칙은 "얼굴 블러가 적용된 공개본만 쓴다"이고, 목록 내용은 센터가 CMS로 계속
  바꾸므로 한 번 확인하고 넣어도 나중에 규칙을 어기는 그림이 될 수 있다.

## 모바일 (`./mobile/`)

`npm run shots:mobile`이 라이브 사이트를 찍어 만든다(재실행하면 덮어쓴다).
폭은 항상 390논리px × 2배율 = 780px이고, 세로는 화면마다 다르다 —
설교 목록처럼 히어로·탭·목록을 한 장에 담아야 하는 곳만 길게 잡았다.

촬영 URL·높이·대기 시간은 `scripts/capture-mobile.mjs`의 `TARGETS`에 있다.
로그인이 필요한 관리자 화면은 자동 촬영 대상이 아니라 공개 화면만 있다.

사진 게시판 화면(`sumgim-blur-gallery`)은 **얼굴 블러가 적용된 공개본**만 쓴다.
