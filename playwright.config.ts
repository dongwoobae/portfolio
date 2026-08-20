import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 로컬 기본값(코어 수의 절반, 보통 6)은 dev 서버 컴파일이 경합해 프로젝트 상세
  // 테스트가 60초 타임아웃으로 깨진다. 콜드 실행 실측으로 6워커는 3건 실패에 1.5분,
  // 2워커는 전건 통과에 48.7초였다. 경합이 이득보다 손해라 CI와 같은 값으로 고정한다.
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_DIST_DIR: ".next-e2e", NEXT_E2E: "1" },
  },
});
