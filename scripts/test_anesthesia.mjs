import assert from 'node:assert/strict';
import { calculate, doseRows, dosingWeight, normalizeChoices, KG_PER_LB } from '../tools/anesthesia-dosing/calculator.mjs';
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-9, `${value} != ${expected}`);
const male = calculate('m', 177.8, 136.1);
near(male.ibw, 73.114); near(male.pbw, 73.114);
near(male.lbw, 78.95528617727304); near(male.adj, 98.3084); near(male.bmi, 43.05212692058037);
const rows = doseRows(male);
assert.equal(rows.length, 8);
assert.deepEqual(rows[1].variants.map(r => r.value), ['158–197 mg', '79–118 mg', '39–118 mg', '79–158 mg']);
assert.deepEqual(rows[2].variants.map(r => r.value), ['79–158 μg', '158–316 μg', '55–118 μg', '2–3 μg/kg']);
assert.equal(rows[2].name, 'Fentanyl'); assert.equal(rows[2].scalar, 'LBW');
assert.match(rows[2].variants[0].coefficient, /IV initial · 1–2 μg\/kg/);
assert.match(rows[2].variants[1].coefficient, /IV initial · 2–4 μg\/kg/);
assert.match(rows[2].variants[2].coefficient, /IM \/ IV · 0.7–1.5 μg\/kg/);
assert.match(rows[2].variants[3].label, /Pediatric analgesia · 2–12 years/);
assert.equal(rows[2].variants[3].coefficient, 'Reference only');
assert.equal(rows[3].scalar, 'TBW'); assert.equal(rows[3].value, '82 mg');
assert.equal(rows[4].scalar, 'TBW'); assert.equal(rows[4].value, '163 mg');
assert.match(rows[3].note, /US label/); assert.match(rows[4].note, /US label/);
assert.equal(rows[0].value, '439–585 mL');
assert.equal(rows[5].value, '136 mg'); assert.equal(rows[6].value, '272 / 544 / 2178 mg');
assert.equal(rows[7].value, '3 g');
assert.ok(rows.every(row => !row.choice));
assert.deepEqual(doseRows(male, { propofol: 'older', fentanyl: 'high', rocuronium: 'ibw', rsi: 'adj' }), rows);
assert.deepEqual(normalizeChoices(), { propofol: '', fentanyl: '', rocuronium: '', rsi: '' });
assert.deepEqual(normalizeChoices({ propofol: 'bogus', fentanyl: 10, rocuronium: null, rsi: '__proto__' }), normalizeChoices());
const female = calculate('f', 165.1, 100);
near(female.ibw, 57.057); near(female.pbw, 57.057); near(female.lbw, 52.27984923739807);
near(female.adj, 74.2342); near(female.bmi, 36.68646390547219);
assert.equal(doseRows(female)[0].value, '342–456 mL');
assert.equal(doseRows(female)[1].variants[0].value, '105–131 mg');
assert.deepEqual(doseRows(female)[2].variants.map(r => r.value), ['52–105 μg', '105–209 μg', '37–78 μg', '2–3 μg/kg']);
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

for (const weight of [50, 100, 200]) {
  const fent = doseRows(calculate('m', 177.8, weight))[2].variants;
  assert.equal(fent.length, 4);
  assert.equal(fent[3].value, '2–3 μg/kg');
  assert.equal(fent[3].coefficient, 'Reference only');
}
console.log('PASS: both sexes, three adult Fentanyl calculations, pediatric reference never scaled by adult weight, all Propofol contexts, fixed rocuronium TBW, legacy choices, formulas, units, 120 kg threshold.');
