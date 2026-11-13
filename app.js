/* ================= Thư gửi Hội nghị — logic ================= */
(() => {
'use strict';

const CFG = window.APP_CONFIG || {};
const API = String(CFG.APPS_SCRIPT_URL || '').trim();
const DEMO = !API;
const MESSAGES = window.MESSAGES || [];

// Bố cục khung thư (đơn vị: px trên ảnh 2000×2000) — lấy từ file thiết kế
const L = {
  S: 2000,
  photo: { cx: 380, cy: 1000, r: 218 },
  name:  { x: 932, y: 923, maxW: 868, size: 48, min: 28 },
  role:  { x: 932, y: 995, maxW: 868, size: 48, min: 26 },
  msg:   { x: 234, y: 1250, w: 1532, h: 568, size: 54, min: 30, lh: 1.6 },
};
const FONT = '"Be Vietnam Pro"';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

/* ---------------- Toast ---------------- */
function toast(text, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = text;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 3200);
}

/* ================= TRÌNH SOẠN THƯ ================= */
const st = {
  img: null, zoom: 1, x: 0, y: 0, rot90: 0, rot: 0, flip: false, br: 100, ct: 100, sa: 100,
  name: '', role: '', msg: '', msgIdx: -1,
};
const cv = $('#cv');
const ctx = cv.getContext('2d');
const FILTER_OK = typeof ctx.filter === 'string';
const frame = new Image();
const hsvLogo = new Image();
hsvLogo.onload = () => schedule();
hsvLogo.src = 'assets/hsv-logo.png';
let ready = false;

function sizeCanvas() {
  const w = cv.clientWidth || 600;
  const px = clamp(Math.round(w * (window.devicePixelRatio || 1)), 400, 2000);
  if (cv.width !== px) { cv.width = px; cv.height = px; }
  schedule();
}

let raf = 0;
function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(ctx, cv.width / L.S, false); }); }

function render(c, k, exp) {
  c.setTransform(k, 0, 0, k, 0, 0);
  c.clearRect(0, 0, L.S, L.S);
  if (frame.complete && frame.naturalWidth) c.drawImage(frame, 0, 0, L.S, L.S);
  drawPhoto(c, exp);
  c.save();
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.shadowColor = 'rgba(0,8,50,.45)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
  fitLine(c, st.name, exp ? '' : 'Họ và tên của bạn', L.name);
  fitLine(c, st.role, exp ? '' : 'Chức vụ / Chi hội', L.role);
  c.restore();
  drawMessage(c, st.msg || (exp ? '' : 'Lời chúc của bạn sẽ hiện ở đây. Bấm “Random lời chúc” để chọn nhanh, hoặc tự viết những điều bạn muốn gửi đến Hội nghị…'), !st.msg && !exp);
}

