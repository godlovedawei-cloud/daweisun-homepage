// Canonical inputs are centimeters and kilograms. Only presentation is rounded.
export const KG_PER_LB = 0.45359237;
export const CHOICES = {
  propofol: [
    { value: 'adult', label: 'Adult <65 · ASA I–II', low: 2, high: 2.5 },
    { value: 'older', label: 'Elderly / debilitated / ASA III–IV', low: 1, high: 1.5 },
    { value: 'cardiac', label: 'Cardiac anesthesia', low: 0.5, high: 1.5 },
    { value: 'neuro', label: 'Neurosurgical', low: 1, high: 2 },
  ],
  fentanyl: [
    { value: 'low', label: 'GA adjunct · low total dose', low: 2, high: 2 },
    { value: 'moderate', label: 'GA adjunct · moderate total dose', low: 2, high: 20 },
    { value: 'high', label: 'GA adjunct · high total dose', low: 20, high: 50 },
  ],
  rocuronium: [
    { value: 'tbw', label: 'TBW · US label' },
    { value: 'ibw', label: 'IBW · obesity literature' },
    { value: 'lbw', label: 'LBW · obesity literature' },
    { value: 'adj', label: 'AdjBW · obesity literature' },
  ],
  rsi: [
    { value: 'tbw', label: 'TBW' }, { value: 'ibw', label: 'IBW' },
    { value: 'lbw', label: 'LBW' }, { value: 'adj', label: 'AdjBW' },
  ],
};
export function normalizeChoices(value) {
  return Object.fromEntries(Object.entries(CHOICES).map(([key, options]) => [key,
    options.some(option => option.value === value?.[key]) ? value[key] : '']));
}
export function calculate(sex, cm, kg) {
  if (!['m', 'f'].includes(sex) || ![cm, kg].every(x => Number.isFinite(x) && x > 0)) return null;
  const ibw = (sex === 'm' ? 50 : 45.5) + 0.91 * (cm - 152.4);
  const pbw = ibw;
  const bmi = kg / ((cm / 100) ** 2);
  const lbw = 9270 * kg / (sex === 'm' ? 6680 + 216 * bmi : 8780 + 244 * bmi);
  const adj = ibw + 0.4 * (kg - ibw);
  const result = { tbw: kg, ibw, pbw, lbw, adj, bmi };
  return Object.values(result).every(x => Number.isFinite(x) && x > 0) ? result : null;
}
export function dosingWeight(r, scalar) {
  return r.tbw < r.ibw && ['ibw', 'adj'].includes(scalar) ? r.tbw : r[scalar];
}
const amount = (low, high, weight, unit) => low === high ? `${Math.round(low * weight)} ${unit}` : `${Math.round(low * weight)}–${Math.round(high * weight)} ${unit}`;
// Every context is visible. Old saved selections never affect these results.
export function doseRows(r) {
  const variant = (label, low, high, unit) => ({ label,
    coefficient: `${low === high ? low : `${low}–${high}`} ${unit}/kg`,
    value: amount(low, high, r.lbw, unit),
  });
  return [
    { name: 'Tidal volume', scalar: 'PBW', kind: 'ibw', value: amount(6, 8, r.pbw, 'mL'), note: '6–8 mL/kg' },
    { name: 'Propofol induction', scalar: 'LBW', kind: 'lbw',
      variants: [variant('<65 · ASA I–II', 2, 2.5, 'mg'), variant('Elderly / frail / ASA III–IV', 1, 1.5, 'mg'), variant('Cardiac', 0.5, 1.5, 'mg'), variant('Neurosurgical', 1, 2, 'mg')],
      note: 'US label ranges · LBW: obesity literature' },
    { name: 'Fentanyl', scalar: 'Adult LBW', kind: 'lbw',
      variants: [
        { label: 'Adult GA · minor surgery', coefficient: 'IV initial · 1–2 μg/kg', value: amount(1, 2, r.lbw, 'μg') },
        { label: 'Adult GA · major surgery', coefficient: 'IV initial · 2–4 μg/kg', value: amount(2, 4, r.lbw, 'μg') },
        { label: 'Adult premedication / postop analgesia', coefficient: 'IM / IV · 0.7–1.5 μg/kg', value: amount(0.7, 1.5, r.lbw, 'μg') },
        { label: 'Pediatric analgesia · 2–12 years', coefficient: 'Reference only', value: '2–3 μg/kg' },
      ], note: 'Adult dosing weight: LBW · obesity literature' },
    { name: 'Rocuronium', scalar: 'TBW', kind: 'tbw', value: amount(0.6, 0.6, r.tbw, 'mg'), note: '0.6 mg/kg · US label' },
    { name: 'Rocuronium RSI', scalar: 'TBW', kind: 'tbw', value: amount(1.2, 1.2, r.tbw, 'mg'), note: '1.2 mg/kg · US label rapid-onset dose' },
    { name: 'Succinylcholine', scalar: 'TBW', kind: 'tbw', value: amount(1, 1, r.tbw, 'mg'), note: '1 mg/kg · obesity literature' },
    { name: 'Sugammadex', scalar: 'TBW', kind: 'tbw', value: `${Math.round(r.tbw * 2)} / ${Math.round(r.tbw * 4)} / ${Math.round(r.tbw * 16)} mg`,
      note: '2: T2 · 4: PTC 1–2, TOF 0 · 16: ~3 min after rocuronium 1.2 mg/kg' },
    { name: 'Cefazolin', scalar: r.tbw >= 120 ? '≥120 kg' : '<120 kg', kind: 'none', value: r.tbw >= 120 ? '3 g' : '2 g', note: 'Surgical prophylaxis' },
  ];
}
