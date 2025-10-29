import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Pt = { x: number; y: number };

export default function AlignGrid({
  size = 600,         
  to = "/Finale",                  
  autoRoute = false,   
}: { size?: number; to?: string; autoRoute?: boolean }) {
  const navigate = useNavigate();
  const S = size;
  const target = 0.08;         
  const tol = 0.01;            
  const minPad = 0.05;         

  // derived circle radius so that when centered, padding ~= target
  // padding = (S/2 - r)/S → r = S/2 - target*S
  const R = useMemo(() => S * (0.5 - target), [S]);

  const clamp = (p: Pt) => ({
    x: Math.min(Math.max(p.x, R), S - R),
    y: Math.min(Math.max(p.y, R), S - R),
  });

  const [c, setC] = useState<Pt>(() => ({ x: S / 2, y: S / 2 })); // start centered
  const [dragging, setDragging] = useState(false);
  const [log, setLog] = useState<string[]>(() => [
    "<span class='accent'>Puzzle 7: Alignment Grid (ALIGN) — Earn KEY-7</span>",
    "<span class='dim'>Principle:</span> Framing — centered; ≥5%, ideal 8–10% padding; no crop.",
    "<span class='dim'>UI:</span> Square neon grid with draggable dish + live padding meter.",
    "<span class='dim'>Mechanic:</span> Drag until all sides read 0.08 ± 0.01. Snap will lock on target.",
    sep(),
  ]);

  const push = (s: string) => setLog(p => [...p, s]);
  const outRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { outRef.current?.scrollTo({ top: outRef.current.scrollHeight }); }, [log]);

  // paddings as fractions of frame
  const pads = useMemo(() => {
    const left = (c.x - R) / S;
    const right = (S - (c.x + R)) / S;
    const top = (c.y - R) / S;
    const bottom = (S - (c.y + R)) / S;
    return { left, right, top, bottom };
  }, [c, R, S]);

  const inRange = (v: number) => Math.abs(v - target) <= tol;
  const allGood =
    inRange(pads.left) &&
    inRange(pads.right) &&
    inRange(pads.top) &&
    inRange(pads.bottom);

  const [locked, setLocked] = useState(false);

  // snap + success once
  useEffect(() => {
    if (locked) return;
    if (allGood) {
      // snap to perfect center to feel crisp
      setC({ x: S / 2, y: S / 2 });
      setLocked(true);
      push("&gt; verifying frame…");
      push("<span class='ok'>CENTER CONFIRMED.</span>");
      push("<span class='accent'>KEY-7: PCT-08</span>");
      push("“Precision is tasty.”");
      sessionStorage.setItem("alignSolved", "1");
      if (autoRoute && to) {
        push(`<span class='dim'>Routing to ${to}…</span>`);
        setTimeout(() => navigate(to, { replace: true }), 1200);
      }
      push(sep());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGood, locked]);

  // dragging (mouse + touch)
  const wrap = useRef<HTMLDivElement | null>(null);
  const startDrag = (clientX: number, clientY: number) => {
    if (locked) return;
    setDragging(true);
    moveTo(clientX, clientY);
  };
  const moveTo = (clientX: number, clientY: number) => {
    const rect = wrap.current!.getBoundingClientRect();
    const local = { x: clientX - rect.left, y: clientY - rect.top };
    setC(clamp(local));
  };
  const endDrag = () => setDragging(false);

  // mouse
  const onMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => dragging && moveTo(e.clientX, e.clientY);
  const onMouseUp = () => endDrag();
  const onMouseLeave = () => endDrag();

  // touch
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    moveTo(t.clientX, t.clientY);
  };
  const onTouchEnd = () => endDrag();

  // keyboard nudges (arrow keys)
  useEffect(() => {
    const step = Math.max(1, Math.round(S * 0.002)); // ~0.2% per nudge
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const delta = { x: 0, y: 0 };
        if (e.key === "ArrowLeft") delta.x = -step;
        if (e.key === "ArrowRight") delta.x = step;
        if (e.key === "ArrowUp") delta.y = -step;
        if (e.key === "ArrowDown") delta.y = step;
        setC(prev => clamp({ x: prev.x + delta.x, y: prev.y + delta.y }));
      }
      if (e.key.toLowerCase() === "c") {
        // center helper
        setC({ x: S / 2, y: S / 2 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [S, locked]);

  return (
    <div className="align-root">
      <style>{styles}</style>

      <header className="hdr">
        <div className="hdr-left">
          <span className="badge">ALIGN</span>
          <span className="title">Alignment Grid</span>
        </div>
        <div className="hdr-right">
          <button
            className="mini ghost"
            onClick={() => { setC({ x: S / 2, y: S / 2 }); setLocked(false); push("reset frame."); }}
          >
            Reset
          </button>
          {to && <button className="mini" onClick={() => navigate(to, { replace: true })}>Skip</button>}
        </div>
      </header>

      <main className="board">
        <div className="left">
          <div
            ref={wrap}
            className={`frame ${locked ? "locked" : ""}`}
            style={{ width: S, height: S }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            role="application"
            aria-label="Alignment frame. Drag the circle to center. Use arrow keys to nudge; press C to center."
          >
            {/* neon grid */}
            <svg width={S} height={S} className="grid" aria-hidden>
              {/* outer border */}
              <rect x="0" y="0" width={S} height={S} className="border" />
              {/* grid lines */}
              {Array.from({ length: 10 }).map((_, i) => {
                const p = ((i + 1) / 11) * S;
                return (
                  <g key={i} className="gline">
                    <line x1={p} y1={0} x2={p} y2={S} />
                    <line x1={0} y1={p} x2={S} y2={p} />
                  </g>
                );
              })}
              {/* crosshair */}
              <line x1={S/2} y1={0} x2={S/2} y2={S} className="cross"/>
              <line x1={0} y1={S/2} x2={S} y2={S/2} className="cross"/>
            </svg>

            {/* dish */}
            <div
              className="dish"
              style={{
                width: R * 2,
                height: R * 2,
                transform: `translate(${c.x - R}px, ${c.y - R}px)`
              }}
              aria-label="Dish circle (draggable)"
            />

            {/* snap indicator */}
            {locked && <div className="snap">LOCK</div>}
          </div>

          <div className="hints">
            <span className="dim">Goal:</span> padding on each side = <b>0.08 ± 0.01</b>.
            <span className="dim">Controls:</span> drag • arrows to nudge • <kbd>C</kbd> to center.
          </div>
        </div>

        <div className="right">
          <Meter label="LEFT"   value={pads.left}   target={target} tol={tol} minPad={minPad}/>
          <Meter label="RIGHT"  value={pads.right}  target={target} tol={tol} minPad={minPad}/>
          <Meter label="TOP"    value={pads.top}    target={target} tol={tol} minPad={minPad}/>
          <Meter label="BOTTOM" value={pads.bottom} target={target} tol={tol} minPad={minPad}/>
          <div className={`status ${allGood ? "ok" : ""}`}>
            Status: {fmt(pads.left)} / {fmt(pads.right)} / {fmt(pads.top)} / {fmt(pads.bottom)} {allGood ? "→ IN RANGE" : "→ adjust"}
          </div>
        </div>
      </main>

      <section className="dock">
        <div className="dock-head">
          <span className="dock-title">mini-term</span>
        </div>
        <div className="term" ref={outRef}>
          {log.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }} />)}
        </div>
      </section>
    </div>
  );
}

