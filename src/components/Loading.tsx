import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


export default function CRTLoading({ to = "/Password", delayMs = 10000 }: { to?: string; delayMs?: number }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(Math.ceil(delayMs / 1000));
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000) as unknown as number;

    timeoutRef.current = window.setTimeout(() => {
      navigate(to, { replace: true });
    }, delayMs) as unknown as number;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delayMs, navigate, to]);

  return (
    <div className="crt-root" role="status" aria-live="polite">
      <style>{styles}</style>

      <div className="noise" aria-hidden="true" />
      <div className="overlay" aria-hidden="true" />

      <div className="terminal">
        <h1>
          Loading <span className="errorcode">…</span>
        </h1>

        <p className="output">Establishing secure uplink.</p>
        <p className="output">Decrypting channel. Aligning phase.</p>
        <p className="output">Remember the keys?</p>
        <p className="output">ETA: {remaining}s</p>

        <p className="output">
          <button className="skip" onClick={() => navigate(to, { replace: true })} aria-label="Skip loading and continue">
            [ Skip now ]
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css?family=Inconsolata');

html, body, #root, .crt-root { height: 100%; }
* { box-sizing: border-box; }

body { margin: 0; }

.crt-root {
  position: relative;
  height: 100%;
  background-color: #000000;
  background-image:
    radial-gradient(#11581E, #041607),
    url("https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif");
  background-repeat: no-repeat;
  background-size: cover;
  font-family: 'Inconsolata', Helvetica, sans-serif;
  color: rgba(128, 255, 128, 0.8);
  text-shadow:
    0 0 1ex rgba(51, 255, 51, 1),
    0 0 2px rgba(255, 255, 255, 0.8);
}

.noise {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-image: url("https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif");
  background-repeat: no-repeat;
  background-size: cover;
  z-index: -1;
  opacity: .02;
}

.overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      180deg,
      rgba(0, 0, 0, 0) 0,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(0, 0, 0, 0) 100%
    );
  background-size: auto 4px;
  z-index: 1;
}

.overlay::before {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    0deg,
    transparent 0%,
    rgba(32, 128, 32, 0.2) 2%,
    rgba(32, 128, 32, 0.8) 3%,
    rgba(32, 128, 32, 0.2) 3%,
    transparent 100%
  );
  background-repeat: no-repeat;
  animation: scan 7.5s linear infinite;
}

@keyframes scan {
  0% { background-position: 0 -100vh; }
  35%, 100% { background-position: 0 100vh; }
}

.terminal {
  position: absolute;
  inset: 0;
  padding: 4rem;
  text-transform: uppercase;
  display: grid;
  align-content: start;
  gap: 0.5rem;
}

.output {
  color: rgba(128, 255, 128, 0.8);
}
.output::before {
  content: "> ";
}

h1 { margin: 0 0 1rem 0; }
.errorcode { color: white; }

a, .skip {
  background: none;
  border: none;
  color: #fff;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}
a::before, .skip::before { content: "["; }
a::after, .skip::after { content: "]"; }
`;
