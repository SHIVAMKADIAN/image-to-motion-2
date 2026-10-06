// Pure search over normalized entries. Also inlined into the browser UI.

const tokenize = (s) => s.toLowerCase().split(/[^a-z0-9#+]+/).filter(Boolean);

export function search(entries, query = '', filters = {}) {
  const tokens = tokenize(query);
  const hits = [];
  for (const e of entries) {
    if (filters.category && e.category !== filters.category) continue;
    if (filters.medium && !e.medium.includes(filters.medium)) continue;
    if (filters.model && !(e.models.includes('any') || e.models.includes(filters.model))) continue;
    if (filters.tag && !e.tags.includes(filters.tag)) continue;
    let score = 0;
    let ok = true;
    if (tokens.length) {
      const title = e.title.toLowerCase();
      const id = e.id.toLowerCase();
      const text = `${e.body} ${e.notes || ''}`.toLowerCase();
      for (const t of tokens) {
        let s = 0;
        if (title.includes(t)) s += 5;
        if (e.tags.includes(t)) s += 4;
        else if (e.tags.some((x) => x.includes(t))) s += 2;
        if (e.category.includes(t)) s += 3;
        if (id.includes(t)) s += 1;
        if (text.includes(t)) s += 1;
        if (!s) { ok = false; break; }
        score += s;
      }
    }
    if (ok) hits.push({ e, score });
  }
  hits.sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id));
  return hits.map((h) => h.e);
}
