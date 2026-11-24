// TỰ SINH bởi tools/import-gemini-figure.mjs — đừng sửa tay, sửa tệp Gemini rồi chạy lại công cụ.
// Bài: g6-dang-tay — Bài thể dục liên hoàn (từ nhịp 1 đến nhịp 11)
// Góc nhìn: PHÍA TRƯỚC (như hình trong sách)
// Nguồn: hình người vector 2.5D thầy cô dựng bằng Gemini (g6-dang-tay.front.html).
/* eslint-disable */
const appState = { showAI: true, showArrows: true, showXray: true };
const HORIZON_Y = 175; // tâm phối cảnh ngang ngực (đơn vị hình, tính từ mặt sàn)

/**
 * BẢNG MÀU CHUẨN ĐỒNG PHỤC GDTC THCS (Bộ sách Kết nối tri thức)
 */
const COLORS = {
  outline: '#1E293B',      // Nét viền mềm đậm rõ
  hair: '#333840',         // Tóc ngắn màu nâu đen/than
  hairHi: '#4B5563',       // Ánh tóc nhẹ
  skin: '#FBD7B9',         // Da sáng ấm
  skinShadow: '#E9BC99',   // Bóng cổ & lòng tay nhẹ
  collarBlue: '#1868B7',   // Cổ áo bẻ & viền tay áo xanh dương
  shirtWhite: '#FFFFFF',   // Phần vai, ngực trên & tay áo trắng
  shirtYellow: '#FFEB00',  // Thân áo dưới vàng tươi
  shirtYellowShade: '#E6CF00',
  pantsBlue: '#146BC0',    // Quần dài thể dục xanh dương đậm
  pantsDark: '#0E5296',    // Bóng nếp gấp quần
  stripeWhite: '#FFFFFF',  // Sọc trắng dọc hai bên hông quần
  sockYellow: '#FACC15',   // Cổ tất vàng
  shoeOrange: '#E8751A',   // Giày thể thao màu cam nổi bật
  shoeDark: '#C85E0E',
  soleWhite: '#F1F5F9',    // Đế & dây giày trắng ngà
  arrowBlue: '#0284C7',    // Mũi tên nét đứt SGK
  aiLine: '#10B981',       // Đường khung xương AI Pose
  aiJoint: '#F97316',      // Chấm khớp AI Pose
};

/**
 * HẰNG SỐ GIẢI PHẪU 3D CỦA NHÂN VẬT (tính bằng đơn vị SVG trong viewBox 360x390)
 * Hệ trục:
 *   +X: sang phải màn hình (phía TRÁI giải phẫu của nhân vật)
 *   +Y: hướng lên trên từ mặt đất (y = 0 là sàn, y = 270 là đỉnh đầu)
 *   +Z: hướng ra phía trước màn hình (về phía người xem)
 */
const ANATOMY = {
  cx: 180,
  floorY: 356,
  focal: 680,
  shoulderHalfW: 23.5,
  upperArmLen: 44,
  forearmLen: 42,
  thighLen: 60,
  shinLen: 58,
  ankleHeight: 16,
  baseHipY: 134,
  torsoHeight: 77, // từ hông (134) lên vai (211)
  headOffsetY: 32, // từ vai lên tâm đầu (243)
};

/**
 * ĐẦY ĐỦ 12 TƯ THẾ CHUẨN SGK (TTCB + NHỊP 1 ĐẾN NHỊP 11)
 * Các thông số cánh tay:
 *   uL / uR: [out, up, fwd] vector cánh tay trên (out > 0: dang ra ngoài, out < 0: khép vào trong)
 *   fL / fR: [out, up, fwd] vector cẳng tay
 *   L = tay TRÁI của nhân vật (bên PHẢI màn hình, side = +1)
 *   R = tay PHẢI của nhân vật (bên TRÁI màn hình, side = -1)
 */
const POSES = [
  {
    index: 0,
    id: 'ttcb',
    code: 'TTCB',
    shortTitle: 'Đứng nghiêm',
    caption: 'TTCB. Đứng nghiêm.',
    stanceWidth: 0,      // 0 = khép chân nghiêm, 1 = rộng bằng vai
    kneeBend: 0,         // 0 = thẳng gối, 1 = khuỵu sâu
    hipYaw: 0,           // độ xoay hông (+ = xoay sang trái nhân vật / phải màn hình)
    torsoYaw: 0,         // độ xoay thân trên
    armYaw: 0,           // độ xoay trục vai/tay (tạo độ vặn tự nhiên ở Nhịp 9 & 11)
    headYaw: 0,          // độ xoay đầu
    headPitch: 0,        // +1 = ngửa lên, -1 = cúi xuống
    uL: [4.5, -43.5, 2],
    fL: [-2.5, -41.8, 3],
    uR: [4.5, -43.5, 2],
    fR: [-2.5, -41.8, 3],
    handMode: 'neutral',
    arrowMode: 'none',
  },
  {
    index: 1,
    id: 'nhip-1',
    code: 'Nhịp 1',
    shortTitle: 'Tay đưa ra trước',
    caption: 'Nhịp 1. Hai tay đưa ra trước, lòng bàn tay hướng vào nhau, mắt nhìn theo tay.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [0, -1, 44],
    fL: [-1.5, 0.5, 42],
    uR: [0, -1, 44],
    fR: [-1.5, 0.5, 42],
    handMode: 'inwardFront',
    arrowMode: 'none',
  },
  {
    index: 2,
    id: 'nhip-2',
    code: 'Nhịp 2',
    shortTitle: 'Tay đưa lên cao',
    caption: 'Nhịp 2. Hai tay đưa lên cao, tay thẳng, lòng bàn tay hướng vào nhau, mắt nhìn theo tay.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0.96,
    uL: [-2.2, 43.9, 1],
    fL: [-0.5, 42, 0],
    uR: [-2.2, 43.9, 1],
    fR: [-0.5, 42, 0],
    handMode: 'inwardUp',
    arrowMode: 'none',
  },
  {
    index: 3,
    id: 'nhip-3',
    code: 'Nhịp 3',
    shortTitle: 'Tay dang ngang (sấp)',
    caption: 'Nhịp 3. Hai tay dang ngang, lòng bàn tay sấp, đầu thẳng, mắt nhìn phía trước.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [44, 0, 0],
    fL: [42, 0, 0],
    uR: [44, 0, 0],
    fR: [42, 0, 0],
    handMode: 'palmDown',
    arrowMode: 'none',
  },
  {
    index: 4,
    id: 'nhip-4',
    code: 'Nhịp 4',
    shortTitle: 'Khuỵu gối, tay chéo',
    caption: 'Nhịp 4. Khuỵu gối, hai tay hạ chéo trước bụng (tay trái trước, tay phải sau), đầu cúi, mắt nhìn theo tay.',
    stanceWidth: 0,
    kneeBend: 0.62,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: -0.96,
    // Tay trái nhân vật (uL/fL - bên phải màn hình) đặt phía TRƯỚC (z lớn hơn)
    uL: [4, -40.5, 16],
    fL: [-32, -26, 14],
    // Tay phải nhân vật (uR/fR - bên trái màn hình) đặt phía SAU (z nhỏ hơn)
    uR: [4, -40.5, 9],
    fR: [-32, -26, 6],
    handMode: 'crossed',
    arrowMode: 'none',
  },
  {
    index: 5,
    id: 'nhip-5',
    code: 'Nhịp 5',
    shortTitle: 'Tay lên cao chữ V',
    caption: 'Nhịp 5. Duỗi thẳng khớp gối, hai tay đưa sang ngang, lên cao chếch hình chữ V, lòng bàn tay hướng vào nhau, đầu ngửa, mắt nhìn theo tay.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0.88,
    uL: [16.5, 40.8, 1.5],
    fL: [15.5, 39.0, 1],
    uR: [16.5, 40.8, 1.5],
    fR: [15.5, 39.0, 1],
    handMode: 'inwardV',
    arrowMode: 'none',
  },
  {
    index: 6,
    id: 'nhip-6',
    code: 'Nhịp 6',
    shortTitle: 'Tay chạm mỏm vai',
    caption: 'Nhịp 6. Hai cánh tay hạ ngang vai, các đầu ngón tay chạm mỏm vai, đầu thẳng, mắt nhìn phía trước.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    // Cánh tay trên giữ ngang vai, khuỷu hướng ra ngoài, cẳng tay gập lên-vào để đầu ngón tay chạm mỏm vai
    uL: [37, -12, 9],
    fL: [-24, 27, 11],
    uR: [37, -12, 9],
    fR: [-24, 27, 11],
    handMode: 'shoulderTouch',
    arrowMode: 'none',
  },
  {
    index: 7,
    id: 'nhip-7',
    code: 'Nhịp 7',
    shortTitle: 'Tay dang ngang (ngửa)',
    caption: 'Nhịp 7. Hai tay dang ngang, lòng bàn tay ngửa, đầu thẳng, mắt nhìn phía trước.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [44, 0, 0],
    fL: [42, 0, 0],
    uR: [44, 0, 0],
    fR: [42, 0, 0],
    handMode: 'palmUp',
    arrowMode: 'none',
  },
  {
    index: 8,
    id: 'nhip-8',
    code: 'Nhịp 8',
    shortTitle: 'Bước trái, gập trước ngực',
    caption: 'Nhịp 8. Chân trái bước sang ngang rộng bằng vai, cẳng tay gập trước ngực, lòng bàn tay sấp.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [34, -4, 18],
    fL: [-43, 4, 11],
    uR: [34, -4, 18],
    fR: [-43, 4, 11],
    handMode: 'palmDownChest',
    arrowMode: 'foldChest',
  },
  {
    index: 9,
    id: 'nhip-9',
    code: 'Nhịp 9',
    shortTitle: 'Xoay người sang trái',
    caption: 'Nhịp 9. Hai tay dang ngang, lòng bàn tay ngửa, xoay người sang trái.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: 28,
    torsoYaw: 82,
    armYaw: 102,
    headYaw: 84,
    headPitch: 0,
    uL: [42.5, 0, -11],
    fL: [40.5, 0, -10],
    uR: [43.5, 0, 5],
    fR: [41.5, 0, 5],
    handMode: 'palmUp',
    arrowMode: 'twistLeft',
  },
  {
    index: 10,
    id: 'nhip-10',
    code: 'Nhịp 10',
    shortTitle: 'Trở về nhịp 8',
    caption: 'Nhịp 10. Trở về nhịp 8.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [34, -4, 18],
    fL: [-43, 4, 11],
    uR: [34, -4, 18],
    fR: [-43, 4, 11],
    handMode: 'palmDownChest',
    arrowMode: 'foldChest',
  },
  {
    index: 11,
    id: 'nhip-11',
    code: 'Nhịp 11',
    shortTitle: 'Xoay người sang phải',
    caption: 'Nhịp 11. Hai tay dang ngang, lòng bàn tay ngửa, xoay người sang phải.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: -28,
    torsoYaw: -82,
    armYaw: -102,
    headYaw: -84,
    headPitch: 0,
    uL: [43.5, 0, 5],
    fL: [41.5, 0, 5],
    uR: [42.5, 0, -11],
    fR: [40.5, 0, -10],
    handMode: 'palmUp',
    arrowMode: 'twistRight',
  },
];


