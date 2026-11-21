import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, MONO, SANS, TT, s2f, ip, scene, TOTAL_F, Layout, OUT, INOUT} from './lib';
import {FR} from './World';

// ───────── 見出し（動く文字） ─────────
type HL = {at: number; until: number; text: string; accent?: string[]};
const HEADS: HL[] = [
	{at: FR.hookSlam, until: FR.flood, text: '1 database.'},
	{at: FR.flood, until: FR.wallIn, text: '12 → 12,000 queries/sec', accent: ['12,000']},
	{at: FR.d1, until: FR.d2, text: 'Traffic ×2', accent: ['×2']},
	{at: FR.d2, until: FR.chart, text: 'Traffic ×4', accent: ['×4']},
	{at: FR.chart, until: FR.scaleIn, text: 'p99 latency ↑', accent: ['↑']},
	{at: FR.scaleIn + 4, until: FR.ceiling, text: 'Scale up.'},
	{at: FR.ceiling, until: FR.split, text: '…until you can’t.', accent: ['can’t.']},
	{at: FR.split, until: FR.router, text: 'Split the data.', accent: ['Split']},
	{at: FR.router, until: FR.spread, text: 'Route by key.', accent: ['key.']},
	{at: FR.spread, until: FR.addShard, text: 'Scale out.', accent: ['out.']},
	{at: FR.addShard, until: FR.live, text: '+1 shard.', accent: ['+1']},
	{at: FR.live, until: FR.vitess, text: 'Reshard. Live.', accent: ['Live.']},
	{at: FR.vitess, until: FR.outroIn, text: 'Vitess', accent: []},
	{at: FR.outroIn, until: FR.never, text: 'One database → many.', accent: ['many.']},
	{at: FR.never, until: FR.credit, text: 'Your app never notices.', accent: ['never']},
];

const Headline: React.FC<{layout: Layout}> = ({layout}) => {
	const f = useCurrentFrame();
	const v = layout === 'v';
	return (
		<>
			{HEADS.map((hd, k) => {
				if (f < hd.at - 2 || f > hd.until + 8) return null;
				const out = ip(f, hd.until, hd.until + 6, 0, 1, INOUT);
				const words = hd.text.split(' ');
				// 数を数え上げる（12 → 12,000）
				const counting = hd.text.startsWith('12 →');
				return (
					<div key={k} style={{
						position: 'absolute', left: v ? 70 : 120, top: v ? 250 : 92, width: v ? 940 : 1680,
						fontFamily: SANS, fontWeight: 800, fontSize: v ? 104 : 92, letterSpacing: -3, lineHeight: 1.02,
						color: C.ink, opacity: 1 - out, transform: `translateY(${-out * 18}px)`,
					}}>
						{words.map((w, i) => {
							const t0 = hd.at + i * 3;
							const p = ip(f, t0, t0 + 12, 0, 1, OUT);
							let txt = w;
							if (counting && w === '12,000') txt = Math.round(ip(f, hd.at + 4, hd.at + 26, 12, 12000, (x) => x * x)).toLocaleString('en-US');
							const acc = hd.accent?.includes(w);
							return (
								<span key={i} style={{
									display: 'inline-block', marginRight: '0.24em', opacity: p,
									transform: `translateY(${(1 - p) * 40}px)`, color: acc ? C.ok : C.ink,
									fontVariantNumeric: 'tabular-nums',
								}}>{txt}</span>
							);
						})}
						{hd.text === 'Vitess' && (
							<div style={{fontFamily: MONO, fontSize: v ? 34 : 30, fontWeight: 600, color: C.dim, letterSpacing: 2, marginTop: 14, opacity: ip(f, hd.at + 6, hd.at + 14, 0, 1)}}>
								OPEN-SOURCE SHARDING FOR MYSQL
							</div>
						)}
					</div>
				);
			})}
		</>
	);
};

