import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import Pile from "@/components/Pile";
import Carousel from "@/components/Carousel";
import { Heart, Close, ArrowUp, Apple, Download } from "@/components/icons";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        {/* ============================== HERO ============================== */}
        <header className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="mono-label">Photoslide — photo cleanup for iPhone</span>
              <h1 className="display h1">
                Flick your<br />camera roll<br /><span className="spark">clean.</span>
              </h1>
              <p className="hero-lede">
                Photoslide deals every photo like a card. Keep what you love, clear the
                rest — thousands down to the keepers in one sitting.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#get"><Apple size={18} /> Get Photoslide</a>
                <a className="btn btn-line" href="#how">How it works</a>
              </div>
              <div className="hero-hint">
                <span><span className="ar">→</span>&nbsp; <b>keep</b></span>
                <span><span className="ar">←</span>&nbsp; <b>clear</b></span>
                <span><span className="ar">↑</span>&nbsp; <b>later</b></span>
                <span><b>drag a photo, or use the buttons</b></span>
              </div>
            </div>

            <div className="hero-stage-wrap">
              <Pile />
            </div>
          </div>
        </header>

        {/* ============================== WHAT IT IS ============================== */}
        <section className="statement" id="what">
          <div className="wrap what-grid">
            <Reveal>
              <span className="mono-label">What it is</span>
              <p className="statement-text">
                A photo cleaner you <strong>actually finish.</strong> One photo, full screen.
                Swipe to <span className="keep-c">keep</span> or <span className="clear-c">clear</span>.
                Rejects wait in Trash until you confirm — so a flick is never the end of
                anything. It all runs <span className="spark">on your iPhone.</span>
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Carousel />
            </Reveal>
          </div>
        </section>

        {/* ============================== GESTURES ============================== */}
        <section className="gestures" id="how">
          <div className="wrap">
            <Reveal><span className="mono-label">Three gestures · the whole app</span></Reveal>

            <Reveal className="grow">
              <span className="display verb keep">Keep</span>
              <span className="say">It stays exactly where it is, untouched in your library.</span>
              <span className="dir"><span className="glyph"><Heart size={16} /></span> swipe right</span>
            </Reveal>

            <Reveal className="grow" delay={70}>
              <span className="display verb clear">Clear</span>
              <span className="say">Staged for deletion — collected in Trash, never gone until you say so.</span>
              <span className="dir"><span className="glyph"><Close size={16} /></span> swipe left</span>
            </Reveal>

            <Reveal className="grow" delay={140}>
              <span className="display verb later">Later</span>
              <span className="say">Not sure? Send it back into the deck and decide on the next pass.</span>
              <span className="dir"><span className="glyph"><ArrowUp size={16} /></span> swipe up</span>
            </Reveal>
          </div>
        </section>

        {/* ============================== CLOSE / PRIVACY ============================== */}
        <section className="close" id="get">
          <div className="wrap">
            <Reveal><span className="mono-label">Private by default</span></Reveal>
            <Reveal delay={70}>
              <h2 className="display h2">It never leaves<br />your <span className="spark">iPhone.</span></h2>
            </Reveal>
            <Reveal delay={120}>
              <p>No uploads. No account. No tracking. Photoslide reads your library on-device
                to deal the deck — and that&apos;s where everything stays.</p>
            </Reveal>
            <Reveal delay={140}>
              <div style={{
                margin: "40px auto 32px",
                width: "120px",
                height: "120px",
                display: "inline-block"
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Photoslide App Icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="#" style={{ fontSize: "1.05rem", padding: "1em 1.8em" }}>
                  <Apple size={20} /> Download on the App Store
                </a>
                <a className="btn btn-line" href="https://github.com/shethshlok/photo-swipe/releases/download/latest-build/Photoslide.ipa" style={{ fontSize: "1.05rem", padding: "1em 1.8em" }}>
                  <Download size={20} /> Download Unsigned IPA
                </a>
              </div>
            </Reveal>
            <Reveal className="priv" delay={200}>
              <span><span className="dot" /> 100% on-device</span>
              <span><span className="dot" /> confirm before deleting</span>
              <span><span className="dot" /> zero tracking</span>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ============================== FOOTER ============================== */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <a className="brand" href="#top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" />
            Photoslide
          </a>
          <small>© {new Date().getFullYear()} · made for a tidier camera roll · not affiliated with Apple Inc.</small>
        </div>
      </footer>
    </>
  );
}
