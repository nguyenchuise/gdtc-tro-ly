/**
 * Cloudflare Worker — nhận kết quả tự tập từ trang GDTC, lưu vào Google Sheet + Google Drive.
 * Gọi THẲNG Google API (Sheets v4, Drive v3). Khoá KHÔNG nằm trong repo — đặt bằng Worker secret.
 *
 * Xác thực bằng "refresh token" OAuth của chính tài khoản cô (nguyenthuyquyanh@gmail.com):
 * ảnh tải lên tính vào dung lượng Drive của cô. (Tài khoản dịch vụ KHÔNG tải ảnh vào Drive của
 * Gmail thường được, vì không có hạn mức lưu trữ — nên dùng refresh token của cô.)
 *
 * Bí mật (đặt bằng `npx wrangler secret put <TÊN>`, KHÔNG để trong repo):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   APP_TOKEN    (tuỳ chọn) — trang phải gửi kèm "token" này thì mới ghi (chặn gửi bừa).
 *   ADMIN_TOKEN  (tuỳ chọn) — cần ?token=... khớp mới đọc được dữ liệu qua GET.
 * Biến thường (wrangler.toml [vars]):
 *   SHEET_ID, DRIVE_FOLDER_ID, ALLOWED_ORIGIN
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      if (request.method === 'POST') return await handleSave(request, env, cors);
      if (request.method === 'GET') return await handleRead(request, env, cors);
      return json({ error: 'Chỉ nhận GET hoặc POST.' }, 405, cors);
    } catch (err) {
      return json({ error: String((err && err.message) || err) }, 500, cors);
    }
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}

// ---- Access token từ refresh token (đóng vai chính tài khoản cô), cache trong vài phút ----------
let cached = { token: null, exp: 0 };
async function accessToken(env) {
  if (cached.token && Date.now() < cached.exp - 60000) return cached.token;
  for (const k of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']) {
    if (!env[k]) throw new Error(`Thiếu secret ${k}. Đặt bằng: npx wrangler secret put ${k}`);
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('Không lấy được access token: ' + JSON.stringify(j));
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

// ---- POST: lưu một lần tập ----------------------------------------------------------------------
async function handleSave(request, env, cors) {
  const data = JSON.parse(await request.text());
  if (env.APP_TOKEN && data.token !== env.APP_TOKEN) return json({ error: 'Sai APP_TOKEN.' }, 403, cors);

  const sessionId = (String(data.sessionId || '').replace(/[^\w-]/g, '_').slice(0, 120)) || ('s_' + Date.now());
  const token = await accessToken(env);

  // 1) thư mục con theo sessionId
  const folder = await driveCreateFolder(token, env.DRIVE_FOLDER_ID, sessionId);
  // 2) tải từng ảnh (tối đa 5)
  const links = [];
  for (const img of (Array.isArray(data.images) ? data.images : []).slice(0, 5)) {
    if (!img || !img.base64) continue;
    const f = await driveUploadJpeg(token, folder.id, `${(img.label || 'anh')}.jpg`, img.base64);
    if (f.id) links.push(`${img.label || 'anh'}: ${f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`}`);
  }
  // 3) một dòng vào Sheet
  await sheetAppend(token, env.SHEET_ID, [
    new Date().toISOString(), sessionId, data.exerciseName || '', data.bestScore ?? '',
    (Array.isArray(data.errors) ? data.errors : []).join('; '),
    folder.webViewLink || '', links.join('\n'),
  ]);

  return json({ ok: true, sessionId, folder: folder.webViewLink || folder.id, images: links.length }, 200, cors);
}

async function driveCreateFolder(token, parentId, name) {
  const res = await fetch(`${DRIVE}?fields=id,webViewLink&supportsAllDrives=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined }),
  });
  const j = await res.json();
  if (!j.id) throw new Error('Tạo thư mục lỗi: ' + JSON.stringify(j));
  return j;
}

async function driveUploadJpeg(token, folderId, name, dataUrl) {
  const bytes = base64ToBytes(String(dataUrl).replace(/^data:[^,]*,/, ''));
  const boundary = '----gdtc' + Math.random().toString(36).slice(2);
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`
    + `${JSON.stringify({ name, parents: [folderId] })}\r\n`
    + `--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`);
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0); body.set(bytes, head.length); body.set(tail, head.length + bytes.length);
  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const j = await res.json();
  if (!j.id) throw new Error('Tải ảnh lỗi: ' + JSON.stringify(j));
  return j;
}

async function sheetAppend(token, sheetId, row) {
  const url = `${SHEETS}/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) throw new Error('Ghi Sheet lỗi: ' + (await res.text()).slice(0, 300));
}

// ---- GET: đọc dữ liệu về (chỉ khi có ?token=ADMIN_TOKEN đúng) -----------------------------------
async function handleRead(request, env, cors) {
  const url = new URL(request.url);
  if (!env.ADMIN_TOKEN || url.searchParams.get('token') !== env.ADMIN_TOKEN) {
    return json({ error: 'Cần ?token=<ADMIN_TOKEN> đúng để đọc dữ liệu.' }, 403, cors);
  }
  const token = await accessToken(env);
  const res = await fetch(`${SHEETS}/${env.SHEET_ID}/values/A1:G100000`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await res.json();
  return json({ ok: true, rows: j.values || [] }, 200, cors);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