/* ——— small bits ——— */

function Meter({ label, value, target, tol, minPad }: { label: string; value: number; target: number; tol: number; minPad: number; }) {
  const pct = Math.max(0, Math.min(1, value / 0.15)); // scale bar up to 15% for illustration
  const ok = Math.abs(value - target) <= tol;
  const warn = value < minPad; // below 5% guideline
  return (
    <div className={`meter ${ok ? "ok" : warn ? "warn" : ""}`} aria-label={`${label} padding ${fmt(value)}`}>
      <div className="m-head">
        <span className="m-label">{label}</span>
        <span className="m-val">{fmt(value)}</span>
      </div>
      <div className="bar">
        <div className="fill" style={{ width: `${pct * 100}%` }} />
        <div className="tick" style={{ left: `${target / 0.15 * 100}%` }} />
        <div className="band" style={{
          left: `${(target - tol) / 0.15 * 100}%`,
          width: `${(2 * tol) / 0.15 * 100}%`
        }} />
      </div>
    </div>
  );
}

function fmt(v: number) {
  return v.toFixed(3).replace(/^0/, "0");
}

function sep() {
  return "<span class='sep'>== == == == == == == == == == == == == == == == == ==</span>";
}

/* ——— styles ——— */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

:root{
  --bg:#0b0f16; --panel:#0f1624; --line:rgba(155,231,255,.25);
  --neon:#39f0ff; --mag:#ff3cf7; --txt:#d7e2ff; --dim:#97a2b8;
  --ok:#2ecc71; --err:#ff5c58; --accent:#9be7ff; --scan:rgba(255,255,255,.04);
}

