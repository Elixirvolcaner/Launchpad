// Mission 2 is one uncrewed launch that deploys all four PUNCH satellites. Other missions keep their crew systems.
import { MISSIONS } from './data.js';
import { drawPerson, onSpritesReady } from './sprites.js';

const earthImage = new Image();
earthImage.src = 'assets/illustrated-earth.webp';

let game, api;
let cheatListenerInstalled = false;
export function configurePunch(state, callbacks) {
  game = state;
  api = callbacks;
  if (!cheatListenerInstalled) {
    window.addEventListener('launchpad-cheat-activated', () => {
      const sim = game?.sim;
      if (!sim?.punch || sim.done) return;
      sim.fuel = Math.max(sim.fuel, sim.fuelNeed * 2);
      sim.temperature = 20; sim.power = 100; sim.signal = 100;
      if (document.getElementById('report')?.classList.contains('open')) renderPunchReport();
    });
    cheatListenerInstalled = true;
  }
}
export const PUNCH_SATS = [
  { name: 'NFI-1', type: 'Narrow Field Imager', mass: 145, task: 'Resolve the inner corona near the Sun' },
  { name: 'WFI-1', type: 'Wide Field Imager', mass: 125, task: 'Track solar wind across the inner heliosphere' },
  { name: 'WFI-2', type: 'Wide Field Imager', mass: 125, task: 'Build a second polarimetric viewpoint' },
  { name: 'WFI-3', type: 'Wide Field Imager', mass: 125, task: 'Complete the four-satellite constellation' },
];
const PUNCH_PAYLOAD = {
  name: 'PUNCH Constellation',
  type: 'Four-satellite solar observatory',
  mass: PUNCH_SATS.reduce((total, sat) => total + sat.mass, 0),
  task: 'Deploy NFI-1 and three Wide Field Imagers into coordinated polar orbits',
};
const VEHICLES = [
  { id: 'electron', name: 'Electron', cost: 42, capacity: 3600 },
  { id: 'alpha', name: 'Firefly Alpha', cost: 54, capacity: 6000 },
  { id: 'falcon9', name: 'Falcon 9', cost: 67, capacity: 12000 },
  { id: 'atlas', name: 'Atlas V', cost: 84, capacity: 18000 },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const phases = ['ASCENT WITH RIDESHARE PAYLOAD', 'POLAR ORBIT INSERTION', 'DEPLOY NFI-1 + WFI-1', 'DEPLOY WFI-2 + WFI-3 & COMMISSION'];
const upgrades = [
  { id: 'thermal', name: 'Thermal blanket', mass: 95, cost: 7, info: 'Reduces heat buildup' },
  { id: 'battery', name: 'Reserve battery', mass: 110, cost: 8, info: 'Keeps the instruments powered' },
  { id: 'antenna', name: 'High-gain antenna', mass: 65, cost: 6, info: 'Strengthens ground link' },
];
const ANOMALIES = [
  { title: 'Radiator temperature spike', category: 'THERMAL', text: 'A radiator is facing the Sun. Component temperature is climbing.',
    choices: [
      { label: 'Rotate satellite away from Sun · cool 32°, spend 9% power', act: s => { s.temperature -= 32; s.power -= 9; } },
      { label: 'Idle imager for cooling · cool 24°, lose 8 science', act: s => { s.temperature -= 24; s.science = Math.max(0, s.science - 8); } },
    ] },
  { title: 'Power bus undervoltage', category: 'POWER', text: 'The electrical bus has dipped below the instrument operating limit.',
    choices: [
      { label: 'Switch to reserve battery · restore 28% power', act: s => { s.power += s.upgrades.includes('battery') ? 38 : 28; } },
      { label: 'Shed instrument load · restore 22%, lose 10 science', act: s => { s.power += 22; s.science = Math.max(0, s.science - 10); } },
    ] },
  { title: 'Ground link interrupted', category: 'COMMS', text: 'The spacecraft is drifting out of the ground station antenna beam.',
    choices: [
      { label: 'Re-point the antenna · restore 34% signal, spend 8% power', act: s => { s.signal += 34; s.power -= 8; } },
      { label: 'Request relay handover · restore 25% signal, lose 6 science', act: s => { s.signal += 25; s.science = Math.max(0, s.science - 6); } },
    ] },
];
function campaign() {
  if (!game.punch) {
    try {
      const saved = JSON.parse(localStorage.getItem('launchpad_punch') || 'null');
      const savedComplete = saved && Array.isArray(saved.completed) && saved.completed.length === PUNCH_SATS.length
        && PUNCH_SATS.every((sat, i) => saved.completed[i]?.satellite === sat.name
          && VEHICLES.some(vehicle => vehicle.id === saved.completed[i]?.rocket));
      const completed = savedComplete
        ? PUNCH_SATS.map((sat, i) => ({ satellite: sat.name, rocket: saved.completed[i].rocket }))
        : [];
      if (saved && !savedComplete) localStorage.removeItem('launchpad_punch');
      game.punch = { completed };
    } catch { game.punch = { completed: [] }; }
  }
  return game.punch;
}
export function showPunchPlanner() {
  const run = campaign();
  if (run.completed.length === PUNCH_SATS.length) { run.completed = []; localStorage.setItem('launchpad_punch', JSON.stringify(run)); }
  const sat = PUNCH_PAYLOAD;
  const p = { rocket: VEHICLES[0].id, upgrades: [], fuel: 0, locked: false };
  const div = api.panel('', 'pixel-panel punch-planner planner');
  function calculate() {
    const vehicle = VEHICLES.find(v => v.id === p.rocket);
    const dry = 710 + sat.mass + p.upgrades.reduce((sum, id) => sum + upgrades.find(u => u.id === id).mass, 0);
    const recommended = Math.ceil(dry * 1.55 / 50) * 50;
    const cost = vehicle.cost + 9 + p.upgrades.reduce((sum, id) => sum + upgrades.find(u => u.id === id).cost, 0) + p.fuel * .002;
    return { vehicle, dry, recommended, cost, total: dry + p.fuel };
  }
  function render() {
    const c = calculate();
    const budget = game.cheats?.infiniteMoney ? Infinity : Math.max(0, MISSIONS[1].budget + (game.career?.fundingBonus || 0) - (game.career?.budgetPenalty || 0));
    const budgetReadout = game.cheats?.infiniteMoney ? '∞' : `$${budget.toFixed(1)}M`;
    const valid = p.locked && c.total <= c.vehicle.capacity && c.cost <= budget && p.fuel >= c.recommended;
    div.innerHTML = `<div class="punch-kicker">FLIGHT OPERATIONS / PUNCH CONSTELLATION / SINGLE LAUNCH</div>
      <h2>PREPARE THE FOUR-SATELLITE PAYLOAD</h2>
      <p>One uncrewed rocket carries all four observatories. After polar-orbit insertion, deploy them in pairs and commission the constellation.</p>
      <div class="punch-flightstrip">${PUNCH_SATS.map(x => `<span class="done">✓ ${x.name} · LOADED</span>`).join('')}</div>
      <div class="punch-grid"><section><h3>01 / PAYLOAD MANIFEST · ${sat.mass} KG</h3>
        ${PUNCH_SATS.map(x => `<div class="punch-option"><b>${x.name}</b> <small>${x.type} · ${x.mass} kg · ${x.task}</small></div>`).join('')}
        <h3>02 / SPACECRAFT SYSTEMS</h3>
        ${upgrades.map(x => `<label class="punch-option ${p.upgrades.includes(x.id) ? 'selected' : ''}"><input type="checkbox" class="p-upgrade" value="${x.id}" ${p.upgrades.includes(x.id) ? 'checked' : ''} ${p.locked ? 'disabled' : ''}> ${x.name} <small>+${x.mass} kg · $${x.cost}M · ${x.info}</small></label>`).join('')}
      </section><section><h3>03 / ASSIGN ONE LAUNCH VEHICLE</h3>
        ${VEHICLES.map(x => `<label class="punch-option ${p.rocket === x.id ? 'selected' : ''}"><input type="radio" name="vehicle" value="${x.id}" ${p.rocket === x.id ? 'checked' : ''} ${p.locked ? 'disabled' : ''}> ${x.name} <small>${x.capacity.toLocaleString()} kg limit · $${x.cost}M</small></label>`).join('')}
        <h3>04 / PROPULSION</h3>
        <p class="punch-readout">Dry mass ${c.dry.toLocaleString()} kg · remaining funds <b>${budgetReadout}</b></p>
        <small class="punch-funding-note">Funds: $${MISSIONS[1].budget}M starting + $${Number(game.career?.fundingBonus || 0).toFixed(0)}M earned career grants · +$${MISSIONS[1].careerReward}M career reward after commissioning.</small>
        ${p.locked ? `<p class="punch-readout">Recommended fuel <b>${c.recommended.toLocaleString()} kg</b></p><input type="range" id="p-fuel" min="0" max="${Math.ceil(c.recommended * 1.35 / 50) * 50}" step="50" value="${p.fuel}"><p class="punch-readout">Loaded fuel: <b>${p.fuel.toLocaleString()} kg</b> ${p.fuel < c.recommended ? '· ⚠ under recommendation' : '· nominal'}</p><button class="btn small" id="p-rec">USE RECOMMENDED</button><button class="btn small" id="p-edit">EDIT VEHICLE & SYSTEMS</button>` : `<p>Seal the four-satellite manifest before calculating fuel.</p><button class="btn" id="p-lock">LOCK MANIFEST → CALCULATE FUEL</button>`}
        <div class="punch-totals">Lift mass <b>${c.total.toLocaleString()} / ${c.vehicle.capacity.toLocaleString()} kg</b><br>Operation cost <b>$${c.cost.toFixed(1)} / ${budgetReadout}</b></div>
      </section></div><div class="footer"><button class="btn" id="p-cancel">CANCEL</button><span class="warn">${c.total > c.vehicle.capacity ? 'Vehicle overloaded. ' : ''}${c.cost > budget ? 'Budget exceeded. ' : ''}${p.locked && p.fuel < c.recommended ? 'Fuel is below the recommended mission minimum.' : ''}</span><button class="btn big" id="p-final" ${valid ? '' : 'disabled'}>AUTHORIZE SINGLE LAUNCH ✓</button></div>`;
    div.querySelectorAll('input[name=vehicle]').forEach(i => i.onchange = () => { p.rocket = i.value; api.hooks.onRocketPreview?.(i.value); render(); });
    div.querySelectorAll('.p-upgrade').forEach(i => i.onchange = () => { p.upgrades = i.checked ? [...p.upgrades, i.value] : p.upgrades.filter(v => v !== i.value); render(); });
    const lock = div.querySelector('#p-lock'); if (lock) lock.onclick = () => { p.locked = true; p.fuel = c.recommended; api.hooks.onBlip(); render(); };
    const fuel = div.querySelector('#p-fuel'); if (fuel) fuel.onchange = () => { p.fuel = Number(fuel.value); render(); };
    const rec = div.querySelector('#p-rec'); if (rec) rec.onclick = () => { p.fuel = c.recommended; render(); };
    const edit = div.querySelector('#p-edit'); if (edit) edit.onclick = () => { p.locked = false; p.fuel = 0; render(); };
    div.querySelector('#p-cancel').onclick = () => {
      api.hooks.onRocketPreview?.(null);
      window.removeEventListener('launchpad-cheat-activated', refreshForCheat);
      api.closePanel(div);
    };
    div.querySelector('#p-final').onclick = () => {
      if (!valid) return;
      window.removeEventListener('launchpad-cheat-activated', refreshForCheat);
      game.plan = { punch: true, rocket: p.rocket, calc: { rocket: { id: c.vehicle.id, name: c.vehicle.name }, m: MISSIONS[1], dryKg: c.dry, totalKg: c.total, liftCapacity: c.vehicle.capacity, recFuel: c.recommended }, sat, upgrades: [...p.upgrades], fuel: p.fuel, cost: c.cost };
      api.closePanel(div); api.hooks.onPlanned(game.plan);
      api.toast('Four-satellite PUNCH manifest approved. One launch vehicle is en route to the pad.');
    };
  }
  const refreshForCheat = () => { if (div.isConnected) render(); else window.removeEventListener('launchpad-cheat-activated', refreshForCheat); };
  window.addEventListener('launchpad-cheat-activated', refreshForCheat);
  api.hooks.onRocketPreview?.(p.rocket);
  render();
}
export function launchPunch() {
  const p = game.plan;
  game.launched = true;
  const noDebuffs = !!game.cheats?.noDebuffs;
  game.sim = { punch: true, mission: MISSIONS[1], sat: p.sat, cameraSat: PUNCH_SATS[0], deployed: [], vehicle: p.calc.rocket.name, phase: 0,
    fuel: noDebuffs ? Math.max(p.fuel, p.calc.recFuel * 2) : p.fuel, fuelNeed: p.calc.recFuel, power: noDebuffs ? 100 : p.upgrades.includes('battery') ? 92 : 76,
    temperature: noDebuffs ? 20 : p.upgrades.includes('thermal') ? 22 : 32, signal: noDebuffs ? 100 : p.upgrades.includes('antenna') ? 96 : 78,
    science: 0, upgrades: p.upgrades, anomaly: null, triggered: false, tab: 'log', done: false,
    lines: [`LIFTOFF · ${PUNCH_SATS.length} PUNCH satellites aboard one ${p.calc.rocket.name}. No crew aboard.`, 'Flight director: monitor thermal, electrical and communications telemetry.'] };
}
function checkFlight() {
  const s = game.sim;
  if (s.fuel < 0) return finishFlight(false, 'Propellant exhausted before polar orbit insertion.');
  if (s.temperature >= 100) return finishFlight(false, 'Thermal runaway damaged the satellite imager.');
  if (s.power <= 0) return finishFlight(false, 'Battery bus depleted; satellite could not commission.');
  if (s.signal <= 0) return finishFlight(false, 'Ground contact was lost during commissioning.');
  return false;
}
function advance() {
  const s = game.sim;
  if (s.anomaly) { api.toast('Resolve the active anomaly before continuing.'); s.tab = 'anomaly'; renderPunchReport(); return; }
  if (s.phase >= 4) return;
  const noDebuffs = !!game.cheats?.noDebuffs;
  if (noDebuffs) {
    s.fuel = Math.max(s.fuel, s.fuelNeed * 2);
    s.temperature = 20;
    s.power = 100;
    s.signal = 100;
  } else {
    const burn = s.phase < 2 ? s.fuelNeed * .28 : s.fuelNeed * .02;
    s.fuel -= burn;
    s.temperature += (s.upgrades.includes('thermal') ? 4 : 8) + (s.phase === 0 ? 5 : 0);
    s.power -= s.upgrades.includes('battery') ? 3 : 6;
    s.signal -= s.upgrades.includes('antenna') ? 3 : 5;
  }
  s.science += s.phase >= 2 ? 25 : 8;
  s.phase++;
  if (s.phase === 3) s.deployed.push(...PUNCH_SATS.slice(0, 2).map(sat => sat.name));
  if (s.phase === 4) s.deployed.push(...PUNCH_SATS.slice(2).map(sat => sat.name));
  s.lines.unshift(`PHASE ${s.phase}/4 · ${phases[s.phase - 1]} · telemetry received.`);
  if (s.phase >= 3) s.lines.unshift(`DEPLOYMENT CONFIRMED · ${s.deployed.join(', ')}.`);
  api.toast(s.phase >= 3 ? 'PUNCH satellites deploying from the single launch vehicle.' : 'PUNCH rideshare launch telemetry received. Check the cameras!');
  if (s.phase === 3 || s.phase === 4) api.hooks.onSeparation?.();
  if (checkFlight()) return;
  if (s.phase === 2 && !s.triggered) {
    s.triggered = true;
    const pool = ANOMALIES.filter(e => e.category !== (s.upgrades.includes('thermal') ? 'THERMAL' : 'NONE'));
    s.anomaly = pool[Math.floor(Math.random() * pool.length)];
    if (!game.cheats?.noDebuffs) {
      if (s.anomaly.category === 'THERMAL') s.temperature += 8;
      if (s.anomaly.category === 'POWER') s.power -= 12;
      if (s.anomaly.category === 'COMMS') s.signal -= 12;
    }
    if (checkFlight()) return;
    api.hooks.onAnomaly?.();
    s.lines.unshift(`⚠ ${s.anomaly.title.toUpperCase()} · Mission Control decision required.`);
    s.tab = 'anomaly';
  }
  if (s.phase >= 4 && !s.anomaly) return finishFlight(true, 'All four PUNCH satellites are commissioned and transmitting polarimetric solar-wind data from coordinated polar orbits.');
  renderPunchReport();
}
function finishFlight(success, reason, aborted = false) {
  const s = game.sim;
  if (s.done) return true;
  s.done = true; s.success = success; s.aborted = aborted; s.lost = !success && !aborted;
  s.reason = s.lost ? `Distress call received. ${reason} Tracking signal lost.` : reason;
  s.penalty = success ? 0 : api.onLoss(aborted);
  if (success) api.hooks.onSuccess?.();
  let careerReward = 0;
  if (success) {
    const run = campaign();
    run.completed = PUNCH_SATS.map(sat => ({ satellite: sat.name, rocket: game.plan.rocket }));
    careerReward = Math.max(0, Number(MISSIONS[1].careerReward) || 0);
    if (careerReward) api.grantFunding?.(careerReward);
    localStorage.setItem('launchpad_punch', JSON.stringify(run));
    if (game.unlocked < 3) {
      game.unlocked = 3;
      localStorage.setItem('launchpad_unlocked', game.unlocked);
    }
  }
  s.careerReward = careerReward;
  api.hooks.onBlip(); renderPunchReport();
  return true;
}
export function showPunchReport() {
  document.getElementById('report').classList.add('open');
  api.hooks.onModal(true);
  renderPunchReport();
}
export function renderPunchReport() {
  const s = game.sim;
  if (!s?.punch || !document.getElementById('report').classList.contains('open')) return;
  const r = document.getElementById('report');
  const run = campaign();
  const meter = (label, value, color, inverted = false) => `<div class="punch-meter"><span>${label}</span><b style="color:${color}">${Math.round(value)}${label === 'TEMPERATURE' ? '°C' : '%'}</b><div class="track"><i style="width:${clamp(value, 0, 100)}%;background:${color}"></i></div><small>${inverted ? 'CRITICAL ABOVE 100°C' : 'CRITICAL AT 0%'}</small></div>`;
  if (s.done) {
    r.innerHTML = `<div class="rp-head"><span>PUNCH / SINGLE-LAUNCH MISSION</span><button id="p-rp-close">✕</button></div><div class="punch-result"><div class="punch-kicker">MISSION CONTROL · FLIGHT DISPOSITION</div><h2>${s.success ? 'CONSTELLATION ONLINE' : s.aborted ? 'PAYLOAD STACK RECALLED' : 'LAUNCH LOST'}</h2><div class="grade">${s.success ? (s.power > 45 && s.signal > 45 ? 'A' : 'B') : s.aborted ? '—' : 'F'}</div>${s.success ? '<div class="chicken-celebration" role="img" aria-label="The chicken astronaut celebrates the mission grade"><canvas class="chicken-dance" id="punch-grade-chicken" width="96" height="144"></canvas><b>CHICKEN ASTRONAUT · MISSION ACE!</b></div>' : ''}<p>${s.reason}</p><p>${s.success ? 'All four satellites deployed and commissioned from one launch.' : `Career budget reduced by $${s.penalty}M.`}</p>${s.careerReward ? `<p>Constellation completion award: +$${s.careerReward}M for future mission budgets.</p>` : ''}<p>One launch · ${run.completed.length}/4 spacecraft online · Science ${s.science} pts</p><p>${s.success ? 'All four PUNCH satellites are online after one launch. The next mission is unlocked.' : 'Reconfigure the single-launch vehicle and retry the complete constellation deployment.'}</p><button class="btn big" id="p-return">RETURN TO OPERATIONS</button></div>`;
    const chickenCanvas = r.querySelector('#punch-grade-chicken');
    if (chickenCanvas) {
      const drawChicken = () => {
        if (!chickenCanvas.isConnected) return;
        const context = chickenCanvas.getContext('2d');
        context.clearRect(0, 0, chickenCanvas.width, chickenCanvas.height);
        drawPerson(context, { chicken: true }, 6, 0, 0);
      };
      drawChicken();
      onSpritesReady(drawChicken);
    }
    r.querySelector('#p-rp-close').onclick = () => { r.classList.remove('open'); api.hooks.onModal(!!document.querySelector('#ui-container .modal')); };
    r.querySelector('#p-return').onclick = () => {
      r.classList.remove('open'); document.querySelector('#ui-container .mc-room')?.remove();
      game.launched = false; game.plan = null; game.sim = null;
      api.restoreReport(); api.hooks.onModal(false); api.hooks.onMissionEnd?.();
      api.toast(run.completed.length === PUNCH_SATS.length ? 'All four PUNCH satellites are online after one launch. Mission complete!' : 'Visit Mission Control to plan the single PUNCH constellation launch.');
    };
    return;
  }
  const content = s.tab === 'log' ? `<h3>FLIGHT DIRECTOR LOG · SINGLE LAUNCH</h3>${s.lines.map(x => `<p class="punch-line">${x}</p>`).join('')}<p>Payload stack: ${s.sat.type} · ${s.sat.task}.</p><p>Manifest: ${PUNCH_SATS.map(sat => sat.name).join(' · ')} aboard the same launch vehicle.</p>`
    : s.tab === 'telemetry' ? `<h3>UNCREWED SPACECRAFT TELEMETRY</h3><div class="punch-meters">${meter('TEMPERATURE', s.temperature, s.temperature > 75 ? '#ff806d' : '#ffc16c', true)}${meter('POWER', s.power, s.power < 30 ? '#ff806d' : '#7dffb0')}${meter('SIGNAL', s.signal, s.signal < 30 ? '#ff806d' : '#86d9ff')}</div><p>Propellant remaining: ${Math.max(0, Math.round(s.fuel)).toLocaleString()} kg · science received: ${s.science} pts</p>`
    : s.tab === 'trajectory' ? `<h3>POLAR INSERTION · LIVE TRACK</h3><canvas class="route-canvas" width="900" height="500"></canvas><p>Bright cyan dots: travelled path · dim blue dots: projected path · arrow: direction of travel.</p>`
    : s.tab === 'constellation' ? `<h3>4-SATELLITE HELIOSPHERIC CONSTELLATION OVERVIEW</h3><canvas class="punch-constellation-canvas" width="900" height="500"></canvas><p>All 4 PUNCH polar orbiters work in tandem to reconstruct 3D solar wind structures from the solar corona to Earth orbit.</p>`
    : `<h3>ANOMALY RESPONSE</h3>${s.anomaly ? `<div class="punch-alert"><b>${s.anomaly.category} · ${s.anomaly.title}</b><p>${s.anomaly.text}</p>${s.anomaly.choices.map((c, i) => `<button class="btn choice" data-pick="${i}">${c.label}</button>`).join('')}</div>` : '<p class="ok">No outstanding anomaly. Systems nominal.</p>'}`;
  r.innerHTML = `<div class="rp-head"><span>PUNCH · ONE LAUNCH · FOUR-SATELLITE REPORT</span><span>PHASE ${s.phase} OF 4</span><div class="rp-actions"><button class="btn small obs-btn-glow" id="p-check-cams" style="margin-right:6px;">📹 CHECK THE CAMERAS</button><button id="p-abort">ABORT / RECALL</button><button id="p-rp-close">✕</button></div></div><div class="punch-report-body"><div class="punch-report-main"><div class="punch-kicker">LIVE TELEMETRY · ${s.vehicle.toUpperCase()}</div>${content}</div><aside class="punch-report-nav">${[['log','FLIGHT LOG'],['telemetry','TELEMETRY'],['trajectory','TRAJECTORY'],['constellation','CONSTELLATION'],['anomaly',s.anomaly ? '⚠ ANOMALY' : 'ANOMALY']].map(([id,label]) => `<button data-tab="${id}" class="${s.tab === id ? 'on' : ''}">${label}</button>`).join('')}<button id="p-advance" ${s.anomaly ? 'disabled' : ''}>${s.phase === 0 ? 'BEGIN ASCENT' : 'ADVANCE PHASE'} ▶</button></aside></div>`;
  r.querySelector('#p-rp-close').onclick = () => { r.classList.remove('open'); api.hooks.onModal(!!document.querySelector('#ui-container .modal')); };
  r.querySelector('#p-check-cams').onclick = () => { api.hooks?.onBlip?.(); api.showObservationView?.('punch', 'cam1'); };
  r.querySelector('#p-abort').onclick = () => finishFlight(false, 'Flight Director recalled the four-satellite payload stack before deployment.', true);
  r.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { s.tab = b.dataset.tab; api.hooks.onBlip(); renderPunchReport(); });
  r.querySelector('#p-advance').onclick = advance;
  r.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    const anomaly = s.anomaly;
    const scienceBefore = s.science;
    anomaly.choices[Number(b.dataset.pick)].act(s);
    if (game.cheats?.noDebuffs) {
      s.science = Math.max(s.science, scienceBefore);
      s.fuel = Math.max(s.fuel, s.fuelNeed * 2);
      s.temperature = 20; s.power = 100; s.signal = 100;
    } else {
      s.temperature = Math.max(0, s.temperature);
      s.power = clamp(s.power, 0, 100);
      s.signal = clamp(s.signal, 0, 100);
    }
    s.lines.unshift(`RESOLVED · ${anomaly.title}: ${anomaly.choices[Number(b.dataset.pick)].label.split(' · ')[0]}.`);
    s.anomaly = null; s.tab = 'telemetry'; api.hooks.onBlip();
    if (!checkFlight()) renderPunchReport();
  });
  r.querySelectorAll('.route-canvas').forEach(cv => drawPunchRoute(cv, performance.now(), s));
  r.querySelectorAll('.punch-constellation-canvas').forEach(cv => drawPunchConstellation(cv, performance.now(), run));
}
export function drawPunchRoute(cv, time, s = game.sim) {
  if (!s?.punch) return;
  const g = cv.getContext('2d'), w = cv.width, h = cv.height, progress = s.phase / 4;
  const canvasFont = (size, weight = '') => `${weight ? `${weight} ` : ''}${size * 900 / Math.max(1, cv.clientWidth || 900)}px Pixelify Sans, Arial, sans-serif`;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(3, 15, 35, .62)'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 65; i++) { g.fillStyle = `rgba(170,214,255,${.2 + i % 4 * .1})`; g.fillRect((i * 173) % w, (i * 97) % h, 2, 2); }
  const scale = Math.min(w / 900, h / 500), ox = (w - 900 * scale) / 2, oy = (h - 500 * scale) / 2;
  g.save(); g.translate(ox, oy); g.scale(scale, scale);
  if (earthImage.complete && earthImage.naturalWidth) {
    g.save();
    g.shadowColor = '#49bfff';
    g.shadowBlur = 18;
    g.drawImage(earthImage, 220 - 92, 270 - 92, 184, 184);
    g.restore();
  } else {
    const earth = g.createRadialGradient(195, 270, 3, 220, 270, 92);
    earth.addColorStop(0, '#82d6f6'); earth.addColorStop(.55, '#255da4'); earth.addColorStop(1, '#102c62');
    g.fillStyle = earth; g.beginPath(); g.arc(220, 270, 92, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#ffd16d'; g.beginPath(); g.arc(850, 110, 25, 0, Math.PI * 2); g.fill();
  g.font = canvasFont(18); g.fillStyle = '#9cdfff'; g.fillText('EARTH', 180, 389); g.fillStyle = '#ffd16d'; g.fillText('SUN', 827, 158);
  g.font = canvasFont(14); g.fillStyle = '#9cdfff'; g.fillText(`SINGLE LAUNCH · PHASE ${s.phase}/4`, 30, 34);
  // Quadratic ascent followed by a visibly polar orbit insertion arc.
  const point = t => {
    if (t < .22) {
      const u = t / .22;
      return { x: (1 - u) ** 2 * 285 + 2 * (1 - u) * u * 410 + u * u * 220,
        y: (1 - u) ** 2 * 350 + 2 * (1 - u) * u * 205 + u * u * 82 };
    }
    const a = -Math.PI / 2 + ((t - .22) / .78) * Math.PI * 2 * 1.25;
    return { x: 220 + Math.cos(a) * 290, y: 270 + Math.sin(a) * 185 };
  };
  // Dashed/dotted path shows the planned polar insertion and sun-synchronous orbit.
  g.save();
  g.setLineDash([2, 6]);
  g.strokeStyle = 'rgba(143, 226, 255, 0.76)';
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= 140; i++) {
    const p = point(i / 140);
    if (i === 0) g.moveTo(p.x, p.y);
    else g.lineTo(p.x, p.y);
  }
  g.stroke();
  g.restore();
  // Dots are split at the actual position. Faded dots show the projected route.
  for (let i = 0; i <= 100; i++) {
    const t = i / 100, p = point(t);
    g.beginPath(); g.arc(p.x, p.y, t <= progress ? 3.2 : 2.2, 0, Math.PI * 2);
    g.fillStyle = t <= progress ? '#8ff1ff' : 'rgba(113,167,205,.48)'; g.fill();
  }
  const p = point(progress), q = point(Math.min(.99, progress + .01)), angle = Math.atan2(q.y - p.y, q.x - p.x);
  g.save(); g.translate(p.x, p.y); g.rotate(angle); g.fillStyle = '#fff2bd';
  g.beginPath(); g.moveTo(13, 0); g.lineTo(-10, -7); g.lineTo(-6, 0); g.lineTo(-10, 7); g.closePath(); g.fill(); g.restore();
  g.strokeStyle = '#8ff1ff'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, 17 + Math.sin(time / 300) * 2, 0, Math.PI * 2); g.stroke();
  g.font = canvasFont(14); g.fillStyle = '#fff'; g.fillText(s.sat.name, Math.min(740, p.x + 19), Math.max(48, p.y - 14));
  g.fillStyle = '#91d6ef'; g.fillText('POLAR ORBIT · ~650 KM', 510, 430);
  g.fillStyle = '#bdefff'; g.font = canvasFont(11); g.fillText('DOTTED LINE = PLANNED TRAJECTORY · CYAN = COMPLETED', 30, 475);
  if (s.lost) {
    g.fillStyle = 'rgba(2, 8, 24, .96)'; g.fillRect(0, 0, 900, 500);
    g.fillStyle = '#ff8c85'; g.font = canvasFont(22);
    g.fillText('DISTRESS CALL · SIGNAL LOST', 165, 250);
  }
  g.restore();
}
export function drawPunchCamera(cv, time, mode, s = game.sim) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  const canvasFont = size => `${size * w / Math.max(1, cv.clientWidth || w)}px Pixelify Sans, Arial, sans-serif`;
  const payloadView = mode === 'cabin';
  const sat = s?.cameraSat || PUNCH_SATS[0];
  const narrow = sat.type.includes('Narrow');
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#030a18'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 38; i++) {
    g.fillStyle = `rgba(178,219,255,${.22 + (i % 4) * .12})`;
    g.fillRect((i * 79) % w, (i * 47) % h, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }

  if (!payloadView) {
    // EXTERIOR: show the full spacecraft against the Earth limb and Sun.
    const ex = w * .11, ey = h * 1.12, er = h * .72;
    const earth = g.createRadialGradient(ex - er * .25, ey - er * .3, 2, ex, ey, er);
    earth.addColorStop(0, '#8ee2ff'); earth.addColorStop(.42, '#2772b8'); earth.addColorStop(1, '#0b1f4a');
    g.fillStyle = earth; g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.fill();
    const sx = w * .84, sy = h * .22, sr = Math.min(w, h) * .12;
    const sunGlow = g.createRadialGradient(sx, sy, 2, sx, sy, sr * 2.4);
    sunGlow.addColorStop(0, '#fff5be'); sunGlow.addColorStop(.25, '#ffc85a'); sunGlow.addColorStop(1, 'rgba(255,153,45,0)');
    g.fillStyle = sunGlow; g.beginPath(); g.arc(sx, sy, sr * 2.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe28b'; g.beginPath(); g.arc(sx, sy, sr * .52, 0, Math.PI * 2); g.fill();

    const unit = Math.min(w / 360, h / 240);
    g.save(); g.translate(w * .52, h * .53); g.rotate(Math.sin(time / 2100) * .035); g.scale(unit, unit);
    g.fillStyle = '#315d83'; g.fillRect(-135, -33, 94, 68); g.fillRect(41, -33, 94, 68);
    g.strokeStyle = '#9edafa'; g.lineWidth = 2;
    for (const x of [-135, -104, -73, 41, 72, 103, 135]) { g.beginPath(); g.moveTo(x, -33); g.lineTo(x, 35); g.stroke(); }
    g.fillStyle = '#dae4e9'; g.fillRect(-35, -32, 70, 65);
    g.fillStyle = '#a5bcc7'; g.fillRect(-23, -48, 46, 16);
    g.fillStyle = '#141d2c'; g.beginPath(); g.arc(0, 0, 21, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7edaff'; g.beginPath(); g.arc(0, 0, 13, 0, Math.PI * 2); g.fill();
    g.restore();
    g.font = canvasFont(12); g.fillStyle = '#a4e6ff';
    g.fillText('EXTERIOR · FULL SPACECRAFT', 12, 20);
    g.fillText(`${sat.name} · POLAR ORBIT`, 12, h - 12);
  } else {
    // PAYLOAD: an instrument image, deliberately unlike the exterior vehicle view.
    g.fillStyle = '#07182a'; g.fillRect(10, 29, w - 20, h - 58);
    g.strokeStyle = '#246083'; g.lineWidth = 1; g.strokeRect(10, 29, w - 20, h - 58);
    const cx = narrow ? w * .50 : w * .23;
    const cy = h * .54;
    const r = Math.min(w, h) * (narrow ? .13 : .095);
    const halo = g.createRadialGradient(cx, cy, r * .72, cx, cy, r * (narrow ? 2.4 : 1.6));
    halo.addColorStop(0, 'rgba(255,244,190,.95)'); halo.addColorStop(.35, 'rgba(255,190,78,.62)'); halo.addColorStop(1, 'rgba(255,119,44,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, r * (narrow ? 2.4 : 1.6), 0, Math.PI * 2); g.fill();
    if (narrow) {
      // Coronagraph occulting disk blocks the solar surface so the faint corona is visible.
      for (let i = 0; i < 24; i++) {
        const a = i * Math.PI * 2 / 24 + Math.sin(time / 1100 + i) * .025;
        const inner = r * 1.12, outer = r * (1.7 + .45 * (.5 + .5 * Math.sin(i * 4.2)));
        g.strokeStyle = `rgba(255,218,137,${.16 + (i % 3) * .08})`; g.lineWidth = 1;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        g.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer); g.stroke();
      }
      g.fillStyle = '#080b13'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffd987'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r * 1.08, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#d9ecff'; g.font = canvasFont(12);
      g.fillText('OCCULTED SOLAR DISK', Math.max(14, cx - 58), cy + r * 2.15);
    } else {
      // Wide-field sensor: the corona at left, solar-wind streamers extending toward Earth.
      g.fillStyle = '#ffcf6c'; g.beginPath(); g.arc(cx, cy, r * .65, 0, Math.PI * 2); g.fill();
      for (let i = -3; i <= 3; i++) {
        g.strokeStyle = `rgba(119,207,255,${.18 + (3 - Math.abs(i)) * .08})`;
        g.lineWidth = 1 + (i === 0 ? 1 : 0);
        g.beginPath(); g.moveTo(cx + r * .55, cy + i * 4);
        g.bezierCurveTo(w * .48, cy + i * 9 - 8, w * .62, h * .48 + i * 8, w * .79, h * .48 + i * 7);
        g.stroke();
      }
      const ex = w * .79, ey = h * .48;
      g.fillStyle = '#64b9f4'; g.beginPath(); g.arc(ex, ey, 7, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#91dbff'; g.beginPath(); g.arc(ex, ey, 11, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#cdeeff'; g.font = canvasFont(12); g.fillText('EARTH', ex - 16, ey + 24);
    }
    // Scope reticle and small live-data footer.
    g.strokeStyle = 'rgba(127,212,255,.42)'; g.setLineDash([3, 4]);
    g.beginPath(); g.moveTo(w * .08, cy); g.lineTo(w * .92, cy); g.moveTo(cx, h * .18); g.lineTo(cx, h * .86); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#a4e6ff'; g.font = canvasFont(12);
    g.fillText(narrow ? 'PAYLOAD FEED · NFI INNER-CORONA IMAGER' : 'PAYLOAD FEED · WFI WIDE-FIELD IMAGER', 12, 20);
    g.fillStyle = '#9cdfff'; g.font = canvasFont(12);
    g.fillText(`${sat.name} · ${narrow ? 'CORONAGRAPH / INNER CORONA' : 'SOLAR WIND / HELIOSPHERE'}`, 14, h - 12);
  }
  g.strokeStyle = payloadView ? '#ffc86b' : '#7fd4ff';
  g.lineWidth = 1.5; g.strokeRect(6, 6, w - 12, h - 12);
}

export function drawPunchConstellation(cv, time, run = campaign()) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  const canvasFont = (size, weight = '') => `${weight ? `${weight} ` : ''}${size * 900 / Math.max(1, cv.clientWidth || 900)}px Pixelify Sans, Arial, sans-serif`;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(2, 8, 24, .88)'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 75; i++) {
    g.fillStyle = `rgba(180,225,255,${0.2 + (i % 5) * 0.15})`;
    g.fillRect((i * 131) % w, (i * 73 + i * i) % h, 1.5, 1.5);
  }
  const compact = (cv.clientWidth || w) < 520;
  const activeDeployment = game.sim?.punch && !game.sim.done ? game.sim.deployed || [] : [];
  const scale = Math.min(w / 900, h / 500);
  const ox = (w - 900 * scale) / 2, oy = (h - 500 * scale) / 2;
  g.save(); g.translate(ox, oy); g.scale(scale, scale);

  const cx = 350, cy = 250;
  const sx = 810, sy = 250;

  // Streaming solar wind from Sun to Earth
  const windOffset = (time / 30) % 40;
  g.setLineDash([12, 18]);
  g.lineDashOffset = -windOffset;
  g.lineWidth = 1.5;
  for (let k = -4; k <= 4; k++) {
    const y0 = sy + k * 35;
    const y1 = cy + k * 45;
    g.strokeStyle = `rgba(255, 215, 100, ${0.15 + (4 - Math.abs(k)) * 0.05})`;
    g.beginPath(); g.moveTo(sx - 35, y0); g.lineTo(cx + 90, y1); g.stroke();
  }
  g.setLineDash([]);

  // Sun
  const sunGlow = g.createRadialGradient(sx, sy, 5, sx, sy, 70);
  sunGlow.addColorStop(0, '#ffffff');
  sunGlow.addColorStop(0.2, '#ffe066');
  sunGlow.addColorStop(0.6, 'rgba(255, 150, 40, 0.4)');
  sunGlow.addColorStop(1, 'rgba(255, 100, 20, 0)');
  g.fillStyle = sunGlow; g.beginPath(); g.arc(sx, sy, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffdf70'; g.beginPath(); g.arc(sx, sy, 26, 0, Math.PI * 2); g.fill();
  g.font = canvasFont(14); g.fillStyle = '#ffd16d'; g.fillText('SUN', sx - 13, sy + 44);

  // Earth
  if (earthImage.complete && earthImage.naturalWidth) {
    g.save();
    g.shadowColor = '#49bfff'; g.shadowBlur = 24;
    g.drawImage(earthImage, cx - 70, cy - 70, 140, 140);
    g.restore();
  } else {
    const earthGlow = g.createRadialGradient(cx - 20, cy - 20, 4, cx, cy, 70);
    earthGlow.addColorStop(0, '#a5e5ff'); earthGlow.addColorStop(0.5, '#2260a8'); earthGlow.addColorStop(1, '#0c224b');
    g.fillStyle = earthGlow; g.beginPath(); g.arc(cx, cy, 70, 0, Math.PI * 2); g.fill();
  }
  g.font = canvasFont(14); g.fillStyle = '#9cdfff'; g.fillText('EARTH', cx - 24, cy + 92);

  // 4 Polar Orbit Planes
  const planes = [
    { tilt: -0.42, color: '#38d9a9', name: 'NFI-1' },
    { tilt: -0.14, color: '#4dabf7', name: 'WFI-1' },
    { tilt: 0.14, color: '#ffa94d', name: 'WFI-2' },
    { tilt: 0.42, color: '#ff6b6b', name: 'WFI-3' },
  ];
  const rx = 125, ry = 205;

  planes.forEach((pl, i) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(pl.tilt);
    g.strokeStyle = `${pl.color}44`;
    g.lineWidth = 1.5;
    g.setLineDash([4, 6]);
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  });
  g.setLineDash([]);

  // Plot each satellite
  PUNCH_SATS.forEach((sat, i) => {
    const pl = planes[i];
    const isDone = run.completed.some(c => c.satellite === sat.name);
    const isActive = activeDeployment.includes(sat.name);
    const speed = (time / 3400) + (i * Math.PI / 2);
    const baseAngle = speed;
    const unrotatedX = Math.cos(baseAngle) * rx;
    const unrotatedY = Math.sin(baseAngle) * ry;

    // Apply rotation
    const cosT = Math.cos(pl.tilt), sinT = Math.sin(pl.tilt);
    const px = cx + (unrotatedX * cosT - unrotatedY * sinT);
    const py = cy + (unrotatedX * sinT + unrotatedY * cosT);

    if (isDone || isActive) {
      // Vector toward Sun
      const toSunAngle = Math.atan2(sy - py, sx - px);
      const beamLen = i === 0 ? 160 : 120;
      const beamSpread = i === 0 ? 0.12 : 0.48; // NFI narrow vs WFI wide

      // Draw observation cone
      g.save();
      const coneGrad = g.createRadialGradient(px, py, 10, px + Math.cos(toSunAngle) * beamLen, py + Math.sin(toSunAngle) * beamLen, beamLen);
      coneGrad.addColorStop(0, i === 0 ? 'rgba(255, 230, 100, 0.45)' : 'rgba(100, 220, 255, 0.35)');
      coneGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = coneGrad;
      g.beginPath();
      g.moveTo(px, py);
      g.arc(px, py, beamLen, toSunAngle - beamSpread, toSunAngle + beamSpread);
      g.closePath();
      g.fill();
      g.restore();

      // Satellite symbol
      g.save();
      g.translate(px, py);
      g.shadowColor = pl.color; g.shadowBlur = 12;
      g.fillStyle = pl.color;
      if (i === 0) {
        // NFI diamond
        g.beginPath();
        g.moveTo(0, -9); g.lineTo(9, 0); g.lineTo(0, 9); g.lineTo(-9, 0); g.closePath();
        g.fill();
      } else {
        // WFI square with solar wings
        g.fillRect(-5, -5, 10, 10);
        g.fillStyle = '#fff';
        g.fillRect(-12, -2, 6, 4);
        g.fillRect(6, -2, 6, 4);
      }
      g.restore();

      // Animated beacon
      g.strokeStyle = pl.color;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(px, py, 12 + Math.sin(time / 200 + i) * 3, 0, Math.PI * 2);
      g.stroke();

      // Label
      g.font = canvasFont(14, 'bold');
      g.fillStyle = '#fff';
      g.fillText(sat.name, px + 15, py - 4);
      g.font = canvasFont(12);
      g.fillStyle = pl.color;
      g.fillText(isDone ? 'ONLINE · SYNCED' : 'DEPLOYED · COMMISSIONING', px + 15, py + 10);
    } else {
      // Pending satellite
      g.strokeStyle = 'rgba(150, 190, 220, 0.4)';
      g.lineWidth = 1;
      g.setLineDash([3, 3]);
      g.beginPath(); g.arc(px, py, 7, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.font = canvasFont(12);
      g.fillStyle = 'rgba(180, 210, 230, 0.6)';
      g.fillText(`${sat.name} (PENDING)`, px + 12, py + 4);
    }
  });

  // HUD Top Title and Legend
  g.font = canvasFont(15, 'bold');
  g.fillStyle = '#a6e3ff';
  g.fillText(compact ? 'PUNCH · CONSTELLATION' : 'PUNCH · 4-SATELLITE HELIOSPHERIC CONSTELLATION', 24, 32);
  g.font = canvasFont(14);
  g.fillStyle = '#c5ebff';
  const doneCount = run.completed.length;
  const deployedCount = Math.max(doneCount, activeDeployment.length);
  g.fillText(compact ? `DEPLOYED ${deployedCount}/4 · ONLINE ${doneCount}/4` : `DEPLOYED: ${deployedCount} / 4  ·  ONLINE: ${doneCount} / 4  ·  POLAR SUN-SYNCHRONOUS ORBIT`, 24, 52);

  if (doneCount === PUNCH_SATS.length) {
    g.fillStyle = '#ffd16d';
    g.font = canvasFont(14, 'bold');
    g.fillText(compact ? 'FULL CONSTELLATION ONLINE' : '★ FULL 360° SYNCHRONIZED CORONAGRAPHY ACTIVE · TRACKING SOLAR WIND TO EARTH ★', 24, h - 22);
  } else {
    g.fillStyle = '#89c5db';
    g.font = canvasFont(14);
    const status = activeDeployment.length === PUNCH_SATS.length
      ? 'ALL FOUR DEPLOYED · COMMISSIONING CONSTELLATION'
      : activeDeployment.length
        ? `SINGLE LAUNCH · ${activeDeployment.length} OF 4 SATELLITES DEPLOYED`
        : 'ONE LAUNCH VEHICLE CARRIES ALL FOUR SATELLITES';
    g.fillText(status, 24, h - 22);
  }
  g.restore();
}