/* =========================================================================
   TOÁN HỌC 3D, PHÉP CHIẾU 2.5D & NỘI SUY LIỀN MẠCH
   ========================================================================= */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpVec3(v1, v2, t) {
  return [
    lerp(v1[0], v2[0], t),
    lerp(v1[1], v2[1], t),
    lerp(v1[2], v2[2], t),
  ];
}

function easeInOutCubic(t) {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/**
 * Chuẩn hóa độ dài vector 3D để xương cánh tay không bao giờ bị co giãn giả khi nội suy góc lớn
 */
function normalizeToLength(v, targetLen) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  const scale = targetLen / len;
  return [v[0] * scale, v[1] * scale, v[2] * scale];
}

/**
 * Xoay điểm (x, y, z) quanh trục thẳng đứng Y theo góc yawDeg
 * Quy ước: yawDeg > 0 xoay mặt trước (+Z) sang PHẢI màn hình (+X, tức sang TRÁI nhân vật)
 */
function rotateY(x, y, z, yawDeg) {
  const rad = (yawDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {
    x: x * c + z * s,
    y: y,
    z: -x * s + z * c,
  };
}

/**
 * Phép chiếu phối cảnh nhẹ từ không gian 3D sang 2D SVG
 */
function project3D(p) {
  const s = ANATOMY.focal / (ANATOMY.focal - p.z);
  return {
    x: ANATOMY.cx + p.x * s,
    y: ANATOMY.floorY - (HORIZON_Y + (p.y - HORIZON_Y) * s),
    z: p.z,
    s: s,
  };
}

/**
 * Nội suy trạng thái khung xương tại bất kỳ mốc thời gian thực nào (0.0 -> 12.0)
 * Kèm quỹ đạo sinh học tự nhiên (nhấc chân khi bước ở 7->8, vòng tay sang ngang ở 4->5)
 */
function samplePoseAtTime(timelineVal) {
  const wrapped = ((timelineVal % 12) + 12) % 12;
  const idxA = Math.floor(wrapped) % 12;
  const idxB = (idxA + 1) % 12;
  const rawT = wrapped - Math.floor(wrapped);
  const t = easeInOutCubic(rawT);

  const A = POSES[idxA];
  const B = POSES[idxB];

  let uL = lerpVec3(A.uL, B.uL, t);
  let fL = lerpVec3(A.fL, B.fL, t);
  let uR = lerpVec3(A.uR, B.uR, t);
  let fR = lerpVec3(A.fR, B.fR, t);

  // Tạo quỹ đạo chuyển động tự nhiên giữa các nhịp đặc biệt:
  const arc = Math.sin(Math.PI * t);

  // Nhịp 4 -> Nhịp 5: "hai tay đưa sang ngang, lên cao chếch hình chữ V"
  if (idxA === 4 && idxB === 5) {
    uL[0] += arc * 28;
    fL[0] += arc * 36;
    uR[0] += arc * 28;
    fR[0] += arc * 36;
  }

  // Nhịp 3 -> Nhịp 4: hạ tay vòng nhẹ ra ngoài rồi khép chéo trước bụng (tránh xuyên thân)
  if (idxA === 3 && idxB === 4) {
    uL[0] += arc * 12;
    uL[2] += arc * 10;
    uR[0] += arc * 12;
    uR[2] += arc * 6;
  }

  // Nhịp 1 -> Nhịp 2 & 11 -> TTCB: giữ vòng cung tay tự nhiên phía trước/bên
  if (idxA === 1 && idxB === 2) {
    uL[2] += arc * 16;
    fL[2] += arc * 14;
    uR[2] += arc * 16;
    fR[2] += arc * 14;
  }

  // Nhịp 8 -> 9, 9 -> 10, 10 -> 11: giữ cẳng tay hơi vươn ra trước khi mở/gập để không chạm ngực
  if ((idxA === 8 && idxB === 9) || (idxA === 9 && idxB === 10) || (idxA === 10 && idxB === 11)) {
    fL[2] += arc * 14;
    fR[2] += arc * 14;
  }

  // Nhấc nhẹ chân trái (phía phải màn hình) tạo bước chân sinh động khi bước ngang (7->8) hoặc thu về (11->0)
  let leftFootLift = 0;
  if ((idxA === 7 && idxB === 8) || (idxA === 11 && idxB === 0)) {
    leftFootLift = Math.sin(Math.PI * rawT) * 14;
  }

  // Chuẩn hóa độ dài xương tay (riêng Nhịp 6 cho phép co gọn chút theo góc nhìn cẳng tay gập)
  const isNear6 = (idxA === 6 && rawT < 0.5) || (idxB === 6 && rawT >= 0.5);
  const uLen = isNear6 ? lerp(ANATOMY.upperArmLen, 40, 0.5) : ANATOMY.upperArmLen;
  const fLen = isNear6 ? lerp(ANATOMY.forearmLen, 38, 0.5) : ANATOMY.forearmLen;

  uL = normalizeToLength(uL, uLen);
  fL = normalizeToLength(fL, fLen);
  uR = normalizeToLength(uR, uLen);
  fR = normalizeToLength(fR, fLen);

  // Độ mờ của mũi tên chuyển động SGK (hiện rõ khi gần đỉnh Nhịp 8, 9, 10, 11)
  let arrowMode = 'none';
  let arrowOpacity = 0;
  const distToA = rawT;
  const distToB = 1 - rawT;
  if (A.arrowMode !== 'none' && distToA < 0.35) {
    arrowMode = A.arrowMode;
    arrowOpacity = 1 - distToA / 0.35;
  } else if (B.arrowMode !== 'none' && distToB < 0.35) {
    arrowMode = B.arrowMode;
    arrowOpacity = 1 - distToB / 0.35;
  }

  // Chọn kiểu bàn tay theo nhịp gần hơn
  const handMode = rawT < 0.5 ? A.handMode : B.handMode;

  return {
    nearestIdx: rawT < 0.5 ? idxA : idxB,
    stanceWidth: lerp(A.stanceWidth, B.stanceWidth, t),
    kneeBend: lerp(A.kneeBend, B.kneeBend, t),
    hipYaw: lerp(A.hipYaw, B.hipYaw, t),
    torsoYaw: lerp(A.torsoYaw, B.torsoYaw, t),
    armYaw: lerp(A.armYaw, B.armYaw, t),
    headYaw: lerp(A.headYaw, B.headYaw, t),
    headPitch: lerp(A.headPitch, B.headPitch, t),
    uL,
    fL,
    uR,
    fR,
    leftFootLift,
    handMode,
    arrowMode,
    arrowOpacity,
  };
}

/* =========================================================================
   BỘ VẼ VECTOR SVG CHẤT LƯỢNG CAO (ĐỒNG PHỤC SGK + HÌNH KHỐI 2.5D MỀM MẠI)
   ========================================================================= */

/**
 * Tạo đường viền ống tay/chân thuôn mềm mại giữa 2 điểm 2D (p1 -> p2) với bán kính r1 -> r2
 */
function buildCapsulePath(p1, p2, r1, r2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 1.8) {
    // Khi đoạn xương hướng thẳng về phía camera (foreshortening cực đại) -> vẽ hình tròn tròn đầy
    const r = Math.max(r1, r2);
    return `M ${(p1.x - r).toFixed(1)} ${p1.y.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(p1.x + r).toFixed(1)} ${p1.y.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(p1.x - r).toFixed(1)} ${p1.y.toFixed(1)} Z`;
  }

  const nx = -dy / dist;
  const ny = dx / dist;

  const ax = p1.x + nx * r1;
  const ay = p1.y + ny * r1;
  const bx = p2.x + nx * r2;
  const by = p2.y + ny * r2;
  const cx = p2.x - nx * r2;
  const cy = p2.y - ny * r2;
  const dxp = p1.x - nx * r1;
  const dyp = p1.y - ny * r1;

  return `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} A ${r2.toFixed(1)} ${r2.toFixed(1)} 0 0 1 ${cx.toFixed(1)} ${cy.toFixed(1)} L ${dxp.toFixed(1)} ${dyp.toFixed(1)} A ${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 1 ${ax.toFixed(1)} ${ay.toFixed(1)} Z`;
}

/**
 * Tạo đoạn ống tay áo hoặc ống quần hình thang bo nhẹ (không tròn đầu ở gấu)
 */
