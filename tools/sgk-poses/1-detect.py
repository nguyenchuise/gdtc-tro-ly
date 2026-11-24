"""Nhận diện khớp (MediaPipe Pose) trên từng khung hình SGK đã cắt của các bài không phải thể dục."""
import os as _os
ROOT = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '..', '..')) + '/'
PAGES = _os.environ.get('SGK_PAGES', ROOT + 'tools/sgk-poses/pages')  # ảnh trang SGK p6/001.png… (KHÔNG đưa vào kho: bản quyền)
WORK = _os.path.join(_os.path.dirname(__file__), 'work') + '/'
_os.makedirs(WORK, exist_ok=True)
import json, sys
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

OFF = {6: 1, 7: 1, 8: 0, 9: 2}
MODEL = sys.argv[1] if len(sys.argv) > 1 else WORK + 'pose_landmarker_heavy.task'
OUT = sys.argv[2] if len(sys.argv) > 2 else WORK + 'all.json'
ONLY = set(sys.argv[3:])
data = json.load(open(ROOT + 'data/exercises.json', encoding='utf-8'))
opts = vision.PoseLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=MODEL),
                                    running_mode=vision.RunningMode.IMAGE, num_poses=4,
                                    min_pose_detection_confidence=0.3, min_pose_presence_confidence=0.3)
det = vision.PoseLandmarker.create_from_options(opts)
pages = {}
def page(g, p):
    k = (g, p)
    if k not in pages:
        pages[k] = Image.open(f'{PAGES}/p{g}/{p + OFF[g]:03d}.png').convert('RGB')
    return pages[k]

res = {}
for e in data['exercises']:
    sc = e.get('scoring') or {}
    if sc.get('mode') == 'sequence' or not e.get('bookAnim') or (ONLY and e['id'] not in ONLY):
        continue
    g = int(e['id'][1])
    out = []
    for fi, f in enumerate(e['bookAnim']['frames']):
        im = page(g, f['page'])
        W, H = im.size
        x, y, w, h = f['box']
        c = im.crop((int(x * W), int(y * H), int((x + w) * W), int((y + h) * H)))
        # phóng to + viền trắng để người nhỏ vẫn nhận ra
        s = 640 / max(c.size)
        c = c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.LANCZOS)
        pad = 80
        P = Image.new('RGB', (c.width + 2 * pad, c.height + 2 * pad), 'white')
        P.paste(c, (pad, pad))
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(P).copy()))
        people = []
        for lm in r.pose_landmarks:
            pts = [[round((l.x * P.width - pad) / c.width, 4), round((l.y * P.height - pad) / c.height, 4), round(l.visibility, 3)] for l in lm]
            people.append(pts)
        out.append({'i': fi, 'aspect': round(c.width / c.height, 3), 'people': people})
    res[e['id']] = out
    print(e['id'], [len(o['people']) for o in out], flush=True)
json.dump(res, open(OUT, 'w'))
