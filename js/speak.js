// Đọc hướng dẫn bằng giọng tiếng Việt có sẵn trong máy (Web Speech API, không cần mạng, không gửi gì đi).
// Máy không có giọng tiếng Việt thì im lặng (giọng tiếng Anh đọc tiếng Việt rất khó nghe) — trang vẫn hiện chữ.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const KEY = 'gdtc-voice';
let viVoice = null;

function pickVoice() {
  if (!synth) return null;
  const vs = synth.getVoices();
  viVoice = vs.find((v) => /^vi(-|_|$)/i.test(v.lang) && v.localService) || vs.find((v) => /^vi(-|_|$)/i.test(v.lang)) || null;
  return viVoice;
}
if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice); }

export const speechSupported = () => Boolean(synth);
/** Có giọng tiếng Việt chưa (danh sách giọng có thể nạp chậm vài trăm ms). */
export const hasVietnameseVoice = () => Boolean(viVoice || pickVoice());

export function voicePref() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setVoicePref(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* chế độ riêng tư */ }
  if (!on) synth?.cancel();
}

/** Đọc một câu (huỷ câu đang đọc dở). Trả về false nếu không đọc được. */
export function say(text, { rate = 1.2 } = {}) {
  if (!synth || !text) return false;
  const v = viVoice || pickVoice();
  if (!v) return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; u.rate = rate;
  synth.speak(u);
  return true;
}

/** Gọi trong lúc người dùng bấm (iOS chỉ cho đọc sau một lần bấm). */
export function primeVoice() {
  if (!synth) return;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch { /* bỏ qua */ }
}

export function stopVoice() { synth?.cancel(); }

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
