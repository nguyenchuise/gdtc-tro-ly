// Đóng dấu phiên bản khi deploy (chạy trong GitHub Actions, KHÔNG chạy khi sửa trên máy):
// thêm "?v=<mã phiên bản>" vào mọi đường dẫn tệp JS/CSS của trang, để mỗi lần cập nhật trình duyệt (nhất là điện
// thoại) buộc phải tải bản mới thay vì dùng bản cũ còn giữ lại. Ghi số phiên bản vào cuối trang.
//
//   node tools/cache-bust.mjs <mã-phiên-bản>
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const v = (process.argv[2] || Date.now().toString(36)).replace(/[^\w.-]/g, '').slice(0, 20);
const changelog = readFileSync(`${root}CHANGELOG.md`, 'utf8');
const ver = changelog.match(/^## \[([\d.]+)\]/m)?.[1] || '';
const tag = (p) => (p.includes('?') ? p : `${p}?v=${v}`);
let n = 0;

// 1) index.html: CSS, mô-đun chính, số phiên bản cuối trang
let html = readFileSync(`${root}index.html`, 'utf8');
html = html.replace(/(href|src)="((?:css|js)\/[\w./-]+\.(?:css|js))"/g, (m, a, p) => { n++; return `${a}="${tag(p)}"`; });
html = html.replace(/data-build>[^<]*</, `data-build>${ver ? `Phiên bản ${ver} · ` : ''}${v}<`);
writeFileSync(`${root}index.html`, html);

// 2) mọi mô-đun trong js/ (kể cả import động và import(`./figures/${id}.back.js`))
const files = readdirSync(`${root}js`).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`)
  .concat(readdirSync(`${root}js/figures`).filter((f) => f.endsWith('.js')).map((f) => `js/figures/${f}`));
for (const f of files) {
  let s = readFileSync(`${root}${f}`, 'utf8');
  const before = s;
  s = s.replace(/(\bfrom\s+|\bimport\(\s*)'(\.{1,2}\/[^']+\.m?js)'/g, (m, a, p) => `${a}'${tag(p)}'`);
  s = s.replace(/(\bimport\(\s*)`(\.{1,2}\/[^`]+\.m?js)`/g, (m, a, p) => `${a}\`${tag(p)}\``);
  if (s !== before) { writeFileSync(`${root}${f}`, s); n++; }
}

// 3) tệp mô hình 3D: thư viện + phong cách + cầu nối
for (const f of readdirSync(`${root}figures3d`).filter((x) => x.endsWith('.html'))) {
  let s = readFileSync(`${root}figures3d/${f}`, 'utf8');
  s = s.replace(/src="(\.\.\/(?:js|vendor)\/[\w./-]+\.js)"/g, (m, p) => { n++; return `src="${tag(p)}"`; });
  writeFileSync(`${root}figures3d/${f}`, s);
}
console.log(`Đóng dấu phiên bản ${ver} (${v}): ${n} chỗ.`);
