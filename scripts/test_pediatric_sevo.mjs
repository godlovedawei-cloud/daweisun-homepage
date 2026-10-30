import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../tools/pediatric-anesthesia/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  const n=');
const end = script.indexOf('  function rowHtml');
assert.ok(start >= 0 && end > start);
const context = {};
vm.runInNewContext(script.slice(start, end) + ';globalThis.sevo=sevoMacReference;', context);
for (const [months, mac] of [[0, 3.3], [0.9, 3.3], [1, 3], [5, 3], [6, 2.8], [35, 2.8],
  [36, 2.5], [143, 2.5], [144, 2.5]]) {
  assert.equal(context.sevo(months).mac, mac, `Sevoflurane in O2 at ${months} months`);
}
for (const months of [-1, NaN, Infinity, 145, 156, 216, 300]) {
  assert.equal(context.sevo(months), null, `No unsupported automatic value at ${months} months`);
}
assert.match(context.sevo(0).age, /Full-term/);
console.log('PASS: sevoflurane label age boundaries, full-term qualification, no adolescent/adult extrapolation');
