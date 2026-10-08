import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = new URL('../', import.meta.url).pathname;
const page = readFileSync(join(base, 'src/pages/how-it-works.astro'), 'utf8');
const component = readFileSync(join(base, 'src/components/AnimatedDiagram.astro'), 'utf8');
const slugs = [
  '01-scope-cascade',
  '02-activity-period',
  '03-threshold-sustain',
  '04-multipliers',
  '05-chunk-policy',
];

for (const slug of slugs) {
  const publishedPath = join(base, 'public/visuals', slug + '.html');
  const originalPath = join(base, 'animation-sources/html', slug + '.html');
  const published = readFileSync(publishedPath, 'utf8');
  const original = readFileSync(originalPath, 'utf8');

  test(`${slug}: public HTML is an actual self-contained animated SVG page`, () => {
    assert.ok(
      published.includes('<svg id="s" viewBox="0 0 1280 720"') &&
      published.includes('window.renderAt=function(t)') &&
      published.includes('function draw(t)') &&
      published.includes('requestAnimationFrame') &&
      !/<script\s+src=|<link\s+[^>]*href=|<video|\.webm|\.mp4/i.test(published)
    );
  });

  test(`${slug}: original animation model and drawing code are preserved`, () => {
    assert.equal(
      published.split('// Embedding bridge:')[0],
      original.split('if(!window.__manual)')[0]
    );
  });

  test(`${slug}: HTML playback responds to the documentation page`, () => {
    assert.ok(published.includes("event.source !== window.parent") &&
      published.includes("data.type !== 'redstonelimiter:playback'") &&
      published.includes('pauseDiagram()') &&
      published.includes('playDiagram()'));
  });

  test(`${slug}: embedded once beside the correct explanation`, () => {
    assert.equal(page.split(`slug="${slug}"`).length - 1, 1);
  });

  test(`${slug}: editable original HTML is retained`, () => {
    assert.ok(statSync(originalPath).size > 5000);
  });
}

test('component runs self-contained HTML in a lazy sandbox with accessible playback controls', () => {
  const markers = [
    '<iframe', 'src={htmlUrl}', 'loading="lazy"', 'sandbox="allow-scripts"',
    'aria-describedby=', 'IntersectionObserver', 'prefers-reduced-motion: reduce',
    "type: 'redstonelimiter:playback'", 'frame.addEventListener(\'load\', update)',
    'diagram-toggle', 'href={htmlUrl}',
  ];
  assert.deepEqual(markers.filter(marker => !component.includes(marker)), []);
});

test('all WebM, MP4 and unused poster binaries were removed', () => {
  const files = readdirSync(join(base, 'public/visuals'));
  assert.deepEqual(files.filter(file => /\.(webm|mp4|webp)$/i.test(file)), []);
});

test('all five live animation HTML files are published', () => {
  const files = readdirSync(join(base, 'public/visuals'));
  assert.deepEqual(files.filter(file => file.endsWith('.html')).sort(), slugs.map(slug => slug + '.html'));
});

test('video player markup is completely removed', () => {
  assert.equal(/<(?:video|source)\b|\.webm|\.mp4|\.webp/.test(component), false);
});
