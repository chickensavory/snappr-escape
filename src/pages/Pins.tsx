import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";


type Tile = {
  id: string;
  letter: "S" | "N" | "R" | "F" | "D";
  title: string;
  body: string;
};

const TARGET = "SNRFDFN";

const INITIAL_TILES: Tile[] = [
  {
    id: "S-Style-Surface",
    letter: "S",
    title: "Style Surface",
    body:
      "same background material; plating shouldn’t stand out; color profile consistent with brand palette.",
  },
  {
    id: "N-No-Distractions",
    letter: "N",
    title: "No Distractions",
    body:
      "clean background; ≤1 blurred, non-distracting element; no text/logos.",
  },
  {
    id: "R-RuleOfThirds",
    letter: "R",
    title: "Rule of Thirds",
    body:
      "primary subject near intersection; respect breathing room; keep diagonals calm.",
  },
  {
    id: "F-FrameTight",
    letter: "F",
    title: "Frame Tight",
    body:
      "crop in to details; avoid dead space; hint at texture; don’t cut major lines.",
  },
  {
    id: "D-DepthCue",
    letter: "D",
    title: "Depth Cue",
    body:
      "foreground suggestive; subtle parallax; shallow depth of field allowed if SNR remains intact.",
  },
  {
    id: "F-FlatLighting",
    letter: "F",
    title: "Flat Lighting",
    body:
      "no harsh shadows; softbox or north light; product reads true-to-color; tone map gently.",
  },
  {
    id: "N-NeutralWhite",
    letter: "N",
    title: "Neutral White",
    body:
      "white balance to neutral; remove casts; use gray card reference; prefer ∆E < 3.",
  },
];

function lettersOf(tiles: Tile[]) {
  return tiles.map((t) => t.letter).join("");
}

