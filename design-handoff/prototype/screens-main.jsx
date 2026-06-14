/* ============================================================
   Main screens — Sidebar, TopBar, Toolbar, QuickCapture, TaskList
   ============================================================ */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const { STATUSES, PRIORITIES, PROJECTS, MODULES, MILESTONES, MODULE_MAP, MILESTONE_MAP, PROJECT_STATUSES, PROJECT_STATUS_MAP } = window.PMData;
const { CircleCheck, StatusChip, PriorityBars, ModuleTag, MilestoneTag, DuePill, Progress, Popover, OptionList, fmtDate } = window.UI;

/* ---------------- Workspace switcher ---------------- */
function WorkspaceSwitcher({ workspaces, activeId, onSwitch, onAdd, onSettings }) {
  const active = workspaces.find(w => w.id === activeId) || workspaces[0];
  return (
    <Popover width={252} align="left" trigger={
      <button className="ws-switch" title="Switch workspace">
        <span className="ws-brand" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none"><rect x="9" y="9" width="82" height="82" rx="22" stroke="currentColor" strokeWidth="8" /><rect x="28.5" y="31" width="10.5" height="47" rx="5.25" fill="currentColor" /></svg>
        </span>
        <span className="ws-meta">
          <b>{active.name}</b>
          <small>{active.tagline}</small>
        </span>
        <span className="ws-caret"><Ic.chevUpDown size={15} /></span>
      </button>
    }>
      {(close) => (
        <div className="ws-pop">
          <div className="pop-label">Workspaces</div>
          {workspaces.map(w => (
            <button key={w.id} className="ws-opt" data-active={w.id === activeId ? "" : undefined}
              onClick={() => { onSwitch(w.id); close(); }}>
              <span className="ws-opt-text"><b>{w.name}</b><small>{w.tagline}</small></span>
              {w.id === activeId && <Ic.check size={15} sw={2.4} style={{ marginLeft: "auto", color: "var(--accent-ink)" }} />}
            </button>
          ))}
          <div className="ws-pop-divider" />
          <button className="ws-action" onClick={() => { onAdd(); close(); }}>
            <Ic.plusBox size={16} /> New workspace
          </button>
          <button className="ws-action" onClick={() => { onSettings(); close(); }}>
            <Ic.settings size={16} /> Workspace settings
          </button>
        </div>
      )}
    </Popover>
  );
}

