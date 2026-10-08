import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = (p) => readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const clean = (p) => read(p).replace(/^# EXAMPLE[^\n]*\n# Complete v7 configuration[^\n]*\n/, '');
const source = read('config.yml');
test('local protection differs only by disabling chunks and regions',()=>{
  assert.equal(clean('examples/local-machines.yml'),source.replace('\nchunks:\n  enabled: true','\nchunks:\n  enabled: false').replace('\nregions:\n  enabled: true','\nregions:\n  enabled: false'));
});
test('region recipe differs only by higher aggregate maximum',()=>{
  const expected=source.replace(/(\nregions:[\s\S]*?\n  max-activations:) 96/,'$1 1024');
  assert.equal(clean('examples/aggregate-region.yml'),expected);
});
test('piston recipe differs only by two material maxima',()=>{
  assert.equal(clean('examples/relaxed-pistons.yml'),source.replace('    PISTON: 3','    PISTON: 12').replace('    STICKY_PISTON: 3','    STICKY_PISTON: 12'));
});
