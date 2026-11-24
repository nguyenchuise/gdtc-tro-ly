// Phong cách "tranh SGK" cho mô hình 3D (Three.js) của thầy cô, giống bản vector lớp 6 nhịp 1–11:
// màu phẳng tươi (tô kiểu hoạt hình 3 mức sáng), NÉT VIỀN ĐẬM #1E293B, vẽ đủ độ phân giải màn hình nên sắc nét.
// Chạy NGAY SAU three.min.js và TRƯỚC lõi 3D của tệp Gemini: thay chất liệu bóng mờ (MeshStandard/Phong/Lambert)
// bằng MeshToonMaterial cùng màu, và tự thêm nét viền (vỏ ngược) cho mọi khối khi vẽ. Không sửa lõi 3D.
(function () {
  'use strict';
  const T = window.THREE;
  if (!T || T.__gdtcStyled) return;
  T.__gdtcStyled = true;
  window.__gdtcStyle = { get outlines() { return outlines.length; } }; // để kiểm tra
  const OUTLINE = 0x1e293b;     // màu nét viền như bản vector SGK
  const THICK = 0.0085;          // độ dày nét viền (mét, người cao ~1,6 m)

  // Bậc sáng kiểu tranh vẽ: tối – vừa – sáng
  const tones = new Uint8Array([120, 190, 255]);
  const grad = new T.DataTexture(tones, tones.length, 1, T.RedFormat);
  grad.minFilter = T.NearestFilter; grad.magFilter = T.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;

  const KEEP = ['color', 'map', 'transparent', 'opacity', 'side', 'depthTest', 'depthWrite', 'visible', 'alphaTest', 'name', 'emissive', 'emissiveIntensity', 'vertexColors', 'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits'];
  function toon(params = {}) {
    const p = {};
    for (const k of KEEP) if (params[k] !== undefined) p[k] = params[k];
    // Tệp Gemini xuất màu sRGB nhưng khai mã màu kiểu cũ → mọi màu bị "pha trắng". Quy đổi để hiện đúng mã màu gốc.
    if (p.color !== undefined) p.color = new T.Color(p.color).convertSRGBToLinear();
    if (p.emissive !== undefined) p.emissive = new T.Color(p.emissive).convertSRGBToLinear();
    const m = new T.MeshToonMaterial({ ...p, gradientMap: grad });
    m.userData.gdtcToon = true;
    return m;
  }
  // Thay các lớp chất liệu bóng mờ (giữ instanceof cho mã cũ nếu có kiểm tra)
  for (const name of ['MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshPhongMaterial', 'MeshLambertMaterial']) {
    const Orig = T[name];
    if (!Orig) continue;
    const F = function (params) { return toon(params); };
    F.prototype = Orig.prototype;
    T[name] = F;
  }

  // Vật liệu nét viền: đẩy đỉnh ra theo pháp tuyến, chỉ vẽ mặt sau → viền đều quanh khối.
  const outlineMat = new T.MeshBasicMaterial({ color: new T.Color(OUTLINE).convertSRGBToLinear(), side: T.BackSide });
  outlineMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n  transformed += normalize(normal) * ${THICK.toFixed(4)} / max(length(modelMatrix[0].xyz), 0.0001);`);
  };
  outlineMat.userData.gdtcOutline = true;

  function addOutlines(scene) {
    scene.traverse((o) => {
      if (!o.isMesh || o.userData.gdtcOutlined || o.userData.gdtcIsOutline) return;
      o.userData.gdtcOutlined = true;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || !m.userData?.gdtcToon || (m.transparent && m.opacity < 0.99) || !o.geometry?.attributes?.normal) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if (o.geometry.boundingSphere && o.geometry.boundingSphere.radius > 1.2) return; // bỏ sàn, phông lớn
      const ol = new T.Mesh(o.geometry, outlineMat);
      ol.userData.gdtcIsOutline = true;
      ol.castShadow = false; ol.receiveShadow = false;
      ol.renderOrder = (o.renderOrder || 0) - 1;
      o.add(ol);
      outlines.push([ol, m]);
    });
  }
  const outlines = [];
  // Chế độ X-quang (thân trong suốt) → ẩn viền của khối đang trong suốt.
  const syncOutlines = () => { for (const [ol, m] of outlines) ol.visible = !(m.transparent && m.opacity < 0.99); };
  // Chất liệu tô kiểu tranh nhận sáng mạnh hơn chất liệu "bóng mờ" → hạ đèn một lần cho màu đậm, không cháy sáng.
  function tameLights(scene) {
    scene.traverse((o) => {
      if (!o.isLight || o.userData.gdtcTamed) return;
      o.userData.gdtcTamed = true;
      o.intensity *= o.isHemisphereLight || o.isAmbientLight ? 0.9 : 1.0;
    });
  }

  // Bộ vẽ: đủ độ phân giải màn hình (nét sắc trên điện thoại), thêm viền cho khối mới trước khi vẽ.
  const R = T.WebGLRenderer;
  T.WebGLRenderer = function (opts = {}) {
    const r = new R({ ...opts, antialias: true });
    const setPR = r.setPixelRatio.bind(r);
    r.setPixelRatio = (v) => setPR(Math.min(Math.max(v || 1, window.devicePixelRatio || 1), 3));
    r.setPixelRatio(window.devicePixelRatio || 1);
    const render = r.render.bind(r);
    let n = 0;
    r.render = (scene, cam) => {
      if (scene && (n++ < 3 || n % 30 === 0)) { addOutlines(scene); tameLights(scene); }
      syncOutlines();
      render(scene, cam);
    };
    return r;
  };
  T.WebGLRenderer.prototype = R.prototype;
})();
