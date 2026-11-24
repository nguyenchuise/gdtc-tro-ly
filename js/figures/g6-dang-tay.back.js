// TỰ SINH bởi tools/import-gemini-figure.mjs — đừng sửa tay, sửa tệp Gemini rồi chạy lại công cụ.
// Bài: g6-dang-tay — Bài thể dục liên hoàn (từ nhịp 1 đến nhịp 11)
// Góc nhìn: PHÍA SAU (em đứng sau bạn mẫu, tập cùng chiều)
// Nguồn: hình người vector 2.5D thầy cô dựng bằng Gemini (g6-dang-tay.back.html).
/* eslint-disable */
const appState = { showAI: true, showArrows: true, showXray: true };
const HORIZON_Y = 175; // tâm phối cảnh ngang ngực (đơn vị hình, tính từ mặt sàn)
const escapeXml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * BẢNG MÀU CHUẨN ĐỒNG PHỤC GDTC THCS (Bộ sách Kết nối tri thức)
 */
const COLORS = {
  outline: '#1E293B',      // Viền nét mảnh gọn gàng chuẩn tranh minh họa SGK
  hair: '#2B303A',         // Tóc ngắn đen than phủ gọn sau gáy
  hairHi: '#475569',       // Ánh tóc nhẹ
  skin: '#F7CAA6',         // Da sáng ấm (gáy cổ, tai, tay)
  skinShade: '#E4AE85',    // Bóng da cổ & nếp gấp
  collarBlue: '#1868B7',   // Cổ áo bẻ & viền ống tay xanh dương
  shirtWhite: '#FFFFFF',   // Vai, lưng trên & tay áo ngắn trắng
  shirtYellow: '#FFEB00',  // Thân áo dưới vàng tươi
  shirtYellowShade: '#E5CE00',
  pantsBlue: '#146BC0',    // Quần dài thể dục xanh dương
  pantsCrease: '#0C4A8A',  // Nếp gấp khoeo gối sau (Nhịp 4)
  stripeWhite: '#FFFFFF',  // Dải sọc trắng dọc má ngoài quần
  sockYellow: '#FACC15',   // Cổ tất vàng
  shoeOrange: '#E8741E',   // Giày thể thao màu cam
  shoeHeelDark: '#C95E10', // Bóng gót giày nhìn từ sau
  soleWhite: '#FFFFFF',    // Đế cao su trắng
  arrowBlue: '#0284C7',    // Mũi tên nét đứt SGK
  xrayStroke: '#0284C7',   // Nét đứt X-quang tay trước thân
  aiLine: '#10B981',       // Đường khung xương AI Pose
  aiJoint: '#F97316',      // Chấm khớp AI Pose
};

/**
 * HỆ TỌA ĐỘ 3D GÓC NHÌN TỪ PHÍA SAU NGƯỜI TẬP (REAR VIEW):
 *   - +X: sang PHẢI màn hình = bên PHẢI của nhân vật (side = +1)
 *   - -X: sang TRÁI màn hình = bên TRÁI của nhân vật (side = -1)
 *   - +Y: hướng LÊN TRÊN từ mặt sân (y = 0 là sàn)
 *   - +Z: hướng VỀ PHÍA CAMERA (phía sau lưng người tập -> vẽ ĐÈ LÊN TRƯỚC)
 *   - -Z: hướng ĐI XA CAMERA (phía trước ngực người tập -> vẽ KHUẤT PHÍA SAU LƯNG)
 */
const RIG = {
  cx: 180,
  floorY: 356,
  focal: 620,
  shoulderHalfW: 23.5,
  upperArmLen: 44,
  forearmLen: 42,
  thighLen: 60,
  shinLen: 58,
  ankleHeight: 16,
  baseHipY: 134,
  torsoHeight: 77,
  headOffsetY: 32,
};

/**
 * ĐẦY ĐỦ 12 TƯ THẾ CHUẨN SGK (TTCB & NHỊP 1–11) — GÓC NHÌN PHÍA SAU
 * Quy ước vector cánh tay địa phương [out, up, fwd]:
 *   - out > 0: dang ra ngoài khỏi thân (tay Trái đi về -X, tay Phải đi về +X)
 *   - out < 0: khép vào phía trục giữa thân
 *   - up  > 0: giơ lên trên (+Y), up < 0: hạ xuống dưới (-Y)
 *   - fwd > 0: đưa ra PHÍA TRƯỚC ngực (-Z, đi xa camera -> khuất sau thân!)
 *   - fwd < 0: đưa về PHÍA SAU lưng (+Z, gần camera)
 * Quy ước xoay Yaw quanh trục Y:
 *   - yaw < 0: xoay người sang TRÁI màn hình (Nhịp 9: tay Trái gần camera +Z, tay Phải xa camera -Z)
 *   - yaw > 0: xoay người sang PHẢI màn hình (Nhịp 11: tay Phải gần camera +Z, tay Trái xa camera -Z)
 */
const POSES = [
  {
    index: 0,
    id: 'ttcb',
    filename: 'gdtc-sau-ttcb.svg',
    code: 'TTCB',
    shortTitle: 'Đứng nghiêm',
    caption: 'TTCB. Đứng nghiêm.',
    rearTip: 'Đứng quay lưng thẳng, hai gót chân chạm nhau, hai tay xuôi thẳng sát hai bên đùi.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [4.5, -43.5, 1.5],
    fL: [-2.2, -41.8, 2],
    uR: [4.5, -43.5, 1.5],
    fR: [-2.2, -41.8, 2],
    handMode: 'neutral',
    arrowMode: 'none',
    hasFrontOcclusion: false,
    angleRef: 'Vai 0° • Gối 180°',
  },
  {
    index: 1,
    id: 'nhip-1',
    filename: 'gdtc-sau-nhip-1.svg',
    code: 'Nhịp 1',
    shortTitle: 'Tay đưa ra trước',
    caption: 'Nhịp 1. Hai tay đưa ra trước, lòng bàn tay hướng vào nhau, mắt nhìn theo tay.',
    rearTip: 'Nhìn từ sau: hai tay duỗi thẳng về phía trước (khuất phần lớn trước thân). Bật X-quang để thấy rõ đường tay duỗi thẳng.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    // Hơi mở 5px ra hai bên vai để thấy nhẹ mép tay thu nhỏ phối cảnh phía trước vai
    uL: [5.5, -1, 43.5],
    fL: [-2, 0.5, 42],
    uR: [5.5, -1, 43.5],
    fR: [-2, 0.5, 42],
    handMode: 'inwardFront',
    arrowMode: 'none',
    hasFrontOcclusion: true,
    angleRef: 'Vai trước ~90° • Khuỷu 180°',
  },
  {
    index: 2,
    id: 'nhip-2',
    filename: 'gdtc-sau-nhip-2.svg',
    code: 'Nhịp 2',
    shortTitle: 'Tay đưa lên cao',
    caption: 'Nhịp 2. Hai tay đưa lên cao, tay thẳng, lòng bàn tay hướng vào nhau, mắt nhìn theo tay.',
    rearTip: 'Hai cánh tay giơ thẳng song song lên cao, lòng bàn tay hướng vào nhau (ngón cái hướng về phía sau), đầu ngửa lên.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0.95,
    uL: [-2.2, 43.9, 1],
    fL: [-0.5, 42, 0],
    uR: [-2.2, 43.9, 1],
    fR: [-0.5, 42, 0],
    handMode: 'inwardUp',
    arrowMode: 'none',
    hasFrontOcclusion: false,
    angleRef: 'Vai 180° • Đầu ngửa',
  },
  {
    index: 3,
    id: 'nhip-3',
    filename: 'gdtc-sau-nhip-3.svg',
    code: 'Nhịp 3',
    shortTitle: 'Tay dang ngang (sấp)',
    caption: 'Nhịp 3. Hai tay dang ngang, lòng bàn tay sấp, đầu thẳng, mắt nhìn phía trước.',
    rearTip: 'Hai tay dang thẳng ngang vai thành hình chữ T, lòng bàn tay úp xuống mặt sân, giữ thẳng lưng và đầu.',
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
    hasFrontOcclusion: false,
    angleRef: 'Vai 90° • Bàn tay sấp',
  },
  {
    index: 4,
    id: 'nhip-4',
    filename: 'gdtc-sau-nhip-4.svg',
    code: 'Nhịp 4',
    shortTitle: 'Khuỵu gối, tay chéo',
    caption: 'Nhịp 4. Khuỵu gối, hai tay hạ chéo trước bụng (tay trái trước, tay phải sau), đầu cúi, mắt nhìn theo tay.',
    rearTip: 'Gối khuỵu hạ thấp trọng tâm, đầu cúi lộ rõ phần gáy; xem khung hình phụ bên phải để nhìn rõ độ khuỵu gối và hai tay bắt chéo trước bụng.',
    stanceWidth: 0,
    kneeBend: 0.66,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: -0.95,
    // Hai khuỷu tay hơi mở nhẹ hai bên hông rồi cẳng tay đưa ra phía trước bắt chéo (tay trái trước hơn tay phải)
    uL: [7.5, -39.5, 16],
    fL: [-31, -24, 18],
    uR: [7.5, -39.5, 11],
    fR: [-31, -24, 10],
    handMode: 'crossed',
    arrowMode: 'none',
    hasFrontOcclusion: true,
    angleRef: 'Gối khuỵu ~135° • Đầu cúi',
  },
  {
    index: 5,
    id: 'nhip-5',
    filename: 'gdtc-sau-nhip-5.svg',
    code: 'Nhịp 5',
    shortTitle: 'Tay lên cao chữ V',
    caption: 'Nhịp 5. Duỗi thẳng khớp gối, hai tay đưa sang ngang, lên cao chếch hình chữ V, lòng bàn tay hướng vào nhau, đầu ngửa, mắt nhìn theo tay.',
    rearTip: 'Đứng thẳng hai gối, mở hai tay lên cao chếch hình chữ V rộng (~145°), đầu ngửa nhẹ về sau.',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0.88,
    uL: [17, 40.5, 1],
    fL: [16, 38.8, 0.5],
    uR: [17, 40.5, 1],
    fR: [16, 38.8, 0.5],
    handMode: 'inwardV',
    arrowMode: 'none',
    hasFrontOcclusion: false,
    angleRef: 'Vai chữ V ~145° • Gối 180°',
  },
  {
    index: 6,
    id: 'nhip-6',
    filename: 'gdtc-sau-nhip-6.svg',
    code: 'Nhịp 6',
    shortTitle: 'Tay chạm mỏm vai',
    caption: 'Nhịp 6. Hai cánh tay hạ ngang vai, các đầu ngón tay chạm mỏm vai, đầu thẳng, mắt nhìn phía trước.',
    rearTip: 'Cánh tay trên giữ ngang vai, gập gọn khuỷu tay để các đầu ngón tay đặt đúng lên hai mỏm vai (rất rõ từ phía sau).',
    stanceWidth: 0,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [37, -11, -3],
    fL: [-24, 26, -4],
    uR: [37, -11, -3],
    fR: [-24, 26, -4],
    handMode: 'shoulderTouch',
    arrowMode: 'none',
    hasFrontOcclusion: false,
    angleRef: 'Khuỷu gập ~45° • Chạm vai',
  },
  {
    index: 7,
    id: 'nhip-7',
    filename: 'gdtc-sau-nhip-7.svg',
    code: 'Nhịp 7',
    shortTitle: 'Tay dang ngang (ngửa)',
    caption: 'Nhịp 7. Hai tay dang ngang, lòng bàn tay ngửa, đầu thẳng, mắt nhìn phía trước.',
    rearTip: 'Duỗi thẳng hai tay dang ngang vai, xoay ngửa lòng bàn tay hướng lên trời (khác Nhịp 3 lòng bàn tay sấp).',
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
    hasFrontOcclusion: false,
    angleRef: 'Vai 90° • Lòng tay ngửa',
  },
  {
    index: 8,
    id: 'nhip-8',
    filename: 'gdtc-sau-nhip-8.svg',
    code: 'Nhịp 8',
    shortTitle: 'Bước trái, gập trước ngực',
    caption: 'Nhịp 8. Chân trái bước sang ngang rộng bằng vai, cẳng tay gập trước ngực, lòng bàn tay sấp.',
    rearTip: 'Chân TRÁI (bên TRÁI màn hình) bước sang ngang rộng bằng vai; gập hai cẳng tay ngang trước ngực, lòng bàn tay sấp.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [36, -3, 15],
    fL: [-43, 3, 14],
    uR: [36, -3, 15],
    fR: [-43, 3, 14],
    handMode: 'palmDownChest',
    arrowMode: 'stepLeftAndFold',
    hasFrontOcclusion: true,
    angleRef: 'Bước trái • Gập trước ngực',
  },
  {
    index: 9,
    id: 'nhip-9',
    filename: 'gdtc-sau-nhip-9.svg',
    code: 'Nhịp 9',
    shortTitle: 'Xoay người sang trái',
    caption: 'Nhịp 9. Hai tay dang ngang, lòng bàn tay ngửa, xoay người sang trái.',
    rearTip: 'Giữ vững hai bàn chân, vặn thân & quay đầu ~80° sang BÊN TRÁI màn hình: tay Trái đưa gần về phía sau, tay Phải vươn ra xa phía trước.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: -26,
    torsoYaw: -78,
    armYaw: -74,
    headYaw: -82,
    headPitch: 0,
    // Dang thẳng ngang theo trục vai đã xoay -74° sang Trái (hơi mở nhẹ để nhìn rõ phối cảnh 2 tay)
    uL: [43.5, 0, -5],
    fL: [41.5, 0, -4],
    uR: [43.5, 0, 5],
    fR: [41.5, 0, 4],
    handMode: 'palmUp',
    arrowMode: 'twistLeft',
    hasFrontOcclusion: false,
    angleRef: 'Xoay Trái ~80° • Lòng tay ngửa',
  },
  {
    index: 10,
    id: 'nhip-10',
    filename: 'gdtc-sau-nhip-10.svg',
    code: 'Nhịp 10',
    shortTitle: 'Trở về nhịp 8',
    caption: 'Nhịp 10. Trở về nhịp 8.',
    rearTip: 'Xoay thân trên trở về quay lưng thẳng với màn hình, giữ chân đứng rộng bằng vai, gập hai cẳng tay trước ngực (lòng bàn tay sấp).',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: 0,
    torsoYaw: 0,
    armYaw: 0,
    headYaw: 0,
    headPitch: 0,
    uL: [36, -3, 15],
    fL: [-43, 3, 14],
    uR: [36, -3, 15],
    fR: [-43, 3, 14],
    handMode: 'palmDownChest',
    arrowMode: 'foldChest',
    hasFrontOcclusion: true,
    angleRef: 'Về chính diện • Gập trước ngực',
  },
  {
    index: 11,
    id: 'nhip-11',
    filename: 'gdtc-sau-nhip-11.svg',
    code: 'Nhịp 11',
    shortTitle: 'Xoay người sang phải',
    caption: 'Nhịp 11. Hai tay dang ngang, lòng bàn tay ngửa, xoay người sang phải.',
    rearTip: 'Đối xứng Nhịp 9: vặn thân & quay đầu ~80° sang BÊN PHẢI màn hình, tay Phải xoay gần về phía sau, tay Trái vươn ra xa phía trước.',
    stanceWidth: 1,
    kneeBend: 0,
    hipYaw: 26,
    torsoYaw: 78,
    armYaw: 74,
    headYaw: 82,
    headPitch: 0,
    uL: [43.5, 0, 5],
    fL: [41.5, 0, 4],
    uR: [43.5, 0, -5],
    fR: [41.5, 0, -4],
    handMode: 'palmUp',
    arrowMode: 'twistRight',
    hasFrontOcclusion: false,
    angleRef: 'Xoay Phải ~80° • Lòng tay ngửa',
  },
];


