import React from 'react';
import {AbsoluteFill, useCurrentFrame, OffthreadVideo, Img, Audio, staticFile, Sequence} from 'remotion';
import {C, SANS, MONO, ip, OUT, INOUT} from './lib';
import MK from '../../mk.json';

const K: any = MK;
const f2 = (s: number) => Math.round(s * 30);
export const MK_FRAMES = f2(K.total);

const Bg = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.6px, transparent 1.6px)', backgroundSize: '44px 44px', backgroundPosition: `${f * 0.15}px ${f * 0.08}px`}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.65) 100%)'}} />
		</AbsoluteFill>
	);
};

// シーンの出入り
const Scene: React.FC<{a: number; b: number; children: any}> = ({a, b, children}) => {
	const f = useCurrentFrame();
	const A = f2(a), B = f2(b);
	if (f < A - 1 || f > B + 8) return null;
	const o = ip(f, A, A + 8, 0, 1) * ip(f, B - 2, B + 6, 1, 0, INOUT);
	return <AbsoluteFill style={{opacity: o, transform: `translateY(${(1 - ip(f, A, A + 12, 0, 1)) * 16}px)`}}>{children}</AbsoluteFill>;
};

const Words: React.FC<{text: string; at: number; size?: number; accent?: string[]; color?: string; weight?: number}> = ({text, at, size = 84, accent = [], color = C.ink, weight = 800}) => {
	const f = useCurrentFrame();
	return (
		<div style={{fontFamily: SANS, fontWeight: weight, fontSize: size, letterSpacing: -size * 0.035, lineHeight: 1.05, color}}>
			{text.split(' ').map((w, i) => {
				const p = ip(f, f2(at) + i * 3, f2(at) + i * 3 + 12, 0, 1, OUT);
				return <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: accent.includes(w) ? C.ok : undefined}}>{w}</span>;
			})}
		</div>
	);
};

const Label: React.FC<{children: any; color?: string; size?: number; style?: any}> = ({children, color = C.dim, size = 22, style}) => (
	<div style={{fontFamily: MONO, fontWeight: 600, fontSize: size, letterSpacing: 2.5, color, ...style}}>{children}</div>
);

const Panel: React.FC<{children: any; style?: any}> = ({children, style}) => (
	<div style={{background: C.panel, border: `1.5px solid ${C.line}`, borderRadius: 18, padding: '28px 34px', ...style}}>{children}</div>
);

const Top: React.FC<{chapter: string; children: any}> = ({chapter, children}) => (
	<div style={{position: 'absolute', left: 120, top: 70, right: 120}}>
		<Label style={{marginBottom: 22}}>{chapter}</Label>
		{children}
	</div>
);