export default function PinHeistPuzzle() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<Tile[]>(() => {
  const arr = INITIAL_TILES.slice();
  for (let i = arr.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return lettersOf(arr) === TARGET ? [arr[1], arr[0], ...arr.slice(2)] : arr;
});  
const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const currentCode = useMemo(() => lettersOf(tiles), [tiles]);
  const isCorrect = currentCode === TARGET;
  const [solved, setSolved] = useState(false);

  //function fireToast(msg: string) {
  //  setToast(msg);
  //  if (toastTimer.current) window.clearTimeout(toastTimer.current);
  //  toastTimer.current = window.setTimeout(() => setToast(null), 2400);
 // }

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isCorrect && !solved) {
      setSolved(true);
      sessionStorage.setItem("pinsSolved", "1");
      sessionStorage.setItem("pinsSolvedMsg", "The table wants its say");
      navigate("/", { replace: true, state: { pinsSolved: true } });
    }
  }, [isCorrect, solved, navigate]);

  function swap(a: number, b: number) {
    setTiles((prev) => {
      const next = prev.slice();
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setHoverIndex(index);
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    const fromStr = e.dataTransfer.getData("text/plain");
    const from = fromStr ? parseInt(fromStr, 10) : dragIndex;
    if (from !== null && from !== index) {
      swap(from, index);
    }
    setDragIndex(null);
    setHoverIndex(null);
  }
  function onDragEnd() {
    setDragIndex(null);
    setHoverIndex(null);
  }

  function onTileClick(index: number) {
    if (pickIndex === null) {
      setPickIndex(index);
      return;
    }
    if (pickIndex === index) {
      setPickIndex(null);
      return;
    }
    swap(pickIndex, index);
    setPickIndex(null);
  }


  return (
    <div className="app-skeleton">
      <style>{sharedSlackCss}</style>
      <style>{pinsCss}</style>

      <div className="app-header">
        <div className="brand">
          <div className="brand__logo" />
          <div className="brand__text">Snappr</div>
        </div>
        <div className="header-right">
          <span className={`status ${isCorrect ? "ok" : "bad"}`}>
            {isCorrect ? "ACCESS PATH: OPEN" : "ACCESS PATH: JAMMED"}
          </span>
        </div>
      </div>

      <div className="app-container">
        <aside className="panel" style={{ gridArea: "a" }}>
          <h3 className="panel__title">Navigation</h3>
          <ul className="channels">
            <li>
              <button
                className="navlink"
                onClick={() => navigate("/", { replace: true })}
                title="Back to DM chat"
              >
                ← Back to DM
              </button>
            </li>
            <li>
              <span className="muted">Puzzle:</span> Pin Heist
            </li>
          </ul>
        </aside>

        {/* main panel */}
        <main className="panel" style={{ gridArea: "main" }}>
          <header className="panel__header">
            <div className="title">Puzzle 1: Pin Heist (PINS)</div>
            <div className="keyline">
              <span className="mono">CURRENT STRIP</span>
              <span className={`code ${isCorrect ? "code-ok" : ""}`}>
                {currentCode.split("").join(" ")}
              </span>
            </div>
          </header>

          {/* cards grid */}
          <div className="cards">
            {tiles.map((t, idx) => {
              const picking = pickIndex === idx;
              const hovering = hoverIndex === idx;
              const dragging = dragIndex === idx;
              return (
                <div
                  key={t.id}
                  className={[
                    "card",
                    `card-${t.letter}`,
                    picking ? "is-picked" : "",
                    hovering ? "is-hover" : "",
                    dragging ? "is-drag" : "",
                  ].join(" ")}
                  draggable
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={(e) => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                  onClick={() => onTileClick(idx)}
                  role="button"
                  aria-pressed={picking}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTileClick(idx);
                    }
                  }}
                  title={`${t.letter} — ${t.title}`}
                >
                  <div className="card__chrome">
                    <span className="chip">{t.letter}</span>
                    <span className="notch" />
                    <span className="barcode" />
                  </div>
                  <div className="card__content">
                    <div className="card__title">
                      <span className="pill">{t.letter}</span> {t.title}
                    </div>
                    <div className="card__body">{t.body}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* helper text */}
          <footer className="panel__footer">
            <span className="muted">
              Tip: drag to reposition, or select two tiles to swap. Solve to return to DM.
            </span>
          </footer>
        </main>
      </div>

      {/* toast */}
      {toast && (
        <div className="toast">
          <div className="toast__card">{toast}</div>
        </div>
      )}
    </div>
  );
}

const sharedSlackCss = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=VT323&display=swap');
  * { box-sizing: border-box; position: relative; }
  html, body, #root { height: 100%; }

  /* ===== Retro cyberpunk palette (red-forward, not all-red) ===== */
  :root{
    /* Backgrounds (no pure black; oxblood/charcoal) */
    --bg-900:#10080a;   /* deepest backdrop, subtle red undertone */
    --bg-700:#140a0c;   /* app body */
    --bg-500:#1a0e12;   /* panels / cards */
    --bg-300:#201118;   /* lifted surfaces */

    /* Legacy aliases so older tokens still work if referenced */
    --bg-300-legacy: var(--bg-500);
    --bg-500-legacy: var(--bg-700);

    /* Primary: Neon Red (hero) */
    --pri-050:#fff1f4;
    --pri-100:#ffd9e1;
    --pri-200:#ffc0cd;     /* light UI text on dark */
    --pri-400:#ff6b86;     /* hover / soft accents */
    --pri-500:#ff4d6d;     /* main brand neon red */
    --pri-600:#e03654;     /* pressed/active */
    --pri-700:#b61f3a;     /* border on dark red */
    --pri-900:#4a0f14;     /* deep red strokes/shadows */

    /* Secondary: CRT Teal-Green (system/OK cues) */
    --sec-050:#ecfff3;
    --sec-200:#b9ffd0;
    --sec-400:#6dffa1;
    --sec-500:#39ff14;     /* main green accent */
    --sec-700:#1a5a20;     /* green stroke */
    --sec-900:#123a12;

    /* Support hues so everything isn’t red */
    --cy-500:#33e1ff;      /* info / links / scanline glow */
    --am-500:#ffb020;      /* warnings / highlights */
    --vi-500:#ae6bff;      /* decorative violet */

    /* Neutrals */
    --on-bg:#f6f4f6;
    --on-strong:#f6f4f6;
    --on-soft:#cbbfc3;
    --muted:#9aa0a6;

    /* Component strokes/fills */
    --stroke-weak:#3b1213;
    --stroke-mid:#5a1b20;
    --fill-card:#16090b;
    --fill-elev:#1e0f14;

    /* Semantics */
    --state-ok:#39ff14;
    --state-warn:#ffb020;
    --state-bad:#ff4d6d;
    --state-info:#33e1ff;

    /* Glows & focus rings */
    --glow-red: 0 0 16px rgba(255,77,109,.25);
    --glow-green: 0 0 20px rgba(57,255,20,.14);
    --glow-cyan: 0 0 18px rgba(51,225,255,.12);
    --ring-core: rgba(255,77,109,.45);
    --ring-halo: rgba(57,255,20,.12);

    /* fonts */
    --font-ui:'Rajdhani',sans-serif;
    --font-mono:'VT323',monospace;
  }

  body { background: var(--bg-700); margin:0; color: var(--on-strong); font-family: var(--font-ui); }
  a { color: inherit; text-decoration:none; }
  .app-skeleton{ padding: 0 16px; height: 100vh; min-width: 880px; }

  /* Header */
  .app-header{ display:flex; align-items:center; justify-content:space-between; padding: 16px 0 8px; margin-bottom: 16px; }
  .brand{ display:flex; align-items:center; gap:10px; color: var(--pri-200); }
  .brand__logo{ width:22px; height:22px; border:2px solid var(--pri-500); box-shadow: var(--glow-red), var(--glow-green); transform:skewX(-12deg); }
  .brand__text{ font: 24px/1 var(--font-mono); letter-spacing:2px; text-shadow: 0 0 32px var(--pri-400); text-transform:uppercase; }

  .header-right{ display:flex; align-items:center; gap:8px; }
  .tag{ padding:2px 8px; border:1px solid var(--pri-700); border-radius:4px; color:var(--pri-200); }

  .status{ padding:2px 8px; border:1px solid var(--stroke-mid); border-radius:4px; }
  .status.ok{ color: var(--state-ok); text-shadow: var(--glow-green); }
  .status.bad{ color: var(--state-bad); text-shadow: var(--glow-red); }

  /* Layout */
  .app-container{
    display:grid; gap:16px;
    grid-template-areas: 'a main';
    grid-template-columns: 260px 1fr;
    height: calc(100% - 84px);
  }

  /* Panels */
  .panel{
    background: var(--bg-500);
    border: 1px solid var(--pri-900);
    border-radius: 6px;
    padding: 12px;
    box-shadow: 2px 2px 0 rgba(40,0,10,.55); /* tinted shadow, no black */
  }
  .panel__title{ margin:0 0 8px; color: var(--pri-500); font-size: 16px; text-transform:uppercase; }
  .panel__header .title{ font-size: 20px; color: var(--pri-200); }
  .panel__header .subtitle{ color: var(--muted); margin-top: 2px; }
  .panel__footer{ margin-top: 12px; color: var(--muted); }

  .channels{ list-style:none; margin:0; padding:0 0 8px 8px; }
  .channels li{ padding: 4px 0; }
  .navlink{
    padding: 2px 6px; border:1px solid transparent; border-radius:4px; display:inline-flex; align-items:center; gap:6px; background:none; color:inherit; cursor:pointer;
  }
  .navlink:hover{ color: var(--pri-050); box-shadow: var(--glow-red); border-color: var(--pri-700); }

  .mono{ font-family: var(--font-mono); letter-spacing:1px; }
  .code{
    font-family: var(--font-mono);
    padding:2px 8px; border:1px dashed var(--sec-700); border-radius:4px; margin-left:8px;
  }
  .code-ok{ color: var(--state-ok); border-color: var(--sec-700); text-shadow:0 0 12px var(--state-ok); }

  /* Toast */
  .toast{ position: fixed; bottom: 16px; left: 0; right: 0; display:flex; justify-content:center; pointer-events:none; }
  .toast__card{
    background: var(--bg-500);
    border:1px solid var(--sec-700);
    color: var(--pri-050);
    padding:8px 12px; border-radius:6px; box-shadow: var(--glow-green); pointer-events:auto;
  }
`;

const pinsCss = `
  .keyline{ display:flex; align-items:center; gap:8px; margin-top:6px; }

  .cards{
    display:grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap:12px;
    margin-top:12px;
  }

  .card{
    background: var(--fill-card);
    border:1px solid var(--stroke-weak);
    border-radius:8px;
    overflow:hidden;
    cursor:pointer;
    user-select:none;
    outline:none;
    transition: box-shadow .15s ease, transform .05s ease, border-color .15s ease;
  }
  .card:active{ transform: translateY(1px); }

  /* focus / pick ring: red core + faint green halo */
  .card:focus-within, .card:is(.is-picked, .is-hover){
    box-shadow:
      0 0 0 2px var(--ring-core),
      0 0 24px var(--ring-halo);
  }

  .card__chrome{
    display:flex; align-items:center; justify-content:space-between;
    padding:6px 8px;
    border-bottom:1px solid var(--stroke-mid);
    font-family: var(--font-mono);
    color: var(--pri-200);
  }
  .chip{
    border:1px solid var(--stroke-mid);
    border-radius:4px; padding:0 6px;
    background: rgba(255,77,109,.06); /* faint neon wash */
  }
  .notch{ width:24px; height:6px; border:1px dashed var(--stroke-mid); }
  .barcode{ width:48px; height:10px; border:1px dashed var(--stroke-mid); }

  .card__content{ padding:10px; }
  .card__title{
    color: var(--pri-200);
    font-weight:700; margin-bottom:6px;
    display:flex; align-items:center; gap:6px;
    text-shadow: 0 0 10px rgba(255,77,109,.25);
  }
  .pill{
    display:inline-block;
    border:1px solid var(--stroke-mid);
    border-radius:10px; padding:0 6px;
    font-family: var(--font-mono);
    background: rgba(255,77,109,.08);
  }
  .card__body{ color: var(--on-soft); line-height:1.3; }

  /* optional: status-colorized letter pills per letter class (keeps variety) */
  .card-S .pill{ background: rgba(174,107,255,.12); border-color: rgba(174,107,255,.45); } /* violet */
  .card-N .pill{ background: rgba(51,225,255,.10); border-color: rgba(51,225,255,.45); }  /* cyan */
  .card-R .pill{ background: rgba(255,176,32,.10); border-color: rgba(255,176,32,.45); }  /* amber */
  .card-F .pill{ background: rgba(255,77,109,.12); border-color: rgba(255,77,109,.45); }  /* red */
  .card-D .pill{ background: rgba(57,255,20,.10); border-color: rgba(57,255,20,.40); }    /* green */
`;