/* =========================================================================
   TOÁN HỌC 3D GÓC NHÌN SAU, PHÉP CHIẾU PHỐI CẢNH & NỘI SUY 60FPS
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

function normalizeToLength(v, targetLen) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  const scale = targetLen / len;
  return [v[0] * scale, v[1] * scale, v[2] * scale];
}

/**
 * Xoay tọa độ (x, y, z) quanh trục thẳng đứng Y theo góc yawDeg (góc nhìn từ sau):
 *   - yawDeg < 0: xoay sang TRÁI (-X) -> bên Trái (-X) đi về +Z (GẦN camera), bên Phải (+X) đi về -Z (XA camera)
 *   - yawDeg > 0: xoay sang PHẢI (+X) -> bên Phải (+X) đi về +Z (GẦN camera), bên Trái (-X) đi về -Z (XA camera)
 */
function rotateRearY(x, y, z, yawDeg) {
  const rad = (yawDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {
    x: x * c - z * s,
    y: y,
    z: x * s + z * c,
  };
}

/**
 * Phép chiếu phối cảnh 2.5D (z > 0 gần camera -> to hơn; z < 0 xa camera -> nhỏ hơn)
 */
function project3D(p, cxOverride = RIG.cx) {
  const s = RIG.focal / (RIG.focal - p.z);
  return {
    x: cxOverride + p.x * s,
    y: RIG.floorY - (HORIZON_Y + (p.y - HORIZON_Y) * s),
    z: p.z,
    s: s,
  };
}

/**
 * Nội suy trạng thái khung xương tại bất kỳ mốc thời gian thực nào (0.0 -> 12.0)
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

  const arc = Math.sin(Math.PI * t);

  // Nhịp 4 -> Nhịp 5: "hai tay đưa sang ngang, lên cao chếch hình chữ V"
  if (idxA === 4 && idxB === 5) {
    uL[0] += arc * 26;
    fL[0] += arc * 34;
    uR[0] += arc * 26;
    fR[0] += arc * 34;
  }

  // Nhịp 3 -> Nhịp 4: hạ tay vòng nhẹ ra ngoài rồi khép về phía trước bụng
  if (idxA === 3 && idxB === 4) {
    uL[0] += arc * 10;
    uL[2] += arc * 8;
    uR[0] += arc * 10;
    uR[2] += arc * 5;
  }

  // Nhịp 1 -> Nhịp 2: giữ vòng cung tay đưa lên từ phía trước
  if (idxA === 1 && idxB === 2) {
    uL[2] += arc * 14;
    fL[2] += arc * 14;
    uR[2] += arc * 14;
    fR[2] += arc * 14;
  }

  // Nhịp 8 <-> 9 <-> 10 <-> 11: vươn cẳng tay ra trước nhẹ khi đóng/mở để không cắt ngang thân
  if ((idxA === 8 && idxB === 9) || (idxA === 9 && idxB === 10) || (idxA === 10 && idxB === 11)) {
    fL[2] += arc * 12;
    fR[2] += arc * 12;
  }

  // Nhấc nhẹ chân TRÁI (bên trái màn hình) khi bước sang trái ở 7->8 và thu về ở 11->0
  let leftFootLift = 0;
  if ((idxA === 7 && idxB === 8) || (idxA === 11 && idxB === 0)) {
    leftFootLift = Math.sin(Math.PI * rawT) * 14;
  }

  // Độ dài xương chuẩn
  const isNear6 = (idxA === 6 && rawT < 0.5) || (idxB === 6 && rawT >= 0.5);
  const uLen = isNear6 ? lerp(RIG.upperArmLen, 40, 0.5) : RIG.upperArmLen;
  const fLen = isNear6 ? lerp(RIG.forearmLen, 38, 0.5) : RIG.forearmLen;

  uL = normalizeToLength(uL, uLen);
  fL = normalizeToLength(fL, fLen);
  uR = normalizeToLength(uR, uLen);
  fR = normalizeToLength(fR, fLen);

  // Tính độ mờ hiện khung phụ góc nghiêng riêng cho Nhịp 4 (mượt mà khi vào/ra Nhịp 4)
  const distFrom4 = Math.abs(wrapped - 4);
  const inset4Alpha = distFrom4 < 0.45 ? Math.max(0, 1 - distFrom4 / 0.45) : 0;

  // Mũi tên chuyển động SGK (Nhịp 8, 9, 10, 11)
  let arrowMode = 'none';
  let arrowOpacity = 0;
  if (A.arrowMode !== 'none' && rawT < 0.36) {
    arrowMode = A.arrowMode;
    arrowOpacity = 1 - rawT / 0.36;
  } else if (B.arrowMode !== 'none' && (1 - rawT) < 0.36) {
    arrowMode = B.arrowMode;
    arrowOpacity = 1 - (1 - rawT) / 0.36;
  }

  const nearestIdx = rawT < 0.5 ? idxA : idxB;
  const handMode = rawT < 0.5 ? A.handMode : B.handMode;

  return {
    nearestIdx,
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
    inset4Alpha,
    handMode,
    arrowMode,
    arrowOpacity,
  };
}

/* =========================================================================
   BỘ VẼ VECTOR SVG 2.5D GÓC NHÌN PHÍA SAU (ĐỒNG PHỤC SÁT SGK)
   ========================================================================= */

function buildCapsulePath(p1, p2, r1, r2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 1.8) {
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
  };
}

/**
 * Vẽ GIÀY THỂ THAO CAM (#E8741E) + TẤT VÀNG (#FACC15) NHÌN TỪ PHÍA SAU (GÓT GIÀY & ĐẾ TRẮNG)
 * side = -1 (chân TRÁI ở bên trái màn hình), side = +1 (chân PHẢI ở bên phải màn hình)
 */
