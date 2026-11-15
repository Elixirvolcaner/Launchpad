// Shared character renderer used by every menu, the space center, the report and Mission Control.
// The supplied sheets are JPEGs on white paper: each sheet is keyed once (edge flood-fill removes
// only the connected white background), every figure is cropped to its real bounds and drawn
// aspect-correct (never stretched). Uniform colour is a luminance-preserving tint of the suit
// fabric, and the country sleeve patch is painted over the sprite's shoulder patch.

const SHEETS = {
  suit: { src: 'assets/art.jpeg', cols: 4, rows: 2 },
  visor: { src: 'assets/more-art.jpeg', cols: 4, rows: 2 },
  civilian: { src: 'assets/whatsapp-image-2026-11-14-at-14-39-38-1.jpeg', cols: 4, rows: 2 },
  chicken: { src: 'assets/textures.jpeg', cols: 1, rows: 1 },
};
const listeners = new Set();
const tintCache = new Map();

export function onSpritesReady(fn) {
  if (spritesReady()) { fn(); return; }
  listeners.add(fn);
}
export function spritesReady() { return Object.values(SHEETS).every(s => s.cells || s.failed); }
function notifySpritesReady() {
  if (!spritesReady()) return;
  const pending = [...listeners];
  listeners.clear();
  pending.forEach(fn => { try { fn(); } catch { /* listener errors must not break loading */ } });
}

for (const sheet of Object.values(SHEETS)) {
  sheet.img = new Image();
  sheet.img.onload = () => {
    processSheet(sheet);
    notifySpritesReady();
  };
  sheet.img.onerror = () => {
    sheet.failed = true;
    notifySpritesReady();
  };
  sheet.img.src = sheet.src;
  if (sheet.img.complete && sheet.img.naturalWidth) {
    processSheet(sheet);
  }
}

function gridCells(sheet, W, H) {
  const cells = [];
  for (let r = 0; r < sheet.rows; r++) for (let c = 0; c < sheet.cols; c++) {
    const x0 = Math.floor(c * W / sheet.cols), x1 = Math.floor((c + 1) * W / sheet.cols);
    const y0 = Math.floor(r * H / sheet.rows), y1 = Math.floor((r + 1) * H / sheet.rows);
    cells.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  return cells;
}

function processSheet(sheet) {
  const img = sheet.img;
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const grid = gridCells(sheet, W, H);
  let data;
  try { data = g.getImageData(0, 0, W, H); } catch {
    sheet.canvas = cv; sheet.cells = grid; return;
  }
  const px = data.data;
  const bg = new Uint8Array(W * H);
  const white = i => px[i * 4] > 218 && px[i * 4 + 1] > 218 && px[i * 4 + 2] > 218;
  const stack = [];
  const push = i => { if (!bg[i] && white(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (i >= W) push(i - W);
    if (i < W * (H - 1)) push(i + W);
  }
  // Remove the pale JPEG halo that hugs the outline so figures blend into any background.
  const halo = [];
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) continue;
    const x = i % W;
    const edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (i >= W && bg[i - W]) || (i < W * (H - 1) && bg[i + W]);
    if (edge && px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2] > 560) halo.push(i);
  }
  halo.forEach(i => { bg[i] = 1; });
  for (let i = 0; i < W * H; i++) if (bg[i]) px[i * 4 + 3] = 0;
  g.putImageData(data, 0, 0);
  sheet.canvas = cv;
  sheet.cells = grid.map(cell => tightBounds(bg, W, cell));
}

function tightBounds(bg, W, cell) {
  const rows = new Uint32Array(cell.h), cols = new Uint32Array(cell.w);
  for (let y = 0; y < cell.h; y++) {
    const base = (cell.y + y) * W + cell.x;
    for (let x = 0; x < cell.w; x++) if (!bg[base + x]) { rows[y]++; cols[x]++; }
  }
  const min = 4;
  let top = 0, bottom = cell.h - 1, left = 0, right = cell.w - 1;
  while (top < bottom && rows[top] < min) top++;
  while (bottom > top && rows[bottom] < min) bottom--;
  while (left < right && cols[left] < min) left++;
  while (right > left && cols[right] < min) right--;
  let sumX = 0, count = 0;
  for (let y = top; y <= bottom; y++) {
    const base = (cell.y + y) * W + cell.x + left;
    for (let x = left; x <= right; x++) if (!bg[base + x - left]) { sumX += x - left + .5; count++; }
  }
  return { x: cell.x + left, y: cell.y + top, w: right - left + 1, h: bottom - top + 1,
    centerX: count ? sumX / count : (right - left + 1) / 2 };
}

