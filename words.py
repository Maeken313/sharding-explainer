"""各行のナレーション wav を Whisper にかけて、単語ごとの時刻を取る（字幕を1語ずつ光らせるため）。
同時に、読み上げが台本どおりかを確かめる（ずれた行は表示する）。
単語の文字は台本のほうを使い、時刻だけ Whisper から借りる。"""
import json, re
from pathlib import Path
from faster_whisper import WhisperModel
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).parent
T = json.loads((ROOT / "timing.json").read_text())
m = WhisperModel("small.en", device="cpu", compute_type="int8")
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

for ln in T["lines"]:
    a, sr = sf.read(ROOT / f"audio/lines/{ln['id']}.wav", dtype="float32")
    a = resample_poly(a, 16000, sr).astype("float32")
    segs, _ = m.transcribe(a, word_timestamps=True, language="en")
    heard = [w for s in segs for w in s.words]
    script_words = ln["text"].replace("—", " — ").split()
    script_words = [w for w in script_words if w != "—"]
    heard_txt = " ".join(w.word.strip() for w in heard)
    if [norm(w) for w in script_words] != [norm(w.word) for w in heard]:
        print(f"[{ln['id']}] 台本: {ln['text']}\n      聞こえた: {heard_txt}")
    # 台本の単語に時刻を割り当てる（数が合えばそのまま、合わなければ文字数で按分）
    if len(heard) == len(script_words):
        ws = [{"w": sw, "s": round(h.start, 3), "e": round(h.end, 3)} for sw, h in zip(script_words, heard)]
    else:
        n, m2 = len(script_words), len(heard); ws = []
        for i, sw in enumerate(script_words):
            h0 = heard[min(m2 - 1, round(i * m2 / n))]; h1 = heard[min(m2 - 1, round((i + 1) * m2 / n) - 1)]
            ws.append({"w": sw, "s": round(h0.start, 3), "e": round(max(h0.end, h1.end), 3)})
    ln["words"] = ws

(ROOT / "timing.json").write_text(json.dumps(T, indent=1, ensure_ascii=False))
print("ok")