// ───────── パイプライン図 ─────────
const NODES = [
	{t: 'script.json', s: 'the only source'},
	{t: 'Kokoro TTS', s: 'AI narration'},
	{t: 'Whisper', s: 'QA + word timings'},
	{t: 'cues.json', s: 'one timeline'},
	{t: 'Remotion + mix.py', s: 'picture + sound'},
	{t: '16:9 · 9:16', s: 'thumbs · SRT'},
];
const Pipeline = () => {
	const f = useCurrentFrame();
	const A = f2(K.pipeline);
	return (
		<div style={{position: 'absolute', left: 120, right: 120, top: 470, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
			{NODES.map((n, i) => {
				const t0 = A + 18 + i * 14;
				const p = ip(f, t0, t0 + 12, 0, 1);
				const lit = f >= t0 + 6;
				const last = i === NODES.length - 1;
				return (
					<React.Fragment key={i}>
						<div style={{opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.94 + 0.06 * p})`, width: 232, textAlign: 'center'}}>
							<div style={{border: `2px solid ${lit ? (last ? C.ok : C.ink) : C.line}`, background: C.panel, borderRadius: 16, padding: '26px 10px', boxShadow: last && lit ? `0 0 40px ${C.ok}33` : 'none'}}>
								<div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, color: last ? C.ok : C.ink}}>{n.t}</div>
							</div>
							<Label size={18} style={{marginTop: 16, letterSpacing: 1.5}}>{n.s}</Label>
						</div>
						{!last && (
							<div style={{flex: 1, height: 3, margin: '0 6px 34px', background: C.line, position: 'relative', overflow: 'hidden'}}>
								<div style={{position: 'absolute', inset: 0, background: C.ok, transformOrigin: 'left', transform: `scaleX(${ip(f, t0 + 8, t0 + 16, 0, 1)})`}} />
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};

// ───────── コード ─────────
const Code: React.FC<{lines: {t: string; c?: string; hi?: boolean}[]; at: number; title: string; style?: any}> = ({lines, at, title, style}) => {
	const f = useCurrentFrame();
	return (
		<Panel style={{padding: 0, overflow: 'hidden', ...style}}>
			<div style={{padding: '14px 24px', borderBottom: `1.5px solid ${C.line}`}}><Label size={18}>{title}</Label></div>
			<div style={{padding: '22px 26px'}}>
				{lines.map((l, i) => {
					const p = ip(f, f2(at) + 6 + i * 4, f2(at) + 14 + i * 4, 0, 1);
					return (
						<div key={i} style={{fontFamily: MONO, fontSize: 25, lineHeight: 1.65, whiteSpace: 'pre', opacity: p, color: l.c || C.ink,
							background: l.hi ? `${C.ok}1A` : 'transparent', borderLeft: l.hi ? `3px solid ${C.ok}` : '3px solid transparent', paddingLeft: 12}}>{l.t}</div>
					);
				})}
			</div>
		</Panel>
	);
};

// ───────── 前と後 ─────────
const Clip: React.FC<{src: string; label: string; color: string}> = ({src, label, color}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: 120}}>
		<div style={{width: 1120, position: 'relative'}}>
			<div style={{borderRadius: 14, overflow: 'hidden', border: `2px solid ${color}`, boxShadow: `0 0 60px ${color}22`}}>
				<OffthreadVideo src={staticFile(src)} style={{width: 1120, height: 630, display: 'block'}} />
			</div>
			<Label color={color} size={24} style={{position: 'absolute', left: 0, top: -44}}>{label}</Label>
		</div>
	</AbsoluteFill>
);

const Pair: React.FC<{a: string; b: string; la: string; lb: string; w: number; h: number; at: number}> = ({a, b, la, lb, w, h, at}) => {
	const f = useCurrentFrame();
	const pb = ip(f, f2(at) + 14, f2(at) + 24, 0, 1);
	return (
		<div style={{display: 'flex', gap: 60, justifyContent: 'center', alignItems: 'flex-start'}}>
			{[[a, la, C.hot, 1], [b, lb, C.ok, pb]].map(([src, l, col, o]: any, i) => (
				<div key={i} style={{opacity: o, transform: `translateX(${(1 - o) * 30}px)`}}>
					<Label color={col} size={22} style={{marginBottom: 14}}>{l}</Label>
					<div style={{width: w, height: h, borderRadius: 12, overflow: 'hidden', border: `2px solid ${col}`}}>
						<Img src={staticFile(src)} style={{width: w, height: h, objectFit: 'cover', display: 'block'}} />
					</div>
				</div>
			))}
		</div>
	);
};

const Stat: React.FC<{n: string; t: string; at: number}> = ({n, t, at}) => {
	const f = useCurrentFrame();
	const p = ip(f, f2(at), f2(at) + 12, 0, 1);
	return (
		<div style={{opacity: p, transform: `translateY(${(1 - p) * 24}px)`, flex: 1}}>
			<div style={{fontFamily: SANS, fontWeight: 900, fontSize: 112, letterSpacing: -4, color: C.ok, lineHeight: 1}}>{n}</div>
			<div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.ink, marginTop: 14, lineHeight: 1.25}}>{t}</div>
		</div>
	);
};

export const MakingOf: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Bg />
			<div style={{position: 'absolute', right: 120, top: 70, fontFamily: MONO, fontSize: 18, fontWeight: 600, letterSpacing: 3, color: C.dim, border: `1.5px solid ${C.line}`, padding: '4px 10px', borderRadius: 6, opacity: ip(f, f2(K.outro), f2(K.outro) + 8, 1, 0)}}>
				MAKING-OF
			</div>

			{/* 1. タイトル */}
			<Scene a={K.title} b={K.pipeline}>
				<AbsoluteFill style={{justifyContent: 'center', paddingLeft: 120}}>
					<Label style={{marginBottom: 26}}>MAKING-OF · “WHY ONE DATABASE HITS A WALL”</Label>
					<Words text="How this was made." at={0.2} size={128} accent={['made.']} />
					<div style={{marginTop: 30}}>
						<Words text="No stock footage. No templates. One script file." at={1.2} size={44} weight={600} color={C.dim} />
					</div>
				</AbsoluteFill>
			</Scene>

			{/* 2. パイプライン */}
			<Scene a={K.pipeline} b={K.code}>
				<Top chapter="01 · THE PIPELINE"><Words text="One script file drives everything." at={K.pipeline + 0.1} accent={['everything.']} /></Top>
				<Pipeline />
				<div style={{position: 'absolute', left: 120, bottom: 110, opacity: ip(f, f2(K.pipeline + 5.5), f2(K.pipeline + 6.2), 0, 1)}}>
					<Words text="Edit the script → voice, captions, motion and sound all follow." at={K.pipeline + 5.5} size={36} weight={600} color={C.dim} />
				</div>
			</Scene>

			{/* 3. コード */}
			<Scene a={K.code} b={K.change}>
				<Top chapter="02 · ONE TIMELINE"><Words text="Picture and sound read the same line." at={K.code + 0.1} accent={['same']} /></Top>
				<div style={{position: 'absolute', left: 120, right: 120, top: 330, display: 'flex', gap: 40}}>
					<Code at={K.code + 0.4} title="script.json" style={{flex: 1}} lines={[
						{t: '{"id": "l8",', c: C.dim},
						{t: ' "text": "So you split the data."}', hi: true},
						{t: '{"id": "l9",', c: C.dim},
						{t: ' "text": "Sharding cuts one huge table…"}'},
					]} />
					<Code at={K.code + 1.2} title="cues.json" style={{flex: 1.15}} lines={[
						{t: '{"name": "split",', c: C.ink},
						{t: ' "at": "l8", "word": "split",', hi: true},
						{t: ' "sfx": "split"}', c: C.ok},
						{t: '// the database splits AND the', c: C.dim},
						{t: '// sound hits on the word "split"', c: C.dim},
					]} />
				</div>
			</Scene>

			{/* 4. 1行変える */}
			<Scene a={K.change} b={K.before}>
				<Top chapter="03 · CHANGE ONE LINE"><Words text="Change one line." at={K.change + 0.1} accent={['one']} /></Top>
				<div style={{position: 'absolute', left: 120, right: 120, top: 360}}>
					<Code at={K.change + 0.3} title="script.json — l1" lines={[
						{t: '- "Every app starts with one database."', c: C.hot},
						{t: '+ "Every startup begins with one database."', c: C.ok, hi: true},
					]} />
					<div style={{marginTop: 40}}><Words text="…and re-run the pipeline." at={K.change + 1.4} size={44} weight={600} color={C.dim} /></div>
				</div>
			</Scene>
			<Sequence from={f2(K.before)} durationInFrames={f2(K.clipLen)}>
				<Clip src="mk/before.mp4" label="BEFORE" color={C.dim} />
			</Sequence>
			<Sequence from={f2(K.after)} durationInFrames={f2(K.clipLen)}>
				<Clip src="mk/after.mp4" label="AFTER — new voice, captions & timing, regenerated" color={C.ok} />
			</Sequence>
			<Scene a={K.changeDone} b={K.qa}>
				<AbsoluteFill style={{justifyContent: 'center', paddingLeft: 120}}>
					<Words text={`${Math.floor(K.variantSeconds / 60)} min ${K.variantSeconds % 60} s`} at={K.changeDone + 0.1} size={150} accent={['min', 's']} />
					<div style={{marginTop: 24}}><Words text="from edit to rendered video. Voice, QA, re-timing, sound." at={K.changeDone + 0.5} size={40} weight={600} color={C.dim} /></div>
				</AbsoluteFill>
			</Scene>

			{/* 5. 機械で検品 */}
			<Scene a={K.qa} b={K.fixed}>
				<Top chapter="04 · QA BY MACHINE"><Words text="Every line is checked by ear — a machine’s." at={K.qa + 0.1} size={76} accent={['checked']} /></Top>
				<div style={{position: 'absolute', left: 120, right: 120, top: 360}}>
					<Code at={K.qa + 0.4} title="whisper — l15" lines={[
						{t: 'script : …systems like Vitess were built for.'},
						{t: 'heard  : …systems like Vitis were built for.   ✗', c: C.hot},
						{t: 'fix    : say "Vi-tess" → regenerate → pass   ✓', c: C.ok, hi: true},
					]} />
					<div style={{marginTop: 46, opacity: ip(f, f2(K.qa + 2.6), f2(K.qa + 3.2), 0, 1)}}>
						<Label size={22} style={{marginBottom: 14}}>FINAL MIX · NARRATION RECOGNIZED OVER MUSIC + SFX</Label>
						<div style={{height: 18, background: C.line, borderRadius: 9, overflow: 'hidden', width: 1100}}>
							<div style={{height: '100%', width: `${ip(f, f2(K.qa + 2.8), f2(K.qa + 4.2), 0, 98.3)}%`, background: C.ok}} />
						</div>
						<div style={{fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.ok, marginTop: 12}}>{ip(f, f2(K.qa + 2.8), f2(K.qa + 4.2), 0, 98.3).toFixed(1)}%</div>
					</div>
				</div>
			</Scene>

			{/* 6. 静止画で見つけて、コードで直す */}
			<Scene a={K.fixed} b={K.fixed + 3.6}>
				<Top chapter="05 · CAUGHT ON STILLS, FIXED IN CODE"><Words text="Hook: title by 2 seconds." at={K.fixed + 0.1} size={72} accent={['2']} /></Top>
				<div style={{position: 'absolute', left: 0, right: 0, top: 370}}>
					<Pair a="mk/hook_before.png" b="mk/hook_after.png" la="BEFORE · 1.5 s — NO TITLE YET" lb="AFTER · TITLE AT 0.45 s" w={760} h={428} at={K.fixed} />
				</div>
			</Scene>
			<Scene a={K.fixed + 3.6} b={K.numbers}>
				<Top chapter="05 · CAUGHT ON STILLS, FIXED IN CODE"><Words text="Vertical: nothing clipped." at={K.fixed + 3.7} size={72} accent={['nothing']} /></Top>
				<div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
					<Pair a="mk/v_ceiling_before_crop.png" b="mk/v_ceiling_after_crop.png" la="BEFORE · LABEL HIDDEN BEHIND THE DB" lb="AFTER · LABEL CLEAR" w={600} h={400} at={K.fixed + 3.6} />
					<Pair a="mk/v_shards_before_crop.png" b="mk/v_shards_after_crop.png" la="BEFORE · LAST SHARD CUT OFF" lb="AFTER · ALL FIVE FIT" w={600} h={200} at={K.fixed + 4.4} />
				</div>
			</Scene>

			{/* 7. 数字 */}
			<Scene a={K.numbers} b={K.outro}>
				<AbsoluteFill style={{opacity: 0.07, filter: 'blur(2px)'}}>
					<Img src={staticFile('mk/contact.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + (f - f2(K.numbers)) * 0.0008})`}} />
				</AbsoluteFill>
				<Top chapter="06 · IN NUMBERS"><Words text="17 checkpoints reviewed as stills." at={K.numbers + 0.1} size={64} accent={['17']} /></Top>
				<div style={{position: 'absolute', left: 120, right: 120, top: 470, display: 'flex', gap: 60}}>
					<Stat n="~40 min" t="script → every format, first full cut" at={K.numbers + 0.8} />
					<Stat n="13 min" t="fix the hook, re-render every output" at={K.numbers + 1.4} />
					<Stat n="0" t="stock footage, templates or keyframes by hand" at={K.numbers + 2.0} />
				</div>
			</Scene>

			{/* 8. 終わり */}
			<Scene a={K.outro} b={K.total + 1}>
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
					<Label size={22} style={{marginBottom: 22}}>SOURCE CODE</Label>
					<Words text="github.com/Maeken313/sharding-explainer" at={K.outro + 0.2} size={60} weight={700} accent={['github.com/Maeken313/sharding-explainer']} />
					<div style={{marginTop: 60, opacity: ip(f, f2(K.outro + 1.2), f2(K.outro + 1.8), 0, 1)}}>
						<Label size={22} style={{lineHeight: 1.9}}>MADE BY MAEKEN, WITH CLAUDE AS PIPELINE ENGINEER<br />SPEC PIECE · NOT AFFILIATED WITH OR ENDORSED BY PLANETSCALE</Label>
					</div>
				</AbsoluteFill>
			</Scene>

			<Audio src={staticFile('mk/mk_mix.wav')} />
		</AbsoluteFill>
	);
};
