import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './load.js';

const stripInternal = ({ _keys, file, ...e }) => e;

export function build(lib, root = ROOT) {
  const site = path.join(root, 'site');
  fs.mkdirSync(site, { recursive: true });
  const data = {
    taxonomy: lib.taxonomy,
    models: lib.models,
    entries: lib.entries.map(stripInternal),
  };
  fs.writeFileSync(path.join(site, 'index.json'), JSON.stringify(data));

  // Single self-contained HTML: opens straight from disk (file://), no server needed.
  const shared = ['search.js', 'compose.js']
    .map((f) => fs.readFileSync(path.join(root, 'src', f), 'utf8'))
    .join('\n');
  const json = JSON.stringify(data).replace(/</g, '\\u003c'); // keep </script> out of the inline JSON
  const tpl = fs.readFileSync(path.join(root, 'web', 'template.html'), 'utf8');
  const html = tpl.replace('/*__SHARED__*/', () => shared).replace('__DATA__', () => json);
  fs.writeFileSync(path.join(site, 'library.html'), html);
  return { entries: data.entries.length, bytes: html.length };
}
