import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Note = { id: "A" | "B" | "C"; title: string; body: string };

const NOTES: Note[] = [
  {
    id: "A",
    title: "A — Observation",
    body:
      "Crisp fries on pale oak, overhead. Spiral cut differs from refs; plate rim unique."
  },
  {
    id: "B",
    title: "B — Observation",
    body:
      "Fries on pale oak, overhead. Same spiral pattern as ref #2, same plate rim scuff, identical crumb cluster at 2 o’clock."
  },
  {
    id: "C",
    title: "C — Observation",
    body:
      "Straight-cut fries; plate style differs, same surface. Lighting softer than refs but within range."
  }
];

const CORRECT = "B";

export default function BookmarksClonePuzzle() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<"A" | "B" | "C" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0..3
 const [log, setLog] = useState<string[]>(() => [
  sep(),
  "<span class='dim'>BOOKMARKS online.</span>",
  "Three notes. One is derivative. Select A/B/C, then press <span class='accent'>Enter</span>.",
  "<span class='dim'>Distinctiveness principle in effect.</span>",
  sep()
  ]);
  const outRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

 // keyboard
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();

    // Instant evaluate on A/B/C
    if (k === "a" || k === "b" || k === "c") {
      e.preventDefault();
      e.stopPropagation();
      evaluate(k.toUpperCase() as "A" | "B" | "C");
      return;
    }

    // Enter = fallback submit using current selection (if any)
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }

    // Optional manual hint
    if (e.key === "?") {
      e.preventDefault();
      printHint(Math.min(hintLevel + 1, 3), /*manual*/ true);
    }
  };

  window.addEventListener("keydown", onKeyDown, { capture: true });
  return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
}, [picked, hintLevel]);



  function pushLog(html: string) {
    setLog(prev => [...prev, html]);
  }

  function evaluate(choice: "A" | "B" | "C") {
  setPicked(choice);
  pushLog(sep());
  pushLog(`&gt; evaluating choice <span class='accent'>${choice}</span>…`);
  setShowResult(true);

  if (choice === CORRECT) {
    pushLog("<span class='ok'>CLONE PURGED.</span>");
    pushLog("<span class='accent'>KEY-3: NEW-DAY</span>");
    pushLog("“Copies are flattery. I am bored of flattery.”");
    sessionStorage.setItem("bookmarksSolved", "1");
    setTimeout(() => navigate('/Loading', { replace: true }), 900);
  } else {
    pushLog("<span class='err'>Not quite.</span>");
    setHintLevel(h => {
      const next = Math.min(h + 1, 3);
      setTimeout(() => printHint(next), 80);
      return next;
    });
    pushLog("<span class='dim'>Try again. Press A/B/C to pick, or click a card.</span>");
  }
  pushLog(sep());
}

function submit() {
  if (!picked) {
    pushLog("<span class='warn'>Pick A, B, or C first.</span>");
    return;
  }
  evaluate(picked);
}