function drawPhoto(c, exp) {
  const { cx, cy, r } = L.photo;
  c.save();
  c.beginPath(); c.arc(cx, cy, r + 1.5, 0, Math.PI * 2); c.clip();
  if (st.img) {
    c.fillStyle = '#0b2a6e'; c.fillRect(cx - r - 2, cy - r - 2, 2 * r + 4, 2 * r + 4);
    const iw = st.img.width, ih = st.img.height;
    const odd = st.rot90 % 2 === 1;
    const base = Math.max((2 * r) / (odd ? ih : iw), (2 * r) / (odd ? iw : ih));
    const s = base * st.zoom;
    if (FILTER_OK) c.filter = `brightness(${st.br}%) contrast(${st.ct}%) saturate(${st.sa}%)`;
    c.translate(cx + st.x, cy + st.y);
    c.rotate(((st.rot90 * 90 + st.rot) * Math.PI) / 180);
    c.scale(st.flip ? -s : s, s);
    c.drawImage(st.img, -iw / 2, -ih / 2);
    if (FILTER_OK) c.filter = 'none';
  } else {
    c.fillStyle = '#ffffff'; c.fillRect(cx - r - 2, cy - r - 2, 2 * r + 4, 2 * r + 4);
    if (hsvLogo.complete && hsvLogo.naturalWidth) c.drawImage(hsvLogo, cx - r, cy - r, 2 * r, 2 * r);
    if (!exp) {
      c.fillStyle = 'rgba(4,11,46,.62)'; c.fillRect(cx - r, cy + 118, 2 * r, 66);
      c.fillStyle = '#fff'; c.font = `700 30px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Bấm để chọn ảnh', cx, cy + 151);
    }
  }
  c.restore();
}

function fitLine(c, text, ph, box) {
  const t = text || ph;
  if (!t) return;
  let size = box.size;
  c.font = `700 ${size}px ${FONT}`;
  while (size > box.min && c.measureText(t).width > box.maxW) { size -= 1; c.font = `700 ${size}px ${FONT}`; }
  c.fillStyle = text ? '#fff' : 'rgba(255,255,255,.45)';
  c.fillText(t, box.x, box.y, box.maxW);
}

function layoutMsg(c, text, size) {
  c.font = `400 ${size}px ${FONT}`;
  const maxW = L.msg.w, lines = [];
  for (const para of text.replace(/\r/g, '').split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push({ words: [], last: true }); continue; }
    let cur = [];
    for (const w of words) {
      if (cur.length && c.measureText(cur.join(' ') + ' ' + w).width > maxW) { lines.push({ words: cur, last: false }); cur = [w]; }
      else cur.push(w);
    }
    lines.push({ words: cur, last: true });
  }
  return lines;
}

let lastMsgSize = L.msg.size;
function drawMessage(c, text, placeholder) {
  const m = L.msg;
  let size = m.size, lines;
  for (; size >= m.min; size--) {
    lines = layoutMsg(c, text, size);
    if (lines.length * size * m.lh <= m.h) break;
  }
  size = Math.max(size, m.min);
  lines = layoutMsg(c, text, size);
  if (!placeholder) lastMsgSize = size;
  const lh = size * m.lh;
  const maxLines = Math.floor(m.h / lh);
  if (lines.length > maxLines) lines = lines.slice(0, maxLines);
  const y0 = m.y + (m.h - lines.length * lh) / 2;
  c.save();
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillStyle = placeholder ? 'rgba(242,247,255,.42)' : '#f2f7ff';
  c.shadowColor = 'rgba(0,6,40,.55)'; c.shadowBlur = 8; c.shadowOffsetY = 2;
  lines.forEach((ln, i) => {
    const y = y0 + lh * (i + 0.55);
    if (ln.last || ln.words.length < 2) { c.fillText(ln.words.join(' '), m.x, y); return; }
    const widths = ln.words.map(w => c.measureText(w).width);
    const gap = (m.w - widths.reduce((a, b) => a + b, 0)) / (ln.words.length - 1);
    let x = m.x;
    ln.words.forEach((w, j) => { c.fillText(w, x, y); x += widths[j] + gap; });
  });
  c.restore();
}

/* ---------- Ảnh: tải, kéo, phóng, xoay ---------- */
function loadFile(f) {
  if (!f) return;
  if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(f.name || '')) { toast('Vui lòng chọn một file ảnh.', 'err'); return; }
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    const max = 2400, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    st.img = c;
    resetPhoto();
    URL.revokeObjectURL(url);
    const thumb = $('.drop-ic');
    thumb.innerHTML = ''; const ti = new Image(); ti.src = c.toDataURL('image/jpeg', .6); thumb.appendChild(ti);
    $('#dropTitle').textContent = 'Đổi ảnh khác';
    $('#changeLabel').textContent = 'Đổi ảnh';
    $('#stepPhoto').classList.remove('err');
    toast('Đã tải ảnh! Kéo trong khung tròn để căn chỉnh.', 'ok');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG.', 'err'); };
  img.src = url;
}

function resetPhoto() {
  Object.assign(st, { zoom: 1, x: 0, y: 0, rot90: 0, rot: 0, flip: false, br: 100, ct: 100, sa: 100 });
  syncUI();
}

const wrapDeg = (d) => { d = ((d + 180) % 360 + 360) % 360 - 180; return d === -180 && st.rot > 0 ? 180 : d; };
const photoActs = {
  zoomIn() { st.zoom = clamp(st.zoom * 1.12, 0.5, 4); },
  zoomOut() { st.zoom = clamp(st.zoom / 1.12, 0.5, 4); },
  rotL() { st.rot = wrapDeg(Math.round(st.rot) - 90); },
  rotR() { st.rot = wrapDeg(Math.round(st.rot) + 90); },
  flip() { st.flip = !st.flip; },
  center() { st.x = 0; st.y = 0; },
  reset() { resetPhoto(); },
};
$$('[data-act]').forEach(b => b.addEventListener('click', () => { if (!st.img) return; photoActs[b.dataset.act](); syncUI(); }));

const card = $('#previewCard');
const toCanvas = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (L.S / r.width), y: (e.clientY - r.top) * (L.S / r.height) }; };
const inCircle = (p) => Math.hypot(p.x - L.photo.cx, p.y - L.photo.cy) <= L.photo.r + 8;

const pts = new Map();
let pinch = null;
cv.addEventListener('pointerdown', (e) => {
  const p = toCanvas(e);
  if (!st.img) { if (inCircle(p)) $('#file').click(); return; }
  cv.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  card.classList.add('dragging');
  pinch = null;
});
cv.addEventListener('pointermove', (e) => {
  if (!st.img) { card.classList.toggle('over-circle', inCircle(toCanvas(e))); return; }
  if (!pts.has(e.pointerId)) return;
  const prev = pts.get(e.pointerId);
  const k = L.S / cv.getBoundingClientRect().width;
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 1) {
    st.x += (e.clientX - prev.x) * k; st.y += (e.clientY - prev.y) * k;
  } else if (pts.size === 2) {
    const [a, b] = [...pts.values()];
    const d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (pinch) {
      st.zoom = clamp(st.zoom * (d / pinch.d), 0.5, 4);
      let da = (ang - pinch.ang) * 180 / Math.PI; if (da > 180) da -= 360; if (da < -180) da += 360;
      st.rot = clamp(st.rot + da, -180, 180);
      st.x += (mid.x - pinch.mid.x) * k; st.y += (mid.y - pinch.mid.y) * k;
    }
    pinch = { d, ang, mid };
  }
  syncUI(false);
});
const endPtr = (e) => { pts.delete(e.pointerId); pinch = null; if (!pts.size) card.classList.remove('dragging'); };
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('pointerleave', () => card.classList.remove('over-circle'));
cv.addEventListener('wheel', (e) => {
  if (!st.img) return;
  e.preventDefault();
  st.zoom = clamp(st.zoom * Math.exp(-e.deltaY * 0.0015), 0.5, 4);
  syncUI();
}, { passive: false });
cv.addEventListener('keydown', (e) => {
  if (!st.img) return;
  const step = e.shiftKey ? 40 : 10;
  const m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (m) { e.preventDefault(); st.x += m[0]; st.y += m[1]; syncUI(); }
  if (e.key === '+' || e.key === '=') { st.zoom = clamp(st.zoom * 1.06, .5, 4); syncUI(); }
  if (e.key === '-') { st.zoom = clamp(st.zoom / 1.06, .5, 4); syncUI(); }
});

// Kéo thả file
['previewCard', 'drop'].forEach(id => {
  const el = $('#' + id);
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('drag-over'); loadFile(e.dataTransfer.files[0]); });
});
$('#btnChange').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', (e) => { loadFile(e.target.files[0]); e.target.value = ''; });

/* ---------- Thanh trượt ---------- */
const sliders = {
  zoomQuick: { get: () => Math.round(st.zoom * 100), set: v => st.zoom = v / 100 },
  rotQuick: { get: () => Math.round(st.rot), set: v => st.rot = v },
  br: { get: () => st.br, set: v => st.br = v, out: v => v + '%' },
  ct: { get: () => st.ct, set: v => st.ct = v, out: v => v + '%' },
  sa: { get: () => st.sa, set: v => st.sa = v, out: v => v + '%' },
};
const paintRange = (el) => {
  const p = (el.value - el.min) / (el.max - el.min) * 100;
  if (el.classList.contains('mid')) {
    const a = Math.min(50, p), b = Math.max(50, p);
    el.style.setProperty('--fill', `linear-gradient(90deg,rgba(255,255,255,.14) ${a}%,var(--orange) ${a}%,var(--amber) ${b}%,rgba(255,255,255,.14) ${b}%)`);
  } else el.style.setProperty('--p', p + '%');
};
Object.entries(sliders).forEach(([id, s]) => {
  const el = $('#' + id);
  el.addEventListener('input', () => { if (!st.img) return; s.set(+el.value); syncUI(); });
  el.addEventListener('dblclick', () => { if (!st.img) return; s.set(+el.defaultValue); syncUI(); });
});
function syncUI(all = true) {
  Object.entries(sliders).forEach(([id, s]) => {
    const el = $('#' + id);
    if (document.activeElement !== el || !all) el.value = s.get();
    paintRange(el);
    if (s.out) $('#o' + id[0].toUpperCase() + id.slice(1)).textContent = s.out(s.get());
  });
  const has = !!st.img;
  card.classList.toggle('has-photo', has);
  $('#photoBar').classList.toggle('off', !has);
  $('#adjust').classList.toggle('off', !has);
  $('#okPhoto').classList.toggle('on', has);
  schedule();
}
if (!FILTER_OK) { ['br', 'ct', 'sa'].forEach(id => $('#' + id).disabled = true); $('#filterNote').hidden = false; }

/* ---------- Chữ ---------- */
const draft = store.get('thu-draft', {});
const fields = { name: 'cName', role: 'cRole', msg: 'cMsg' };
Object.entries(fields).forEach(([id, cnt]) => {
  const el = $('#' + id);
  if (draft[id]) el.value = draft[id];
  const upd = () => {
    st[id] = el.value.trim() ? el.value.replace(/\s+$/g, '') : '';
    $('#' + cnt).textContent = el.value.length;
    store.set('thu-draft', { name: $('#name').value, role: $('#role').value, msg: $('#msg').value });
    $('#okInfo').classList.toggle('on', !!st.name);
    $('#okMsg').classList.toggle('on', !!st.msg);
    if (st[id]) el.closest('.step').classList.remove('err');
    schedule();
    if (id === 'msg') setTimeout(updFitNote, 30);
  };
  el.addEventListener('input', upd);
  upd();
});
function updFitNote() {
  const n = $('#fitNote');
  if (!st.msg) { n.textContent = 'Chữ tự thu nhỏ để vừa khung khi lời chúc dài.'; return; }
  n.textContent = lastMsgSize <= L.msg.min
    ? 'Lời chúc hơi dài, chữ đã thu nhỏ tối đa. Nên rút gọn để dễ đọc hơn.'
    : (lastMsgSize < L.msg.size ? `Chữ đã tự thu nhỏ còn ${Math.round(lastMsgSize / L.msg.size * 100)}% để vừa khung.` : 'Lời chúc vừa khung, cỡ chữ chuẩn.');
}

function setMsg(text, idx) {
  const el = $('#msg');
  el.value = text; st.msgIdx = idx;
  el.dispatchEvent(new Event('input'));
}
$('#btnRandom').addEventListener('click', () => {
  if (!MESSAGES.length) return;
  let i; do { i = Math.floor(Math.random() * MESSAGES.length); } while (MESSAGES.length > 1 && i === st.msgIdx);
  setMsg(MESSAGES[i], i);
  const d = $('#btnRandom .dice'); d.classList.remove('roll'); void d.offsetWidth; d.classList.add('roll');
  toast(`Đã chọn lời chúc số ${i + 1}/${MESSAGES.length}. Bạn có thể sửa lại tùy ý.`);
});

// Kho lời chúc
function renderLib(q = '') {
  const list = $('#libList'); list.innerHTML = '';
  const nq = norm(q);
  MESSAGES.forEach((m, i) => {
    const li = document.createElement('li');
    li.value = i + 1; li.style.counterSet = `n ${i + 1}`;
    li.textContent = m;
    if (i === st.msgIdx) li.classList.add('cur');
    if (nq && !norm(m).includes(nq)) li.hidden = true;
    li.addEventListener('click', () => { setMsg(m, i); closeModal('mLib'); toast(`Đã chọn lời chúc số ${i + 1}.`); });
    list.appendChild(li);
  });
}
$('#btnLib').addEventListener('click', () => { renderLib(); openModal('mLib'); setTimeout(() => $('#libQ').focus(), 50); });
$('#libQ').addEventListener('input', (e) => renderLib(e.target.value));

/* ---------- Xuất ảnh ---------- */
function exportCanvas() {
  const c = document.createElement('canvas'); c.width = L.S; c.height = L.S;
  render(c.getContext('2d'), 1, true);
  return c;
}
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ban';
function download() {
  if (!validate(['photo', 'name'])) return;
  exportCanvas().toBlob((b) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = `thu-gui-hoi-nghi-${slug(st.name)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Đã tải ảnh về máy.', 'ok');
  }, 'image/png');
}
$('#btnDownload').addEventListener('click', download);
$('#btnDl2').addEventListener('click', download);

function validate(need = ['photo', 'name', 'msg']) {
  const miss = [];
  if (need.includes('photo') && !st.img) miss.push(['stepPhoto', 'chọn ảnh']);
  if (need.includes('name') && !st.name) miss.push([$('#name').closest('.step'), 'nhập họ tên']);
  if (need.includes('msg') && !st.msg) miss.push([$('#msg').closest('.step'), 'viết lời chúc']);
  if (!miss.length) return true;
  miss.forEach(([el]) => (typeof el === 'string' ? $('#' + el) : el).classList.add('err'));
  const first = miss[0][0]; (typeof first === 'string' ? $('#' + first) : first).scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast('Bạn cần ' + miss.map(m => m[1]).join(', ') + ' trước nhé.', 'err');
  return false;
}

/* ---------- Gửi ---------- */
let sendData = null;
$('#btnSend').addEventListener('click', () => {
  if (!validate()) return;
  const c = exportCanvas();
  sendData = c.toDataURL('image/jpeg', 0.9);
  $('#sendPreview').src = sendData;
  $('#sendSide').hidden = false; $('#sendDone').hidden = true;
  $('#sendTitle').textContent = 'Gửi lời chúc đến Hội nghị';
  openModal('mSend');
});
$('#btnConfirm').addEventListener('click', async () => {
  const btn = $('#btnConfirm');
  btn.disabled = true; btn.innerHTML = '<span class="spin" style="width:20px;height:20px;border-width:2px"></span>Đang gửi…';
  const payload = { name: st.name, role: st.role, message: st.msg, image: sendData, website: $('#website').value };
  try {
    let id;
    if (DEMO) {
      await new Promise(r => setTimeout(r, 700));
      id = 'local-' + Date.now();
      const small = document.createElement('canvas'); small.width = small.height = 1000;
      const im = await loadImg(sendData); small.getContext('2d').drawImage(im, 0, 0, 1000, 1000);
      const local = store.get('thu-local', []);
      local.unshift({ id, name: st.name, role: st.role, message: st.msg, time: new Date().toISOString(), img: small.toDataURL('image/jpeg', .8) });
      while (local.length && !store.set('thu-local', local)) local.pop();
    } else {
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Máy chủ từ chối');
      id = j.id;
    }
    const mine = store.get('thu-mine', []); mine.push(id); store.set('thu-mine', mine);
    $('#sendSide').hidden = true; $('#sendDone').hidden = false;
    $('#sendTitle').textContent = 'Cảm ơn bạn!';
    loadGallery(true);
  } catch (err) {
    console.error(err);
    toast('Gửi chưa được: ' + (err.message || 'lỗi mạng') + '. Thử lại sau giây lát nhé.', 'err');
  } finally {
    btn.disabled = false; btn.innerHTML = '<svg><use href="#i-send"/></svg>Xác nhận gửi';
  }
});

/* ================= TRIỂN LÃM ================= */
let items = [], view = [], sortMode = 'new', shown = 0;
let known = null; const fresh = new Set();
const PAGE = 24;
const imgUrl = (it, w = 1000) => it.img || (it.id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(it.id)}&sz=w${w}` : '');
const fullUrl = (it) => it.img || `https://drive.google.com/file/d/${encodeURIComponent(it.id)}/view`;

function timeAgo(iso) {
  const t = new Date(iso).getTime(); if (!t) return '';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' ngày trước';
  return new Date(t).toLocaleDateString('vi-VN');
}
function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }

