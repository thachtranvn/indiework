# CLAUDE.md

## Project management (indiework.space)

This repo is tracked in **IndieWork** (indiework.space) — the project-management
tool. Its project **KEY is `IW`**, so task refs look like `IW-15`, `IW-3`, etc.

When the user mentions a task, milestone, module, or "the backlog" for this repo
without naming a project, default to the **`IW`** project. Use the **`indiework`
skill** (backed by the `mcp__indiework__*` tools) to read and update work — e.g.
`get_task("IW-15")`, `list_tasks({ project: "IW" })`, `update_task(...)`.
