/**
 * Tiny, safe-ish markdown → HTML (headings, bold, italic, inline code, lists,
 * fenced code, links). Ported from the design prototype. Escapes all HTML and
 * only permits http(s) links — adequate for a single-user, self-hosted tool.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mdInline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function mdToHtml(src: string | null | undefined): string {
  const lines = (src ?? '').replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inCode = false;
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      if (inCode) {
        html += '</code></pre>';
        inCode = false;
      } else {
        closeList();
        html += '<pre><code>';
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html += `${escapeHtml(line)}\n`;
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      html += `<h${h[1].length}>${mdInline(h[2])}</h${h[1].length}>`;
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${mdInline(li[1])}</li>`;
      continue;
    }
    if (line.trim() === '') {
      closeList();
      continue;
    }
    closeList();
    html += `<p>${mdInline(line)}</p>`;
  }
  if (inCode) html += '</code></pre>';
  closeList();
  return html;
}
