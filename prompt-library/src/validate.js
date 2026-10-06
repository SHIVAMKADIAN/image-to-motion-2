import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_KEYS, ROOT } from './load.js';

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function validate({ taxonomy, models, entries, parseErrors = [] }, root = ROOT) {
  const issues = [...parseErrors];
  const add = (level, id, msg) => issues.push({ level, id, msg });
  const modelIds = new Set(models.map((m) => m.id));
  const seenBody = new Map();

  for (const e of entries) {
    if (!e.title) add('error', e.id, 'missing title');
    if (!e.body) add('error', e.id, 'empty prompt body');
    if (!taxonomy.categories[e.category]) add('error', e.id, `unknown category "${e.category}" (see taxonomy.json)`);
    else if (e.id.split('/')[0] !== e.category) add('error', e.id, `file must live in data/${e.category}/ (found data/${e.file})`);
    for (const k of e._keys) if (!ALLOWED_KEYS.has(k)) add('error', e.id, `unknown frontmatter key "${k}"`);
    for (const m of e.medium) if (!taxonomy.mediums.includes(m)) add('error', e.id, `unknown medium "${m}"`);
    for (const m of e.models) if (m !== 'any' && !modelIds.has(m)) add('error', e.id, `unknown model "${m}" (see models/)`);
    for (const t of e.tags) if (!/^[a-z0-9][a-z0-9-]*$/.test(t)) add('warn', e.id, `tag "${t}" should be lowercase-kebab`);
    if (e.tags.length === 0) add('warn', e.id, 'no tags — hard to find via search');
    if (e.category !== 'method' && e.category !== 'template' && e.body.split(/\s+/).length > 4000) add('warn', e.id, 'very long prompt (>4000 words)');
    const key = norm(e.body);
    if (key) {
      if (seenBody.has(key)) add('warn', e.id, `duplicate body of ${seenBody.get(key)}`);
      else seenBody.set(key, e.id);
    }
  }

  for (const m of models) {
    for (const f of ['id', 'name', 'order']) if (m[f] == null) add('error', `models/${m.id ?? '?'}`, `profile missing "${f}"`);
    for (const c of m.order || []) if (!taxonomy.categories[c]) add('error', `models/${m.id}`, `order references unknown category "${c}"`);
    if (!fs.existsSync(path.join(root, 'skills', m.id, 'SKILL.md'))) add('warn', `models/${m.id}`, `no skills/${m.id}/SKILL.md`);
  }
  return issues;
}