const hexRgb = hex => {
  const n = parseInt(String(hex || '#ffffff').replace('#', '').padEnd(6, 'f').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Returns a canvas holding one cropped figure, with the suit fabric re-coloured if needed.
function figure(sheetKey, idx, suit) {
  const sheet = SHEETS[sheetKey];
  if (!sheet?.cells || !sheet.cells.length) return null;
  const cell = sheet.cells[idx % sheet.cells.length];
  if (!cell || !cell.w || !cell.h) return null;
  const [sr, sg, sb] = hexRgb(suit);
  const plainWhite = !suit || sheetKey === 'civilian' || (sr + sg + sb) / 3 > 228;
  const key = `${sheetKey}|${idx}|${plainWhite ? 'white' : suit}`;
  if (tintCache.has(key)) return { canvas: tintCache.get(key), cell };
  const cv = document.createElement('canvas');
  cv.width = cell.w; cv.height = cell.h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(sheet.canvas, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
  if (!plainWhite) {
    try {
      const d = g.getImageData(0, 0, cell.w, cell.h);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        const r = p[i], gg = p[i + 1], b = p[i + 2];
        const hi = Math.max(r, gg, b), lo = Math.min(r, gg, b);
        if (hi - lo < 34 && hi > 150) {
          const l = (r + gg + b) / 765;
          const k = 0.3 + l * 0.85;
          p[i] = Math.min(255, sr * k); p[i + 1] = Math.min(255, sg * k); p[i + 2] = Math.min(255, sb * k);
        }
      }
      g.putImageData(d, 0, 0);
    } catch { /* tint is cosmetic */ }
  }
  tintCache.set(key, cv);
  return { canvas: cv, cell };
}

// Simplified sleeve-patch flags for the selectable agencies.
export function drawFlag(g, code, x, y, w, h) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  const rect = (c, a, b, cw, ch) => { g.fillStyle = c; g.fillRect(x + a * w, y + b * h, cw * w, ch * h); };
  const disc = (c, a, b, r) => { g.fillStyle = c; g.beginPath(); g.arc(x + a * w, y + b * h, r * Math.min(w, h), 0, Math.PI * 2); g.fill(); };
  switch (code) {
    case 'EU':
      rect('#0c3a9c', 0, 0, 1, 1);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; disc('#ffd200', .5 + Math.cos(a) * .3, .5 + Math.sin(a) * .34, .07); }
      break;
    case 'JP': rect('#ffffff', 0, 0, 1, 1); disc('#c8102e', .5, .5, .3); break;
    case 'CA': rect('#d52b1e', 0, 0, 1, 1); rect('#ffffff', .25, 0, .5, 1); disc('#d52b1e', .5, .52, .22); rect('#d52b1e', .47, .55, .06, .3); break;
    case 'GB':
      rect('#012169', 0, 0, 1, 1);
      g.strokeStyle = '#ffffff'; g.lineWidth = h * .22;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke();
      rect('#ffffff', 0, .36, 1, .28); rect('#ffffff', .4, 0, .2, 1); rect('#c8102e', 0, .42, 1, .16); rect('#c8102e', .45, 0, .1, 1);
      break;
    case 'IT':
      rect('#009246', 0, 0, 1 / 3, 1);
      rect('#ffffff', 1 / 3, 0, 1 / 3, 1);
      rect('#ce2b37', 2 / 3, 0, 1 / 3, 1);
      break;
    case 'AE':
      rect('#00732f', 0.28, 0, 0.72, 1 / 3);
      rect('#ffffff', 0.28, 1 / 3, 0.72, 1 / 3);
      rect('#000000', 0.28, 2 / 3, 0.72, 1 / 3);
      rect('#ff0000', 0, 0, 0.28, 1);
      break;
    case 'ES':
      rect('#aa151b', 0, 0, 1, 0.25);
      rect('#f1bf00', 0, 0.25, 1, 0.5);
      rect('#aa151b', 0, 0.75, 1, 0.25);
      disc('#aa151b', 0.35, 0.5, 0.12);
      break;
    case 'CN':
      rect('#de2910', 0, 0, 1, 1);
      disc('#ffde00', 0.25, 0.35, 0.18);
      disc('#ffde00', 0.45, 0.2, 0.05);
      disc('#ffde00', 0.52, 0.32, 0.05);
      disc('#ffde00', 0.52, 0.48, 0.05);
      disc('#ffde00', 0.45, 0.6, 0.05);
      break;
    case 'IN': rect('#ff9933', 0, 0, 1, .34); rect('#ffffff', 0, .33, 1, .34); rect('#138808', 0, .66, 1, .34); disc('#000080', .5, .5, .12); break;
    case 'AU':
      rect('#012169', 0, 0, 1, 1); rect('#ffffff', 0, .2, .45, .1); rect('#ffffff', .18, 0, .1, .5); rect('#c8102e', .2, 0, .06, .5); rect('#c8102e', 0, .22, .45, .06);
      disc('#ffffff', .25, .78, .1); disc('#ffffff', .75, .3, .07); disc('#ffffff', .82, .7, .07); disc('#ffffff', .65, .55, .05);
      break;
    case 'BR':
      rect('#009c3b', 0, 0, 1, 1);
      g.fillStyle = '#ffdf00'; g.beginPath(); g.moveTo(x + w * .5, y + h * .1); g.lineTo(x + w * .92, y + h * .5); g.lineTo(x + w * .5, y + h * .9); g.lineTo(x + w * .08, y + h * .5); g.fill();
      disc('#002776', .5, .5, .24);
      break;
    case 'KR': rect('#ffffff', 0, 0, 1, 1); disc('#cd2e3a', .5, .45, .25); rect('#0047a0', .25, .5, .5, .25); disc('#0047a0', .5, .58, .2); rect('#111', .08, .12, .12, .2); rect('#111', .8, .68, .12, .2); break;
    case 'MX': rect('#006847', 0, 0, .34, 1); rect('#ffffff', .33, 0, .34, 1); rect('#ce1126', .66, 0, .34, 1); disc('#8a5a2b', .5, .5, .12); break;
    default:
      for (let i = 0; i < 7; i++) rect(i % 2 ? '#ffffff' : '#b22234', 0, i / 7, 1, 1 / 7 + .01);
      rect('#3c3b6e', 0, 0, .45, 4 / 7);
      break;
  }
  g.restore();
  g.strokeStyle = 'rgba(20,24,34,.85)'; g.lineWidth = Math.max(1, w / 14);
  g.strokeRect(x, y, w, h);
}

