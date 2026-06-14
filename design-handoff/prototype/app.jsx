/* ============================================================
   App — state, routing, mutations, tweaks
   ============================================================ */
const { Sidebar, ProjectTabs, Toolbar, QuickCapture, Section, BulkActionBar } = window.MainScreens;
const { Board, InboxView, ProjectForm, Login } = window.OtherScreens;
const { Overview, ProjectsTable } = window.OverviewScreens;
const { GlobalSearch, WorkspaceForm, SettingsView, genTail } = window.AppScreens;
const DetailPanel = window.DetailPanel;
const D = window.PMData;
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3FB984",
  "font": "Figtree",
  "radius": 1,
  "shadow": 1
}/*EDITMODE-END*/;

const FONT_STACK = {
  "Figtree": '"Figtree", ui-sans-serif, system-ui, sans-serif',
  "Hanken Grotesk": '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif',
  "Onest": '"Onest", ui-sans-serif, system-ui, sans-serif',
  "System": 'ui-sans-serif, system-ui, -apple-system, sans-serif',
};
const DENSITY = {
  compact: { pad: "5px", scale: 0.96 },
  regular: { pad: "9px", scale: 1 },
  comfy:   { pad: "14px", scale: 1.05 },
};

let _newId = 1000;

function ColResizer({ setWidth }) {
  const startDrag = (e) => {
    e.preventDefault();
    const app = e.currentTarget.parentElement;
    app.setAttribute("data-resizing", "");
    const left = app.getBoundingClientRect().left;
    const onMove = (ev) => {
      setWidth(Math.min(440, Math.max(180, ev.clientX - left)));
    };
    const onUp = () => {
      app.removeAttribute("data-resizing");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return <div className="col-resizer" onMouseDown={startDrag} title="Drag to resize" />;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [locked, setLocked] = useState(true);
  const [sidebarW, setSidebarW] = useState(() => {
    const v = parseInt(localStorage.getItem("wb-sidebar-w"), 10);
    return v >= 180 && v <= 440 ? v : 256;
  });
  useEffect(() => { localStorage.setItem("wb-sidebar-w", String(sidebarW)); }, [sidebarW]);
  const [tasks, setTasks] = useState(() => D.TASKS.map(x => ({ ...x, activity: x.activity.map(a => ({ ...a })) })));
  const [projects, setProjects] = useState(() => D.PROJECTS.map(p => ({ ...p, tags: [...(p.tags || [])] })));
  const [modules, setModules] = useState(() => D.MODULES.map(m => ({ ...m })));
  const [milestones, setMilestones] = useState(() => D.MILESTONES.map(m => ({ ...m })));
  const [view, setView] = useState({ type: "project", projectId: "disk", tab: "issues" });
  const [selectedId, setSelectedId] = useState(null);
  const [groupBy, setGroupBy] = useState("module");
  const [subGroupBy, setSubGroupBy] = useState("none");
  const [filters, setFilters] = useState({ status: [], priority: [], hideDone: false });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showWsForm, setShowWsForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  /* workspaces */
  const [workspaces, setWorkspaces] = useState(() => D.WORKSPACES.map(w => ({ ...w })));
  const [activeWs, setActiveWs] = useState(D.WORKSPACES[0].id);
  const [settingsSection, setSettingsSection] = useState("api");
  /* API keys (App Settings) */
  const [apiKeys, setApiKeys] = useState(() => D.API_KEYS.map(k => ({ ...k })));
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const lastSelRef = useRef(null);
  const clearSelection = useCallback(() => { setSelectedIds(new Set()); lastSelRef.current = null; }, []);

  /* keyboard: c = quick capture, ⌘K / ctrl-K = global search */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(s => !s);
        return;
      }
      if (locked) return;
      const typing = /input|textarea/i.test(e.target.tagName) || e.target.isContentEditable;
      if (e.key === "c" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.__focusQuickCapture && window.__focusQuickCapture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked]);

  /* workspace ops */
  const addWorkspace = useCallback((ws) => {
    const id = "ws" + (_newId++);
    setWorkspaces(list => [...list, { id, ...ws }]);
    setActiveWs(id);
  }, []);
  const renameWorkspace = useCallback((name, tagline) => {
    setWorkspaces(list => list.map(w => w.id === activeWs
      ? { ...w, name: name !== undefined ? name : w.name, ...(tagline !== undefined ? { tagline } : {}) } : w));
  }, [activeWs]);
  const setWorkspaceEmoji = useCallback((emoji) => {
    setWorkspaces(list => list.map(w => w.id === activeWs ? { ...w, emoji } : w));
  }, [activeWs]);

  /* API key ops */
  const keyOps = useMemo(() => ({
    add: (name, scope) => {
      const tail = genTail();
      const full = tail + genTail() + genTail() + genTail() + genTail() + genTail();
      setApiKeys(ks => [{ id: "ak" + (_newId++), name, prefix: "wb_live_", tail, full, scope,
        created: "2026-06-14", lastUsed: "" }, ...ks]);
    },
    revoke: (id) => setApiKeys(ks => ks.filter(k => k.id !== id)),
  }), []);

  /* mutations */
  const update = useCallback((id, patch) => {
    setTasks(ts => ts.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);
  const toggle = useCallback((id) => {
    setTasks(ts => ts.map(x => x.id === id ? { ...x, done: !x.done, status: !x.done ? "done" : "todo" } : x));
  }, []);
  const addComment = useCallback((id, body) => {
    const day = new Date("2026-06-13").toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    setTasks(ts => ts.map(x => x.id === id
      ? { ...x, activity: [...x.activity, { id: "c" + (_newId++), day, body, source: "web" }] } : x));
  }, []);
  const removeTask = useCallback((id) => {
    setTasks(ts => ts.filter(x => x.id !== id));
    setSelectedId(s => s === id ? null : s);
  }, []);
  const assign = useCallback((id, projectId) => {
    update(id, { projectId, status: "backlog" });
  }, [update]);

  /* project / module / milestone editing (Overview tab) */
  const updateProject = useCallback((id, patch) => {
    setProjects(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);
  const modOps = useMemo(() => ({
    add: (projectId) => setModules(ms => [...ms, { id: "mod" + (_newId++), projectId, name: "New module", color: "#6E8BFF" }]),
    patch: (id, patch) => setModules(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m)),
    remove: (id) => setModules(ms => ms.filter(m => m.id !== id)),
  }), []);
  const mileOps = useMemo(() => ({
    add: (projectId) => setMilestones(ms => [...ms, { id: "mile" + (_newId++), projectId, name: "New milestone", date: "", state: "planned" }]),
    patch: (id, patch) => setMilestones(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m)),
    remove: (id) => setMilestones(ms => ms.filter(m => m.id !== id)),
  }), []);

  /* bulk mutations on the current selection */
  const bulkUpdate = useCallback((patch) => {
    setTasks(ts => ts.map(x => selectedIds.has(x.id) ? { ...x, ...patch } : x));
  }, [selectedIds]);
  const bulkSetStatus = useCallback((status) => {
    bulkUpdate({ status, done: status === "done" });
  }, [bulkUpdate]);
  const bulkMarkDone = useCallback(() => {
    bulkUpdate({ done: true, status: "done" });
  }, [bulkUpdate]);
  const bulkDelete = useCallback(() => {
    setTasks(ts => ts.filter(x => !selectedIds.has(x.id)));
    setSelectedId(s => (s && selectedIds.has(s)) ? null : s);
    clearSelection();
  }, [selectedIds, clearSelection]);

  const addTask = useCallback((title, axis) => {
    const id = "n" + (_newId++);
    setTasks(ts => {
      if (view.type === "inbox") {
        return [...ts, mkTask(id, { title, projectId: null, status: "inbox", ref: nextRef("INBOX", ts) })];
      }
      const projectId = view.projectId;
      const projKey = projects.find(p => p.id === projectId).key;
      const patch = { title, projectId, status: "todo", ref: nextRef(projKey, ts) };
      if (view.type === "board") patch.status = (typeof axis === "string" && axis) || "todo";
      else if (axis && typeof axis === "object") Object.assign(patch, axis);
      return [...ts, mkTask(id, patch)];
    });
  }, [view, projects]);

  const selected = tasks.find(x => x.id === selectedId) || null;

  /* root styles from tweaks */
  const dens = DENSITY.regular;
  const rootStyle = {
    "--accent": t.accent,
    "--font-ui": FONT_STACK[t.font] || FONT_STACK.Figtree,
    "--radius-scale": t.radius,
    "--shadow-strength": t.shadow,
    "--row-pad-y": dens.pad,
    "--ui-scale": dens.scale,
    "--sidebar-w": sidebarW + "px",
  };

  /* Font + radius are consumed at :root (body font-family, derived --r-* radii),
     so inline vars on .app never reach them — push them onto documentElement. */
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(rootStyle)) root.style.setProperty(k, v);
    root.setAttribute("data-theme", "light");
  });

  if (locked) {
    return (
      <div style={{ ...rootStyle, height: "100%" }} data-theme="light">
        <Login onUnlock={() => setLocked(false)} />
        <TweaksUI t={t} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div className="app" style={rootStyle} data-theme="light" data-detail={selected ? "" : undefined}>
      <Sidebar view={view} setView={(v) => { setView(v); clearSelection(); }} tasks={tasks} projects={projects}
        onNewProject={() => setShowProjectForm(true)}
        workspaces={workspaces} activeWs={activeWs}
        onSwitchWs={setActiveWs} onAddWs={() => setShowWsForm(true)}
        onWsSettings={() => { setSettingsSection("general"); setView({ type: "settings" }); clearSelection(); }}
        onOpenSearch={() => setShowSearch(true)}
        onOpenSettings={() => { setSettingsSection("api"); setView({ type: "settings" }); clearSelection(); }} />
      <ColResizer setWidth={setSidebarW} />

      <div className="main-col">
        <MainContent view={view} setView={setView} tasks={tasks} projects={projects}
          modules={modules} milestones={milestones}
          groupBy={groupBy} setGroupBy={setGroupBy}
          subGroupBy={subGroupBy} setSubGroupBy={setSubGroupBy}
          filters={filters} setFilters={setFilters}
          onSelect={setSelectedId} selectedId={selectedId}
          onToggle={toggle} onAdd={addTask} onUpdate={update} onAssign={assign}
          onUpdateProject={updateProject} modOps={modOps} mileOps={mileOps}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds} lastSelRef={lastSelRef}
          workspaces={workspaces} activeWs={activeWs}
          settingsSection={settingsSection} setSettingsSection={setSettingsSection}
          apiKeys={apiKeys} keyOps={keyOps}
          onRenameWs={renameWorkspace} onSetWsEmoji={setWorkspaceEmoji} />
      </div>

      {selected && <DetailPanel task={selected}
        projectModules={modules.filter(m => m.projectId === selected.projectId)}
        projectMilestones={milestones.filter(m => m.projectId === selected.projectId)}
        onClose={() => setSelectedId(null)}
        onUpdate={(patch) => update(selected.id, patch)}
        onAddComment={(body) => addComment(selected.id, body)}
        onDelete={removeTask} />}

      {showProjectForm && <ProjectForm onClose={() => setShowProjectForm(false)} />}
      {showWsForm && <WorkspaceForm onClose={() => setShowWsForm(false)} onCreate={addWorkspace} />}
      {showSearch && <GlobalSearch projects={projects} tasks={tasks}
        onClose={() => setShowSearch(false)}
        onNavigate={(r) => {
          if (r.kind === "project") { setView({ type: "project", projectId: r.id, tab: "issues" }); clearSelection(); }
          else { const t = tasks.find(x => x.id === r.id);
            if (t) { if (t.projectId) setView({ type: "project", projectId: t.projectId, tab: "issues" }); else setView({ type: "inbox" }); setSelectedId(t.id); } }
        }} />}

      {selectedIds.size > 0 && <BulkActionBar count={selectedIds.size}
        onSetStatus={bulkSetStatus} onSetPriority={(p) => bulkUpdate({ priority: p })}
        onMarkDone={bulkMarkDone} onDelete={bulkDelete} onClear={clearSelection} />}

      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}

