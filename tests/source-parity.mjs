import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const config = readFileSync(new URL('../public/config.yml', import.meta.url), 'utf8');
const data = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8');
const ref = readFileSync(new URL('../src/pages/configuration.astro', import.meta.url), 'utf8');

function scope(name) {
  const m = config.match(new RegExp('^'+name+':\\n([\\s\\S]*?)(?=^[a-z][\\w-]*:|\\Z)', 'm'));
  assert.ok(m, `missing ${name} scope`);
  return m[1];
}

assert.match(config, /^config-version: 7$/m);
assert.match(config, /^\s+preset: "STRICT"$/m);
assert.match(config, /^\s+degraded-tps: 16\.0$/m);
assert.match(config, /^\s+healthy-tps: 19\.5$/m);
assert.match(config, /^\s+max-multiplier: 2\.0$/m);
for(const name of ['blocks','subchunks','chunks','regions']){
  const text=scope(name);
  assert.match(text,/enabled: true/);
  assert.match(text,/duration-millis: 5000/);
  assert.match(text,/sustain-millis: 2000/);
  assert.match(text,/sliding: true/);
}
assert.match(scope('subchunks'),/max-activations: 96/);
assert.match(scope('chunks'),/max-activations: 1024/);
assert.match(scope('regions'),/max-activations: 96/);
assert.match(config,/^max_piston_push: 12$/m);
assert.match(ref,/32×32/);
assert.match(ref,/notifications\.cross_server\.redis\.teleport_ttl_seconds/);
const matSection = scope('blocks').match(/  max-activations:\n([\s\S]*?)$/)?.[1] || '';
const materials=[...matSection.matchAll(/^    ([A-Z_]+): (\d+)$/gm)].map(m=>[m[1], Number(m[2])]);
assert.equal(materials.length,28,'current block default catalog size');
for(const [key,max] of materials){
  assert.ok(data.includes(`['${key}',${max},`),`catalog drift: ${key}=${max}`);
}
assert.equal((data.match(/^  \['[A-Z_]+',\d+,/gm)||[]).length,28,'no extra catalog items');
console.log('Source parity: config v7, four scopes, 28 materials, documentation keys PASS');
