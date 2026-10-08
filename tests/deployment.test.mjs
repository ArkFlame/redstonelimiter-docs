import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

// A code change cannot override the repository's Pages publishing-source setting.
test('documentation explains required GitHub Pages Actions setting', () => {
  assert.ok(readme.includes('select **GitHub Actions**') && readme.includes('jekyll-build-pages@v1'));
});
test('workflow builds with Astro, not Jekyll', () => {
  assert.match(workflow, /run: npm run build/);
});
test('workflow never invokes Jekyll', () => {
  assert.equal(/^\s*uses:\s*actions\/jekyll-build-pages@/m.test(workflow), false);
});
test('workflow configures Pages before uploading static output', () => {
  assert.ok(workflow.indexOf('actions/configure-pages@v5') < workflow.indexOf('actions/upload-pages-artifact@v4'));
});
test('workflow validates compiled output and uploads only dist', () => {
  assert.match(workflow, /run: npm run verify:pages/);
  assert.match(workflow, /path: dist\//);
});
test('workflow deploys artifact with official GitHub Pages action', () => {
  assert.match(workflow, /uses: actions\/deploy-pages@v4/);
});

test('artifact verifier rejects missing compiled Astro pages', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const folder = mkdtempSync(join(tmpdir(), 'rl-pages-empty-'));
  try {
    const script = fileURLToPath(new URL('../scripts/verify-pages-output.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [script], { cwd: folder, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('artifact verifier accepts a complete static-pages fixture', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const folder = mkdtempSync(join(tmpdir(), 'rl-pages-ready-'));
  try {
    const script = fileURLToPath(new URL('../scripts/verify-pages-output.mjs', import.meta.url));
    const files = ['index.html', 'guide/index.html', 'how-it-works/index.html', 'configuration/index.html', 'examples/index.html', 'calculator/index.html', 'commands/index.html', 'faq/index.html', 'CNAME', ...['01-scope-cascade', '02-activity-period', '03-threshold-sustain', '04-multipliers', '05-chunk-policy'].map(name => `visuals/${name}.html`)];
    for (const file of files) {
      const path = join(folder, 'dist', file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file === 'CNAME' ? 'redstonelimiter.arkflame.com\n' : '<!doctype html><title>fixture</title>');
    }
    const result = spawnSync(process.execPath, [script], { cwd: folder, encoding: 'utf8' });
    assert.equal(result.status, 0);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