/* ------------ Main content router ------------ */
function MainContent({ view, setView, tasks, projects, modules, milestones, groupBy, setGroupBy, subGroupBy, setSubGroupBy, filters, setFilters, onSelect, selectedId, onToggle, onAdd, onUpdate, onAssign, onUpdateProject, modOps, mileOps, selectedIds, setSelectedIds, lastSelRef, workspaces, activeWs, settingsSection, setSettingsSection, apiKeys, keyOps, onRenameWs, onSetWsEmoji }) {
  if (view.type === "settings") {
    const ws = workspaces.find(w => w.id === activeWs) || workspaces[0];
    return (
      <SettingsView section={settingsSection} setSection={setSettingsSection}
        workspace={ws} onRenameWs={onRenameWs} onSetWsEmoji={onSetWsEmoji}
        apiKeys={apiKeys} keyOps={keyOps} />
    );
  }
  if (view.type === "inbox") {
    return (
      <>
        <TopBar title="Inbox" emoji="📥" subtitle="Capture now, sort later. No pressure." />
        <QuickCapture scope="inbox" onAdd={onAdd} />
        <InboxView tasks={tasks} onSelect={onSelect} onToggle={onToggle} onAssign={onAssign} />
      </>
    );
  }

  if (view.type === "all") {
    return (
      <>
        <TopBar title="All projects" emoji="🗂️" subtitle="Every project, grouped by status." />
        <ProjectsTable projects={projects} tasks={tasks}
          onOpen={(id) => setView({ type: "project", projectId: id, tab: "overview" })} />
      </>
    );
  }

  const proj = projects.find(p => p.id === view.projectId) || projects[0];
  const tab = view.tab || "issues";
  const setTab = (t) => setView({ ...view, type: "project", projectId: proj.id, tab: t });
  const pModules = modules.filter(m => m.projectId === proj.id);
  const pMiles = milestones.filter(m => m.projectId === proj.id);
  const topBar = <TopBar project={proj} onUpdateProject={onUpdateProject} editable />;

  if (tab === "overview") {
    return (
      <>
        {topBar}
        <ProjectTabs tab={tab} setTab={setTab} />
        <div className="scroll-body">
          <Overview project={proj} modules={pModules} milestones={pMiles} tasks={tasks}
            onUpdate={onUpdateProject} mod={modOps} mile={mileOps} />
        </div>
      </>
    );
  }
  if (tab === "board") {
    return (
      <>
        {topBar}
        <ProjectTabs tab={tab} setTab={setTab} />
        <Board tasks={tasks} projectId={proj.id} onSelect={onSelect} onUpdate={onUpdate} onAdd={onAdd} />
      </>
    );
  }

  /* issues tab — grouped task list */
  const availDims = computeAvailDims(proj.id, modules, milestones);
  const effPrimary = (groupBy === "none" || availDims.includes(groupBy)) ? groupBy : (availDims[0] || "status");
  const effSecondary = (subGroupBy !== "none" && subGroupBy !== effPrimary && availDims.includes(subGroupBy)) ? subGroupBy : "none";
  const activeDims = [effPrimary, effSecondary].filter(d => d !== "none");
  const sections = buildSections(tasks, proj.id, effPrimary, effSecondary, filters, modules, milestones);
  const anyTasks = sections.some(s => s.tasks.length > 0);
  const visibleSections = sections.filter(s => s.tasks.length > 0 || s.keep);
  const orderedIds = visibleSections.flatMap(s => (s.subs ? s.subs.flatMap(x => x.tasks) : s.tasks).map(t => t.id));
  const toggleSelect = (id, shift) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const anchor = lastSelRef.current;
      if (shift && anchor && orderedIds.includes(anchor)) {
        const a = orderedIds.indexOf(anchor), b = orderedIds.indexOf(id);
        const [lo, hi] = a < b ? [a, b] : [b, a];
        for (let i = lo; i <= hi; i++) next.add(orderedIds[i]);
      } else if (next.has(id)) { next.delete(id); }
      else { next.add(id); }
      return next;
    });
    lastSelRef.current = id;
  };
  const selectionActive = selectedIds.size > 0;
  const displayCtl = (
    <Toolbar groupBy={effPrimary} setGroupBy={setGroupBy} subGroupBy={effSecondary} setSubGroupBy={setSubGroupBy}
      availDims={availDims} filters={filters} setFilters={setFilters} />
  );
  return (
    <>
      {topBar}
      <ProjectTabs tab={tab} setTab={setTab} right={displayCtl} />
      <QuickCapture onAdd={onAdd} />
      <div className="scroll-body">
        {anyTasks ? visibleSections.map(s => (
          <Section key={s.id} id={s.id} name={s.name} color={s.color} icon={s.icon} target={s.target}
            tasks={s.tasks} subs={s.subs} patch={s.patch} activeDims={activeDims} selectedId={selectedId}
            onSelect={onSelect} onToggle={onToggle} onAdd={onAdd} defaultOpen={s.defaultOpen}
            selectedSet={selectedIds} onToggleSelect={toggleSelect} selectionActive={selectionActive} />
        )) : (
          <div className="empty">
            <div className="empty-emoji">🍃</div>
            <h3>Nothing here yet</h3>
            <p>{filters.status.length || filters.priority.length || filters.hideDone
              ? "No tasks match the current filters."
              : "Add your first task in the box above, or press c anywhere."}</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ------------ TopBar ------------ */
function TopBar({ project, title, emoji, subtitle, suffix, editable, onUpdateProject }) {
  const nameRef = useRef(null);
  if (project && editable) {
    return (
      <div className="topbar">
        <div className="topbar-title">
          <UI.EmojiPicker value={project.emoji} triggerClass="topbar-emoji-btn"
            onPick={(e) => onUpdateProject(project.id, { emoji: e })} />
          <input ref={nameRef} className="topbar-name-input" value={project.name}
            onChange={(e) => onUpdateProject(project.id, { name: e.target.value })}
            spellCheck={false} />
          <span className="topbar-key">{project.key}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="topbar">
      <div className="topbar-title">
        <span className="topbar-emoji">{project ? project.emoji : emoji}</span>
        <h1>{project ? project.name : title}</h1>
        {project && <span className="topbar-key">{project.key}</span>}
        {suffix && <span className="section-count" style={{ marginLeft: 4 }}>· {suffix}</span>}
      </div>
    </div>
  );
}

/* ------------ helpers ------------ */
function mkTask(id, patch) {
  return {
    id, ref: patch.ref || id, projectId: null, title: "Untitled", status: "todo", priority: "none",
    moduleId: null, milestoneId: null, due: null, done: false, statusNote: "", description: "",
    activity: [], created: 9999, ...patch,
  };
}
function nextRef(key, ts) {
  const n = ts.filter(x => x.ref && x.ref.startsWith(key + "-")).length + 1;
  return `${key}-${n}`;
}

/* ------------ grouping engine ------------ */
/* Which group-by dimensions actually have data for this project.
   Status & Priority always exist; Module / Milestone only if the project defines them. */
function computeAvailDims(projectId, modules, milestones) {
  const dims = [];
  if (modules.some(m => m.projectId === projectId)) dims.push("module");
  if (milestones.some(m => m.projectId === projectId)) dims.push("milestone");
  dims.push("status", "priority");
  return dims;
}

/* A dimension expands into an ordered list of buckets.
   Each bucket knows how to MATCH a task and what PATCH to apply when a task is created inside it. */
function groupSpec(dim, projectId, modules, milestones) {
  if (dim === "module") {
    const mods = modules.filter(m => m.projectId === projectId);
    const g = mods.map(m => ({ key: m.id, name: m.name, color: m.color, defaultOpen: true,
      match: t => t.moduleId === m.id, patch: { moduleId: m.id } }));
    g.push({ key: "__nomod", name: "No module", icon: <Ic.cube size={15} />, keep: true, defaultOpen: true,
      match: t => !t.moduleId, patch: { moduleId: null } });
    return g;
  }
  if (dim === "milestone") {
    const miles = milestones.filter(m => m.projectId === projectId);
    const g = miles.map(m => ({ key: m.id, name: m.name, icon: <Ic.target size={15} />, target: m.date,
      defaultOpen: m.state !== "done", match: t => t.milestoneId === m.id, patch: { milestoneId: m.id } }));
    g.push({ key: "__nomile", name: "No milestone", icon: <Ic.target size={15} />, keep: true, defaultOpen: true,
      match: t => !t.milestoneId, patch: { milestoneId: null } });
    return g;
  }
  if (dim === "status") {
    return D.STATUSES.filter(s => s.id !== "inbox").map(s => ({
      key: s.id, name: s.label, color: `var(--st-${s.key})`, defaultOpen: s.id !== "done" && s.id !== "cancelled",
      match: t => t.status === s.id, patch: { status: s.id } }));
  }
  if (dim === "priority") {
    return D.PRIORITIES.slice().reverse().map(p => ({
      key: p.id, name: p.label, icon: <Ic.flag size={15} />, defaultOpen: true,
      match: t => t.priority === p.id, patch: { priority: p.id } }));
  }
  return null; /* "none" */
}

function buildSections(tasks, projectId, primary, secondary, filters, modules, milestones) {
  const pass = (t) => {
    if (filters.status.length && !filters.status.includes(t.status)) return false;
    if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
    if (filters.hideDone && (t.done || t.status === "cancelled")) return false;
    return true;
  };
  const ptasks = tasks.filter(t => t.projectId === projectId && pass(t));
  const order = (t) => (D.PRIORITY_MAP[t.priority]?.rank || 0);
  const sortFn = (a, b) => (a.done - b.done) || (order(b) - order(a)) || (a.created - b.created);

  const primGroups = groupSpec(primary, projectId, modules, milestones);

  /* "Group by: None" → one flat, header-less list */
  if (!primGroups) {
    return [{ id: "__all", patch: {}, defaultOpen: true, keep: true, tasks: ptasks.slice().sort(sortFn) }];
  }

  const subDim = (secondary && secondary !== "none" && secondary !== primary) ? secondary : null;

  return primGroups.map(g => {
    const groupTasks = ptasks.filter(g.match).sort(sortFn);
    const sec = {
      id: g.key, name: g.name, color: g.color, icon: g.icon, target: g.target,
      defaultOpen: g.defaultOpen, keep: g.keep, patch: g.patch || {}, tasks: groupTasks,
    };
    if (subDim) {
      const subGroups = groupSpec(subDim, projectId, modules, milestones);
      sec.subs = subGroups
        .map(sg => ({
          id: g.key + "::" + sg.key, name: sg.name, color: sg.color, icon: sg.icon, target: sg.target,
          defaultOpen: true, patch: { ...(g.patch || {}), ...(sg.patch || {}) },
          tasks: groupTasks.filter(sg.match),
        }))
        .filter(s => s.tasks.length > 0);
    }
    return sec;
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
