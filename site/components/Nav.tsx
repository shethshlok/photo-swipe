"use client";

import { useEffect, useState } from "react";
import { Apple } from "./icons";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label="Photoslide home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          Photoslide <small>iOS</small>
        </a>
        <a className="btn btn-primary" href="#get">
          <Apple size={16} /> Get it
        </a>
      </div>
    </nav>
  );
}
