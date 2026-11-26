// Đọc hướng dẫn bằng giọng tiếng Việt có sẵn trong máy (Web Speech API, không cần mạng, không gửi gì đi).
// Máy không có giọng tiếng Việt thì im lặng (giọng tiếng Anh đọc tiếng Việt rất khó nghe) — trang vẫn hiện chữ.
//
// iPhone (Safari, và cả Zalo / mọi ứng dụng trên iPhone vì đều dùng WebKit): câu đọc ĐẦU TIÊN phải
// được gọi ngay trong lúc người dùng chạm. Trước đó mọi câu đọc gọi từ hoạt hình / hẹn giờ / sau khi
// tải xong đều bị bỏ qua lặng lẽ (không báo "đọc xong"). Vì vậy:
//   - installVoiceUnlock(): bắt cú chạm đầu tiên ở BẤT KỲ đâu trên trang để mở khoá (đọc một câu câm);
//   - say() khi chưa mở khoá thì trả về false, để trình phát không đứng chờ một câu sẽ không bao giờ phát.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const KEY = 'gdtc-voice';
let viVoice = null;
let voicesLoaded = false; // đã nhận danh sách giọng (hoặc đã chờ đủ lâu)
let unlocked = false;     // đã có một câu đọc nằm TRONG cú chạm
let current = null;       // câu đang đọc — giữ tham chiếu để Safari không "quên" câu (mất onend)
let unlockedAt = -Infinity; // lúc mở khoá — để biết cú chạm vừa rồi có phải chính cú mở khoá không

function pickVoice() {
  if (!synth) return null;
  const vs = synth.getVoices();
  if (vs.length) voicesLoaded = true;
  viVoice = vs.find((v) => /^vi(-|_|$)/i.test(v.lang) && v.localService) || vs.find((v) => /^vi(-|_|$)/i.test(v.lang)) || null;
  return viVoice;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
  // iPhone có lúc không báo "voiceschanged": hỏi lại vài lần trong 3 giây đầu.
  let n = 0;
  const t = setInterval(() => { pickVoice(); if (viVoice || ++n >= 12) { clearInterval(t); voicesLoaded = true; } }, 250);
}

export const speechSupported = () => Boolean(synth);
/** Có giọng tiếng Việt chưa (danh sách giọng có thể nạp chậm vài trăm ms). */
export const hasVietnameseVoice = () => Boolean(viVoice || pickVoice());
/** Máy đã cho đọc chưa (đã có cú chạm mở khoá). */
export const voiceUnlocked = () => unlocked;
/** Mở khoá vừa xảy ra trong khoảng ms gần đây (cú chạm hiện tại chính là cú mở khoá). */
export const justUnlocked = (ms = 1500) => unlocked && performance.now() - unlockedAt < ms;

/**
 * Tình trạng giọng đọc: 'unsupported' (trình duyệt không có — vd Zalo trên Android) · 'loading' ·
 * 'novoice' (không có giọng tiếng Việt) · 'locked' (chờ cú chạm đầu) · 'ready'.
 */
export function voiceStatus() {
  if (!synth) return 'unsupported';
  if (!hasVietnameseVoice()) return voicesLoaded ? 'novoice' : 'loading';
  return unlocked ? 'ready' : 'locked';
}

/**
 * Mở khoá giọng đọc. PHẢI gọi ngay trong trình xử lý cú chạm/bấm (không sau await / hẹn giờ).
 * Trả về true nếu đã mở khoá.
 */
export function unlockVoice() {
  if (!synth) return false;
  if (unlocked) return true;
  try {
    pickVoice();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    if (viVoice) { u.voice = viVoice; u.lang = viVoice.lang; }
    synth.speak(u);
    unlocked = true;
    unlockedAt = performance.now();
    window.dispatchEvent(new CustomEvent('gdtc:voice-unlocked'));
  } catch { /* bỏ qua */ }
  return unlocked;
}

/** Bắt cú chạm/bấm đầu tiên ở bất kỳ đâu trên trang để mở khoá giọng đọc (gọi một lần lúc khởi động). */
export function installVoiceUnlock() {
  if (!synth || installVoiceUnlock.done) return;
  installVoiceUnlock.done = true;
  // touchend / click / keydown được iOS coi là "người dùng chủ động"; pointerdown / touchstart thì không.
  const types = ['touchend', 'click', 'keydown'];
  const onGesture = () => {
    if (unlockVoice()) types.forEach((t) => document.removeEventListener(t, onGesture, true));
  };
  types.forEach((t) => document.addEventListener(t, onGesture, { capture: true, passive: true }));
}

/** Ước lượng thời gian đọc (ms) để làm mốc dự phòng khi trình duyệt không báo "đọc xong". */
export function speechMs(text, rate = 1.2) {
  const syllables = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.round((syllables / (3 * rate)) * 1000) + 500; // tiếng Việt ~3 tiếng/giây ở tốc độ thường
}

export function voicePref() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setVoicePref(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* chế độ riêng tư */ }
  if (!on) stopVoice();
}

/**
 * Đọc một câu (thay câu đang đọc dở). Trả về false nếu không đọc được — kể cả khi máy CHƯA cho đọc
 * (chưa có cú chạm mở khoá): khi đó người gọi không được đứng chờ "đọc xong".
 * onend: gọi khi đọc xong (hoặc lỗi) — dùng để chờ đọc hết nhịp rồi mới sang nhịp sau.
 */
export function say(text, { rate = 1.2, onend = null } = {}) {
  if (!synth || !text || !unlocked) return false;
  const v = viVoice || pickVoice();
  if (!v) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; u.rate = rate;
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    if (current === u) current = null;
    onend?.();
  };
  u.onend = fire; u.onerror = fire;
  const start = () => { current = u; synth.speak(u); };
  if (current) {
    // Đang đọc câu trước: huỷ rồi đợi một chút mới đọc (Safari hay "nuốt" câu đọc ngay sau cancel()).
    current = null;
    synth.cancel();
    setTimeout(start, 60);
  } else start();
  return true;
}

/** Tên cũ, vẫn dùng ở mục Tự tập: mở khoá trong lúc bấm "Bật camera". */
export const primeVoice = unlockVoice;

export function stopVoice() {
  if (!synth) return;
  current = null;
  synth.cancel();
}

// Tiếng "ting" ngắn báo đạt nhịp (nghe được khi đứng xa, không cần nhìn màn hình).
let actx = null;
export function primeSound() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch { actx = null; }
}
export function ding(ok = true) {
  if (!actx) return;
  try {
    const t = actx.currentTime;
    (ok ? [880, 1320] : [330]).forEach((f, k) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + k * 0.09);
      g.gain.exponentialRampToValueAtTime(0.35, t + k * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.09 + 0.22);
      o.connect(g).connect(actx.destination);
      o.start(t + k * 0.09); o.stop(t + k * 0.09 + 0.25);
    });
  } catch { /* bỏ qua */ }
}
