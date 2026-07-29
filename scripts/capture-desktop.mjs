// 프로젝트 상세 페이지에 쓰는 데스크톱 스크린샷을 라이브 사이트에서 다시 찍는다.
//
//   node scripts/capture-desktop.mjs            # 전부
//   node scripts/capture-desktop.mjs ycc-home   # 일부만
//
// 원래 이 폴더의 데스크톱 PNG는 디자인 핸드오프에서 가져온 원본이었다. 그런데
// 전수 조사해 보니 14장 중 13장에 "Windows 정품 인증" 워터마크가, 9장에 브라우저
// 스크롤바가 찍혀 있었다. 사람이 띄운 창을 캡처한 것이라 생길 수밖에 없는 흔적이다.
// 헤드리스는 OS 워터마크가 원천적으로 없고 스크롤바도 CSS로 지울 수 있어, 공개
// 화면만이라도 여기서 다시 찍는다.
//
// 로그인이 필요한 관리자 화면은 여기서 못 찍는다 — 자격증명을 스크립트에 두지 않으려고
// 사람이 로그인하고 셔터만 눌러 주는 capture-admin.mjs로 따로 뺐다.

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "screenshots");

// 가로는 1920으로 고정한다. 세로는 교체 대상 PNG의 현재 높이를 그대로 쓴다 —
// 승인된 구도를 유지해 상세 페이지 그리드가 흔들리지 않게 하려는 것이다.
// (기존 높이가 912~920으로 제각각인 건 캡처한 창 크기가 그때그때 달랐기 때문이다.)
const WIDTH = 1920;