async function loadGallery(scrollToNew) {
  try {
    if (DEMO) items = store.get('thu-local', []);
    else {
      const res = await fetch(API + (API.includes('?') ? '&' : '?') + 'action=list&t=' + Date.now());
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      items = j.items || [];
    }
  } catch (err) {
    console.error(err);
    if (!items.length) $('#wall').innerHTML = '';
    toast('Chưa tải được triển lãm, sẽ thử lại sau.', 'err');
  }
  ['navCount', 'galCount'].forEach(id => $('#' + id).textContent = items.length);
  const arrived = known ? items.filter(it => !known.has(it.id)) : [];
  known = new Set(items.map(it => it.id));
  arrived.forEach(it => fresh.add(it.id));
  applyView();
  if (arrived.length) announce(arrived);
}

/* ---------- Hiệu ứng khi có thư mới ---------- */
function announce(list) {
  const mine = new Set(store.get('thu-mine', []));
  list.slice(0, 3).forEach((it, i) => setTimeout(() => { if (!mine.has(it.id)) tick(it); bumpBadge(); }, i * 900));
  if (list.some(it => mine.has(it.id))) confetti();
  if (!$('#show').hidden) showQueue.push(...list);
  setTimeout(() => { list.forEach(it => fresh.delete(it.id)); $$('.wish.fresh').forEach(el => el.classList.add('glow-off')); }, 30000);
}
function tick(it) {
  const t = document.createElement('div'); t.className = 'tick';
  const m = document.createElement('div');
  const b = document.createElement('b'); b.textContent = it.name;
  const sm = document.createElement('small'); sm.textContent = 'vừa gửi thư đến Hội nghị 🕊';
  m.append(b, sm); t.append(avatarEl(it), m);
  t.addEventListener('click', () => { const i = view.findIndex(v => v.id === it.id); if (i >= 0) openLightbox(i); });
  $('#ticker').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 6000);
}
function bumpBadge() { $('#navCount').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 500 }); }

