import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type FileCard = {
  id: "f1" | "f2" | "f3";
  name: string;
  note: string;
  isArtifact: boolean;
};

const FILES: FileCard[] = [
  { id: "f1", name: 'File 1 — "plate_01"', note: "fork with duplicated prongs intersecting rim.", isArtifact: true },
  { id: "f2", name: 'File 2 — "plate_02"', note: "plate ellipse matches table angle; crust natural; utensil normal.", isArtifact: false },
  { id: "f3", name: 'File 3 — "plate_03"', note: "background slants left; dish slants right; food vertical.", isArtifact: true },
];

type Bin = "desk" | "quarantine";

export default function FilesTriage({
  to = "/Slash",
  autoRoute = true,
}: { to?: string; autoRoute?: boolean }) {
  const navigate = useNavigate();

  // Board state
  const [where, setWhere] = useState<Record<FileCard["id"], Bin>>({ f1: "desk", f2: "desk", f3: "desk" });

  // Mini-terminal log
  const [log, setLog] = useState<string[]>(() => [
    "<span class='accent'>Puzzle 4: Files — Artifact Triage (FILES) — Earn KEY-4</span>",
    "<span class='dim'>Principles:</span> No AI Artifacts; perspective coherence.",
    sep(),
  ]);
  const outRef = useRef<HTMLDivElement | null>(null);
  const push = (html: string) => setLog(p => [...p, html]);

  const winRef = useRef<HTMLDivElement | null>(null);
  const [winPos, setWinPos] = useState({ x: 24, y: 24 });         // rendered
  const targetPos = useRef({ x: 24, y: 24 });                      // where we want to go
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
  const loop = () => {
    const k = 0.18;
    setWinPos(prev => {
      const nx = prev.x + (targetPos.current.x - prev.x) * k;
      const ny = prev.y + (targetPos.current.y - prev.y) * k;
      if (Math.abs(nx - prev.x) < 0.15 && Math.abs(ny - prev.y) < 0.15) return prev;
      return { x: nx, y: ny };
    });
    rafRef.current = window.requestAnimationFrame(loop);
  };

  rafRef.current = window.requestAnimationFrame(loop);

  return () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };
}, []);


  function onTitleMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    const rect = winRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  function onMove(e: MouseEvent) {
    const margin = 12; // keep inside viewport with a gutter
    const maxX = Math.max(0, window.innerWidth - (winRef.current?.offsetWidth || 800) - margin);
    const maxY = Math.max(0, window.innerHeight - (winRef.current?.offsetHeight || 600) - margin);
    let x = e.clientX - dragOffset.current.x;
    let y = e.clientY - dragOffset.current.y;
    x = Math.min(Math.max(margin, x), maxX);
    y = Math.min(Math.max(margin, y), maxY);
    targetPos.current = { x, y };
  }
  function onUp() {
    dragging.current = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  const [infoFor, setInfoFor] = useState<FileCard | null>(null);
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setInfoFor(null); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const correct = useMemo(
    () => where.f1 === "quarantine" && where.f3 === "quarantine" && where.f2 !== "quarantine",
    [where]
  );

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    if (!correct) return;
    push("&gt; evaluating…");
    push("<span class='ok'>ARTIFACTS ISOLATED.</span>");
    push("<span class='accent'>KEY-4: TRUE-PLANE</span>");
    push("<span class='dim'>(“True plane” echoes the perspective-coherence requirement.)</span>");
    sessionStorage.setItem("filesSolved", "1");
    if (autoRoute) {
      push("<span class='dim'>Routing to...</span>");
      setTimeout(() => navigate(to, { replace: true }), 1200);
    }
    push(sep());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correct]);

  // DnD handlers
  function onDragStart(e: React.DragEvent, id: FileCard["id"]) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDrop(e: React.DragEvent, bin: Bin) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") as FileCard["id"];
    if (!id) return;
    setWhere(p => ({ ...p, [id]: bin }));
    const f = FILES.find(x => x.id === id)!;
    push(`moved <span class='accent'>${f.name}</span> → <b>${bin.toUpperCase()}</b>`);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function reset() {
    setWhere({ f1: "desk", f2: "desk", f3: "desk" });
    push("reset board.");
  }

  return (
    <div className="files-root">
      <style>{styles}</style>

      <div
        className="window"
        ref={winRef}
        style={{ transform: `translate(${winPos.x}px, ${winPos.y}px)` }}
      >
        <div className="titlebar" onMouseDown={onTitleMouseDown}>
          <div className="traffic" aria-hidden>
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="title">FILES — Finder (Safe Mode)</div>
          <div className="actions">
            <button className="mini" onClick={reset}>Reset</button>
          </div>
        </div>

        <div className="content">
          <aside className="sidebar">
            <div className="group">
              <div className="heading">Locations</div>
              <div className="item on">Desk</div>
              <div className="item">Downloads</div>
              <div className="item">Volumes</div>
            </div>
            <div className="group">
              <div className="heading">Rules</div>
              <div className="rule">No AI Artifacts</div>
              <div className="rule">Perspective Coherence</div>
            </div>
          </aside>

          <main className="area">
            <section
              className="desk column-striped"
              onDrop={(e) => onDrop(e, "desk")}
              onDragOver={onDragOver}
              aria-label="Desk"
            >
              <header>Desk</header>
              <div className="grid">
                {FILES.filter(f => where[f.id] === "desk").map(f => (
                  <FileTile key={f.id} file={f} onDragStart={onDragStart} onInfo={() => setInfoFor(f)} />
                ))}
                {FILES.filter(f => where[f.id] === "desk").length === 0 && (
                  <div className="empty dim">Drag files here to restore from quarantine.</div>
                )}
              </div>
            </section>

            <section
              className={`quarantine column-striped ${correct ? "ready" : ""}`}
              onDrop={(e) => onDrop(e, "quarantine")}
              onDragOver={onDragOver}
              aria-label="Quarantine bin"
            >
              <header>QUARANTINE</header>
              <div className="grid">
                {FILES.filter(f => where[f.id] === "quarantine").map(f => (
                  <FileTile key={f.id} file={f} onDragStart={onDragStart} onInfo={() => setInfoFor(f)} />
                ))}
                {FILES.filter(f => where[f.id] === "quarantine").length === 0 && (
                  <div className="empty dim">Drop faulty files here.</div>
                )}
              </div>
              <footer className="hint">Drop artifacts only.</footer>
            </section>
          </main>
        </div>

        <div className="dock">
          <div className="dock-head">
            <span className="dock-title">console.log</span>
          </div>
          <div className="term" ref={outRef}>
            {log.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }} />)}
          </div>
        </div>
      </div>

      {infoFor && (
        <InfoPopover file={infoFor} onClose={() => setInfoFor(null)} />
      )}
    </div>
  );
}