function buildQuadTube(p1, p2, r1, r2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;

  const x1a = p1.x + nx * r1;
  const y1a = p1.y + ny * r1;
  const x2a = p2.x + nx * r2;
  const y2a = p2.y + ny * r2;
  const x2b = p2.x - nx * r2;
  const y2b = p2.y - ny * r2;
  const x1b = p1.x - nx * r1;
  const y1b = p1.y - ny * r1;

  return {
    path: `M ${x1a.toFixed(1)} ${y1a.toFixed(1)} L ${x2a.toFixed(1)} ${y2a.toFixed(1)} L ${x2b.toFixed(1)} ${y2b.toFixed(1)} L ${x1b.toFixed(1)} ${y1b.toFixed(1)} Z`,
    cuffLine: `M ${x2a.toFixed(1)} ${y2a.toFixed(1)} L ${x2b.toFixed(1)} ${y2b.toFixed(1)}`,
    nx,
    ny,
  };
}

/**
 * Vẽ ĐÔI GIÀY THỂ THAO CAM (#E8751A) + TẤT VÀNG (#FACC15) + ĐẾ & DÂY TRẮNG NGÀ (#F1F5F9)
 */
function renderFootAndShoe(ankle2D, side, hipYaw, stanceWidth, liftOffset) {
  const s = ankle2D.s;
  // Hướng mũi giày hơi chếch chữ V nhẹ khi đứng thẳng, và xoay nhẹ theo hông ở Nhịp 9 & 11
  const yawRad = (hipYaw * Math.PI) / 180;
  const toeDir = side * (0.28 + stanceWidth * 0.14) + Math.sin(yawRad) * 0.88;

  const ax = ankle2D.x;
  const ay = ankle2D.y;
  const groundY = ay + 15 * s;

  // Cổ tất màu vàng (#FACC15)
  const sockHtml = `
    <rect x="${(ax - 5.2 * s).toFixed(1)}" y="${(ay - 2 * s).toFixed(1)}"
          width="${(10.4 * s).toFixed(1)}" height="${(7.5 * s).toFixed(1)}"
          rx="${(2.2 * s).toFixed(1)}"
          fill="${COLORS.sockYellow}" stroke="${COLORS.outline}" stroke-width="1.7" />
  `;

  // Giày thể thao hướng về phía toeDir (dạng 2.5D mềm mại)
  const toeX = ax + toeDir * 19 * s;
  const heelX = ax - toeDir * 7.5 * s;
  const leftEdge = Math.min(heelX - 6.5 * s, toeX - 6.8 * s);
  const rightEdge = Math.max(heelX + 6.5 * s, toeX + 6.8 * s);
  const midTopX = (ax + toeX) * 0.52;

  const shoePath = `
    M ${(ax - 5.5 * s).toFixed(1)} ${(ay + 4 * s).toFixed(1)}
    L ${(ax + 5.5 * s).toFixed(1)} ${(ay + 4 * s).toFixed(1)}
    Q ${(rightEdge + 1.5 * s).toFixed(1)} ${(groundY - 7 * s).toFixed(1)} ${rightEdge.toFixed(1)} ${(groundY - 2.5 * s).toFixed(1)}
    Q ${rightEdge.toFixed(1)} ${(groundY + 1.2 * s).toFixed(1)} ${(rightEdge - 4 * s).toFixed(1)} ${(groundY + 1.2 * s).toFixed(1)}
    L ${(leftEdge + 4 * s).toFixed(1)} ${(groundY + 1.2 * s).toFixed(1)}
    Q ${leftEdge.toFixed(1)} ${(groundY + 1.2 * s).toFixed(1)} ${leftEdge.toFixed(1)} ${(groundY - 2.5 * s).toFixed(1)}
    Q ${(leftEdge - 1.5 * s).toFixed(1)} ${(groundY - 7 * s).toFixed(1)} ${(ax - 5.5 * s).toFixed(1)} ${(ay + 4 * s).toFixed(1)} Z
  `;

  const solePath = `
    M ${(leftEdge + 0.6 * s).toFixed(1)} ${(groundY - 2.4 * s).toFixed(1)}
    L ${(rightEdge - 0.6 * s).toFixed(1)} ${(groundY - 2.4 * s).toFixed(1)}
    L ${(rightEdge - 1.8 * s).toFixed(1)} ${(groundY + 1.4 * s).toFixed(1)}
    L ${(leftEdge + 1.8 * s).toFixed(1)} ${(groundY + 1.4 * s).toFixed(1)} Z
  `;

  // Dây giày trắng ngà nổi bật trên mu bàn chân
  const lace1 = `M ${(midTopX - 3.6 * s).toFixed(1)} ${(ay + 7.5 * s).toFixed(1)} L ${(midTopX + 3.6 * s).toFixed(1)} ${(ay + 8.8 * s).toFixed(1)}`;
  const lace2 = `M ${(midTopX - 3.8 * s + toeDir * 2.5).toFixed(1)} ${(ay + 10.2 * s).toFixed(1)} L ${(midTopX + 3.8 * s + toeDir * 2.5).toFixed(1)} ${(ay + 11.4 * s).toFixed(1)}`;

  return `
    <g>
      ${sockHtml}
      <path d="${shoePath}" fill="${COLORS.shoeOrange}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <path d="${solePath}" fill="${COLORS.soleWhite}" stroke="${COLORS.outline}" stroke-width="1.4" stroke-linejoin="round" />
      <path d="${lace1}" stroke="${COLORS.soleWhite}" stroke-width="1.8" stroke-linecap="round" />
      <path d="${lace2}" stroke="${COLORS.soleWhite}" stroke-width="1.7" stroke-linecap="round" />
    </g>
  `;
}

/**
 * Vẽ MỘT CHÂN QUẦN THỂ DỤC XANH DƯƠNG (#146BC0) KÈM SỌC TRẮNG 2.5D DỌC HÔNG QUẦN
 */
function renderLeg(legData, hipYaw) {
  const { hip2D, knee2D, ankle2D, side, stanceWidth, liftOffset } = legData;
  const rHip = 10.6 * hip2D.s;
  const rKnee = 9.0 * knee2D.s;
  const rAnkle = 7.4 * ankle2D.s;

  const thighQuad = buildQuadTube(hip2D, knee2D, rHip, rKnee);
  const shinQuad = buildQuadTube(knee2D, ankle2D, rKnee * 0.98, rAnkle);

  // Tính vị trí đường sọc trắng bên hông ngoài quần xoay mượt theo hipYaw!
  // Khi hipYaw = 0: sọc nằm sát mép ngoài (side * 0.82).
  // Khi hipYaw = ±28°: chân xoay ra phía trước sẽ thấy sọc trắng trượt vào gần giữa ống quần (giống hệt video Nhịp 9 & 11!)
  const yawRad = (hipYaw * Math.PI) / 180;
  const stripeLateral = side * Math.cos(yawRad); // 1 ở mép ngoài, tiến về 0 khi xoay ngang
  const stripeVis = side * Math.sin(yawRad) > -0.78; // Ẩn nếu mặt ngoài xoay khuất hoàn toàn ra sau

  // Tính hướng vector ngang vuông góc với trục đùi & cẳng chân
  const tLen = Math.hypot(knee2D.x - hip2D.x, knee2D.y - hip2D.y) || 1;
  const sLen = Math.hypot(ankle2D.x - knee2D.x, ankle2D.y - knee2D.y) || 1;
  // Vector sang phải (+X) vuông góc ống quần hướng xuống
  const tRightX = (knee2D.y - hip2D.y) / tLen;
  const tRightY = -(knee2D.x - hip2D.x) / tLen;
  const sRightX = (ankle2D.y - knee2D.y) / sLen;
  const sRightY = -(ankle2D.x - knee2D.x) / sLen;

  const sOffsetRatio = stripeLateral * 0.78;
  const st1x = hip2D.x + tRightX * rHip * sOffsetRatio;
  const st1y = hip2D.y + tRightY * rHip * sOffsetRatio;
  const st2x = knee2D.x + ((tRightX + sRightX) * 0.5) * rKnee * sOffsetRatio;
  const st2y = knee2D.y + ((tRightY + sRightY) * 0.5) * rKnee * sOffsetRatio;
  const st3x = ankle2D.x + sRightX * rAnkle * sOffsetRatio;
  const st3y = ankle2D.y + sRightY * rAnkle * sOffsetRatio;

  const stripeHtml = stripeVis
    ? `<polyline points="${st1x.toFixed(1)},${st1y.toFixed(1)} ${st2x.toFixed(1)},${st2y.toFixed(1)} ${st3x.toFixed(1)},${st3y.toFixed(1)}"
                 fill="none" stroke="${COLORS.stripeWhite}" stroke-width="${(2.6 * knee2D.s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.94" />`
    : '';

  // Vẽ giày trước hoặc sau cổ chân
  const shoeHtml = renderFootAndShoe(ankle2D, side, hipYaw, stanceWidth, liftOffset);

  return `
    <g>
      ${shoeHtml}
      <!-- Đùi quần & cẳng quần xanh dương liền mạch -->
      <path d="${thighQuad.path}" fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <path d="${shinQuad.path}" fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <!-- Che khớp nối gối mềm không để đường kẻ ngang gắt -->
      <circle cx="${knee2D.x.toFixed(1)}" cy="${knee2D.y.toFixed(1)}" r="${(rKnee - 0.8).toFixed(1)}" fill="${COLORS.pantsBlue}" />
      <!-- Gấu quần bo nhẹ trên cổ chân -->
      <path d="${shinQuad.cuffLine}" stroke="${COLORS.outline}" stroke-width="2" stroke-linecap="round" />
      <!-- Sọc trắng dọc hông quần chuẩn đồng phục SGK -->
      ${stripeHtml}
    </g>
  `;
}

/**
 * Vẽ BÀN TAY CHI TIẾT PHÂN BIỆT RÕ CÁC TƯ THẾ LÒNG BÀN TAY
 */
