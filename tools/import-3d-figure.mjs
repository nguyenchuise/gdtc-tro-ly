// Ghép mô hình 3D (tệp HTML Three.js thầy cô dựng bằng Gemini) vào cột ① "Bạn mẫu tập cùng em" ở mục 2. Video.
//
//   node tools/import-3d-figure.mjs <mã-bài> <tệp-3d.html>
//
// Công cụ:
//  1. Chép tệp thành figures3d/<mã-bài>.html, giữ nguyên lõi 3D của Gemini.
//  2. Đổi đường dẫn Three.js sang bản tự lưu vendor/three-0.147.0.min.js (mạng trường hay chặn CDN);
//     vẫn giữ CDN làm dự phòng.
//  3. Gắn js/fig3d-bridge.js: khi nhúng thì ẩn giao diện riêng, bật khớp AI, báo nhịp ra ngoài để ảnh SGK
//     bên cạnh chạy cùng nhịp.
//  4. Kiểm tra tệp có đủ chỗ để điều khiển (state, samplePose, POSES hoặc EXERCISES, #btnPlay, #beatsGrid…).
//  5. Bật "figure3d": true cho bài trong data/exercises.json.
// Tệp mới phải theo cùng khung với các tệp đã ghép (xem tools/gemini-src/HUONG-DAN-GEMINI.md).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const [id, file] = process.argv.slice(2);
const fail = (m) => { console.error(`❌ ${m}`); process.exit(1); };
if (!id || !file) fail('Cách dùng: node tools/import-3d-figure.mjs <mã-bài> <tệp-3d.html>');
const raw = readFileSync(`${root}data/exercises.json`, 'utf8');
const ex = JSON.parse(raw).exercises.find((e) => e.id === id);
if (!ex) fail(`Không có bài "${id}" trong data/exercises.json`);

let html = readFileSync(file, 'utf8');
const need = {
  'const state = {': /\bconst\s+state\s*=\s*\{/,
  'function samplePose(': /function\s+samplePose\s*\(/,
  'POSES hoặc EXERCISES': /\bconst\s+(POSES|EXERCISES)\s*=\s*\[/,
  '#btnPlay': /id="btnPlay"/,
  '#beatsGrid': /id="beatsGrid"/,
  '#chkSkeleton (khớp AI)': /id="chkSkeleton"/,
  '#viewportShell': /id="viewportShell"/,
  'Three.js': /three(\.min)?\.js/,
};
const miss = Object.entries(need).filter(([, re]) => !re.test(html)).map(([k]) => k);
if (miss.length) fail(`${file}: thiếu ${miss.join(', ')} — tệp chưa đúng khung, chưa ghép được.`);

// Three.js tự lưu (CDN làm dự phòng)
const n0 = html.length;
html = html.replace(/<script\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^"]+"\s*(onerror="[^"]*")?\s*><\/script>/,
  '<script src="../vendor/three-0.147.0.min.js" onerror="this.onerror=null;this.src=\'https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js\'"></script>');
if (html.length === n0) console.warn('⚠️  Không thấy thẻ Three.js từ jsdelivr để đổi sang bản tự lưu — giữ nguyên.');
// Cầu nối (chạy sau lõi 3D)
html = html.replace(/<\/body>\s*<\/html>\s*$/i, '<script src="../js/fig3d-bridge.js"></script>\n</body>\n</html>\n');
if (!html.includes('fig3d-bridge.js')) fail('Không gắn được cầu nối (thiếu </body></html> ở cuối tệp).');
html = `<!-- TỰ SINH bởi tools/import-3d-figure.mjs từ tệp Gemini của thầy cô (${file.split('/').pop().replace(/^[0-9a-f]{8}-/, '')}). Bài: ${id} — ${ex.title} -->\n${html}`;

mkdirSync(`${root}figures3d`, { recursive: true });
writeFileSync(`${root}figures3d/${id}.html`, html);
mkdirSync(`${root}tools/gemini-src`, { recursive: true });
writeFileSync(`${root}tools/gemini-src/${id}.3d.html`, readFileSync(file));

if (!ex.figure3d) {
  const re = new RegExp(`(\\n([ \\t]*)"id": "${id}",\\n)`);
  if (!re.test(raw)) fail(`Không chèn được "figure3d" — thêm tay dòng "figure3d": true, cho bài ${id}.`);
  writeFileSync(`${root}data/exercises.json`, raw.replace(re, (m, all, ind) => `${all}${ind}"figure3d": true,\n`));
}
console.log(`✅ ${id}: figures3d/${id}.html (bản gốc lưu ở tools/gemini-src/${id}.3d.html)`);
