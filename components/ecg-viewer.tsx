"use client";

import { useCallback, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type EcgViewerProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function EcgViewer({ src, alt = "ECG scan", className }: EcgViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const clampScale = (s: number) => Math.min(4, Math.max(0.5, s));

  const zoomIn = () => setScale((s) => clampScale(s + 0.25));
  const zoomOut = () => setScale((s) => clampScale(s - 0.25));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= 1) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    },
    [offset.x, offset.y, scale]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({
      x: d.ox + (e.clientX - d.startX),
      y: d.oy + (e.clientY - d.startY),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ink-200 bg-ink-950", className)}>
      <div className="flex items-center justify-end gap-1 border-b border-ink-800 bg-ink-900/90 px-2 py-1.5">
        <button
          type="button"
          onClick={zoomOut}
          className="rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-800 hover:text-white"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[3rem] text-center text-xs tabular-nums text-ink-400">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          onClick={zoomIn}
          className="rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-800 hover:text-white"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-800 hover:text-white"
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative max-h-72 min-h-[12rem] cursor-grab overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="mx-auto max-h-72 w-full select-none object-contain transition-transform duration-75"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </div>
      <p className="px-3 py-2 text-center text-[10px] text-ink-500">
        Pinch or use zoom controls · drag when zoomed in
      </p>
    </div>
  );
}
