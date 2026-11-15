import { MISSIONS, ROCKETS } from './data.js';
import {
  state, setHooks, showTitleScreen, showMissionSelect, isModalOpen,
  launchMission, initReport, renderReport, toast, showControlRoom,
  showLaunchChecklist, drawPerson, activateSecretCommand,
  showAstronautShowcase, showNasaKnowledgeBase,
} from './ui.js';

// A deliberately simple, fixed space-center scene: Mission Control, one road, one pad.
const STAGE_W = 1280;
const STAGE_H = 800;
const container = document.getElementById('game-container');
const canvas = document.createElement('canvas');
canvas.id = 'space-center-canvas';
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

const worldImage = new Image();
worldImage.src = 'assets/simple-space-center.webp';

let hoveredZone = null;
let rocketPreviewId = null;
let rocketDelivered = false;
let deliveryAnimation = 0;
let launchAnimation = 0;
let lastFrame = 0;
let dpr = 1;
let sceneScale = 1;
let sceneOffset = { x: 0, y: 0 };
let music = null;
const DELIVERY_OUTBOUND = 6.5;
const DELIVERY_DWELL = 0.8;
const DELIVERY_RETURN = 6.2;
const DELIVERY_RETURN_START = DELIVERY_OUTBOUND + DELIVERY_DWELL;
const DELIVERY_TOTAL = DELIVERY_RETURN_START + DELIVERY_RETURN;

// Polygon hit areas hug the two buildings and stay off the road and open ground.
const ZONES = [
  { id: 'control', points: [[42, 396], [492, 396], [492, 595], [42, 595]] },
  { id: 'pad', points: [[865, 132], [1052, 132], [1090, 510], [1155, 558], [858, 558], [840, 470]] },
];

function playAudio(name, loop = false, volume = 0.5) {
  const audio = new Audio(`assets/audio/${name}.mp3`);
  audio.loop = loop;
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => { if (audio === music) music = null; });
  return audio;
}

function startBackgroundMusic() {
  if (!music) music = playAudio('aqua-frutiger-aero-chillwave-532669', true, .28);
}

function resize() {
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  sceneScale = Math.min(w / STAGE_W, h / STAGE_H);
  sceneOffset = { x: (w - STAGE_W * sceneScale) / 2, y: (h - STAGE_H * sceneScale) / 2 };
}
window.addEventListener('resize', resize);
resize();

const hiddenCommand = 'criapirates';
let keySequence = '';
let lastSequenceKeyAt = 0;
window.addEventListener('keydown', event => {
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
    keySequence = '';
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  const now = performance.now();
  if (now - lastSequenceKeyAt > 1800) keySequence = '';
  lastSequenceKeyAt = now;
  keySequence = (keySequence + event.key.toLowerCase()).slice(-hiddenCommand.length);
  if (keySequence === hiddenCommand) {
    keySequence = '';
    activateSecretCommand();
  }
});