// ───────── 字幕（1語ずつ光る） ─────────
const Captions: React.FC<{layout: Layout}> = ({layout}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const v = layout === 'v';
	const ln = TT.lines.find((l: any) => t >= l.start - 0.05 && t < l.start + l.dur + 0.25);
	if (!ln) return null;
	const lt = t - ln.start;
	const o = ip(f, s2f(ln.start) - 2, s2f(ln.start) + 3, 0, 1) * ip(f, s2f(ln.start + ln.dur) + 2, s2f(ln.start + ln.dur + 0.25), 1, 0);
	return (
		<div style={{
			position: 'absolute', left: 0, right: 0, ...(v ? {top: 1230} : {bottom: 64}), display: 'flex', justifyContent: 'center', opacity: o,
		}}>
			<div style={{
				maxWidth: v ? 960 : 1500, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: v ? 58 : 44, lineHeight: 1.25,
				letterSpacing: -0.5, textShadow: '0 2px 18px rgba(0,0,0,0.9)',
			}}>
				{ln.words.map((w: any, i: number) => {
					const said = lt >= w.s;
					const active = lt >= w.s && lt < w.e + 0.05;
					return (
						<span key={i} style={{color: active ? C.ok : said ? C.ink : 'rgba(237,239,242,0.32)', marginRight: '0.26em', display: 'inline-block'}}>
							{w.w}
						</span>
					);
				})}
			</div>
		</div>
	);
};

// ───────── 章の札・進行バー・スペック表示 ─────────
const CHAPTERS: Record<string, string> = {
	hook: '01 · ONE DATABASE', wall: '02 · THE WALL', scaleup: '03 · SCALE UP', shard: '04 · SHARDING',
	result: '05 · SCALE OUT', catch: '06 · THE HARD PART', outro: '07 · RECAP',
};
const Chrome: React.FC<{layout: Layout}> = ({layout}) => {
	const f = useCurrentFrame();
	const v = layout === 'v';
	const sc = TT.scenes.find((s: any) => f >= s2f(s.start) && f < s2f(s.end)) || TT.scenes[0];
	const fadeAll = ip(f, FR.credit, FR.credit + 10, 1, 0);
	return (
		<div style={{opacity: fadeAll}}>
			<div style={{position: 'absolute', left: v ? 70 : 120, top: v ? 170 : 46, fontFamily: MONO, fontSize: v ? 26 : 22, fontWeight: 600, letterSpacing: 3, color: C.dim}}>
				{CHAPTERS[sc.id]}
			</div>
			<div style={{position: 'absolute', right: v ? 70 : 120, top: v ? 170 : 46, fontFamily: MONO, fontSize: v ? 22 : 18, fontWeight: 600, letterSpacing: 3, color: C.dim, border: `1.5px solid ${C.line}`, padding: '4px 10px', borderRadius: 6}}>
				SPEC PIECE
			</div>
			{!v && (
				<div style={{position: 'absolute', left: 120, right: 120, bottom: 30, height: 3, display: 'flex', gap: 6}}>
					{TT.scenes.map((s: any) => {
						const a = s2f(s.start), b = s2f(s.end);
						return (
							<div key={s.id} style={{flex: b - a, background: C.line, borderRadius: 2, overflow: 'hidden'}}>
								<div style={{width: `${ip(f, a, b, 0, 100, (x) => x)}%`, height: '100%', background: C.dim}} />
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

// ───────── 最後のクレジット ─────────
const Credit: React.FC<{layout: Layout}> = ({layout}) => {
	const f = useCurrentFrame();
	const v = layout === 'v';
	const o = ip(f, FR.credit + 4, FR.credit + 16, 0, 1);
	if (o <= 0) return null;
	return (
		<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, padding: v ? 70 : 0, textAlign: 'center'}}>
			<div style={{fontFamily: SANS, fontWeight: 800, fontSize: v ? 76 : 72, letterSpacing: -2, color: C.ink, lineHeight: 1.08}}>
				Why one database hits a wall
			</div>
			<div style={{fontFamily: SANS, fontWeight: 400, fontSize: v ? 44 : 40, color: C.dim, marginTop: 14}}>
				— and how <span style={{color: C.ok, fontWeight: 600}}>sharding</span> gets you past it
			</div>
			<div style={{fontFamily: MONO, fontSize: v ? 24 : 20, fontWeight: 600, letterSpacing: 2.5, color: C.dim, marginTop: 56, lineHeight: 1.9}}>
				SPEC PIECE · CONCEPT, ANIMATION & EDIT: MAEKEN<br />
				NOT AFFILIATED WITH OR ENDORSED BY PLANETSCALE
			</div>
		</div>
	);
};

export const Overlay: React.FC<{layout: Layout; captions?: boolean}> = ({layout, captions = true}) => (
	<>
		<Chrome layout={layout} />
		<Headline layout={layout} />
		{captions && <Captions layout={layout} />}
		<Credit layout={layout} />
	</>
);
