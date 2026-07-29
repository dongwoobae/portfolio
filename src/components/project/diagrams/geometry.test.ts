import { describe, expect, it } from "vitest";
import { anchor, loopPath, midpoint, type Box } from "./geometry";

const box = (x: number, y: number): Box => ({ x, y, w: 100, h: 60 });

/** 점이 박스 경계 위(모서리 포함, 오차 0.01)에 있는지 */
function onBorder(p: { x: number; y: number }, b: Box): boolean {
  const inX = p.x >= b.x - 0.01 && p.x <= b.x + b.w + 0.01;
  const inY = p.y >= b.y - 0.01 && p.y <= b.y + b.h + 0.01;
  const onVertical =
    Math.abs(p.x - b.x) < 0.01 || Math.abs(p.x - (b.x + b.w)) < 0.01;
  const onHorizontal =
    Math.abs(p.y - b.y) < 0.01 || Math.abs(p.y - (b.y + b.h)) < 0.01;
  return inX && inY && (onVertical || onHorizontal);
}

describe("anchor", () => {
  it("수평으로 나란한 박스면 오른쪽 변 중점을 반환한다", () => {
    expect(anchor(box(0, 0), box(200, 0))).toEqual({ x: 100, y: 30 });
  });

  it("왼쪽으로 향하면 왼쪽 변 중점을 반환한다", () => {
    expect(anchor(box(200, 0), box(0, 0))).toEqual({ x: 200, y: 30 });
  });

  it("수직으로 나란한 박스면 아래 변 중점을 반환한다", () => {
    expect(anchor(box(0, 0), box(0, 200))).toEqual({ x: 50, y: 60 });
  });

  it("위로 향하면 위 변 중점을 반환한다", () => {
    expect(anchor(box(0, 200), box(0, 0))).toEqual({ x: 50, y: 200 });
  });

  it("대각선 배치에서도 반환점이 박스 경계 위에 있다", () => {
    const a = box(0, 0);
    const b = box(180, 140);
    expect(onBorder(anchor(a, b), a)).toBe(true);
    expect(onBorder(anchor(b, a), b)).toBe(true);
  });

  it("가파른 대각선에서도 반환점이 박스 경계 위에 있다", () => {
    const a = box(0, 0);
    const b = box(20, 400);
    expect(onBorder(anchor(a, b), a)).toBe(true);
    expect(onBorder(anchor(b, a), b)).toBe(true);
  });

  it("두 박스 중심이 같으면 오른쪽 변 중점으로 폴백한다", () => {
    expect(anchor(box(0, 0), box(0, 0))).toEqual({ x: 100, y: 30 });
  });
});

describe("loopPath", () => {
  it("노드 오른쪽 변에서 나가 같은 변으로 되돌아온다", () => {
    const d = loopPath(box(0, 0), 30);
    expect(d.startsWith("M 100 ")).toBe(true);
    expect(d.endsWith("H 100")).toBe(true);
    expect(d).toContain("A ");
  });
});

describe("midpoint", () => {
  it("두 점의 중점을 반환한다", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
  });
});