function confetti() {
  const c = $('#confetti'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  const W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
  const cols = ['#e42d2a', '#f53e19', '#ffb21a', '#23a3dd', '#1c70b8', '#ffffff'];
  const P = Array.from({ length: 180 }, () => ({
    x: W / 2 + (Math.random() - .5) * W * .3, y: H * .6, vx: (Math.random() - .5) * 26 * dpr, vy: (-Math.random() * 26 - 10) * dpr,
    s: (6 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.random() * cols.length | 0], o: 1,
  }));
  let n = 0;
  (function f() {
    x.clearRect(0, 0, W, H); n++;
    P.forEach(p => { p.vy += .6 * dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; if (n > 90) p.o -= .02;
      x.save(); x.globalAlpha = Math.max(0, p.o); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
    if (n < 160) requestAnimationFrame(f); else x.clearRect(0, 0, W, H);
  })();
}


function applyView() {
  const q = norm($('#q').value.trim());
  view = items.filter(it => !q || norm(it.name + ' ' + it.role + ' ' + it.message).includes(q));
  if (sortMode === 'random') view = view.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
  shown = 0;
  $('#wall').innerHTML = '';
  $('#empty').hidden = items.length > 0;
  if (items.length && !view.length) { $('#wall').innerHTML = '<p class="muted" style="text-align:center;column-span:all">Không tìm thấy lá thư phù hợp.</p>'; }
  more();
}
function more() {
  const mine = new Set(store.get('thu-mine', []));
  const frag = document.createDocumentFragment();
  view.slice(shown, shown + PAGE).forEach((it, i) => frag.appendChild(wishCard(it, shown + i, mine.has(it.id), i)));
  shown = Math.min(view.length, shown + PAGE);
  $('#wall').appendChild(frag);
  $('#btnMore').hidden = shown >= view.length;
}
$('#btnMore').addEventListener('click', more);

function avatarEl(it) {
  const a = document.createElement('div');
  a.className = 'ava';
  a.textContent = (it.name || '?').trim().split(/\s+/).pop()[0] || '?';
  const u = imgUrl(it, 1000);
  if (u) {
    const probe = new Image();
    probe.onload = () => { a.classList.add('crop'); a.style.backgroundImage = `url("${u}")`; };
    probe.src = u;
  }
  return a;
}
function wishCard(it, idx, mine, i) {
  const el = document.createElement('article');
  el.className = 'wish' + (mine ? ' mine' : '') + (fresh.has(it.id) ? ' fresh' : '');
  el.style.setProperty('--d', Math.min(i, 12) * 0.04 + 's');
  const who = document.createElement('div'); who.className = 'who';
  const meta = document.createElement('div');
  const h = document.createElement('h3'); h.textContent = it.name;
  const p = document.createElement('p'); p.textContent = it.role || 'Sinh viên Khoa Kinh tế';
  meta.append(h, p); who.append(avatarEl(it), meta);
  const q = document.createElement('blockquote'); q.textContent = it.message;
  const f = document.createElement('footer');
  const t = document.createElement('time'); t.textContent = (mine ? 'Thư của bạn · ' : '') + timeAgo(it.time);
  const v = document.createElement('span'); v.innerHTML = '<svg><use href="#i-image"/></svg>Xem thư';
  f.append(t, v);
  el.append(who, q, f);
  if (fresh.has(it.id)) {
    const nb = document.createElement('span'); nb.className = 'new'; nb.textContent = 'MỚI';
    const env = document.createElement('div'); env.className = 'env'; env.innerHTML = '<svg><use href="#i-mail"/></svg>';
    el.append(nb, env);
  }
  el.addEventListener('click', () => openLightbox(idx));
  return el;
}

$('#q').addEventListener('input', debounce(applyView, 200));
$$('.seg button').forEach(b => b.addEventListener('click', () => {
  $$('.seg button').forEach(x => x.classList.toggle('on', x === b));
  sortMode = b.dataset.sort; applyView();
}));

/* ---------- Lightbox ---------- */
let lbIdx = 0;
function openLightbox(i) {
  if (!view.length) return;
  lbIdx = (i + view.length) % view.length;
  const it = view[lbIdx];
  const img = $('#lbImg');
  img.classList.remove('ready');
  img.onload = () => img.classList.add('ready');
  img.onerror = () => img.classList.remove('ready');
  img.src = imgUrl(it, 2000);
  img.alt = 'Thư của ' + it.name;
  const ava = $('#lbAva'); ava.replaceWith(Object.assign(avatarEl(it), { id: 'lbAva' }));
  $('#lbName').textContent = it.name;
  $('#lbRole').textContent = it.role || 'Sinh viên Khoa Kinh tế';
  $('#lbMsg').textContent = it.message;
  $('#lbTime').textContent = timeAgo(it.time);
  const open = $('#lbOpen');
  open.href = fullUrl(it);
  if (it.img) open.setAttribute('download', `thu-${slug(it.name)}.jpg`); else open.removeAttribute('download');
  $('#lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
}
$('#lbPrev').addEventListener('click', () => openLightbox(lbIdx - 1));
$('#lbNext').addEventListener('click', () => openLightbox(lbIdx + 1));

/* ---------- Trình chiếu ---------- */
let showIdx = 0, showTimer = 0, showStart = 0; const showQueue = [];
const SHOW_MS = (CFG.SLIDESHOW_SECONDS || 7) * 1000;
$('#btnShow').addEventListener('click', () => {
  if (!view.length) { toast('Chưa có lá thư nào để trình chiếu.'); return; }
  $('#show').hidden = false; document.body.style.overflow = 'hidden';
  showIdx = 0; showSlide();
});
function showSlide() {
  const stage = $('#showStage');
  const queued = showQueue.shift();
  const it = queued || view[(showIdx + view.length) % view.length];
  const s = document.createElement('div'); s.className = 'slide';
  if (queued) { const fl = document.createElement('div'); fl.className = 'flag'; fl.textContent = '🕊 THƯ MỚI VỪA ĐẾN'; s.appendChild(fl); showIdx--; }
  const u = imgUrl(it, 2000);
  const im = new Image(); im.alt = 'Thư của ' + it.name;
  im.onerror = () => { s.innerHTML = ''; const t = document.createElement('div'); t.className = 'txt'; const q = document.createElement('blockquote'); q.textContent = it.message; const h = document.createElement('h3'); h.textContent = it.name; t.append(q, h); s.appendChild(t); };
  im.src = u; s.insertBefore(im, s.firstChild);
  stage.appendChild(s);
  void s.offsetWidth; setTimeout(() => s.classList.add('on'), 20);
  [...stage.children].slice(0, -1).forEach(o => { o.classList.remove('on'); setTimeout(() => o.remove(), 1100); });
  $('#showIdx').textContent = `${(showIdx % view.length + view.length) % view.length + 1} / ${view.length}`;
  clearTimeout(showTimer); showStart = performance.now();
  showTimer = setTimeout(() => { showIdx++; showSlide(); }, queued ? SHOW_MS * 1.5 : SHOW_MS);
  tickProg();
}
function tickProg() {
  if ($('#show').hidden) return;
  const p = Math.min(1, (performance.now() - showStart) / SHOW_MS);
  $('#showProg').style.width = p * 100 + '%';
  requestAnimationFrame(tickProg);
}
$('#showPrev').addEventListener('click', () => { showIdx--; showSlide(); });
$('#showNext').addEventListener('click', () => { showIdx++; showSlide(); });
$('#showFull').addEventListener('click', () => { const el = $('#show'); (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.())?.catch?.(() => {}); });
function closeShow() { clearTimeout(showTimer); $('#show').hidden = true; $('#showStage').innerHTML = ''; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }

/* ---------- Modal chung ---------- */
function openModal(id) { $('#' + id).hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(id) { $('#' + id).hidden = true; if (!$$('.modal:not([hidden]),.lightbox:not([hidden]),.show:not([hidden])').length) document.body.style.overflow = ''; }
function closeAll() {
  $$('.modal').forEach(m => m.hidden = true);
  $('#lightbox').hidden = true;
  if (!$('#show').hidden) closeShow();
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-close]');
  if (c) { const box = c.closest('.modal,.lightbox,.show'); if (box?.id === 'show') closeShow(); else if (box) { box.hidden = true; closeModal(box.id); } return; }
  if (e.target.classList.contains('modal') || e.target.classList.contains('lightbox')) { e.target.hidden = true; closeModal(e.target.id); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAll();
  if (!$('#lightbox').hidden) { if (e.key === 'ArrowLeft') openLightbox(lbIdx - 1); if (e.key === 'ArrowRight') openLightbox(lbIdx + 1); }
  if (!$('#show').hidden) { if (e.key === 'ArrowLeft') { showIdx--; showSlide(); } if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); showIdx++; showSlide(); } }
});

/* ---------- Tiện ích ---------- */
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

// Đánh dấu tab đang xem
const io = new IntersectionObserver((ents) => ents.forEach(en => {
  if (en.isIntersecting) $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === en.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['viet-thu', 'trien-lam'].forEach(id => io.observe($('#' + id)));

/* ---------- Nhạc nền ---------- */
(function music() {
  const btn = $('#music');
  const target = CFG.MUSIC_VOLUME ?? 0.45;
  const evs = ['pointerdown', 'keydown', 'touchstart'];
  let player = null; // giao diện chung: play() -> Promise<bool>, pause(), setVol(0..1), getVol(), paused()

  if (CFG.MUSIC_SRC) {
    const a = $('#bgm'); a.src = CFG.MUSIC_SRC; a.volume = 0;
    a.addEventListener('canplay', () => { btn.hidden = false; }, { once: true });
    a.addEventListener('error', () => { btn.hidden = true; });
    player = { play: () => a.play().then(() => true).catch(() => false), pause: () => a.pause(), setVol: v => a.volume = v, getVol: () => a.volume, paused: () => a.paused };
    start();
  } else if (CFG.MUSIC_YOUTUBE_ID) {
    // Trình phát YouTube ẩn (nhạc phát từ YouTube, không cần tải file)
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-9999px;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none';
    holder.innerHTML = '<div id="ytMusic"></div>';
    document.body.appendChild(holder);
    let yt = null, playing = false, vol = 0, waiters = [];
    window.onYouTubeIframeAPIReady = () => {
      yt = new YT.Player('ytMusic', {
        videoId: CFG.MUSIC_YOUTUBE_ID, width: 200, height: 200,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: CFG.MUSIC_YOUTUBE_ID, playsinline: 1, rel: 0, start: CFG.MUSIC_START || 0 },
        events: {
          onReady: () => { yt.setVolume(0); btn.hidden = false; start(); },
          onStateChange: (e) => {
            playing = e.data === YT.PlayerState.PLAYING;
            if (playing) { waiters.forEach(w => w(true)); waiters = []; }
            if (e.data === YT.PlayerState.ENDED) yt.playVideo();
          },
          onError: () => { btn.hidden = true; console.info('Video nhạc không cho nhúng hoặc không tồn tại.'); },
        },
      });
    };
    const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
    player = {
      play: () => new Promise(res => {
        if (!yt) return res(false);
        waiters.push(res); yt.playVideo();
        setTimeout(() => { if (!playing) { waiters = waiters.filter(w => w !== res); res(false); } }, 1500);
      }),
      pause: () => yt && yt.pauseVideo(),
      setVol: v => { vol = v; yt && yt.setVolume(Math.round(v * 100)); },
      getVol: () => vol,
      paused: () => !playing,
    };
  } else return;

  const fade = (to, ms = 1200) => {
    const from = player.getVol(), t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / ms); player.setVol(from + (to - from) * k); if (k < 1) requestAnimationFrame(f); else if (to === 0) player.pause(); })(t0);
  };
  const play = () => player.play().then(ok => { if (ok) { btn.classList.add('on'); fade(target); } return ok; });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = player.paused(); store.set('thu-music', on);
    if (on) play(); else { btn.classList.remove('on'); fade(0, 500); }
  });

  function start() {
    if (!store.get('thu-music', true)) return;
    play().then(ok => {
      if (ok) return;
      // Trình duyệt chặn tự phát nhạc có tiếng: phát ở lần chạm/bấm đầu tiên
      const first = (e) => {
        if (e.target.closest && e.target.closest('#music')) return;
        evs.forEach(ev => window.removeEventListener(ev, first, true));
        if (store.get('thu-music', true)) play();
      };
      evs.forEach(ev => window.addEventListener(ev, first, true));
    });
  }
})();

