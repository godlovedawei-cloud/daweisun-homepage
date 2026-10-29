import { calculate, doseRows, KG_PER_LB, CHOICES, normalizeChoices } from './calculator.mjs';

const $ = id => document.getElementById(id);
const KEY = 'daweisun.anesthesia-dosing.patients.v1';
const fields = ['sex', 'cm', 'total-inches', 'feet', 'inches', 'kg', 'lb'];
const numberText = x => String(Number(x.toFixed(6)));
let storageOK = true;
let inputError = '';

function storageWarning() {
  storageOK = false;
  $('storage-status').textContent = 'Storage unavailable · session only';
}
function readRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(data)) throw new Error('Invalid records');
    const seen = new Set();
    return data.filter(p => {
      if (!p || typeof p.id !== 'string' || seen.has(p.id) || !['m', 'f'].includes(p.sex)) return false;
      if (![p.created, p.used].every(Number.isFinite)) return false;
      if (![p.cm, p.kg].every(x => x === null || (Number.isFinite(x) && x > 0))) return false;
      seen.add(p.id);
      return true;
    }).map(p => ({ id: p.id, label: typeof p.label === 'string' ? p.label.slice(0, 24) : '', sex: p.sex,
      cm: p.cm, kg: p.kg, choices: normalizeChoices(p.choices), created: p.created, used: p.used })).sort((a, b) => b.used - a.used).slice(0, 100);
  } catch {
    storageWarning();
    return [];
  }
}
let patients = readRecords();
let current = null;
function save() {
  if (!storageOK) return;
  try { localStorage.setItem(KEY, JSON.stringify(patients)); } catch { storageWarning(); }
}
function sorted() { return patients.slice().sort((a, b) => b.used - a.used); }
function dateLabel(t) { return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function makePatient() {
  const now = Date.now();
  return { id: crypto.randomUUID(), label: '', sex: 'm', cm: null, kg: null, choices: normalizeChoices(), created: now, used: now };
}
function renderBar() {
  const list = sorted();
  $('patient-select').replaceChildren(...list.slice(0, 5).map(p => new Option(`${p.label || 'Unlabeled'} · ${dateLabel(p.created)}`, p.id)));
  $('patient-select').value = current.id;
  const archive = list.slice(5);
  $('archive-count').textContent = archive.length;
  const nodes = archive.map(p => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'archive-row';
    const title = document.createElement('span'); title.textContent = p.label || 'Unlabeled';
    const detail = document.createElement('small');
    detail.textContent = [p.sex === 'm' ? 'Male' : 'Female', p.cm ? `${numberText(p.cm)} cm` : '', p.kg ? `${numberText(p.kg)} kg` : '', dateLabel(p.created)].filter(Boolean).join(' · ');
    button.append(title, detail);
    button.addEventListener('click', () => { closeArchive(); openPatient(p); $('patient-select').focus(); });
    return button;
  });
  if (!nodes.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'No archived records.'; nodes.push(empty);
  }
  $('archive').replaceChildren(...nodes);
}
function heightFields(except = '') {
  const h = current.cm;
  const inches = h === null ? null : h / 2.54;
  const feet = inches === null ? null : Math.floor(inches / 12);
  // Carry a rounded 12-inch remainder to the next foot for display only.
  const remainder = inches === null ? null : Number((inches - feet * 12).toFixed(6));
  const values = { cm: h, 'total-inches': inches, feet: remainder === 12 ? feet + 1 : feet, inches: remainder === 12 ? 0 : remainder };
  for (const [id, value] of Object.entries(values)) {
    if (id === except || (['feet', 'inches'].includes(except) && ['feet', 'inches'].includes(id))) continue;
    $(id).value = value === null ? '' : numberText(value);
  }
}
function weightFields(except = '') {
  if (except !== 'kg') $('kg').value = current.kg === null ? '' : numberText(current.kg);
  if (except !== 'lb') $('lb').value = current.kg === null ? '' : numberText(current.kg / KG_PER_LB);
}
function openPatient(patient) {
  current = patient; current.choices = normalizeChoices(current.choices); current.used = Math.max(Date.now(), ...patients.map(p => p.used + 1));
  inputError = '';
  $('patient-label').value = current.label;
  $('sex').value = current.sex;
  heightFields(); weightFields(); renderBar(); render(); save();
}
function closeArchive() { $('archive').hidden = true; $('archive-toggle').setAttribute('aria-expanded', 'false'); }
function parsed(id) {
  const el = $(id);
  if (el.validity.badInput) return NaN;
  return el.value === '' ? null : Number(el.value);
}
function sync(id) {
  inputError = '';
  if (id === 'sex') current.sex = $('sex').value;
  else if (['cm', 'total-inches', 'feet', 'inches'].includes(id)) {
    let value;
    if (id === 'feet' || id === 'inches') {
      const ft = parsed('feet'), inch = parsed('inches');
      value = ft === null && inch === null ? null : ((ft ?? 0) * 12 + (inch ?? 0)) * 2.54;
      if (![ft, inch].every(x => x === null || (Number.isFinite(x) && x >= 0)) ||
          (ft !== null && !Number.isInteger(ft)) || (inch !== null && inch >= 12)) value = NaN;
    } else {
      value = parsed(id);
      if (value !== null && id === 'total-inches') value *= 2.54;
    }
    if (value !== null && (!Number.isFinite(value) || value <= 0)) inputError = 'Check height · whole feet, inches <12.';
    current.cm = value !== null && Number.isFinite(value) && value > 0 ? value : null;
    heightFields(id);
  } else {
    let value = parsed(id);
    if (value !== null && id === 'lb') value *= KG_PER_LB;
    if (value !== null && (!Number.isFinite(value) || value <= 0)) inputError = 'Enter a positive weight.';
    current.kg = value !== null && Number.isFinite(value) && value > 0 ? value : null;
    weightFields(id);
  }
  current.used = Math.max(Date.now(), ...patients.map(p => p.used + 1));
  save(); render();
}
function render() {
  const result = calculate(current.sex, current.cm, current.kg);
  const invalid = inputError || (current.cm && current.kg && !result ? 'Check height and weight.' : '');
  const message = invalid || (current.cm && current.cm < 152.4 ? 'Height <152.4 cm: check weight formulas.' : '');
  $('input-message').textContent = message;
  $('input-message').hidden = !message;
  $('input-message').classList.toggle('error', Boolean(invalid));
  for (const id of ['tbw', 'ibw', 'pbw', 'lbw', 'adj', 'bmi']) $(id).textContent = result && !invalid ? result[id].toFixed(1) + (id === 'bmi' ? '' : ' kg') : '—';
  if (!result || invalid) {
    $('doses').replaceChildren(); return;
  }
  $('doses').replaceChildren(...doseRows(result, current.choices).map(row => {
    const div = document.createElement('div'); div.className = 'dose-row';
    const label = document.createElement('div'); label.className = 'dose-label';
    const name = document.createElement('span'); name.className = 'dose-name'; name.textContent = row.name;
    const chip = document.createElement('span'); chip.className = `chip c-${row.kind}`; chip.textContent = row.scalar;
    label.append(name);
    if (row.scalar) label.append(chip);
    const value = document.createElement('output'); value.className = 'dose-value'; value.textContent = row.value;
    const note = document.createElement('span'); note.className = 'dose-note'; note.textContent = row.note;
    div.append(label);
    if (row.choice) {
      const select = document.createElement('select');
      select.id = 'choice-' + row.choice; select.className = 'dose-choice';
      select.setAttribute('aria-label', row.name + (row.choice === 'propofol' || row.choice === 'fentanyl' ? ' context' : ' dosing weight'));
      select.append(new Option(row.choice === 'propofol' || row.choice === 'fentanyl' ? 'Select context' : 'Select dosing weight', ''));
      CHOICES[row.choice].forEach(option => select.append(new Option(option.label, option.value)));
      select.value = current.choices[row.choice];
      select.addEventListener('change', () => {
        current.choices[row.choice] = select.value; save(); render(); $('choice-' + row.choice).focus();
      });
      div.append(select);
    }
    div.append(value);
    if (row.note) div.append(note);
    return div;
  }));
}
fields.forEach(id => $(id).addEventListener('input', () => sync(id)));
$('patient-label').addEventListener('input', () => { current.label = $('patient-label').value.trim().slice(0, 24); save(); renderBar(); });
$('patient-select').addEventListener('change', e => { const p = patients.find(p => p.id === e.target.value); if (p) openPatient(p); });
$('new-patient').addEventListener('click', () => {
  closeArchive(); const patient = makePatient();
  patient.used = Math.max(Date.now(), ...patients.map(p => p.used + 1));
  patients = [patient, ...sorted()].slice(0, 100); openPatient(patient); $('patient-label').focus();
});
$('archive-toggle').addEventListener('click', () => { $('archive').hidden = !$('archive').hidden; $('archive-toggle').setAttribute('aria-expanded', String(!$('archive').hidden)); });
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
if (!patients.length) patients.push(makePatient());
openPatient(sorted()[0]);