function printHint(level: number, manual = false) {
  if (level <= 0) return;
  if (level === 1) {
    pushLog("<span class='dim'>HINT:</span> Distinctiveness fails when <em>specific scars</em> repeat.");
  } else if (level === 2) {
    pushLog("<span class='dim'>HINT:</span> Look for <em>identical</em> micro-artifacts and arrangement: texture clusters, edge damage, repeating geometry.");
  } else {
    // Tier 3 gives the concrete tell, not the letter
    pushLog("<span class='dim'>HINT:</span> The clone mirrors a ref’s spiral pattern, a plate-rim scuff, and a crumb cluster near <em>2 o’clock</em>.");
  }
  if (manual) setHintLevel(level);
}


  return (
    <div className="bm-root">
      <style>{styles}</style>

      <header className="hdr">
        <div className="hdr-left">
          <span className="badge">BOOKMARKS</span>
          <span className="title">Spot the Clone</span>
        </div>
        <div className="hdr-right">
          <span className="principle">Principle: Distinctiveness</span>
        </div>
      </header>

      <div className="grid">
        {NOTES.map(n => {
          const active = picked === n.id;
          const wrong = showResult && picked === n.id && picked !== CORRECT;
          const correct = showResult && n.id === CORRECT && picked === CORRECT;

          return (
            <button
              key={n.id}
              className={[
                "card",
                active ? "active" : "",
                wrong ? "wrong" : "",
                correct ? "correct" : ""
              ].join(" ")}
              onClick={() => evaluate(n.id)} 
              aria-pressed={active}
              aria-label={`Select ${n.id}`}
              
            >
              <div className="card-head">
                <span className="chip">{n.id}</span>
                <span className="glitch">{n.title}</span>
              </div>
              <div className="card-body">
                <p>{n.body}</p>
              </div>
              <div className="card-foot">
                <span className="hint">Press {n.id} to select</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="dock">
        <div className="dock-head">
          <span className="dot" /><span className="dot" /><span className="dot" />
          <span className="dock-title">console.log</span>
          <div className="dock-actions">
          </div>
        </div>
        <div className="term" ref={outRef}>
          {log.map((l, i) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: l }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function sep() {
  return "<span class='sep'>== == == == == == == == == == == == == == == == == ==</span>";
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

:root{
  --bg:#0a0a0f;
  --panel: rgba(255, 23, 68, 0.06);   /* translucent neon-red wash */
  --panel-2: rgba(255, 23, 68, 0.10);
  --neon:#ff1744;                     /* NEON RED primary */
  --neon-2:#ff3cf7;                   /* magenta accent */
  --txt:#ffeef2;
  --dim:#ffb7c4;
  --ok:#33ff99;                       /* success pop */
  --err:#ff5577;                      /* softer red for errors */
  --warn:#ffd166;
  --accent:#ff8aa6;                   /* warm neon accent */
  --grid: rgba(255, 23, 68, 0.10);
  --scan: rgba(255, 23, 68, 0.07);
}

*{box-sizing:border-box}
html,body,#root,.bm-root{height:100%}
body{
  margin:0;
  background:
    radial-gradient(1200px 600px at 50% 0%, #1a0e14 0%, #0a0a0f 60%, #050508 100%);
  color:var(--txt);
  font-family:'Share Tech Mono', monospace
}
.bm-root{
  display:flex; flex-direction:column; gap:16px; padding:16px 16px 24px;
  position:relative; isolation:isolate;
}
.bm-root::before{
  content:""; position:absolute; inset:0; z-index:-2;
  background:
    linear-gradient(transparent 24px, var(--grid) 25px) 0 0/100% 25px,
    linear-gradient(90deg, transparent 24px, var(--grid) 25px) 0 0/25px 100%;
  mask-image: radial-gradient(1200px 900px at 50% 20%, black 60%, transparent 100%);
}
.bm-root::after{
  content:""; position:absolute; inset:0; z-index:-1;
  background: linear-gradient(0deg, transparent 0%, var(--scan) 2%, transparent 3%);
  background-size:100% 8px; mix-blend-mode:screen; pointer-events:none;
  animation:scan 8s linear infinite;
}

.hdr{
  display:flex; justify-content:space-between; align-items:center; gap:12px;
  text-shadow:0 0 6px rgba(155,231,255,0.35);
}
.badge{
  padding:4px 8px; border:1px solid var(--neon); border-radius:4px;
  box-shadow:0 0 12px rgba(57,240,255,0.35) inset, 0 0 12px rgba(57,240,255,0.35);
  letter-spacing:1px;
}
.title{font-size:18px; margin-left:10px}
.principle{color:var(--dim); font-size:14px}

.grid{
  display:grid; grid-template-columns:repeat(3,1fr); gap:14px;
}

.card{
  background: var(--panel);
  border:1px solid rgba(255, 23, 68, 0.45);
  border-radius:10px;
  padding:12px;
  text-align:left;
  cursor:pointer;
  position:relative;
  overflow:hidden;
  transition:transform .12s ease, border-color .12s ease, box-shadow .12s ease, background .12s ease;
}
.card::before{
  content:""; position:absolute; inset:-1px; background:
    radial-gradient(500px 120px at 0% 0%, rgba(255,60,247,.15), transparent 60%),
    radial-gradient(500px 120px at 100% 0%, rgba(57,240,255,.15), transparent 60%);
  opacity:.6; pointer-events:none;
}
.card:hover{ transform: translateY(-2px); box-shadow:0 0 24px rgba(255,23,68,.35); background: var(--panel-2); }
.card.active{ border-color: var(--neon); box-shadow:0 0 18px rgba(255,23,68,.45); }
.card.correct{ border-color: var(--ok); box-shadow:0 0 28px rgba(51,255,153,.35); }
.card.wrong{ border-color: var(--err); box-shadow:0 0 28px rgba(255,85,119,.35); }

.card-head{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.chip{
  font-family:'VT323', monospace; font-size:18px; color:#061420; background:var(--neon);
  padding:0 8px; border-radius:4px; box-shadow:0 0 10px rgba(57,240,255,.7);
}
.glitch { position:relative; font-weight:600; }
.glitch::before, .glitch::after{
  content:attr(data-text); position:absolute; left:0; top:0; overflow:hidden; white-space:nowrap;
}
.glitch{ text-shadow: 0 0 3px rgba(155,231,255,.7); }
.card-body p{ margin:0; color:var(--txt); line-height:1.35 }
.card-foot{ margin-top:10px; color:var(--dim); font-size:12px; letter-spacing:.5px }

.dock{
  background: linear-gradient(180deg, rgba(255,23,68,0.06) 0%, rgba(255,23,68,0.04) 100%);
  border:1px solid rgba(255, 23, 68, 0.35);
  border-radius:8px; overflow:hidden;
}
.dock-head{ border-bottom:1px solid rgba(255, 23, 68, 0.25); }
.dot{ background:var(--neon); box-shadow:0 0 8px rgba(255,23,68,.9); }
.dot:nth-child(2){ background:var(--neon-2); box-shadow:0 0 8px rgba(255,60,247,.8); }
.dot:nth-child(3){ background:#33ff99; box-shadow:0 0 8px rgba(51,255,153,.8) }
.dock-title{ margin-left:6px; color:var(--dim) }
.dock-actions{ margin-left:auto; display:flex; gap:8px }
.btn{
  background:transparent; color:var(--accent); border:1px solid rgba(155,231,255,.35);
  padding:6px 10px; border-radius:6px; cursor:pointer;
}
.btn:hover{ box-shadow:0 0 12px rgba(155,231,255,.2); }
.btn.ghost{ color:var(--dim); border-color:rgba(155,231,255,.2) }

.term{
  height:180px; padding:10px; overflow:auto; font-family:'VT323', monospace; font-size:18px;
  color:var(--txt);
  background:
    linear-gradient(0deg, rgba(255,23,68,.03), rgba(255,23,68,.03)),
    radial-gradient(700px 140px at 50% 0%, rgba(255,23,68,.08), transparent 70%);
}
.term .sep{ color:var(--dim) }
.term .dim{ color:var(--dim) }
.term .ok{ color:var(--ok) }
.term .err{ color:var(--err) }
.term .warn{ color:var(--warn) }
.term .accent{ color:var(--accent) }

@keyframes scan{ 0%{ background-position-y:0 } 100%{ background-position-y:100% } }

@media (max-width: 960px){
  .grid{ grid-template-columns:1fr; }
}
`;
