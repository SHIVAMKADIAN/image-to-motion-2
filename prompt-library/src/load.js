import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from './parse.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ALLOWED_KEYS = new Set(['title', 'category', 'medium', 'models', 'tags', 'negative', 'notes', 'source']);
const asList = (v, dflt) => (Array.isArray(v) ? v : v ? [v] : dflt);

export function loadTaxonomy(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'taxonomy.json'), 'utf8'));
}

export function loadModels(root = ROOT) {
  const dir = path.join(root, 'models');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const d of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(p);
    else if (d.name.endsWith('.md')) yield p;
  }
}

/** Load every entry. Parse errors are collected, not thrown, so validate can report all of them. */
export function loadEntries(root = ROOT) {
  const dataDir = path.join(root, 'data');
  const entries = [];
  const errors = [];
  for (const file of walk(dataDir)) {
    const rel = path.relative(dataDir, file).split(path.sep).join('/');
    const id = rel.replace(/\.md$/, '');
    try {
      const { meta, body } = parse(fs.readFileSync(file, 'utf8'));
      entries.push({
        id,
        file: rel,
        title: meta.title ?? '',
        category: meta.category ?? '',
        medium: asList(meta.medium, ['image']),
        models: asList(meta.models, ['any']),
        tags: asList(meta.tags, []),
        negative: meta.negative || '',
        notes: meta.notes || '',
        source: meta.source || '',
        body,
        _keys: Object.keys(meta),
      });
    } catch (err) {
      errors.push({ level: 'error', id, msg: err.message });
    }
  }
  return { entries, errors };
}

export function loadAll(root = ROOT) {
  const taxonomy = loadTaxonomy(root);
  const models = loadModels(root);
  const { entries, errors } = loadEntries(root);
  return { taxonomy, models, entries, parseErrors: errors };
}

export { ALLOWED_KEYS };
