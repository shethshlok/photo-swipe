"use client";

import { useRef, useState } from "react";
import { AlbumsScreen, SwipeScreen, TrashScreen, PrivacyScreen } from "./phones";

const SLIDES = [
  { node: <AlbumsScreen />, cap: "Albums", note: "every album, one running tally" },
  { node: <SwipeScreen />, cap: "The deck", note: "one photo, full screen, your thumb decides" },
  { node: <TrashScreen />, cap: "Trash", note: "review the batch before anything's deleted" },
  { node: <PrivacyScreen />, cap: "Private", note: "on-device, no account, no tracking" },
];

function Chevron({ dir }: { dir: "l" | "r" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: dir === "r" ? "scaleX(-1)" : undefined }}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export default function Carousel() {
  const [i, setI] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [grabbing, setGrabbing] = useState(false);
  const startRef = useRef<number | null>(null);
  const widthRef = useRef(0);

  const last = SLIDES.length - 1;
  const go = (n: number) => setI(Math.max(0, Math.min(last, n)));

  const onDown = (e: React.PointerEvent) => {
    startRef.current = e.clientX;
    widthRef.current = (e.currentTarget as HTMLElement).clientWidth;
    setGrabbing(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startRef.current === null) return;
    setDragX(e.clientX - startRef.current);
  };
  const onUp = () => {
    if (startRef.current === null) return;
    const threshold = Math.min(70, widthRef.current * 0.22);
    if (dragX < -threshold) go(i + 1);
    else if (dragX > threshold) go(i - 1);
    startRef.current = null;
    setDragX(0);
    setGrabbing(false);
  };

  const pct = -i * 100;
  const dragPct = widthRef.current ? (dragX / widthRef.current) * 100 : 0;

  return (
    <div className="carousel">
      <div className="carousel-window">
        <div
          className={`carousel-track ${grabbing ? "grabbing" : ""}`}
          style={{ transform: `translateX(calc(${pct}% + ${dragPct}%))` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        >
          {SLIDES.map((s, idx) => (
            <div className="carousel-slide" key={idx} aria-hidden={idx !== i}>
              {s.node}
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-cap" aria-live="polite">
        <b>{SLIDES[i].cap}</b> — {SLIDES[i].note}
      </div>

      <div className="carousel-nav">
        <button className="cbtn" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous screen"
          style={{ opacity: i === 0 ? 0.4 : 1 }}>
          <Chevron dir="l" />
        </button>
        <div className="carousel-dots" role="tablist" aria-label="App screens">
          {SLIDES.map((s, idx) => (
            <button key={idx} className={`cdot ${idx === i ? "on" : ""}`} onClick={() => go(idx)}
              role="tab" aria-selected={idx === i} aria-label={s.cap} />
          ))}
        </div>
        <button className="cbtn" onClick={() => go(i + 1)} disabled={i === last} aria-label="Next screen"
          style={{ opacity: i === last ? 0.4 : 1 }}>
          <Chevron dir="r" />
        </button>
      </div>
    </div>
  );
}