function FileTile({
  file,
  onDragStart,
  onInfo,
}: {
  file: FileCard;
  onDragStart: (e: React.DragEvent, id: FileCard["id"]) => void;
  onInfo: () => void;
}) {
  return (
    <div
      className={`file ${file.isArtifact ? "artifact" : "ok"}`}
      draggable
      onDragStart={(e) => onDragStart(e, file.id)}
      onDoubleClick={onInfo}
      title={`${file.name}\nNote: ${file.note}${file.isArtifact ? "  ← artifact" : "  ← OK"}`}
      role="button"
      aria-label={file.name}
    >
      <div className="meta">
        <div className="name">{file.name}</div>
        <div className="note">
          Note: {file.note}{" "}
        </div>
        <button className="info-btn" onClick={onInfo}>Get Info</button>
      </div>
    </div>
  );
}

function InfoPopover({ file, onClose }: { file: FileCard; onClose: () => void }) {
  return (
    <div className="popover-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="File Info">
      <div className="popover" onClick={(e) => e.stopPropagation()}>
        <header>
          <span className="title">Get Info</span>
          <button className="close" onClick={onClose}>✕</button>
        </header>
        <section className="body">
          <div className={`large-icon ${file.isArtifact ? "bad" : "good"}`}>
            {file.isArtifact ? "!" : "✓"}
          </div>
          <div className="rows">
            <div className="row">
              <span className="key">Name</span>
              <span className="val">{file.name}</span>
            </div>
            <div className="row">
              <span className="key">Note</span>
              <span className="val">{file.note}</span>
            </div>
            <div className="row">
              <span className="key">Status</span>
              <span className={`val badge ${file.isArtifact ? "bad" : "good"}`}>
                {file.isArtifact ? "artifact" : "OK"}
              </span>
            </div>
            <div className="row">
              <span className="key">Rules</span>
              <span className="val dim">No AI Artifacts; Perspective coherence.</span>
            </div>
          </div>
        </section>
        <footer className="foot">
          <button className="mini" onClick={onClose}>Close</button>
        </footer>
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
  --bg:#0b0f16; --panel:#0f1624; --glass:#10192d; --line:rgba(155,231,255,.25);
  --neon:#39f0ff; --neon2:#ff3cf7; --txt:#d7e2ff; --dim:#97a2b8;
  --ok:#2ecc71; --bad:#ff5c58; --accent:#9be7ff; --scan:rgba(255,255,255,.04);
}

*{box-sizing:border-box}
html,body,#root,.files-root{height:100%}
body{margin:0;background:radial-gradient(1100px 600px at 50% 0%, #10182b 0%, #0b0f16 60%, #06070a 100%);color:var(--txt);font-family:'Share Tech Mono', monospace}

.files-root{position:relative; isolation:isolate}

/* draggable window */
.window{
  position:absolute; top:0; left:0; will-change:transform;
  width:min(1100px, 96vw);
  border:1px solid var(--line); border-radius:12px; overflow:hidden;
  background:linear-gradient(180deg, #121a2c 0%, #0c1423 100%);
  box-shadow:0 10px 40px rgba(0,0,0,.35), 0 0 24px rgba(57,240,255,.2), inset 0 0 18px rgba(57,240,255,.08);
  transition:box-shadow .15s ease;
}
.window:active{ box-shadow:0 10px 50px rgba(0,0,0,.45), 0 0 28px rgba(57,240,255,.28), inset 0 0 18px rgba(57,240,255,.08); }
.titlebar{
  display:flex; align-items:center; gap:12px; padding:10px 12px; border-bottom:1px solid var(--line);
  background:linear-gradient(180deg, #0f1624, #0b1220); cursor:grab; user-select:none;
}
.titlebar:active{ cursor:grabbing; }
.traffic .dot{display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:6px; box-shadow:0 0 8px rgba(255,255,255,.25)}
.dot.red{background:#ff6b6b}.dot.yellow{background:#ffd166}.dot.green{background:#5af78e}
.title{letter-spacing:.5px; text-shadow:0 0 8px rgba(155,231,255,.35)}
.actions{margin-left:auto; display:flex; gap:8px}
.mini{background:transparent; color:var(--accent); border:1px solid var(--line); padding:6px 10px; border-radius:8px; cursor:pointer}
.mini.ghost{color:var(--dim);}

.content{display:flex; min-height:440px}
.sidebar{
  width:220px; border-right:1px solid var(--line); background:linear-gradient(180deg, #0c1423, #0a111e);
  padding:12px; display:flex; flex-direction:column; gap:14px;
}
.group .heading{color:var(--dim); margin-bottom:6px}
.item{padding:6px 8px; border-radius:6px}
.item.on{background:rgba(57,240,255,.08); border:1px solid var(--line)}
.rule{font-size:12px; color:var(--accent)}

/* column view stripes */
.column-striped .grid{
  background:
    repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 28px, transparent 28px, transparent 56px);
  border-top:1px solid rgba(255,255,255,0.04);
}

.area{
  flex:1; display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:12px;
}

section > header{
  padding:8px 10px; border-bottom:1px solid var(--line); color:var(--dim);
  text-transform:uppercase; letter-spacing:1px;
}
.desk, .quarantine{
  background:linear-gradient(180deg, var(--glass), #0b1322);
  border:1px solid var(--line); border-radius:10px; overflow:hidden;
  min-height:300px; display:flex; flex-direction:column;
}
.grid{display:grid; grid-template-columns:1fr; gap:10px; padding:10px}
.empty{padding:12px 10px}

.quarantine{box-shadow:0 0 20px rgba(255,92,88,.15) inset}
.quarantine.ready{
  border-color: rgba(46,204,113,.6);
  box-shadow:0 0 24px rgba(46,204,113,.25), inset 0 0 18px rgba(46,204,113,.18);
}
.quarantine .hint{padding:8px 10px; color:var(--dim); border-top:1px solid var(--line)}

.file{
  display:flex; gap:10px; align-items:flex-start; padding:10px; border:1px solid var(--line);
  background:linear-gradient(180deg, #111a2e 0%, #0c1423 100%); border-radius:8px; cursor:grab;
}
.file:active{cursor:grabbing}
.file .icon{
  width:42px; height:48px; border:1px solid var(--line); border-radius:6px; position:relative;
  background:linear-gradient(180deg, #182338, #0f1624);
  box-shadow:0 0 16px rgba(57,240,255,.15) inset;
}
.file .icon .tab{
  position:absolute; right:4px; top:0; width:16px; height:10px; background:rgba(57,240,255,.18);
  border-bottom-left-radius:6px; border-bottom-right-radius:6px;
}
.file .icon .glyph{
  position:absolute; left:0; right:0; bottom:6px; text-align:center; font-weight:bold;
  color:#061420; background:var(--accent); margin:0 6px; border-radius:4px; box-shadow:0 0 10px rgba(155,231,255,.6);
}
.file.ok .glyph{ background: var(--ok); color:#062012 }
.file.artifact .glyph{ background: var(--bad); color:#220607 }

.meta{flex:1}
.name{font-weight:600}
.note{color:var(--dim); font-size:13px}
.badge{padding:1px 6px; border-radius:6px; margin-left:6px}
.badge.good{background:rgba(46,204,113,.18); border:1px solid rgba(46,204,113,.45); color:#adf3c3}
.badge.bad{background:rgba(255,92,88,.18); border:1px solid rgba(255,92,88,.45); color:#ffd8d6}
.info-btn{
  margin-top:6px; background:transparent; color:var(--accent);
  border:1px solid var(--line); border-radius:6px; padding:4px 8px; cursor:pointer;
}

/* mini-terminal */
.dock{border-top:1px solid var(--line)}
.dock-head{padding:8px 10px; color:var(--dim); border-bottom:1px solid var(--line)}
.term{
  height:140px; padding:10px; overflow:auto; font-family:'VT323', monospace; font-size:18px;
  color:var(--txt);
}
.term .sep{ color:var(--dim) }
.term .dim{ color:var(--dim) }
.term .ok{ color:var(--ok) }
.term .accent{ color:var(--accent) }

/* Get Info popover */
.popover-backdrop{
  position:fixed; inset:0; background:rgba(0,0,0,.35); display:grid; place-items:center; z-index:10;
}
.popover{
  width:min(520px, 92vw); border:1px solid var(--line); border-radius:12px;
  background:linear-gradient(180deg, #141c30, #0e1526); box-shadow:0 10px 40px rgba(0,0,0,.5), 0 0 24px rgba(57,240,255,.22);
}
.popover header{
  display:flex; align-items:center; padding:10px 12px; border-bottom:1px solid var(--line);
}
.popover .title{letter-spacing:.5px}
.popover .close{margin-left:auto; background:transparent; color:var(--txt); border:1px solid var(--line); border-radius:8px; padding:2px 8px; cursor:pointer}
.popover .body{display:flex; gap:14px; padding:12px}
.large-icon{
  width:72px; height:84px; border-radius:10px; display:grid; place-items:center;
  font-size:42px; font-weight:700; color:#061420; box-shadow:0 0 16px rgba(57,240,255,.18) inset;
  background:linear-gradient(180deg, #182338, #0f1624);
  border:1px solid var(--line);
}
.large-icon.good{ background:linear-gradient(180deg, rgba(46,204,113,.2), rgba(7,40,23,1)); border-color:rgba(46,204,113,.45) }
.large-icon.bad{ background:linear-gradient(180deg, rgba(255,92,88,.2), rgba(35,7,7,1)); border-color:rgba(255,92,88,.45) }
.rows{flex:1; display:grid; gap:8px}
.row{display:grid; grid-template-columns:120px 1fr; gap:8px}
.key{color:var(--dim)}
.val.badge{padding:2px 8px; border-radius:8px}
.val.badge.good{background:rgba(46,204,113,.18); border:1px solid rgba(46,204,113,.45); color:#adf3c3}
.val.badge.bad{background:rgba(255,92,88,.18); border:1px solid rgba(255,92,88,.45); color:#ffd8d6}
.foot{padding:8px 12px; border-top:1px solid var(--line); display:flex; justify-content:flex-end}
`;