/* ---------- Chế độ thử: giả lập thư mới đến ---------- */
const SAMPLE_PEOPLE = [['Nguyễn Minh Anh', 'Chi hội trưởng Chi hội K25401'], ['Trần Quốc Bảo', 'Sinh viên K24402'], ['Lê Thảo Chi', 'Ủy viên Ban Chấp hành Liên Chi Hội'], ['Phạm Gia Huy', 'Chi hội phó Chi hội K23401'], ['Võ Ngọc Hân', 'Sinh viên K25403']];
$('#btnSimulate').addEventListener('click', () => {
  const [name, role] = SAMPLE_PEOPLE[Math.random() * SAMPLE_PEOPLE.length | 0];
  const message = MESSAGES[Math.random() * MESSAGES.length | 0];
  const keep = { img: st.img, name: st.name, role: st.role, msg: st.msg };
  Object.assign(st, { img: null, name, role, msg: message });
  const c = document.createElement('canvas'); c.width = c.height = 1000; render(c.getContext('2d'), 0.5, true);
  Object.assign(st, keep); schedule();
  const local = store.get('thu-local', []);
  local.unshift({ id: 'local-sim-' + Date.now(), name, role, message, time: new Date().toISOString(), img: c.toDataURL('image/jpeg', .8) });
  while (local.length && !store.set('thu-local', local)) local.pop();
  document.documentElement.style.scrollBehavior = '';
  $('#trien-lam').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => loadGallery(), 600);
});

/* ---------- Khởi động ---------- */
if (DEMO) $('#demoBar').hidden = false;
$('#wall').innerHTML = '<div class="skel"></div><div class="skel" style="height:280px"></div><div class="skel"></div>';
new ResizeObserver(sizeCanvas).observe(cv);
frame.onload = async () => {
  try { await Promise.all([document.fonts.load(`700 48px ${FONT}`, 'Đồng chí'), document.fonts.load(`400 54px ${FONT}`, 'Lời chúc')]); } catch {}
  ready = true;
  $('#loadingFrame').classList.add('gone');
  syncUI(); updFitNote();
};
frame.onerror = () => toast('Không tải được khung thư (assets/frame.jpg).', 'err');
frame.src = 'assets/frame.jpg';
document.fonts.ready.then(schedule);
syncUI();
loadGallery();
if (CFG.GALLERY_REFRESH_SECONDS > 0 && !DEMO) setInterval(() => { if (document.visibilityState === 'visible' && $('#lightbox').hidden && $('#show').hidden) loadGallery(); }, CFG.GALLERY_REFRESH_SECONDS * 1000);

// Cho phép kiểm thử
window.ThuApp = { loadFile, state: st };
})();
