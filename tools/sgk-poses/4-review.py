"""Bảng soát: ảnh sách + hình nộm đã chuẩn hoá (đúng như trang sẽ vẽ, đã lật nếu nhìn trước)."""
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '..', '..')) + '/'
PAGES = _os.environ.get('SGK_PAGES', ROOT + 'tools/sgk-poses/pages')  # ảnh trang SGK p6/001.png… (KHÔNG đưa vào kho: bản quyền)
WORK = _os.path.join(_os.path.dirname(__file__), 'work') + '/'
_os.makedirs(WORK, exist_ok=True)
import json, sys
from PIL import Image, ImageDraw, ImageFont
OFF = {6: 1, 7: 1, 8: 0, 9: 2}
D = json.load(open(ROOT + 'data/sgk-poses.json'))
data = {e['id']: e for e in json.load(open(ROOT + 'data/exercises.json'))['exercises']}
order = D['order']
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
ids = [l for l in D['lessons'] if l.startswith(sys.argv[2])] if len(sys.argv) > 2 else list(D['lessons'])
B = [(11, 13), (13, 15), (12, 14), (14, 16), (23, 25), (25, 27), (24, 26), (26, 28), (11, 12), (23, 24), (27, 31), (28, 32)]
TH = 150
rows = []
for lid in ids:
    L = D['lessons'][lid]; g = int(lid[1]); tiles = []
    for k, (f, s) in enumerate(zip(data[lid]['bookAnim']['frames'], L['s'])):
        im = Image.open(f'{PAGES}/p{g}/{f["page"] + OFF[g]:03d}.png').convert('RGB')
        W, H = im.size; x, y, w, h = f['box']
        c = im.crop((int(x * W), int(y * H), int((x + w) * W), int((y + h) * H)))
        sc = TH / c.height; c = c.resize((max(1, min(260, int(c.width * sc))), TH))
        st = Image.new('RGB', (90, TH), '#eef4f1'); d = ImageDraw.Draw(st)
        if s:
            P = {order[i]: (s[2 * i], s[2 * i + 1]) for i in range(len(order))}
            ys = [p[1] for p in P.values()]; xs = [p[0] for p in P.values()]
            m = max(max(ys), max(abs(v) for v in xs) * 2) + 10
            mir = L['v'][k] == 'f'
            T = lambda p: (45 + (-p[0] if mir else p[0]) * 130 / m, TH - 8 - p[1] * 130 / m)
            for a, b in B:
                col = '#8aa79a' if L['v'][k] == 's' and ((L['far'][k] == 'L') == (a % 2 == 1)) else '#1f3a2e'
                d.line([T(P[a]), T(P[b])], fill=col, width=3)
            ms = ((P[11][0] + P[12][0]) / 2, (P[11][1] + P[12][1]) / 2); mh = ((P[23][0] + P[24][0]) / 2, (P[23][1] + P[24][1]) / 2)
            d.line([T(ms), T(mh)], fill='#1f3a2e', width=3)
            hx, hy = T(P['h']); d.ellipse([hx - 6, hy - 6, hx + 6, hy + 6], fill='#2B303A')
            d.text((2, 2), L['v'][k], fill='red', font=font)
        else:
            d.text((20, 60), '—', fill='gray', font=font)
        t = Image.new('RGB', (c.width + 92, TH + 16), 'white'); t.paste(c, (0, 16)); t.paste(st, (c.width + 2, 16))
        ImageDraw.Draw(t).text((2, 1), f"{k}:{f.get('label', '')}", fill='black', font=font)
        tiles.append(t)
    rows.append((lid, tiles))
Wt = 1800; out = []; 
for lid, tiles in rows:
    line = [[]]; cw = 0
    for t in tiles:
        if cw + t.width > Wt: line.append([]); cw = 0
        line[-1].append(t); cw += t.width + 6
    for i, r in enumerate(line):
        im = Image.new('RGB', (Wt, TH + 18 + (16 if i == 0 else 0)), 'white'); x = 0; yo = 16 if i == 0 else 0
        if i == 0: ImageDraw.Draw(im).text((2, 0), lid, fill='blue', font=font)
        for t in r: im.paste(t, (x, yo)); x += t.width + 6
        out.append(im)
S = Image.new('RGB', (Wt, sum(i.height for i in out) + 4), '#ccc'); y = 0
for i in out: S.paste(i, (0, y)); y += i.height
S.save(sys.argv[1]); print(S.size)