const TARGETS = [
  {
    slug: "ycc-home",
    url: "https://www.ycjc.kr",
    height: 917,
    // 홈은 로고 인트로 스플래시가 걷힌 뒤에야 히어로가 드러난다.
    settleMs: 4000,
  },
  {
    slug: "sumgim-home",
    url: "https://sumgim-welfare.com",
    height: 920,
    // 히어로 배경이 5초마다 도는 캐러셀이라 아무 때나 찍으면 슬라이드가 제각각이다.
    // 첫 슬라이드로 고정한다 — 뒤쪽 슬라이드에는 상장처럼 글자가 많은 사진이 있어
    // 히어로 문구가 묻히고 개인 이름이 읽히기도 한다.
    // (슬라이드 목록은 센터가 CMS에서 올린 사진이라 내용 자체는 때마다 바뀐다.)
    prepare: async (page) => {
      await page.evaluate(() => {
        document.querySelector('[aria-label="슬라이드 1"]')?.click();
      });
      // 전환은 CLEANUP_CSS가 0초로 만들어 뒀으니 한 프레임이면 끝난다.
      // 5초 자동 넘김이 다시 돌기 전에 찍어야 하므로 길게 기다리지 않는다.
      await page.waitForTimeout(200);
    },
  },
  {
    slug: "worldeng-home",
    url: "https://worldengco-website.dongwoobae.workers.dev/",
    height: 912,
  },
  { slug: "hmsu-home", url: "https://hmsu.kr", height: 919 },
  {
    slug: "modu-map",
    url: "https://korea-univ-project.vercel.app",
    height: 917,
    // 지도 타일과 마커가 다 그려질 때까지 기다린다.
    settleMs: 4000,
  },
  {
    slug: "modu-building-detail",
    url: "https://korea-univ-project.vercel.app",
    height: 913,
    settleMs: 4000,
    // 기본 실행에서 뺀다 — 찍으면 시설 영상 자리가 검은 사각형으로 나온다.
    // R2에 올라간 mp4의 비디오 트랙이 HEVC(hvc1)라 Chrome이 디코드를 못 한다
    // (readyState는 4인데 videoWidth가 0이다). 코덱을 H.264로 다시 인코딩하면
    // 그때 `node scripts/capture-desktop.mjs modu-building-detail`로 살릴 수 있다.
    manual: true,
    // 상세 패널은 URL로 못 연다 — 건물을 골라야 열린다. 원본과 같은 R&D센터를
    // 검색해서 연다. 시설 현황 네 줄과 시설 사진·영상이 다 있어 패널을 보여주기 좋다.
    prepare: async (page) => {
      await page.fill(".ku-search-input", "R&D센터");
      await page.click('[role="option"]');
      // 지도가 건물로 날아가고 패널 안 사진·영상이 뜰 때까지 기다린다.
      await page.waitForTimeout(3000);
      // 시설 영상은 preload가 없어 그냥 두면 검은 사각형으로 찍힌다. 살짝 탐색해
      // 첫 프레임을 그리게 한다(자동재생은 하지 않는다 — 정지 화면이 목적이다).
      // currentTime을 넣는 것만으로는 부족하다 — seeked까지 기다려야 프레임이 올라온다.
      await page.evaluate(() =>
        Promise.all(
          [...document.querySelectorAll("video")].map(
            (video) =>
              new Promise((done) => {
                const seek = () => {
                  video.addEventListener("seeked", done, { once: true });
                  video.currentTime = 0.5;
                };
                if (video.readyState >= 1) seek();
                else
                  video.addEventListener("loadedmetadata", seek, {
                    once: true,
                  });
                video.preload = "auto";
                video.load();
                // 영상이 없거나 디코더가 없으면 영영 안 오므로 상한을 둔다.
                setTimeout(done, 8000);
              }),
          ),
        ),
      );
      await page.waitForTimeout(1000);
    },
  },

  // --- 케이스 스터디 서사에 대응 화면이 없던 자리를 메우는 것들 ---
  // 새로 추가하는 건 세로 917로 통일한다. 기존 912~920은 캡처 창 크기가
  // 그때그때 달랐던 흔적일 뿐이라 굳이 물려받을 이유가 없다.
  {
    slug: "ycc-sermon-detail",
    // AI 요약이 이 프로젝트의 대표 기능인데 결과 화면이 없었다. 목록에서 첫 설교로
    // 들어간다 — id를 박아 두면 그 설교가 비공개로 바뀌는 순간 깨진다.
    url: "https://www.ycjc.kr/sermons",
    height: 917,
    settleMs: 3500,
    prepare: async (page) => {
      await page.click('a[href*="/sermons/"]');
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(4000);
    },
  },
  {
    slug: "ycc-bulletin-detail",
    // 목록은 카드 한 장뿐이라 "HWP 주보 구조화"의 근거가 못 된다. 파싱 결과가
    // 실제로 보이는 건 상세다.
    //
    // 그런데 기본 실행에서는 뺀다. 상세에 봉사 일정표가 있어 교인 실명이 수십 개
    // 딸려 온다. 교회 사이트에 공개돼 있는 것과, 그걸 이력용 포트폴리오로 옮겨
    // 싣는 것은 다른 문제다. 파싱 구조는 출석현황 표만으로도 보이므로 그쪽만
    // 담기게 잘라 쓰려면 height를 660쯤으로 줄여서 찍어라.
    manual: true,
    url: "https://www.ycjc.kr/bulletins",
    height: 917,
    settleMs: 3000,
    prepare: async (page) => {
      await page.click('a[href*="/bulletins/"]');
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(3500);
    },
  },
  {
    slug: "hmsu-search",
    url: "https://hmsu.kr",
    height: 917,
    settleMs: 3500,
    // 화면 전환이 URL을 바꾸지 않는 사이트라 주소로는 못 연다. 상단 메뉴를 눌러
    // 첩약 검색으로 들어간다 — 공공데이터 3만건+ 통합이 눈에 보이는 유일한 화면이다.
    // 스크롤도 여기서 잡는다. 바깥 scrollTo는 prepare보다 먼저 도는데, 이 클릭이
    // 화면을 갈아 끼우면서 스크롤을 맨 위로 되돌려 버리기 때문이다.
    prepare: async (page) => {
      await page.getByText("첩약 검색", { exact: true }).first().click();
      await page.waitForTimeout(4500);
      // 맨 위는 빈 검색 폼이라 핵심이 안 보인다. 필터를 지나 약재 목록까지 내린다.
      await page.evaluate(() => window.scrollTo(0, 1280));
      await page.waitForTimeout(800);
    },
  },
  {
    slug: "modu-slope",
    url: "https://korea-univ-project.vercel.app",
    height: 917,
    settleMs: 4000,
    // 기본 지도(modu-map)는 경사도가 꺼진 상태라 대표 기능이 안 보인다. 켜서 한 장 더 찍는다.
    prepare: async (page) => {
      await page.evaluate(() => {
        document
          .querySelector('.ku-filter-checks input[type="checkbox"]')
          ?.click();
      });
      await page.waitForTimeout(3000);
    },
  },
  {
    slug: "worldeng-reserve",
    // 리드획득형 IA가 서사인데 정작 전환 지점(공개 예약 폼)이 없었다.
    url: "https://worldengco-website.dongwoobae.workers.dev/service/reserve",
    height: 917,
    settleMs: 3000,
  },
  {
    slug: "sumgim-photos",
    url: "https://sumgim-welfare.com/board/photos",
    height: 917,
    settleMs: 3500,
    // 기본 실행에서 뺀다. 블러는 사진마다 켜고 끌 수 있어(관리자 화면의 원본/블러
    // 토글) 앨범 목록에는 블러가 걸리지 않은 얼굴이 섞여 들어온다. 이 폴더의 규칙은
    // "얼굴 블러가 적용된 공개본만 쓴다"이고, 목록 내용은 센터가 CMS로 계속 바꾸므로
    // 한 번 확인하고 넣어도 나중에 규칙을 어기는 그림이 될 수 있다.
    manual: true,
  },
  {
    slug: "sumgim-calculator",
    url: "https://sumgim-welfare.com/calculator",
    // 이 화면만 세로가 길다. 917로는 STEP 2 제목과 결과 카드가 한 화면에 안 들어간다.
    height: 1080,
    settleMs: 3000,
    // 빈 폼은 단계만 보이고 정작 계산 결과가 안 보인다. 등급·시간을 골라
    // 산출된 본인부담금까지 한 화면에 담는다.
    prepare: async (page) => {
      await page.evaluate(() => {
        const pick = (text) =>
          [...document.querySelectorAll("button")]
            .find((b) => (b.textContent || "").trim() === text)
            ?.click();
        pick("3등급");
        pick("1시간 30분");
      });
      await page.waitForTimeout(800);
      // 횟수까지 넣어야 최종 본인부담금이 나온다. 안 넣으면 결과 자리가 안내문으로 남는다.
      await page.fill('input[placeholder="예: 20"]', "20");
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 640));
      await page.waitForTimeout(800);
    },
  },
];

