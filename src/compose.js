// Pure prompt composer: fragments + model profile -> model-shaped prompt.
// No imports so it can be inlined into the browser UI unchanged.

const ensureEnd = (s) => (/[.!?"')\]]$/.test(s) ? s : `${s}.`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const stripEnd = (s) => s.replace(/[.\s]+$/, '');

export function fillVars(text, vars) {
  const missing = new Set();
  const out = text.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (m, k) => {
    if (vars[k] != null && vars[k] !== '') return String(vars[k]);
    missing.add(k);
    return m;
  });
  return { text: out, missing: [...missing] };
}

/**
 * @param {object} p
 * @param {object} p.profile  model profile (models/*.json)
 * @param {object[]} p.entries  library entries to combine
 * @param {string} [p.subject]  free-text subject
 * @param {object} [p.vars]  template variables / params (e.g. {ar:'9:16'})
 */
export function compose({ profile, entries, subject = '', vars = {} }) {
  const warnings = [];
  const v = { ...(profile.paramDefaults || {}), ...vars };
  if (subject) v.subject = subject;

  const byCat = new Map();
  const negatives = [];
  let subjectConsumed = false;
  const templates = [];

  for (const e of entries) {
    if (!e.models.includes('any') && !e.models.includes(profile.id)) {
      warnings.push(`"${e.id}" is not tagged for ${profile.id}`);
    }
    if (e.category === 'method') { warnings.push(`"${e.id}" is a method, not a prompt fragment — skipped`); continue; }
    if (e.negative) negatives.push(e.negative);
    if (e.category === 'negative') { negatives.push(e.body); continue; }
    if (e.category === 'template') { templates.push(e); continue; }
    if (!byCat.has(e.category)) byCat.set(e.category, []);
    byCat.get(e.category).push(e.body);
  }

  const blocks = [];
  for (const t of templates) {
    const { text, missing } = fillVars(t.body, v);
    if (/\{\{\s*subject\s*\}\}/.test(t.body)) subjectConsumed = true;
    missing.forEach((k) => warnings.push(`template "${t.id}": variable {{${k}}} left unfilled`));
    blocks.push(text);
  }

  if (subject && !subjectConsumed) {
    if (!byCat.has('subject')) byCat.set('subject', []);
    byCat.get('subject').unshift(subject);
  }

  const order = profile.order || [];
  const extra = [...byCat.keys()].filter((c) => !order.includes(c));
  extra.forEach((c) => warnings.push(`${profile.id} has no slot for "${c}" — appended at the end`));
  for (const cat of [...order, ...extra]) for (const b of byCat.get(cat) || []) blocks.push(b);

  const sentences = profile.style === 'sentences';
  const clean = blocks.map((b) => b.trim().replace(/\s+/g, ' ')).filter(Boolean);
  let prompt = clean.map(sentences ? (b) => cap(ensureEnd(b)) : stripEnd).join(profile.joiner ?? (sentences ? ' ' : ', '));

  let negative = '';
  const neg = profile.negative || { mode: 'none' };
  if (negatives.length) {
    const list = negatives.map(sentences ? (b) => cap(ensureEnd(b)) : stripEnd).join(neg.join ?? (sentences ? ' ' : ', '));
    if (neg.mode === 'inline') prompt += (sentences ? ' ' : ' ') + (neg.template || '{list}').replace('{list}', list);
    else if (neg.mode === 'separate') negative = list;
    else warnings.push(`${profile.id} has no negative prompt — ${negatives.length} avoid-item(s) dropped; phrase them positively instead`);
  }

  if (profile.prefix) prompt = `${profile.prefix} ${prompt}`;
  if (profile.suffix) {
    const { text, missing } = fillVars(profile.suffix, v);
    missing.forEach((k) => warnings.push(`suffix param {{${k}}} left unfilled`));
    prompt += text;
  }

  const words = prompt.split(/\s+/).filter(Boolean).length;
  if (profile.maxWords && words > profile.maxWords) {
    warnings.push(`${words} words exceeds the ${profile.maxWords}-word guideline for ${profile.id} — tighten`);
  }
  return { prompt, negative, warnings, words };
}
