// Nhạc nền vui nhộn cho ứng dụng.
//  - Nếu thầy cô thả một tệp nhạc (mp3, m4a…) có quyền sử dụng vào thư mục media/nhac/ → khi deploy, GitHub Actions
//    ghi tên tệp vào data/music.json và trang phát tệp đó, lặp lại.
//  - Chưa có tệp → phát giai điệu vui do chính trang tự soạn bằng WebAudio (không dùng nhạc của ai, không vướng
//    bản quyền, không cần tải gì).
// Cách bật / tắt:
//  - Trình duyệt chỉ cho phát tiếng sau khi người dùng chạm: nhạc tự bật ở lần chạm đầu tiên vào ứng dụng.
//  - Bật camera / video ở mục Tự tập → nhạc tạm dừng, chỉ còn giọng nói hướng dẫn; tập xong thì phát lại.
//  - Bấm xem video hướng dẫn → nhạc dừng (em bật lại bằng nút ♪).
//  - Nút "♪ Nhạc" trên thanh tiêu đề và trong hộp bài học để bật / tắt (máy nhớ lựa chọn).
const KEY = 'gdtc-music';
const VOLUME = 0.32;
let wanted = false, started = false, playing = false;
const blockedBy = new Set();

const pref = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
const savePref = (on) => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* chế độ riêng tư */ } };

// ------------------------------------------------------------------ Nguồn 1: tệp mp3 của thầy cô
let audio = null, songFile = null;
function loadManifest() {
  fetch('data/music.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).then((m) => { songFile = m?.file || null; }).catch(() => {});
}

// ------------------------------------------------------------------ Nguồn 2: giai điệu tự soạn (WebAudio)
// Nhịp 128 BPM, giọng Đô trưởng, vòng hoà âm C – G – Am – F (16 phách / vòng), trống + bass + giai điệu + hợp âm.
const BPM = 128, SPB = 60 / BPM, STEP = SPB / 2; // nốt móc đơn
let ctx = null, master = null, timer = 0, nextT = 0, step = 0, noiseBuf = null;
const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);
const CHORDS = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]; // C G Am F (quãng thấp)
// Giai điệu 4 ô nhịp × 8 nốt móc đơn (MIDI, 0 = nghỉ), lặp 2 lần với biến thể ở vòng sau.
const MEL = [
  [72, 0, 76, 79, 76, 0, 74, 72], [71, 0, 74, 79, 74, 0, 72, 71], [69, 72, 76, 0, 74, 72, 71, 69], [65, 69, 72, 0, 74, 0, 76, 0],
  [72, 76, 79, 84, 79, 0, 76, 74], [74, 0, 71, 74, 79, 0, 77, 76], [76, 0, 72, 76, 81, 79, 76, 74], [72, 0, 69, 72, 74, 0, 72, 0],
];

function voice(type, freq, t, dur, gain, attack = 0.005) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.25);
}
function noise(t, dur, gain, hp) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.02);
}
function schedule() {
  while (nextT < ctx.currentTime + 0.25) {
    const s = step % 64, bar = Math.floor(s / 8), beat = s % 8, t = nextT;
    const ch = CHORDS[bar % 4];
    if (beat % 2 === 0) kick(t);                              // trống cái mỗi phách
    if (beat === 2 || beat === 6) noise(t, 0.16, 0.35, 1200); // trống lẫy phách 2, 4
    noise(t, 0.04, beat % 2 ? 0.12 : 0.07, 7000);             // hi-hat
    if (beat % 2 === 1) voice('triangle', NOTE(ch[0] - 12), t, STEP * 0.9, 0.38); // bass nảy lệch phách
    if (beat === 0 || beat === 4) ch.forEach((n) => voice('sine', NOTE(n + 12), t, SPB * 1.6, 0.06, 0.02)); // hợp âm
    const m = MEL[bar][beat];
    if (m) voice('square', NOTE(m), t, STEP * 0.85, 0.07);
    nextT += STEP; step++;
  }
}
function synthStart() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  if (!master) { master = ctx.createGain(); master.connect(ctx.destination); }
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(VOLUME * 0.55, ctx.currentTime + 0.6);
  nextT = ctx.currentTime + 0.05;
  clearInterval(timer);
  timer = setInterval(schedule, 60);
  schedule();
}
function synthStop() {
  clearInterval(timer); timer = 0;
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
  }
}

// ------------------------------------------------------------------ Điều khiển chung
// Gọi ĐỒNG BỘ trong lúc người dùng chạm (iPhone chỉ cho mở âm thanh trong thao tác chạm).
function unlock() {
  try {
    if (songFile) { if (!audio) { audio = new Audio(songFile); audio.loop = true; audio.volume = VOLUME; audio.preload = 'auto'; } }
    else { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); }
  } catch { /* trình duyệt cũ */ }
}

function apply() {
  const on = wanted && pref() && !blockedBy.size;
  syncBtn();
  if (on === playing) return;
  playing = on;
  if (!on) { audio?.pause(); synthStop(); return; }
  if (songFile) {
    unlock();
    audio.play().catch(() => { playing = false; syncBtn(); });
  } else {
    try { synthStart(); } catch { playing = false; }
  }
}

function syncBtn() {
  const on = pref() && (wanted || !started);
  document.querySelectorAll('[data-music]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(on));
    const st = btn.querySelector('.music-btn__state');
    if (st) st.textContent = on ? 'Bật' : 'Tắt';
    btn.title = on ? 'Tắt nhạc nền' : 'Bật nhạc nền';
  });
}

function setOn(on) { savePref(on); wanted = on; apply(); }

/** Tạm dừng nhạc vì lý do (vd 'practice' khi đang bật camera); resumeFrom(lý do) để phát lại. */
export function pauseFor(reason) { blockedBy.add(reason); apply(); }
export function resumeFrom(reason) { blockedBy.delete(reason); apply(); }

export function initMusic() {
  loadManifest();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-music]')) return;
    started = true;
    unlock();
    setOn(!(pref() && wanted));
  });
  syncBtn();
  // Lần chạm đầu tiên vào ứng dụng → bật nhạc (nếu em chưa tắt).
  const first = (e) => {
    if (started || e.target.closest?.('[data-music]')) return;
    started = true;
    ['pointerdown', 'keydown'].forEach((t) => document.removeEventListener(t, first, true));
    if (pref()) { unlock(); wanted = true; apply(); }
  };
  ['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, first, true));
  window.addEventListener('gdtc:practice', (e) => (e.detail?.active ? pauseFor('practice') : resumeFrom('practice')));
  window.addEventListener('gdtc:video', () => { wanted = false; apply(); });
  // Ẩn tab / khoá màn hình → dừng; quay lại → phát tiếp.
  document.addEventListener('visibilitychange', () => (document.hidden ? pauseFor('hidden') : resumeFrom('hidden')));
}