// 스크롤바와 진입 애니메이션이 화면에 남으면 정지 이미지에서 어색하다.
const CLEANUP_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
  }
  ::-webkit-scrollbar { display: none !important; }
  html { scrollbar-width: none !important; }
`;

async function capture(browser, target) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: target.height },
    deviceScaleFactor: 1,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto(target.url, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    // networkidle은 폴링·소켓을 쓰는 사이트에서 영영 안 오기도 한다. 실패해도 계속 간다.
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: CLEANUP_CSS });
    await page.waitForTimeout(target.settleMs ?? 1500);
    // 지연 로드 이미지를 깨운 뒤 찍을 위치로 돌아온다(기본은 맨 위).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.evaluate((y) => window.scrollTo(0, y), target.scrollTo ?? 0);
    await page.waitForTimeout(800);
    // 화면을 만져야 원하는 상태가 되는 곳(캐러셀 등)은 셔터 직전에 처리한다.
    // 스크롤을 다 잡아 놓은 뒤라 locator.click()은 쓰면 안 된다 — Playwright가 대상을
    // 화면 안으로 끌어오느라 페이지를 도로 스크롤시킨다. 페이지 안에서 직접 클릭한다.
    await target.prepare?.(page);

    const path = join(OUT_DIR, `${target.slug}.png`);
    await page.screenshot({ path });
    console.log(`✓ ${target.slug.padEnd(16)} ${target.url}`);
    return true;
  } catch (error) {
    console.error(`✗ ${target.slug.padEnd(16)} ${error.message}`);
    return false;
  } finally {
    await context.close();
  }
}

// manual 대상은 이름을 직접 대야만 찍는다 — 아직 결과가 쓸 만하지 않은 것들이다.
const only = process.argv.slice(2);
const targets = only.length
  ? TARGETS.filter((t) => only.includes(t.slug))
  : TARGETS.filter((t) => !t.manual);

if (!targets.length) {
  console.error(
    `대상 없음. 사용 가능: ${TARGETS.map((t) => t.slug).join(", ")}`,
  );
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

// 번들 Chromium에는 H.264 디코더가 없어 mp4가 검은 사각형으로 찍힌다
// (modu-building-detail 패널의 시설 영상이 그렇다). 설치된 Chrome이 있으면 그걸 쓰고,
// 없으면 번들로 물러난다 — 영상 없는 화면은 어느 쪽이든 결과가 같다.
const browser = await chromium
  .launch({ channel: "chrome" })
  .catch(() => chromium.launch());
const results = [];
for (const target of targets) results.push(await capture(browser, target));
await browser.close();

const failed = results.filter((ok) => !ok).length;
if (failed) {
  console.error(`\n${failed}장 실패 — 위 오류를 보고 다시 실행한다.`);
  process.exit(1);
}
console.log(`\n${results.length}장 저장 → public/screenshots/`);
