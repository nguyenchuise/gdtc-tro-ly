// Quét media/sach/<mã-bài>/ → sinh data/media.json để trang tự hiện ảnh trang sách (không cần sửa exercises.json).
// Chạy tự động trong GitHub Actions trước khi deploy. Chạy tay: node tools/build-media-manifest.mjs
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'media', 'sach');
const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const manifest = {};
if (existsSync(dir)) {
  for (const id of readdirSync(dir)) {
    const sub = join(dir, id);
    if (!statSync(sub).isDirectory()) continue;
    const files = readdirSync(sub).filter((f) => IMG.test(f)).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    if (!files.length) continue;
    manifest[id] = {
      book: files.map((f) => {
        const m = f.match(/trang[-_ ]?(\d{1,3})/i) || f.match(/^(\d{1,3})\b/);
        return { page: m ? Number(m[1]) : null, image: `media/sach/${encodeURIComponent(id)}/${encodeURIComponent(f)}` };
      }),
    };
  }
}
writeFileSync(join(root, 'data', 'media.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`media.json: ${Object.keys(manifest).length} bài có ảnh trong media/sach/`);

// Nhạc nền: tệp đầu tiên (theo tên) trong media/nhac/ → data/music.json. Không có tệp → trang dùng giai điệu tự soạn.
const nhac = join(root, 'media', 'nhac');
const AUD = /\.(mp3|m4a|aac|ogg|oga|wav)$/i;
const songs = existsSync(nhac) ? readdirSync(nhac).filter((f) => AUD.test(f)).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })) : [];
const music = songs.length ? { file: `media/nhac/${encodeURIComponent(songs[0])}`, title: songs[0].replace(AUD, '') } : {};
writeFileSync(join(root, 'data', 'music.json'), `${JSON.stringify(music, null, 2)}\n`);
console.log(`music.json: ${songs.length ? `nhạc nền = ${songs[0]}` : 'chưa có tệp nhạc trong media/nhac/ → dùng giai điệu tự soạn'}`);
