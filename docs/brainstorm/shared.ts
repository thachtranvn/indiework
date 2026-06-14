/**
 * Shared definitions used by BOTH the sqlite and postgres schemas,
 * and by the service layer. Keep this dialect-agnostic: no drizzle
 * column builders here, only plain TS values/types.
 *
 * The single source of truth for enum *values* lives here so the
 * two dialect schema files and the zod validators all agree.
 */

// ---- Enum value tuples (as const so they can drive both drizzle & zod) ----

export const TASK_STATUS = [
  'inbox', // chưa triage (chỉ task ở Inbox, project_id null)
  'backlog', // chưa định làm
  'todo', // sẽ làm
  'in_progress', // đang làm
  'blocked', // đang kẹt (đi kèm status_note)
  'done', // xong
  'cancelled', // bỏ
] as const;

export const TASK_PRIORITY = [
  'none',
  'low',
  'medium',
  'high',
  'urgent',
] as const;

export const MILESTONE_STATUS = ['planned', 'active', 'done'] as const;

export const COMMENT_SOURCE = [
  'web', // tạo từ web UI
  'api', // tạo từ REST API (Telegram, vscode…)
  'mcp', // tạo từ MCP tool
  'agent', // AI agent tự ghi tiến trình
] as const;

// ---- Derived TS union types (service layer + validators import these) ----

export type TaskStatus = (typeof TASK_STATUS)[number];
export type TaskPriority = (typeof TASK_PRIORITY)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUS)[number];
export type CommentSource = (typeof COMMENT_SOURCE)[number];

// ---- Defaults ----

export const DEFAULT_TASK_STATUS: TaskStatus = 'backlog';
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'none';
export const DEFAULT_MILESTONE_STATUS: MilestoneStatus = 'planned';

// ---- Project key + ref helpers (định danh công khai "PRJA-3") ----

/** Ràng buộc project key: chữ hoa đầu, chỉ A-Z0-9, 2-10 ký tự, không có '-'. */
export const PROJECT_KEY_REGEX = /^[A-Z][A-Z0-9]{1,9}$/;

export function isValidProjectKey(key: string): boolean {
  return PROJECT_KEY_REGEX.test(key);
}

/** Build ref hiển thị từ key + seq → "PRJA-3". */
export function buildRef(projectKey: string, seq: number): string {
  return `${projectKey}-${seq}`;
}

/**
 * Parse "PRJA-3" → { key: "PRJA", seq: 3 }.
 * Tách ở dấu '-' CUỐI CÙNG để an toàn (dù key đã cấm '-', vẫn phòng thủ).
 * Trả về null nếu sai định dạng.
 */
export function parseRef(ref: string): { key: string; seq: number } | null {
  const idx = ref.lastIndexOf('-');
  if (idx <= 0 || idx === ref.length - 1) return null;
  const key = ref.slice(0, idx);
  const seqStr = ref.slice(idx + 1);
  if (!isValidProjectKey(key)) return null;
  if (!/^\d+$/.test(seqStr)) return null;
  const seq = Number(seqStr);
  if (!Number.isInteger(seq) || seq <= 0) return null;
  return { key, seq };
}
