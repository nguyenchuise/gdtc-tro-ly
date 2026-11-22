// Tab "Tự tập": camera trước hoặc video → MediaPipe → chấm điểm.
// - Tỉ lệ đạt của từng bộ phận hiện nổi ngay trên hình.
// - Mọi bộ phận ≥ 80% đủ thời gian (hoặc đủ số lần đạt) → tự chụp ảnh, hiện "Kết quả lần này".
// - "Kết quả tốt nhất" được giữ trong lúc mở trang; tập lại mà tốt hơn thì tự thay.
// Không lưu, không gửi hình ảnh đi đâu (ảnh chụp chỉ nằm trong bộ nhớ trình duyệt, tải lại trang là mất).
import {
  loadPoseLandmarker, evaluateRules, measure, adviceFor, HoldTimer, RepCounter, CONNECTIONS, PASS_SCORE,
} from './pose-scoring.js';
import { esc } from './util.js';

const PART = {
  11: 'Vai trái', 12: 'Vai phải', 13: 'Khuỷu trái', 14: 'Khuỷu phải', 15: 'Cổ tay trái', 16: 'Cổ tay phải',
  23: 'Hông trái', 24: 'Hông phải', 25: 'Gối trái', 26: 'Gối phải', 27: 'Cổ chân trái', 28: 'Cổ chân phải',
};
const CAMERA_TIPS = {
  front: 'Để máy ngang ngực, cách <strong>2–3 m</strong>. Em <strong>quay mặt vào máy</strong>, thấy cả người.',
  side: 'Để máy ngang hông, cách <strong>2–3 m</strong>. Em <strong>đứng nghiêng</strong>, thấy cả người.',
};
/** Kết quả trong phiên (không lưu): id bài → { best, last } */
const session = new Map();

export function cameraTip(scoring) {
  return `${CAMERA_TIPS[scoring?.camera] || CAMERA_TIPS.front} Chỗ tập đủ sáng.`;
}

const tone = (s) => (s == null ? 'muted' : s >= PASS_SCORE ? 'ok' : s >= 50 ? 'mid' : 'bad');
const COLORS = { ok: '#16a34a', mid: '#f59e0b', bad: '#dc2626', muted: '#64748b' };
const fmtTime = (d) => d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