function renderRearFootAndShoe(ankle2D, side, hipYaw, stanceWidth) {
  const s = ankle2D.s;
  const ax = ankle2D.x;
  const ay = ankle2D.y;
  const groundY = ay + 15.2 * s;

  // Mũi giày hướng về phía trước (xa camera), hơi chếch nhẹ chữ V ra ngoài và theo hướng xoay hông
  const yawRad = (hipYaw * Math.PI) / 180;
  const toePeek = side * (0.32 + stanceWidth * 0.14) + Math.sin(yawRad) * 0.78;

  // Cổ tất màu vàng (#FACC15)
  const sockHtml = `
    <rect x="${(ax - 5.2 * s).toFixed(1)}" y="${(ay - 2 * s).toFixed(1)}"
          width="${(10.4 * s).toFixed(1)}" height="${(7.2 * s).toFixed(1)}"
          rx="${(2 * s).toFixed(1)}"
          fill="${COLORS.sockYellow}" stroke="${COLORS.outline}" stroke-width="1.6" />
  `;

  // Phần mũi giày thò nhẹ ra phía trước/mép ngoài (vẽ phía sau gót giày)
  const toeEdgeX = ax + toePeek * 15.5 * s;
  const toeBackHtml = `
    <path d="M ${(ax - 5.5 * s).toFixed(1)} ${(ay + 5.5 * s).toFixed(1)}
             L ${(ax + 5.5 * s).toFixed(1)} ${(ay + 5.5 * s).toFixed(1)}
             Q ${(toeEdgeX + Math.sign(toePeek || side) * 5 * s).toFixed(1)} ${(groundY - 5 * s).toFixed(1)} ${toeEdgeX.toFixed(1)} ${(groundY - 1 * s).toFixed(1)}
             L ${ax.toFixed(1)} ${(groundY - 1 * s).toFixed(1)} Z"
          fill="${COLORS.shoeHeelDark}" stroke="${COLORS.outline}" stroke-width="1.7" stroke-linejoin="round" />
  `;

  // Gót giày tròn nổi bật nhìn từ phía sau (vẽ đè trước)
  const heelL = ax - 7.2 * s;
  const heelR = ax + 7.2 * s;
  const minX = Math.min(heelL, toeEdgeX - 4.5 * s);
  const maxX = Math.max(heelR, toeEdgeX + 4.5 * s);

  const heelCounterHtml = `
    <!-- Cổ giày & thân gót màu cam -->
    <path d="M ${(ax - 6.2 * s).toFixed(1)} ${(ay + 3.5 * s).toFixed(1)}
             Q ${ax.toFixed(1)} ${(ay + 6.2 * s).toFixed(1)} ${(ax + 6.2 * s).toFixed(1)} ${(ay + 3.5 * s).toFixed(1)}
             L ${(heelR + 0.8 * s).toFixed(1)} ${(groundY - 3.2 * s).toFixed(1)}
             Q ${ax.toFixed(1)} ${(groundY - 1.5 * s).toFixed(1)} ${(heelL - 0.8 * s).toFixed(1)} ${(groundY - 3.2 * s).toFixed(1)} Z"
          fill="${COLORS.shoeOrange}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
    <!-- Quai xỏ gót & đường may đối xứng mặt sau giày -->
    <rect x="${(ax - 1.8 * s).toFixed(1)}" y="${(ay + 4.8 * s).toFixed(1)}"
          width="${(3.6 * s).toFixed(1)}" height="${(6.5 * s).toFixed(1)}" rx="1.2"
          fill="${COLORS.shoeHeelDark}" opacity="0.65" />
    <!-- Đế cao su trắng dày êm ái -->
    <path d="M ${minX.toFixed(1)} ${(groundY - 3.2 * s).toFixed(1)}
             L ${maxX.toFixed(1)} ${(groundY - 3.2 * s).toFixed(1)}
             L ${(maxX - 0.8 * s).toFixed(1)} ${(groundY + 1.2 * s).toFixed(1)}
             L ${(minX + 0.8 * s).toFixed(1)} ${(groundY + 1.2 * s).toFixed(1)} Z"
          fill="${COLORS.soleWhite}" stroke="${COLORS.outline}" stroke-width="1.5" stroke-linejoin="round" />
  `;

  return `<g>${sockHtml}${toeBackHtml}${heelCounterHtml}</g>`;
}

/**
 * Vẽ MỘT CHÂN QUẦN THỂ DỤC XANH DƯƠNG (#146BC0) NHÌN TỪ SAU + SỌC TRẮNG MÁ NGOÀI + NẾP KHOEO GỐI
 * side = -1 (chân TRÁI ở bên trái màn hình), side = +1 (chân PHẢI ở bên phải màn hình)
 */
function renderRearLeg(legData, hipYaw, kneeBend) {
  const { hip2D, knee2D, ankle2D, side, stanceWidth } = legData;
  const rHip = 10.6 * hip2D.s;
  const rKnee = 9.0 * knee2D.s;
  const rAnkle = 7.4 * ankle2D.s;

  const thighQuad = buildQuadTube(hip2D, knee2D, rHip, rKnee);
  const shinQuad = buildQuadTube(knee2D, ankle2D, rKnee * 0.98, rAnkle);

  // Dải sọc trắng chạy dọc má ngoài ống quần (trượt mượt theo hipYaw)
  // Ở góc nhìn sau: má ngoài chân Trái nằm ở (-1, 0), má ngoài chân Phải nằm ở (+1, 0)
  // Sau khi xoay rotateRearY theo hipYaw: tọa độ x mới = side * cos(yaw), z mới = side * sin(yaw)
  const yawRad = (hipYaw * Math.PI) / 180;
  const stripeLateral = side * Math.cos(yawRad);
  const stripeZ = side * Math.sin(yawRad);
  const stripeVisible = stripeZ > -0.78;

  const tLen = Math.hypot(knee2D.x - hip2D.x, knee2D.y - hip2D.y) || 1;
  const sLen = Math.hypot(ankle2D.x - knee2D.x, ankle2D.y - knee2D.y) || 1;
  // Vector hướng sang +X màn hình vuông góc trục chân hướng xuống
  const tRightX = (knee2D.y - hip2D.y) / tLen;
  const tRightY = -(knee2D.x - hip2D.x) / tLen;
  const sRightX = (ankle2D.y - knee2D.y) / sLen;
  const sRightY = -(ankle2D.x - knee2D.x) / sLen;

  const offsetRatio = stripeLateral * 0.80;
  const st1x = hip2D.x + tRightX * rHip * offsetRatio;
  const st1y = hip2D.y + tRightY * rHip * offsetRatio;
  const st2x = knee2D.x + ((tRightX + sRightX) * 0.5) * rKnee * offsetRatio;
  const st2y = knee2D.y + ((tRightY + sRightY) * 0.5) * rKnee * offsetRatio;
  const st3x = ankle2D.x + sRightX * rAnkle * offsetRatio;
  const st3y = ankle2D.y + sRightY * rAnkle * offsetRatio;

  const stripeHtml = stripeVisible
    ? `<polyline points="${st1x.toFixed(1)},${st1y.toFixed(1)} ${st2x.toFixed(1)},${st2y.toFixed(1)} ${st3x.toFixed(1)},${st3y.toFixed(1)}"
                 fill="none" stroke="${COLORS.stripeWhite}" stroke-width="${(2.7 * knee2D.s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.96" />`
    : '';

  // Nếp gấp khoeo chân phía sau đầu gối hiện rõ khi khuỵu gối ở Nhịp 4!
  let creaseHtml = '';
  if (kneeBend > 0.12) {
    const op = Math.min(0.95, kneeBend * 1.4).toFixed(2);
    creaseHtml = `
      <g opacity="${op}">
        <path d="M ${(knee2D.x - rKnee * 0.72).toFixed(1)} ${(knee2D.y - 1.5).toFixed(1)}
                 Q ${knee2D.x.toFixed(1)} ${(knee2D.y + 4.2 * kneeBend).toFixed(1)} ${(knee2D.x + rKnee * 0.72).toFixed(1)} ${(knee2D.y - 1.5).toFixed(1)}"
              fill="none" stroke="${COLORS.pantsCrease}" stroke-width="2.2" stroke-linecap="round" />
        <path d="M ${(knee2D.x - rKnee * 0.55).toFixed(1)} ${(knee2D.y + 4.5).toFixed(1)}
                 Q ${knee2D.x.toFixed(1)} ${(knee2D.y + 7.5 * kneeBend).toFixed(1)} ${(knee2D.x + rKnee * 0.55).toFixed(1)} ${(knee2D.y + 4.5).toFixed(1)}"
              fill="none" stroke="${COLORS.pantsCrease}" stroke-width="1.6" stroke-linecap="round" opacity="0.75" />
      </g>
    `;
  }

  const shoeHtml = renderRearFootAndShoe(ankle2D, side, hipYaw, stanceWidth);

  return `
    <g>
      ${shoeHtml}
      <path d="${thighQuad.path}" fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <path d="${shinQuad.path}" fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <circle cx="${knee2D.x.toFixed(1)}" cy="${knee2D.y.toFixed(1)}" r="${(rKnee - 0.8).toFixed(1)}" fill="${COLORS.pantsBlue}" />
      <path d="${shinQuad.cuffLine}" stroke="${COLORS.outline}" stroke-width="2" stroke-linecap="round" />
      ${stripeHtml}
      ${creaseHtml}
    </g>
  `;
}

/**
 * Vẽ BÀN TAY CHUẨN HƯỚNG LÒNG BÀN TAY NHÌN TỪ PHÍA SAU
 * side = -1 (tay TRÁI bên trái màn hình), side = +1 (tay PHẢI bên phải màn hình)
 */
