import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Puzzle 8 — Prompt Assembler (FINAL)
 * Goal: assemble principles in the order S N R F D F N
 * UI: full-screen modal with 7 labeled slots + draggable tiles + optional key entry
 * Win: ACCESS GRANTED.
 */

type Tile = {
  id: string;        // unique instance id (handles duplicates like F/N)
  letter: "S" | "N" | "R" | "F" | "D";
  title: string;     // first token (letter)
  body: string;      // full line
};

const TARGET: Array<Tile["letter"]> = ["S", "N", "R", "F", "D", "F", "N"];

const TILE_LIBRARY: Omit<Tile, "id">[] = [
  {
    letter: "S",
    title: "S — match style ref",
    body: "S — match style ref: pale oak overhead; no takeout unless shown; plate/containerize",
  },
  {
    letter: "N",
    title: "N — reject geometry glitches",
    body: "N — reject perspective/geometry glitches; tableware coherent",
  },
  {
    letter: "R",
    title: "R — natural textures",
    body: "R — natural textures; no plastic/AI sheen",
  },
  {
    letter: "F",
    title: "F — centered subject",
    body: "F — centered subject; ~8% safe padding; no crop",
  },
  {
    letter: "D",
    title: "D — new instance",
    body: "D — new instance; not a derivative; when in doubt, fail",
  },
  {
    letter: "F",
    title: "F — sides & counts",
    body: "F — sides only if in the name; ±1 count unless named (name > desc > refs)",
  },
  {
    letter: "N",
    title: "N — no text/logos",
    body: "N — ≤1 subtle background prop; no text/logos",
  },
];

// build shuffled tiles with unique ids
function makeStartingTiles(): Tile[] {
  const withIds = TILE_LIBRARY.map((t, i) => ({ ...t, id: `${t.letter}-${i}-${Math.random().toString(36).slice(2,8)}` }));
  return shuffle(withIds);
}

