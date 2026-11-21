"""メイキング動画の音：mix.py の音楽と効果音を使い、mk.json の時刻に置く。前後比較の動画が流れる間は音楽を下げる。"""
import json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
from mix import SFX, SR, music, place

ROOT = Path(__file__).parent
K = json.loads((ROOT / "mk.json").read_text())
n = int(K["total"] * SR)
mus = music(K["total"], lambda t: 0.6)
g = np.ones(n); a, b = int(K["before"] * SR), int((K["after"] + K["clipLen"]) * SR); fd = int(0.3 * SR)
g[a:b] = 0.0; g[a - fd:a] = np.linspace(1, 0, fd); g[b:b + fd] = np.linspace(0, 1, fd)
mus *= g
sfx = np.zeros(n)
for key in ("pipeline", "code", "change", "qa", "fixed", "numbers", "outro"):
    place(sfx, SFX["whoosh"], K[key] - 0.1, 0.5)
place(sfx, SFX["impactSoft"], 0.2, 0.8)
for i in range(6): place(sfx, SFX["tick"], K["pipeline"] + (18 + i * 14 + 6) / 30, 0.6)
place(sfx, SFX["click"], K["code"] + 1.3, 0.6)
place(sfx, SFX["impact"], K["changeDone"] + 0.1, 0.6)
place(sfx, SFX["hit"], K["qa"] + 1.0, 0.4)
place(sfx, SFX["pop"], K["qa"] + 1.3, 0.6)
place(sfx, SFX["swoosh"], K["qa"] + 2.8, 0.4)
place(sfx, SFX["pop"], K["fixed"] + 0.8, 0.5); place(sfx, SFX["pop"], K["fixed"] + 4.4, 0.5)
for i in range(3): place(sfx, SFX["tick"], K["numbers"] + 0.8 + 0.6 * i, 0.6)
place(sfx, SFX["chime"], K["outro"] + 0.2, 0.7)
mix = mus * 0.6 + sfx * 0.8
raw = ROOT / "audio/mk_raw.wav"; sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")
out = ROOT / "anim/public/mk/mk_mix.wav"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", "loudnorm=I=-18:TP=-2", "-ar", str(SR), "-c:a", "pcm_s24le", str(out)], check=True)
print("ok")