function renderRearHand(wrist2D, elbow2D, wrist3D, elbow3D, side, handMode, torsoYaw, isXray = false) {
  const s = wrist2D.s;
  const dx = wrist2D.x - elbow2D.x;
  const dy = wrist2D.y - elbow2D.y;
  const dist2D = Math.hypot(dx, dy);
  const angleDeg = dist2D > 1.5 ? (Math.atan2(dy, dx) * 180) / Math.PI : (side > 0 ? 0 : 180);

  const fillCol = isXray ? 'rgba(2, 132, 199, 0.14)' : COLORS.skin;
  const strokeCol = isXray ? COLORS.xrayStroke : COLORS.outline;
  const dashAttr = isXray ? 'stroke-dasharray="3.5 2.5"' : '';

  // 1. Nhịp 1: Hai tay duỗi thẳng về phía trước (đi xa camera, lòng bàn tay hướng vào nhau)
  if (handMode === 'inwardFront' && (elbow3D.z - wrist3D.z) > 16) {
    const inward = -side;
    return `
      <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) scale(${s.toFixed(3)})">
        <path d="M ${(inward * -5).toFixed(1)} -6.5
                 Q ${(inward * 1).toFixed(1)} -11 ${(inward * 5).toFixed(1)} -6.5
                 L ${(inward * 5.8).toFixed(1)} 5.5
                 Q ${(inward * 4.5).toFixed(1)} 9 ${(inward * -1).toFixed(1)} 8.5
                 Q ${(inward * -6).toFixed(1)} 7.5 ${(inward * -6).toFixed(1)} 1 Z"
              fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.7" ${dashAttr} stroke-linejoin="round" />
      </g>
    `;
  }

  // 2. Nhịp 6: Các đầu ngón tay cong nhẹ chạm lên mỏm vai (rất rõ từ phía sau)
  if (handMode === 'shoulderTouch') {
    const inward = -side;
    return `
      <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) scale(${s.toFixed(3)})">
        <path d="M 0 -3.5
                 Q ${(inward * 8.5).toFixed(1)} -7 ${(inward * 13.5).toFixed(1)} 2.5
                 Q ${(inward * 14.5).toFixed(1)} 8.2 ${(inward * 10.5).toFixed(1)} 9
                 Q ${(inward * 6.5).toFixed(1)} 7 ${(inward * 5).toFixed(1)} 2.5
                 L 0 3.5 Z"
              fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.8" ${dashAttr} stroke-linejoin="round" />
        ${!isXray ? `<line x1="${(inward * 8.2).toFixed(1)}" y1="2.2" x2="${(inward * 10.8).toFixed(1)}" y2="6.5" stroke="${COLORS.skinShade}" stroke-width="1.2" stroke-linecap="round" />` : ''}
      </g>
    `;
  }

  // 3. Nhịp 7, 9, 11: Lòng bàn tay NGỬA LÊN TRÊN rõ rệt (phân biệt ngay với Nhịp 3 sấp)
  if (handMode === 'palmUp') {
    // Lưu ý: khi angleDeg ~ 180° (tay trái chỉ sang trái màn hình), trục +Y cục bộ hướng LÊN TRÊN màn hình!
    // Khi angleDeg ~ 0° (tay phải chỉ sang phải màn hình), trục -Y cục bộ hướng LÊN TRÊN màn hình!
    // Nên hướng LÊN TRÊN màn hình trong hệ tọa độ bàn tay là localUpY = -side
    const upDir = -side;
    return `
      <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) rotate(${angleDeg.toFixed(1)}) scale(${s.toFixed(3)})">
        <!-- Bàn tay lật ngửa lòng hướng lên trên, đầu ngón hơi khum mở lên -->
        <path d="M -1.5 ${(-3.2 * upDir).toFixed(1)}
                 L 13.5 ${(-2.0 * upDir).toFixed(1)}
                 Q 17.8 ${(2.2 * upDir).toFixed(1)} 14.2 ${(4.6 * upDir).toFixed(1)}
                 L 4.5 ${(4.2 * upDir).toFixed(1)}
                 L -1.5 ${(3.8 * upDir).toFixed(1)} Z"
              fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.8" ${dashAttr} stroke-linejoin="round" />
        <!-- Ngón cái nổi bật ở cạnh trên/trước khi ngửa bàn tay -->
        <path d="M 1.5 ${(3.2 * upDir).toFixed(1)} Q 6.5 ${(7.2 * upDir).toFixed(1)} 10.2 ${(3.8 * upDir).toFixed(1)}"
              fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.5" ${dashAttr} stroke-linecap="round" />
        <!-- Nét lòng bàn tay ngửa sáng nhẹ -->
        ${!isXray ? `<line x1="4" y1="${(1.5 * upDir).toFixed(1)}" x2="12.5" y2="${(2.6 * upDir).toFixed(1)}" stroke="${COLORS.skinShade}" stroke-width="1.2" stroke-linecap="round" />` : ''}
      </g>
    `;
  }

  // 4. Các tư thế khác (TTCB, Nhịp 2, 3 sấp, 4 chéo, 5 chữ V, 8/10 gập sấp)
  const upDir = -side;
  let tipBend = 0;
  let thumbY = 4.6 * upDir;

  if (handMode === 'palmDown' || handMode === 'palmDownChest') {
    // Lòng bàn tay SẤP: mu bàn tay phẳng trên, đầu ngón hơi xuôi xuống dưới
    tipBend = -2.2 * upDir;
    thumbY = -4.2 * upDir;
  } else if (handMode === 'inwardUp' || handMode === 'inwardV') {
    // Nhịp 2 & 5 nhìn từ sau: ngón cái hướng về phía người xem, lòng bàn tay hướng vào nhau
    thumbY = 4.5 * side;
  }

  return `
    <g transform="translate(${wrist2D.x.toFixed(1)}, ${wrist2D.y.toFixed(1)}) rotate(${angleDeg.toFixed(1)}) scale(${s.toFixed(3)})">
      <path d="M -1.5 -3.7
               L 13.5 ${(-2.8 + tipBend).toFixed(1)}
               Q 17.5 ${tipBend.toFixed(1)} 13.5 ${(2.8 + tipBend).toFixed(1)}
               L -1.5 3.7 Z"
            fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.8" ${dashAttr} stroke-linejoin="round" />
      <path d="M 1.2 ${(thumbY * 0.45).toFixed(1)} Q 6.2 ${(thumbY * 1.1).toFixed(1)} 9.2 ${(thumbY * 0.55).toFixed(1)}"
            fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.45" ${dashAttr} stroke-linecap="round" />
      ${!isXray ? `<line x1="6.5" y1="${(tipBend * 0.4).toFixed(1)}" x2="14" y2="${(tipBend * 0.85).toFixed(1)}" stroke="${COLORS.skinShade}" stroke-width="1.15" stroke-linecap="round" />` : ''}
    </g>
  `;
}

/**
 * Vẽ MỘT CÁNH TAY NHÌN TỪ SAU + TẠO LỚP X-QUANG NẾU TAY ĐANG KHUẤT PHÍA TRƯỚC THÂN (z < -4)
 */
function renderRearArm(armData, handMode, torsoYaw) {
  const { shoulder2D, elbow2D, wrist2D, shoulder3D, elbow3D, wrist3D, side } = armData;

  const sleeveEnd3D = {
    x: lerp(shoulder3D.x, elbow3D.x, 0.46),
    y: lerp(shoulder3D.y, elbow3D.y, 0.46),
    z: lerp(shoulder3D.z, elbow3D.z, 0.46),
  };
  const sleeveEnd2D = project3D(sleeveEnd3D, armData.cx);

  const rSh = 9.4 * shoulder2D.s;
  const rSleeve = 8.4 * sleeveEnd2D.s;
  const rArmTop = 6.2 * sleeveEnd2D.s;
  const rElbow = 5.5 * elbow2D.s;
  const rWrist = 4.3 * wrist2D.s;

  const sleeveDist = Math.hypot(sleeveEnd2D.x - shoulder2D.x, sleeveEnd2D.y - shoulder2D.y);

  // 1. Tay áo trắng + viền xanh dương (#1868B7)
  let sleeveHtml = '';
  if (sleeveDist < 4) {
    sleeveHtml = `
      <circle cx="${shoulder2D.x.toFixed(1)}" cy="${shoulder2D.y.toFixed(1)}" r="${rSh.toFixed(1)}"
              fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" />
      <circle cx="${sleeveEnd2D.x.toFixed(1)}" cy="${sleeveEnd2D.y.toFixed(1)}" r="${rSleeve.toFixed(1)}"
              fill="${COLORS.shirtWhite}" stroke="${COLORS.collarBlue}" stroke-width="2.6" />
    `;
  } else {
    const sQuad = buildQuadTube(shoulder2D, sleeveEnd2D, rSh, rSleeve);
    sleeveHtml = `
      <g>
        <circle cx="${shoulder2D.x.toFixed(1)}" cy="${shoulder2D.y.toFixed(1)}" r="${rSh.toFixed(1)}"
                fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" />
        <path d="${sQuad.path}" fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
        <circle cx="${shoulder2D.x.toFixed(1)}" cy="${shoulder2D.y.toFixed(1)}" r="${(rSh - 1.1).toFixed(1)}" fill="${COLORS.shirtWhite}" />
        <path d="${sQuad.cuffLine}" stroke="${COLORS.collarBlue}" stroke-width="${(3.2 * sleeveEnd2D.s).toFixed(1)}" stroke-linecap="round" />
        <path d="${sQuad.cuffLine}" stroke="${COLORS.outline}" stroke-width="1.1" stroke-linecap="round" opacity="0.55" />
      </g>
    `;
  }

  // 2. Bắp tay trần (tay áo -> khuỷu)
  const upperBarePath = buildCapsulePath(sleeveEnd2D, elbow2D, rArmTop, rElbow);
  const upperBareHtml = `<path d="${upperBarePath}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />`;

  // 3. Cẳng tay (khuỷu -> cổ tay) + Bàn tay
  const forearmPath = buildCapsulePath(elbow2D, wrist2D, rElbow, rWrist);
  const handHtml = renderRearHand(wrist2D, elbow2D, wrist3D, elbow3D, side, handMode, torsoYaw, false);
  const forearmHtml = `<g><path d="${forearmPath}" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />${handHtml}</g>`;

  // Sắp xếp thứ tự lớp chuẩn theo độ sâu Z (z lớn = gần camera = vẽ sau/đè lên trên)
  const upperAvgZ = (shoulder3D.z + elbow3D.z) * 0.5;
  const forearmAvgZ = (elbow3D.z + wrist3D.z) * 0.5;
  const sleeveCloserThanElbow = shoulder3D.z >= elbow3D.z - 2;

  const upperGroupHtml = sleeveCloserThanElbow
    ? `${upperBareHtml}${sleeveHtml}`
    : `${sleeveHtml}${upperBareHtml}`;

  // Tạo lớp X-quang xuyên thấu nếu cánh tay/cẳng tay đang đi ra phía trước thân (z < -6)
  let xrayHtml = '';
  if (appState.showXray && (forearmAvgZ < -6 || upperAvgZ < -8)) {
    const xrayHand = renderRearHand(wrist2D, elbow2D, wrist3D, elbow3D, side, handMode, torsoYaw, true);
    const xrayUpper = upperAvgZ < -8
      ? `<path d="${upperBarePath}" fill="rgba(2, 132, 199, 0.08)" stroke="${COLORS.xrayStroke}" stroke-width="1.6" stroke-dasharray="4 3" stroke-linejoin="round" />`
      : '';
    const xrayFore = forearmAvgZ < -6
      ? `<path d="${forearmPath}" fill="rgba(2, 132, 199, 0.13)" stroke="${COLORS.xrayStroke}" stroke-width="1.8" stroke-dasharray="4 3" stroke-linejoin="round" />${xrayHand}`
      : '';
    xrayHtml = `<g opacity="0.88">${xrayUpper}${xrayFore}</g>`;
  }

  return {
    layers: [
      { z: upperAvgZ, html: upperGroupHtml },
      { z: forearmAvgZ >= upperAvgZ ? Math.max(forearmAvgZ, upperAvgZ + 0.4) : Math.min(forearmAvgZ, upperAvgZ - 0.4), html: forearmHtml },
    ],
    xrayHtml,
  };
}

/**
 * Vẽ LƯNG ÁO POLO THỂ DỤC 2.5D (NHÌN TỪ PHÍA SAU)
 * - Cổ áo bẻ màu xanh dương (#1868B7) ôm vòng quanh sau gáy
 * - Lưng trên màu trắng (#FFFFFF) có đường may vai sau tinh tế
 * - Lưng dưới màu vàng tươi (#FFEB00)
 * - Khi xoay người (Nhịp 9 / Nhịp 11): cổ áo & nẹp nút lộ nhẹ ở cạnh ngực phía trước
 */