function renderHand(wrist2D, elbow2D, wrist3D, elbow3D, side, handMode, torsoYaw) {
  const s = wrist2D.s;
  const dx = wrist2D.x - elbow2D.x;
  const dy = wrist2D.y - elbow2D.y;
  const dist2D = Math.hypot(dx, dy);
  const angleDeg = dist2D > 1.5 ? (Math.atan2(dy, dx) * 180) / Math.PI : (side > 0 ? 0 : 180);

  // 1. Nhịp 1: Hai tay đưa thẳng ra trước camera (phối cảnh nhìn thẳng vào đầu ngón tay, lòng hướng vào nhau)
  if (handMode === 'inwardFront' && (wrist3D.z - elbow3D.z) > 18) {
    const inward = -side; // hướng vào trung tâm cơ thể
    return `
      <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) scale(${s.toFixed(3)})">
        <!-- Bàn tay đưa ra trước: ngón cái chỉ lên trên, lòng bàn tay hướng vào nhau -->
        <path d="M ${(inward * -5).toFixed(1)} -7
                 Q ${(inward * 1).toFixed(1)} -12 ${(inward * 5.5).toFixed(1)} -7
                 L ${(inward * 6.5).toFixed(1)} 5
                 Q ${(inward * 5).toFixed(1)} 9.5 ${(inward * -1).toFixed(1)} 9
                 Q ${(inward * -6.5).toFixed(1)} 8 ${(inward * -6.5).toFixed(1)} 1 Z"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <!-- Đường rãnh các ngón tay khép đều -->
        <line x1="${(inward * -3).toFixed(1)}" y1="-1" x2="${(inward * 4.2).toFixed(1)}" y2="-1" stroke="${COLORS.skinShadow}" stroke-width="1.3" stroke-linecap="round" />
        <line x1="${(inward * -3).toFixed(1)}" y1="2.8" x2="${(inward * 4.2).toFixed(1)}" y2="2.8" stroke="${COLORS.skinShadow}" stroke-width="1.3" stroke-linecap="round" />
        <line x1="${(inward * -2.5).toFixed(1)}" y1="6.2" x2="${(inward * 3.5).toFixed(1)}" y2="6.2" stroke="${COLORS.skinShadow}" stroke-width="1.2" stroke-linecap="round" />
        <!-- Đầu ngón cái hướng lên -->
        <path d="M ${(inward * 1).toFixed(1)} -8 Q ${(inward * 4.8).toFixed(1)} -14 ${(inward * 6.2).toFixed(1)} -7.5"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.6" stroke-linecap="round" />
      </g>
    `;
  }

  // 2. Nhịp 6: Các đầu ngón tay uốn nhẹ chạm xuống mỏm vai
  if (handMode === 'shoulderTouch') {
    const inward = -side;
    return `
      <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) scale(${s.toFixed(3)})">
        <path d="M 0 -3.5
                 Q ${(inward * 9).toFixed(1)} -7 ${(inward * 13.5).toFixed(1)} 2.5
                 Q ${(inward * 14.5).toFixed(1)} 8 ${(inward * 10.5).toFixed(1)} 9
                 Q ${(inward * 6.5).toFixed(1)} 7 ${(inward * 5).toFixed(1)} 2.5
                 L 0 3.5 Z"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <!-- Nét đầu ngón tay đặt lên mỏm vai -->
        <line x1="${(inward * 8.5).toFixed(1)}" y1="2" x2="${(inward * 11.2).toFixed(1)}" y2="6.5" stroke="${COLORS.skinShadow}" stroke-width="1.2" stroke-linecap="round" />
      </g>
    `;
  }

  // 3. Tay dang ngang & xoay thân (Nhịp 9 / 11): bàn tay ngửa rõ nét ngay cả khi rút ngắn phối cảnh
  if (handMode === 'palmUp' && Math.abs(torsoYaw) > 35 && dist2D < 26) {
    const dirX = Math.sign(dx) || (torsoYaw > 0 ? 1 : -1);
    return `
      <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) scale(${s.toFixed(3)})">
        <!-- Bàn tay ngửa hướng về phía camera với ngón mở khép nhẹ -->
        <path d="M ${(-5 * dirX).toFixed(1)} 3
                 Q ${(3 * dirX).toFixed(1)} 7 ${(11 * dirX).toFixed(1)} 2.5
                 Q ${(14 * dirX).toFixed(1)} -1 ${(10 * dirX).toFixed(1)} -3.5
                 L ${(-4 * dirX).toFixed(1)} -3.5 Z"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <!-- Các đầu ngón tay cong nhẹ lên (dấu hiệu lòng bàn tay ngửa) -->
        <path d="M ${(3 * dirX).toFixed(1)} -3.2 Q ${(6 * dirX).toFixed(1)} -6.5 ${(8.5 * dirX).toFixed(1)} -3.2"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.4" stroke-linecap="round" />
        <line x1="${(1 * dirX).toFixed(1)}" y1="0.8" x2="${(9 * dirX).toFixed(1)}" y2="0.4" stroke="${COLORS.skinShadow}" stroke-width="1.2" stroke-linecap="round" />
      </g>
    `;
  }

  // 4. Bàn tay hướng theo trục cẳng tay (TTCB, Nhịp 2, 3, 4, 5, 7, 8, 10)
  let thumbY = -4.5 * side;
  let palmCurveTop = -3.8;
  let palmCurveBot = 3.8;
  let tipShiftY = 0;

  if (handMode === 'palmUp') {
    // Lòng bàn tay ngửa lên: đầu ngón hơi hếch nhẹ lên trên, ngón cái lộ phía trên
    tipShiftY = -2.2 * side;
    thumbY = -5.6 * side;
  } else if (handMode === 'palmDown' || handMode === 'palmDownChest') {
    // Lòng bàn tay sấp: đầu ngón hơi rũ nhẹ xuống, mu bàn tay phẳng trên
    tipShiftY = 1.6 * side;
    thumbY = 4.6 * side;
  } else if (handMode === 'inwardUp' || handMode === 'inwardV') {
    thumbY = -4.8 * side;
  } else if (handMode === 'crossed') {
    thumbY = -4.0 * side;
  }

  return `
    <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) rotate(${angleDeg.toFixed(1)}) scale(${s.toFixed(3)})">
      <!-- Thân bàn tay và các ngón khép gọn -->
      <path d="M -1.5 ${palmCurveTop.toFixed(1)}
               L 13.5 ${(palmCurveTop * 0.72 + tipShiftY).toFixed(1)}
               Q 17.5 ${(tipShiftY).toFixed(1)} 13.5 ${(palmCurveBot * 0.78 + tipShiftY).toFixed(1)}
               L -1.5 ${palmCurveBot.toFixed(1)} Z"
            fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Ngón cái -->
      <path d="M 1 ${(thumbY * 0.45).toFixed(1)} Q 6.5 ${(thumbY * 1.15).toFixed(1)} 9.5 ${(thumbY * 0.55).toFixed(1)}"
            fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.5" stroke-linecap="round" />
      <!-- Nét chia ngón tay tinh tế -->
      <line x1="6.5" y1="${(tipShiftY * 0.5).toFixed(1)}" x2="14" y2="${(tipShiftY * 0.85).toFixed(1)}"
            stroke="${COLORS.skinShadow}" stroke-width="1.2" stroke-linecap="round" />
    </g>
  `;
}

/**
 * Vẽ MỘT CÁNH TAY HOÀN CHỈNH (Áo tay ngắn trắng viền xanh + Cánh tay + Cẳng tay + Bàn tay)
 * Tự động chia lớp (depth sorting) giữa cẳng tay và cánh tay trên khi bị rút ngắn phối cảnh!
 */
