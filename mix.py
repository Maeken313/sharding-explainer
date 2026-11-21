"""音をすべてコードで作って混ぜる。
- 効果音：cues.json の時刻に、合成した音を置く（画の動きと同じ時刻）
- 音楽：96BPM の控えめなパルスとパッド。シーンごとに強さを変え、分割の瞬間だけ抜く
- ナレーション：timing.json の時刻に置き、その間は音楽を下げる（ダッキング）
本編（main）と縦型ショート（short）の両方を書き出し、本編は DaVinci 用に音の素材（stem）も分けて出す。"""
import json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
from cues import CUES, T

ROOT = Path(__file__).parent
SR = 48000
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR

def env(n, a=0.005, r=0.2, curve=4):
    a_n = max(1, int(a * SR)); x = np.ones(n)
    x[:a_n] = np.linspace(0, 1, a_n)
    x[a_n:] = np.exp(-curve * np.linspace(0, 1, n - a_n) * (n - a_n) / SR / max(r, 1e-3))
    return x

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, hi, order=2):
    return sosfilt(butter(order, hi, btype="low", fs=SR, output="sos"), x)
def hp(x, lo, order=2):
    return sosfilt(butter(order, lo, btype="high", fs=SR, output="sos"), x)

# ───────── 効果音 ─────────
def sweep_noise(d, f0, f1, gain=1.0):
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        fc = f0 + (f1 - f0) * (i / n)
        out[i:i + seg] = bp(x[i:i + seg + 2048], max(60, fc * 0.6), min(18000, fc * 1.6))[:len(out[i:i + seg])]
    w = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return out * w * gain

