import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the same pure calculation engine embedded in the standalone page.
const html = readFileSync(new URL('../tools/pediatric-anesthesia/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  const n=');
const end = script.indexOf('  function rowHtml');
assert.ok(start >= 0 && end > start, 'Embedded engine found');
const context = {};
vm.runInNewContext(script.slice(start, end) + ';globalThis.calculate=calculatePatient;', context);

// Both sides of each new RR boundary, including the full 12th year.
const cases = [
  [0, '30–40'], [1, '25–35'], [11, '25–35'],
  [12, '20–30'], [47, '20–30'], [48, '18–25'],
  [71, '18–25'], [72, '18–25'], [83, '18–25'],
  [84, '14–20'], [120, '14–20'], [121, '14–20'],
  [144, '14–20'], [155, '14–20'], [156, '12–16'], [216, '12–16'],
];
for (const [months, expected] of cases) {
  const result = context.calculate({ ageYears: Math.floor(months / 12), ageMonths: months % 12, weightKg: 18 });
  assert.equal(result.valid, true);
  assert.equal(result.ventilation.rr, expected, `RR at ${months} months`);
  // RR changes must not move the pre-existing Ti or Vt boundaries.
  const ti = months < 1 ? '0.60' : months < 12 ? '0.60–0.70' : months < 48 ? '0.70–0.75'
    : months < 72 ? '0.75–0.80' : months <= 120 ? '0.80–0.90' : '0.80–1.0';
  assert.equal(result.ventilation.ti, ti, `Ti unchanged at ${months} months`);
  assert.deepEqual(Array.from(result.ventilation.vtPerKg), months < 1 ? [6, 7] : [6, 8]);
}
console.log(`PASS: ${cases.length} RR age cases; Ti and tidal-volume bands unchanged`);