function fallback(g, look, ox, oy, w, h) {
  g.save();
  g.fillStyle = look?.chicken ? '#ffd84a' : (look?.suit || '#eef3f7');
  g.strokeStyle = '#1a1a2a'; g.lineWidth = Math.max(1, w / 24);
  g.beginPath(); g.roundRect(ox + w * .2, oy + h * .38, w * .6, h * .55, w * .12); g.fill(); g.stroke();
  g.fillStyle = look?.skin || '#e8c4a0';
  g.beginPath(); g.arc(ox + w / 2, oy + h * .24, w * .26, 0, Math.PI * 2); g.fill(); g.stroke();
  g.restore();
}

/**
 * Draws a character into the box (ox, oy, 16*s, 24*s), bottom-centred and aspect-correct.
 * look: { spriteIndex, suit, country:{code}, aviators, civilian, chicken, headset }
 */
export function drawPerson(g, look = {}, s = 3, ox = 0, oy = 0) {
  const W = 16 * s, H = 24 * s;
  const sheetKey = look?.chicken ? 'chicken' : look?.civilian ? 'civilian' : look?.aviators ? 'visor' : 'suit';
  const fig = figure(sheetKey, look?.chicken ? 0 : (look?.spriteIndex ?? 2), look?.suit);
  if (!fig) { fallback(g, look, ox, oy, W, H); return; }
  const { canvas, cell } = fig;
  const k = Math.min(W / cell.w, H / cell.h);
  const dw = cell.w * k, dh = cell.h * k;
  // Centre the opaque silhouette rather than its crop box so open- and closed-visor sheets share one visual anchor.
  const dx = ox + W / 2 - (cell.centerX ?? cell.w / 2) * k, dy = oy + H - dh;
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(canvas, dx, dy, dw, dh);
  g.restore();
  if ((sheetKey === 'suit' || sheetKey === 'visor') && look?.country?.code) {
    drawFlag(g, look.country.code, dx + dw * .752, dy + dh * .437, dw * .165, dh * .072);
  }
  if (look?.headset) {
    g.save();
    const hx = dx, hy = dy;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#182b39'; g.lineWidth = Math.max(3, dw * .085);
    g.beginPath(); g.moveTo(hx + dw * .09, hy + dh * .19);
    g.quadraticCurveTo(hx + dw * .5, hy - dh * .015, hx + dw * .91, hy + dh * .19); g.stroke();
    g.strokeStyle = '#b9d5dc'; g.lineWidth = Math.max(1.5, dw * .045); g.stroke();
    g.fillStyle = '#172a38';
    g.beginPath(); g.roundRect(hx + dw * .055, hy + dh * .145, dw * .16, dh * .105, Math.max(2, dw * .035)); g.fill();
    g.beginPath(); g.roundRect(hx + dw * .785, hy + dh * .145, dw * .16, dh * .105, Math.max(2, dw * .035)); g.fill();
    g.fillStyle = '#93bac7';
    g.fillRect(hx + dw * .08, hy + dh * .165, dw * .105, dh * .065);
    g.fillRect(hx + dw * .815, hy + dh * .165, dw * .105, dh * .065);
    g.strokeStyle = '#263f4c'; g.lineWidth = Math.max(1.5, dw * .04);
    g.beginPath(); g.moveTo(hx + dw * .13, hy + dh * .22); g.quadraticCurveTo(hx + dw * .16, hy + dh * .29, hx + dw * .34, hy + dh * .29); g.stroke();
    g.fillStyle = '#d4e5e8'; g.beginPath(); g.arc(hx + dw * .35, hy + dh * .29, Math.max(1.5, dw * .025), 0, Math.PI * 2); g.fill();
    g.restore();
  }
}
