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

/**
 * Điểm "tự nhiên" của một giọng: giọng thần kinh / nâng cao đọc có lên xuống hơn hẳn giọng cục bộ cũ.
 *   Edge (Windows): "Microsoft HoaiMy / NamMinh Online (Natural)"  · Chrome: "Google Tiếng Việt"
 *   iPhone: "Linh (Nâng cao / Enhanced / Premium)" nếu đã tải trong Cài đặt → Trợ năng → Nội dung được đọc.
 */
function voiceScore(v) {
  let sc = 0;
  if (/natural|neural|premium|enhanced|nâng cao|cao cấp|wavenet|studio/i.test(v.name)) sc += 4;
  if (/online|google/i.test(v.name) || v.localService === false) sc += 2;
  if (v.default) sc += 0.5;
  return sc;
}
function pickVoice() {
  if (!synth) return null;
  const vs = synth.getVoices();
  if (vs.length) voicesLoaded = true;
  const vi = vs.filter((v) => /^vi(-|_|$)/i.test(v.lang));
  viVoice = vi.sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null;
  return viVoice;
}
/** Tên giọng đang dùng (để hiện cho thầy cô biết máy đang đọc bằng giọng nào). */
export const voiceName = () => (viVoice || pickVoice())?.name || '';
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
export function say(text, { rate = 1.2, pitch = 1, onend = null } = {}) {
  // text: một câu, hoặc nhiều đoạn [{ text, rate, pitch }] đọc liền nhau với giọng điệu khác nhau
  // (vd lời khen cao giọng hơn, rồi tới câu hướng dẫn giọng chuẩn) — đọc xong đoạn cuối mới báo onend.
  const parts = (Array.isArray(text) ? text : [{ text }])
    .map((p) => ({ text: String(p.text || '').trim(), rate: p.rate ?? rate, pitch: p.pitch ?? pitch }))
    .filter((p) => p.text);
  if (!synth || !parts.length || !unlocked) return false;
  const v = viVoice || pickVoice();
  if (!v) return false;
  const us = parts.map((p) => {
    const x = new SpeechSynthesisUtterance(p.text);
    x.voice = v; x.lang = v.lang; x.rate = p.rate; x.pitch = p.pitch;
    return x;
  });
  const u = us[us.length - 1];
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    if (current === u) current = null;
    onend?.();
  };
  u.onend = fire;
  us.forEach((x) => { x.onerror = fire; });
  const start = () => { current = u; us.forEach((x) => synth.speak(x)); };
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