/* ---------------- Sidebar ---------------- */
const SB_COLLAPSE_KEY = "wb-sb-collapsed";
function Sidebar({ view, setView, tasks, projects, onNewProject, workspaces, activeWs, onSwitchWs, onAddWs, onWsSettings, onOpenSearch, onOpenSettings }) {
  const inboxCount = tasks.filter(t => t.projectId === null && !t.done).length;
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SB_COLLAPSE_KEY) || "[]")); }
    catch { return new Set(); }
  });
  const toggleGroup = (id) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    localStorage.setItem(SB_COLLAPSE_KEY, JSON.stringify([...next]));
    return next;
  });
  const openCount = (p) => {
    const real = tasks.filter(t => t.projectId === p.id && t.status !== "inbox");
    return real.length ? real.filter(t => !t.done && t.status !== "cancelled").length : (p.issues || 0);
  };

  const ProjectRow = (p) => {
    const active = view.type === "project" && view.projectId === p.id;
    return (
      <button key={p.id} className="nav-item" data-active={active ? "" : undefined}
        onClick={() => setView({ type: "project", projectId: p.id, tab: view.tab || "issues" })}>
        <span className="nav-emoji">{p.emoji}</span>
        <span className="nav-label">{p.name}</span>
        <span className="nav-badge" data-muted="">{openCount(p)}</span>
      </button>
    );
  };

  const Group = ({ id, label, dot, icon, count, children }) => {
    const isOpen = !collapsed.has(id);
    return (
      <div className="sb-group">
        <button className="sb-grouplabel" data-collapsed={!isOpen ? "" : undefined} onClick={() => toggleGroup(id)}>
          <span className="sb-groupcaret"><Ic.chevD size={13} /></span>
          {dot && <span className="dot" style={{ background: dot }} />}
          {icon}
          <span className="sb-grouptxt">{label}</span>
          <span className="sb-groupcount">{count}</span>
        </button>
        {isOpen && <div className="sb-grouprows">{children}</div>}
      </div>
    );
  };

  const pinned = projects.filter(p => p.pinned);
  const rest = projects.filter(p => !p.pinned);

  return (
    <nav className="sidebar">
      <WorkspaceSwitcher workspaces={workspaces} activeId={activeWs}
        onSwitch={onSwitchWs} onAdd={onAddWs} onSettings={onWsSettings} />

      <button className="sb-search" onClick={onOpenSearch}>
        <Ic.search size={15} />
        <span>Search…</span>
        <kbd>⌘K</kbd>
      </button>

      <button className="nav-item" data-active={view.type === "inbox" ? "" : undefined}
        onClick={() => setView({ type: "inbox" })}>
        <span className="nav-icon"><Ic.inbox size={17} /></span>
        <span className="nav-label">Inbox</span>
        {inboxCount > 0 && <span className="nav-badge">{inboxCount}</span>}
      </button>

      <div className="sb-section">Projects
        <button title="New project" onClick={onNewProject}><Ic.plus size={15} /></button>
      </div>
      <div className="sb-scroll">
        {pinned.length > 0 && (
          <Group id="pinned" label="Pinned" icon={<Ic.pin size={11} />} count={pinned.length}>
            {pinned.map(ProjectRow)}
          </Group>
        )}
        {PROJECT_STATUSES.map(s => {
          const inGroup = rest.filter(p => p.status === s.id);
          if (!inGroup.length) return null;
          return (
            <Group key={s.id} id={s.id} label={s.label} dot={`var(--st-${s.key})`} count={inGroup.length}>
              {inGroup.map(ProjectRow)}
            </Group>
          );
        })}
        <button className="sb-viewall" data-active={view.type === "all" ? "" : undefined}
          onClick={() => setView({ type: "all" })}>
          <Ic.list size={15} /> View all projects
        </button>
      </div>

      <div className="sb-foot">
        <button className="sb-footbtn" data-active={view.type === "settings" ? "" : undefined}
          onClick={onOpenSettings}>
          <Ic.settings size={16} /> <span>App settings</span>
        </button>
      </div>
    </nav>
  );
}

/* ---------------- Toolbar (group / sub-group / filter / hide done) ---------------- */
/* Metadata for every group-by dimension. "none" is a valid choice at both levels. */
const DIM_META = {
  none:      { label: "None",      icon: () => <Ic.list size={14} /> },
  module:    { label: "Module",    icon: () => <Ic.cube size={14} /> },
  milestone: { label: "Milestone", icon: () => <Ic.target size={14} /> },
  status:    { label: "Status",    icon: () => <Ic.layers size={14} /> },
  priority:  { label: "Priority",  icon: () => <Ic.flag size={14} /> },
};

/* ---------------- Project view tabs (Overview / Issues / Board / +) ---------------- */
function ProjectTabs({ tab, setTab, right }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: <Ic.layers size={15} /> },
    { id: "issues",   label: "Issues",   icon: <Ic.list size={15} /> },
    { id: "board",    label: "Board",    icon: <Ic.board size={15} /> },
  ];
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className="tab" data-active={tab === t.id ? "" : undefined} onClick={() => setTab(t.id)}>
          {t.icon}<span>{t.label}</span>
        </button>
      ))}
      <button className="tab tab-add" title="Add a custom view (demo)" onClick={(e) => e.preventDefault()}>
        <Ic.plus size={15} />
      </button>
      {right && <div className="tabs-right">{right}</div>}
    </div>
  );
}