function renderArmSegments(armData, handMode, torsoYaw) {
  const { shoulder2D, elbow2D, wrist2D, shoulder3D, elbow3D, wrist3D, side } = armData;

  // Điểm kết thúc tay áo ngắn trắng (44% chiều dài cánh tay trên)
  const sleeveEnd3D = {
    x: lerp(shoulder3D.x, elbow3D.x, 0.46),
    y: lerp(shoulder3D.y, elbow3D.y, 0.46),
    z: lerp(shoulder3D.z, elbow3D.z, 0.46),
  };
  const sleeveEnd2D = project3D(sleeveEnd3D);

  const rSh = 9.4 * shoulder2D.s;
  const rSleeve = 8.4 * sleeveEnd2D.s;
  const rArmTop = 6.2 * sleeveEnd2D.s;
  const rElbow = 5.5 * elbow2D.s;
  const rWrist = 4.3 * wrist2D.s;

  const sleeveDist = Math.hypot(sleeveEnd2D.x - shoulder2D.x, sleeveEnd2D.y - shoulder2D.y);

  // 1. Phần tay áo ngắn màu trắng + viền xanh dương (#1868B7)
  let sleeveHtml = '';
  if (sleeveDist < 4) {
    // Phối cảnh tay đưa thẳng về phía trước (Nhịp 1) -> tay áo nhìn dạng hình tròn/oval hướng tới trước
    sleeveHtml = `
      <circle cx="${shoulder2D.x.toFixed(1)}" cy="${shoulder2D.y.toFixed(1)}" r="${rSh.toFixed(1)}"
              fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" />
      <circle cx="${sleeveEnd2D.x.toFixed(1)}" cy="${sleeveEnd2D.y.toFixed(1)}" r="${rSleeve.toFixed(1)}"
              fill="${COLORS.shirtWhite}" stroke="${COLORS.collarBlue}" stroke-width="2.8" />
      <circle cx="${sleeveEnd2D.x.toFixed(1)}" cy="${sleeveEnd2D.y.toFixed(1)}" r="${(rSleeve + 1.1).toFixed(1)}"
              fill="none" stroke="${COLORS.outline}" stroke-width="1.2" />
    `;
  } else {
    const sQuad = buildQuadTube(shoulder2D, sleeveEnd2D, rSh, rSleeve);
    sleeveHtml = `
      <g>
        <!-- Đỉnh vai áo bo tròn ôm sát vai -->
        <circle cx="${shoulder2D.x.toFixed(1)}" cy="${shoulder2D.y.toFixed(1)}" r="${rSh.toFixed(1)}"
                fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" />
        <path d="${sQuad.path}" fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
        <!-- Che vệt cắt nội bộ trong vai áo -->
        <circle cx="${shoulder2D.x.toFixed(1)}" cy="${shoulder2D.y.toFixed(1)}" r="${(rSh - 1.1).toFixed(1)}" fill="${COLORS.shirtWhite}" />
        <!-- Viền xanh dương mảnh ở gấu tay áo chuẩn đồng phục -->
        <path d="${sQuad.cuffLine}" stroke="${COLORS.collarBlue}" stroke-width="${(3.2 * sleeveEnd2D.s).toFixed(1)}" stroke-linecap="round" />
        <path d="${sQuad.cuffLine}" stroke="${COLORS.outline}" stroke-width="1.1" stroke-linecap="round" opacity="0.55" />
      </g>
    `;
  }

  // 2. Phần bắp tay trần (từ gấu tay áo -> khuỷu tay)
  const upperBarePath = buildCapsulePath(sleeveEnd2D, elbow2D, rArmTop, rElbow);
  const upperBareHtml = `
    <path d="${upperBarePath}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
  `;

  // 3. Phần cẳng tay (từ khuỷu tay -> cổ tay) + Bàn tay
  const forearmPath = buildCapsulePath(elbow2D, wrist2D, rElbow, rWrist);
  const handHtml = renderHand(wrist2D, elbow2D, wrist3D, elbow3D, side, handMode, torsoYaw);
  const forearmGroupHtml = `
    <g>
      <path d="${forearmPath}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      ${handHtml}
    </g>
  `;

  // Sắp xếp thứ tự lớp giữa tay áo, bắp tay trần và cẳng tay theo độ sâu Z!
  const forearmCloser = (wrist3D.z + elbow3D.z) * 0.5 >= (shoulder3D.z + elbow3D.z) * 0.5 - 2;

  const items = [];
  // Nhóm cánh tay trên (gồm tay áo + bắp tay trần)
  const upperAvgZ = (shoulder3D.z + elbow3D.z) * 0.5;
  const forearmAvgZ = (elbow3D.z + wrist3D.z) * 0.5;

  // Nếu cẳng tay hướng ra xa hơn tay áo (vd: tay sau ở Nhịp 9/11), vẽ cẳng tay trước rồi tới tay áo
  const upperHtml = elbow3D.z > shoulder3D.z + 10
    ? `${sleeveHtml}${upperBareHtml}`
    : `${upperBareHtml}${sleeveHtml}`;

  // Trả về 2 lớp riêng biệt để engine z-sort chuẩn xác cả khi cánh tay vòng qua trước ngực (Nhịp 4, 8, 9, 10, 11)
  items.push({
    z: upperAvgZ,
    html: upperHtml,
  });
  items.push({
    z: forearmCloser ? Math.max(forearmAvgZ, upperAvgZ + 0.5) : Math.min(forearmAvgZ, upperAvgZ - 0.5),
    html: forearmGroupHtml,
  });

  return items;
}

/**
 * Vẽ THÂN ÁO THỂ DỤC 2.5D (Trắng vai/ngực trên + Vàng tươi #FFEB00 thân dưới + Cổ polo xanh #1868B7)
 * Tự động co giãn chiều ngang và trượt cổ áo/nẹp cúc theo góc xoay torsoYaw (-85° -> +85°)
 */
function renderTorso(pose, hipY, shoulderY) {
  const yawRad = (pose.torsoYaw * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);

  // Chiều rộng biểu kiến của hình trụ elip thân người khi xoay 2.5D
  const rxSh = 23.5, rzSh = 13.0;
  const rxWaist = 21.0, rzWaist = 12.2;
  const wSh = Math.hypot(rxSh * cosY, rzSh * sinY);
  const wWaist = Math.hypot(rxWaist * cosY, rzWaist * sinY);

  // Chiếu tâm vai và tâm eo
  const pSh = project3D({ x: 0, y: shoulderY, z: 0 });
  const pWaist = project3D({ x: 0, y: hipY + 11, z: 0 });
  const pSplit = project3D({ x: 0, y: lerp(hipY + 11, shoulderY, 0.67), z: 0 });
  const pHipMid = project3D({ x: 0, y: hipY - 5, z: 0 });

  const shHalf = wSh * pSh.s;
  const waistHalf = wWaist * pWaist.s;
  const splitHalf = lerp(waistHalf, shHalf, 0.67);

  // Vị trí đường trục giữa ngực (cổ áo & nẹp nút) trượt theo sin(yaw)
  const frontOffset = sinY * (wSh * 0.72) * pSh.s;
  const frontX = pSh.x + frontOffset;
  const frontVisible = cosY > -0.15;

  // Phần hông quần (pelvis) nối liền mạch hai ống quần
  const pelvisPath = `
    M ${(pWaist.x - waistHalf * 0.96).toFixed(1)} ${(pWaist.y - 2).toFixed(1)}
    L ${(pWaist.x + waistHalf * 0.96).toFixed(1)} ${(pWaist.y - 2).toFixed(1)}
    L ${(pHipMid.x + waistHalf * 0.98).toFixed(1)} ${(pHipMid.y + 12).toFixed(1)}
    Q ${pHipMid.x.toFixed(1)} ${(pHipMid.y + 18).toFixed(1)} ${(pHipMid.x - waistHalf * 0.98).toFixed(1)} ${(pHipMid.y + 12).toFixed(1)} Z
  `;

  // Mảng áo trên màu trắng (#FFFFFF)
  const topShirtPath = `
    M ${(pSh.x - shHalf).toFixed(1)} ${(pSh.y + 2).toFixed(1)}
    Q ${pSh.x.toFixed(1)} ${(pSh.y - 4.5).toFixed(1)} ${(pSh.x + shHalf).toFixed(1)} ${(pSh.y + 2).toFixed(1)}
    L ${(pSplit.x + splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)}
    Q ${pSplit.x.toFixed(1)} ${(pSplit.y + 3.2 * Math.max(0.2, Math.abs(cosY))).toFixed(1)} ${(pSplit.x - splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)} Z
  `;

  // Mảng áo dưới màu vàng tươi (#FFEB00)
  const botShirtPath = `
    M ${(pSplit.x - splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)}
    Q ${pSplit.x.toFixed(1)} ${(pSplit.y + 3.2 * Math.max(0.2, Math.abs(cosY))).toFixed(1)} ${(pSplit.x + splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)}
    L ${(pWaist.x + waistHalf).toFixed(1)} ${(pWaist.y + 1).toFixed(1)}
    Q ${pWaist.x.toFixed(1)} ${(pWaist.y + 6.5).toFixed(1)} ${(pWaist.x - waistHalf).toFixed(1)} ${(pWaist.y + 1).toFixed(1)} Z
  `;

  // Cổ áo bẻ polo màu xanh dương (#1868B7) thích nghi mượt theo góc xoay 2.5D
  let collarHtml = '';
  if (frontVisible) {
    const wingScale = Math.max(0.28, Math.abs(cosY));
    const leftWingW = 10.5 * wingScale;
    const rightWingW = 10.5 * wingScale;
    const collarY = pSh.y - 2.5;

    // Cánh cổ áo bên trái & bên phải đường nẹp cúc (nếu xoay nhiều sang phải, 1 cánh thu gọn lại)
    const showLeftWing = pose.torsoYaw < 68;
    const showRightWing = pose.torsoYaw > -68;

    // Vòng cổ sau gáy màu xanh dương
    collarHtml += `
      <path d="M ${(pSh.x - 11.5 * pSh.s).toFixed(1)} ${(collarY + 1).toFixed(1)}
               Q ${pSh.x.toFixed(1)} ${(collarY - 4.5).toFixed(1)} ${(pSh.x + 11.5 * pSh.s).toFixed(1)} ${(collarY + 1).toFixed(1)}
               L ${(pSh.x + 10 * pSh.s).toFixed(1)} ${(collarY + 5.5).toFixed(1)}
               L ${(pSh.x - 10 * pSh.s).toFixed(1)} ${(collarY + 5.5).toFixed(1)} Z"
            fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.7" stroke-linejoin="round" />
    `;

    // Nẹp nút giữa ngực
    const placketW = Math.max(2.6, 5.0 * wingScale);
    collarHtml += `
      <rect x="${(frontX - placketW / 2).toFixed(1)}" y="${(collarY + 6).toFixed(1)}"
            width="${placketW.toFixed(1)}" height="12.5" rx="1.5"
            fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.4" />
      <circle cx="${frontX.toFixed(1)}" cy="${(collarY + 10.2).toFixed(1)}" r="1.05" fill="#FFFFFF" />
      <circle cx="${frontX.toFixed(1)}" cy="${(collarY + 14.8).toFixed(1)}" r="1.05" fill="#FFFFFF" />
    `;

    // Hai cánh cổ bẻ chữ V
    if (showLeftWing) {
      collarHtml += `
        <path d="M ${(frontX - leftWingW - 2.5).toFixed(1)} ${(collarY + 1.2).toFixed(1)}
                 L ${(frontX - 1).toFixed(1)} ${(collarY + 9.2).toFixed(1)}
                 L ${(frontX - leftWingW - 4.5).toFixed(1)} ${(collarY + 8.5).toFixed(1)} Z"
              fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.7" stroke-linejoin="round" />
      `;
    }
    if (showRightWing) {
      collarHtml += `
        <path d="M ${(frontX + rightWingW + 2.5).toFixed(1)} ${(collarY + 1.2).toFixed(1)}
                 L ${(frontX + 1).toFixed(1)} ${(collarY + 9.2).toFixed(1)}
                 L ${(frontX + rightWingW + 4.5).toFixed(1)} ${(collarY + 8.5).toFixed(1)} Z"
              fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.7" stroke-linejoin="round" />
      `;
    }
  }

  // Nếp gấp áo thể thao tinh tế ở phần màu vàng
  const foldHtml = `
    <path d="M ${(pWaist.x - waistHalf * 0.62).toFixed(1)} ${(pWaist.y - 10).toFixed(1)} Q ${(pWaist.x - waistHalf * 0.25).toFixed(1)} ${(pWaist.y - 7.5).toFixed(1)} ${(pWaist.x - waistHalf * 0.05).toFixed(1)} ${(pWaist.y - 9.5).toFixed(1)}"
          fill="none" stroke="${COLORS.shirtYellowShade}" stroke-width="1.5" stroke-linecap="round" />
    <path d="M ${(pWaist.x + waistHalf * 0.18).toFixed(1)} ${(pWaist.y - 6.5).toFixed(1)} Q ${(pWaist.x + waistHalf * 0.48).toFixed(1)} ${(pWaist.y - 5).toFixed(1)} ${(pWaist.x + waistHalf * 0.72).toFixed(1)} ${(pWaist.y - 7.5).toFixed(1)}"
          fill="none" stroke="${COLORS.shirtYellowShade}" stroke-width="1.5" stroke-linecap="round" />
  `;

  return `
    <g>
      <path d="${pelvisPath}" fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <path d="${topShirtPath}" fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="2" stroke-linejoin="round" />
      <path d="${botShirtPath}" fill="${COLORS.shirtYellow}" stroke="${COLORS.outline}" stroke-width="2" stroke-linejoin="round" />
      ${foldHtml}
      ${collarHtml}
    </g>
  `;
}

