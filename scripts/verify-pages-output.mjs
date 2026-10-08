import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// GitHub Pages must receive Astro output, never raw *.astro source.
const paths = [
  'index.html',
  'guide/index.html',
  'how-it-works/index.html',
  'configuration/index.html',
  'examples/index.html',
  'calculator/index.html',
  'commands/index.html',
  'faq/index.html',
  'CNAME',
  ...[
    '01-scope-cascade',
    '02-activity-period',
    '03-threshold-sustain',
    '04-multipliers',
    '05-chunk-policy',
  ].map(slug => `visuals/${slug}.html`),
];
const missing = paths.filter(path => !existsSync(join('dist', path)));
if (missing.length > 0) {
  console.error('Cannot deploy: Astro dist/ is missing required files:\n' + missing.join('\n'));
  process.exitCode = 1;
} else {
  const cname = readFileSync(join('dist', 'CNAME'), 'utf8').trim();
  if (cname !== 'redstonelimiter.arkflame.com') {
    console.error(`Cannot deploy: unexpected Pages CNAME: ${cname}`);
    process.exitCode = 1;
  } else {
    console.log(`Pages artifact verified: ${paths.length} static outputs present; domain ${cname}`);
  }
}
