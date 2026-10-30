import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../tools/pediatric-anesthesia/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  const n=');
const end = script.indexOf('  function rowHtml');
assert.ok(start >= 0 && end > start);
const context = {};
vm.runInNewContext(script.slice(start, end) + ';globalThis.calculate=calculatePatient;', context);
const calculate = (months, weightKg = 18) => context.calculate({
  ageYears: Math.floor(months / 12), ageMonths: months % 12, weightKg,
});

for (const [kg, rate] of [[5, 20], [10, 40], [15, 50], [18, 56], [20, 60], [25, 65],
  [30, 70], [35, 75], [40, 80], [50, 90], [60, 100]]) {
  assert.equal(calculate(48, kg).fluids.maintenanceMlHr, rate, `${kg} kg: cc/hr = mL/hr`);
}
// Verified Stanford values, including the two corrections to the supplied transcription.
const cases = [
  [1, '120–170', '24–40', '85–105', '40–60'],
  [5, '120–170', '24–40', '85–105', '40–60'],
  [6, '110–150', '24–40', '85–100', '40–60'],
  [11, '110–150', '24–40', '85–100', '40–60'],
  [12, '90–150', '22–30', '85–105', '40–60'],
  [47, '90–150', '22–30', '85–105', '40–60'],
  [48, '80–130', '20–25', '90–105', '45–65'],
  [71, '80–130', '20–25', '90–105', '45–65'],
  [72, '70–115', '18–25', '90–110', '50–70'],
  [107, '70–115', '18–25', '90–110', '50–70'],
  [108, '65–110', '16–25', '95–115', '60–75'],
  [143, '65–110', '16–25', '95–115', '60–75'],
  [144, '60–100', '14–20', '100–120', '60–80'],
  [191, '60–100', '14–20', '100–120', '60–80'],
  [192, '55–100', '14–20', '110–120', '65–80'],
  [216, '55–100', '14–20', '110–120', '65–80'],
];
for (const [months, hr, rr, sbp, dbp] of cases) {
  const band = calculate(months).vitals.band;
  assert.deepEqual([band.hr, band.rr, band.sbp, band.dbp], [hr, rr, sbp, dbp], `${months} months`);
}
const newborn = calculate(0, 3).vitals;
assert.deepEqual([newborn.band.hr, newborn.band.rr, newborn.band.sbp, newborn.band.dbp],
  ['See table', 'See table', 'See table', 'See table'], 'Whole months cannot choose a neonatal day/week row');
for (const [months, cutoff] of [[0, 60], [11, 70], [12, 72], [24, 74], [48, 78], [72, 82], [96, 86], [120, 90], [132, 90]]) {
  assert.equal(calculate(months).vitals.hypotension, cutoff, `SBP hypotension at ${months} months`);
}
assert.equal(calculate(24).ventilation.rr, '20–30');
assert.equal(calculate(24).vitals.band.rr, '22–30', 'Resting RR remains separate from ventilator starting RR');
console.log('PASS: 11 fluid examples, 16 vital-sign age cases, neonatal ambiguity, PALS cutoffs, independent ventilator RR');