/**
 * Vẽ ĐẦU & KHUÔN MẶT 2.5D XOAY MƯỢT (headYaw -85°..+85° & headPitch -1..+1)
 * Tự động xử lý: Nhìn thẳng, Ngửa đầu (Nhịp 2, 5), Cúi đầu (Nhịp 4), Nghiêng 3/4 -> 84° (Nhịp 9, 11)
 */
function renderHead(pose, shoulderY) {
  const yawDeg = pose.headYaw;
  const yawRad = (yawDeg * Math.PI) / 180;
  const sinY = Math.sin(yawRad);
  const cosY = Math.cos(yawRad);
  const pitch = pose.headPitch; // +1 = ngửa lên, -1 = cúi xuống

  // Khi cúi đầu ở Nhịp 4, đầu hơi nhô nhẹ về trước (+z) và hạ thấp nhẹ
  const head3D = {
    x: 0,
    y: shoulderY + ANATOMY.headOffsetY - Math.max(0, -pitch) * 4.5 + Math.max(0, pitch) * 1.5,
    z: Math.max(0, -pitch) * 10,
  };
  const neckBase3D = { x: 0, y: shoulderY - 1, z: 0 };

  const h = project3D(head3D);
  const nb = project3D(neckBase3D);
  const s = h.s;

  const rx = 16.5 * s;
  const ry = 19.2 * s;
  const faceShiftX = sinY * 14.5 * s;
  const faceShiftY = -pitch * 9.5 * s;

  // 1. Cổ (lộ dài rõ hơn khi ngửa đầu Nhịp 2 & 5)
  const neckW = 6.2 * s;
  const neckHtml = `
    <path d="M ${(nb.x - neckW).toFixed(1)} ${(nb.y + 3).toFixed(1)}
             L ${(h.x - neckW * 0.92).toFixed(1)} ${(h.y + ry * 0.58).toFixed(1)}
             L ${(h.x + neckW * 0.92).toFixed(1)} ${(h.y + ry * 0.58).toFixed(1)}
             L ${(nb.x + neckW).toFixed(1)} ${(nb.y + 3).toFixed(1)}
             Q ${nb.x.toFixed(1)} ${(nb.y + 7.5).toFixed(1)} ${(nb.x - neckW).toFixed(1)} ${(nb.y + 3).toFixed(1)} Z"
          fill="${COLORS.skinShadow}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
  `;

  // 2. Tai hai bên (trượt mượt theo góc xoay đầu: tai gần chuyển vào giữa gáy, tai xa khuất đi)
  const earY = h.y + (1.5 + pitch * 3.5) * s;
  const leftEarX = h.x + cosY * (rx + 0.5);   // bên phải màn hình (+X)
  const rightEarX = h.x - cosY * (rx + 0.5);  // bên trái màn hình (-X)
  const showLeftEar = yawDeg < 62;
  const showRightEar = yawDeg > -62;

  // Khi quay đầu mạnh (|yaw| > 45°), tai gần người xem hiện rõ trên mặt bên đầu
  const nearEarX = h.x - sinY * 5.5 * s;
  const showNearEarOnSide = Math.abs(yawDeg) >= 48;

  let backEarsHtml = '';
  if (showLeftEar && yawDeg >= -48) {
    backEarsHtml += `<ellipse cx="${leftEarX.toFixed(1)}" cy="${earY.toFixed(1)}" rx="${(3.2 * s).toFixed(1)}" ry="${(4.8 * s).toFixed(1)}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" />`;
  }
  if (showRightEar && yawDeg <= 48) {
    backEarsHtml += `<ellipse cx="${rightEarX.toFixed(1)}" cy="${earY.toFixed(1)}" rx="${(3.2 * s).toFixed(1)}" ry="${(4.8 * s).toFixed(1)}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" />`;
  }

  // 3. Mũi nghiêng nhô nhẹ ngoài đường viền mặt khi xoay mạnh (Nhịp 9 & 11)
  let profileNoseHtml = '';
  if (Math.abs(yawDeg) > 48) {
    const dir = Math.sign(yawDeg);
    const noseBaseX = h.x + dir * (rx * 0.92);
    const noseTipX = h.x + dir * (rx + 3.8 * ((Math.abs(yawDeg) - 48) / 36) * s);
    const noseY = h.y + (3.2 + faceShiftY * 0.65) * s;
    profileNoseHtml = `
      <path d="M ${noseBaseX.toFixed(1)} ${(noseY - 3.5 * s).toFixed(1)}
               L ${noseTipX.toFixed(1)} ${(noseY + 1.2 * s).toFixed(1)}
               L ${noseBaseX.toFixed(1)} ${(noseY + 3.4 * s).toFixed(1)}"
            fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
    `;
  }

  // 4. Hình khối đầu chính
  const headOvalHtml = `
    <ellipse cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"
             fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="2" />
  `;

  // Nét bóng dưới cằm khi ngửa đầu (Nhịp 2 & 5)
  const chinHintHtml = pitch > 0.35
    ? `<path d="M ${(h.x - 7 * s).toFixed(1)} ${(h.y + 13.5 * s).toFixed(1)} Q ${h.x.toFixed(1)} ${(h.y + 17.5 * s).toFixed(1)} ${(h.x + 7 * s).toFixed(1)} ${(h.y + 13.5 * s).toFixed(1)}"
             fill="none" stroke="${COLORS.skinShadow}" stroke-width="1.8" stroke-linecap="round" opacity="${((pitch - 0.35) / 0.65).toFixed(2)}" />`
    : '';

  // 5. Các nét trên khuôn mặt (Lông mày, Mắt, Mũi, Miệng, Má hồng)
  let faceFeaturesHtml = '';
  const eyeAngles = [-0.36, 0.36]; // góc mắt trái/phải trên mặt cầu đầu
  const eyeY = h.y + (1.2 * s) + faceShiftY * 0.88;
  const browY = eyeY - (4.6 - Math.max(0, -pitch) * 1.4) * s;

  eyeAngles.forEach((aOffset) => {
    const theta = yawRad + aOffset;
    const vis = Math.cos(theta);
    if (vis > 0.22) {
      const ex = h.x + Math.sin(theta) * (rx * 0.94);
      const eyeScaleX = Math.max(0.45, vis);

      // Lông mày
      faceFeaturesHtml += `
        <path d="M ${(ex - 3.3 * eyeScaleX * s).toFixed(1)} ${(browY + 0.5).toFixed(1)}
                 Q ${ex.toFixed(1)} ${(browY - 1.6 * s).toFixed(1)} ${(ex + 3.3 * eyeScaleX * s).toFixed(1)} ${(browY + 0.5).toFixed(1)}"
              fill="none" stroke="${COLORS.outline}" stroke-width="1.6" stroke-linecap="round" />
      `;

      if (pitch < -0.55) {
        // Mắt cúi nhìn xuống (Nhịp 4)
        faceFeaturesHtml += `
          <path d="M ${(ex - 2.6 * eyeScaleX * s).toFixed(1)} ${eyeY.toFixed(1)}
                   Q ${ex.toFixed(1)} ${(eyeY + 2.6 * s).toFixed(1)} ${(ex + 2.6 * eyeScaleX * s).toFixed(1)} ${eyeY.toFixed(1)}"
                fill="none" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linecap="round" />
        `;
      } else {
        // Đôi mắt sáng thân thiện
        faceFeaturesHtml += `
          <ellipse cx="${ex.toFixed(1)}" cy="${eyeY.toFixed(1)}" rx="${(2.1 * eyeScaleX * s).toFixed(1)}" ry="${(2.2 * s).toFixed(1)}" fill="${COLORS.outline}" />
          <circle cx="${(ex + 0.6 * eyeScaleX * s).toFixed(1)}" cy="${(eyeY - 0.8 * s).toFixed(1)}" r="${(0.7 * s).toFixed(1)}" fill="#FFFFFF" />
        `;
      }
    }
  });

  // Mũi chính diện / 3/4 (ẩn dần khi mũi nghiêng đã xuất hiện)
  if (Math.abs(yawDeg) <= 55) {
    const noseX = h.x + faceShiftX * 0.92;
    const noseY = h.y + (4.8 * s) + faceShiftY * 0.82;
    if (pitch > 0.45) {
      faceFeaturesHtml += `<path d="M ${(noseX - 1.6 * s).toFixed(1)} ${noseY.toFixed(1)} Q ${noseX.toFixed(1)} ${(noseY - 2.0 * s).toFixed(1)} ${(noseX + 1.6 * s).toFixed(1)} ${noseY.toFixed(1)}" fill="none" stroke="#C48A62" stroke-width="1.5" stroke-linecap="round" />`;
    } else {
      faceFeaturesHtml += `<path d="M ${noseX.toFixed(1)} ${(noseY - 1.5 * s).toFixed(1)} Q ${(noseX + (yawDeg >= 0 ? 1.5 : -1.5) * s).toFixed(1)} ${(noseY + 0.8 * s).toFixed(1)} ${noseX.toFixed(1)} ${(noseY + 1.9 * s).toFixed(1)}" fill="none" stroke="#C48A62" stroke-width="1.5" stroke-linecap="round" />`;
    }
  }

  // Miệng cười nhẹ
  const mouthX = h.x + faceShiftX * 0.84;
  const mouthY = h.y + (10.6 * s) + faceShiftY * 0.68;
  const mouthHalfW = 4.6 * Math.max(0.35, Math.abs(cosY)) * s;
  if (Math.abs(yawDeg) <= 68) {
    faceFeaturesHtml += `
      <path d="M ${(mouthX - mouthHalfW).toFixed(1)} ${mouthY.toFixed(1)}
               Q ${mouthX.toFixed(1)} ${(mouthY + 2.8 * s).toFixed(1)} ${(mouthX + mouthHalfW).toFixed(1)} ${mouthY.toFixed(1)}"
            fill="none" stroke="#9A3412" stroke-width="1.7" stroke-linecap="round" />
    `;
  } else {
    // Nét miệng nhỏ nhìn nghiêng
    const dir = Math.sign(yawDeg);
    const sideMouthX = h.x + dir * (rx * 0.72);
    faceFeaturesHtml += `
      <path d="M ${(sideMouthX - dir * 3.8 * s).toFixed(1)} ${mouthY.toFixed(1)}
               Q ${(sideMouthX - dir * 1.2 * s).toFixed(1)} ${(mouthY + 1.6 * s).toFixed(1)} ${(sideMouthX + dir * 1.2 * s).toFixed(1)} ${(mouthY - 0.2 * s).toFixed(1)}"
            fill="none" stroke="#9A3412" stroke-width="1.6" stroke-linecap="round" />
    `;
  }

  // 6. Mái tóc học sinh nam màu nâu đen/than (#333840) thích nghi mượt cả Pitch & Yaw
  let hairHtml = '';
  if (Math.abs(yawDeg) < 35) {
    // Góc chính diện -> 3/4 nhẹ
    const bangY = h.y + (-5.5 - pitch * 5.2) * s;
    const shift = faceShiftX * 0.35;
    hairHtml = `
      <path d="M ${(h.x - rx * 1.02).toFixed(1)} ${(h.y - 1 * s).toFixed(1)}
               C ${(h.x - rx * 1.12).toFixed(1)} ${(h.y - ry * 1.22).toFixed(1)},
                 ${(h.x + rx * 1.12).toFixed(1)} ${(h.y - ry * 1.22).toFixed(1)},
                 ${(h.x + rx * 1.02).toFixed(1)} ${(h.y - 1 * s).toFixed(1)}
               L ${(h.x + rx * 0.84).toFixed(1)} ${(bangY + 1.5 * s).toFixed(1)}
               Q ${(h.x + shift + 5 * s).toFixed(1)} ${(bangY - 2.5 * s).toFixed(1)} ${(h.x + shift).toFixed(1)} ${(bangY + 1.2 * s).toFixed(1)}
               Q ${(h.x + shift - 6 * s).toFixed(1)} ${(bangY - 2.5 * s).toFixed(1)} ${(h.x - rx * 0.84).toFixed(1)} ${(bangY + 1.5 * s).toFixed(1)} Z"
            fill="${COLORS.hair}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
    `;
  } else {
    // Góc xoay nghiêng 3/4 -> nghiêng 84° (Nhịp 9 & 11): phủ kín sau gáy, mái gọn ôm trán
    const dir = Math.sign(yawDeg); // +1 mặt nhìn sang phải, -1 mặt nhìn sang trái
    const backX = h.x - dir * rx * 1.04;
    const frontX = h.x + dir * rx * 0.96;
    hairHtml = `
      <path d="M ${(h.x - dir * rx * 0.38).toFixed(1)} ${(h.y + ry * 0.72).toFixed(1)}
               C ${backX.toFixed(1)} ${(h.y + ry * 0.55).toFixed(1)},
                 ${(backX - dir * 2.5 * s).toFixed(1)} ${(h.y - ry * 0.95).toFixed(1)},
                 ${h.x.toFixed(1)} ${(h.y - ry * 1.08).toFixed(1)}
               C ${(h.x + dir * rx * 0.85).toFixed(1)} ${(h.y - ry * 1.06).toFixed(1)},
                 ${(frontX + dir * 1.5 * s).toFixed(1)} ${(h.y - ry * 0.55).toFixed(1)},
                 ${(frontX - dir * 0.8 * s).toFixed(1)} ${(h.y - ry * 0.25).toFixed(1)}
               Q ${(h.x + dir * rx * 0.25).toFixed(1)} ${(h.y - ry * 0.35).toFixed(1)} ${(h.x - dir * rx * 0.08).toFixed(1)} ${(h.y + 1 * s).toFixed(1)}
               Q ${(h.x - dir * rx * 0.28).toFixed(1)} ${(h.y + ry * 0.38).toFixed(1)} ${(h.x - dir * rx * 0.38).toFixed(1)} ${(h.y + ry * 0.72).toFixed(1)} Z"
            fill="${COLORS.hair}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
    `;
  }

  // Tai gần mặt người xem khi quay đầu mạnh (vẽ đè gọn lên mép tóc mai)
  const nearEarHtml = showNearEarOnSide
    ? `<ellipse cx="${nearEarX.toFixed(1)}" cy="${(earY + 1 * s).toFixed(1)}" rx="${(3.1 * s).toFixed(1)}" ry="${(4.6 * s).toFixed(1)}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.7" />`
    : '';

  return `
    <g>
      ${neckHtml}
      ${backEarsHtml}
      ${profileNoseHtml}
      ${headOvalHtml}
      ${chinHintHtml}
      ${faceFeaturesHtml}
      ${hairHtml}
      ${nearEarHtml}
    </g>
  `;
}