def sine_drop(d, f0, f1, curve=6):
    tt = t_(d); f = f1 + (f0 - f1) * np.exp(-curve * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

def blip(f, d=0.06, decay=40):
    tt = t_(d); return np.sin(2 * np.pi * f * tt) * np.exp(-decay * tt)

def add(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)

SFX = {}
SFX["impact"] = 0.9 * sine_drop(0.7, 160, 42) * env(int(0.7 * SR), 0.002, 0.5) + 0.25 * lp(rng.standard_normal(int(0.7 * SR)), 2500) * env(int(0.7 * SR), 0.001, 0.08)
SFX["impactSoft"] = 0.5 * SFX["impact"]
r = t_(1.4); SFX["rise"] = 0.35 * sweep_noise(1.4, 300, 6000) + 0.12 * np.sin(2 * np.pi * (200 + 500 * r / 1.4) * r) * (r / 1.4)
r = t_(0.8); SFX["riseShort"] = 0.3 * sweep_noise(0.8, 500, 5000)
SFX["whoosh"] = 0.45 * sweep_noise(0.55, 2500, 400)
SFX["swoosh"] = 0.45 * sweep_noise(0.7, 600, 5000)
SFX["tick"] = add(0.5 * blip(1800, 0.05, 70), 0.2 * blip(3600, 0.03, 90))
SFX["ticks"] = np.concatenate([np.pad(0.35 * blip(1500 + 120 * i, 0.05, 80), (0, int(0.2 * SR) - int(0.05 * SR))) for i in range(8)])
r = t_(1.2); SFX["draw"] = 0.12 * np.sin(2 * np.pi * (300 + 500 * r) * r) * env(len(r), 0.05, 1.2, 2)
SFX["hit"] = 0.7 * sine_drop(0.45, 110, 55) * env(int(0.45 * SR), 0.002, 0.35) + 0.3 * bp(rng.standard_normal(int(0.45 * SR)), 800, 3000) * env(int(0.45 * SR), 0.001, 0.05)
SFX["thump"] = np.concatenate([np.pad(0.6 * sine_drop(0.25, 120 + 30 * i, 50) * env(int(0.25 * SR), 0.002, 0.2), (0, int(0.05 * SR))) for i in range(3)])
n = int(1.2 * SR); r = t_(1.2)
SFX["clang"] = (0.5 * sine_drop(1.2, 140, 50) * env(n, 0.002, 0.6) +
               0.18 * sum(np.sin(2 * np.pi * fr * r) for fr in (523, 790, 1187)) * env(n, 0.001, 0.9, 3))
SFX["split"] = np.pad(0.55 * sweep_noise(0.5, 6000, 300), (0, int(0.1 * SR))) + 0.8 * sine_drop(0.6, 200, 45) * env(int(0.6 * SR), 0.002, 0.4)
SFX["slice"] = np.concatenate([np.pad(0.25 * hp(sweep_noise(0.12, 4000, 9000), 2000), (0, int(0.05 * SR))) for _ in range(4)])
SFX["click"] = add(0.5 * blip(2400, 0.03, 120), 0.4 * blip(1200, 0.05, 80))
SFX["ping"] = np.concatenate([np.pad(0.35 * add(blip(1320, 0.3, 12), 0.5 * blip(1980, 0.25, 16)), (0, int(0.37 * SR) - int(0.3 * SR))) for _ in range(3)])
SFX["pop"] = 0.6 * sine_drop(0.18, 900, 300, 25) * env(int(0.18 * SR), 0.002, 0.12)
r = t_(1.8); SFX["chime"] = 0.22 * sum(np.sin(2 * np.pi * fr * r) * np.exp(-k * r) for fr, k in ((880, 2.2), (1318.5, 2.8), (1760, 3.4)))
for k in SFX: SFX[k] = np.asarray(SFX[k], dtype=np.float64)

# ───────── 音楽 ─────────
BPM = 96; BEAT = 60 / BPM
CHORDS = [(57, 60, 64), (53, 57, 60), (48, 55, 60), (55, 59, 62)]  # Am F C G（MIDI）
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

def music(total, energy, drop_at=None):
    n = int(total * SR); out = np.zeros(n); tt = t_(total)
    bar = 4 * BEAT
    # パッド
    pad = np.zeros(n)
    for ci in range(int(total / bar) + 1):
        a = int(ci * bar * SR); b = min(n, int((ci + 1) * bar * SR) + int(0.3 * SR))
        if a >= n: break
        seg = tt[a:b] - tt[a]
        ch = CHORDS[ci % 4]; s = np.zeros(b - a)
        for m in ch:
            for det in (-0.08, 0.08):
                s += np.sin(2 * np.pi * mtof(m) * (1 + det / 100) * seg) + 0.3 * np.sin(2 * np.pi * mtof(m) * 2 * seg)
        s *= np.minimum(1, seg / 0.4) * np.minimum(1, (seg[-1] - seg + 1e-3) / 0.3)
        pad[a:b] += s / 12
    out += lp(pad, 2200) * 0.5
    # キックとハイハットとベース
    beats = int(total / BEAT) + 1
    kick = sine_drop(0.35, 130, 45, 18) * env(int(0.35 * SR), 0.002, 0.3)
    hat = hp(rng.standard_normal(int(0.04 * SR)), 7000) * env(int(0.04 * SR), 0.001, 0.03)
    for i in range(beats):
        tb = i * BEAT; a = int(tb * SR)
        e = energy(tb)
        if drop_at and drop_at[0] <= tb < drop_at[1]: continue
        if a + len(kick) < n and e > 0.35: out[a:a + len(kick)] += 0.55 * kick * min(1, (e - 0.35) * 2.5)
        for h in (0, 0.5):
            ah = int((tb + h * BEAT) * SR)
            if ah + len(hat) < n and e > 0.55: out[ah:ah + len(hat)] += 0.10 * hat * (0.6 if h == 0 else 1)
        ci = int(tb / bar) % 4; root = mtof(CHORDS[ci][0] - 24)
        bl = int(BEAT * 0.9 * SR)
        if a + bl < n and e > 0.25:
            sb = t_(BEAT * 0.9); out[a:a + bl] += 0.22 * np.tanh(2 * np.sin(2 * np.pi * root * sb)) * env(bl, 0.01, 0.5, 2) * e
    en = np.array([energy(x) for x in tt[::480]]); en = np.repeat(en, 480)[:n]
    out *= 0.35 + 0.65 * en
    if drop_at:
        a, b = int(drop_at[0] * SR), int(drop_at[1] * SR); fade = int(0.08 * SR)
        g = np.ones(n); g[a:b] = 0.12; g[a - fade:a] = np.linspace(1, 0.12, fade); g[b:b + fade] = np.linspace(0.12, 1, fade)
        out *= g
    out[:int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
    out[-int(2.0 * SR):] *= np.linspace(1, 0, int(2.0 * SR))
    return out

def scene_energy(t):
    sc = {s["id"]: s for s in T["scenes"]}
    lv = {"hook": 0.3, "wall": 0.7, "scaleup": 0.85, "shard": 0.75, "result": 0.9, "catch": 0.8, "outro": 0.6}
    for s in T["scenes"]:
        if s["start"] <= t < s["end"]: return lv[s["id"]]
    return 0.5

# ───────── 組み立て ─────────
def place(buf, x, at, gain=1.0):
    a = int(at * SR)
    if a < 0: x = x[-a:]; a = 0
    b = min(len(buf), a + len(x)); buf[a:b] += gain * x[:b - a]

def load_line(lid):
    a, sr = sf.read(ROOT / f"audio/lines/{lid}.wav", dtype="float64")
    return resample_poly(a, SR, sr)

def build(total, lines, cues, energy, drop):
    nar = np.zeros(int(total * SR)); sfx = np.zeros_like(nar)
    for lid, at in lines: place(nar, load_line(lid), at)
    for name, (at, kind) in cues.items():
        if kind != "none": place(sfx, SFX[kind], at, 0.55)
    mus = music(total, energy, drop)
    # ダッキング：声がある間は音楽を -9dB
    v = np.abs(nar); k = int(0.02 * SR)
    vs = np.convolve(v, np.ones(k) / k, mode="same")
    duck = np.where(vs > 0.01, 1.0, 0.0)
    k2 = int(0.25 * SR); duck = np.convolve(duck, np.ones(k2) / k2, mode="same")
    mus *= 1 - 0.65 * duck
    return nar, sfx, mus

def write_mix(name, nar, sfx, mus, stems=False):
    mix = nar * 1.0 + sfx * 0.8 + mus * 0.55
    raw = ROOT / f"audio/{name}_raw.wav"; sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")
    out = ROOT / f"audio/{name}_mix.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=9",
                    "-ar", str(SR), "-c:a", "pcm_s24le", str(out)], check=True)
    if stems:
        for nm, x in (("narration", nar), ("sfx", sfx * 0.8), ("music", mus * 0.55)):
            sf.write(ROOT / f"audio/stem_{nm}.wav", x.astype(np.float32), SR, subtype="PCM_24")
    print(name, "ok", round(len(mix) / SR, 2), "s")