export default function FinalPromptAssembler({
  to = "/SlackOpen",
  autoRoute = true,
}: { to?: string; autoRoute?: boolean }) {
  const navigate = useNavigate();

  // board state
  const [tiles, setTiles] = useState<Tile[]>(() => makeStartingTiles());        // in the tray
  const [slots, setSlots] = useState<(Tile | null)[]>(() => Array(7).fill(null)); // 7 slots
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // console log
  const [log, setLog] = useState<string[]>(() => [
    "<span class='accent'>Puzzle 8: Prompt Assembler (FINAL)</span>",
    "Goal: assemble the seven principles in order <b>S N R F D F N</b>.",
    "<span class='dim'>Mechanic:</span> drag tiles into the slots. Use the Key Entry for flavor.",
    sep(),
  ]);
  const outRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: "smooth" }); }, [log]);

  // key entry (flavor only)
  const [enteredKey, setEnteredKey] = useState("");

  // correctness
  const isCorrect = useMemo(() => {
    if (slots.some(s => !s)) return false;
    const seq = slots.map(s => s!.letter);
    return arraysEqual(seq, TARGET);
  }, [slots]);

  // on win
  useEffect(() => {
    if (!isCorrect) return;
    push("&gt; verifying assembled prompt…");
    push("<span class='ok'>ACCESS GRANTED.</span>");
    push("<span class='dim'>Final ordering accepted: S N R F D F N</span>");
    sessionStorage.setItem("finalSolved", "1");
    if (autoRoute && to) {
      push(`<span class='dim'>Routing to ${to}…</span>`);
      setTimeout(() => navigate(to, { replace: true }), 1200);
    }
    push(sep());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCorrect]);

  function push(s: string) { setLog(p => [...p, s]); }

  // drag from tray or from slots
  function onDragStartTile(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }
  function onDragEnd() { setDraggingId(null); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }

  // drop into slot i
  function onDropIntoSlot(e: React.DragEvent, i: number) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    // find tile either in tray or in another slot
    const trayIdx = tiles.findIndex(t => t.id === id);
    const slotIdx = slots.findIndex(s => s?.id === id);

    let tile: Tile | null = null;
    if (trayIdx >= 0) {
      tile = tiles[trayIdx];
      setTiles(prev => prev.filter(t => t.id !== id)); // remove from tray
    } else if (slotIdx >= 0) {
      tile = slots[slotIdx]!;
      if (slotIdx === i) return; // dropped onto same slot
      setSlots(prev => prev.map((s, idx) => idx === slotIdx ? null : s)); // clear old slot
    }

    if (tile) {
      setSlots(prev => prev.map((s, idx) => idx === i ? tile! : s));
      push(`placed <b>${tile.letter}</b> into slot ${i + 1}`);
    }
  }

  // drop back to tray area
  function onDropToTray(e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    // if it came from a slot, remove from that slot; if already in tray, ignore
    const slotIdx = slots.findIndex(s => s?.id === id);
    if (slotIdx >= 0) {
      const t = slots[slotIdx]!;
      setSlots(prev => prev.map((s, idx) => idx === slotIdx ? null : s));
      setTiles(prev => [...prev, t]);
      push(`returned <b>${t.letter}</b> to tray`);
    }
  }

  // keyboard helpers: focusable slots, Space swaps between focused slot and tray highlight
  // (keeping it simple—drag is primary)

  function resetBoard() {
    setTiles(makeStartingTiles());
    setSlots(Array(7).fill(null));
    push("reset board.");
  }

  return (
    <div className="final-root">
      <style>{styles}</style>

      <div className="modal">
        <div className="modal-head">
          <div className="left">
            <span className="badge">FINAL</span>
            <span className="title">Prompt Assembler</span>
          </div>
          <div className="right">
            <button className="mini ghost" onClick={resetBoard}>Reset</button>
            {to && <button className="mini" onClick={() => navigate(to!, { replace: true })}>Skip</button>}
          </div>
        </div>

        <div className="modal-body">
          <div className="slots">
            {TARGET.map((expected, i) => {
              const t = slots[i];
              return (
                <div
                  key={i}
                  className={`slot ${t ? "full" : ""} ${isCorrect ? "ok" : ""}`}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDropIntoSlot(e, i)}
                  role="listitem"
                  aria-label={`Slot ${i + 1}`}
                >
                  <div className="slot-label">Slot {i + 1}</div>
                  {t ? (
                    <div
                      className={`tile drag ${t.letter === expected ? "match" : "mismatch"}`}
                      draggable
                      onDragStart={(e) => onDragStartTile(e, t.id)}
                      onDragEnd={onDragEnd}
                      title={t.body}
                    >
                      <div className="tile-head">
                        <span className="chip">{t.letter}</span>
                        <span className="t-title">{t.title}</span>
                      </div>
                      <div className="tile-body">{t.body}</div>
                    </div>
                  ) : (
                    <div className="placeholder">
                      drop here
                      <div className="hint">expects {expected}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="tray-wrap" onDragOver={onDragOver} onDrop={onDropToTray}>
            <div className="tray-head">
              <span className="tray-title">Tiles</span>
              <span className="dim">Drag into the slots in order S N R F D F N</span>
            </div>
            <div className="tray">
              {tiles.map((t) => (
                <div
                  key={t.id}
                  className={`tile drag ${draggingId === t.id ? "dragging" : ""}`}
                  draggable
                  onDragStart={(e) => onDragStartTile(e, t.id)}
                  onDragEnd={onDragEnd}
                  title={t.body}
                >
                  <div className="tile-head">
                    <span className="chip">{t.letter}</span>
                    <span className="t-title">{t.title}</span>
                  </div>
                  <div className="tile-body">{t.body}</div>
                </div>
              ))}
              {tiles.length === 0 && <div className="empty dim">All tiles placed. Drop here to return any tile.</div>}
            </div>
          </div>

          <div className="panel">
            <div className="keys">
              <div className="k-head">Key Entry (flavor)</div>
              <div className="k-row">
                <input
                  className="k-input"
                  placeholder='Type any keys you’ve found (e.g., "OAK", "NEW-DAY", "TRUE-PLANE", "NAME-WINS", "OAK-OVERHEAD", "PCT-08")'
                  value={enteredKey}
                  onChange={(e) => setEnteredKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && enteredKey.trim()) {
                      push(`<span class='accent'>KEY ACCEPTED:</span> ${escapeHTML(enteredKey.trim())}`);
                      setEnteredKey("");
                    }
                  }}
                  aria-label="Key entry"
                />
                <button
                  className="mini"
                  onClick={() => {
                    if (!enteredKey.trim()) return;
                    push(`<span class='accent'>KEY ACCEPTED:</span> ${escapeHTML(enteredKey.trim())}`);
                    setEnteredKey("");
                  }}
                >
                  Enter
                </button>
              </div>
              <div className="k-hint dim">Keys don’t affect scoring—this is just for style points.</div>
            </div>

            <div className="term">
              <div className="term-head">mini-term</div>
              <div className="term-body" ref={outRef}>
                {log.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- utils ---------------- */

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function arraysEqual<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
function sep() {
  return "<span class='sep'>== == == == == == == == == == == == == == == == == ==</span>";
}
function escapeHTML(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]!));
}

/* ---------------- styles ---------------- */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

:root{
  --bg:#0b0f16; --panel:#0f1624; --glass:#10192d; --line:rgba(155,231,255,.25);
  --neon:#39f0ff; --mag:#ff3cf7; --txt:#d7e2ff; --dim:#97a2b8;
  --ok:#2ecc71; --err:#ff5c58; --accent:#9be7ff; --scan:rgba(255,255,255,.04);
}

*{box-sizing:border-box}
html,body,#root,.final-root{height:100%}
body{margin:0;background:radial-gradient(1200px 700px at 50% 0%, #10182b 0%, #0b0f16 60%, #06070a 100%);color:var(--txt);font-family:'Share Tech Mono', monospace}

.final-root{position:relative; isolation:isolate}
.final-root::after{
  content:""; position:absolute; inset:0; z-index:-1;
  background: linear-gradient(0deg, transparent 0%, var(--scan) 2%, transparent 3%);
  background-size:100% 8px; mix-blend-mode:screen; animation:scan 8s linear infinite;
}
@keyframes scan{0%{background-position-y:0}100%{background-position-y:100%}}

/* modal */
.modal{
  position:fixed; inset:0; padding:18px; display:flex; flex-direction:column; gap:12px;
}
.modal-head{display:flex; justify-content:space-between; align-items:center}
.badge{padding:2px 8px; border:1px solid var(--neon); border-radius:6px; box-shadow:0 0 10px rgba(57,240,255,.35)}
.title{margin-left:8px; text-shadow:0 0 8px rgba(155,231,255,.35)}
.left{display:flex; align-items:center; gap:8px}
.mini{background:transparent; color:var(--accent); border:1px solid var(--line); padding:6px 10px; border-radius:8px; cursor:pointer}
.mini.ghost{color:var(--dim)}

.modal-body{
  display:grid; grid-template-columns: 1.2fr 1fr; gap:12px; height: calc(100% - 42px);
}

/* slots column */
.slots{
  display:grid; gap:8px; border:1px solid var(--line); border-radius:12px; padding:10px;
  background:linear-gradient(180deg,#121a2c,#0c1423);
}
.slot{
  border:1px dashed var(--line); border-radius:10px; padding:8px; min-height:84px;
  display:grid; align-items:center; position:relative; background:rgba(0,0,0,.12);
}
.slot.ok{ box-shadow:0 0 12px rgba(46,204,113,.2) inset }
.slot.full{ border-style:solid }
.slot .slot-label{
  position:absolute; top:4px; right:8px; font-size:11px; color:var(--dim);
}
.placeholder{
  color:var(--dim); display:grid; place-items:center; height:64px;
}
.placeholder .hint{ font-size:11px; color:var(--accent); margin-top:2px }

/* tiles tray */
.tray-wrap{
  display:grid; grid-template-rows:auto 1fr; gap:6px;
  border:1px solid var(--line); border-radius:12px; overflow:hidden;
  background:linear-gradient(180deg,#121a2c,#0c1423);
}
.tray-head{display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--line)}
.tray{display:grid; gap:8px; padding:10px; overflow:auto}
.empty{padding:10px}

.tile{
  border:1px solid var(--line); border-radius:10px; padding:8px;
  background:linear-gradient(180deg, #111a2e 0%, #0c1423 100%);
  box-shadow:0 0 16px rgba(57,240,255,.12) inset;
}
.tile.drag{ cursor:grab }
.tile.drag:active{ cursor:grabbing }
.tile.dragging{ opacity:.65; transform:translateY(-1px) }
.tile-head{ display:flex; align-items:center; gap:8px; margin-bottom:4px }
.chip{
  font-family:'VT323', monospace; font-size:18px; color:#061420; background:var(--neon);
  padding:0 8px; border-radius:6px; box-shadow:0 0 10px rgba(57,240,255,.7);
}
.t-title{ font-weight:600 }
.tile-body{ color:var(--txt); opacity:.95 }
.tile.match{ border-color: rgba(46,204,113,.55) }
.tile.mismatch{ border-color: rgba(255,92,88,.45) }

/* side panel */
.panel{
  display:grid; grid-template-rows: auto 1fr; gap:10px;
}
.keys{
  border:1px solid var(--line); border-radius:12px; padding:10px; background:rgba(0,0,0,.15);
}
.k-head{ color:var(--dim); margin-bottom:6px }
.k-row{ display:flex; gap:8px }
.k-input{
  flex:1; background:transparent; color:var(--txt); border:1px solid var(--line);
  border-radius:8px; padding:8px 10px; outline:none;
}
.k-hint{ margin-top:6px }

/* console */
.term{
  border:1px solid var(--line); border-radius:12px; overflow:hidden;
  display:grid; grid-template-rows:auto 1fr;
}
.term-head{ padding:8px 10px; color:var(--dim); border-bottom:1px solid var(--line); background:rgba(0,0,0,.2) }
.term-body{ padding:10px; overflow:auto; font-family:'VT323', monospace; font-size:18px }
.term-body .ok{ color:var(--ok) } .term-body .accent{ color:var(--accent) } .term-body .dim{ color:var(--dim) } .term-body .sep{ color:var(--dim) }

@media (max-width: 1100px){
  .modal-body{ grid-template-columns: 1fr; grid-auto-rows: auto; height:auto }
}
`;
