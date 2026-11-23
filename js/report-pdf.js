// Phiếu kết quả tự tập — một trang PDF A4, tạo ngay trong trình duyệt (không gửi đi đâu).
// Trang được vẽ lên canvas (chữ tiếng Việt hiển thị đúng với mọi phông), rồi gói thành PDF chứa một ảnh JPEG.

const W = 1240, H = 1754; // A4 ở 150 dpi
const C = { brand: '#0b7350', deep: '#063b29', ink: '#0f1a14', ink2: '#364540', muted: '#5b6a64', line: '#cfdad4', ok: '#16a34a', mid: '#d97706', bad: '#dc2626', soft: '#f1f6f3' };
const FONT = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const tone = (s) => (s >= 80 ? C.ok : s >= 50 ? C.mid : C.bad);
const pad2 = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())} ngày ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

function loadImage(src) {
  return new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = src; });
}

/** Xuống dòng theo bề rộng; trả về danh sách dòng. */
function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Vẽ phiếu kết quả.
 * info: { title, grade, chapter, name, result: { score, detail, parts, time, image, steps? } }
 */
async function drawReport(info) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = info.result;
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';
  const M = 70; // lề
  let y = 0;

  // Đầu trang
  g.fillStyle = C.deep; g.fillRect(0, 0, W, 130);
  g.fillStyle = '#fff'; g.font = `800 40px ${FONT}`;
  g.fillText('PHIẾU KẾT QUẢ TỰ TẬP', M, 68);
  g.font = `500 22px ${FONT}`; g.fillStyle = '#cdebdc';
  g.fillText('Môn Giáo dục thể chất · GDTC Trợ lý tập luyện (chấm bằng camera)', M, 106);
  y = 180;

  // Thông tin học sinh (để trống nếu chưa nhập — em tự ghi tay)
  g.font = `500 24px ${FONT}`; g.fillStyle = C.ink2;
  const field = (label, value, x, w) => {
    g.fillStyle = C.ink2; g.font = `500 24px ${FONT}`; g.fillText(label, x, y);
    const lx = x + g.measureText(label).width + 10;
    if (value) { g.fillStyle = C.ink; g.font = `700 24px ${FONT}`; g.fillText(value, lx, y); }
    g.strokeStyle = C.line; g.setLineDash([3, 5]); g.lineWidth = 2;
    g.beginPath(); g.moveTo(lx, y + 8); g.lineTo(x + w, y + 8); g.stroke(); g.setLineDash([]);
  };
  field('Họ và tên:', info.name || '', M, 700);
  field('Lớp:', '', M + 740, W - 2 * M - 740);
  y += 50;
  g.fillStyle = C.ink2; g.font = `500 24px ${FONT}`;
  g.fillText(`Thời gian tập: ${fmt(r.time)}`, M, y);
  y += 54;

  // Bài tập
  g.fillStyle = C.muted; g.font = `600 22px ${FONT}`;
  g.fillText(`Lớp ${info.grade}${info.chapter ? ` · ${info.chapter}` : ''}`, M, y);
  y += 40;
  g.fillStyle = C.ink; g.font = `800 32px ${FONT}`;
  for (const line of wrap(g, info.title, W - 2 * M - 300).slice(0, 2)) { g.fillText(line, M, y); y += 42; }

  // Ô điểm (góc phải)
  const bx = W - M - 270, by = 270;
  g.fillStyle = tone(r.score); roundRect(g, bx, by, 270, 150, 18); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = `600 22px ${FONT}`; g.fillText('MÁY CHẤM', bx + 135, by + 38);
  g.font = `800 72px ${FONT}`; g.fillText(`${r.score}%`, bx + 135, by + 112);
  g.font = `600 20px ${FONT}`; g.fillText(r.score >= 80 ? 'ĐẠT' : 'CHƯA ĐẠT', bx + 135, by + 140);
  g.textAlign = 'left';
  y = Math.max(y, by + 150) + 20;
  g.fillStyle = C.ink2; g.font = `600 24px ${FONT}`;
  g.fillText(`Kết quả: ${r.detail}`, M, y);
  y += 26;

  // Phần dưới cố định: bảng điểm + ô giáo viên. Tính chiều cao trước để ảnh vừa một trang.
  const steps0 = r.steps || [];
  // Bài chấm trọn bộ một động tác: bảng điểm trùng với ô từng nhịp → chỉ giữ ô từng nhịp.
  const parts = steps0.length && (r.parts || []).length === steps0.length ? [] : (r.parts || []);
  const cols = parts.length > 6 ? 2 : 1;
  const rowsN = Math.ceil(parts.length / cols);
  const tableH = parts.length ? 50 + rowsN * 40 : 0;
  const steps = r.steps || [];
  const chipW = 74, chipGap = 8, perRow = Math.floor((W - 2 * M + chipGap) / (chipW + chipGap));
  const stepsH = steps.length ? 50 + Math.ceil(steps.length / perRow) * (44 + chipGap) : 0;
  const teacherH = 250, footH = 70;
  const imgMaxH = H - y - 30 - tableH - stepsH - teacherH - footH - 40;

  // Ảnh lúc tập
  try {
    const im = await loadImage(r.image);
    const s = Math.min((W - 2 * M) / im.width, imgMaxH / im.height);
    const iw = im.width * s, ih = im.height * s;
    const ix = (W - iw) / 2, iy = y + 14;
    g.drawImage(im, ix, iy, iw, ih);
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(ix, iy, iw, ih);
    y = iy + ih + 30;
  } catch { y += 20; }

  // Bảng điểm từng phần
  if (parts.length) {
  g.fillStyle = C.ink; g.font = `700 26px ${FONT}`;
  g.fillText('Điểm từng phần', M, y + 4);
  y += 24;
  const colW = (W - 2 * M - (cols - 1) * 30) / cols;
  parts.forEach((p, k) => {
    const col = Math.floor(k / rowsN), row = k % rowsN;
    const x = M + col * (colW + 30), yy = y + 14 + row * 40;
    if (row % 2 === 0) { g.fillStyle = C.soft; g.fillRect(x, yy, colW, 40); }
    g.fillStyle = C.ink2; g.font = `500 21px ${FONT}`;
    const label = wrap(g, p.label, colW - 230)[0] + (g.measureText(p.label).width > colW - 230 ? '…' : '');
    g.fillText(label, x + 10, yy + 27);
    const barX = x + colW - 210, barW = 130;
    g.fillStyle = '#e5ebe8'; roundRect(g, barX, yy + 14, barW, 12, 6); g.fill();
    g.fillStyle = tone(p.score); roundRect(g, barX, yy + 14, Math.max(6, (barW * Math.min(100, p.score)) / 100), 12, 6); g.fill();
    g.fillStyle = C.ink; g.font = `700 21px ${FONT}`; g.textAlign = 'right';
    g.fillText(`${p.score}%`, x + colW - 10, yy + 27); g.textAlign = 'left';
  });
  y += 14 + rowsN * 40 + 16;
  }

  // Từng nhịp (bài chấm trọn bộ)
  if (steps.length) {
    g.fillStyle = C.ink; g.font = `700 24px ${FONT}`;
    g.fillText(`Từng nhịp (xanh: đạt · xám: bỏ qua) — ${steps.filter((s) => s.ok).length}/${steps.length} nhịp đạt`, M, y + 20);
    y += 36;
    steps.forEach((s, k) => {
      const x = M + (k % perRow) * (chipW + chipGap), yy = y + Math.floor(k / perRow) * (44 + chipGap);
      g.fillStyle = s.ok ? tone(s.score) : '#9aa8a2'; roundRect(g, x, yy, chipW, 44, 8); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center';
      g.font = `700 17px ${FONT}`; g.fillText(s.short, x + chipW / 2, yy + 19);
      g.font = `600 15px ${FONT}`; g.fillText(s.ok ? `${s.score}%` : '—', x + chipW / 2, yy + 38);
      g.textAlign = 'left';
    });
    y += Math.ceil(steps.length / perRow) * (44 + chipGap) + 10;
  }

  // Ô dành cho giáo viên
  const ty = H - footH - teacherH;
  g.strokeStyle = C.brand; g.lineWidth = 3; roundRect(g, M, ty, W - 2 * M, teacherH - 20, 16); g.stroke();
  g.fillStyle = C.brand; g.font = `800 24px ${FONT}`;
  g.fillText('PHẦN DÀNH CHO GIÁO VIÊN', M + 24, ty + 40);
  g.fillStyle = C.ink2; g.font = `500 22px ${FONT}`;
  g.fillText('Nhận xét:', M + 24, ty + 84);
  g.strokeStyle = C.line; g.setLineDash([3, 6]); g.lineWidth = 2;
  [ty + 90, ty + 134].forEach((ly, k) => { g.beginPath(); g.moveTo(M + (k ? 24 : 130), ly); g.lineTo(W - M - 24, ly); g.stroke(); });
  g.setLineDash([]);
  g.fillText('Điểm / Xếp loại: ......................', M + 24, ty + 190);
  g.fillText('Chữ ký giáo viên: ......................', W / 2 + 20, ty + 190);

  // Chân trang
  g.fillStyle = C.muted; g.font = `400 18px ${FONT}`;
  g.fillText('Điểm do máy chấm tự động từ camera, chỉ để tham khảo; giáo viên quyết định kết quả cuối cùng.', M, H - 40);
  g.fillText('Hình ảnh chỉ xử lý trên máy của em, không gửi đi. Tạo bằng GDTC Trợ lý tập luyện.', M, H - 16);
  return c;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Gói một ảnh JPEG thành PDF một trang A4. */
export function jpegToPdf(jpeg, imgW, imgH) {
  const enc = new TextEncoder();
  const PW = 595.28, PH = 841.89;
  const chunks = [];
  const offsets = [];
  let len = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => {
    push(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg); push('\nendstream');
  });
  obj(5, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  const xref = len;
  push(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

/** Tạo PDF phiếu kết quả (Blob). */
export async function makeReportPdf(info) {
  if (document.fonts?.ready) await document.fonts.ready;
  const c = await drawReport(info);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.88));
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  return jpegToPdf(jpeg, c.width, c.height);
}
