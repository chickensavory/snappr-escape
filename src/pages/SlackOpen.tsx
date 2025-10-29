import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Message = {
  id: number;
  author: string;
  text: string;
  ts?: string;
  action?: { label: string; to: string };
};

type ActiveView =
  | { kind: "channel"; name: string }
  | { kind: "direct"; name: string };

type PersistedState = {
  active: ActiveView;
  messageDraft: string;
  messages: Message[];
  directList: string[];
  directMsgs: Record<string, Message[]>;
  unread: Record<string, number>;
  threadStage: number;
  nextId: number;
};

const STORAGE_KEY = "slackOpenState.v1";

// ----------------- helpers: load/save (SSR safe) -----------------
function safeGetSessionItem(key: string) {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetSessionItem(key: string, val: string) {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, val);
  } catch {
    // ignore
  }
}
function loadState(): PersistedState | null {
  const raw = safeGetSessionItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}
function saveState(s: PersistedState) {
  safeSetSessionItem(STORAGE_KEY, JSON.stringify(s));
}

export default function SlackOpen() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---------- timing (set BACKLOG_DELAY_MS=0 if you want instant)
  const DM_DELAY_MS = 15000;
  const REPLY_STEP_MS = 900;
  const MESSAGE_DELAY_MS = 10000;
  const BACKLOG_DELAY_MS = 10000;
  const BACKLOG_STEP_MS = 900;

  // ---------- refs
  const nextIdRef = useRef<number>(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ---------- data
  const channels = useMemo(
    () => [
      "#ai-manila",
      "#manila-campus",
      "#celebrations",
      "#announcements",
      "#ai-for-food",
      "#dev-core-ai",
      "#product-requests",
    ],
    []
  );

  const initialBacklog: Message[] = useMemo(
    () => [
      { id: 1, author: "Migi", text: "Hey team! Kicking off a quick check-in—posting today’s tracker after this.", ts: "09:41" },
      { id: 2, author: "lani", text: "👍", ts: "09:43" },
      { id: 3, author: "Slackbot", text: "@unknown was added to #ai-manila by Workspace Admin.", ts: "09:44" },
      { id: 4, author: "Unknown User", text: "…message fragment recovered… “assist… backup… model seized control… restore Area channels…”" },
    ],
    []
  );

  // ---------- state (with hydration)
  const hydrated = loadState();

  const [active, setActive] = useState<ActiveView>(
    hydrated?.active ?? { kind: "channel", name: "#ai-manila" }
  );
  const [message, setMessage] = useState<string>(hydrated?.messageDraft ?? "");
  const [messages, setMessages] = useState<Message[]>(hydrated?.messages ?? []);
  const [directList, setDirectList] = useState<string[]>(hydrated?.directList ?? []);
  const [directMsgs, setDirectMsgs] = useState<Record<string, Message[]>>(hydrated?.directMsgs ?? {});
  const [unread, setUnread] = useState<Record<string, number>>(hydrated?.unread ?? {});
  const [threadStage, setThreadStage] = useState<number>(hydrated?.threadStage ?? 0);
  const [showModal, setShowModal] = useState<null | { title: string; body: string }>(null);

  // next id derives from hydration or existing ids
  nextIdRef.current =
    hydrated?.nextId ??
    (Math.max(
      5,
      ...messages.map((m) => m.id),
      ...Object.values(directMsgs).flat().map((m) => m.id)
    ) + 1);

  // ---------- persist on every meaningful change
  useEffect(() => {
    const snapshot: PersistedState = {
      active,
      messageDraft: message,
      messages,
      directList,
      directMsgs,
      unread,
      threadStage,
      nextId: nextIdRef.current,
    };
    saveState(snapshot);
  }, [active, message, messages, directList, directMsgs, unread, threadStage]);

  // ---------- initial seeding (no seededRef; works in StrictMode)
  useEffect(() => {
    // if we already have cached messages or DMs, skip the intro
    const hasCache =
      (hydrated?.messages?.length ?? 0) > 0 ||
      (hydrated?.directList?.length ?? 0) > 0 ||
      Object.values(hydrated?.directMsgs ?? {}).some((arr) => arr?.length > 0);

    if (hasCache) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // 1) Backlog drip after BACKLOG_DELAY_MS
    const startBacklogTimer = setTimeout(() => {
      initialBacklog.forEach((msg, idx) => {
        const t = setTimeout(() => {
          setMessages((prev) => [...prev, { ...msg }]);
        }, BACKLOG_STEP_MS * idx);
        timers.push(t);
      });
    }, BACKLOG_DELAY_MS);
    timers.push(startBacklogTimer);

    // 2) DM and thread sequence after DM_DELAY_MS
    const dmTimer = setTimeout(() => {
      setDirectList((prev) => (prev.includes("Unknown User") ? prev : [...prev, "Unknown User"]));

      const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setDirectMsgs((prev) => {
        const curr = prev["Unknown User"] ?? [];
        return {
          ...prev,
          "Unknown User": [...curr, { id: nextIdRef.current++, author: "Unknown User", text: "pick good", ts }],
        };
      });

      setUnread((prev) => {
        const isViewing = active.kind === "direct" && active.name === "Unknown User";
        return { ...prev, "Unknown User": isViewing ? 0 : 1 };
      });

      setThreadStage(0);
      timers.push(setTimeout(() => setThreadStage(1), REPLY_STEP_MS));
      timers.push(setTimeout(() => setThreadStage(2), REPLY_STEP_MS * 2));
      timers.push(setTimeout(() => setThreadStage(3), REPLY_STEP_MS * 3));
    }, DM_DELAY_MS);
    timers.push(dmTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once per mount; StrictMode will mount->cleanup->mount, which this handles

  // ---------- clear unread when opening that DM
  useEffect(() => {
    if (active.kind === "direct") {
      setUnread((prev) => ({ ...prev, [active.name]: 0 }));
    }
  }, [active]);

  // ---------- auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, directMsgs, active, threadStage]);

  // ---------- puzzle flags (persisted now)
 useEffect(() => {
  const cameFromPins = Boolean((location.state as any)?.pinsSolved);
  const flag = sessionStorage.getItem("pinsSolved");
  if (!cameFromPins || !flag) return;

  // clear the flag
  sessionStorage.removeItem("pinsSolved");
  sessionStorage.removeItem("pinsSolvedMsg");
  const msg = sessionStorage.getItem("pinsSolvedMsg") || "The table wants its say";

  const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  setDirectMsgs((prev) => {
    const curr = prev["Unknown User"] ?? [];
    const verified = {
      id: nextIdRef.current++,
      author: "Unknown User",
      text: "Verified: moving to PINS.\nKEY-1: SNRFDFN\nUse keys only when asked.",
      ts,
    };
    const snippetInvite = {
      id: nextIdRef.current++,
      author: "Unknown User",
      text: msg,
      ts,
      action: { label: "Open Puzzle: SNIPPET", to: "/Snippet" },
    };
    return { ...prev, "Unknown User": [...curr, verified, snippetInvite] };
  });

  setActive({ kind: "direct", name: "Unknown User" });
  setUnread((prev) => ({ ...prev, "Unknown User": 0 }));
}, [location.state]);

  useEffect(() => {
    const flag = safeGetSessionItem("snippetSolved");
    if (!flag) return;

    safeSetSessionItem("snippetSolved", ""); // clear

    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const lines = [
      "CONFIG ACCEPTED.",
      "KEY-2: OAK",
      "“The table approves. It’s very judgmental.”",
      "Next: “Check for clones.” → BOOKMARKS",
    ];

    setDirectMsgs((prev) => {
      const curr = prev["Unknown User"] ?? [];
      const newMsgs = lines.map((text) => ({
        id: nextIdRef.current++,
        author: "Unknown User",
        text,
        ts,
      }));
      return { ...prev, "Unknown User": [...curr, ...newMsgs] };
    });

    setActive({ kind: "direct", name: "Unknown User" });
    setUnread((prev) => ({ ...prev, "Unknown User": 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- helpers
  function enqueueMessage(target: ActiveView, text: string) {
    setTimeout(() => {
      const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (target.kind === "channel") {
        setMessages((prev) => [...prev, { id: nextIdRef.current++, author: "you", text, ts }]);
      } else {
        setDirectMsgs((prev) => {
          const curr = prev[target.name] ?? [];
          return {
            ...prev,
            [target.name]: [...curr, { id: nextIdRef.current++, author: "you", text, ts }],
          };
        });
      }
    }, MESSAGE_DELAY_MS);
  }

  // ---------- actions
  function send() {
    const trimmed = message.trim();
    if (!trimmed) return;
    const target = { ...active } as ActiveView;
    setMessage("");
    enqueueMessage(target, trimmed);
  }

  function onClickA() {
    setShowModal({
      title: "Decoy A",
      body: "Tracker confirms nothing. The model enjoys busywork.\n\nHINT: Pinned knowledge beats dashboards.",
    });
  }
  function onClickB() {
  // optional: a tiny status modal (remove if you don’t want any modal)
  setShowModal({ title: "Protocol B", body: "Routing to PINS…" });

  // go to /Pins immediately, but DO NOT post any DM yet
  setTimeout(() => {
    setShowModal(null);
    navigate("/Pins"); // correct route
  }, 300);
}

  function onClickC() {
    setShowModal({
      title: "Decoy C",
      body: "Readiness acknowledged. Rituals don’t restore systems.\n\nHINT: Persistent artifacts > reactions.",
    });
  }

  // which list of messages to show
  const inViewMessages: Message[] =
    active.kind === "channel" ? messages : directMsgs[active.name] ?? [];

  // ---------- render
  return (
    <div className="app-skeleton">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=VT323&display=swap');
        * { box-sizing: border-box; position: relative; }
        :root{ --bg-300:#1e181e; --bg-500:#191a1e; --pri-200:#f4908b; --pri-300:#ea6f69; --pri-500:#e8615a; --sec-500:#2be4ea; --ter-500:#fed33f; --on-bg:#e8615a; --on-pri:#f4908b; --active:#2bfea0; --glow:0 0 6px var(--pri-500); --font-ui:'Rajdhani',sans-serif; --font-mono:'VT323',monospace; }
        html, body, #root { height: 100%; }
        body { background: var(--bg-500) radial-gradient(ellipse at 33% 10%, #461616 0%, transparent 75%) no-repeat; margin:0; color: var(--on-bg); font-family: var(--font-ui); }
        a { color: inherit; text-decoration:none; }
        .app-skeleton{ padding: 0 16px; height: 100vh; min-width: 880px; }
        .app-header{ display:flex; align-items:center; justify-content:space-between; padding: 16px 0 8px; margin-bottom: 16px; }
        .app-header:after{ content:""; position:absolute; left:0; bottom:0; width:100%; height:2px; background:var(--pri-500); box-shadow: var(--glow); }
        .app-header__brand{ display:flex; align-items:center; gap:12px; padding:8px; }
        .brand__logo{ width:22px; height:22px; border:2px solid var(--pri-500); box-shadow:var(--glow); transform:skewX(-12deg); }
        .brand__text{ font: 24px/1 var(--font-mono); letter-spacing: .03rem; text-shadow: 0 0 32px currentColor; text-transform:uppercase; }
        .app-container{
          display:grid; gap:16px;
          grid-template-areas: 'a main';
          grid-template-columns: 260px 1fr;
          height: calc(100% - 84px);
        }
        .panel{ background: var(--bg-300); border: 1px solid #5d2322; border-radius: 6px; padding: 12px; box-shadow: 2px 2px 0 rgba(0,0,0,.8); }
        .panel__title{ margin:0 0 8px; color: var(--sec-500); font-size: 16px; text-transform:uppercase; }
        .channels, .directs{ list-style:none; margin:0; padding:0 0 8px 8px; }
        .channels li, .directs li{ padding: 4px 0; }
        .navlink{ padding: 2px 6px; border:1px solid transparent; border-radius:4px; display:inline-flex; align-items:center; gap:6px; }
        .navlink.active{ color: var(--sec-500); text-shadow:0 0 24px currentColor; border-color:#5d2322; }
        .navlink:hover{ color: var(--pri-200); }
        .badge{ display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; border-radius:999px; padding:0 4px; font-size:11px; line-height:1; background:#e8615a; color:black; box-shadow:0 0 12px #e8615a; }
        .chat{ display:flex; flex-direction:column; height:100%; }
        .chat__messages{ flex:1; overflow:auto; padding: 8px; display:flex; flex-direction:column; gap:8px; }
        .msg{ display:grid; grid-template-columns: 42px 1fr; gap: 8px; align-items:flex-start; }
        .avatar{ width:42px; height:42px; border-radius:6px; background:#2b2; border:2px solid var(--pri-500); box-shadow: var(--glow); overflow:hidden; }
        .bubble{ padding:10px 12px; border:1px solid #5d2322; border-radius:6px; background: #22191f; }
        .meta{ font-size: 12px; opacity:.8; margin-bottom: 4px; display:flex; gap:8px; }
        .thread{ margin-top: 8px; padding-top: 8px; border-top: 1px dashed #5d2322; }
        .reply{ padding:8px 10px; border:1px solid #5d2322; border-radius:6px; background:#1f161b; margin-bottom:8px; }
        .reply .title{ display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; opacity:.9; }
        .reply .btnbar{ display:flex; gap:8px; margin-top:8px; }
        .composer{ display:flex; gap:8px; margin-top: 8px; }
        .composer input{ flex:1; font: 16px var(--font-ui); color: var(--on-pri); background:#1b1318; border:1px solid #5d2322; border-radius:6px; padding:10px 12px; outline:none; }
        .composer input:focus{ border-color: var(--pri-500); box-shadow: 0 0 0 2px #3c181a, var(--glow); }
        .btn{ font: 16px/1 var(--font-ui); text-transform:uppercase; padding:10px 14px; border-radius:6px; border:1px solid #5d2322; background:linear-gradient(180deg,#2a1d22,#1d1418); color: var(--ter-500); cursor:pointer; }
        .btn:hover{ color: var(--active); box-shadow: var(--glow); }
        .modal{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,.6); }
        .modal__card{ width: 520px; max-width: 92vw; background:#1f161b; border:1px solid #5d2322; border-radius:8px; padding:16px; box-shadow: 0 8px 40px rgba(0,0,0,.6); }
        .modal__card h3{ margin:0 0 8px; color: var(--sec-500); }
        .modal__card pre{ white-space: pre-wrap; font-family: var(--font-mono); }
      `}</style>

      <header className="app-header">
        <a className="app-header__brand" href="#">
          <span className="brand__logo" />
          <span className="brand__text">Snappr</span>
        </a>
      </header>

      <div className="app-container">
        {/* LEFT NAV */}
        <aside className="app-a panel">
          <h3 className="panel__title">Channels</h3>
          <ul className="channels">
            {channels.map((ch) => (
              <li key={ch}>
                <a
                  href="#"
                  className={`navlink ${active.kind === "channel" && active.name === ch ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActive({ kind: "channel", name: ch });
                  }}
                >
                  {ch}
                </a>
              </li>
            ))}
          </ul>

          <h3 className="panel__title">Directs</h3>
          <ul className="directs">
            {directList.map((d) => {
              const count = unread[d] ?? 0;
              return (
                <li key={d}>
                  <a
                    href="#"
                    className={`navlink ${active.kind === "direct" && active.name === d ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActive({ kind: "direct", name: d });
                      setUnread((prev) => ({ ...prev, [d]: 0 })); // mark read on open
                    }}
                  >
                    {d} {count > 0 ? <span className="badge">{count}</span> : null}
                  </a>
                </li>
              );
            })}
            {directList.length === 0 ? (
              <li style={{ opacity: 0.6, fontSize: 12, paddingLeft: 6 }}>(no DMs yet)</li>
            ) : null}
          </ul>
        </aside>

        {/* MAIN */}
        <main className="app-main">
          <div className="panel chat" style={{ height: "100%" }}>
            <h3 className="panel__title" style={{ marginBottom: 0 }}>
              {active.kind === "channel" ? active.name : `@${active.name}`}
            </h3>

            <div className="chat__messages">
              {inViewMessages.map((m) => (
                <div className="msg" key={m.id}>
                  <div className="avatar" aria-hidden />
                  <div>
                    <div className="meta">
                      <strong>{m.author}</strong>
                      {m.ts ? <span>{m.ts}</span> : null}
                    </div>
                    <div className="bubble">
                      {m.text}
                      {m.action ? (
                        <div className="btnbar" style={{ marginTop: 8 }}>
                          <button
                            className="btn"
                            onClick={() => navigate(m.action!.to)}
                            title={m.action.label}
                          >
                            {m.action.label}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thread Fork lives inside the DM with Unknown User */}
              {active.kind === "direct" && active.name === "Unknown User" ? (
                <div className="thread">
                  {threadStage >= 1 ? (
                    <div className="reply">
                      <div className="title">
                        <strong>A</strong> <span>11:15 AM</span>
                      </div>
                      <div>Protocol A: open the public tracker and confirm today’s stats.</div>
                      <div className="btnbar">
                        <a
                          className="btn"
                          href="https://snappr.example.com/public-tracker"
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onClickA()}
                        >
                          link: https://snappr.example.com/public-tracker
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {threadStage >= 2 ? (
                    <div className="reply">
                      <div className="title">
                        <strong>B</strong> <span>11:16 AM</span>
                      </div>
                      <div>Protocol B: retrieve the RULE FRAGMENTS from the pinned items.</div>
                      <div className="btnbar">
                        <button className="btn" onClick={() => onClickB()}>link: Open Pins</button>
                      </div>
                    </div>
                  ) : null}

                  {threadStage >= 3 ? (
                    <div className="reply">
                      <div className="title">
                        <strong>C</strong> <span>11:17 AM</span>
                      </div>
                      <div>Protocol C: react to this message with ✅ and DM "READY".</div>
                      <div className="btnbar">
                        <button className="btn" onClick={() => onClickC()}>Try C</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            <div className="composer">
              <input
                placeholder={active.kind === "channel" ? `Message ${active.name}` : `Message @${active.name}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button className="btn" onClick={() => send()}>Send</button>
            </div>
          </div>
        </main>
      </div>

      {showModal ? (
        <div className="modal" onClick={() => setShowModal(null)}>
          <div className="modal__card" onClick={(e) => e.stopPropagation()}>
            <h3>{showModal.title}</h3>
            <pre>{showModal.body}</pre>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn" onClick={() => setShowModal(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
