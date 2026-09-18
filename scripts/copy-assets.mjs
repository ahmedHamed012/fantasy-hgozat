// Copies non-TypeScript assets (Pug views, static css/js/images) from src/ into
// dist/ after `tsc` compiles the TypeScript. This keeps `app.ts` able to resolve
// views and static files relative to __dirname in both dev and production.
import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  ['src/views', 'dist/views'],
  ['src/public', 'dist/public'],
];

for (const [from, to] of targets) {
  const src = resolve(root, from);
  if (!existsSync(src)) continue;
  await cp(src, resolve(root, to), { recursive: true });
  console.log(`copied ${from} -> ${to}`);
}
