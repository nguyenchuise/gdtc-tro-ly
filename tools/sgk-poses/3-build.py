"""Gộp kết quả nhận diện (cả khung + quét ô), chọn người, chuẩn hoá → /home/user/gdtc-tro-ly/data/sgk-poses.json.
Toạ độ: đơn vị thân người (thân ≈ 50), y hướng lên, chân thấp nhất chạm đất y = 0, tâm hông x = 0."""
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '..', '..')) + '/'
PAGES = _os.environ.get('SGK_PAGES', ROOT + 'tools/sgk-poses/pages')  # ảnh trang SGK p6/001.png… (KHÔNG đưa vào kho: bản quyền)
WORK = _os.path.join(_os.path.dirname(__file__), 'work') + '/'
_os.makedirs(WORK, exist_ok=True)
import json, math, os, re
P = json.load(open(WORK + 'all.json'))
T = {}  # quét ô (tiles.json) cho kết quả sai nhiều khi soát bằng mắt → không dùng
caps = json.load(open(WORK + 'caps.json'))
DROP = json.load(open(_os.path.join(_os.path.dirname(__file__), 'drop.json'))) if os.path.exists(_os.path.join(_os.path.dirname(__file__), 'drop.json')) else {}
data = {e['id']: e for e in json.load(open(ROOT + 'data/exercises.json', encoding='utf-8'))['exercises']}
ORDER = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32]
SEG = [((11, 13), .62), ((12, 14), .62), ((13, 15), .58), ((14, 16), .58), ((23, 25), .95), ((24, 26), .95), ((25, 27), .95), ((26, 28), .95)]

def ang(a, b, c):
    v1 = (a[0] - b[0], a[1] - b[1]); v2 = (c[0] - b[0], c[1] - b[1])
    n = math.hypot(*v1) * math.hypot(*v2)
    return 180 if not n else math.degrees(math.acos(max(-1, min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / n))))

def analyse(pts, asp, small=False):
    Q = {i: (pts[i][0] * asp, pts[i][1]) for i in range(33)}
    V = lambda i: pts[i][2]
    ms = ((Q[11][0] + Q[12][0]) / 2, (Q[11][1] + Q[12][1]) / 2); mh = ((Q[23][0] + Q[24][0]) / 2, (Q[23][1] + Q[24][1]) / 2)
    torso = math.hypot(ms[0] - mh[0], ms[1] - mh[1])
    # thước đo cơ thể bền với co ngắn phối cảnh: lấy giá trị lớn thứ hai trong các ước lượng
    est = sorted([torso] + [math.hypot(Q[a][0] - Q[b][0], Q[a][1] - Q[b][1]) / r for (a, b), r in SEG], reverse=True)
    S = max(est[1], torso)
    why = []
    core = sum(V(i) for i in (11, 12, 23, 24)) / 4
    if core < .55: why.append(f'core {core:.2f}')
    if S < (.035 if small else .1): why.append(f'nhỏ {S:.2f}')
    for (a, b), r in SEG:
        L = math.hypot(Q[a][0] - Q[b][0], Q[a][1] - Q[b][1])
        if L > 1.75 * r * S: why.append(f'dài {a}-{b} {L / S:.2f}')
    inside = sum(1 for i in ORDER[:13] if -.08 <= pts[i][0] <= 1.08 and -.08 <= pts[i][1] <= 1.08)
    if inside < 12: why.append(f'ra ngoài {13 - inside}')
    # đầu phải ở cách giữa vai một khoảng hợp lý (ảnh cận tay/vợt hay bị nhận bừa thành người)
    dn = math.hypot(Q[0][0] - ms[0], Q[0][1] - ms[1]) / max(S, 1e-6)
    if not (.12 <= dn <= 1.3) or V(0) < .6: why.append(f'đầu {dn:.2f}/{V(0):.2f}')
    ys = [Q[i][1] for i in ORDER]; xs = [Q[i][0] for i in ORDER]
    legs = max(V(25) + V(27), V(26) + V(28)) / 2
    if legs < .35: why.append(f'chân mờ {legs:.2f}')
    # mức "đang làm động tác": gối/khuỷu gập, tay giơ, thân ngả (người đứng xếp hàng ≈ 0)
    act = sum(180 - ang(Q[a], Q[b], Q[c]) for a, b, c in ((23, 25, 27), (24, 26, 28), (11, 13, 15), (12, 14, 16)))
    act += sum(ang(Q[a], Q[b], Q[c]) for a, b, c in ((23, 11, 13), (24, 12, 14)))
    act += 2 * math.degrees(math.atan2(abs(ms[0] - mh[0]), max(1e-6, mh[1] - ms[1])))
    return {'S': S, 'why': why, 'size': S * core, 'act': act, 'mh': mh, 'Q': Q, 'torso': torso}

