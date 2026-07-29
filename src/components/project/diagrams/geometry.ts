// 다이어그램 좌표 계산. JSX가 섞이지 않은 순수 함수만 둔다 —
// vitest가 node 환경이라 렌더 없이 테스트할 수 있는 유일한 층이다.

export type Box = { x: number; y: number; w: number; h: number };

export type Point = { x: number; y: number };

const center = (b: Box): Point => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/**
 * a에서 b를 향할 때 a의 경계와 만나는 점.
 * 중심을 잇는 방향의 지배 축을 판정해 마주 보는 변 위의 점을 돌려주므로,
 * 어떤 배치에서도 선이 박스 안에서 시작하거나 허공에서 끝나지 않는다.
 */
export function anchor(a: Box, b: Box): Point {
  const ca = center(a);
  const cb = center(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;

  // 중심이 같으면 방향을 정할 수 없다 — 오른쪽으로 폴백한다.
  if (dx === 0 && dy === 0) return { x: a.x + a.w, y: ca.y };

  // 폭이 0인 박스는 아래 지배축 비교가 0 >= 0으로 무너져 수평 분기로 들어가고,
  // dx도 0이면 dy/|dx| 가 Infinity라 좌표가 NaN이 된다. NaN 좌표는 예외 없이
  // 선을 조용히 지운다 — 퇴화한 박스는 중심을 접점으로 쓴다(경계 위의 점이다).
  if (a.w === 0) return ca;

  // |dx|/|dy| 와 (w/2)/(h/2) 를 곱셈으로 비교해 0 나눗셈을 피한다.
  if (Math.abs(dx) * a.h >= Math.abs(dy) * a.w) {
    return {
      x: dx > 0 ? a.x + a.w : a.x,
      y: ca.y + (dy / Math.abs(dx)) * (a.w / 2),
    };
  }
  return {
    x: ca.x + (dx / Math.abs(dy)) * (a.h / 2),
    y: dy > 0 ? a.y + a.h : a.y,
  };
}

/**
 * 재시도 표현용 되돌이 경로. 노드 오른쪽 변에서 나가 out만큼 밖으로 돌았다가
 * 같은 변 아래쪽으로 되돌아온다. 화살촉은 되돌아오는 끝에 붙는다.
 */
export function loopPath(b: Box, out: number, radius = 12): string {
  const x = b.x + b.w;
  const y1 = b.y + b.h * 0.3;
  const y2 = b.y + b.h * 0.75;
  const far = x + out;
  // 반경이 나가는 폭이나 두 접점 간격의 절반을 넘으면 호가 접혀 수직선이
  // 위로 역주행하거나 수평선이 노드 안쪽에서 시작한다. 낮은 노드에 Loop를
  // 걸면 바로 걸리므로 여기서 깎는다 — 현재 다이어그램 값은 그대로 12다.
  const r = Math.max(0, Math.min(radius, out, (y2 - y1) / 2));
  return [
    `M ${x} ${y1}`,
    `H ${far - r}`,
    `A ${r} ${r} 0 0 1 ${far} ${y1 + r}`,
    `V ${y2 - r}`,
    `A ${r} ${r} 0 0 1 ${far - r} ${y2}`,
    `H ${x}`,
  ].join(" ");
}

/** 두 점의 중점 — 경로 라벨을 놓을 자리 */
export function midpoint(p: Point, q: Point): Point {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
