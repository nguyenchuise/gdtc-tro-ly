// Cầu nối chạy BÊN TRONG tệp mô hình 3D (Three.js) thầy cô dựng bằng Gemini, khi tệp được nhúng vào
// mục 2. Video (iframe figures3d/<mã-bài>.html). Không sửa lõi 3D của tệp:
//  - Ẩn giao diện riêng của tệp, chỉ giữ khung hình 3D (camera phía sau), bật sẵn "Khớp AI 3D".
//  - Báo ra trang chính nhịp đang hiện ({type:'fig3d', ev:'beat', k}) để ảnh SGK bên cạnh chạy cùng nhịp.
//  - Nhận lệnh từ trang chính: chạy / dừng / chọn nhịp / tốc độ / bật tắt khớp AI.
// Tệp Gemini có một danh sách POSES, hoặc nhiều động tác EXERCISES[i].poses (lớp 8, 9) chọn bằng tab.
(function () {
  'use strict';
  if (window.parent === window) return; // mở trực tiếp tệp → giữ nguyên giao diện gốc
  /* global state, samplePose, POSES, EXERCISES */
  const multi = typeof EXERCISES !== 'undefined';
  let lists;
  try { lists = multi ? EXERCISES.map((e) => e.poses) : [POSES]; } catch { return; }
  const flat = [];
  lists.forEach((L, ex) => L.forEach((p, i) => flat.push({
    ex, i, code: p.code || `Nhịp ${i + 1}`, title: p.shortTitle || '', caption: p.caption || '',
    tip: p.rearNote || p.viewNote || '', angle: p.angleRef || '',
    group: multi ? String(EXERCISES[ex].tabLabel || EXERCISES[ex].title || '').trim() : '',
  })));
  const $ = (s) => document.querySelector(s);
  const curEx = () => (multi ? state.exIdx : 0);
  const nearest = () => (multi ? samplePose(state.exIdx, state.t) : samplePose(state.t)).nearestIdx;
  const flatIdx = () => { let k = 0; for (let e = 0; e < curEx(); e++) k += lists[e].length; return k + nearest(); };
  const send = (m) => window.parent.postMessage({ type: 'fig3d', ...m }, '*');

  function selectEx(e) {
    if (!multi || state.exIdx === e) return;
    document.querySelectorAll('#exTabs .ex-tab, #exTabs button')[e]?.click();
  }
  function goto(K) {
    const f = flat[((K % flat.length) + flat.length) % flat.length];
    selectEx(f.ex);
    document.querySelectorAll('#beatsGrid .beat-btn, #beatsGrid button')[f.i]?.click();
  }
  function setPlaying(on) { if (Boolean(state.playing) !== on) $('#btnPlay')?.click(); }
  function setAI(on) {
    const c = $('#chkSkeleton');
    if (c && c.checked !== on) { c.checked = on; c.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function setSpeed(v) { for (let n = 0; n < 5 && state.speed !== v; n++) $('#btnSpeed')?.click(); }

  // ---------- Chế độ nhúng: chỉ còn khung hình 3D lấp đầy iframe
  const shell = $('#viewportShell');
  if (shell) {
    document.body.appendChild(shell);
    const st = document.createElement('style');
    st.textContent = `
      html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: hidden !important; height: 100%; }
      body > *:not(#viewportShell):not(script):not(style) { display: none !important; }
      #viewportShell { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
        max-width: none !important; margin: 0 !important; border-radius: 0 !important; border: 0 !important; box-shadow: none !important;
        aspect-ratio: auto !important; background: linear-gradient(#f8fafc, #eef4f1) !important; }
      #glCanvas { width: 100% !important; height: 100% !important; display: block; touch-action: pan-y; }
      .hud-top, .hud-lr, .hint-tag, .split-divider, .error-banner { display: none !important; }`;
    document.head.appendChild(st);
    // khung camera chuẩn phía sau
    $('#camBtns [data-cam="rear"]')?.click();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  setAI(true);

  // ---------- Theo dõi nhịp; tự sang động tác kế tiếp khi chạy hết một động tác (bài nhiều động tác)
  let last = -1, lastLocal = -1;
  function loop() {
    try {
      if (multi && state.playing) {
        const n = nearest(), len = lists[state.exIdx].length;
        if (lastLocal === len - 1 && n === 0) { selectEx((state.exIdx + 1) % lists.length); setPlaying(true); }
        lastLocal = n;
      }
      const k = flatIdx();
      if (k !== last) { last = k; send({ ev: 'beat', k, playing: Boolean(state.playing) }); }
    } catch { /* bỏ qua */ }
    requestAnimationFrame(loop);
  }

  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.type !== 'fig3d' || !m.cmd) return;
    if (m.cmd === 'goto') { goto(m.k); last = -1; }
    else if (m.cmd === 'play') setPlaying(true);
    else if (m.cmd === 'pause') setPlaying(false);
    else if (m.cmd === 'ai') setAI(Boolean(m.on));
    else if (m.cmd === 'speed') setSpeed(m.v);
    else if (m.cmd === 'resize') window.dispatchEvent(new Event('resize'));
  });

  send({ ev: 'ready', n: flat.length, poses: flat });
  requestAnimationFrame(loop);
})();
