"""Đọc chữ chú thích "Hình N. ..." của từng khung (OCR vùng cap) để làm lời thuyết minh từng bước."""
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '..', '..')) + '/'
PAGES = _os.environ.get('SGK_PAGES', ROOT + 'tools/sgk-poses/pages')  # ảnh trang SGK p6/001.png… (KHÔNG đưa vào kho: bản quyền)
WORK = _os.path.join(_os.path.dirname(__file__), 'work') + '/'
_os.makedirs(WORK, exist_ok=True)
import json, subprocess, re
from PIL import Image
OFF = {6: 1, 7: 1, 8: 0, 9: 2}
data = json.load(open(ROOT + 'data/exercises.json', encoding='utf-8'))
out = {}
seen = {}
for e in data['exercises']:
    if (e.get('scoring') or {}).get('mode') == 'sequence' or not e.get('bookAnim'): continue
    g = int(e['id'][1]); caps = []
    for f in e['bookAnim']['frames']:
        c = f.get('cap')
        if not c: caps.append(''); continue
        key = (g, f['page'], tuple(c))
        if key not in seen:
            im = Image.open(f'{PAGES}/p{g}/{f["page"] + OFF[g]:03d}.png').convert('L')
            W, H = im.size
            cr = im.crop((int(c[0]*W)-4, int(c[1]*H)-3, int((c[0]+c[2])*W)+4, int((c[1]+c[3])*H)+3))
            cr = cr.resize((cr.width*3, cr.height*3), Image.LANCZOS)
            cr.save(WORK + 'cap.png')
            t = subprocess.run(['tesseract', WORK + 'cap.png', '-', '-l', 'vie', '--psm', '6'], capture_output=True, text=True).stdout
            seen[key] = re.sub(r'\s+', ' ', t).strip()
        caps.append(seen[key])
    out[e['id']] = caps
json.dump(out, open(WORK + 'caps.json', 'w'), ensure_ascii=False, indent=0)
print(len(seen))
