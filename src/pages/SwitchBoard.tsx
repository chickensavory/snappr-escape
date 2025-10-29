import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Puzzle 6 — Style Surface Switchboard (SURFACE) — Earn KEY-6
 * Principle: Style Consistency — match background material; plate/container rules;
 *            don’t place food straight on the background.
 *
 * Ref: pale oak, overhead, plate (not container)
 * SURFACE: [oak] [stone] [laminate]
 * SERVEWARE: [plate] [container]
 * Correct: oak + plate
 */

type Surface = "oak" | "stone" | "laminate";
type Serveware = "plate" | "container";

export default function SurfaceSwitchboard({
  to,               // e.g., "/Align"
  autoRoute = false // set true to auto-navigate after success
}: { to?: string; autoRoute?: boolean }) {
  const navigate = useNavigate();

  const [surface, setSurface] = useState<Surface | null>(null);
  const [serve, setServe] = useState<Serveware | null>(null);
  const [log, setLog] = useState<string[]>(() => [
    "<span class='accent'>Puzzle 6: Style Surface Switchboard (SURFACE) — Earn KEY-6</span>",
    "<span class='dim'>Principle:</span> Style Consistency — match background material; plate/container rules; don’t place food straight on the background.",
    "<span class='dim'>UI:</span> Switchboard panel with toggles.",
    "<span class='dim'>Mechanic:</span> Choose SURFACE and SERVEWARE to match the ref label.",
    sep(),
    "<span class='dim'>Ref:</span> pale oak, overhead, <b>plate</b> (not container)",
  ]);
  const outRef = useRef<HTMLDivElement | null>(null);

  const correct = useMemo(() => surface === "oak" && serve === "plate", [surface, serve]);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    if (!correct) return;
    push("&gt; verifying selection…");
    push("<span class='ok'>SURFACE LOCKED.</span>");
    push("<span class='accent'>KEY-6: OAK-OVERHEAD</span>");
    push("“The tree spirits nod.”");
    sessionStorage.setItem("surfaceSolved", "1");
    if (autoRoute && to) {
      push(`<span class='dim'>Routing to ${to}…</span>`);
      setTimeout(() => navigate(to, { replace: true }), 1000);
    }
    push(sep());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correct]);

  function push(s: string) { setLog(p => [...p, s]); }

  return (
    <div className="surface-root">
      <style>{styles}</style>

      <header className="hdr">
        <div className="hdr-left">
          <span className="badge">SURFACE</span>
          <span className="title">Style Switchboard</span>
        </div>
        <div className="hdr-right">
          <button className="mini ghost" onClick={() => { setSurface(null); setServe(null); push("reset panel."); }}>
            Reset
          </button>
          {to && (
            <button className="mini" onClick={() => navigate(to, { replace: true })}>
              Skip
            </button>
          )}
        </div>
      </header>

      <main className="panel">
        <section className="ref">
          <div className="label">Ref label</div>
          <div className="refline">pale oak, <span className="accent">overhead</span>, <b>plate</b> (not container)</div>
        </section>

        <section className="group">
          <div className="g-title">SURFACE</div>
          <ChipRow
            options={[
              { key: "oak", label: "oak", hint: "matches ‘pale oak’" },
              { key: "stone", label: "stone", hint: "mismatch (not in ref)" },
              { key: "laminate", label: "laminate", hint: "mismatch (not in ref)" },
            ]}
            value={surface}
            onChange={(v) => { setSurface(v as Surface); push(`SURFACE → <b>${v}</b>`); }}
          />
          <div className="desc dim">Match the background material from the ref.</div>
        </section>

        <section className="group">
          <div className="g-title">SERVEWARE</div>
          <ChipRow
            options={[
              { key: "plate", label: "plate", hint: "matches ref" },
              { key: "container", label: "container", hint: "ref says not container" },
            ]}
            value={serve}
            onChange={(v) => { setServe(v as Serveware); push(`SERVEWARE → <b>${v}</b>`); }}
          />
          <div className="desc dim">Food goes on serveware; don’t place food straight on the background.</div>
        </section>

        <section className={`status ${correct ? "ok" : ""}`}>
          <div className="line">
            Status: {surface ?? "—"} + {serve ?? "—"} {correct ? "→ MATCH" : "→ adjust to match ref"}
          </div>
        </section>
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

/* ——— tiny UI bits ——— */

function ChipRow({
  options,
  value,
  onChange
}: {
  options: { key: string; label: string; hint?: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="chips">
      {options.map(opt => (
        <button
          key={opt.key}
          className={`chip ${value === opt.key ? "on" : ""}`}
          onClick={() => onChange(opt.key)}
          aria-pressed={value === opt.key}
        >
          <span className="led" />
          {opt.label}
          {opt.hint && <span className="hint">{opt.hint}</span>}
        </button>
      ))}
    </div>
  );
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
html,body,#root,.surface-root{height:100%}
body{margin:0;background:radial-gradient(1100px 600px at 50% 0%, #10182b 0%, #0b0f16 60%, #06070a 100%);color:var(--txt);font-family:'Share Tech Mono', monospace}

.surface-root{display:flex;flex-direction:column;gap:12px;padding:14px;position:relative;isolation:isolate}
.surface-root::after{
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

.panel{
  border:1px solid var(--line);border-radius:10px;overflow:hidden;
  background:linear-gradient(180deg,#121a2c,#0c1423);
  display:grid; gap:10px; padding:12px;
}
.ref .label{color:var(--dim);font-size:12px;margin-bottom:4px}
.refline{letter-spacing:.2px}

.group{display:grid;gap:8px;margin-top:6px}
.g-title{font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--dim)}
.desc{font-size:12px}

.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{
  position:relative;
  display:inline-flex;align-items:center;gap:8px;
  background:transparent;border:1px solid var(--line);color:var(--txt);
  padding:8px 12px;border-radius:999px;cursor:pointer;
}
.chip .led{width:10px;height:10px;border-radius:50%;background:rgba(155,231,255,.2);box-shadow:0 0 8px rgba(155,231,255,.15) inset}
.chip.on{border-color:rgba(46,204,113,.5);color:#adf3c3;box-shadow:0 0 10px rgba(46,204,113,.18)}
.chip.on .led{background:#2ecc71;box-shadow:0 0 8px rgba(46,204,113,.8)}
.chip .hint{margin-left:6px;color:var(--dim);font-size:11px}

.status{
  margin-top:4px;padding:8px 10px;border:1px dashed var(--line);border-radius:8px;color:var(--dim)
}
.status.ok{ color:#adf3c3; border-color:rgba(46,204,113,.55); box-shadow:0 0 12px rgba(46,204,113,.2) }

.dock{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:6px}
.dock-head{padding:8px 10px;color:var(--dim);border-bottom:1px solid var(--line);background:rgba(0,0,0,.2)}
.term{height:150px;padding:10px;overflow:auto;font-family:'VT323',monospace;font-size:18px}
.term .dim{color:var(--dim)} .term .ok{color:var(--ok)} .term .accent{color:var(--accent)} .term .sep{color:var(--dim)}
`;
