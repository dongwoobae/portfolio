import { describe, expect, it } from "vitest";
import { formatPeriod, statusLabel } from "@/lib/format";

describe("formatPeriod", () => {
  it("종료일이 없으면 진행 중 표기로 연다", () => {
    expect(formatPeriod({ start: "2026.04" })).toBe("2026.04 ~ 진행 중");
  });

  it("종료일이 있으면 구간으로 표기한다", () => {
    expect(formatPeriod({ start: "2026.06", end: "2026.07" })).toBe(
      "2026.06 ~ 2026.07",
    );
  });

  it("비고가 있으면 괄호로 덧붙인다", () => {
    expect(
      formatPeriod({ start: "2026.06", end: "2026.07", note: "이후 유지보수" }),
    ).toBe("2026.06 ~ 2026.07 (이후 유지보수)");
  });

  it("종료일 없이 비고만 있어도 붙는다", () => {
    expect(formatPeriod({ start: "2026.07", note: "고객 자료 대기" })).toBe(
      "2026.07 ~ 진행 중 (고객 자료 대기)",
    );
  });
});

describe("statusLabel", () => {
  it("상태 코드를 한국어 라벨로 바꾼다", () => {
    expect(statusLabel("operating")).toBe("운영 중");
    expect(statusLabel("in-progress")).toBe("진행 중");
    expect(statusLabel("completed")).toBe("완료");
  });
});
