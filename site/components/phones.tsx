import { Check, Trash, Shield, Undo, EyeOff, Heart, ArrowUp } from "./icons";

const U = (id: string, w = 240, q = 60) => `https://images.unsplash.com/${id}?w=${w}&q=${q}`;

function StatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? "#fff" : "#000";
  return (
    <div className="scr-status" style={{ color: c }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="15" height="10" viewBox="0 0 18 12"><g fill={c}><rect x="0" y="7" width="3" height="5" rx="1" /><rect x="4.5" y="5" width="3" height="7" rx="1" /><rect x="9" y="2.5" width="3" height="9.5" rx="1" /><rect x="13.5" y="0" width="3" height="12" rx="1" /></g></svg>
        <svg width="21" height="10" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke={c} opacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="1.5" fill={c} /><rect x="23" y="4" width="2" height="4" rx="1" fill={c} opacity="0.4" /></svg>
      </span>
    </div>
  );
}

function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="phone">
      <div className={`screen ${dark ? "dark" : ""}`}>
        <span className="island" />
        {children}
      </div>
    </div>
  );
}

export function AlbumsScreen() {
  return (
    <Frame>
      <div className="scr">
        <StatusBar />
        <div className="s-pad" style={{ paddingTop: 6 }}>
          <div className="s-kicker">Photoslide</div>
          <div className="s-title">Albums</div>
          <div className="s-sub">Swipe right to keep, left to clear.</div>
          <div className="s-stats">
            <div className="s-stat"><div className="n">1,284</div><div className="l">Photos cleared</div></div>
            <div className="s-stat"><div className="n">6.2 GB</div><div className="l">Space freed</div></div>
          </div>
          <div className="s-grid">
            <Tile img={U("photo-1469854523086-cc02fe5d8800")} t="All Photos" c="8,412 photos" />
            <Tile img={U("photo-1506744038136-46273834b3fb")} t="Favorites" c="236 photos" />
            <Tile img={U("photo-1517842645767-c639042777db")} t="Screenshots" c="1,902 photos" />
            <Tile img={U("photo-1518717758536-85ae29035b6d")} t="Pets" c="418 photos" />
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Tile({ img, t, c }: { img: string; t: string; c: string }) {
  return (
    <div className="s-tile">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" />
      <div className="sc" />
      <div className="tm"><div className="t">{t}</div><div className="c">{c}</div></div>
    </div>
  );
}

export function SwipeScreen() {
  return (
    <Frame>
      <div className="scr">
        <StatusBar />
        <div className="s-sw">
          <span className="s-iconbtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </span>
          <div className="s-swmid"><div className="t">All Photos</div><div className="c">7,128 to review</div></div>
          <span className="s-iconbtn" style={{ color: "#ff3b30" }}><Trash size={14} /></span>
        </div>
        <div className="s-track"><div className="s-fill" style={{ width: "32%" }} /></div>
        <div className="s-deck">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={U("photo-1441974231531-c6227db76b6e", 360)} alt="" />
          <div className="scrim" />
          <div className="tag"><div className="t">Yosemite Valley</div><div className="d">AUG 14 2025 · 6:43 PM</div></div>
          <span className="stamp-mini">CLEAR</span>
        </div>
        <div className="s-actions">
          <span className="s-ab sm" style={{ color: "#8a8a8e" }}><Undo size={15} /></span>
          <span className="s-ab lg" style={{ color: "#ff3b30" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </span>
          <span className="s-ab sm" style={{ color: "#007aff" }}><ArrowUp size={15} /></span>
          <span className="s-ab lg" style={{ color: "#34c759" }}><Heart size={18} /></span>
        </div>
      </div>
    </Frame>
  );
}

export function TrashScreen() {
  const cells = [
    "photo-1517336714731-489689fd1ca8", "photo-1498050108023-c5249f4df085", "photo-1461749280684-dccba630e2f6",
    "photo-1531297484001-80022131f5a1", "photo-1555066931-4365d14bab8c", "photo-1504384308090-c894fdcc538d",
    "photo-1488590528505-98d2b5aba04b", "photo-1518770660439-4636190af475", "photo-1526374965328-7f61d4dc18c5",
  ];
  const off = 2;
  return (
    <Frame>
      <div className="scr">
        <StatusBar />
        <div className="s-th">
          <span style={{ color: "#c7c7cc" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11" opacity="0.5" /><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </span>
          <div className="mid"><div className="t">Trash</div><div className="c">13 staged</div></div>
          <span className="side">Deselect</span>
        </div>
        <div className="s-note"><Shield size={13} /><span>Only staged. Nothing leaves your library until you tap Delete.</span></div>
        <div className="s-tgrid">
          {cells.map((id, i) => (
            <div key={id} className={`s-tcell ${i === off ? "off" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={U(id, 160, 55)} alt="" />
              {i !== off && <span className="chk"><Check size={10} /></span>}
            </div>
          ))}
        </div>
        <div className="s-tbar">
          <div className="b keep"><Undo size={13} /> Keep 1</div>
          <div className="b del"><Trash size={13} /> Delete 12</div>
        </div>
      </div>
    </Frame>
  );
}

export function PrivacyScreen() {
  return (
    <Frame dark>
      <div className="scr dark">
        <StatusBar dark />
        <div className="s-gate">
          <div className="ic">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#0A84FF"><rect x="3" y="6" width="14" height="11" rx="2" /><rect x="6" y="3" width="14" height="11" rx="2" opacity="0.5" /></svg>
          </div>
          <h4>Access your photos</h4>
          <p>Photoslide shows your albums so you can swipe through them. Nothing is deleted or moved without your confirmation.</p>
          <div className="s-plist">
            <PItem bg="rgba(48,209,88,0.16)" color="#30D158" icon={<Shield size={14} />} t="100% on-device" d="Your photos never leave your iPhone." />
            <PItem bg="rgba(10,132,255,0.16)" color="#0A84FF" icon={<Check size={14} stroke={2.4} />} t="Confirm before deleting" d="Staged photos wait in Trash until you say go." />
            <PItem bg="rgba(235,235,245,0.12)" color="#ebebf5" icon={<EyeOff size={14} />} t="No account, no tracking" d="Open the app and start — that's it." />
          </div>
          <div className="s-gbtn">Allow Access</div>
        </div>
      </div>
    </Frame>
  );
}

function PItem({ bg, color, icon, t, d }: { bg: string; color: string; icon: React.ReactNode; t: string; d: string }) {
  return (
    <div className="s-pitem">
      <span className="pic" style={{ background: bg, color }}>{icon}</span>
      <div><div className="pt">{t}</div><div className="pd">{d}</div></div>
    </div>
  );
}
