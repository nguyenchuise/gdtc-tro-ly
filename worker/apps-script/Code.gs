/**
 * Google Apps Script — nhận kết quả tự tập từ trang GDTC, ghi vào Google Sheet và lưu ảnh vào Drive.
 *
 * Ưu điểm so với Cloudflare Worker: KHÔNG cần client id / client secret / refresh token.
 * Script chạy bằng chính quyền của tài khoản triển khai, nên chỉ cần bấm "Cho phép" một lần.
 *
 * Cài: xem worker/apps-script/README.md
 */

var SHEET_ID = '1LAAjFZbhnjNHcLCVVaThXYEDfFBTB5JyI39I4iN-X4I';
var FOLDER_ID = '1-Ci9d3KPkmW6WjWV3GRtJqaqk7y-fUBT';

/** Mở địa chỉ .../exec trên trình duyệt sẽ chạy hàm này — dùng để kiểm tra đã triển khai đúng chưa. */
function doGet() {
  return json({ ok: true, note: 'San sang nhan ket qua (POST).' });
}

/** Trang gửi kết quả về đây. */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var name = String(d.sessionId || ('s_' + Date.now())).replace(/[^\w-]/g, '_').slice(0, 120);

    // 1) Thư mục riêng cho lần tập này
    var folder = DriveApp.getFolderById(FOLDER_ID).createFolder(name);

    // 2) Lưu từng ảnh (tối đa 5)
    var images = d.images || [];
    var links = [];
    for (var i = 0; i < Math.min(images.length, 5); i++) {
      var img = images[i] || {};
      if (!img.base64) continue;
      var b64 = String(img.base64).replace(/^data:[^,]*,/, '');
      var label = img.label || ('anh_' + (i + 1));
      var file = folder.createFile(
        Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', label + '.jpg'));
      links.push(label + ': ' + file.getUrl());
    }

    // 3) Một dòng trong Sheet
    SpreadsheetApp.openById(SHEET_ID).getSheets()[0].appendRow([
      new Date(),
      name,
      d.exerciseName || '',
      d.bestScore == null ? '' : d.bestScore,
      (d.errors || []).join('; '),
      folder.getUrl(),
      links.join('\n')
    ]);

    return json({ ok: true, sessionId: name, images: links.length });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