function renderRearTorso(pose, hipY, shoulderY, cx) {
  const yawRad = (pose.torsoYaw * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);

  const rxSh = 23.5, rzSh = 13.0;
  const rxWaist = 21.0, rzWaist = 12.2;
  const wSh = Math.hypot(rxSh * cosY, rzSh * sinY);
  const wWaist = Math.hypot(rxWaist * cosY, rzWaist * sinY);

  const pSh = project3D({ x: 0, y: shoulderY, z: 0 }, cx);
  const pWaist = project3D({ x: 0, y: hipY + 11, z: 0 }, cx);
  const pSplit = project3D({ x: 0, y: lerp(hipY + 11, shoulderY, 0.66), z: 0 }, cx);
  const pHipMid = project3D({ x: 0, y: hipY - 5, z: 0 }, cx);

  const shHalf = wSh * pSh.s;
  const waistHalf = wWaist * pWaist.s;
  const splitHalf = lerp(waistHalf, shHalf, 0.66);

  // Phần hông quần sau (mông & cạp quần)
  const pelvisPath = `
    M ${(pWaist.x - waistHalf * 0.96).toFixed(1)} ${(pWaist.y - 2).toFixed(1)}
    L ${(pWaist.x + waistHalf * 0.96).toFixed(1)} ${(pWaist.y - 2).toFixed(1)}
    L ${(pHipMid.x + waistHalf * 0.98).toFixed(1)} ${(pHipMid.y + 12).toFixed(1)}
    Q ${pHipMid.x.toFixed(1)} ${(pHipMid.y + 18).toFixed(1)} ${(pHipMid.x - waistHalf * 0.98).toFixed(1)} ${(pHipMid.y + 12).toFixed(1)} Z
  `;

  // Mảng áo trên màu TRẮNG (#FFFFFF)
  const topShirtPath = `
    M ${(pSh.x - shHalf).toFixed(1)} ${(pSh.y + 2).toFixed(1)}
    Q ${pSh.x.toFixed(1)} ${(pSh.y - 4.5).toFixed(1)} ${(pSh.x + shHalf).toFixed(1)} ${(pSh.y + 2).toFixed(1)}
    L ${(pSplit.x + splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)}
    Q ${pSplit.x.toFixed(1)} ${(pSplit.y + 3.0 * Math.max(0.25, Math.abs(cosY))).toFixed(1)} ${(pSplit.x - splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)} Z
  `;

  // Mảng áo dưới màu VÀNG TƯƠI (#FFEB00)
  const botShirtPath = `
    M ${(pSplit.x - splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)}
    Q ${pSplit.x.toFixed(1)} ${(pSplit.y + 3.0 * Math.max(0.25, Math.abs(cosY))).toFixed(1)} ${(pSplit.x + splitHalf).toFixed(1)} ${pSplit.y.toFixed(1)}
    L ${(pWaist.x + waistHalf).toFixed(1)} ${(pWaist.y + 1).toFixed(1)}
    Q ${pWaist.x.toFixed(1)} ${(pWaist.y + 6.5).toFixed(1)} ${(pWaist.x - waistHalf).toFixed(1)} ${(pWaist.y + 1).toFixed(1)} Z
  `;

  // Đường may sống lưng / nếp áo sau tinh tế (giúp nhận ra ngay đang nhìn từ phía sau!)
  const spineShiftX = -sinY * (wSh * 0.65) * pSh.s;
  const backSeamHtml = Math.abs(pose.torsoYaw) < 62
    ? `
      <path d="M ${(pSh.x + spineShiftX - shHalf * 0.62).toFixed(1)} ${(pSh.y + 12).toFixed(1)}
               Q ${(pSh.x + spineShiftX).toFixed(1)} ${(pSh.y + 14.5).toFixed(1)} ${(pSh.x + spineShiftX + shHalf * 0.62).toFixed(1)} ${(pSh.y + 12).toFixed(1)}"
            fill="none" stroke="#CBD5E1" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />
      <line x1="${(pHipMid.x + spineShiftX * 0.45).toFixed(1)}" y1="${(pWaist.y + 5).toFixed(1)}"
            x2="${(pHipMid.x + spineShiftX * 0.45).toFixed(1)}" y2="${(pHipMid.y + 15).toFixed(1)}"
            stroke="${COLORS.pantsCrease}" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
    `
    : '';

  // Cổ áo bẻ polo màu xanh dương (#1868B7) ôm vòng quanh sau gáy
  const collarY = pSh.y - 3;
  const collarHalfW = (11.5 * Math.max(0.75, Math.abs(cosY)) + 2.5) * pSh.s;
  const rearCollarHtml = `
    <path d="M ${(pSh.x - collarHalfW).toFixed(1)} ${(collarY + 1.5).toFixed(1)}
             Q ${pSh.x.toFixed(1)} ${(collarY - 5.2).toFixed(1)} ${(pSh.x + collarHalfW).toFixed(1)} ${(collarY + 1.5).toFixed(1)}
             L ${(pSh.x + collarHalfW * 1.12).toFixed(1)} ${(collarY + 8.5).toFixed(1)}
             Q ${pSh.x.toFixed(1)} ${(collarY + 11.2).toFixed(1)} ${(pSh.x - collarHalfW * 1.12).toFixed(1)} ${(collarY + 8.5).toFixed(1)} Z"
          fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.85" stroke-linejoin="round" />
    <!-- Nếp gấp cổ áo polo sau gáy -->
    <path d="M ${(pSh.x - collarHalfW * 0.78).toFixed(1)} ${(collarY + 1.8).toFixed(1)}
             Q ${pSh.x.toFixed(1)} ${(collarY + 4.2).toFixed(1)} ${(pSh.x + collarHalfW * 0.78).toFixed(1)} ${(collarY + 1.8).toFixed(1)}"
          fill="none" stroke="#0F4C8A" stroke-width="1.3" stroke-linecap="round" opacity="0.8" />
  `;

  // Khi xoay thân mạnh (Nhịp 9 & 11), lộ nhẹ mép cổ áo trước ở phía ngực đang quay về hướng xoay
  let sideCollarHint = '';
  if (Math.abs(pose.torsoYaw) > 45) {
    const dir = Math.sign(pose.torsoYaw); // -1 xoay trái, +1 xoay phải
    const chestEdgeX = pSh.x + dir * (shHalf * 0.78);
    sideCollarHint = `
      <path d="M ${(chestEdgeX - dir * 2).toFixed(1)} ${(collarY + 4).toFixed(1)}
               L ${(chestEdgeX + dir * 4.5).toFixed(1)} ${(collarY + 10.5).toFixed(1)}
               L ${(chestEdgeX - dir * 3).toFixed(1)} ${(collarY + 11.5).toFixed(1)} Z"
            fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.6" stroke-linejoin="round" />
    `;
  }

  // Nếp vải nhẹ phần thân vàng
  const foldHtml = `
    <path d="M ${(pWaist.x - waistHalf * 0.58).toFixed(1)} ${(pWaist.y - 10).toFixed(1)} Q ${(pWaist.x - waistHalf * 0.2).toFixed(1)} ${(pWaist.y - 7.5).toFixed(1)} ${(pWaist.x + waistHalf * 0.05).toFixed(1)} ${(pWaist.y - 9.5).toFixed(1)}"
          fill="none" stroke="${COLORS.shirtYellowShade}" stroke-width="1.5" stroke-linecap="round" />
    <path d="M ${(pWaist.x + waistHalf * 0.15).toFixed(1)} ${(pWaist.y - 6).toFixed(1)} Q ${(pWaist.x + waistHalf * 0.45).toFixed(1)} ${(pWaist.y - 4.5).toFixed(1)} ${(pWaist.x + waistHalf * 0.72).toFixed(1)} ${(pWaist.y - 7).toFixed(1)}"
          fill="none" stroke="${COLORS.shirtYellowShade}" stroke-width="1.5" stroke-linecap="round" />
  `;

  return `
    <g>
      <path d="${pelvisPath}" fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
      <path d="${topShirtPath}" fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="2" stroke-linejoin="round" />
      <path d="${botShirtPath}" fill="${COLORS.shirtYellow}" stroke="${COLORS.outline}" stroke-width="2" stroke-linejoin="round" />
      ${foldHtml}
      ${backSeamHtml}
      ${sideCollarHint}
      ${rearCollarHtml}
    </g>
  `;
}

/**
 * Vẽ ĐẦU & GÁY NHÌN TỪ PHÍA SAU (CHUYỂN MƯỢT SANG PROFILE KHI XOAY Ở NHỊP 9 & 11)
 * - yaw = 0: tóc đen than (#2B303A) phủ gọn sau đầu, lộ rõ gáy cổ sáng (#F7CAA6) và 2 vành tai
 * - pitch > 0 (Nhịp 2, 5): ngửa đầu -> gáy thu ngắn, chỏm đầu nghiêng về sau
 * - pitch < 0 (Nhịp 4): cúi đầu -> lộ rõ phần gáy dài, đỉnh đầu cúi về trước
 * - yaw = -82° (Nhịp 9): lộ nửa mặt nghiêng bên TRÁI nhìn sang TRÁI màn hình
 * - yaw = +82° (Nhịp 11): lộ nửa mặt nghiêng bên PHẢI nhìn sang PHẢI màn hình
 */
