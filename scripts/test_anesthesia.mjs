import assert from 'node:assert/strict';
import { calculate, doseRows, dosingWeight, normalizeChoices, KG_PER_LB } from '../tools/anesthesia-dosing/calculator.mjs';
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-9, `${value} != ${expected}`);
const selected = { propofol: 'adult', fentanyl: 'low', rocuronium: 'tbw', rsi: 'adj' };
const male = calculate('m', 177.8, 136.1);
near(male.ibw, 73.114); near(male.pbw, 73.114);
near(male.lbw, 78.95528617727304); near(male.adj, 98.3084); near(male.bmi, 43.05212692058037);
assert.deepEqual(doseRows(male, selected).map(r => r.value), [
  '439–585 mL', '158–197 mg', '158 μg', '82 mg', '118 mg', '136 mg', '272 / 544 / 2178 mg', '3 g',
]);
assert.deepEqual(doseRows(male).slice(1, 5).map(r => r.value), ['—', '—', '—', '—']);
assert.deepEqual(normalizeChoices(), { propofol: '', fentanyl: '', rocuronium: '', rsi: '' });
assert.deepEqual(normalizeChoices({ propofol: 'bogus', fentanyl: 10, rocuronium: null, rsi: '__proto__' }), normalizeChoices());
const propofolCases = { adult: '158–197 mg', older: '79–118 mg', cardiac: '39–118 mg', neuro: '79–158 mg' };
for (const [propofol, expected] of Object.entries(propofolCases)) assert.equal(doseRows(male, { propofol })[1].value, expected);
const fentanylCases = { low: '158 μg', moderate: '158–1579 μg', high: '1579–3948 μg' };
for (const [fentanyl, expected] of Object.entries(fentanylCases)) {
  const row = doseRows(male, { fentanyl })[2]; assert.equal(row.value, expected); assert.match(row.name, /total dose/); assert.match(row.note, /total/);
}
for (const [scalar, routine, rsi] of [
  ['tbw', '82 mg', '163 mg'], ['ibw', '44 mg', '88 mg'], ['lbw', '47 mg', '95 mg'], ['adj', '59 mg', '118 mg'],
]) {
  const rows = doseRows(male, { rocuronium: scalar, rsi: scalar });
  assert.equal(rows[3].value, routine); assert.equal(rows[4].value, rsi);
  assert.match(rows[3].note, scalar === 'tbw' ? /US label/ : /obesity literature/);
  assert.match(rows[4].note, /selected weight/);
}
const female = calculate('f', 165.1, 100);
near(female.ibw, 57.057); near(female.pbw, 57.057); near(female.lbw, 52.27984923739807);
near(female.adj, 74.2342); near(female.bmi, 36.68646390547219);
assert.equal(doseRows(female)[0].value, '342–456 mL');
assert.equal(doseRows(female, selected)[1].value, '105–131 mg');
const underweight = calculate('m', 180, 50);
near(underweight.ibw, 75.116); near(underweight.adj, 65.0696);
assert.equal(dosingWeight(underweight, 'ibw'), 50); assert.equal(dosingWeight(underweight, 'adj'), 50);
assert.equal(doseRows(underweight, { rocuronium: 'ibw', rsi: 'adj' })[3].value, '30 mg');
assert.equal(doseRows(underweight, { rocuronium: 'ibw', rsi: 'adj' })[4].value, '60 mg');
assert.equal(doseRows(underweight)[0].value, '451–601 mL');
assert.equal(dosingWeight(underweight, 'pbw'), underweight.pbw);
for (const sex of ['m', 'f']) {
  assert.equal(doseRows(calculate(sex, 177.8, 119.999))[7].value, '2 g');
  assert.equal(doseRows(calculate(sex, 177.8, 120))[7].value, '3 g');
  assert.ok(calculate(sex, 150, 60));
  near(calculate(sex, 152.4, 70).ibw, sex === 'm' ? 50 : 45.5);
  assert.ok(calculate(sex, 170, 400).lbw > calculate(sex, 170, 300).lbw);
}
near(300 * KG_PER_LB, 136.077711);
for (const bad of [null, undefined, NaN, Infinity, -Infinity, 0, -1]) {
  assert.equal(calculate('m', bad, 100), null); assert.equal(calculate('f', 165, bad), null);
}
assert.equal(calculate('x', 177.8, 100), null); assert.equal(calculate('f', 1, 100), null);
console.log('PASS: both sexes, shared IBW/PBW, all contexts/scalars, unset/invalid choices, underweight fallback, short heights, severe obesity, units, 120 kg threshold.');