*{box-sizing:border-box}
html,body,#root,.align-root{height:100%}
body{margin:0;background:radial-gradient(1100px 600px at 50% 0%, #10182b 0%, #0b0f16 60%, #06070a 100%);color:var(--txt);font-family:'Share Tech Mono', monospace}

.align-root{display:flex;flex-direction:column;gap:12px;padding:14px;position:relative;isolation:isolate}
.align-root::after{
  content:"";position:absolute;inset:0;z-index:-1;
  background:linear-gradient(0deg, transparent 0%, var(--scan) 2%, transparent 3%);
  background-size:100% 8px;mix-blend-mode:screen;animation:scan 8s linear infinite;
}
@keyframes scan{0%{background-position-y:0}100%{background-position-y:100%}}

.hdr{display:flex;justify-content:space-between;align-items:center}
.badge{padding:2px 8px;border:1px solid var(--neon);border-radius:6px;box-shadow:0 0 10px rgba(57,240,255,.35)}
.title{margin-left:8px;text-shadow:0 0 8px rgba(155,231,255,.35)}
.hdr-left{display:flex;align-items:center;gap:8px}
.mini{background:transparent;color:var(--accent);border:1px solid var(--line);padding:6px 10px;border-radius:8px;cursor:pointer}
.mini.ghost{color:var(--dim)}

.board{display:grid;grid-template-columns:1fr 340px;gap:12px;align-items:start}
.left{display:grid;gap:8px}
.frame{
  position:relative; border:1px solid var(--line); border-radius:10px; overflow:hidden;
  background:linear-gradient(180deg,#121a2c,#0c1423);
  user-select:none; touch-action:none;
}
.frame.locked{ box-shadow:0 0 24px rgba(46,204,113,.25) inset, 0 0 18px rgba(46,204,113,.18); }
.grid{position:absolute;inset:0}
.border{fill:none;stroke:rgba(155,231,255,.45);stroke-width:2}
.gline line{stroke:rgba(155,231,255,.15);stroke-width:1}
.cross{stroke:rgba(155,231,255,.25);stroke-width:1}

.dish{
  position:absolute; border-radius:50%;
  background:radial-gradient(circle at 50% 35%, rgba(255,255,255,.12), rgba(57,240,255,.08) 40%, rgba(255,60,247,.08));
  border:1px solid rgba(155,231,255,.45);
  box-shadow:0 0 18px rgba(155,231,255,.25), inset 0 0 20px rgba(57,240,255,.15);
  cursor:grab;
}
.frame:active .dish{ cursor:grabbing; }

.snap{
  position:absolute; top:8px; right:10px;
  padding:2px 8px; border-radius:8px; font-weight:700; letter-spacing:1px;
  background:rgba(46,204,113,.18); color:#adf3c3; border:1px solid rgba(46,204,113,.45);
  box-shadow:0 0 10px rgba(46,204,113,.25);
}

.hints{color:var(--dim);display:flex;gap:12px;flex-wrap:wrap}
.hints kbd{border:1px solid var(--line);border-radius:6px;padding:1px 6px}

.right{display:grid;gap:8px}
.meter{
  border:1px solid var(--line); border-radius:8px; padding:8px; background:rgba(0,0,0,.15);
}
.m-head{display:flex;justify-content:space-between;margin-bottom:6px;color:var(--dim)}
.m-val{color:var(--txt)}
.bar{position:relative;height:12px;border:1px solid var(--line);border-radius:6px;overflow:hidden;background:rgba(155,231,255,.06)}
.fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg, var(--neon), var(--mag));box-shadow:0 0 10px rgba(57,240,255,.25); width:0}
.tick{position:absolute;top:-2px;width:2px;bottom:-2px;background:#adf3ff;box-shadow:0 0 6px rgba(155,231,255,.8)}
.band{position:absolute;top:0;bottom:0;background:rgba(46,204,113,.18);border-left:1px dashed rgba(46,204,113,.45);border-right:1px dashed rgba(46,204,113,.45)}
.meter.ok{ box-shadow:0 0 12px rgba(46,204,113,.18) inset; }
.meter.warn .m-val{ color:#ffd166 }

.status{
  margin-top:4px;padding:8px 10px;border:1px dashed var(--line);border-radius:8px;color:var(--dim)
}
.status.ok{ color:#adf3c3; border-color:rgba(46,204,113,.55); box-shadow:0 0 12px rgba(46,204,113,.2) }

.dock{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:6px}
.dock-head{padding:8px 10px;color:var(--dim);border-bottom:1px solid var(--line);background:rgba(0,0,0,.2)}
.term{height:150px;padding:10px;overflow:auto;font-family:'VT323',monospace;font-size:18px}
.term .dim{color:var(--dim)} .term .ok{color:var(--ok)} .term .accent{color:var(--accent)} .term .sep{color:var(--dim)}
`;