function renderRearHead(pose, shoulderY, cx) {
  const yawDeg = pose.headYaw;
  const pitch = pose.headPitch; // +1 ngửa lên, -1 cúi xuống
  const absYaw = Math.abs(yawDeg);
  const dir = Math.sign(yawDeg); // -1 = quay Trái (Nhịp 9), +1 = quay Phải (Nhịp 11)

  // Vị trí tâm đầu dịch chuyển tự nhiên khi cúi (đưa ra trước -z, hơi hạ thấp) hoặc ngửa (hơi ngả về sau +z)
  const head3D = {
    x: 0,
    y: shoulderY + RIG.headOffsetY - Math.max(0, -pitch) * 4.2 - Math.max(0, pitch) * 2.2,
    z: pitch * 6.5,
  };
  const neckBase3D = { x: 0, y: shoulderY - 1, z: 0 };

  const h = project3D(head3D, cx);
  const nb = project3D(neckBase3D, cx);
  const s = h.s;

  const rx = 16.4 * s;
  const ry = 18.8 * s;

  // 1. Gáy cổ da sáng (#F7CAA6) — rõ hơn khi cúi đầu (Nhịp 4), thu ngắn khi ngửa (Nhịp 2, 5)
  const neckW = 6.4 * s;
  const neckTopY = h.y + (ry * (pitch < 0 ? 0.35 : 0.62));
  const neckHtml = `
    <path d="M ${(nb.x - neckW).toFixed(1)} ${(nb.y + 3).toFixed(1)}
             L ${(h.x - neckW * 0.92).toFixed(1)} ${neckTopY.toFixed(1)}
             L ${(h.x + neckW * 0.92).toFixed(1)} ${neckTopY.toFixed(1)}
             L ${(nb.x + neckW).toFixed(1)} ${(nb.y + 3).toFixed(1)}
             Q ${nb.x.toFixed(1)} ${(nb.y + 7.5).toFixed(1)} ${(nb.x - neckW).toFixed(1)} ${(nb.y + 3).toFixed(1)} Z"
          fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
    <!-- Nét gân gáy mảnh tinh tế khi nhìn từ sau -->
    ${absYaw < 42 ? `
      <line x1="${(h.x - 2.4 * s).toFixed(1)}" y1="${(neckTopY + 5 * s).toFixed(1)}" x2="${(nb.x - 2.8 * s).toFixed(1)}" y2="${(nb.y - 1 * s).toFixed(1)}"
            stroke="${COLORS.skinShade}" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
      <line x1="${(h.x + 2.4 * s).toFixed(1)}" y1="${(neckTopY + 5 * s).toFixed(1)}" x2="${(nb.x + 2.8 * s).toFixed(1)}" y2="${(nb.y - 1 * s).toFixed(1)}"
            stroke="${COLORS.skinShade}" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
    ` : ''}
  `;

  // 2. Chế độ NHÌN TỪ SAU LƯNG (|yaw| < 42°): Toàn bộ sau đầu là tóc đen than gọn gàng + 2 vành tai hai bên
  if (absYaw < 42) {
    const earY = h.y + (1.5 + pitch * 4.5) * s;
    // Chân tóc sau gáy: khi cúi đầu chân tóc dâng cao lộ rõ gáy cổ; khi ngửa đầu chỏm tóc nghiêng che thấp xuống
    const napeHairY = h.y + (12.5 + pitch * 5.2) * s;
    const crownShift = -dir * (absYaw / 42) * 3.5 * s;

    return `
      <g>
        ${neckHtml}
        <!-- Hai vành tai lộ hai bên đầu nhìn từ phía sau -->
        <ellipse cx="${(h.x - rx - 0.5).toFixed(1)}" cy="${earY.toFixed(1)}" rx="${(3.4 * s).toFixed(1)}" ry="${(5.0 * s).toFixed(1)}"
                 fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" />
        <ellipse cx="${(h.x + rx + 0.5).toFixed(1)}" cy="${earY.toFixed(1)}" rx="${(3.4 * s).toFixed(1)}" ry="${(5.0 * s).toFixed(1)}"
                 fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" />
        <!-- Nếp vành tai sau -->
        <path d="M ${(h.x - rx - 1.2).toFixed(1)} ${(earY - 2 * s).toFixed(1)} Q ${(h.x - rx + 0.5).toFixed(1)} ${earY.toFixed(1)} ${(h.x - rx - 1).toFixed(1)} ${(earY + 2.2 * s).toFixed(1)}"
              fill="none" stroke="${COLORS.skinShade}" stroke-width="1.1" stroke-linecap="round" />
        <path d="M ${(h.x + rx + 1.2).toFixed(1)} ${(earY - 2 * s).toFixed(1)} Q ${(h.x + rx - 0.5).toFixed(1)} ${earY.toFixed(1)} ${(h.x + rx + 1).toFixed(1)} ${(earY + 2.2 * s).toFixed(1)}"
              fill="none" stroke="${COLORS.skinShade}" stroke-width="1.1" stroke-linecap="round" />

        <!-- Phần da gáy dưới chân tóc -->
        <ellipse cx="${h.x.toFixed(1)}" cy="${(h.y + 1.5 * s).toFixed(1)}" rx="${(rx * 0.94).toFixed(1)}" ry="${(ry * 0.92).toFixed(1)}"
                 fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" />

        <!-- Mái tóc ngắn đen than (#2B303A) phủ kín phía sau đầu, cắt tỉa gọn ở gáy -->
        <path d="M ${(h.x - rx * 1.01).toFixed(1)} ${(h.y + 2 * s).toFixed(1)}
                 C ${(h.x - rx * 1.12).toFixed(1)} ${(h.y - ry * 1.16).toFixed(1)},
                   ${(h.x + rx * 1.12).toFixed(1)} ${(h.y - ry * 1.16).toFixed(1)},
                   ${(h.x + rx * 1.01).toFixed(1)} ${(h.y + 2 * s).toFixed(1)}
                 Q ${(h.x + rx * 0.9).toFixed(1)} ${(napeHairY - 1.5 * s).toFixed(1)} ${(h.x + rx * 0.45).toFixed(1)} ${napeHairY.toFixed(1)}
                 Q ${(h.x + crownShift).toFixed(1)} ${(napeHairY + 2.2 * s).toFixed(1)} ${(h.x - rx * 0.45).toFixed(1)} ${napeHairY.toFixed(1)}
                 Q ${(h.x - rx * 0.9).toFixed(1)} ${(napeHairY - 1.5 * s).toFixed(1)} ${(h.x - rx * 1.01).toFixed(1)} ${(h.y + 2 * s).toFixed(1)} Z"
              fill="${COLORS.hair}" stroke="${COLORS.outline}" stroke-width="2" stroke-linejoin="round" />

        <!-- Ánh tóc cong nhẹ tạo khối tròn 3D cho đỉnh đầu (di chuyển theo góc ngửa/cúi) -->
        <path d="M ${(h.x - 8 * s + crownShift).toFixed(1)} ${(h.y - (7.5 - pitch * 5) * s).toFixed(1)}
                 Q ${(h.x + crownShift).toFixed(1)} ${(h.y - (11.5 - pitch * 5) * s).toFixed(1)} ${(h.x + 8 * s + crownShift).toFixed(1)} ${(h.y - (7.5 - pitch * 5) * s).toFixed(1)}"
              fill="none" stroke="${COLORS.hairHi}" stroke-width="2.1" stroke-linecap="round" opacity="0.65" />
      </g>
    `;
  }

  // 3. Chế độ XOAY SANG GÓC NGHIÊNG PROFILE (|yaw| >= 42° — Nhịp 9 quay Trái & Nhịp 11 quay Phải)
  const profT = Math.min(1, (absYaw - 42) / 38); // 0 -> 1 khi xoay từ 42° đến 80°
  const faceDir = dir; // -1 = mặt nhìn sang TRÁI màn hình (Nhịp 9), +1 = nhìn sang PHẢI (Nhịp 11)
  const noseBaseX = h.x + faceDir * (rx * 0.92);
  const noseTipX = h.x + faceDir * (rx + (3.6 * profT) * s);
  const noseY = h.y + 2.5 * s;

  const eyeX = h.x + faceDir * (rx * (0.48 + 0.14 * profT));
  const eyeY = h.y + 0.5 * s;
  const mouthX = h.x + faceDir * (rx * 0.68);
  const mouthY = h.y + 9.5 * s;
  const sideEarX = h.x - faceDir * (4.2 * s);
  const sideEarY = h.y + 2.2 * s;

  return `
    <g>
      ${neckHtml}
      <!-- Sống mũi góc nghiêng nhìn về hướng xoay (Trái ở Nhịp 9, Phải ở Nhịp 11) -->
      <path d="M ${noseBaseX.toFixed(1)} ${(noseY - 3.6 * s).toFixed(1)}
               L ${noseTipX.toFixed(1)} ${(noseY + 1.2 * s).toFixed(1)}
               L ${noseBaseX.toFixed(1)} ${(noseY + 3.4 * s).toFixed(1)}"
            fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.85" stroke-linejoin="round" />

      <!-- Khối đầu -->
      <ellipse cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"
               fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="2" />

      <!-- Mắt, lông mày và miệng ở nửa mặt nghiêng -->
      <path d="M ${(eyeX - faceDir * 2.8 * s).toFixed(1)} ${(eyeY - 4.2 * s).toFixed(1)}
               Q ${eyeX.toFixed(1)} ${(eyeY - 5.6 * s).toFixed(1)} ${(eyeX + faceDir * 2.8 * s).toFixed(1)} ${(eyeY - 4.0 * s).toFixed(1)}"
            fill="none" stroke="${COLORS.outline}" stroke-width="1.6" stroke-linecap="round" />
      <ellipse cx="${eyeX.toFixed(1)}" cy="${eyeY.toFixed(1)}" rx="${(1.8 * s).toFixed(1)}" ry="${(2.2 * s).toFixed(1)}" fill="${COLORS.outline}" />
      <circle cx="${(eyeX + faceDir * 0.5 * s).toFixed(1)}" cy="${(eyeY - 0.7 * s).toFixed(1)}" r="${(0.65 * s).toFixed(1)}" fill="#FFFFFF" />
      <path d="M ${(mouthX - faceDir * 3.2 * s).toFixed(1)} ${mouthY.toFixed(1)}
               Q ${mouthX.toFixed(1)} ${(mouthY + 1.8 * s).toFixed(1)} ${(mouthX + faceDir * 2.2 * s).toFixed(1)} ${(mouthY - 0.3 * s).toFixed(1)}"
            fill="none" stroke="#9A3412" stroke-width="1.65" stroke-linecap="round" />

      <!-- Mái tóc đen than phủ kín phần sau gáy & đỉnh đầu, để lộ vầng trán và mặt nghiêng -->
      <path d="M ${(h.x - faceDir * rx * 0.28).toFixed(1)} ${(h.y + ry * 0.76).toFixed(1)}
               C ${(h.x - faceDir * rx * 1.12).toFixed(1)} ${(h.y + ry * 0.58).toFixed(1)},
                 ${(h.x - faceDir * rx * 1.16).toFixed(1)} ${(h.y - ry * 0.96).toFixed(1)},
                 ${h.x.toFixed(1)} ${(h.y - ry * 1.08).toFixed(1)}
               C ${(h.x + faceDir * rx * 0.86).toFixed(1)} ${(h.y - ry * 1.05).toFixed(1)},
                 ${(h.x + faceDir * rx * 1.02).toFixed(1)} ${(h.y - ry * 0.52).toFixed(1)},
                 ${(h.x + faceDir * rx * 0.88).toFixed(1)} ${(h.y - ry * 0.24).toFixed(1)}
               Q ${(h.x + faceDir * rx * 0.22).toFixed(1)} ${(h.y - ry * 0.35).toFixed(1)} ${(h.x - faceDir * rx * 0.08).toFixed(1)} ${(h.y + 0.5 * s).toFixed(1)}
               Q ${(h.x - faceDir * rx * 0.22).toFixed(1)} ${(h.y + ry * 0.38).toFixed(1)} ${(h.x - faceDir * rx * 0.28).toFixed(1)} ${(h.y + ry * 0.76).toFixed(1)} Z"
            fill="${COLORS.hair}" stroke="${COLORS.outline}" stroke-width="1.95" stroke-linejoin="round" />

      <!-- Vành tai nằm bên má gần người xem -->
      <ellipse cx="${sideEarX.toFixed(1)}" cy="${sideEarY.toFixed(1)}" rx="${(3.1 * s).toFixed(1)}" ry="${(4.7 * s).toFixed(1)}"
               fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.7" />
    </g>
  `;
}

