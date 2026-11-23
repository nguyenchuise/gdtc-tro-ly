// Tab "Tự tập": camera trước hoặc video → MediaPipe → chấm điểm.
// - Tỉ lệ đạt của từng bộ phận hiện nổi ngay trên hình.
// - Mọi bộ phận ≥ 80% đủ thời gian (hoặc đủ số lần đạt) → tự chụp ảnh, hiện "Kết quả lần này".
// - "Kết quả tốt nhất" được giữ trong lúc mở trang; tập lại mà tốt hơn thì tự thay.
// Không lưu, không gửi hình ảnh đi đâu (ảnh chụp chỉ nằm trong bộ nhớ trình duyệt, tải lại trang là mất).
import {
  loadPoseLandmarker, evaluateRules, measure, adviceFor, HoldTimer, RepCounter, CONNECTIONS, PASS_SCORE, easeRule, easeReps,
} from './pose-scoring.js';
import { esc } from './util.js';
import { figureModel, createFigure, animateFigures, figureLegend } from './pose-figure.js';
import { hasBookAnim, createBookAnim, preloadBookAnim } from './book-anim.js';

const PART = {
  0: 'Thân', 11: 'Vai trái', 12: 'Vai phải', 13: 'Khuỷu trái', 14: 'Khuỷu phải', 15: 'Cổ tay trái', 16: 'Cổ tay phải',
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
  // Chấm trọn bộ (bài thể dục nhiều nhịp): làm lần lượt từng nhịp như hình trong sách, mỗi nhịp giữ đúng holdSeconds.
  const isSeq = sc.mode === 'sequence';
  const frames = ex.bookAnim?.frames || [];
  const stepGroup = (st) => frames[st.frame]?.group || null;
  const stepName = (st) => [frames[st.frame]?.label, stepGroup(st)].filter(Boolean).join(' · ') || 'Nhịp';
  const seqGroups = isSeq ? [...new Set(sc.steps.map(stepGroup).filter(Boolean))] : [];
  let seqGroup = null; // null = cả bài
  const seqSteps = () => sc.steps.filter((st) => !seqGroup || stepGroup(st) === seqGroup);
  // Bài một tư thế: nới góc cho dễ đạt. Bài chấm trọn bộ: tiêu chí đã soạn riêng cho từng nhịp, không nới thêm.
  let rules = isSeq ? sc.steps[0].rules : (sc.rules || []).map(easeRule);
  const repSpec = isReps ? easeReps(sc.reps) : null;
  const holdSec = sc.holdSeconds || 1;
  const secText = String(holdSec).replace('.', ',');
  const seqGoal = () => `Làm lần lượt <strong>${seqSteps().length} nhịp</strong> như hình, mỗi nhịp giữ đúng <strong>${secText} giây</strong>`;
  const goalText = isSeq ? seqGoal() : isReps ? `Làm đúng <strong>${sc.reps.target} lần</strong>` : `Giữ đúng tư thế <strong>${secText} giây</strong> là máy tự chụp ảnh`;
  root.innerHTML = `
    <div class="practice">
      <div class="goal-card">
        <span class="goal-card__icon" aria-hidden="true">${icon('target')}</span>
        <div><p class="goal-card__title">${goalText}</p>
          ${sc.pose ? `<p class="goal-card__pose">${esc(sc.pose)}</p>` : ''}
          <p class="goal-card__sub">${isSeq ? `Đúng nhịp nào máy tính nhịp đó rồi chuyển sang nhịp sau; hết bài mới có điểm. Nhịp khó quá thì bấm “Bỏ qua nhịp”.` : `Mỗi bộ phận đạt từ ${PASS_SCORE}% là được.`}</p></div>
      </div>
      ${seqGroups.length > 1 ? `<div class="seq-pick" role="group" aria-label="Chọn phần để chấm"><span class="seq-pick__label">Chấm:</span>
        <button type="button" class="chip chip--sm" data-seq="" aria-pressed="true">Cả bài (${sc.steps.length} nhịp)</button>
        ${seqGroups.map((g) => `<button type="button" class="chip chip--sm" data-seq="${esc(g)}" aria-pressed="false">${esc(g)} (${sc.steps.filter((st) => stepGroup(st) === g).length})</button>`).join('')}</div>` : ''}
      <section class="figure-card figure-card--pre" aria-label="Tư thế mẫu">
        <div class="figure-card__img" data-fig="pre"></div>
        <div class="figure-card__body">
          <h4 class="figure-card__title">Tư thế mẫu ${sc.camera === 'front' ? '(nhìn thẳng)' : '(nhìn nghiêng)'}</h4>
          <p class="figure-card__hint">Làm theo hình. Số trên hình là bộ phận máy chấm:</p>
          <div data-fig-legend></div>
        </div>
      </section>
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
          <span class="hud__label">${isReps ? 'lần đạt' : isSeq ? 'nhịp' : 'điểm'}</span>
        </div>
        <div class="hud-progress" aria-hidden="true"><span></span></div>
        <div class="pass-banner" hidden aria-hidden="true">Đạt!</div>
        <p class="stage-advice" aria-hidden="true"></p>
        <button type="button" class="stage-figure" data-act="fig-toggle" aria-label="Thu nhỏ hình mẫu" aria-pressed="false">
          <span class="stage-figure__img" data-fig="inset"></span><span class="stage-figure__label">Hình mẫu</span>
        </button>
        ${rules.length ? '<ul class="stage-parts" aria-hidden="true"></ul>' : ''}
        <div class="stage-controls">
          <button type="button" class="btn btn--small btn--glass" data-act="flip" hidden aria-label="Đổi sang camera sau">${icon('flip')}<span class="flip-text">Camera sau</span></button>
          ${isSeq ? '<button type="button" class="btn btn--small btn--glass" data-act="skip">Bỏ qua nhịp</button>' : ''}
          <button type="button" class="btn btn--small btn--danger" data-act="stop">Dừng</button>
        </div>
      </div>

      <div class="scoreboard" hidden>
        <section class="figure-card figure-card--live" aria-label="Tư thế mẫu">
          <div class="figure-card__img" data-fig="live"></div>
          <div class="figure-card__body"><h4 class="figure-card__title">Tư thế mẫu</h4><div data-fig-legend></div></div>
        </section>
        <div class="stats">
          ${isSeq ? `
            <div class="stat"><span class="stat__value" data-k="step">1/${sc.steps.length}</span><span class="stat__label">Nhịp</span></div>
            <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Điểm nhịp này</span></div>
            <div class="stat"><span class="stat__value" data-k="hold">0.0s</span><span class="stat__label">Đã giữ / ${secText}s</span></div>`
          : isReps ? `
            <div class="stat"><span class="stat__value" data-k="reps">0/${sc.reps.target}</span><span class="stat__label">Lần đạt</span></div>
            <div class="stat"><span class="stat__value" data-k="total">0</span><span class="stat__label">Tổng số lần</span></div>
            <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Lần vừa rồi</span></div>`
          : `
            <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Điểm bây giờ</span></div>
            <div class="stat"><span class="stat__value" data-k="peak">—</span><span class="stat__label">Cao nhất</span></div>
            <div class="stat"><span class="stat__value" data-k="hold">0.0s</span><span class="stat__label">Đã giữ / ${holdSec}s</span></div>`}
        </div>
        ${isSeq ? '<p class="seq-now"></p><ol class="seq-track" aria-label="Tiến độ các nhịp"></ol>' : ''}
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

  const $ = (s) => root.querySelector(s);
  // Hình mẫu: bài thể dục có hình "Nhịp" trong SGK → hình động ghép từ sách; còn lại (hoặc không tải được ảnh sách)
  // → hình nộm vẽ từ chính các góc chấm điểm.
  let stopFig = () => {}, unmounted = false;
  const targetPlayers = []; // hình mẫu đứng yên ở nhịp đang chấm (chấm trọn bộ)
  const stickFigures = () => {
    try {
      const model = figureModel(sc);
      const figs = [...root.querySelectorAll('[data-fig]')].map((box) => {
        const f = createFigure(model, { numbers: box.dataset.fig !== 'inset' });
        box.replaceChildren(f.el);
        return f;
      });
      root.querySelectorAll('[data-fig-legend]').forEach((b) => { b.innerHTML = figureLegend(model, sc); });
      stopFig = animateFigures(model, figs);
    } catch (err) {
      console.warn('Không vẽ được hình mẫu', err);
      root.querySelectorAll('.figure-card, .stage-figure').forEach((e) => e.remove());
    }
  };
  if (hasBookAnim(ex)) {
    const focus = ex.bookAnim.focus || {};
    const hint = isSeq ? 'Xem trước các nhịp trong sách. Khi tập, khung hình mẫu sẽ dừng ở đúng nhịp máy đang chấm.'
      : focus.label
      ? `Các nhịp trong sách chạy lần lượt. Khung viền cam “Máy chấm nhịp này” là ${esc(focus.label)}: em làm giống hình đó.`
      : focus.group ? `Đang chiếu động tác “${esc(focus.group)}” mà máy đếm số lần. Bấm “Tất cả” để xem cả bài.` : 'Các nhịp trong sách chạy lần lượt.';
    root.querySelectorAll('.figure-card').forEach((c) => {
      c.classList.add('figure-card--book');
      c.querySelector('.figure-card__title').textContent = 'Hình mẫu trong sách';
      const h = c.querySelector('.figure-card__hint');
      if (h) h.innerHTML = hint;
      c.querySelector('[data-fig-legend]')?.replaceChildren();
    });
    root.querySelector('.stage-figure')?.classList.add('stage-figure--book');
    preloadBookAnim(ex).then(() => {
      if (unmounted) return;
      const players = [...root.querySelectorAll('[data-fig]')].map((box) => {
        const ctl = isSeq && box.dataset.fig !== 'pre';
        const p = createBookAnim(ex, { mode: box.dataset.fig === 'inset' ? 'inset' : 'full', practice: !isSeq, controlled: ctl });
        box.replaceChildren(p.el);
        if (ctl) { targetPlayers.push(p); if (attempt?.steps) p.go(attempt.steps[attempt.si]?.frame ?? 0); }
        return p;
      });
      stopFig = () => players.forEach((p) => p.stop());
    }).catch(() => {
      if (unmounted) return;
      root.querySelectorAll('.figure-card').forEach((c) => {
        c.classList.remove('figure-card--book');
        c.querySelector('.figure-card__title').textContent = 'Tư thế mẫu';
        const h = c.querySelector('.figure-card__hint');
        if (h) h.textContent = 'Làm theo hình. Số trên hình là bộ phận máy chấm:';
      });
      root.querySelector('.stage-figure')?.classList.remove('stage-figure--book');
      stickFigures();
    });
  } else stickFigures();
  const stage = $('.stage'), video = $('video'), canvas = $('canvas'), ctx = canvas.getContext('2d');
  const labelsBox = $('.float-labels'), status = $('.status'), board = $('.scoreboard');
  const setStatus = (t) => { status.textContent = t; status.classList.toggle('is-loading', /^Đang/.test(t)); };

  let stream = null, objectUrl = null, raf = 0, facing = 'user', running = false, source = null;
  let lastVideoTime = -1, lastTs = 0, lastTableAt = 0, lastAdvice = '';
  // Một "lượt tập": từ lúc bật camera / bấm Tập lại đến khi đạt.
  let attempt = null;
  const timer = new HoldTimer(holdSec);
  const counter = isReps ? new RepCounter(repSpec) : null;

  function newAttempt() {
    timer.reset(); counter?.reset();
    attempt = { done: false, smooth: rules.map(() => null), peak: 0, streak: null, goodReps: 0, goodQ: [], low: null, bestShot: null };
    if (isSeq) { attempt.steps = seqSteps(); attempt.si = 0; attempt.res = []; setStep(0); }
    $('.pass-banner').hidden = true;
    setVal('cur', '—'); setVal('peak', '—'); setVal('hold', '0.0s'); setVal('reps', `0/${sc.reps?.target}`); setVal('total', '0'); setVal('hud', isSeq ? `1/${attempt.steps.length}` : '—');
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
    // Nút đổi camera chỉ hiện khi máy có từ 2 camera; mặc định camera trước, chỉ đổi khi bấm.
    const flip = $('[data-act="flip"]');
    const cams = (await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter((d) => d.kind === 'videoinput').length;
    flip.hidden = cams < 2;
    const next = facing === 'user' ? 'Camera sau' : 'Camera trước';
    flip.querySelector('.flip-text').textContent = next;
    flip.setAttribute('aria-label', `Đổi sang ${next.toLowerCase()}`);
    await begin();
    if (facing === 'environment') setStatus('Đang dùng camera sau: hướng máy về phía bạn đang tập, thấy cả người.');
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
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; stage.style.aspectRatio = `${w} / ${h}`; stage.style.setProperty('--ar', (w / h).toFixed(4)); }
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
      return { label: r.rule.label, joint: r.joints?.[1], angle: r.angle, target: r.rule.target, kind: r.rule.kind, need: r.rule.need, score: s, missing: r.missing };
    });
    const allSeen = parts.every((p) => p.score != null);
    const avg = parts.length && allSeen ? parts.reduce((a, p) => a + p.score, 0) / parts.length : null;
    const allOk = allSeen && parts.every((p) => p.score >= PASS_SCORE);
    let repInfo = null;

    if (isReps) {
      const m = measure(lm, repSpec, w, h);
      const before = counter.count;
      const wasDown = counter.state === 'down';
      counter.update(m.angle);
      repInfo = m;
      // Ghi lại khung hình ở điểm sâu nhất của lần đang làm → ảnh chụp đúng lúc làm đúng động tác.
      if (counter.state === 'down' && m.angle != null && (!wasDown || !attempt.low || m.angle <= attempt.low.angle)) {
        attempt.low = { angle: m.angle, frame: grabFrame(w, h, attempt.low?.frame), lm, parts, repInfo: m };
      }
      if (counter.count > before && !attempt.done) {
        // Lần này đạt khi độ sâu đạt chuẩn và (nếu có) các bộ phận khác cũng đạt.
        const ok = counter.lastQuality >= PASS_SCORE && (!parts.length || allOk);
        if (ok) {
          attempt.goodReps += 1; attempt.goodQ.push(counter.lastQuality);
          if (attempt.low && (!attempt.bestShot || counter.lastQuality >= attempt.bestShot.q)) {
            attempt.bestShot = { ...attempt.low, q: counter.lastQuality };
            attempt.low = null; // khung đã giữ lại làm ảnh, lần sau dùng khung mới
          }
          flashOk();
        }
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
      if (!attempt.done && attempt.goodReps >= sc.reps.target) {
        const b = attempt.bestShot;
        if (b) finish(b.lm, w, h, b.parts, b.repInfo, b.frame); else finish(lm, w, h, parts, m);
      }
    } else if (isSeq) {
      timer.update(allOk ? avg : null, tSec);
      if (allOk) {
        if (!attempt.streak) attempt.streak = { n: 0, sums: parts.map(() => 0) };
        attempt.streak.n += 1;
        parts.forEach((p, i) => { attempt.streak.sums[i] += p.score; });
      } else attempt.streak = null;
      if (attempt.stepT == null) attempt.stepT = tSec;
      const N = attempt.steps.length;
      setVal('cur', avg == null ? '—' : `${Math.round(avg)}%`);
      setVal('hold', `${Math.min(timer.current, 99).toFixed(1)}s`);
      setVal('step', `${attempt.si + 1}/${N}`);
      setVal('hud', `${attempt.si + 1}/${N}`);
      setProgress((attempt.si + Math.min(1, timer.current / holdSec)) / N);
      const stuck = !allOk && tSec - attempt.stepT > 12;
      showAdvice(allOk ? `Đúng rồi! Giữ yên… ${Math.max(0, holdSec - timer.current).toFixed(1)}s`
        : stuck ? `${adviceFor(ev)} (Khó quá thì bấm “Bỏ qua nhịp”.)` : adviceFor(ev));
      if (!attempt.done && timer.done) stepDone(lm, w, h, parts);
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
      setProgress(timer.current / holdSec);
      showAdvice(allOk ? `Đúng rồi! Giữ yên… ${Math.max(0, holdSec - timer.current).toFixed(1)}s` : adviceFor(ev));
      if (!attempt.done && timer.done) finish(lm, w, h, parts, null);
    }
    stage.classList.toggle('is-ok', isReps ? counter.state === 'down' : allOk);
    drawSkeleton(ctx, lm, w, h, parts, repInfo);
    renderFloating(lm, parts, repInfo);
    const now = performance.now();
    if (now - lastTableAt > 300) { lastTableAt = now; renderTable(parts, repInfo); placeMini(lm); }
  }

  // ------------------------------------------------ Chấm trọn bộ: từng nhịp
  function setStep(i) {
    const st = attempt.steps[i];
    rules = st.rules;
    attempt.si = i; attempt.smooth = rules.map(() => null); attempt.streak = null; attempt.stepT = null;
    timer.reset();
    lastTableAt = 0;
    targetPlayers.forEach((p) => p.go(st.frame));
    const now = root.querySelector('.seq-now');
    if (now) now.innerHTML = `Đang chấm: <strong>${esc(stepName(st))}</strong> <span>(${i + 1}/${attempt.steps.length})</span>`;
    renderTrack();
  }
  function renderTrack() {
    const box = root.querySelector('.seq-track');
    if (!box || !attempt?.steps) return;
    box.innerHTML = attempt.steps.map((st, k) => {
      const r = attempt.res[k];
      const cls = r ? (r.ok ? 'is-ok' : 'is-skip') : k === attempt.si && !attempt.done ? 'is-now' : '';
      // Ô ghi đúng số nhịp trong sách (TTCB → "TT"); sang động tác mới thì cách ra một chút.
      const lab = frames[st.frame]?.label || '';
      const short = /^TTCB/.test(lab) ? 'TT' : (lab.match(/\d+/)?.[0] || String(k + 1));
      const gs = k > 0 && stepGroup(st) !== stepGroup(attempt.steps[k - 1]) ? ' is-gstart' : '';
      return `<li class="${cls}${gs}" title="${esc(stepName(st))}${r ? ` – ${r.ok ? `${r.score}%` : 'bỏ qua'}` : ''}">${short}</li>`;
    }).join('');
  }
  /** Ảnh nhỏ của một nhịp (khung hình + khung xương) để ghép thành ảnh kết quả. */
  function thumbOf(lm, w, h, parts) {
    const tw = 240, th = Math.round((240 * h) / w);
    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    const g = c.getContext('2d');
    g.save();
    if (stage.classList.contains('mirror')) { g.translate(tw, 0); g.scale(-1, 1); }
    g.scale(tw / w, th / h);
    g.drawImage(video, 0, 0, w, h);
    drawSkeleton(g, lm, w, h, parts, null);
    g.restore();
    return c;
  }
  function stepDone(lm, w, h, parts) {
    const st = attempt.streak;
    const score = Math.round(st ? st.sums.reduce((a, b) => a + b, 0) / st.sums.length / st.n : 80);
    attempt.res.push({ ok: true, score, thumb: thumbOf(lm, w, h, parts) });
    nextStep(true);
  }
  function skipStep() {
    if (!isSeq || !attempt || attempt.done || !running) return;
    attempt.res.push({ ok: false, score: 0, thumb: null });
    nextStep(false);
  }
  function nextStep(ok) {
    if (attempt.si + 1 >= attempt.steps.length) { finishSeq(); return; }
    setStep(attempt.si + 1);
    const b = $('.pass-banner');
    b.textContent = ok ? 'Đúng rồi! Nhịp tiếp' : 'Nhịp tiếp theo'; b.hidden = false;
    clearTimeout(nextStep.t);
    nextStep.t = setTimeout(() => { if (!attempt.done) b.hidden = true; }, 800);
    if (ok) navigator.vibrate?.(40);
  }
  function finishSeq() {
    attempt.done = true;
    renderTrack();
    const steps = attempt.steps, res = attempt.res;
    const passed = res.filter((r) => r.ok).length;
    const total = Math.round(res.reduce((a, r) => a + r.score, 0) / steps.length);
    const groups = [...new Set(steps.map(stepGroup).filter(Boolean))];
    const parts = groups.length > 1
      ? groups.map((g) => {
        const ks = steps.map((st, k) => (stepGroup(st) === g ? k : -1)).filter((k) => k >= 0);
        return { label: `${g} (${ks.filter((k) => res[k].ok).length}/${ks.length} nhịp)`, score: Math.round(ks.reduce((a, k) => a + res[k].score, 0) / ks.length) };
      })
      : steps.map((st, k) => ({ label: frames[st.frame]?.label || `Nhịp ${k + 1}`, score: res[k].score }));
    const result = { score: total, detail: `${passed}/${steps.length} nhịp đạt${seqGroup ? ` · ${seqGroup}` : ''}`, parts, time: new Date() };
    result.image = collage(result);
    const rec = session.get(ex.id) || { best: null, last: null };
    const newRecord = Boolean(rec.best) && result.score > rec.best.score;
    rec.last = result;
    if (!rec.best || newRecord) rec.best = result;
    session.set(ex.id, rec);
    const b = $('.pass-banner');
    clearTimeout(nextStep.t);
    b.hidden = false;
    b.textContent = newRecord ? 'Kỷ lục mới!' : `Xong! ${total}%`;
    setProgress(1);
    showAdvice(`Hoàn thành ${passed}/${steps.length} nhịp. Xem kết quả bên dưới.`);
    navigator.vibrate?.([80, 60, 120]);
    renderResults(newRecord);
    setTimeout(() => root.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
  }
  /** Ảnh kết quả chấm trọn bộ: lưới ảnh từng nhịp + điểm. */
  function collage(result) {
    const steps = attempt.steps, res = attempt.res;
    const cols = steps.length <= 12 ? 4 : 6, cw = 240;
    const th = res.find((r) => r.thumb)?.thumb.height || 180, lh = 34;
    const rows = Math.ceil(steps.length / cols);
    const footer = 96;
    const c = document.createElement('canvas');
    c.width = cols * cw; c.height = rows * (th + lh) + footer;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
    steps.forEach((st, k) => {
      const x = (k % cols) * cw, y = Math.floor(k / cols) * (th + lh), r = res[k];
      if (r.thumb) g.drawImage(r.thumb, x, y, cw, th);
      else { g.fillStyle = '#e5ebe8'; g.fillRect(x, y, cw, th); g.fillStyle = '#5b6a64'; g.font = '600 20px "Be Vietnam Pro", system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('Bỏ qua', x + cw / 2, y + th / 2); }
      g.fillStyle = r.ok ? COLORS[tone(r.score)] : COLORS.muted;
      g.fillRect(x, y + th, cw, lh);
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.font = '700 17px "Be Vietnam Pro", system-ui, sans-serif';
      g.fillText(frames[st.frame]?.label || `Nhịp ${k + 1}`, x + 8, y + th + lh / 2, cw - 70);
      g.textAlign = 'right'; g.fillText(r.ok ? `${r.score}%` : '—', x + cw - 8, y + th + lh / 2);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x, y, cw, th + lh);
    });
    const fy = rows * (th + lh);
    g.fillStyle = '#0b3d2c'; g.fillRect(0, fy, c.width, footer);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = '800 40px "Be Vietnam Pro", system-ui, sans-serif';
    g.fillText(`ĐIỂM ${result.score}%`, 20, fy + 34);
    g.font = '500 20px "Be Vietnam Pro", system-ui, sans-serif';
    g.fillText(`${ex.title} · ${result.detail} · ${fmtTime(result.time)}`, 20, fy + 72, c.width - 40);
    return c.toDataURL('image/jpeg', 0.84);
  }

  // ------------------------------------------------ Hoàn thành một lượt → chụp ảnh, ghi kết quả
  function finish(lm, w, h, parts, repInfo, frame = null) {
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
        detail: `Giữ ${holdSec} giây`,
        parts: per,
      };
    }
    result.time = new Date();
    result.image = snapshot(lm, w, h, parts, repInfo, result, frame || video);
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

  /** Chép khung hình camera hiện tại (dùng lại canvas cũ nếu có) để chụp đúng khoảnh khắc làm đúng. */
  function grabFrame(w, h, reuse) {
    const c = reuse && reuse.width === w && reuse.height === h ? reuse : document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(video, 0, 0, w, h);
    return c;
  }
  function flashOk() {
    const b = $('.pass-banner');
    if (attempt.done) return;
    b.textContent = 'Đúng rồi!'; b.hidden = false;
    clearTimeout(flashOk.t);
    flashOk.t = setTimeout(() => { if (!attempt.done) b.hidden = true; }, 700);
    navigator.vibrate?.(40);
  }

  function snapshot(lm, w, h, parts, repInfo, result, src = video) {
    const c = document.createElement('canvas');
    const footer = Math.round(h * 0.16);
    c.width = w; c.height = h + footer;
    const g = c.getContext('2d');
    const mirror = stage.classList.contains('mirror');
    g.save();
    if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(src, 0, 0, w, h);
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
    return ['.hud', '.stage-controls', '.stage-parts', '.stage-figure'].map((sel) => root.querySelector(sel)?.getBoundingClientRect())
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
      const meas = p.angle == null ? '—' : p.kind ? (p.score >= PASS_SCORE ? 'đúng' : 'chưa') : `${Math.round(p.angle)}°`;
      return `<tr><th scope="row">${esc(p.label)}</th><td>${meas}</td><td>${p.kind ? esc(p.need || '') : `${p.target}°`}</td><td>${res}</td></tr>`;
    });
    if (repInfo) {
      rows.unshift(`<tr><th scope="row">${esc(sc.reps.label)}</th><td>${repInfo.angle == null ? '—' : `${Math.round(repInfo.angle)}°`}</td>
        <td>&lt;${repSpec.down}° rồi &gt;${repSpec.up}°</td>
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
    const sp = e.target.closest('[data-seq]');
    if (sp) {
      seqGroup = sp.dataset.seq || null;
      root.querySelectorAll('[data-seq]').forEach((b) => b.setAttribute('aria-pressed', String(b === sp)));
      root.querySelector('.goal-card__title').innerHTML = seqGoal();
      if (running) newAttempt();
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'camera') startCamera();
    else if (act === 'skip') skipStep();
    else if (act === 'stop') stop();
    else if (act === 'again') {
      if (running) newAttempt(); else startCamera();
      stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (act === 'fig-toggle') {
      const b = e.target.closest('.stage-figure');
      const min = b.classList.toggle('is-min');
      b.setAttribute('aria-pressed', String(min));
      b.setAttribute('aria-label', min ? 'Hiện hình mẫu' : 'Thu nhỏ hình mẫu');
    } else if (act === 'flip') { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'file') { startFile(e.target.files?.[0]); e.target.value = ''; }
  });
  const onHidden = () => { if (document.hidden && source === 'camera') stop(); };
  document.addEventListener('visibilitychange', onHidden);
  renderResults();

  return () => { unmounted = true; stop(); stopFig(); document.removeEventListener('visibilitychange', onHidden); };
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
