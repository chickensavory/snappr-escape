import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  :root {
    --bg: #0b0f0c;
    --term: #0f1412;
    --term-border: #00FF41;
    --term-header: #0d110f;
    --green: #39FF14;
    --text: #d8ffe1;
    --muted: #93ffb0;
    --danger: #ff4d4d;
    --focus: #24f38d;
    --btn-bg: #102019;
    --btn-bg-hover: #12271f;
    --input-bg: #0e1613;
    --input-border: #1b3b2f;
    --shadow: 0 10px 30px rgba(0,255,65,0.08), inset 0 0 0 1px rgba(0,255,65,0.15);
  }
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Press Start 2P', cursive; }
  .page { position: relative; height: 100%; display: grid; place-items: center; overflow: hidden; }
  .matrix-bg { position: absolute; inset: 0; z-index: 0; opacity: 0.18; }
  .terminal { position: relative; z-index: 1; width: min(92vw, 560px); background: var(--term); border: 1px solid var(--term-border); box-shadow: var(--shadow); border-radius: 12px; overflow: hidden; }
  .term-header { height: 38px; background: var(--term-header); display: flex; align-items: center; gap: 10px; padding: 0 12px; border-bottom: 1px solid var(--term-border); }
  .dots { display: flex; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px rgba(0,255,65,0.6); opacity: 0.9; }
  .term-title { font-size: 10px; color: var(--muted); margin-left: auto; letter-spacing: 0.06em; }
  .term-body { padding: 20px 22px; display: grid; gap: 16px; }
  .prompt { color: var(--muted); font-size: 10px; letter-spacing: 0.06em; }
  label { display: block; font-size: 10px; color: var(--muted); margin: 12px 0 8px; }
  .field { position: relative; display: flex; align-items: center; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 8px; }
  input { width: 100%; padding: 12px 14px; border: none; outline: none; background: transparent; color: var(--text); font-family: inherit; font-size: 12px; letter-spacing: 0.06em; }
  .toggle { position: absolute; right: 10px; font-size: 10px; color: var(--muted); cursor: pointer; user-select: none; }
  .actions { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 12px; }
  .btn { appearance: none; border: 1px solid var(--green); color: var(--bg); background: var(--green); font-family: 'Press Start 2P', cursive; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 12px 14px; border-radius: 10px; cursor: pointer; transition: transform .08s ease, box-shadow .12s ease, background .15s ease, color .15s ease; }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(36,243,141,0.18); }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .hint { color: var(--muted); font-size: 8px; }
  .error { color: var(--danger); font-size: 10px; margin-top: 8px; }
  .logline { color: var(--muted); font-size: 10px; margin-top: 8px; min-height: 12px; }
  @media (max-width: 420px) {
    .term-body { padding: 16px; }
    .term-title { display: none; }
  }
`;

function useMatrix(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const context: CanvasRenderingContext2D = ctx;

    let animationFrame = 0;

    function sizeCanvas(target: HTMLCanvasElement) {
      const dpr = window.devicePixelRatio || 1;
      target.width = Math.floor(window.innerWidth * dpr);
      target.height = Math.floor(window.innerHeight * dpr);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    }

    sizeCanvas(c);

    const fontSize = 16;
    const columns = () => Math.floor(window.innerWidth / fontSize) + 1;
    let drops: number[] = Array(columns()).fill(0);

    const characters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロゴゾドボポ0123456789abcdefghijklmnopqrstuvwxyz";

    function draw() {
      context.fillStyle = "rgba(11, 15, 12, 0.18)";
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const cssGreen = getComputedStyle(document.documentElement).getPropertyValue("--green").trim() || "#24f38d";
      context.fillStyle = cssGreen;
      context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;

      drops.forEach((y, i) => {
        const ch = characters[Math.floor(Math.random() * characters.length)];
        const x = i * fontSize;
        context.fillText(ch, x, y * fontSize);
        if (y * fontSize > window.innerHeight && Math.random() > 0.975) drops[i] = 0; else drops[i] = y + 1;
      });

      animationFrame = requestAnimationFrame(draw);
    }

    function handleResize() {
      cancelAnimationFrame(animationFrame);
      sizeCanvas(c);
      drops = Array(columns()).fill(0);
      animationFrame = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", handleResize);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef]);
}

type LoginProps = {
  to?: string; // destination after successful login
};

export default function LoginPage({ to = "/Files" }: LoginProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useMatrix(canvasRef);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [log, setLog] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const VALID_USER = "OAK";
  const VALID_PASS = "NEW-DAY";
  const norm = (v: string) => (v || "").trim().toUpperCase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setLog("> AUTH // checking credentials …");
    await new Promise(r => setTimeout(r, 180));

    const ok = norm(username) === VALID_USER && norm(password) === VALID_PASS;

    if (ok) {
      setLog("> AUTH // success → redirecting /files");
      await new Promise(r => setTimeout(r, 120));
      navigate(to); // ONLY navigates after correct login
      return;
    }
    setBusy(false);
    setLog("> AUTH // failed");
    setError("Invalid credentials. Its wood and a new tomorrow, you know?");
  }

  return (
    <div className="page">
      <style>{STYLES}</style>
      <canvas ref={canvasRef} className="matrix-bg" />

      <div className="terminal" role="region" aria-label="Login terminal">
        <div className="term-header">
          <div className="dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="term-title">secure console</div>
        </div>

        <div className="term-body">
          <div className="prompt">ACCESS REQUIRED ~ enter credentials</div>

          <form onSubmit={onSubmit}>
            <div>
              <label htmlFor="user">Username</label>
              <div className="field">
                <input
                  id="user"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pass">Password</label>
              <div className="field">
                <input
                  id="pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
                <span
                  className="toggle"
                  onClick={() => setShowPassword(v => !v)}
                  role="button"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </span>
              </div>
            </div>

            {error && <div className="error" role="alert">{error}</div>}

            <div className="actions">
              <div className="hint">Hey, you remember the key 2 and key 3?</div>
              <button className="btn" type="submit" disabled={!username || !password || busy}>
                {busy ? "Authorizing…" : "Login"}
              </button>
            </div>

            <div className="logline" aria-live="polite">{log}</div>
          </form>
        </div>
      </div>
    </div>
  );
}