/**
 * Vẽ KHUNG HÌNH PHỤ GÓC NGHIÊNG RIÊNG CHO NHỊP 4 (ngay bên phải sân khấu, giống SGK)
 * Giúp học sinh thấy rõ độ khuỵu gối ~135° và hai tay hạ bắt chéo trước bụng
 */
function renderNhip4SideInset(alpha, prefix) {
  if (alpha <= 0.03) return '';
  return `
    <g opacity="${alpha.toFixed(2)}" transform="translate(242, 136)">
      <!-- Khung thẻ nhỏ bo tròn gọn gàng -->
      <rect x="0" y="0" width="108" height="224" rx="14" fill="#FFFFFF" fill-opacity="0.96" stroke="#CBD5E1" stroke-width="1.6" />
      <rect x="10" y="8" width="88" height="20" rx="6" fill="#FEF3C7" />
      <text x="54" y="21.5" text-anchor="middle" font-size="10" font-weight="800" fill="#92400E">Góc nghiêng (Nhịp 4)</text>

      <!-- Mặt sân nhỏ -->
      <line x1="14" y1="204" x2="94" y2="204" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4" />

      <!-- Nhân vật nhìn nghiêng (hướng sang PHẢI) đồng bộ 100% đồng phục -->
      <g transform="translate(6, 12) scale(0.92)">
        <!-- Chân sau -->
        <path d="M 38 118 L 50 118 L 62 150 L 50 192 L 40 192 L 50 151 Z"
              fill="${COLORS.pantsCrease}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M 40 192 L 51 192 L 66 200 Q 69 203 66 206 L 40 206 Q 37 206 38 201 Z"
              fill="${COLORS.shoeHeelDark}" stroke="${COLORS.outline}" stroke-width="1.7" />

        <!-- Chân trước khuỵu gối ~135° có sọc trắng dọc ống quần -->
        <path d="M 34 114 L 52 114 L 70 150 Q 72 155 69 160 L 56 193 L 43 193 L 55 155 L 36 126 Z"
              fill="${COLORS.pantsBlue}" stroke="${COLORS.outline}" stroke-width="2" stroke-linejoin="round" />
        <polyline points="43,118 61,152 49,191" fill="none" stroke="${COLORS.stripeWhite}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Tất vàng & giày cam đế trắng -->
        <rect x="44" y="190" width="11" height="5.5" rx="1.5" fill="${COLORS.sockYellow}" stroke="${COLORS.outline}" stroke-width="1.5" />
        <path d="M 42 194 L 55 194 Q 65 197 73 201 Q 75 204 72 206 L 43 206 Q 39 206 40 201 Z"
              fill="${COLORS.shoeOrange}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M 41 203.5 L 73 203.5 L 72 206.5 L 41.5 206.5 Z" fill="${COLORS.soleWhite}" stroke="${COLORS.outline}" stroke-width="1.2" />

        <!-- Thân áo vàng dưới + trắng trên + cổ polo xanh -->
        <path d="M 40 84 L 62 88 L 53 116 Q 42 119 33 114 Z"
              fill="${COLORS.shirtYellow}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
        <path d="M 49 62 Q 61 60 68 68 L 62 88 L 40 84 Z"
              fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
        <path d="M 54 61 L 66 64 L 63 70 L 52 66 Z"
              fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.6" stroke-linejoin="round" />

        <!-- Đầu cúi nhìn xuống tay -->
        <g transform="translate(69, 48) rotate(28)">
          <rect x="-5.5" y="8" width="9" height="11" rx="4" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.7" />
          <circle cx="0" cy="0" r="13" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.9" />
          <path d="M 12 -1 L 15.2 2 L 11.8 4" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.5" stroke-linejoin="round" />
          <circle cx="7.2" cy="1.4" r="1.6" fill="${COLORS.outline}" />
          <path d="M 5 7.2 Q 8 8.4 10 6.5" fill="none" stroke="#9A3412" stroke-width="1.4" stroke-linecap="round" />
          <path d="M -13 3 C -14.5 -11, 2 -16.5, 12 -7.5 C 13.5 -5.5, 12.5 -2.5, 9.5 -3.5 C 3.5 -5.5, -3 -2.5, -4.8 3 L -8.5 5 Z"
                fill="${COLORS.hair}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
          <circle cx="-2.8" cy="2" r="2.7" fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.4" />
        </g>

        <!-- Hai tay hạ bắt chéo trước bụng (tay trái trước, tay phải sau) -->
        <path d="M 56 88 L 65 88 L 71 128 L 62 128 Z"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M 62 127 L 71 127 Q 73 138 67 141 Q 62 141 62 133 Z"
              fill="${COLORS.skin}" stroke="${COLORS.outline}" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M 51 69 Q 59 64 67 70 L 67 90 L 53 90 Z"
              fill="${COLORS.shirtWhite}" stroke="${COLORS.outline}" stroke-width="1.9" stroke-linejoin="round" />
        <rect x="53" y="87" width="14" height="3.4" rx="1" fill="${COLORS.collarBlue}" stroke="${COLORS.outline}" stroke-width="1.3" />

        <!-- Cung góc nhỏ nhấn mạnh độ khuỵu gối ~135° -->
        <path d="M 58 140 A 14 14 0 0 0 58 164" fill="none" stroke="${COLORS.aiJoint}" stroke-width="2" stroke-dasharray="3 2" />
        <text x="80" y="156" font-size="9.5" font-weight="800" fill="#C2410C">~135°</text>
      </g>
    </g>
  `;
}

/**
 * Vẽ MŨI TÊN CHUYỂN ĐỘNG NÉT ĐỨT (SGK) PHÙ HỢP GÓC NHÌN SAU
 * - Nhịp 8: mũi tên bước chân TRÁI sang bên TRÁI màn hình + 2 mũi tên cong gập cẳng tay trước ngực
 * - Nhịp 9: mũi tên nét đứt vòng quanh eo chỉ chiều xoay sang TRÁI màn hình
 * - Nhịp 10: 2 mũi tên cong gập cẳng tay trước ngực
 * - Nhịp 11: mũi tên nét đứt vòng quanh eo chỉ chiều xoay sang PHẢI màn hình
 */
function renderRearArrows(pose, prefix, hipY, shoulderY, cx) {
  if (pose.arrowMode === 'none' || pose.arrowOpacity <= 0.04) return '';

  const op = pose.arrowOpacity.toFixed(2);
  const chestP = project3D({ x: 0, y: shoulderY - 22, z: 25 }, cx);
  const waistP = project3D({ x: 0, y: hipY + 26, z: 28 }, cx);

  if (pose.arrowMode === 'stepLeftAndFold' || pose.arrowMode === 'foldChest') {
    const y = chestP.y + 14;
    const stepArrow = pose.arrowMode === 'stepLeftAndFold'
      ? `
        <!-- Mũi tên bước chân TRÁI sang bên TRÁI màn hình dưới mặt sân -->
        <path d="M ${(cx - 14).toFixed(1)} ${(RIG.floorY + 14).toFixed(1)} L ${(cx - 52).toFixed(1)} ${(RIG.floorY + 14).toFixed(1)}"
              fill="none" stroke="#F97316" stroke-width="2.6" stroke-dasharray="5 3.5" stroke-linecap="round"
              marker-end="url(#${prefix}rearArrOrange)" class="rear-arrow-flow" />
        <text x="${(cx - 34).toFixed(1)}" y="${(RIG.floorY + 28).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#C2410C">Bước trái</text>
      `
      : '';

    return `
      <g opacity="${op}">
        <!-- Hai mũi tên cong vào trong dưới khuỷu tay (gập cẳng tay trước ngực) -->
        <path d="M ${(cx - 76).toFixed(1)} ${(y - 8).toFixed(1)} Q ${(cx - 68).toFixed(1)} ${(y + 14).toFixed(1)} ${(cx - 42).toFixed(1)} ${(y + 10).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}rearArrBlue)" class="rear-arrow-flow" />
        <path d="M ${(cx + 76).toFixed(1)} ${(y - 8).toFixed(1)} Q ${(cx + 68).toFixed(1)} ${(y + 14).toFixed(1)} ${(cx + 42).toFixed(1)} ${(y + 10).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}rearArrBlue)" class="rear-arrow-flow" />
        ${stepArrow}
      </g>
    `;
  }

  if (pose.arrowMode === 'twistLeft') {
    // Nhịp 9: Xoay người sang TRÁI -> mũi tên vòng quanh lưng/eo chỉ sang TRÁI màn hình
    const y = waistP.y;
    return `
      <g opacity="${op}">
        <path d="M ${(cx + 50).toFixed(1)} ${(y - 6).toFixed(1)} Q ${cx.toFixed(1)} ${(y + 18).toFixed(1)} ${(cx - 56).toFixed(1)} ${(y - 5).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.7" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}rearArrBlue)" class="rear-arrow-flow" />
      </g>
    `;
  }

  if (pose.arrowMode === 'twistRight') {
    // Nhịp 11: Xoay người sang PHẢI -> mũi tên vòng quanh lưng/eo chỉ sang PHẢI màn hình
    const y = waistP.y;
    return `
      <g opacity="${op}">
        <path d="M ${(cx - 50).toFixed(1)} ${(y - 6).toFixed(1)} Q ${cx.toFixed(1)} ${(y + 18).toFixed(1)} ${(cx + 56).toFixed(1)} ${(y - 5).toFixed(1)}"
              fill="none" stroke="${COLORS.arrowBlue}" stroke-width="2.7" stroke-dasharray="5 4" stroke-linecap="round"
              marker-end="url(#${prefix}rearArrBlue)" class="rear-arrow-flow" />
      </g>
    `;
  }

  return '';
}

/**
 * Vẽ LỚP PHỦ ĐIỂM KHỚP AI CHẤM (POSE LANDMARKS + NHÃN GÓC THAM CHIẾU)
 */
