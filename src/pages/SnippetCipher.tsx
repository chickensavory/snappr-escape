import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
const EXPECTED = "center=true; padding=08; props<=1; text=forbidden;";
const ENCODED = "fhqwhu=wuxh; sddglqj=08; surtv<=1; whaw=iruelgghq;";

export default function SnippetCipherConsole() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [lines, setLines] = useState<string[]>(() => [
    'Initializing...<br/>',
    '<span class="green">0.0002ms ok!</span><br/>',
    '<span class="seperator">== == == == == == == == == == == == == == == == == ==</span></br>',
    '<span class="blue">Puzzle 2: Snippet Cipher (SNIPPET) — Earn KEY-2</span><br/>',
    '<span class="grey">Mechanic:</span> Decode the line (Caesar-shifted). Then enter the <em>exact</em> config string.<br/>',
    `<span class="grey">${ENCODED}</span><br/>`,
    '<span class="grey">Tip:</span> Symbols and numbers are fine; the <em>alphabet</em> is off.<br/>',
    '<span class="seperator">== == == == == == == == == == == == == == == == == ==</span></br>',
  ]);


  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const append = (html: string) => setLines(prev => [...prev, html]);

  const seperator = () =>
    append('<span class="seperator">== == == == == == == == == == == == == == == == == ==</span></br>');

  function printHelp() {
    const list = [
      'Help: List of available commands',
      '&gt;help',
      '&gt;hint',
      '&gt;run &lt;config&gt;',
      '&gt;clear',
      '&gt;exit',
      '',
      'Shortcut: paste the exact config and press Enter.',
    ];
    list.forEach(x => append(`<span>${x}</span><br/>`));
  }

function printHint(level: number) {
  if (level <= 0) return;
  if (level === 1)
    append('<span class="grey">HINT:</span> The syntax is sound. Only the alphabet seems... rotated.<br/>');
  else if (level === 2)
    append('<span class="grey">HINT:</span> The words look familiar, but they’ve slid a few steps sideways. Realign the frame.<br/>');
  else
    append('<span class="grey">HINT:</span> Shift each letter <em>backward by three</em> to restore the config. Spaces and punctuation must match.<br/>');
}

function hint() {
  setHintLevel(h => {
    const next = Math.min(h + 1, 3);
    if (next > h) setTimeout(() => printHint(next), 20);
    return next;
  });
}


  function clearConsole() {
    setLines([]);
    append('<span>clear</span></br>');
  }

  function successFlow() {
    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    append(`[${stamp}] RUN config…<br/>`);
    append('<span class="green">CONFIG ACCEPTED.</span><br/>');
    append('<span class="blue">KEY-2: OAK</span><br/>');
    append('“The table approves. It’s very judgmental.”<br/>');
    append('Next: “Check for clones.” → BOOKMARKS<br/>');
    seperator();
    append('<span class="grey">Returning to DM…</span>');
    sessionStorage.setItem('snippetSolved', '1');
    setTimeout(() => navigate('/BookmarksClonePuzzle', { replace: true }), 900);
  }

function rejectFlow() {
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  append(`[${stamp}] RUN config…<br/>`);
  append('<span class="red">CONFIG REJECTED.</span> Exact match required.<br/>');

  setFailCount(fc => fc + 1);
  setHintLevel(h => {
    const next = Math.min(h + 1, 3);
    if (next > h) setTimeout(() => printHint(next), 60);
    return next;
  });

  append('<br/>');
}


  function runValidation(candidate: string) {
    if (busy) return;
    setBusy(true);
    const valid = candidate === EXPECTED;
    setTimeout(() => {
      if (valid) successFlow();
      else rejectFlow();
      setBusy(false);
    }, 120);
  }

  function onEnter(inputVal: string) {
    const raw = inputVal.trim();
    if (!raw) return;

    if (raw === 'help') { printHelp(); }
    else if (raw === 'hint') { hint(); }
    else if (raw === 'clear') { clearConsole(); }
    else if (raw === 'exit') {
      append('<span class="blue">Goodbye! Comeback soon.</span>');
      setTimeout(() => navigate('/', { replace: true }), 300);
    }
    else if (raw.startsWith('run ')) {
      const cfg = raw.slice(4);
      runValidation(cfg);
    }
    else if (raw === 'run') {
      append('<span class="grey">Usage:</span> run &lt;config&gt;<br/>');
    }
    else if (raw === EXPECTED) {
      runValidation(raw);
    }
    else {
      append('<span>command not found</span></br>');
    }
  }

  return (
    <div className="console">
      <style>{styles}</style>

      <div className="output" ref={outputRef}>
        {lines.map((html, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </div>

      <div className="action">
        <span className="prompt">dev$</span>
        <textarea
          ref={inputRef}
          className="input"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onEnter(value);
              setValue('');
              e.preventDefault();
            }
          }}
          placeholder='type "help", or paste the config then Enter'
          aria-label="console input"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@keyframes ball{0%{top:50%;left:0%}20%{top:25%;left:25%}30%{top:50%;left:50%}40%{top:75%;left:75%}50%{top:50%;left:100%}60%{top:75%;left:75%}70%{top:50%;left:50%}80%{top:25%;left:25%}100%{top:50%;left:0%}}
@keyframes raketes{0%{transform:translateY(0)}20%{transform:translateY(10%)}25%{transform:translateY(-30%)}50%{transform:translateY(0)}60%{transform:translateY(25%)}80%{transform:translateY(-100%)}100%{transform:translateY(0)}}
@keyframes glitch{0%{color:#fff;transform:translateX(0) translateY(0%)}25%{color:#3498db;transform:translateX(1px) translateY(1px)}40%{color:#e74c3c;transform:translateX(-2px) translateY(-2px)}50%{color:#ccc;transform:translateX(0) translateY(0)}80%{color:#3498db;transform:translateX(2px) translateY(2px)}90%{color:#e74c3c;transform:translateX(-1px) translateY(-1px)}100%{color:#fff;transform:translateX(0) translateY(0)}}
@keyframes changeColor{0%{color:#ccc}25%{color:#2ecc71}50%{color:#e74c3c}75%{color:#3498db}100%{color:#ccc}}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Press Start 2P', cursive;
  background-color: #212121;
}
.console {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  padding: 10px;
  box-sizing: border-box;
}
.output {
  width: 100%;
  font-size: 12px;
  color: #cccccc;
  line-height: 20px;
  overflow-y: auto;
  height: calc(100% - 60px);
  padding-right: 6px;
}
.output .grey { color: #cccccc; }
.output .green { color: #2ecc71; }
.output .red { color: #e74c3c; }
.output .blue { color: #3498db; }
.output pre {
  font-size: 9px;
  animation: glitch 0.2s linear infinite;
  animation-play-state: paused;
}
.output pre:hover { animation-play-state: running; }
.action {
  width: 100%;
  font-size: 14px;
  margin-top: 10px;
}
.action .prompt {
  display: inline-block;
  width: 60px;
  color: white;
}
.action .input {
  width: calc(100% - 65px);
  background: none;
  border: none;
  color: white;
  padding: 0;
  margin: 0;
  resize: none;
  height: 24px;
}
.action .input:focus { outline: none; }
.seperator {
  font-size: 12px;
  animation: changeColor 10s ease-in-out infinite;
  display: inline-block;
}
`;