def main():
    # 本編
    tot = T["total"]
    split_t = CUES["split"][0]
    nar, sfx, mus = build(tot, [(l["id"], l["start"]) for l in T["lines"]], CUES, scene_energy, (split_t - 0.05, split_t + 0.55))
    write_mix("main", nar, sfx, mus, stems=True)

    # 縦型ショート：区間を詰めて置き直す（音楽は通しで作り直す）
    SEG = json.loads((ROOT / "short_segments.json").read_text())
    remap = lambda t: next((acc + (t - s["src"]) for s, acc in zip(SEG, np.cumsum([0] + [x["len"] for x in SEG])[:-1])
                            if s["src"] <= t < s["src"] + s["len"]), None)
    stot = sum(s["len"] for s in SEG)
    s_lines = [(l["id"], remap(l["start"])) for l in T["lines"] if l["short"] and remap(l["start"]) is not None]
    s_cues = {k: (remap(v[0]), v[1]) for k, v in CUES.items() if remap(v[0]) is not None}
    src_energy = lambda t: scene_energy(next((s["src"] + (t - acc) for s, acc in zip(SEG, np.cumsum([0] + [x["len"] for x in SEG])[:-1])
                                             if acc <= t < acc + s["len"]), 0))
    ss = remap(split_t)
    nar, sfx, mus = build(stot, s_lines, s_cues, src_energy, (ss - 0.05, ss + 0.55) if ss else None)
    write_mix("short", nar, sfx, mus)
    print("short lines", [x[0] for x in s_lines])


if __name__ == "__main__":
    main()
