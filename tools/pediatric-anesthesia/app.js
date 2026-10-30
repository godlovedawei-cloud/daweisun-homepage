const $ = id => document.getElementById(id);
const calculator = window.PediatricAnesthesiaCalculator;
const KEY = 'daweisun.pediatric-anesthesia.patients.v1';
const INPUTS = ['ageYears', 'ageMonths', 'weightKg', 'hctInitial', 'hctTarget'];
const inputIds = ['ageY', 'ageM', 'weight', 'hctInitial', 'hctTarget'];
let storageOK = true;

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
      if (!p || typeof p.id !== 'string' || seen.has(p.id) || !p.inputs) return false;
      if (![p.created, p.used].every(Number.isFinite)) return false;
      if (!INPUTS.every(key => typeof p.inputs[key] === 'string' && p.inputs[key].length <= 32 &&
          (p.inputs[key] === '' || Number.isFinite(Number(p.inputs[key]))))) return false;
      seen.add(p.id);
      return true;
    }).map(p => ({ id: p.id, label: typeof p.label === 'string' ? p.label.slice(0, 24) : '',
      inputs: Object.fromEntries(INPUTS.map(key => [key, p.inputs[key]])), created: p.created, used: p.used }))
      .sort((a, b) => b.used - a.used).slice(0, 5);
  } catch {
    storageWarning();
    return [];
  }
}
let patients = readRecords();
let current;
function save() {
  if (!storageOK) return;
  try { localStorage.setItem(KEY, JSON.stringify(patients)); } catch { storageWarning(); }
}
function touch() { current.used = Math.max(Date.now(), ...patients.map(p => p.used + 1)); }
function dateLabel(t) {
  return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function makePatient() {
  const now = Date.now();
  return { id: crypto.randomUUID(), label: '', inputs: Object.fromEntries(INPUTS.map(key => [key, ''])), created: now, used: now };
}
function renderBar() {
  patients.sort((a, b) => b.used - a.used);
  $('patient-select').replaceChildren(...patients.map(p => {
    const age = p.inputs.ageYears !== '' || p.inputs.ageMonths !== '' ? `${p.inputs.ageYears || 0}y ${p.inputs.ageMonths || 0}m` : '';
    const weight = p.inputs.weightKg ? `${p.inputs.weightKg} kg` : '';
    return new Option([p.label || 'Unlabeled', age, weight, dateLabel(p.created)].filter(Boolean).join(' · '), p.id);
  }));
  $('patient-select').value = current.id;
}
function openPatient(patient) {
  current = patient;
  touch();
  $('patient-label').value = current.label;
  calculator.load(current.inputs);
  renderBar(); save();
}
function syncPatient() {
  current.inputs = calculator.read();
  current.label = $('patient-label').value.trim().slice(0, 24);
  touch(); renderBar(); save();
}
for (const id of [...inputIds, 'patient-label']) {
  $(id).addEventListener('input', syncPatient);
  $(id).addEventListener('change', syncPatient);
}
$('resetBtn').addEventListener('click', syncPatient);
$('patient-select').addEventListener('change', event => {
  const patient = patients.find(p => p.id === event.target.value);
  if (patient) openPatient(patient);
});
$('new-patient').addEventListener('click', () => {
  const patient = makePatient();
  patient.used = Math.max(Date.now(), ...patients.map(p => p.used + 1));
  patients = [patient, ...patients].slice(0, 5);
  openPatient(patient); $('patient-label').focus();
});
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
if (!patients.length) patients.push(makePatient());
openPatient(patients[0]);

// Offline installation is isolated from both calculations and patient storage.
let registration;
let ready = false;
let refreshing = false;
function offlineStatus() {
  $('offline-status').textContent = ready ? (navigator.onLine ? 'Available offline' : 'Offline · saved copy') : 'Offline download incomplete';
}
function offerRetry() {
  $('retry-offline').hidden = false;
  offlineStatus();
}
function workerMessage(worker, type) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Offline setup timed out')); }, 30000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
    worker.postMessage({ type }, [channel.port2]);
  });
}
async function checkOffline() {
  const worker = navigator.serviceWorker.controller || registration?.active;
  if (!worker) return;
  try {
    const status = await workerMessage(worker, 'STATUS');
    ready = status.ready === true;
    $('retry-offline').hidden = ready;
    offlineStatus();
  } catch { offerRetry(); }
}
function showUpdate() { $('update-app').hidden = !registration?.waiting; }
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
      if (worker.state === 'redundant') offerRetry();
    });
  };
  reg.addEventListener('updatefound', watch); watch();
}
async function prepareOffline() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    $('offline-status').textContent = 'Offline unavailable in this browser';
    return;
  }
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
  $('retry-offline').hidden = true;
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
    if ($('update-app').disabled && !refreshing) { refreshing = true; save(); location.reload(); }
    else checkOffline();
  });
}
window.addEventListener('online', checkOffline);
window.addEventListener('offline', checkOffline);
prepareOffline();
