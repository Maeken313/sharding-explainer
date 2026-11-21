"""cues.json の時刻を秒で返す（Remotion の lib.ts cueSec と同じ規則）。mix.py と確認用が使う。"""
import json
from pathlib import Path
ROOT = Path(__file__).parent
T = json.loads((ROOT / "timing.json").read_text())
CU = json.loads((ROOT / "cues.json").read_text())["cues"]
L = {l["id"]: l for l in T["lines"]}; S = {s["id"]: s for s in T["scenes"]}
def cue_sec(c):
    if c["at"] in L:
        l = L[c["at"]]
        if "word" in c:
            w = next(w for w in l["words"] if w["w"] == c["word"])
            base = l["start"] + w["s"]
        else: base = l["start"]
    else: base = S[c["at"]]["start"]
    return base + c.get("off", 0)
CUES = {c["name"]: (cue_sec(c), c.get("sfx", "none")) for c in CU}
