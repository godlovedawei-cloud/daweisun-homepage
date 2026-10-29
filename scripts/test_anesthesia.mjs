import assert from 'node:assert/strict';
import { calculate, doseRows, KG_PER_LB } from '../tools/anesthesia-dosing/calculator.mjs';

const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-9, `${value} != ${expected}`);
const male = calculate('m', 177.8, 136.1);
near(male.ibw, 73);
near(male.pbw, 73.114);
near(male.lbw, 78.95528617727304);
near(male.adj, 98.24);
near(male.bmi, 43.05212692058037);
assert.deepEqual(doseRows(male).map(r => r.value), [
  '439–585 mL', '118–197 mg', '79–158 μg', '44 mg', '118 mg', '136 mg', '272 / 544 / 2178 mg', '3 g',
]);
const female = calculate('f', 165.1, 100);
near(female.ibw, 57);
near(female.pbw, 57.057);
near(female.lbw, 52.27984923739807);
near(female.adj, 74.2);
near(female.bmi, 36.68646390547219);
assert.equal(doseRows(female)[0].value, '342–456 mL');
for (const sex of ['m', 'f']) {
  assert.equal(doseRows(calculate(sex, 177.8, 119.999))[7].value, '2 g');
  assert.equal(doseRows(calculate(sex, 177.8, 120))[7].value, '3 g');
}
near(300 * KG_PER_LB, 136.077711);
for (const bad of [null, undefined, NaN, Infinity, -Infinity, 0, -1]) {
  assert.equal(calculate('m', bad, 100), null);
  assert.equal(calculate('f', 165, bad), null);
}
assert.equal(calculate('x', 177.8, 100), null);
assert.equal(calculate('f', 1, 100), null);
console.log('PASS: male/female golden cases, all 8 outputs, PBW ventilation, 120 kg boundary, units, invalid inputs.');