function polygon(points, fill, stroke = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function roundedRect(x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function label(text, x, y, color = '#fff', size = 16, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Pixelify Sans, Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function pill(text, centerX, y, color = 'rgba(8,24,47,.86)', textColor = '#eaf4ff') {
  ctx.font = 'bold 16px Pixelify Sans, Arial, sans-serif';
  const width = Math.max(180, ctx.measureText(text).width + 34);
  roundedRect(centerX - width / 2, y, width, 36, 8, color, 'rgba(218,235,250,.65)', 1);
  label(text, centerX, y + 24, textColor, 15);
}

function drawFallback() {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  sky.addColorStop(0, '#071d4d');
  sky.addColorStop(.58, '#234e88');
  sky.addColorStop(.59, '#294c69');
  sky.addColorStop(1, '#40582f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(255,255,255,${.25 + (i % 4) * .12})`;
    ctx.fillRect((i * 173) % STAGE_W, (i * 83) % 420, 2, 2);
  }
}

function drawBackground() {
  if (worldImage.complete && worldImage.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    // The art is composed for the same locked stage; a gentle vertical fit keeps the full gate visible.
    ctx.drawImage(worldImage, 0, 0, STAGE_W, STAGE_H);
  } else {
    drawFallback();
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function zoneAt(x, y) {
  return ZONES.find(zone => pointInPolygon(x, y, zone.points))?.id || null;
}

function drawHotspot(zone, active) {
  if (!active) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(zone.points[0][0], zone.points[0][1]);
  zone.points.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
  ctx.closePath();
  ctx.fillStyle = 'rgba(121,205,255,.10)';
  ctx.fill();
  ctx.strokeStyle = '#c8f1ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#68caff';
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.restore();
}

// Follow the painted access road from the gate, around its bend, and onto the concrete pad.
function transferPoint(t) {
  const p0 = { x: 640, y: 795 };
  const p1 = { x: 640, y: 690 };
  const p2 = { x: 690, y: 595 };
  const p3 = { x: 825, y: 570 };
  const u = 1 - t;
  const x = u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x;
  const y = u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y;
  const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return { x, y, angle: Math.atan2(dy, dx) };
}

function drawGate() {
  const outbound = deliveryAnimation > 0 && deliveryAnimation < DELIVERY_OUTBOUND;
  const returning = deliveryAnimation >= DELIVERY_RETURN_START && deliveryAnimation < DELIVERY_TOTAL;
  if (!outbound && !returning) return;
  // Start opening before the truck reaches the fence, then keep the gate clear until the trailer passes.
  const open = outbound
    ? Math.min(1, deliveryAnimation / .8, (DELIVERY_OUTBOUND - deliveryAnimation) / .7)
    : Math.min(1, (deliveryAnimation - DELIVERY_RETURN_START) / .65, (DELIVERY_TOTAL - deliveryAnimation) / .8);
  // The gate is part of the painted background: cover just its road opening while the leaves swing aside.
  polygon([[524, 645], [766, 645], [778, 708], [508, 708]], '#465771', '#8497a7', 2);
  ctx.fillStyle = '#c4cbd0'; ctx.fillRect(640, 670, 5, 29);
  ctx.strokeStyle = '#b7c6cb'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(520, 643); ctx.lineTo(520 - 118 * open, 643 + 19 * open);
  ctx.moveTo(768, 643); ctx.lineTo(768 + 118 * open, 643 + 19 * open); ctx.stroke();
  ctx.strokeStyle = '#a2b5bb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(520, 695); ctx.lineTo(520 - 118 * open, 695 + 19 * open);
  ctx.moveTo(768, 695); ctx.lineTo(768 + 118 * open, 695 + 19 * open); ctx.stroke();
  for (const x of [520, 768]) { ctx.fillStyle = '#849aaa'; ctx.fillRect(x - 4, 638, 8, 70); }
  pill(outbound ? 'GATE OPEN · ROCKET CONVOY' : 'GATE OPEN · CONVOY RETURNING', 645, 714, 'rgba(8,24,47,.91)', '#a4ffc3');
}

function drawRocketTransport() {
  if (deliveryAnimation <= 0 || deliveryAnimation >= DELIVERY_TOTAL) return;
  const returning = deliveryAnimation >= DELIVERY_RETURN_START;
  const t = returning
    ? 1 - Math.min(1, (deliveryAnimation - DELIVERY_RETURN_START) / DELIVERY_RETURN)
    : Math.min(1, deliveryAnimation / DELIVERY_OUTBOUND);
  const p = transferPoint(t);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Mirror the convoy on its return leg instead of rotating it 180°; the vehicle stays upright on the road.
  ctx.scale(returning ? -.56 : .56, .56);
  ctx.fillStyle = 'rgba(4,13,26,.48)';
  ctx.beginPath(); ctx.ellipse(-8, 18, 110, 13, 0, 0, Math.PI * 2); ctx.fill();
  // One compact low-loader carrying the selected vehicle; no ambient traffic or extra props.
  roundedRect(-110, -10, 170, 15, 3, '#343f4b', '#172638', 2);
  for (const wx of [-86, -52, -18, 18, 48]) {
    roundedRect(wx, 1, 18, 14, 5, '#17212c', '#a8bac4', 2);
  }
  roundedRect(-87, -39, 128, 22, 10, '#eef2f3', '#516a7a', 2);
  polygon([[40, -39], [67, -28], [40, -17]], '#f3f3eb', '#516a7a', 2);
  roundedRect(-30, -36, 42, 16, 4, '#e97738', '#933d2c', 1);
  polygon([[-88, -40], [-103, -54], [-77, -39]], '#b64839', '#73312f', 1);
  polygon([[-88, -17], [-103, -3], [-77, -18]], '#b64839', '#73312f', 1);
  // Simple tow cab at the leading end of the trailer.
  roundedRect(53, -18, 47, 27, 5, '#e0b84e', '#243544', 2);
  polygon([[77, -18], [94, -14], [100, 1], [77, 1]], '#e8c65d', '#243544', 2);
  roundedRect(80, -14, 14, 9, 2, '#6597ad');
  roundedRect(60, 6, 18, 12, 5, '#17212c', '#a8bac4', 2);
  roundedRect(84, 6, 18, 12, 5, '#17212c', '#a8bac4', 2);
  ctx.restore();
  pill('ROCKET TRANSFER', p.x, p.y - 48, 'rgba(8,24,47,.92)', '#fff3c2');
}

function drawRocket(time) {
  const rocket = ROCKETS.find(item => item.id === rocketPreviewId) || (state.plan?.punch ? { id: rocketPreviewId, name: state.plan.calc.rocket.name, height: rocketPreviewId === 'atlas' ? 9 : 7, boosters: 0 } : null);
  if (state.launched) return;
  if ((!rocketDelivered && deliveryAnimation < 5.9) || !rocket) return;

  const x = 920;
  const settling = !rocketDelivered ? (6.5 - deliveryAnimation) * 35 : 0;
  const y = 493 + settling - (launchAnimation > .7 ? (launchAnimation - .7) ** 2 * 68 : 0);
  const scale = rocket.height >= 10 ? 1.1 : rocket.height >= 9 ? 1.03 : .97;
  if (launchAnimation > 0) {
    const flicker = .78 + Math.sin(time / 48) * .16;
    polygon([[x - 18, y + 46], [x + 18, y + 46], [x + 6, y + 46 + 88 * flicker], [x - 5, y + 46 + 78 * flicker]], '#ffad38');
    polygon([[x - 8, y + 49], [x + 8, y + 49], [x + 3, y + 49 + 57 * flicker], [x - 3, y + 49 + 50 * flicker]], '#fff1a8');
    ctx.fillStyle = 'rgba(235,239,243,.52)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(x - 48 + i * 32, 556 + (i % 2) * 7, 30, 13, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const mainColor = rocket.id === 'sls' || rocket.id === 'sls1b' ? '#ef8737' : rocket.id === 'starship' ? '#c9d1d7' : '#f3f3ee';
  if (rocket.boosters) {
    for (const bx of [-34, 34]) {
      roundedRect(bx - 9, -91, 18, 143, 7, '#f0eee5', '#5f6b75', 2);
      polygon([[bx - 9, -90], [bx, -118], [bx + 9, -90]], '#f0eee5', '#5f6b75', 1);
      ctx.fillStyle = '#3a4651'; ctx.fillRect(bx - 7, 48, 14, 7);
    }
  }
  ctx.fillStyle = mainColor;
  ctx.beginPath(); ctx.moveTo(0, -170); ctx.quadraticCurveTo(25, -146, 24, -112); ctx.lineTo(24, 49); ctx.lineTo(-24, 49); ctx.lineTo(-24, -112); ctx.quadraticCurveTo(-25, -146, 0, -170); ctx.fill();
  ctx.strokeStyle = '#4d6271'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e65f37';
  ctx.beginPath(); ctx.moveTo(0, -170); ctx.quadraticCurveTo(18, -150, 20, -135); ctx.lineTo(-20, -135); ctx.quadraticCurveTo(-18, -150, 0, -170); ctx.fill();
  ctx.fillStyle = '#26415a';
  for (let i = -1; i <= 1; i++) ctx.fillRect(i * 9 - 3, -111, 6, 8);
  ctx.strokeStyle = '#abb5b8'; ctx.lineWidth = 1;
  for (let yy = -75; yy < 45; yy += 30) { ctx.beginPath(); ctx.moveTo(-22, yy); ctx.lineTo(22, yy); ctx.stroke(); }
  polygon([[-24, 10], [-43, 49], [-24, 44]], '#b54839', '#66302e', 1);
  polygon([[24, 10], [43, 49], [24, 44]], '#b54839', '#66302e', 1);
  ctx.fillStyle = '#34414c';
  for (const ex of [-13, 0, 13]) {
    ctx.beginPath(); ctx.moveTo(ex - 5, 49); ctx.lineTo(ex + 5, 49); ctx.lineTo(ex + 7, 59); ctx.lineTo(ex - 7, 59); ctx.fill();
  }
  ctx.restore();
  if (rocketDelivered && !launchAnimation) {
    roundedRect(891, 542, 58, 13, 2, '#5b6e78', '#abbec6', 2);
    for (const yy of [369, 432]) {
      ctx.strokeStyle = '#a5b9c2'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(1007, yy - 8); ctx.lineTo(945, yy); ctx.stroke();
      ctx.strokeStyle = '#223d50'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(946, yy - 15); ctx.lineTo(946, yy + 16); ctx.stroke();
      ctx.fillStyle = '#f1bd5b'; ctx.fillRect(940, yy - 5, 8, 10);
    }
  }
  if (!launchAnimation) label(rocket.name.toUpperCase(), x, y - 183 * scale, '#f3f7fb', 14);
}

function drawScene(time) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#071a33';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(sceneOffset.x, sceneOffset.y);
  ctx.scale(sceneScale, sceneScale);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, STAGE_W, STAGE_H); ctx.clip();
  drawBackground();
  drawGate();
  drawRocketTransport();
  drawRocket(time);

  drawHotspot(ZONES[0], hoveredZone === 'control');
  drawHotspot(ZONES[1], hoveredZone === 'pad');

  const controlText = state.launched ? 'MISSION CONTROL · OPEN FLIGHT DECK' : 'MISSION CONTROL · CLICK TO PLAN';
  const padText = state.launched ? 'ROCKET IN FLIGHT' : !state.plan ? 'LAUNCH PAD · PLAN A MISSION FIRST' : rocketDelivered ? 'LAUNCH PAD · CLICK TO PREPARE' : 'ROCKET IN TRANSIT';
  pill(controlText, 270, 610, hoveredZone === 'control' ? 'rgba(26,73,106,.94)' : 'rgba(8,24,47,.86)');
  pill(padText, 965, 590, hoveredZone === 'pad' ? 'rgba(26,73,106,.94)' : 'rgba(8,24,47,.86)', state.plan && rocketDelivered ? '#ffe19b' : '#eaf4ff');

  if (state.captain) {
    roundedRect(18, 18, 490, 112, 9, 'rgba(6,20,43,.92)', 'rgba(218,235,250,.55)', 1);
    roundedRect(26, 25, 51, 68, 3, '#264963', '#9bcce4', 1);
    ctx.save(); ctx.beginPath(); ctx.rect(28, 27, 47, 63); ctx.clip();
    ctx.translate(31, 23); drawPerson(ctx, state.captain, 3.1, 0, 0); ctx.restore();
    label(`CAPTAIN ${state.captain.name.toUpperCase()}`, 92, 46, '#ffe19b', 14, 'left');
    const next = MISSIONS[state.unlocked - 1];
    label(state.plan ? `${state.plan.calc.m.name} · ${state.launched ? 'IN FLIGHT' : rocketDelivered ? 'READY' : 'VEHICLE MOVING'}` : `CAREER ${state.unlocked}/${MISSIONS.length} · ${next ? next.name : 'COMPLETE'}`, 92, 70, '#e5f0fb', 13, 'left');
    if (state.punch?.completed.length === 4) label('PUNCH CONSTELLATION · ALL 4 ONLINE', 92, 91, '#9ef3c1', 13, 'left');
    label(`CAREER FUNDING −$${state.career.budgetPenalty}M  ·  GRIEF −${state.career.grief}%`, 92, 114, state.career.grief ? '#ffb2a5' : '#a4d6ea', 13, 'left');
  }
  ctx.restore();
}

function sceneCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - sceneOffset.x) / sceneScale,
    y: (event.clientY - rect.top - sceneOffset.y) / sceneScale,
  };
}

canvas.addEventListener('pointermove', event => {
  const { x, y } = sceneCoordinates(event);
  hoveredZone = isModalOpen() ? null : zoneAt(x, y);
  canvas.style.cursor = hoveredZone ? 'pointer' : 'default';
});
canvas.addEventListener('pointerleave', () => { hoveredZone = null; });
canvas.addEventListener('click', event => {
  if (isModalOpen() || launchAnimation > 0) return;
  const { x, y } = sceneCoordinates(event);
  const zone = zoneAt(x, y);
  if (!zone) return;
  if (!state.captain) {
    toast('Create your captain first.');
    return;
  }
  if (zone === 'control') {
    if (state.launched) showControlRoom();
    else if (state.plan) toast('Your mission is planned. Use the Launch Pad to continue.');
    else showMissionSelect();
    return;
  }
  if (zone === 'pad') {
    if (!state.plan) toast('Choose and finalize a mission at Mission Control first.');
    else if (state.launched) toast('Your mission is underway. Manage it from Mission Control.');
    else if (!rocketDelivered) toast('The rocket is still moving from the gate to the pad.');
    else showLaunchChecklist(() => {
      playAudio('launch-rumble', false, .72);
      launchAnimation = .01;
    });
  }
});

setHooks({
  onBlip: () => { playAudio('ui-blip', false, .42); startBackgroundMusic(); },
  onCaptain: startBackgroundMusic,
  onPlanned: plan => { rocketPreviewId = plan.rocket; rocketDelivered = false; deliveryAnimation = .001; },
  onRocketPreview: id => { rocketPreviewId = id; },
  onMissionEnd: () => { rocketPreviewId = null; rocketDelivered = false; deliveryAnimation = 0; launchAnimation = 0; },
  onAnomaly: () => playAudio('mission-problem-alert', false, .62),
  onSeparation: () => playAudio('separation-deploy', false, .65),
  onSuccess: () => playAudio('mission-success-chime', false, .58),
});

// Space Center educational navigation bar
const topBar = document.createElement('div');
topBar.id = 'sc-topbar';
topBar.style.cssText = 'position:absolute;top:10px;right:12px;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;z-index:25;max-width:calc(100vw - 24px);';
topBar.innerHTML = `
  <button class="btn small" id="tb-astro" style="background:#13395e;border-color:#5aa5d9;">🧑‍🚀 8 ASTRONAUTS</button>
  <button class="btn small" id="tb-edu" style="background:#13395e;border-color:#5aa5d9;">📚 NASA FACTS</button>
`;
document.getElementById('ui-container')?.appendChild(topBar);
topBar.querySelector('#tb-astro')?.addEventListener('click', () => {
  playAudio('ui-blip', false, .42);
  showAstronautShowcase();
});
topBar.querySelector('#tb-edu')?.addEventListener('click', () => {
  playAudio('ui-blip', false, .42);
  showNasaKnowledgeBase();
});

initReport();

function frame(time) {
  const dt = Math.min(.05, Math.max(0, (time - lastFrame) / 1000 || 0));
  lastFrame = time;
  if (deliveryAnimation > 0) {
    deliveryAnimation += dt;
    if (!rocketDelivered && deliveryAnimation >= DELIVERY_OUTBOUND) {
      rocketDelivered = true;
      toast('Rocket secured on the launch pad. The transfer truck is returning along the access road.');
    }
    if (deliveryAnimation >= DELIVERY_TOTAL) deliveryAnimation = 0;
  }
  if (launchAnimation > 0) {
    launchAnimation += dt;
    if (launchAnimation >= 4.2) {
      launchAnimation = 0;
      launchMission();
      showControlRoom();
      toast('Liftoff! Mission Control is live. Click the lined screen on the right for your Captain’s Log.');
    }
  }
  renderReport(time);
  drawScene(time);
  requestAnimationFrame(frame);
}

showTitleScreen();
requestAnimationFrame(frame);