/* ---------------- Toolbar — one consolidated Display popover ---------------- */
function FilterChips({ items, selected, onToggle, dot }) {
  return (
    <div className="chip-pick">
      {items.map(it => {
        const on = selected.includes(it.id);
        return (
          <button key={it.id} className="fchip" data-on={on ? "" : undefined} onClick={() => onToggle(it.id)}>
            {dot ? <span className="dot" style={{ background: `var(--st-${it.key})` }} /> : <PriorityBars priority={it.id} />}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function SegPick({ opts, value, onPick }) {
  return (
    <div className="seg-wrap">
      {opts.map(id => (
        <button key={id} className="seg-btn" data-active={id === value ? "" : undefined} onClick={() => onPick(id)}>
          {DIM_META[id].icon()}<span>{DIM_META[id].label}</span>
        </button>
      ))}
    </div>
  );
}

function Toolbar({ groupBy, setGroupBy, subGroupBy, setSubGroupBy, availDims, filters, setFilters }) {
  const primaryOpts = ["none", ...availDims];
  const subOpts = ["none", ...availDims.filter(d => d !== groupBy)];
  const activeCount = (groupBy !== "none" ? 1 : 0) + (subGroupBy !== "none" ? 1 : 0)
    + filters.status.length + filters.priority.length + (filters.hideDone ? 1 : 0);
  const toggleIn = (key, id) => setFilters(f => ({
    ...f, [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id],
  }));
  return (
    <Popover width={312} align="right" trigger={
      <button className="tool-btn" data-on={activeCount ? "" : undefined}>
        <Ic.sliders size={14} /> Display{activeCount ? ` · ${activeCount}` : ""}
      </button>
    }>
        {() => (
          <div className="display-pop" onClick={e => e.stopPropagation()}>
            <div className="dp-block">
              <div className="dp-label">Group by</div>
              <SegPick opts={primaryOpts} value={groupBy}
                onPick={(id) => { setGroupBy(id); if (id === subGroupBy) setSubGroupBy("none"); }} />
            </div>
            {groupBy !== "none" && (
              <div className="dp-block">
                <div className="dp-label">Sub-group by</div>
                <SegPick opts={subOpts} value={subGroupBy} onPick={setSubGroupBy} />
              </div>
            )}
            <div className="dp-divider" />
            <div className="dp-block">
              <div className="dp-label">Filter · Status</div>
              <FilterChips dot items={STATUSES.filter(s => s.id !== "inbox")} selected={filters.status}
                onToggle={(id) => toggleIn("status", id)} />
            </div>
            <div className="dp-block">
              <div className="dp-label">Filter · Priority</div>
              <FilterChips items={PRIORITIES.slice().reverse()} selected={filters.priority}
                onToggle={(id) => toggleIn("priority", id)} />
            </div>
            <div className="dp-divider" />
            <button className="dp-toggle" onClick={() => setFilters(f => ({ ...f, hideDone: !f.hideDone }))}>
              <Ic.eyeOff size={14} /> <span>Hide done tasks</span>
              <span className="dp-switch" data-on={filters.hideDone ? "" : undefined} />
            </button>
            {activeCount > 0 && (
              <button className="dp-reset" onClick={() => {
                setGroupBy("none"); setSubGroupBy("none");
                setFilters({ status: [], priority: [], hideDone: false });
              }}>Reset all</button>
            )}
          </div>
        )}
      </Popover>
  );
}

/* ---------------- Quick Capture ---------------- */
function QuickCapture({ onAdd, scope }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    window.__focusQuickCapture = () => ref.current?.focus();
    return () => { delete window.__focusQuickCapture; };
  }, []);
  const submit = () => { const v = val.trim(); if (!v) return; onAdd(v); setVal(""); };
  return (
    <div className="qcap">
      <div className="qcap-inner">
        <span className="qcap-plus"><Ic.plus size={18} sw={2} /></span>
        <input ref={ref} value={val} placeholder={scope === "inbox" ? "Dump an idea into Inbox…" : "Add a task…  (it lands in this project)"}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }} />
        {!val && <span className="qcap-hint">c</span>}
      </div>
    </div>
  );
}

/* ---------------- Task Row ---------------- */
function TaskRow({ task, activeDims, selected, onSelect, onToggle, isChecked, onToggleSelect, selectionActive }) {
  const blocked = task.status === "blocked";
  const note = blocked && task.statusNote ? task.statusNote.replace(/^BLOCKED:\s*/i, "") : null;
  const dims = activeDims || [];
  const crossTags = [];
  if (!dims.includes("module") && task.moduleId) crossTags.push(<ModuleTag key="mod" moduleId={task.moduleId} faint />);
  if (!dims.includes("milestone") && task.milestoneId) crossTags.push(<MilestoneTag key="mile" milestoneId={task.milestoneId} />);
  const rowClick = (e) => {
    if (e.shiftKey && selectionActive && onToggleSelect) { e.preventDefault(); onToggleSelect(task.id, true); }
    else onSelect(task.id);
  };
  return (
    <div className="task-row" data-selected={selected ? "" : undefined}
      data-checked={isChecked ? "" : undefined} data-selmode={selectionActive ? "" : undefined}
      data-done={task.done ? "" : undefined} data-cancelled={task.status === "cancelled" ? "" : undefined}
      onClick={rowClick}>
      {onToggleSelect &&
        <button className="task-select" aria-pressed={isChecked} title={isChecked ? "Deselect" : "Select task"}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id, e.shiftKey); }}>
          {isChecked && <Ic.check size={11} sw={3} />}
        </button>}
      <CircleCheck done={task.done} status={task.status} onToggle={() => onToggle(task.id)} />
      <div className="task-main">
        <div className="task-line">
          <span className="task-title">{task.title}</span>
          <span className="task-ref">{task.ref}</span>
        </div>
        {note && <div className="task-note-2nd"><Ic.bolt size={12} /> <span>{note}</span></div>}
      </div>
      <div className="task-meta">
        {task.priority !== "none" && <PriorityBars priority={task.priority} />}
        {crossTags}
        <DuePill due={task.due} />
        <span className="task-reveal">
          <StatusChip status={task.status} size="sm" />
        </span>
      </div>
    </div>
  );
}