/** Dựng giao diện tự tập trong `root`. Trả về hàm dọn dẹp (tắt camera). */
export function mountPractice(root, ex) {
  const sc = ex.scoring;
  const isReps = sc.mode === 'reps';
  const rules = sc.rules || [];
  const goalText = isReps ? `Làm đúng <strong>${sc.reps.target} lần</strong>` : `Giữ đúng tư thế <strong>${sc.holdSeconds} giây</strong>`;
  root.innerHTML = `
    <div class="practice">
      <div class="goal-card">
        <span class="goal-card__icon" aria-hidden="true">${icon('target')}</span>
        <div><p class="goal-card__title">${goalText}</p>
          ${sc.pose ? `<p class="goal-card__pose">${esc(sc.pose)}</p>` : ''}
          <p class="goal-card__sub">Mỗi bộ phận đạt từ ${PASS_SCORE}% là được.</p></div>
      </div>
      <p class="tip">${cameraTip(sc)}</p>

      <div class="source-buttons">
        <button type="button" class="btn btn--primary btn--lg" data-act="camera">${icon('camera')} Bật camera</button>
        <div class="source-buttons__alt">
          <label class="btn btn--ghost">${icon('record')} Quay video
            <input type="file" accept="video/*" capture="user" data-act="file" class="visually-hidden"></label>
          <label class="btn btn--ghost">${icon('upload')} Chọn video
            <input type="file" accept="video/*" data-act="file" class="visually-hidden"></label>
        </div>
      </div>
      <p class="status" role="status" aria-live="polite"></p>

      <div class="live-grid">
      <div class="stage" hidden>
        <video playsinline muted aria-label="Hình của em"></video>
        <canvas aria-hidden="true"></canvas>
        <div class="float-labels" aria-hidden="true"></div>
        <div class="hud" aria-hidden="true">
          <span class="hud__score" data-k="hud">—</span>
          <span class="hud__label">${isReps ? 'lần đạt' : 'điểm'}</span>
        </div>
        <div class="hud-progress" aria-hidden="true"><span></span></div>
        <div class="pass-banner" hidden aria-hidden="true">Đạt!</div>
        <p class="stage-advice" aria-hidden="true"></p>
        ${rules.length ? '<ul class="stage-parts" aria-hidden="true"></ul>' : ''}
        <div class="stage-controls">
          <button type="button" class="btn btn--small btn--glass" data-act="flip" hidden>${icon('flip')}<span class="visually-hidden">Đổi camera</span></button>
          <button type="button" class="btn btn--small btn--danger" data-act="stop">Dừng</button>
        </div>
      </div>

      <div class="scoreboard" hidden>
        <div class="stats">
          ${isReps ? `
            <div class="stat"><span class="stat__value" data-k="reps">0/${sc.reps.target}</span><span class="stat__label">Lần đạt</span></div>
            <div class="stat"><span class="stat__value" data-k="total">0</span><span class="stat__label">Tổng số lần</span></div>
            <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Lần vừa rồi</span></div>`
          : `
            <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Điểm bây giờ</span></div>
            <div class="stat"><span class="stat__value" data-k="peak">—</span><span class="stat__label">Cao nhất</span></div>
            <div class="stat"><span class="stat__value" data-k="hold">0.0s</span><span class="stat__label">Đã giữ / ${sc.holdSeconds}s</span></div>`}
        </div>
        <p class="advice" aria-live="polite"></p>
        <div class="rules-details">
          <h4 class="rules-title">Từng bộ phận</h4>
          <div class="table-wrap"><table class="rules">
            <caption class="visually-hidden">Kết quả từng bộ phận</caption>
            <thead><tr><th scope="col">Bộ phận</th><th scope="col">Đo được</th><th scope="col">Cần</th><th scope="col">Đạt</th></tr></thead>
            <tbody></tbody>
          </table></div>
        </div>
      </div>
      </div>

      <section class="results" aria-live="polite" aria-label="Kết quả"></section>
      <p class="fine-print">Điểm chỉ để em tự luyện, không thay thầy cô chấm. Hình ảnh không lưu, không gửi đi.</p>
    </div>`;

  const sheet = root.closest('dialog');
  sheet?.classList.add('sheet--practice');
  const $ = (s) => root.querySelector(s);
  const stage = $('.stage'), video = $('video'), canvas = $('canvas'), ctx = canvas.getContext('2d');
  const labelsBox = $('.float-labels'), status = $('.status'), board = $('.scoreboard');
  const setStatus = (t) => { status.textContent = t; status.classList.toggle('is-loading', /^Đang/.test(t)); };

  let stream = null, objectUrl = null, raf = 0, facing = 'user', running = false, source = null;
  let lastVideoTime = -1, lastTs = 0, lastTableAt = 0, lastAdvice = '';
  // Một "lượt tập": từ lúc bật camera / bấm Tập lại đến khi đạt.
  let attempt = null;
  const timer = new HoldTimer(sc.holdSeconds || 2);
  const counter = isReps ? new RepCounter(sc.reps) : null;

  function newAttempt() {
    timer.reset(); counter?.reset();
    attempt = { done: false, smooth: rules.map(() => null), peak: 0, streak: null, goodReps: 0, goodQ: [] };
    $('.pass-banner').hidden = true;
    setVal('cur', '—'); setVal('peak', '—'); setVal('hold', '0.0s'); setVal('reps', `0/${sc.reps?.target}`); setVal('total', '0'); setVal('hud', '—');
    setProgress(0);
  }

  async function startCamera() {
    stop();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera chỉ chạy trên trang https. Em dùng nút “Chọn video” nhé.');
      return;
    }
    setStatus('Đang mở camera…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
    } catch (err) {
      stream = null;
      const msg = {
        NotAllowedError: 'Em chưa cho dùng camera. Bấm biểu tượng ổ khoá trên thanh địa chỉ để cho phép.',
        NotFoundError: 'Không thấy camera. Em dùng nút “Chọn video” nhé.',
        NotReadableError: 'Camera đang bận. Em tắt ứng dụng khác rồi thử lại.',
      }[err.name];
      setStatus(msg || 'Không mở được camera. Em thử lại nhé.');
      return;
    }
    source = 'camera';
    video.srcObject = stream;
    stage.classList.toggle('mirror', facing === 'user');
    $('[data-act="flip"]').hidden = false;
    await begin();
  }

  async function startFile(file) {
    if (!file) return;
    stop();
    source = 'file';
    objectUrl = URL.createObjectURL(file);
    video.srcObject = null;
    video.src = objectUrl;
    video.loop = true;
    video.controls = true;
    stage.classList.remove('mirror');
    $('[data-act="flip"]').hidden = true;
    await begin();
  }

  async function begin() {
    stage.hidden = false; board.hidden = false;
    root.querySelector('.practice').classList.add('is-live');
    requestAnimationFrame(() => stage.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    newAttempt();
    try { await video.play(); } catch { /* iOS: video tải lên có nút play */ }
    let lm;
    try {
      lm = await loadPoseLandmarker(setStatus);
    } catch (err) {
      console.warn(err);
      setStatus('Không tải được bộ chấm điểm. Em kiểm tra mạng rồi thử lại.');
      return;
    }
    if (!video.srcObject && !video.src) return; // đã dừng trong lúc tải
    setStatus('');
    running = true;
    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      lastTs = Math.max(lastTs + 1, performance.now());
      let res;
      try { res = lm.detectForVideo(video, lastTs); } catch (err) { console.warn(err); return; }
      process(res?.landmarks?.[0]);
    };
    loop();
  }

  function process(lm) {
    const w = video.videoWidth, h = video.videoHeight;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; stage.style.aspectRatio = `${w} / ${h}`; }
    ctx.clearRect(0, 0, w, h);
    const tSec = source === 'file' ? video.currentTime : performance.now() / 1000;
    if (!lm) {
      showAdvice('Chưa thấy em. Lùi ra xa cho máy thấy cả người nhé.');
      if (!isReps) { timer.update(null, tSec); attempt.streak = null; }
      labelsBox.replaceChildren();
      setVal('hud', '—');
      return;
    }
    const ev = evaluateRules(lm, rules, w, h);
    // Làm mượt điểm từng bộ phận để số không nhảy liên tục.
    const parts = ev.results.map((r, i) => {
      const prev = attempt.smooth[i];
      const s = r.score == null ? null : prev == null ? r.score : prev * 0.55 + r.score * 0.45;
      attempt.smooth[i] = s;
      return { label: r.rule.label, joint: r.joints?.[1], angle: r.angle, target: r.rule.target, score: s, missing: r.missing };
    });
    const allSeen = parts.every((p) => p.score != null);
    const avg = parts.length && allSeen ? parts.reduce((a, p) => a + p.score, 0) / parts.length : null;
    const allOk = allSeen && parts.every((p) => p.score >= PASS_SCORE);
    let repInfo = null;

    if (isReps) {
      const m = measure(lm, sc.reps, w, h);
      const before = counter.count;
      counter.update(m.angle);
      repInfo = m;
      if (counter.count > before && !attempt.done) {
        // Lần này đạt khi độ sâu đạt chuẩn và (nếu có) các bộ phận khác cũng đạt.
        const ok = counter.lastQuality >= PASS_SCORE && (!parts.length || allOk);
        if (ok) { attempt.goodReps += 1; attempt.goodQ.push(counter.lastQuality); }
        setVal('cur', `${Math.round(counter.lastQuality)}% ${ok ? 'đạt' : 'chưa'}`);
      }
      setVal('reps', `${attempt.goodReps}/${sc.reps.target}`);
      setVal('total', String(counter.count));
      setVal('hud', `${attempt.goodReps}/${sc.reps.target}`);
      setProgress(attempt.goodReps / sc.reps.target);
      if (m.angle == null) showAdvice(adviceFor({ unseen: [{ missing: m.missing }], results: [] }));
      else if (counter.state === 'down') showAdvice('Tốt! Giờ trở về như lúc đầu.');
      else showAdvice(counter.lastQuality != null && counter.lastQuality < PASS_SCORE
        ? 'Lần vừa rồi chưa đủ sâu. Cố thêm chút nữa!' : 'Bắt đầu nào! Làm thật đúng nhé.');
      if (!attempt.done && attempt.goodReps >= sc.reps.target) finish(lm, w, h, parts, m);
    } else {
      timer.update(allOk ? avg : null, tSec);
      // Cộng dồn điểm từng bộ phận trong lúc đang giữ đúng, để ghi kết quả.
      if (allOk) {
        if (!attempt.streak) attempt.streak = { n: 0, sums: parts.map(() => 0) };
        attempt.streak.n += 1;
        parts.forEach((p, i) => { attempt.streak.sums[i] += p.score; });
      } else attempt.streak = null;
      if (avg != null) attempt.peak = Math.max(attempt.peak, avg);
      setVal('cur', avg == null ? '—' : `${Math.round(avg)}%`);
      setVal('peak', attempt.peak ? `${Math.round(attempt.peak)}%` : '—');
      setVal('hold', `${Math.min(timer.current, 99).toFixed(1)}s`);
      setVal('hud', avg == null ? '—' : `${Math.round(avg)}%`);
      setProgress(timer.current / sc.holdSeconds);
      showAdvice(allOk ? `Đúng rồi! Giữ yên… ${Math.max(0, sc.holdSeconds - timer.current).toFixed(1)}s` : adviceFor(ev));
      if (!attempt.done && timer.done) finish(lm, w, h, parts, null);
    }
    stage.classList.toggle('is-ok', isReps ? counter.state === 'down' : allOk);
    drawSkeleton(ctx, lm, w, h, parts, repInfo);
    renderFloating(lm, parts, repInfo);
    const now = performance.now();
    if (now - lastTableAt > 300) { lastTableAt = now; renderTable(parts, repInfo); placeMini(lm); }
  }

  // ------------------------------------------------ Hoàn thành một lượt → chụp ảnh, ghi kết quả
  function finish(lm, w, h, parts, repInfo) {
    attempt.done = true;
    let result;
    if (isReps) {
      const q = attempt.goodQ.reduce((a, b) => a + b, 0) / attempt.goodQ.length;
      result = {
        score: Math.round(q),
        detail: `${attempt.goodReps}/${counter.count} lần đạt`,
        parts: [{ label: sc.reps.label, score: Math.round(q) }, ...parts.map((p) => ({ label: p.label, score: Math.round(p.score ?? 0) }))],
      };
    } else {
      const st = attempt.streak;
      const per = parts.map((p, i) => ({ label: p.label, score: Math.round(st ? st.sums[i] / st.n : p.score) }));
      result = {
        score: Math.round(per.reduce((a, p) => a + p.score, 0) / per.length),
        detail: `Giữ ${sc.holdSeconds} giây`,
        parts: per,
      };
    }
    result.time = new Date();
    result.image = snapshot(lm, w, h, parts, repInfo, result);
    const rec = session.get(ex.id) || { best: null, last: null };
    const newRecord = Boolean(rec.best) && result.score > rec.best.score;
    rec.last = result;
    if (!rec.best || newRecord) rec.best = result;
    session.set(ex.id, rec);
    $('.pass-banner').hidden = false;
    $('.pass-banner').textContent = newRecord ? 'Kỷ lục mới!' : 'Đạt!';
    navigator.vibrate?.([80, 60, 120]);
    renderResults(newRecord);
    setTimeout(() => root.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
  }

  function snapshot(lm, w, h, parts, repInfo, result) {
    const c = document.createElement('canvas');
    const footer = Math.round(h * 0.16);
    c.width = w; c.height = h + footer;
    const g = c.getContext('2d');
    const mirror = stage.classList.contains('mirror');
    g.save();
    if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(video, 0, 0, w, h);
    drawSkeleton(g, lm, w, h, parts, repInfo);
    g.restore();
    // Nhãn % từng bộ phận (vẽ chữ không lật)
    const fs = Math.max(14, Math.round(w / 34));
    g.font = `700 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.textBaseline = 'middle';
    placeLabels(lm, parts, repInfo, (fs * 0.6) / w, (fs * 1.7) / h).forEach(({ x, y, text, t }) => {
      const px = (mirror ? 1 - x : x) * w, py = y * h;
      const tw = g.measureText(text).width + fs;
      g.fillStyle = COLORS[t]; roundRect(g, px - tw / 2, py - fs * 0.85, tw, fs * 1.7, fs * 0.85); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(text, px, py);
    });
    // Dải thông tin bên dưới
    g.fillStyle = '#0b3d2c'; g.fillRect(0, h, w, footer);
    g.fillStyle = '#fff'; g.textAlign = 'left';
    g.font = `800 ${Math.round(footer * 0.42)}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.fillText(`ĐẠT ${result.score}%`, footer * 0.3, h + footer * 0.36);
    g.font = `500 ${Math.round(footer * 0.2)}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.fillText(`${ex.title} · ${result.detail} · ${fmtTime(result.time)}`, footer * 0.3, h + footer * 0.74, w - footer * 0.6);
    return c.toDataURL('image/jpeg', 0.86);
  }

  function renderResults(newRecord = false) {
    const box = root.querySelector('.results');
    const rec = session.get(ex.id);
    if (!rec) { box.innerHTML = ''; return; }
    const cardHtml = (r, kind) => `
      <article class="result-card result-card--${kind}">
        <header><h3>${kind === 'best' ? `${icon('trophy')} Kết quả tốt nhất` : 'Kết quả lần này'}</h3>
          ${kind === 'best' && newRecord ? '<span class="badge badge--record">Kỷ lục mới</span>' : ''}</header>
        <img src="${r.image}" alt="Ảnh lúc em đạt ${r.score}%" width="640" height="560">
        <div class="result-card__score"><strong>${r.score}%</strong><span>${esc(r.detail)} · ${fmtTime(r.time)}</span></div>
        <ul class="part-bars">${r.parts.map((p) => `<li><span>${esc(p.label)}</span>
          <span class="bar"><span style="width:${Math.min(100, p.score)}%" class="bar--${tone(p.score)}"></span></span><b>${p.score}%</b></li>`).join('')}</ul>
        <a class="btn btn--ghost btn--small" href="${r.image}" download="${ex.id}-${r.score}.jpg">${icon('upload')} Lưu ảnh về máy</a>
      </article>`;
    const showLast = rec.last && rec.last !== rec.best;
    box.innerHTML = `
      ${showLast ? cardHtml(rec.last, 'last') : ''}
      ${cardHtml(rec.best, 'best')}
      <p class="results__again"><button type="button" class="btn btn--primary" data-act="again">Tập lại để phá kỷ lục</button></p>`;
  }

  // ------------------------------------------------ Nhãn nổi trên hình
  /**
   * Đặt nhãn % cạnh từng khớp, tránh chồng lên nhau: thử phía trên khớp, rồi phía dưới, rồi xa dần.
   * charW, lineH: bề rộng 1 ký tự và chiều cao nhãn, tính theo tỉ lệ khung hình (0–1).
   * Trả về tâm nhãn {x, y} theo toạ độ ảnh gốc (chưa lật gương).
   */
  function placeLabels(lm, parts, repInfo, charW, lineH, obstacles = []) {
    const items = [];
    parts.forEach((p) => { if (p.score != null && p.joint != null) items.push({ joint: p.joint, text: `${PART[p.joint] || ''} ${Math.round(p.score)}%`.trim(), t: tone(p.score) }); });
    if (repInfo?.joints) items.push({ joint: repInfo.joints[1], text: `${PART[repInfo.joints[1]] || ''} ${Math.round(repInfo.angle)}°`, t: counter.state === 'down' ? 'ok' : 'muted' });
    const placed = [...obstacles];
    const hit = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 0.01 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + 0.005;
    const overlap = (a, b) => Math.max(0, (a.w + b.w) / 2 - Math.abs(a.x - b.x)) * Math.max(0, (a.h + b.h) / 2 - Math.abs(a.y - b.y));
    for (const it of items) {
      const j = lm[it.joint];
      if (!j) continue;
      const h = lineH, gap = h * 0.9;
      const candidates = (text) => {
        const w = (text.length + 2) * charW, side = w / 2 + h * 0.6;
        // Thứ tự thử: trên, dưới, trái, phải, chéo, rồi xa dần lên/xuống.
        return [[0, -gap], [0, gap], [-side, 0], [side, 0], [-side, -gap], [side, -gap], [-side, gap], [side, gap],
          [0, -gap - h * 1.1], [0, gap + h * 1.1]]
          .map(([dx, dy]) => ({ x: Math.min(1 - w / 2, Math.max(w / 2, j.x + dx)), y: Math.min(1 - h / 2, Math.max(h / 2, j.y + dy)), w, h, text }));
      };
      // Chật quá thì chỉ ghi phần trăm (màu chấm khớp và bảng chi tiết vẫn cho biết bộ phận nào).
      const shortText = it.text.split(' ').pop();
      const all = [...candidates(it.text), ...candidates(shortText)];
      let best = all.find((c) => !placed.some((p) => hit(p, c)));
      if (!best) best = candidates(shortText).map((c) => ({ c, o: placed.reduce((sum, p) => sum + overlap(p, c), 0) })).sort((a, b) => a.o - b.o)[0].c;
      placed.push(best);
      it.x = best.x; it.y = best.y; it.text = best.text;
    }
    return items.filter((it) => it.x != null);
  }

  /** Vùng của ô điểm (góc trái) và nút Dừng (góc phải) — nhãn không được đè lên. Toạ độ ảnh gốc (đã tính lật gương). */
  function stageObstacles(mirror) {
    const box = stage.getBoundingClientRect();
    if (!box.width) return [];
    return ['.hud', '.stage-controls', '.stage-parts'].map((sel) => root.querySelector(sel)?.getBoundingClientRect())
      .filter((r) => r && r.width > 0).map((r) => {
      const cx = (r.left + r.width / 2 - box.left) / box.width;
      return { x: mirror ? 1 - cx : cx, y: (r.top + r.height / 2 - box.top) / box.height, w: r.width / box.width + 0.02, h: r.height / box.height + 0.02 };
    });
  }

  function renderFloating(lm, parts, repInfo) {
    const sw = stage.clientWidth || 640, sh = stage.clientHeight || 480;
    const fpx = Math.min(14.4, Math.max(11.5, sw * 0.026));
    const mirror = stage.classList.contains('mirror');
    const items = placeLabels(lm, parts, repInfo, (fpx * 0.6) / sw, (fpx * 1.9) / sh, stageObstacles(mirror));
    while (labelsBox.children.length > items.length) labelsBox.lastChild.remove();
    items.forEach((it, i) => {
      let el = labelsBox.children[i];
      if (!el) { el = document.createElement('span'); labelsBox.append(el); }
      el.className = `float-label float-label--${it.t}`;
      el.style.left = `${(mirror ? 1 - it.x : it.x) * 100}%`;
      el.style.top = `${it.y * 100}%`;
      if (el.textContent !== it.text) el.textContent = it.text;
    });
  }

  /** Bảng nhỏ trên camera: đặt ở góc trên không che người; cả hai góc đều che → làm mờ để vẫn thấy dáng tập. */
  function placeMini(lm) {
    const mini = root.querySelector('.stage-parts');
    if (!mini || !mini.offsetWidth) return;
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const mirror = stage.classList.contains('mirror');
    const pts = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26].map((i) => lm[i])
      .filter((q) => q && (q.visibility ?? 1) >= 0.5).map((q) => [(mirror ? 1 - q.x : q.x) * sw, q.y * sh]);
    const w = mini.offsetWidth + 16, h = mini.offsetHeight + 16, top = mini.offsetTop - 8;
    const hits = (x0) => pts.filter(([x, y]) => x >= x0 && x <= x0 + w && y >= top && y <= top + h).length;
    const left = hits(0), right = hits(sw - w);
    const useRight = right < left;
    mini.classList.toggle('stage-parts--right', useRight);
    mini.classList.toggle('is-faded', Math.min(left, right) > 0);
  }

  function renderTable(parts, repInfo) {
    const rows = parts.map((p) => {
      const res = p.score == null ? '<span class="pill pill--muted">Chưa thấy</span>'
        : `<span class="pill pill--${p.score >= PASS_SCORE ? 'ok' : 'bad'}">${Math.round(p.score)}%</span>`;
      return `<tr><th scope="row">${esc(p.label)}</th><td>${p.angle == null ? '—' : `${Math.round(p.angle)}°`}</td><td>${p.target}°</td><td>${res}</td></tr>`;
    });
    if (repInfo) {
      rows.unshift(`<tr><th scope="row">${esc(sc.reps.label)}</th><td>${repInfo.angle == null ? '—' : `${Math.round(repInfo.angle)}°`}</td>
        <td>&lt;${sc.reps.down}° rồi &gt;${sc.reps.up}°</td>
        <td><span class="pill">${counter.state === 'down' ? 'Xuống' : 'Lên'}</span></td></tr>`);
    }
    root.querySelector('tbody').innerHTML = rows.join('');
    const mini = root.querySelector('.stage-parts');
    if (mini) {
      mini.innerHTML = parts.map((p) => {
        const t = p.score == null ? 'muted' : p.score >= PASS_SCORE ? 'ok' : 'bad';
        return `<li class="sp--${t}"><span>${esc(p.label)}</span><b>${p.score == null ? '—' : `${Math.round(p.score)}%`}</b></li>`;
      }).join('');
    }
  }

  function setVal(k, v) { const n = root.querySelector(`[data-k="${k}"]`); if (n && n.textContent !== v) n.textContent = v; }
  function setProgress(f) { $('.hud-progress span').style.width = `${Math.min(1, Math.max(0, f)) * 100}%`; }
  function showAdvice(t) {
    if (t === lastAdvice) return;
    lastAdvice = t;
    $('.advice').textContent = t;
    const sa = $('.stage-advice');
    sa.textContent = t;
    sa.classList.toggle('is-good', /^(Đúng rồi|Tốt)/.test(t));
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    video.removeAttribute('src');
    video.controls = false;
    video.load();
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    lastVideoTime = -1;
    stage.hidden = true;
    root.querySelector('.practice').classList.remove('is-live');
    labelsBox.replaceChildren();
    setStatus('');
  }

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'camera') startCamera();
    else if (act === 'stop') stop();
    else if (act === 'again') {
      if (running) newAttempt(); else startCamera();
      stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (act === 'flip') { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'file') { startFile(e.target.files?.[0]); e.target.value = ''; }
  });
  const onHidden = () => { if (document.hidden && source === 'camera') stop(); };
  document.addEventListener('visibilitychange', onHidden);
  renderResults();

  return () => { stop(); sheet?.classList.remove('sheet--practice'); document.removeEventListener('visibilitychange', onHidden); };
}

function drawSkeleton(g, lm, w, h, parts, repInfo) {
  const vis = (i) => lm[i] && (lm[i].visibility ?? 1) >= 0.5;
  const lw = Math.max(3, w / 160);
  g.lineCap = 'round';
  for (const [a, b] of CONNECTIONS) {
    if (!vis(a) || !vis(b)) continue;
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = lw + 3; seg(lm[a], lm[b]);
    g.strokeStyle = '#ffffff'; g.lineWidth = lw; seg(lm[a], lm[b]);
  }
  const colored = new Map();
  for (const p of parts) if (p.joint != null) colored.set(p.joint, p.score);
  if (repInfo?.joints) colored.set(repInfo.joints[1], 100);
  for (let i = 11; i < 29; i++) {
    if (!vis(i)) continue;
    const s = colored.get(i);
    const r = colored.has(i) ? lw * 2.4 : lw * 1.3;
    g.beginPath(); g.arc(lm[i].x * w, lm[i].y * h, r, 0, Math.PI * 2);
    g.fillStyle = colored.has(i) ? COLORS[tone(s)] : '#0f8a5f'; g.fill();
    g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
  }
  function seg(p, q) { g.beginPath(); g.moveTo(p.x * w, p.y * h); g.lineTo(q.x * w, q.y * h); g.stroke(); }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function icon(name) {
  const paths = {
    camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    record: 'M3 6h12a1 1 0 0 1 1 1v3l5-3v10l-5-3v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
    upload: 'M12 3l5 5h-3v6h-4V8H7l5-5zM4 16h2v3h12v-3h2v5H4v-5z',
    flip: 'M4 12a8 8 0 0 1 14-5.3V4h2v6h-6V8h2.5A6 6 0 0 0 6 12H4zm16 0a8 8 0 0 1-14 5.3V20H4v-6h6v2H7.5A6 6 0 0 0 18 12h2z',
    target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    trophy: 'M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1z',
  };
  return `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="${paths[name]}"/></svg>`;
}
