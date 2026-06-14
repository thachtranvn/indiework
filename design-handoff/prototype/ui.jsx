/* ============================================================
   UI primitives — chips, checkbox, popover, progress, etc.
   ============================================================ */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const { STATUS_MAP, PRIORITY_MAP, MODULE_MAP, MILESTONE_MAP } = window.PMData;

/* ---- circular checkbox (tick = done) ---- */
function CircleCheck({ done, status, onToggle, size = 18 }) {
  const cancelled = status === "cancelled";
  const inProgress = status === "in_progress" && !done;
  return (
    <button className="circle-check" onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
      data-done={done ? "" : undefined} data-cancelled={cancelled ? "" : undefined}
      data-status={!done && !cancelled ? status : undefined}
      style={{ width: size, height: size }}
      title={done ? "Mark not done" : "Mark done"} aria-pressed={done}>
      {done && <Ic.check size={size - 6} sw={2.6} />}
      {cancelled && !done && <Ic.close size={size - 8} sw={2.4} />}
      {inProgress && <span className="cc-pie" />}
    </button>
  );
}

/* ---- status chip ---- */
function StatusChip({ status, size = "md", showDot = true }) {
  const s = STATUS_MAP[status]; if (!s) return null;
  return (
    <span className={`chip st-chip ${size === "sm" ? "chip-sm" : ""}`} data-st={s.key}>
      {showDot && <span className="dot" style={{ background: `var(--st-${s.key})` }} />}
      {s.label}
    </span>
  );
}

/* ---- priority indicator: rising bars ---- */
function PriorityBars({ priority, showLabel = false }) {
  const p = PRIORITY_MAP[priority]; if (!p) return null;
  if (p.id === "none" && !showLabel) {
    return <span className="pri-bars" data-pri="none" title="No priority"><i/><i/><i/></span>;
  }
  return (
    <span className="pri-wrap" title={`Priority: ${p.label}`}>
      <span className="pri-bars" data-pri={p.key} style={{ "--n": p.rank }}>
        <i/><i/><i/>
      </span>
      {showLabel && <span className="pri-label" data-pri={p.key}>{p.label}</span>}
    </span>
  );
}

/* ---- module dot + name ---- */
function ModuleTag({ moduleId, faint }) {
  const m = MODULE_MAP[moduleId]; if (!m) return null;
  return (
    <span className="meta-tag" style={faint ? { color: "var(--text-muted)" } : null}>
      <span className="dot" style={{ background: m.color }} />{m.name}
    </span>
  );
}

/* ---- milestone tag ---- */
function MilestoneTag({ milestoneId }) {
  const m = MILESTONE_MAP[milestoneId]; if (!m) return null;
  const short = m.name.split(" · ")[0];
  return (
    <span className="meta-tag milestone-tag" title={m.name}>
      <Ic.target size={12} /> {short}
    </span>
  );
}

/* ---- due date pill ---- */
function fmtDate(d, opts) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", opts || { month: "short", day: "numeric" });
}
function dueState(d) {
  if (!d) return null;
  const today = new Date("2026-06-13T00:00:00");
  const date = new Date(d + "T00:00:00");
  const days = Math.round((date - today) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "later";
}
function DuePill({ due }) {
  if (!due) return null;
  const st = dueState(due);
  return (
    <span className="meta-tag due-pill" data-due={st}>
      <Ic.calendar size={12} /> {fmtDate(due)}
    </span>
  );
}

/* ---- progress bar ---- */
function Progress({ value, width = 56, tone = "accent" }) {
  return (
    <span className="progress" style={{ width }}>
      <span className="progress-fill" data-tone={tone}
            style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

/* ---- ref tag with copy ---- */
function RefTag({ value, big }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className={`ref-tag ${big ? "ref-big" : ""}`} title="Copy reference"
      onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1100); }}>
      {copied ? "Copied!" : value}
    </button>
  );
}

/* ---- generic popover anchored to a trigger ---- */
function Popover({ trigger, children, align = "left", width = 220 }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    let left = align === "right" ? r.right - width : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = r.bottom + 6;
    if (top + 300 > window.innerHeight) top = Math.max(8, r.top - 6 - 300);
    setPos({ left, top });
  }, [align, width]);

  useEffect(() => {
    if (!open) return;
    place();
    const onDoc = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    const onScroll = () => place();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onScroll);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  return (
    <>
      <span ref={btnRef} className="pop-trigger" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        {trigger}
      </span>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="popover fade-in" style={{ left: pos.left, top: pos.top, width }}
          onClick={(e) => e.stopPropagation()}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>,
        document.body
      )}
    </>
  );
}

/* ---- option list inside a popover ---- */
function OptionList({ options, value, onPick, renderOpt }) {
  return (
    <div className="opt-list">
      {options.map(o => (
        <button key={o.id} className="opt" data-active={o.id === value ? "" : undefined}
          onClick={() => onPick(o.id)}>
          {renderOpt ? renderOpt(o) : o.label}
          {o.id === value && <Ic.check size={15} sw={2.4} style={{ marginLeft: "auto", color: "var(--accent-ink)" }} />}
        </button>
      ))}
    </div>
  );
}

/* ---- tiny, safe-ish markdown → html (headings, bold, italic, code, lists, links) ---- */
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mdInline(s) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function mdToHtml(src) {
  const lines = (src || "").replace(/\r\n/g, "\n").split("\n");
  let html = "", inCode = false, inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      if (inCode) { html += "</code></pre>"; inCode = false; }
      else { closeList(); html += "<pre><code>"; inCode = true; }
      continue;
    }
    if (inCode) { html += escapeHtml(line) + "\n"; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { closeList(); html += `<h${h[1].length}>${mdInline(h[2])}</h${h[1].length}>`; continue; }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${mdInline(li[1])}</li>`; continue; }
    if (line.trim() === "") { closeList(); continue; }
    closeList();
    html += `<p>${mdInline(line)}</p>`;
  }
  if (inCode) html += "</code></pre>";
  closeList();
  return html;
}

/* ---- shared emoji picker (popover) ---- */
const EMOJI_SET = ["🧹","🪴","🚀","📦","🛠️","🎯","📚","🧪","🔭","🗂️","⚙️","🌱","🧊","🔥","💡","🪄",
  "✉️","📒","✨","🛢️","📡","🔁","🧱","🔍","📖","⏱️","🌿","🐢","🧭","🎨","🔐","📈"];
function EmojiPicker({ value, onPick, triggerClass = "emoji-trigger", title = "Change icon", width = 244 }) {
  return (
    <Popover width={width} align="left" trigger={
      <button className={triggerClass} title={title}>{value}</button>
    }>
      {(close) => (
        <div className="emoji-grid pop">
          {EMOJI_SET.map(e => (
            <button key={e} className="emoji-pick" data-on={e === value ? "" : undefined}
              onClick={() => { onPick(e); close(); }}>{e}</button>
          ))}
        </div>
      )}
    </Popover>
  );
}

window.UI = { CircleCheck, StatusChip, PriorityBars, ModuleTag, MilestoneTag, DuePill, Progress, RefTag, Popover, OptionList, EmojiPicker, EMOJI_SET, fmtDate, dueState, mdToHtml };