/**
 * Vẽ MŨI TÊN CHUYỂN ĐỘNG NÉT ĐỨT MÀU XANH LAM (CHUẨN SGK CHO NHỊP 8, 9, 10, 11)
 */
function renderSgkArrows(pose, prefix, hipY, shoulderY) {
  if (!appState.showArrows || pose.arrowMode === 'none' || pose.arrowOpacity <= 0.04) {
    return '';
  }

  const op = pose.arrowOpacity.toFixed(2);
  const chestP = project3D({ x: 0, y: shoulderY - 22, z: 25 });
  const waistP = project3D({ x: 0, y: hipY + 26, z: 28 });

  if (pose.arrowMode === 'foldChest') {
    // Hai mũi tên nét đứt cong vào trong dưới khuỷu tay (Nhịp 8 & Nhịp 10)
    const y = chestP.y + 14;
    return `
      <g opacity="${op}">
        <!-- Mũi tên cong bên trái màn hình hướng vào trong -->
        <path d="M 104 ${(y - 8).toFixed(1)} Q 112 ${(y + 14).toFixed(1)} 136 ${(y + 10).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}sgkArr)" class="sgk-arrow-flow" />
        <!-- Mũi tên cong bên phải màn hình hướng vào trong -->
        <path d="M 256 ${(y - 8).toFixed(1)} Q 248 ${(y + 14).toFixed(1)} 224 ${(y + 10).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}sgkArr)" class="sgk-arrow-flow" />
      </g>
    `;
  }

  if (pose.arrowMode === 'twistLeft') {
    // Nhịp 9: mũi tên xoay nét đứt vòng ngang eo hướng sang PHẢI màn hình
    const y = waistP.y;
    return `
      <g opacity="${op}">
        <path d="M 134 ${(y - 5).toFixed(1)} Q 182 ${(y + 16).toFixed(1)} 234 ${(y - 6).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.6" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}sgkArr)" class="sgk-arrow-flow" />
      </g>
    `;
  }

  if (pose.arrowMode === 'twistRight') {
    // Nhịp 11: mũi tên xoay nét đứt vòng ngang eo hướng sang TRÁI màn hình
    const y = waistP.y;
    return `
      <g opacity="${op}">
        <path d="M 226 ${(y - 5).toFixed(1)} Q 178 ${(y + 16).toFixed(1)} 126 ${(y - 6).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.6" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}sgkArr)" class="sgk-arrow-flow" />
      </g>
    `;
  }

  return '';
}

/**
 * Vẽ LỚP PHỦ ĐIỂM KHỚP AI CHẤM (MEDIAPIPE POSE LANDMARKS)
 */
