"use client";

import { useCallback, useRef, useState } from "react";
import { Heart, Close, ArrowUp } from "./icons";

type Photo = { img: string; place: string; date: string; mb: number };

const PHOTOS: Photo[] = [
  { img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&q=75", place: "Yosemite Valley", date: "AUG 14 2025 · 6:43 PM", mb: 3.1 },
  { img: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=640&q=75", place: "Screenshot", date: "MAY 02 2024 · 11:08 AM", mb: 1.4 },
  { img: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=640&q=75", place: "Golden, the dog", date: "MAR 21 2025 · 9:02 AM", mb: 2.6 },
  { img: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=640&q=75", place: "Big Sur Coast", date: "JUN 09 2025 · 5:11 PM", mb: 4.2 },
  { img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=640&q=75", place: "Lake Tahoe", date: "JUL 30 2024 · 7:55 PM", mb: 3.8 },
  { img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=75", place: "Blurry, again", date: "FEB 11 2025 · 8:20 PM", mb: 1.1 },
];

/* deterministic scatter so the stack reads as a pile (no hydration mismatch) */
const SCATTER = [
  { r: 0, x: 0, y: 0 },
  { r: -5, x: -14, y: 8 },
  { r: 6, x: 16, y: 4 },
  { r: -3, x: -8, y: 14 },
  { r: 4, x: 10, y: 18 },
  { r: -6, x: -4, y: 22 },
];

const TH = 100;
type Dir = "keep" | "clear" | "later" | null;

export default function Pile() {
  const [index, setIndex] = useState(0);
  const [kept, setKept] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [reclaimed, setReclaimed] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [flying, setFlying] = useState<Dir>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const done = index >= PHOTOS.length;

  const commit = useCallback(
    (dir: Dir) => {
      if (!dir || flying || done) return;
      const cur = PHOTOS[index];
      const off = dir === "keep" ? { x: 460, y: 30 } : dir === "clear" ? { x: -460, y: 30 } : { x: 0, y: -500 };
      setFlying(dir);
      setDrag({ ...off, active: false });
      window.setTimeout(() => {
        if (dir === "keep") setKept((k) => k + 1);
        if (dir === "clear") { setCleared((c) => c + 1); setReclaimed((r) => +(r + cur.mb).toFixed(1)); }
        setIndex((i) => i + 1);
        setDrag({ x: 0, y: 0, active: false });
        setFlying(null);
      }, 360);
    },
    [flying, done, index]
  );

  const onDown = (e: React.PointerEvent) => {
    if (flying || done) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag((d) => ({ ...d, active: true }));
  };
  const onMove = (e: React.PointerEvent) => {
    if (!startRef.current || !drag.active) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y, active: true });
  };
  const onUp = () => {
    if (!startRef.current) return;
    startRef.current = null;
    const { x, y } = drag;
    if (y < -TH && Math.abs(x) < TH) commit("later");
    else if (x > TH) commit("keep");
    else if (x < -TH) commit("clear");
    else setDrag({ x: 0, y: 0, active: false });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") commit("keep");
    else if (e.key === "ArrowLeft") commit("clear");
    else if (e.key === "ArrowUp") { e.preventDefault(); commit("later"); }
  };

  const reset = () => { setIndex(0); setKept(0); setCleared(0); setReclaimed(0); setDrag({ x: 0, y: 0, active: false }); };

  const { x, y, active } = drag;
  const rot = Math.max(-20, Math.min(20, x / 12));
  const keepOp = Math.max(0, Math.min(1, x / TH));
  const clearOp = Math.max(0, Math.min(1, -x / TH));
  const laterOp = Math.max(0, Math.min(1, -y / TH)) * (Math.abs(x) < TH ? 1 : 0);

  // cards still in the pile, back-to-front, capped so the stack isn't huge
  const remaining = PHOTOS.slice(index, index + 5);

  return (
    <>
      <div className="stage" aria-label="Interactive: fling a photo right to keep, left to clear, up for later">
        {done ? (
          <div className="pile-done">
            <div>
              <div className="big">Empty.</div>
              <div className="gb">+{reclaimed.toFixed(1)} MB back</div>
              <p>Kept {kept} · cleared {cleared}. That&apos;s the whole pile.</p>
              <button className="btn btn-line" onClick={reset}>Sort it again</button>
            </div>
          </div>
        ) : (
          remaining.map((photo, i) => {
            const realIdx = index + i;
            const isFront = i === 0;
            const s = SCATTER[realIdx % SCATTER.length];
            const depth = i; // 0 = front
            const base = `translate(${s.x}px, ${s.y + depth * -2}px) scale(${1 - depth * 0.02}) rotate(${s.r}deg)`;
            const frontTransform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
            return (
              <div
                key={photo.img}
                className={`pile-card ${isFront ? "front" : ""} ${isFront && !active ? "released" : ""}`}
                style={{
                  transform: isFront ? frontTransform : base,
                  opacity: isFront && flying ? 0 : 1,
                  zIndex: 10 + (remaining.length - i),
                }}
                {...(isFront
                  ? {
                      role: "group",
                      tabIndex: 0,
                      "aria-label": `${photo.place}. Arrow right to keep, left to clear, up for later.`,
                      onPointerDown: onDown,
                      onPointerMove: onMove,
                      onPointerUp: onUp,
                      onPointerCancel: onUp,
                      onKeyDown: onKey,
                    }
                  : { "aria-hidden": true })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.img} alt={isFront ? photo.place : ""} draggable={false} />
                <span className="frame-edge" />
                <div className="meta">
                  <div className="p">{photo.place}</div>
                  <div className="d">{photo.date}</div>
                </div>
                {isFront && (
                  <>
                    <span className="stamp keep" style={{ opacity: keepOp }}>KEEP</span>
                    <span className="stamp clear" style={{ opacity: clearOp }}>CLEAR</span>
                    <span className="stamp later" style={{ opacity: laterOp }}>LATER</span>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="tally" aria-live="polite">
        <span className="t keep"><b>{kept}</b> kept</span>
        <span className="sep" />
        <span className="t clear"><b>{cleared}</b> cleared</span>
        <span className="sep" />
        <span className="t"><b>{reclaimed.toFixed(1)}</b> MB</span>
      </div>

      {!done && (
        <div className="controls">
          <button className="ctrl clear" onClick={() => commit("clear")} aria-label="Clear this photo"><Close size={22} /></button>
          <button className="ctrl later" onClick={() => commit("later")} aria-label="Save for later"><ArrowUp size={18} /></button>
          <button className="ctrl keep" onClick={() => commit("keep")} aria-label="Keep this photo"><Heart size={20} /></button>
        </div>
      )}
    </>
  );
}
