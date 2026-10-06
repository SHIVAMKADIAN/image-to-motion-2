// Minimal frontmatter parser/serializer (zero dependencies).
// Format:  ---\nkey: value\nlist: [a, b]\n---\nbody

export function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    return v
      .slice(1, -1)
      .split(',')
      .map((s) => stripQuotes(s.trim()))
      .filter(Boolean);
  }
  return stripQuotes(v);
}

function stripQuotes(s) {
  if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export function parse(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/);
  if (!m) throw new Error('missing frontmatter (file must start with ---)');
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 1) throw new Error(`bad frontmatter line: "${line}"`);
    meta[line.slice(0, i).trim()] = parseValue(line.slice(i + 1));
  }
  return { meta, body: (m[2] ?? '').trim() };
}

function formatValue(v) {
  if (Array.isArray(v)) return `[${v.join(', ')}]`;
  const s = String(v).replace(/\s*\n\s*/g, ' ');
  return /^[\[\]"']/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, "'")}"` : s;
}

const KEY_ORDER = ['title', 'category', 'medium', 'models', 'tags', 'negative', 'notes', 'source'];

export function serialize(meta, body) {
  const keys = [...KEY_ORDER.filter((k) => meta[k] != null && meta[k] !== ''), ...Object.keys(meta).filter((k) => !KEY_ORDER.includes(k))];
  const fm = keys.map((k) => `${k}: ${formatValue(meta[k])}`).join('\n');
  return `---\n${fm}\n---\n${body.trim()}\n`;
}

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