function renderAiLandmarks(joints) {
  if (!appState.showAI) return '';

  const { shL, shR, elL, elR, wrL, wrR, hipL, hipR, knL, knR, anL, anR } = joints;
  const lines = [
    [shL, shR], [hipL, hipR], [shL, hipL], [shR, hipR],
    [shL, elL], [elL, wrL], [shR, elR], [elR, wrR],
    [hipL, knL], [knL, anL], [hipR, knR], [knR, anR],
  ];

  const linesSvg = lines
    .map(([a, b]) => `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${COLORS.aiLine}" stroke-width="2.4" stroke-dasharray="4 3" opacity="0.88" />`)
    .join('');

  const nodes = [
    { p: shL, r: 5 }, { p: shR, r: 5 },
    { p: elL, r: 4.5 }, { p: elR, r: 4.5 },
    { p: wrL, r: 4.5 }, { p: wrR, r: 4.5 },
    { p: hipL, r: 4.5 }, { p: hipR, r: 4.5 },
    { p: knL, r: 4.5 }, { p: knR, r: 4.5 },
    { p: anL, r: 4 }, { p: anR, r: 4 },
  ];

  const nodesSvg = nodes
    .map(({ p, r }) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${COLORS.aiJoint}" stroke="#FFFFFF" stroke-width="1.8" />`)
    .join('');

  return `<g id="ai-landmarks-layer">${linesSvg}${nodesSvg}</g>`;
}

/**
 * HÀM RENDER TOÀN BỘ NHÂN VẬT 2.5D TỪ MỘT TRẠNG THÁI POSE (DÙNG CHUNG CHO 60FPS STAGE, GRID & EXPORT)
 */
function buildCharacterSvgInner(pose, prefix = 'main_') {
  // 1. Tính tọa độ 3D các khớp thân & chân theo kneeBend, stanceWidth, hipYaw
  const hipDrop = pose.kneeBend * 19;
  const kneeForward = pose.kneeBend * 28;
  const hipY = ANATOMY.baseHipY - hipDrop;
  const shoulderY = hipY + ANATOMY.torsoHeight - pose.kneeBend * 3;

  // Độ rộng chân (0 = đứng nghiêm ±11.5, 1 = rộng bằng vai ±31)
  const footHalfX = lerp(11.5, 31, pose.stanceWidth);
  const kneeHalfX = lerp(11.5, 25, pose.stanceWidth);
  const hipHalfX = lerp(11.5, 15.5, pose.stanceWidth);

  // Các điểm chân trái (side = +1) và chân phải (side = -1) xoay theo hipYaw
  const hipL3 = rotateY(hipHalfX, hipY, 0, pose.hipYaw);
  const hipR3 = rotateY(-hipHalfX, hipY, 0, pose.hipYaw);

  const kneeY = ANATOMY.ankleHeight + ANATOMY.shinLen - hipDrop * 0.45;
  const knL3 = rotateY(kneeHalfX, kneeY, kneeForward, pose.hipYaw * 0.72);
  const knR3 = rotateY(-kneeHalfX, kneeY, kneeForward, pose.hipYaw * 0.72);

  // Khi chuyển 7->8 hoặc 11->0, chân trái nhấc nhẹ lên khỏi mặt đất tạo bước chân tự nhiên
  const anL3 = rotateY(footHalfX, ANATOMY.ankleHeight + pose.leftFootLift, 0, pose.hipYaw * 0.35);
  const anR3 = rotateY(-footHalfX, ANATOMY.ankleHeight, 0, pose.hipYaw * 0.35);

  const legL = {
    side: 1,
    hip2D: project3D(hipL3),
    knee2D: project3D(knL3),
    ankle2D: project3D(anL3),
    avgZ: (hipL3.z + knL3.z + anL3.z) / 3,
    stanceWidth: pose.stanceWidth,
    liftOffset: pose.leftFootLift,
  };
  const legR = {
    side: -1,
    hip2D: project3D(hipR3),
    knee2D: project3D(knR3),
    ankle2D: project3D(anR3),
    avgZ: (hipR3.z + knR3.z + anR3.z) / 3,
    stanceWidth: pose.stanceWidth,
    liftOffset: 0,
  };

  // 2. Tính tọa độ 3D hai cánh tay xoay theo armYaw / torsoYaw
  const shL3 = rotateY(ANATOMY.shoulderHalfW, shoulderY, 0, pose.torsoYaw);
  const shR3 = rotateY(-ANATOMY.shoulderHalfW, shoulderY, 0, pose.torsoYaw);

  // Vector cánh tay trên & cẳng tay trong hệ tọa độ nhân vật, sau đó xoay theo armYaw
  const uLRot = rotateY(pose.uL[0], pose.uL[1], pose.uL[2], pose.armYaw);
  const fLRot = rotateY(pose.fL[0], pose.fL[1], pose.fL[2], pose.armYaw);
  const elL3 = { x: shL3.x + uLRot.x, y: shL3.y + uLRot.y, z: shL3.z + uLRot.z };
  const wrL3 = { x: elL3.x + fLRot.x, y: elL3.y + fLRot.y, z: elL3.z + fLRot.z };

  const uRRot = rotateY(-pose.uR[0], pose.uR[1], pose.uR[2], pose.armYaw);
  const fRRot = rotateY(-pose.fR[0], pose.fR[1], pose.fR[2], pose.armYaw);
  const elR3 = { x: shR3.x + uRRot.x, y: shR3.y + uRRot.y, z: shR3.z + uRRot.z };
  const wrR3 = { x: elR3.x + fRRot.x, y: elR3.y + fRRot.y, z: elR3.z + fRRot.z };

  const armL = {
    side: 1,
    shoulder3D: shL3,
    elbow3D: elL3,
    wrist3D: wrL3,
    shoulder2D: project3D(shL3),
    elbow2D: project3D(elL3),
    wrist2D: project3D(wrL3),
  };
  const armR = {
    side: -1,
    shoulder3D: shR3,
    elbow3D: elR3,
    wrist3D: wrR3,
    shoulder2D: project3D(shR3),
    elbow2D: project3D(elR3),
    wrist2D: project3D(wrR3),
  };

  // 3. Thu thập các lớp vẽ theo thuật toán Painter's Z-Sort để chồng lớp 3D chuẩn xác
  const drawQueue = [];

  // Hai chân
  drawQueue.push({ z: legL.avgZ - 2, html: renderLeg(legL, pose.hipYaw) });
  drawQueue.push({ z: legR.avgZ - 2, html: renderLeg(legR, pose.hipYaw) });

  // Thân áo đồng phục (ở mặt phẳng z = 0)
  drawQueue.push({ z: 0, html: renderTorso(pose, hipY, shoulderY) });

  // Đầu & cổ (nằm gọn phía trên cổ áo, z = +1.5)
  drawQueue.push({ z: 1.5, html: renderHead(pose, shoulderY) });

  // Các đoạn cánh tay trái & phải (tự động chui ra sau lưng hoặc vươn lên trước ngực theo Z)
  const armLItems = renderArmSegments(armL, pose.handMode, pose.torsoYaw);
  const armRItems = renderArmSegments(armR, pose.handMode, pose.torsoYaw);
  armLItems.forEach((it) => drawQueue.push(it));
  armRItems.forEach((it) => drawQueue.push(it));

  // Sắp xếp từ xa đến gần (z nhỏ vẽ trước, z lớn vẽ sau)
  drawQueue.sort((a, b) => a.z - b.z);

  // Bóng đổ mềm trên mặt sân co giãn theo độ rộng chân
  const shadowRx = lerp(38, 58, pose.stanceWidth);

  const defsHtml = `
    <defs>
      <marker id="${prefix}sgkArr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
        <path d="M 0 1.4 L 9.2 5 L 0 8.6 z" fill="${COLORS.arrowBlue}" />
      </marker>
      <linearGradient id="${prefix}floorShadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#94A3B8" stop-opacity="0" />
        <stop offset="50%" stop-color="#64748B" stop-opacity="0.24" />
        <stop offset="100%" stop-color="#94A3B8" stop-opacity="0" />
      </linearGradient>
    </defs>
  `;

  const groundHtml = `
    <ellipse cx="180" cy="${ANATOMY.floorY + 1}" rx="${shadowRx.toFixed(1)}" ry="6.5" fill="url(#${prefix}floorShadow)" />
    <line x1="42" y1="${ANATOMY.floorY + 2}" x2="318" y2="${ANATOMY.floorY + 2}" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6 6" stroke-linecap="round" />
  `;

  const arrowsHtml = renderSgkArrows(pose, prefix, hipY, shoulderY);
  const aiHtml = renderAiLandmarks({
    shL: armL.shoulder2D,
    shR: armR.shoulder2D,
    elL: armL.elbow2D,
    elR: armR.elbow2D,
    wrL: armL.wrist2D,
    wrR: armR.wrist2D,
    hipL: legL.hip2D,
    hipR: legR.hip2D,
    knL: legL.knee2D,
    knR: legR.knee2D,
    anL: legL.ankle2D,
    anR: legR.ankle2D,
  });

  return `
    ${defsHtml}
    ${groundHtml}
    ${drawQueue.map((item) => item.html).join('')}
    ${arrowsHtml}
    ${aiHtml}
  `;
}

// Chỉnh cho khớp hình SGK (tools/gemini-src/g6-dang-tay.fix.json)
if (POSES[4]) Object.assign(POSES[4], {"kneeBend":0.8,"headPitch":-0.5,"uL":[-8,-42,12],"fL":[-20,-36,12],"uR":[-8,-42,7],"fR":[-20,-36,6]});
if (POSES[8]) Object.assign(POSES[8], {"stanceWidth":1.5});
if (POSES[9]) Object.assign(POSES[9], {"stanceWidth":1.5});
if (POSES[10]) Object.assign(POSES[10], {"stanceWidth":1.5});
if (POSES[11]) Object.assign(POSES[11], {"stanceWidth":1.5});

export const view = 'front';
export const poses = POSES;
export const sample = (t) => samplePoseAtTime(t);
/** Nội dung bên trong <svg viewBox="0 0 360 390"> của tư thế đã nội suy. */
export function render(pose, opts = {}, prefix = 'f_') {
  if ('ai' in opts) appState.showAI = !!opts.ai;
  if ('arrows' in opts) { appState.showArrows = !!opts.arrows; appState.showXray = !!opts.arrows; }
  return buildCharacterSvgInner(pose, prefix);
}
