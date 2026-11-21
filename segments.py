"""縦型ショートの切り出し区間を決める（script.json の short:true の行だけを使う）。
画（Remotion）と音（mix.py）の両方が short_segments.json を見る。"""
import json
from pathlib import Path
ROOT = Path(__file__).parent
T = json.loads((ROOT / "timing.json").read_text())
PRE, POST, MERGE = 0.12, 0.22, 0.7
segs = []
for ln in T["lines"]:
    if not ln["short"]: continue
    a, b = ln["start"] - PRE, ln["start"] + ln["dur"] + POST
    if segs and a - segs[-1][1] < MERGE: segs[-1][1] = b
    else: segs.append([a, b])
segs[0][0] = 0.0
segs[-1][1] = T["total"]  # 最後はクレジットまで
out = [{"src": round(a, 3), "len": round(b - a, 3)} for a, b in segs]
(ROOT / "short_segments.json").write_text(json.dumps(out, indent=1))
print(len(out), "segments, total", round(sum(s["len"] for s in out), 2), "s")
for s in out: print(s)