def norm(pts, a, asp):
    Q, S = a['Q'], a['S']; s = 50 / S; cx, cy = a['mh']
    hx = (Q[7][0] + Q[8][0]) / 2 * .6 + Q[0][0] * .4; hy = (Q[7][1] + Q[8][1]) / 2 * .6 + Q[0][1] * .4
    xy = [((Q[i][0] - cx) * s, (cy - Q[i][1]) * s) for i in ORDER] + [((hx - cx) * s, (cy - hy) * s)]
    ground = min(y for _, y in xy[:-1])
    flat = []
    for x, y in xy: flat += [round(x, 1), round(y - ground, 1)]
    shw = abs(Q[11][0] - Q[12][0]) / S
    facing = 's' if shw < .62 else ('f' if Q[11][0] > Q[12][0] else 'b')
    vl = sum(pts[i][2] for i in (11, 13, 15, 23, 25, 27)); vr = sum(pts[i][2] for i in (12, 14, 16, 24, 26, 28))
    return flat, facing, 'L' if vl < vr else 'R'

out, report = {}, {}
for lid, frames in P.items():
    if not (data[lid].get('scoring') or {}).get('rules') and not (data[lid].get('scoring') or {}).get('reps'):
        continue
    S_, V_, F_, src = [], '', '', []
    for fr in frames:
        i = fr['i']; asp = fr['aspect']
        cand = [(p, analyse(p, asp)) for p in fr['people']]
        ok = [c for c in cand if not c[1]['why']]
        how = 'khung'
        if not ok and str(i) in T.get(lid, {}) and T[lid][str(i)]['aspect'] >= 1.0:
            t = T[lid][str(i)]
            cand = [(p, analyse(p, t['aspect'], small=True)) for p in t['people']]
            # quét ô chỉ nhận người NHỎ trong cảnh (ảnh cận cảnh mà quét ô thường bắt nhầm một phần cơ thể)
            ok = [c for c in cand if not c[1]['why'] and c[1]['S'] < .22]
            how = 'ô'
        if i in DROP.get(lid, []): ok = []
        if not ok:
            S_.append(None); V_ += '-'; F_ += '-'; src.append('')
            report.setdefault(lid, []).append(i)
            continue
        # nhiều người: khung thường → người to nhất; cảnh nhỏ (quét ô) → người đang làm động tác rõ nhất
        best = max(ok, key=(lambda c: c[1]['act'] * min(1, c[1]['size'] / (.5 * max(x[1]['size'] for x in ok)))) if how == 'ô' else (lambda c: c[1]['size']))
        flat, facing, far = norm(best[0], best[1], asp)
        S_.append(flat); V_ += facing; F_ += far; src.append(how)
    if sum(1 for x in S_ if x) < 2: continue  # cần ít nhất 2 tư thế mới thành chuyển động
    cl = []
    for c in caps.get(lid, []):
        c = re.sub(r'^Hình\s*\S*?\d+\.?\s*', '', c).strip(' .')
        cl.append(c)
    out[lid] = {'s': S_, 'v': V_, 'far': F_, 'cap': cl}
    report.setdefault(lid, [])
    report[lid] = {'miss': report[lid], 'src': ''.join({'khung': 'k', 'ô': 'o', '': '-'}[x] for x in src)}
doc = {'about': 'Tư thế bạn mẫu (hình nộm) lấy từ hình SGK: MediaPipe Pose nhận diện khớp trên từng khung bookAnim. '
                 'Sinh bằng tools/ (xem CHANGELOG 0.26.0). Thứ tự điểm: order + tâm đầu.', 'order': ORDER + ['h'], 'lessons': out}
s = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
open(ROOT + 'data/sgk-poses.json', 'w', encoding='utf-8').write(s)
json.dump(report, open(WORK + 'report2.json', 'w'), ensure_ascii=False, indent=0)
n = sum(len(v['s']) for v in out.values()); ok = sum(1 for v in out.values() for x in v['s'] if x)
print(len(out), 'bài;', ok, '/', n, 'khung có tư thế;', len(s) // 1024, 'KB')
