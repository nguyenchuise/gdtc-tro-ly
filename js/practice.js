// Tab "Tự tập": camera trước hoặc video tải lên → MediaPipe → chấm điểm. Không lưu, không gửi video đi đâu.
import {
  loadPoseLandmarker, evaluateRules, measure, adviceFor, HoldTimer, RepCounter, CONNECTIONS, PASS_SCORE,
} from './pose-scoring.js';
import { esc } from './util.js';

const CAMERA_TIPS = {
  front: 'Đặt điện thoại ngang ngực, cách 2–3 m, <strong>đứng quay mặt vào máy</strong>, thấy cả người từ đầu đến chân.',
  side: 'Đặt điện thoại ngang hông, cách 2–3 m, <strong>đứng nghiêng một bên</strong> so với máy, thấy cả người từ đầu đến chân.',
};

export function cameraTip(scoring) {
  return `${CAMERA_TIPS[scoring?.camera] || CAMERA_TIPS.front} Nơi tập đủ sáng, phía sau không có người khác đi lại.`;
}

/** Dựng giao diện tự tập trong `root`. Trả về hàm dọn dẹp (tắt camera). */
export function mountPractice(root, ex) {
  const sc = ex.scoring;
  const isReps = sc.mode === 'reps';
  root.innerHTML = `
    <p class="notice notice--info"><strong>Lưu ý:</strong> Điểm ở đây là <em>mức giống tư thế mẫu</em> để em tự luyện, không thay cho đánh giá của thầy cô.
      Hình ảnh chỉ được xử lý ngay trên máy em, <strong>không lưu và không gửi đi đâu</strong>.</p>
    <p class="tip">${cameraTip(sc)}</p>
    <p class="goal"><strong>Mục tiêu:</strong> ${isReps ? `làm đủ ${sc.reps.target} lần đúng kỹ thuật` : `giữ tư thế đạt từ ${PASS_SCORE}% trong ${sc.holdSeconds} giây`}.</p>
    <div class="source-buttons">
      <button type="button" class="btn btn--primary" data-act="camera">${icon('camera')} Bật camera</button>
      <label class="btn btn--ghost">${icon('record')} Quay video
        <input type="file" accept="video/*" capture="user" data-act="file" class="visually-hidden"></label>
      <label class="btn btn--ghost">${icon('upload')} Chọn video có sẵn
        <input type="file" accept="video/*" data-act="file" class="visually-hidden"></label>
    </div>
    <p class="status" role="status" aria-live="polite"></p>
    <div class="stage" hidden>
      <video playsinline muted aria-label="Hình từ camera hoặc video của em"></video>
      <canvas aria-hidden="true"></canvas>
      <div class="pass-banner" hidden aria-hidden="true">Đạt!</div>
      <div class="stage-controls">
        <button type="button" class="btn btn--small" data-act="flip" hidden>${icon('flip')} Đổi camera</button>
        <button type="button" class="btn btn--small" data-act="reset">Tập lại</button>
        <button type="button" class="btn btn--small btn--danger" data-act="stop">Dừng</button>
      </div>
    </div>
    <div class="scoreboard" hidden>
      <div class="stats">
        ${isReps ? `
          <div class="stat"><span class="stat__value" data-k="reps">0/${sc.reps.target}</span><span class="stat__label">Số lần</span></div>
          <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Lần gần nhất</span></div>
          <div class="stat"><span class="stat__value" data-k="best">—</span><span class="stat__label">Lần tốt nhất</span></div>`
        : `
          <div class="stat"><span class="stat__value" data-k="cur">—</span><span class="stat__label">Điểm hiện tại</span></div>
          <div class="stat"><span class="stat__value" data-k="best">—</span><span class="stat__label">Cao nhất</span></div>
          <div class="stat"><span class="stat__value" data-k="hold">0.0 s</span><span class="stat__label">Giữ ≥ ${PASS_SCORE}% / ${sc.holdSeconds} s</span></div>`}
      </div>
      <p class="advice" aria-live="polite"></p>
      <p class="pass-text" role="alert" hidden></p>
      <div class="table-wrap"><table class="rules">
        <caption class="visually-hidden">Kết quả từng bộ phận</caption>
        <thead><tr><th scope="col">Bộ phận</th><th scope="col">Đo được</th><th scope="col">Mục tiêu</th><th scope="col">Kết quả</th></tr></thead>
        <tbody></tbody>
      </table></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const stage = $('.stage'), video = $('video'), canvas = $('canvas'), ctx = canvas.getContext('2d');
  const status = $('.status'), board = $('.scoreboard');
  const setStatus = (t) => { status.textContent = t; };

  let stream = null, objectUrl = null, raf = 0, facing = 'user', running = false, source = null;
  let lastVideoTime = -1, lastTs = 0, smooth = null, best = 0, lastTableAt = 0, lastAdvice = '', passed = false;
  const timer = new HoldTimer(sc.holdSeconds || 2);
  const counter = isReps ? new RepCounter(sc.reps) : null;

  function resetScores() {
    timer.reset(); counter?.reset(); smooth = null; best = 0; passed = false;
    $('.pass-banner').hidden = true; $('.pass-text').hidden = true;
    root.querySelectorAll('.stat__value').forEach((n) => { n.textContent = n.dataset.k === 'reps' ? `0/${sc.reps.target}` : n.dataset.k === 'hold' ? '0.0 s' : '—'; });
  }

  async function ensureModel() {
    try {
      return await loadPoseLandmarker(setStatus);
    } catch (err) {
      console.warn(err);
      setStatus('Không tải được mô hình nhận dạng. Em kiểm tra mạng rồi thử lại nhé.');
      throw err;
    }
  }

  async function startCamera() {
    stop();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera chỉ chạy trên trang https (ví dụ link GitHub Pages) và trình duyệt mới. Em có thể dùng nút “Chọn video có sẵn”.');
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
        NotAllowedError: 'Em chưa cho phép dùng camera. Bấm biểu tượng ổ khoá/camera trên thanh địa chỉ để cho phép rồi thử lại.',
        NotFoundError: 'Không tìm thấy camera trên thiết bị. Em dùng nút “Chọn video có sẵn” nhé.',
        NotReadableError: 'Camera đang được ứng dụng khác dùng. Em tắt ứng dụng đó rồi thử lại.',
      }[err.name];
      setStatus(msg || 'Không mở được camera. Em thử lại hoặc chọn video có sẵn.');
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
    resetScores();
    try { await video.play(); } catch { /* iOS có thể cần bấm play — đã bật controls với video tải lên */ }
    let lm;
    try { lm = await ensureModel(); } catch { return; }
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
      showAdvice('Chưa thấy người trong khung hình. Em lùi ra xa để máy thấy cả người nhé.');
      timer.update(null, tSec);
      setVal('cur', isReps ? undefined : '—');
      return;
    }
    const ev = evaluateRules(lm, sc.rules || [], w, h);
    let repEval = null;
    if (isReps) {
      const m = measure(lm, sc.reps, w, h);
      counter.update(m.angle);
      repEval = m;
      setVal('reps', `${counter.count}/${sc.reps.target}`);
      if (counter.lastQuality != null) setVal('cur', `${Math.round(counter.lastQuality)}%`);
      if (counter.bestQuality != null) setVal('best', `${Math.round(counter.bestQuality)}%`);
      if (m.angle == null) showAdvice(adviceFor({ unseen: [{ missing: m.missing }], results: [] }));
      else showAdvice(counter.state === 'down' ? 'Tốt, giờ trở về tư thế ban đầu.' : `Thực hiện động tác — ${sc.reps.label} cần xuống dưới ${sc.reps.down}°.`);
      if (counter.done) pass(`Đạt! Em đã làm đủ ${counter.count} lần.`);
    } else {
      if (ev.score != null) smooth = smooth == null ? ev.score : smooth * 0.6 + ev.score * 0.4;
      else smooth = null;
      timer.update(smooth, tSec);
      if (smooth != null) best = Math.max(best, smooth);
      setVal('cur', smooth == null ? '—' : `${Math.round(smooth)}%`);
      setVal('best', best ? `${Math.round(best)}%` : '—');
      setVal('hold', `${Math.min(timer.current, 99).toFixed(1)} s`);
      showAdvice(adviceFor(ev));
      if (timer.done) pass(`Đạt! Em đã giữ tư thế đúng ${sc.holdSeconds} giây.`);
    }
    drawSkeleton(lm, w, h, ev, repEval);
    const now = performance.now();
    if (now - lastTableAt > 250) { lastTableAt = now; renderTable(ev, repEval); }
  }

  function pass(text) {
    if (passed) return;
    passed = true;
    $('.pass-banner').hidden = false;
    const p = $('.pass-text'); p.textContent = text; p.hidden = false;
    navigator.vibrate?.(150);
  }

  function setVal(k, v) { if (v === undefined) return; const n = root.querySelector(`[data-k="${k}"]`); if (n && n.textContent !== v) n.textContent = v; }
  function showAdvice(t) { if (t !== lastAdvice) { lastAdvice = t; $('.advice').textContent = t; } }

  function renderTable(ev, repEval) {
    const rows = ev.results.map((r) => {
      const ok = r.score != null && r.score >= PASS_SCORE;
      const res = r.score == null ? '<span class="pill pill--muted">Chưa thấy rõ</span>'
        : `<span class="pill ${ok ? 'pill--ok' : 'pill--bad'}">${ok ? 'Đạt' : 'Chưa đạt'} · ${Math.round(r.score)}%</span>`;
      return `<tr><th scope="row">${esc(r.rule.label)}</th><td>${r.angle == null ? '—' : `${Math.round(r.angle)}°`}</td><td>${r.rule.target}°</td><td>${res}</td></tr>`;
    });
    if (repEval) {
      rows.unshift(`<tr><th scope="row">${esc(sc.reps.label)}</th><td>${repEval.angle == null ? '—' : `${Math.round(repEval.angle)}°`}</td>
        <td>&lt; ${sc.reps.down}° rồi &gt; ${sc.reps.up}°</td>
        <td>${repEval.angle == null ? '<span class="pill pill--muted">Chưa thấy rõ</span>' : `<span class="pill">${counter.state === 'down' ? 'Đang xuống' : 'Đang đứng'}</span>`}</td></tr>`);
    }
    root.querySelector('tbody').innerHTML = rows.join('');
  }

  function drawSkeleton(lm, w, h, ev, repEval) {
    const vis = (i) => lm[i] && (lm[i].visibility ?? 1) >= 0.5;
    const lw = Math.max(3, w / 160);
    ctx.lineCap = 'round';
    for (const [a, b] of CONNECTIONS) {
      if (!vis(a) || !vis(b)) continue;
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = lw + 3;
      line(lm[a], lm[b]);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw;
      line(lm[a], lm[b]);
    }
    const colored = new Map();
    for (const r of ev.results) if (r.joints) colored.set(r.joints[1], r.score);
    if (repEval?.joints) colored.set(repEval.joints[1], 100);
    for (let i = 11; i < 29; i++) {
      if (!vis(i)) continue;
      const s = colored.get(i);
      const color = s == null ? '#0f8a5f' : s >= PASS_SCORE ? '#16a34a' : s >= 50 ? '#f59e0b' : '#dc2626';
      const r = colored.has(i) ? lw * 2.2 : lw * 1.3;
      ctx.beginPath(); ctx.arc(lm[i].x * w, lm[i].y * h, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    }
    function line(p, q) { ctx.beginPath(); ctx.moveTo(p.x * w, p.y * h); ctx.lineTo(q.x * w, q.y * h); ctx.stroke(); }
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
    setStatus('');
  }

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'camera') startCamera();
    else if (act === 'stop') stop();
    else if (act === 'reset') resetScores();
    else if (act === 'flip') { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'file') { startFile(e.target.files?.[0]); e.target.value = ''; }
  });
  const onHidden = () => { if (document.hidden && source === 'camera') stop(); };
  document.addEventListener('visibilitychange', onHidden);

  return () => { stop(); document.removeEventListener('visibilitychange', onHidden); };
}

export function icon(name) {
  const paths = {
    camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    record: 'M3 6h12a1 1 0 0 1 1 1v3l5-3v10l-5-3v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
    upload: 'M12 3l5 5h-3v6h-4V8H7l5-5zM4 16h2v3h12v-3h2v5H4v-5z',
    flip: 'M4 12a8 8 0 0 1 14-5.3V4h2v6h-6V8h2.5A6 6 0 0 0 6 12H4zm16 0a8 8 0 0 1-14 5.3V20H4v-6h6v2H7.5A6 6 0 0 0 18 12h2z',
  };
  return `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="${paths[name]}"/></svg>`;
}
