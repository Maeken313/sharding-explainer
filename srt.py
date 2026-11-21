"""timing.json から英語字幕 SRT を書く（本編と縦型ショート）。長い行は2行に折る。"""
import json, textwrap
from pathlib import Path
ROOT = Path(__file__).parent
T = json.loads((ROOT / "timing.json").read_text())
SEG = json.loads((ROOT / "short_segments.json").read_text())
ts = lambda t: f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round((t%1)*1000)) % 1000:03d}"
def write(path, items, width):
    out = []
    for i, (a, b, txt) in enumerate(items, 1):
        out.append(f"{i}\n{ts(a)} --> {ts(b)}\n" + "\n".join(textwrap.wrap(txt, width)) + "\n")
    path.write_text("\n".join(out)); print(path.name, len(items))
write(ROOT / "out/main_en.srt", [(l["start"], l["start"] + l["dur"] + 0.2, l["text"]) for l in T["lines"]], 52)
items, acc = [], 0.0
for s in SEG:
    for l in T["lines"]:
        if l["short"] and s["src"] <= l["start"] < s["src"] + s["len"]:
            a = acc + l["start"] - s["src"]; items.append((a, min(acc + s["len"], a + l["dur"] + 0.2), l["text"]))
    acc += s["len"]
write(ROOT / "out/short_en.srt", items, 32)