function renderRearAiLandmarks(joints, poseMeta, cx) {
  if (!appState.showAI) return '';

  const { shL, shR, elL, elR, wrL, wrR, hipL, hipR, knL, knR, anL, anR } = joints;
  const lines = [
    [shL, shR], [hipL, hipR], [shL, hipL], [shR, hipR],
    [shL, elL], [elL, wrL], [shR, elR], [elR, wrR],
    [hipL, knL], [knL, anL], [hipR, knR], [knR, anR],
  ];

  const linesSvg = lines
    .map(([a, b]) => `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${COLORS.aiLine}" stroke-width="2.4" stroke-dasharray="4 3" opacity="0.9" />`)
    .join('');

  const dots = [
    { p: shL, r: 5.2, label: 'T' }, { p: shR, r: 5.2, label: 'P' },
    { p: elL, r: 4.5 }, { p: elR, r: 4.5 },
    { p: wrL, r: 4.5 }, { p: wrR, r: 4.5 },
    { p: hipL, r: 4.6 }, { p: hipR, r: 4.6 },
    { p: knL, r: 4.6 }, { p: knR, r: 4.6 },
    { p: anL, r: 4.2 }, { p: anR, r: 4.2 },
  ];

  const dotsSvg = dots
    .map(({ p, r }) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${COLORS.aiJoint}" stroke="#FFFFFF" stroke-width="1.8" />`)
    .join('');

  // Hộp góc độ tham chiếu gọn đẹp ở dưới cùng góc trái
  const pillW = Math.min(200, Math.max(124, poseMeta.angleRef.length * 6.8 + 18));
  const pillSvg = `
    <g transform="translate(${(cx - pillW / 2).toFixed(1)}, 12)">
      <rect width="${pillW.toFixed(1)}" height="24" rx="8" fill="#0F172A" fill-opacity="0.88" />
      <text x="${(pillW / 2).toFixed(1)}" y="15.8" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">${escapeXml(poseMeta.angleRef)}</text>
    </g>
  `;

  return `<g id="rear-ai-landmarks">${linesSvg}${dotsSvg}${pillSvg}</g>`;
}

/**
 * HÀM RENDER CHÍNH: TẠO TOÀN BỘ SVG NHÂN VẬT GÓC NHÌN SAU (PAINTER'S Z-SORT THỰC)
 */
function buildRearCharacterSvgInner(pose, prefix = 'rear_') {
  // Ở riêng Nhịp 4, dịch nhẹ nhân vật chính sang trái (cx = 132) để nhường chỗ cho khung hình phụ góc nghiêng bên phải!
  const cx = lerp(RIG.cx, 126, pose.inset4Alpha);

  // 1. Tính tọa độ 3D các khớp chân & hông
  const hipDrop = pose.kneeBend * 21;
  const kneeForward = pose.kneeBend * 30; // Hướng ra phía trước (-Z trong hệ góc nhìn sau!)
  const hipY = RIG.baseHipY - hipDrop;
  const shoulderY = hipY + RIG.torsoHeight - pose.kneeBend * 3.5;

  const footHalfX = lerp(11.5, 31, pose.stanceWidth);
  const kneeHalfX = lerp(11.5, 25, pose.stanceWidth);
  const hipHalfX = lerp(11.5, 15.5, pose.stanceWidth);

  // Bên TRÁI nhân vật = -X (bên trái màn hình); bên PHẢI nhân vật = +X (bên phải màn hình)
  const hipL3 = rotateRearY(-hipHalfX, hipY, 0, pose.hipYaw);
  const hipR3 = rotateRearY(hipHalfX, hipY, 0, pose.hipYaw);

  const kneeY = RIG.ankleHeight + RIG.shinLen - hipDrop * 0.45;
  const knL3 = rotateRearY(-kneeHalfX, kneeY, -kneeForward, pose.hipYaw * 0.72);
  const knR3 = rotateRearY(kneeHalfX, kneeY, -kneeForward, pose.hipYaw * 0.72);

  const anL3 = rotateRearY(-footHalfX, RIG.ankleHeight + pose.leftFootLift, 0, pose.hipYaw * 0.35);
  const anR3 = rotateRearY(footHalfX, RIG.ankleHeight, 0, pose.hipYaw * 0.35);

  const legL = {
    side: -1, // TRÁI
    hip2D: project3D(hipL3, cx),
    knee2D: project3D(knL3, cx),
    ankle2D: project3D(anL3, cx),
    avgZ: (hipL3.z + knL3.z + anL3.z) / 3,
    stanceWidth: pose.stanceWidth,
  };
  const legR = {
    side: 1, // PHẢI
    hip2D: project3D(hipR3, cx),
    knee2D: project3D(knR3, cx),
    ankle2D: project3D(anR3, cx),
    avgZ: (hipR3.z + knR3.z + anR3.z) / 3,
    stanceWidth: pose.stanceWidth,
  };

  // 2. Tính tọa độ 3D hai cánh tay (quy đổi fwd > 0 -> -Z đi ra phía trước thân!)
  const shL3 = rotateRearY(-RIG.shoulderHalfW, shoulderY, 0, pose.torsoYaw);
  const shR3 = rotateRearY(RIG.shoulderHalfW, shoulderY, 0, pose.torsoYaw);

  // Tay TRÁI (side = -1): out > 0 đi sang -X; fwd > 0 đi về -Z (phía trước ngực)
  const uLRot = rotateRearY(-pose.uL[0], pose.uL[1], -pose.uL[2], pose.armYaw);
  const fLRot = rotateRearY(-pose.fL[0], pose.fL[1], -pose.fL[2], pose.armYaw);
  const elL3 = { x: shL3.x + uLRot.x, y: shL3.y + uLRot.y, z: shL3.z + uLRot.z };
  const wrL3 = { x: elL3.x + fLRot.x, y: elL3.y + fLRot.y, z: elL3.z + fLRot.z };

  // Tay PHẢI (side = +1): out > 0 đi sang +X; fwd > 0 đi về -Z (phía trước ngực)
  const uRRot = rotateRearY(pose.uR[0], pose.uR[1], -pose.uR[2], pose.armYaw);
  const fRRot = rotateRearY(pose.fR[0], pose.fR[1], -pose.fR[2], pose.armYaw);
  const elR3 = { x: shR3.x + uRRot.x, y: shR3.y + uRRot.y, z: shR3.z + uRRot.z };
  const wrR3 = { x: elR3.x + fRRot.x, y: elR3.y + fRRot.y, z: elR3.z + fRRot.z };

  const armL = {
    side: -1,
    cx,
    shoulder3D: shL3,
    elbow3D: elL3,
    wrist3D: wrL3,
    shoulder2D: project3D(shL3, cx),
    elbow2D: project3D(elL3, cx),
    wrist2D: project3D(wrL3, cx),
  };
  const armR = {
    side: 1,
    cx,
    shoulder3D: shR3,
    elbow3D: elR3,
    wrist3D: wrR3,
    shoulder2D: project3D(shR3, cx),
    elbow2D: project3D(elR3, cx),
    wrist2D: project3D(wrR3, cx),
  };

  // 3. Thuật toán Painter's Z-Sort: z nhỏ (phía trước ngực, xa camera) vẽ TRƯỚC; z lớn (gần camera) vẽ ĐÈ SAU
  const drawQueue = [];
  drawQueue.push({ z: legL.avgZ - 2, html: renderRearLeg(legL, pose.hipYaw, pose.kneeBend) });
  drawQueue.push({ z: legR.avgZ - 2, html: renderRearLeg(legR, pose.hipYaw, pose.kneeBend) });
  drawQueue.push({ z: 0, html: renderRearTorso(pose, hipY, shoulderY, cx) });
  drawQueue.push({ z: 1.5, html: renderRearHead(pose, shoulderY, cx) });

  const armLRes = renderRearArm(armL, pose.handMode, pose.torsoYaw);
  const armRRes = renderRearArm(armR, pose.handMode, pose.torsoYaw);
  armLRes.layers.forEach((layer) => drawQueue.push(layer));
  armRRes.layers.forEach((layer) => drawQueue.push(layer));

  drawQueue.sort((a, b) => a.z - b.z);

  // Lớp X-quang cho phần cẳng tay đang khuất phía trước thân (vẽ đè mờ lên trên thân lưng)
  const xrayOverlayHtml = (armLRes.xrayHtml || armRRes.xrayHtml)
    ? `<g id="${prefix}xray-layer">${armRRes.xrayHtml}${armLRes.xrayHtml}</g>`
    : '';

  const shadowRx = lerp(38, 58, pose.stanceWidth);

  const defsHtml = `
    <defs>
      <marker id="${prefix}rearArrBlue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
        <path d="M 0 1.4 L 9.2 5 L 0 8.6 z" fill="${COLORS.arrowBlue}" />
      </marker>
      <marker id="${prefix}rearArrOrange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
        <path d="M 0 1.4 L 9.2 5 L 0 8.6 z" fill="#F97316" />
      </marker>
      <linearGradient id="${prefix}floorShadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#94A3B8" stop-opacity="0" />
        <stop offset="50%" stop-color="#64748B" stop-opacity="0.24" />
        <stop offset="100%" stop-color="#94A3B8" stop-opacity="0" />
      </linearGradient>
    </defs>
  `;

  const groundHtml = `
    <ellipse cx="${cx.toFixed(1)}" cy="${RIG.floorY + 1}" rx="${shadowRx.toFixed(1)}" ry="6.5" fill="url(#${prefix}floorShadow)" />
    <line x1="28" y1="${RIG.floorY + 2}" x2="${(pose.inset4Alpha > 0.2 ? 232 : 332)}" y2="${RIG.floorY + 2}" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6 6" stroke-linecap="round" />
  `;

  const arrowsHtml = renderRearArrows(pose, prefix, hipY, shoulderY, cx);
  const inset4Html = renderNhip4SideInset(pose.inset4Alpha, prefix);
  const aiHtml = renderRearAiLandmarks(
    {
      shL: armL.shoulder2D, shR: armR.shoulder2D,
      elL: armL.elbow2D, elR: armR.elbow2D,
      wrL: armL.wrist2D, wrR: armR.wrist2D,
      hipL: legL.hip2D, hipR: legR.hip2D,
      knL: legL.knee2D, knR: legR.knee2D,
      anL: legL.ankle2D, anR: legR.ankle2D,
    },
    POSES[pose.nearestIdx],
    cx
  );

  return `
    ${defsHtml}
    ${groundHtml}
    ${drawQueue.map((item) => item.html).join('')}
    ${xrayOverlayHtml}
    ${arrowsHtml}
    ${inset4Html}
    ${aiHtml}
  `;
}

// Chỉnh cho khớp hình SGK (tools/gemini-src/g6-dang-tay.fix.json)
if (POSES[4]) Object.assign(POSES[4], {"kneeBend":0.8,"headPitch":-0.5,"uL":[-8,-42,12],"fL":[-20,-36,12],"uR":[-8,-42,7],"fR":[-20,-36,6],"rearTip":"Gối khuỵu hạ thấp trọng tâm, đầu cúi nhìn tay; hai tay duỗi gần thẳng, bắt chéo trước đùi (bị lưng che nên vẽ nét đứt)."});
if (POSES[8]) Object.assign(POSES[8], {"stanceWidth":1.5});
if (POSES[9]) Object.assign(POSES[9], {"stanceWidth":1.5});
if (POSES[10]) Object.assign(POSES[10], {"stanceWidth":1.5});
if (POSES[11]) Object.assign(POSES[11], {"stanceWidth":1.5});

export const view = 'back';
export const poses = POSES;
export const sample = (t) => samplePoseAtTime(t);
/** Nội dung bên trong <svg viewBox="0 0 360 390"> của tư thế đã nội suy. */
export function render(pose, opts = {}, prefix = 'b_') {
  if ('ai' in opts) appState.showAI = !!opts.ai;
  if ('arrows' in opts) { appState.showArrows = !!opts.arrows; appState.showXray = !!opts.arrows; }
  return buildRearCharacterSvgInner(pose, prefix);
}
