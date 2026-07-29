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

  // NaN 좌표는 예외도 경고도 없이 선을 지운다 — 가장 알아채기 어려운 실패다.
  it("폭이 0인 박스에서도 NaN을 반환하지 않는다", () => {
    const degenerate: Box = { x: 0, y: 0, w: 0, h: 10 };
    const below: Box = { x: 0, y: 20, w: 0, h: 10 };
    const p = anchor(degenerate, below);
    expect(Number.isFinite(p.x), `x가 ${p.x}`).toBe(true);
    expect(Number.isFinite(p.y), `y가 ${p.y}`).toBe(true);
  });

  it("어떤 방향에서도 유한한 좌표를 돌려준다", () => {
    const a = box(0, 0);
    const targets = [
      box(500, 0),
      box(-500, 0),
      box(0, 500),
      box(0, -500),
      box(1, 500),
      box(500, 1),
      box(-1, -500),
    ];
    for (const t of targets) {
      const p = anchor(a, t);
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe("loopPath", () => {
  it("노드 오른쪽 변에서 나가 같은 변으로 되돌아온다", () => {
    const d = loopPath(box(0, 0), 30);
    expect(d.startsWith("M 100 ")).toBe(true);
    expect(d.endsWith("H 100")).toBe(true);
    expect(d).toContain("A ");
  });

  // 경로는 `M x y1 / H hx / A r r 0 0 1 far arcEndY / V vy / A … / H x` 꼴이다.
  // 숫자 순번으로 세면 반경이 끼어들어 어긋나므로 명령 단위로 뽑는다.
  const startX = (d: string) => Number(/^M ([\d.-]+)/.exec(d)![1]);
  const firstH = (d: string) => Number(/H ([\d.-]+)/.exec(d)![1]);
  const firstArcEndY = (d: string) =>
    Number(/A [\d.-]+ [\d.-]+ 0 0 1 [\d.-]+ ([\d.-]+)/.exec(d)![1]);
  const verticalTargetY = (d: string) => Number(/V ([\d.-]+)/.exec(d)![1]);

  it("반경보다 낮은 노드에서도 경로가 역주행하지 않는다", () => {
    // h=20이면 두 접점 간격이 9px뿐이라 기본 반경 12로는 호가 접힌다.
    const d = loopPath({ x: 0, y: 0, w: 100, h: 20 }, 30);
    expect(d).not.toContain("NaN");
    const arcEnd = firstArcEndY(d);
    const vTarget = verticalTargetY(d);
    expect(vTarget, `호 끝 ${arcEnd} → V ${vTarget}`).toBeGreaterThanOrEqual(
      arcEnd,
    );
  });

  it("나가는 폭보다 반경이 크면 수평선이 노드 안으로 들어가지 않는다", () => {
    const d = loopPath(box(0, 0), 4);
    expect(
      firstH(d),
      "첫 수평선이 노드 오른쪽 변보다 안쪽",
    ).toBeGreaterThanOrEqual(startX(d));
  });

  it("기존 다이어그램 값(h=96, out=34)에서는 반경 12가 그대로 쓰인다", () => {
    const d = loopPath({ x: 0, y: 0, w: 268, h: 96 }, 34);
    expect(d).toContain("A 12 12 ");
  });
});

describe("midpoint", () => {
  it("두 점의 중점을 반환한다", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
  });
});
