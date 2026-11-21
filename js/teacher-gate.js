// Khoá nhẹ cho trang "Giáo viên": nhập mã mới vào được. Mã không nằm trong mã nguồn, chỉ có mã băm SHA-256.
// LƯU Ý: đây chỉ là khoá chống học sinh bấm nhầm, KHÔNG phải bảo mật thật (trang tĩnh, ai rành kỹ thuật vẫn vượt được).
// Quyền ghi thật sự lên GitHub vẫn cần token riêng của thầy cô.
// Đổi mã: chạy  printf '%s' 'gdtc:MÃ_MỚI' | sha256sum  rồi dán kết quả vào CODE_HASH (xem README).

const CODE_HASH = '17754fdba6c4d2a3fd848fb7f91e96b783f70951838333f75d4098757d06fa87';
const KEY = 'gdtc-teacher-ok';

export function isTeacherUnlocked() {
  try { return sessionStorage.getItem(KEY) === CODE_HASH; } catch { return false; }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function lockTeacher() {
  try { sessionStorage.removeItem(KEY); } catch { /* bỏ qua */ }
}

export function renderTeacherGate(root, onUnlock) {
  root.innerHTML = `
    <div class="gate">
      <div class="gate__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32"><path fill="currentColor" d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3zm0 10a2 2 0 0 0-1 3.7V19h2v-1.3A2 2 0 0 0 12 14z"/></svg>
      </div>
      <h1 id="teacher-title">Trang giáo viên</h1>
      <p class="muted">Nhập mã để vào.</p>
      <form class="gate__form" novalidate>
        <label for="gate-code" class="visually-hidden">Mã giáo viên</label>
        <input id="gate-code" class="gate__input" type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="••••" required>
        <button class="btn btn--primary btn--lg" type="submit">Vào</button>
      </form>
      <p class="gate__msg" role="alert"></p>
      <p><a href="#">← Về trang chủ</a></p>
    </div>`;
  const form = root.querySelector('form');
  const input = root.querySelector('input');
  const msg = root.querySelector('.gate__msg');
  input.focus();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!globalThis.crypto?.subtle) { msg.textContent = 'Hãy mở trang bằng link https (GitHub Pages).'; return; }
    const h = await sha256(`gdtc:${input.value.trim()}`);
    if (h === CODE_HASH) {
      try { sessionStorage.setItem(KEY, h); } catch { /* bỏ qua */ }
      onUnlock();
    } else {
      msg.textContent = 'Mã chưa đúng. Thử lại nhé.';
      input.value = ''; input.focus();
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    }
  });
}
