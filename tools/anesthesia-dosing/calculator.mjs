// Canonical inputs are centimeters and kilograms. Only presentation is rounded.
export const KG_PER_LB = 0.45359237;

export function calculate(sex, cm, kg) {
  if (!['m', 'f'].includes(sex) || ![cm, kg].every(x => Number.isFinite(x) && x > 0)) return null;
  const inches = cm / 2.54;
  const base = sex === 'm' ? 50 : 45.5;
  const ibw = base + 2.3 * (inches - 60);
  const pbw = base + 0.91 * (cm - 152.4);
  const bmi = kg / ((cm / 100) ** 2);
  const lbw = 9270 * kg / (sex === 'm' ? 6680 + 216 * bmi : 8780 + 244 * bmi);
  const adj = ibw + 0.4 * (kg - ibw);
  const result = { tbw: kg, ibw, pbw, lbw, adj, bmi };
  return Object.values(result).every(x => Number.isFinite(x) && x > 0) ? result : null;
}

export function doseRows(r) {
  const round = Math.round;
  return [
    { name: 'Tidal volume', scalar: 'PBW', kind: 'ibw', value: `${round(r.pbw * 6)}–${round(r.pbw * 8)} mL`, note: '6–8 mL/kg PBW · ARDS: start at 6 mL/kg PBW; adjust to pressures.' },
    { name: 'Propofol induction', scalar: 'LBW', kind: 'lbw', value: `${round(r.lbw * 1.5)}–${round(r.lbw * 2.5)} mg`, note: '1.5–2.5 mg/kg LBW · Titrate to effect.' },
    { name: 'Fentanyl', scalar: 'LBW', kind: 'lbw', value: `${round(r.lbw)}–${round(r.lbw * 2)} μg`, note: '1–2 μg/kg LBW' },
    { name: 'Rocuronium', scalar: 'IBW', kind: 'ibw', value: `${round(r.ibw * 0.6)} mg`, note: '0.6 mg/kg IBW' },
    { name: 'Rocuronium RSI', scalar: 'AdjBW', kind: 'adj', value: `${round(r.adj * 1.2)} mg`, note: '1.2 mg/kg AdjBW · Confirm the weight scalar in your local RSI protocol.' },
    { name: 'Succinylcholine', scalar: 'TBW', kind: 'tbw', value: `${round(r.tbw)} mg`, note: '1 mg/kg TBW' },
    { name: 'Sugammadex', scalar: 'TBW', kind: 'tbw', value: `${round(r.tbw * 2)} / ${round(r.tbw * 4)} / ${round(r.tbw * 16)} mg`, note: '2 / 4 / 16 mg/kg TBW · T2 / PTC 1–2 / immediate reversal after rocuronium 1.2 mg/kg. See reversal notes.' },
    { name: 'Cefazolin', scalar: r.tbw >= 120 ? '≥120 kg' : '<120 kg', kind: 'none', value: r.tbw >= 120 ? '3 g' : '2 g', note: 'Adult surgical prophylaxis · Follow procedure-specific guidance.' },
  ];
}
