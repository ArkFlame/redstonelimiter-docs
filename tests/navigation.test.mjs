import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const nav = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8');
for (const [file,slug] of [
  ['index.astro','/'], ['guide.astro','/guide/'], ['how-it-works.astro','/how-it-works/'],
  ['configuration.astro','/configuration/'],['examples.astro','/examples/'],
  ['calculator.astro','/calculator/'], ['commands.astro','/commands/'], ['faq.astro','/faq/']
]) {
  test(`page ${slug} exists and is linked`,()=> {
    assert.ok(existsSync(new URL(`../src/pages/${file}`,import.meta.url)) && nav.includes(`href: '${slug}'`));
  });
}
test('custom domain matches Astro site',()=> {
 const cname=readFileSync(new URL('../public/CNAME',import.meta.url),'utf8').trim();
 const config=readFileSync(new URL('../astro.config.mjs',import.meta.url),'utf8');
 assert.ok(config.includes(`https://${cname}`));
});
