/* ============================================================
   Detail Panel — slide-in. Status Note (elevated) vs Activity.
   ============================================================ */
const { useState, useEffect, useRef } = React;
const { STATUS_MAP: DP_STATUS, PRIORITY_MAP: DP_PRIO, MODULE_MAP: DP_MOD, MILESTONE_MAP: DP_MILE } = window.PMData;
const { STATUSES, PRIORITIES } = window.PMData;
const { Popover, OptionList, PriorityBars } = window.UI;

/* auto-growing textarea */
function autoGrow(el) { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }

function PropPopover({ label, current, children, empty }) {
  return (
    <Popover width={210} trigger={
      <button className="prop-control" data-empty={empty ? "" : undefined}>
        {current}<Ic.chevDown size={14} style={{ color: "var(--text-faint)" }} />
      </button>
    }>{children}</Popover>
  );
}

function DetailPanel({ task, projectModules, projectMilestones, onClose, onUpdate, onAddComment, onDelete }) {
  const [comment, setComment] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const titleRef = useRef(null);
  const descRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !document.querySelector(".popover")) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => { autoGrow(titleRef.current); }, [task.id]);
  useEffect(() => { setConfirmDel(false); setEditingDesc(false); }, [task.id]);

  const st = DP_STATUS[task.status];
  const pr = DP_PRIO[task.priority];
  const mod = task.moduleId ? DP_MOD[task.moduleId] : null;
  const mile = task.milestoneId ? DP_MILE[task.milestoneId] : null;
  const blocked = task.status === "blocked";

  const dueQuick = [
    { id: "2026-06-13", label: "Today" },
    { id: "2026-06-14", label: "Tomorrow" },
    { id: "2026-06-20", label: "Next week" },
    { id: "2026-06-30", label: "End of month" },
  ];

  return (
    <>
      <aside className="detail-panel" data-screen-label={`detail ${task.ref}`} role="complementary" aria-label="Task details">
        <div className="dp-head">
          <UI.RefTag value={task.ref} big />
          <div className="spacer" />
          <button className="icon-btn" title="Copy link"
            onClick={() => navigator.clipboard?.writeText(task.ref).catch(() => {})}><Ic.copy size={17} /></button>
          <button className="icon-btn" title="Close (Esc)" onClick={onClose}><Ic.close size={18} /></button>
        </div>

        <div className="dp-body">
          {/* title */}
          <div className="dp-check-title">
            <div style={{ paddingTop: 4 }}>
              <UI.CircleCheck done={task.done} status={task.status} size={22}
                onToggle={() => onUpdate({ done: !task.done, status: !task.done ? "done" : "todo" })} />
            </div>
            <textarea ref={titleRef} className="dp-title-input" rows={1} value={task.title}
              onChange={e => { onUpdate({ title: e.target.value }); autoGrow(e.target); }}
              onInput={e => autoGrow(e.target)} />
          </div>

          {/* STATUS NOTE — elevated, single-line current state, overwritten */}
          <div className="status-note" data-blocked={blocked ? "" : undefined}>
            <div className="status-note-label">
              {blocked ? <Ic.bolt size={13} /> : <Ic.sparkle size={13} />}
              {blocked ? "What's blocking this?" : "Current state · what's the status?"}
            </div>
            <textarea rows={1} value={task.statusNote}
              placeholder="One line — where this stands right now (overwrites; always visible)"
              onChange={e => { onUpdate({ statusNote: e.target.value }); autoGrow(e.target); }}
              ref={el => autoGrow(el)} />
          </div>

          {/* PROPERTIES */}
          <div className="prop-grid">
            <div className="prop-label">Status</div>
            <div className="prop-val">
              <PropPopover current={<><span className="dot" style={{ background: `var(--st-${st.key})` }} /> {st.label}</>}>
                {(close) => <OptionList options={STATUSES} value={task.status}
                  onPick={id => { onUpdate({ status: id, done: id === "done" }); close(); }}
                  renderOpt={o => <><span className="dot" style={{ background: `var(--st-${o.key})` }} /> {o.label}</>} />}
              </PropPopover>
            </div>

            <div className="prop-label">Priority</div>
            <div className="prop-val">
              <PropPopover current={<><PriorityBars priority={task.priority} /> {pr.label}</>}>
                {(close) => <OptionList options={PRIORITIES.slice().reverse()} value={task.priority}
                  onPick={id => { onUpdate({ priority: id }); close(); }}
                  renderOpt={o => <><PriorityBars priority={o.id} /> {o.label}</>} />}
              </PropPopover>
            </div>

            <div className="prop-label">Module</div>
            <div className="prop-val">
              <PropPopover empty={!mod}
                current={mod ? <><span className="dot" style={{ background: mod.color }} /> {mod.name}</> : "Set module"}>
                {(close) => <OptionList
                  options={[{ id: "__none", label: "No module", key: "none" }, ...projectModules]}
                  value={task.moduleId || "__none"}
                  onPick={id => { onUpdate({ moduleId: id === "__none" ? null : id }); close(); }}
                  renderOpt={o => o.id === "__none" ? <span style={{ color: "var(--text-faint)" }}>No module</span>
                    : <><span className="dot" style={{ background: o.color }} /> {o.name}</>} />}
              </PropPopover>
            </div>

            <div className="prop-label">Milestone</div>
            <div className="prop-val">
              <PropPopover empty={!mile}
                current={mile ? <><Ic.target size={13} /> {mile.name.split(" · ")[0]}</> : "Set milestone"}>
                {(close) => <OptionList
                  options={[{ id: "__none", label: "No milestone" }, ...projectMilestones]}
                  value={task.milestoneId || "__none"}
                  onPick={id => { onUpdate({ milestoneId: id === "__none" ? null : id }); close(); }}
                  renderOpt={o => o.id === "__none" ? <span style={{ color: "var(--text-faint)" }}>No milestone</span>
                    : <><Ic.target size={13} /> {o.name}</>} />}
              </PropPopover>
            </div>

            <div className="prop-label">Due date</div>
            <div className="prop-val">
              <PropPopover empty={!task.due}
                current={task.due ? <><Ic.calendar size={13} /> {UI.fmtDate(task.due, { month: "short", day: "numeric", year: "numeric" })}</> : "Set date"}>
                {(close) => (
                  <div className="opt-list">
                    {dueQuick.map(d => (
                      <button key={d.id} className="opt" onClick={() => { onUpdate({ due: d.id }); close(); }}>
                        <Ic.calendar size={14} /> {d.label}
                        <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontSize: 12 }}>{UI.fmtDate(d.id)}</span>
                      </button>
                    ))}
                    {task.due && <button className="opt" style={{ color: "var(--st-blocked)" }}
                      onClick={() => { onUpdate({ due: null }); close(); }}><Ic.close size={14} /> Clear date</button>}
                  </div>
                )}
              </PropPopover>
            </div>
          </div>

          {/* DESCRIPTION */}
          <h4 className="dp-section-label">Description</h4>
          {editingDesc ? (
            <div className="dp-desc">
              <textarea ref={descRef} defaultValue={task.description} autoFocus
                placeholder="Write the details… (markdown)"
                onBlur={e => { onUpdate({ description: e.target.value }); setEditingDesc(false); }} />
            </div>
          ) : (
            <div className="dp-desc" data-empty={!task.description ? "" : undefined}
              onClick={() => setEditingDesc(true)}>
              {task.description || "Add a description…"}
            </div>
          )}

          {/* ACTIVITY — append-only log, distinct from status note */}
          <div className="activity">
            <h4 className="dp-section-label">Activity · your log</h4>
            {task.activity.length === 0 && (
              <div style={{ color: "var(--text-faint)", fontSize: 13, padding: "4px 0 8px" }}>
                No entries yet — jot what you tried, dead-ends, decisions.
              </div>
            )}
            {task.activity.map(a => (
              <div className="act-item" key={a.id}>
                <div className="act-day">{a.day}</div>
                <div className="act-body">
                  <div className="act-text">{a.body}
                    {a.source && a.source !== "web" && <span className="act-src" data-src={a.source}>{a.source}</span>}
                  </div>
                </div>
              </div>
            ))}
            <div className="comment-box">
              <textarea rows={1} value={comment} placeholder="Add to the log…"
                onChange={e => { setComment(e.target.value); autoGrow(e.target); }}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    if (comment.trim()) { onAddComment(comment.trim()); setComment(""); e.target.style.height = "auto"; }
                  }
                }} />
              <button className="comment-send" disabled={!comment.trim()}
                onClick={() => { if (comment.trim()) { onAddComment(comment.trim()); setComment(""); } }}>
                <Ic.arrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* delete */}
        <div className="dp-foot">
          {confirmDel ? (
            <div className="del-confirm">
              <span>Delete this task?</span>
              <button className="yes" onClick={() => onDelete(task.id)}>Delete</button>
              <button className="no" onClick={() => setConfirmDel(false)}>Cancel</button>
            </div>
          ) : (
            <button className="del-btn" onClick={() => setConfirmDel(true)}><Ic.trash size={15} /> Delete task</button>
          )}
        </div>
      </aside>
    </>
  );
}

window.DetailPanel = DetailPanel;