// Installation and updates are independent from calculations and record storage.
let registration;
let ready = false;
let refreshing = false;
function showOfflineActions() {
  $('offline-controls').hidden = $('update-app').hidden && $('retry-offline').hidden;
}
function offerRetry() {
  $('retry-offline').hidden = false; showOfflineActions();
}
function workerMessage(worker, type) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Offline setup timed out')); }, 30000);
    channel.port1.onmessage = e => { clearTimeout(timer); channel.port1.close(); resolve(e.data); };
    worker.postMessage({ type }, [channel.port2]);
  });
}
async function checkOffline() {
  const worker = navigator.serviceWorker.controller || registration?.active;
  if (!worker) return;
  try {
    const status = await workerMessage(worker, 'STATUS'); ready = status.ready === true;
    $('retry-offline').hidden = ready; showOfflineActions();
  } catch { offerRetry(); }
}
function showUpdate() { $('update-app').hidden = !registration?.waiting; showOfflineActions(); }
function watchRegistration(reg) {
  registration = reg; showUpdate();
  const watch = () => {
    const worker = reg.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate();
        else checkOffline();
      }
      if (worker.state === 'redundant') {
        offerRetry();
      }
    });
  };
  reg.addEventListener('updatefound', watch); watch();
}
async function prepareOffline() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) { return; }
  try {
    const existing = await navigator.serviceWorker.getRegistration('./');
    if (existing) { watchRegistration(existing); await checkOffline(); }
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    if (reg !== existing) watchRegistration(reg);
    await checkOffline();
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  } catch {
    if (registration?.active) await checkOffline();
    else offerRetry();
  }
}
$('retry-offline').addEventListener('click', async () => {
  $('retry-offline').hidden = true; showOfflineActions();
  try {
    if (!registration?.active) { await prepareOffline(); return; }
    await checkOffline();
    if (!ready) {
      const result = await workerMessage(registration.active, 'REPAIR');
      if (!result.ready) throw new Error('Incomplete cache');
      await checkOffline();
    }
    await registration.update();
  } catch { offerRetry(); }
});
$('update-app').addEventListener('click', () => {
  if (!registration?.waiting) return;
  save(); $('update-app').disabled = true; $('update-app').textContent = 'Updating…';
  registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First install claims this page without reloading; a chosen update reloads saved input.
    if ($('update-app').disabled && !refreshing) { refreshing = true; save(); location.reload(); }
    else checkOffline();
  });
}
window.addEventListener('online', checkOffline);
window.addEventListener('offline', checkOffline);
prepareOffline();
