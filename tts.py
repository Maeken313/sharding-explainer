"""script.json の各行を Kokoro TTS で読み上げ、行ごとの wav と timing.json を作る。
timing.json が映像（Remotion）・字幕（SRT）・音（mix.py）の唯一のタイミング元。"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).parent
S = json.loads((ROOT / "script.json").read_text())
voice = sys.argv[1] if len(sys.argv) > 1 else S["voice"]
k = Kokoro(str(ROOT / "tts/kokoro-v1.0.onnx"), str(ROOT / "tts/voices-v1.0.bin"))
out = ROOT / "audio/lines"; out.mkdir(parents=True, exist_ok=True)

LEAD = 0.6        # 冒頭の無音（最初の画が立ち上がる間）
SCENE_GAP = 0.55  # シーンの切り替わりの間
TAIL = 2.4        # 最後のクレジットの間
t = LEAD
timing = {"scenes": [], "lines": []}
for sc in S["scenes"]:
    start = t
    for ln in sc["lines"]:
        a, sr = k.create(ln.get("say", ln["text"]), voice=voice, speed=S["speed"], lang="en-us")
        # 頭とお尻の無音を削る
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - 600): nz[-1] + 1600]
        sf.write(out / f"{ln['id']}.wav", a, sr)
        d = len(a) / sr
        timing["lines"].append({"id": ln["id"], "scene": sc["id"], "text": ln["text"],
                                "short": ln["short"], "start": round(t, 3), "dur": round(d, 3)})
        t += d + S["gapAfter"]
    t += SCENE_GAP
    timing["scenes"].append({"id": sc["id"], "start": round(start, 3), "end": round(t, 3)})
timing["scenes"][-1]["end"] = round(t + TAIL, 3)
timing["total"] = round(t + TAIL, 3)
timing["sr"] = sr
(ROOT / "timing.json").write_text(json.dumps(timing, indent=1, ensure_ascii=False))
print("total", timing["total"])
for s in timing["scenes"]:
    print(s)
