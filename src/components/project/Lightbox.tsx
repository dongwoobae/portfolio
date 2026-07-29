"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type LightboxItem =
  | { kind: "image"; src: string; alt: string }
  | { kind: "diagram"; title: string; render: () => ReactNode };

/** 헤더에 표시할 경로/제목 */
function itemLabel(item: LightboxItem): string {
  return item.kind === "image" ? `~${item.src}` : item.title;
}

/** 푸터 캡션 — 새 문안을 만들지 않고 alt/제목을 그대로 쓴다 */
function itemCaption(item: LightboxItem): string {
  return item.kind === "image" ? item.alt : item.title;
}

export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[];
  /** null이면 닫힘 */
  index: number | null;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 확대는 "몇 번째 장에 대한 확대인지"와 함께 들고 있는다. 장을 넘기면 저절로
  // 무효가 되므로 effect에서 false로 되돌릴 필요가 없다 — effect 안의 setState는
  // 리렌더를 연쇄시키고 react-hooks/set-state-in-effect에도 걸린다.
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  const open = index !== null;
  const item = open ? items[index] : undefined;
  const actualSize = open && zoomedIndex === index;

  // showModal()/close()는 명령형 API라 open 상태와 직접 동기화한다.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 장을 넘기면 스크롤 위치를 처음으로 되돌린다.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [index]);

  const move = useCallback(
    (delta: number) => {
      if (index === null || items.length < 2) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };

  // 닫힌 동안에도 dialog 노드는 유지해 showModal 대상이 사라지지 않게 한다.
  // index를 함께 좁혀야 아래 카운터에서 index가 null이 아님이 보장된다.
  if (index === null || !item)
    return <dialog ref={dialogRef} aria-hidden="true" />;

  // 다이어그램은 벡터라 확대 개념이 없다.
  const canZoom = item.kind === "image";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={onKeyDown}
      aria-label={itemLabel(item)}
      // backdrop 색은 globals.css가 정한다 — 여기서 backdrop: 유틸리티를 쓰면 덮어써진다.
      className="m-0 h-dvh max-h-dvh w-dvw max-w-dvw bg-transparent p-0"
    >
      <div className="flex h-full w-full flex-col">
        {/* ── 헤더 ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-rail px-4 py-2.5 font-mono text-[11px]">
          <span className="truncate text-faint">{itemLabel(item)}</span>
          {items.length > 1 && (
            <span className="shrink-0 text-accent">
              [{index + 1}/{items.length}]
            </span>
          )}
          <span className="ml-auto hidden shrink-0 text-ghost sm:inline">
            {items.length > 1 ? "← → 이동 · esc 닫기" : "esc 닫기"}
          </span>
          {canZoom && (
            <button
              type="button"
              onClick={() => setZoomedIndex(actualSize ? null : index)}
              aria-pressed={actualSize}
              className={`shrink-0 cursor-pointer rounded border px-2 py-1 ${
                actualSize
                  ? "border-line-accent text-accent"
                  : "border-line text-muted"
              } ${items.length > 1 ? "" : "ml-auto sm:ml-0"}`}
            >
              1:1
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="닫기"
            className="shrink-0 cursor-pointer rounded border border-line px-2 py-1 text-muted"
          >
            ✕
          </button>
        </div>

        {/* ── 콘텐츠 ── */}
        <div
          ref={scrollRef}
          className={`min-h-0 flex-1 overflow-auto bg-page p-4 ${
            actualSize ? "" : "flex items-center justify-center"
          }`}
        >
          {item.kind === "image" ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               "1:1 원본 픽셀 크기"는 next/image로 표현할 수 없다(width/height 필수 →
               종횡비 왜곡). 관리자 화면 글자를 읽는 것이 이 모드의 존재 이유라
               원본을 그대로 받는다. 썸네일 그리드는 그대로 next/image를 쓴다. */
            <img
              src={item.src}
              alt={item.alt}
              className={
                actualSize
                  ? "max-w-none" // 원본 크기 + 컨테이너 스크롤
                  : "max-h-full max-w-full object-contain" // 잘림 없이 전체
              }
            />
          ) : (
            // 폭을 채우되 좌표계보다 좁아지면 컨테이너가 가로 스크롤한다.
            <div className="w-full [&_svg]:h-auto [&_svg]:w-full">
              {item.render()}
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <p className="shrink-0 border-t border-line bg-rail px-4 py-2.5 text-[12px] text-muted">
          {itemCaption(item)}
        </p>
      </div>
    </dialog>
  );
}