/* ---------------- Bulk action bar ---------------- */
function BulkActionBar({ count, onSetStatus, onSetPriority, onMarkDone, onDelete, onClear }) {
  return (
    <div className="bulkbar fade-in" onClick={(e) => e.stopPropagation()}>
      <span className="bulkbar-count"><b>{count}</b> selected</span>
      <span className="bulkbar-sep" />
      <Popover align="left" width={186} trigger={
        <button className="bulkbar-btn"><Ic.layers size={14} /> Status</button>
      }>
        {(close) => (
          <div className="opt-list">
            <div className="pop-label">Set status</div>
            {STATUSES.filter(s => s.id !== "inbox").map(s => (
              <button key={s.id} className="opt" onClick={() => { onSetStatus(s.id); close(); }}>
                <span className="dot" style={{ background: `var(--st-${s.key})` }} />{s.label}
              </button>
            ))}
          </div>
        )}
      </Popover>
      <Popover align="left" width={170} trigger={
        <button className="bulkbar-btn"><Ic.flag size={14} /> Priority</button>
      }>
        {(close) => (
          <div className="opt-list">
            <div className="pop-label">Set priority</div>
            {PRIORITIES.slice().reverse().map(p => (
              <button key={p.id} className="opt" onClick={() => { onSetPriority(p.id); close(); }}>
                <PriorityBars priority={p.id} /> {p.label}
              </button>
            ))}
          </div>
        )}
      </Popover>
      <button className="bulkbar-btn" onClick={onMarkDone}><Ic.check size={14} sw={2.2} /> Mark done</button>
      <button className="bulkbar-btn danger" onClick={onDelete}><Ic.trash size={14} /> Delete</button>
      <span className="bulkbar-sep" />
      <button className="bulkbar-x" onClick={onClear} title="Clear selection"><Ic.close size={15} /></button>
    </div>
  );
}

/* ---------------- Inline add-task row ---------------- */
function InlineAdd({ onAdd }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const submit = () => { const v = val.trim(); if (v) { onAdd(v); setVal(""); ref.current?.focus(); } };
  if (!editing) return (
    <div className="row-add" onClick={() => setEditing(true)}>
      <Ic.plus size={15} /> Add task
    </div>
  );
  return (
    <div className="row-add" style={{ color: "var(--text-strong)" }}>
      <Ic.plus size={15} />
      <input ref={ref} value={val} placeholder="Task name, Enter to add…"
        onChange={e => setVal(e.target.value)}
        onBlur={() => { if (!val.trim()) setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }} />
    </div>
  );
}

