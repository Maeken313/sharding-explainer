import {interpolate, interpolateColors, Easing} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import T from '../../timing.json';
import CU from '../../cues.json';

export const SANS = loadInter('normal', {weights: ['400', '600', '800', '900'], subsets: ['latin']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['400', '600', '700'], subsets: ['latin']}).fontFamily;

export const FPS = 30;
export const TT: any = T;
export const TOTAL_F = Math.round(TT.total * FPS);

export const C = {
	bg: '#0A0C0F',
	panel: '#11151B',
	panel2: '#171C24',
	line: '#262D37',
	ink: '#EDEFF2',
	dim: '#7C8590',
	ok: '#C6F432',
	warm: '#FFB020',
	hot: '#FF5A4E',
	blue: '#6EB4FF',
};

export const s2f = (s: number) => Math.round(s * FPS);
const L: any = Object.fromEntries(TT.lines.map((l: any) => [l.id, l]));
const S: any = Object.fromEntries(TT.scenes.map((s: any) => [s.id, s]));

// 効果音と同じ cues.json から、画が動くフレームを引く
export const cueSec = (name: string): number => {
	const c: any = (CU as any).cues.find((x: any) => x.name === name);
	if (!c) throw new Error('cue not found: ' + name);
	let base: number;
	if (L[c.at]) {
		const l = L[c.at];
		if (c.word) {
			const w = l.words.find((w: any) => w.w === c.word);
			if (!w) throw new Error(`word "${c.word}" not in ${c.at}`);
			base = l.start + w.s;
		} else base = l.start;
	} else if (S[c.at]) base = S[c.at].start;
	else throw new Error('bad at: ' + c.at);
	return base + (c.off || 0);
};
export const cf = (n: string) => s2f(cueSec(n));
export const scene = (id: string) => ({start: s2f(S[id].start), end: s2f(S[id].end)});

export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const ip = (f: number, a: number, b: number, x: number, y: number, e = OUT) =>
	interpolate(f, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
export const heatColor = (h: number) => interpolateColors(h, [0, 0.55, 1], [C.ok, C.warm, C.hot]);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Layout = 'h' | 'v';
