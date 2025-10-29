import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type YesNo = "YES" | "NO";

type Row = {
  id: "A" | "B" | "C";
  name: string;
  desc?: string;
  side: YesNo;
  exact: YesNo;
};

const START_ROWS: Row[] = [
  { id: "A", name: `"2pc Tenders with Fries"`, side: "NO", exact: "NO" },
  { id: "B", name: `"BBQ Ribs"`, desc: `Desc: "Comes with two sides (optional)."`, side: "NO", exact: "NO" },
  { id: "C", name: `"Chicken Wings"`, desc: `(no number in name; refs show 7–9)`, side: "NO", exact: "NO" },
];

const ANSWER: Record<Row["id"], { side: YesNo; exact: YesNo }> = {
  A: { side: "YES", exact: "YES" },
  B: { side: "NO", exact: "NO" },
  C: { side: "NO", exact: "NO" },
};

export default function SlashSearchAudit({
  to,           
  autoRoute = false,
}: { to?: string; autoRoute?: boolean }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>(START_ROWS);
  const [log, setLog] = useState<string[]>(() => [
    "Items:",
    `A) "2pc Tenders with Fries"`,
    `B) "BBQ Ribs" — Desc: "Comes with two sides (optional)."`,
    `C) "Chicken Wings" — (no number; refs show 7–9)`,
    sep(),
    "Set the chips. When correct, the audit will complete."
  ]);
  const outRef = useRef<HTMLDivElement | null>(null);

  function push(l: string) { setLog(p => [...p, l]); }

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  const correct = useMemo(() => {
    return rows.every(r => r.side === ANSWER[r.id].side && r.exact === ANSWER[r.id].exact);
  }, [rows]);

  useEffect(() => {
    if (!correct) return;
    push("&gt; evaluating selections…");
    push("<span class='ok'>AUDIT CLEAN.</span>");
    push("<span class='accent'>KEY-5: NAME-WINS</span>");
    push("“Names are law. Descriptions are gossip.”");
    sessionStorage.setItem("slashSolved", "1");
    if (autoRoute && to) {
      push(`<span class='dim'>Routing to ${to}…</span>`);
      setTimeout(() => navigate(to, { replace: true }), 1000);
    }
    push(sep());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correct]);

  function setSide(id: Row["id"], v: YesNo) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, side: v } : r));
    push(`A${id === "A" ? "" : id === "B" ? "" : ""} <span class='tag'>${id}</span> side → <b>${v}</b>`);
  }
  function setExact(id: Row["id"], v: YesNo) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, exact: v } : r));
    push(`<span class='tag'>${id}</span> exact → <b>${v}</b>`);
  }

  return (
    <div className="slash-root">
      <style>{styles}</style>

      <header className="hdr">
        <div className="hdr-left">
          <span className="badge">SLASH</span>
          <span className="title">Sides &amp; Counts</span>
        </div>
        <div className="hdr-right">
          <button className="mini ghost" onClick={() => setRows(START_ROWS)}>Reset</button>
          {to && <button className="mini" onClick={() => navigate(to, { replace: true })}>Skip</button>}
        </div>
      </header>

      <main className="board">
        {rows.map((r) => (
          <article key={r.id} className="row">
            <div className="cell id">{r.id}</div>
            <div className="cell name">
              <div className="line">{r.name}</div>
              {r.desc && <div className="desc dim">{r.desc}</div>}
            </div>
            <div className="cell toggles">
              <div className="group">
                <div className="label">Side required?</div>
                <Chip on={r.side === "YES"} onClick={() => setSide(r.id, r.side === "YES" ? "NO" : "YES")} />
              </div>
              <div className="group">
                <div className="label">Count exact?</div>
                <Chip on={r.exact === "YES"} onClick={() => setExact(r.id, r.exact === "YES" ? "NO" : "YES")} />
                <span className="tiny-hint dim">
                  {r.id === "A" ? "name has 2pc → exact"
                   : r.id === "B" ? "no number in name → ±1 OK"
                   : "no number in name; refs 7–9 → ±1 OK"}
                </span>
              </div>
            </div>
          </article>
        ))}
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

/* --- UI bits --- */
function Chip({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      className={`chip ${on ? "on" : "off"}`}
      onClick={onClick}
      aria-pressed={on}
      aria-label={`Toggle ${on ? "YES" : "NO"}`}
    >
      <span className="led" />
      {on ? "YES" : "NO"}
    </button>
  );
}

function sep() {
  return "<span class='sep'>== == == == == == == == == == == == == == == == == ==</span>";
}

/* --- styles --- */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

:root{
  --bg:#0b0f16; --panel:#0f1624; --neon:#39f0ff; --mag:#ff3cf7;
  --txt:#d7e2ff; --dim:#97a2b8; --ok:#2ecc71; --err:#ff5c58; --accent:#9be7ff;
  --line:rgba(155,231,255,.25); --scan:rgba(255,255,255,.04);
}
*{box-sizing:border-box}
html,body,#root,.slash-root{height:100%}
body{margin:0;background:radial-gradient(1100px 600px at 50% 0%, #10182b 0%, #0b0f16 60%, #06070a 100%);color:var(--txt);font-family:'Share Tech Mono', monospace}

.slash-root{display:flex;flex-direction:column;gap:12px;padding:14px;position:relative;isolation:isolate}
.slash-root::after{
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

.board{
  border:1px solid var(--line);border-radius:10px;overflow:hidden;
  background:linear-gradient(180deg,#121a2c,#0c1423);
}
.row{display:grid;grid-template-columns:40px 1.4fr 1fr;gap:0;border-bottom:1px solid var(--line)}
.row:last-child{border-bottom:none}
.cell{padding:10px}
.cell.id{color:var(--dim)}
.cell.name .line{font-weight:600}
.desc{margin-top:2px}
.toggles{display:grid;gap:8px}
.group{display:grid;gap:4px}
.label{color:var(--dim);font-size:12px}
.tiny-hint{font-size:11px}

.chip{
  display:inline-flex;align-items:center;gap:8px;
  background:transparent;border:1px solid var(--line);color:var(--txt);
  padding:6px 10px;border-radius:999px;cursor:pointer;
}
.chip .led{width:10px;height:10px;border-radius:50%;background:rgba(155,231,255,.2);box-shadow:0 0 8px rgba(155,231,255,.15) inset}
.chip.on{border-color:rgba(46,204,113,.5);color:#adf3c3;box-shadow:0 0 10px rgba(46,204,113,.18)}
.chip.on .led{background:#2ecc71;box-shadow:0 0 8px rgba(46,204,113,.8)}
.chip.off{border-color:rgba(255,92,88,.45);color:#ffd8d6;box-shadow:0 0 10px rgba(255,92,88,.18)}
.chip.off .led{background:#ff5c58;box-shadow:0 0 8px rgba(255,92,88,.8)}

.dock{border:1px solid var(--line);border-radius:10px;overflow:hidden}
.dock-head{padding:8px 10px;color:var(--dim);border-bottom:1px solid var(--line);background:rgba(0,0,0,.2)}
.term{height:160px;padding:10px;overflow:auto;font-family:'VT323',monospace;font-size:18px}
.term .dim{color:var(--dim)} .term .ok{color:var(--ok)} .term .accent{color:var(--accent)} .term .sep{color:var(--dim)}
`;