/* ---------------- Section ---------------- */
function Section({ id, name, color, icon, target, tasks, subs, patch, activeDims, defaultOpen, selectedId, onSelect, onToggle, onAdd, selectedSet, onToggleSelect, selectionActive }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  const flat = id === "__all";
  const all = subs ? subs.flatMap(s => s.tasks) : tasks;
  const total = all.length;
  const done = all.filter(t => t.done || t.status === "cancelled").length;
  const pct = total ? done / total : 0;

  const body = subs
    ? subs.map(sg => (
        <SubSection key={sg.id} {...sg} activeDims={activeDims} selectedId={selectedId}
          onSelect={onSelect} onToggle={onToggle} onAdd={onAdd}
          selectedSet={selectedSet} onToggleSelect={onToggleSelect} selectionActive={selectionActive} />
      ))
    : (
        <>
          {tasks.map(t => (
            <TaskRow key={t.id} task={t} activeDims={activeDims} selected={t.id === selectedId}
              onSelect={onSelect} onToggle={onToggle}
              isChecked={selectedSet ? selectedSet.has(t.id) : false}
              onToggleSelect={onToggleSelect} selectionActive={selectionActive} />
          ))}
          {onAdd && <InlineAdd onAdd={(title) => onAdd(title, patch)} />}
        </>
      );

  if (flat) return <div className="section">{body}</div>;

  return (
    <div className="section">
      <div className="section-head" onClick={() => setOpen(o => !o)}>
        <span className="section-caret" data-collapsed={!open ? "" : undefined}><Ic.chevD size={16} /></span>
        {color ? <span className="section-dot" style={{ background: color }} />
               : icon ? <span style={{ color: "var(--text-muted)", display: "grid" }}>{icon}</span> : null}
        <span className="section-name">{name}</span>
        <span className="section-count">{total}</span>
        {target && <span className="section-target"><Ic.calendar size={12} /> {fmtDate(target, { month: "short", day: "numeric", year: "numeric" })}</span>}
        {total > 0 && (
          <span className="section-prog">
            <span>{done} / {total} done</span>
            <Progress value={pct} width={88} tone={pct === 1 ? "done" : "accent"} />
          </span>
        )}
      </div>
      {open && <div>{body}</div>}
    </div>
  );
}

/* ---------------- Sub-section (second grouping level) ---------------- */
function SubSection({ id, name, color, icon, target, tasks, patch, activeDims, selectedId, onSelect, onToggle, onAdd, selectedSet, onToggleSelect, selectionActive }) {
  const [open, setOpen] = useState(true);
  const total = tasks.length;
  const done = tasks.filter(t => t.done || t.status === "cancelled").length;
  return (
    <div className="subsection">
      <div className="subsection-head" onClick={() => setOpen(o => !o)}>
        <span className="section-caret" data-collapsed={!open ? "" : undefined}><Ic.chevD size={14} /></span>
        {color ? <span className="section-dot sub" style={{ background: color }} />
               : icon ? <span className="subsection-icon">{icon}</span> : null}
        <span className="subsection-name">{name}</span>
        <span className="section-count">{total}</span>
        {target && <span className="section-target"><Ic.calendar size={11} /> {fmtDate(target, { month: "short", day: "numeric" })}</span>}
      </div>
      {open && (
        <div>
          {tasks.map(t => (
            <TaskRow key={t.id} task={t} activeDims={activeDims} selected={t.id === selectedId}
              onSelect={onSelect} onToggle={onToggle}
              isChecked={selectedSet ? selectedSet.has(t.id) : false}
              onToggleSelect={onToggleSelect} selectionActive={selectionActive} />
          ))}
          {onAdd && <InlineAdd onAdd={(title) => onAdd(title, patch)} />}
        </div>
      )}
    </div>
  );
}

window.MainScreens = { Sidebar, ProjectTabs, Toolbar, QuickCapture, TaskRow, Section, SubSection, InlineAdd, BulkActionBar };
