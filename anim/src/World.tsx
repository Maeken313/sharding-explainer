import React from 'react';
import {useCurrentFrame, random, interpolateColors} from 'remotion';
import {C, MONO, SANS, cf, scene, ip, heatColor, lerp, FPS, OUT, INOUT, TOTAL_F} from './lib';

// ───────── 時刻（すべて cues.json と timing.json から） ─────────
const F = {
	hookSlam: cf('hookSlam'), flood: cf('flood'), wallIn: cf('wallIn'), d1: cf('double1'), d2: cf('double2'),
	chart: cf('chart'), slowest: cf('slowest'), climb: cf('climb'), feel: cf('feel'),
	scaleIn: cf('scaleIn'), bigger: cf('bigger'), ceiling: cf('ceiling'),
	split: cf('split'), slice: cf('slice'), router: cf('router'), query: cf('query'),
	spread: cf('spread'), addShard: cf('addShard'), sideways: cf('sideways'),
	live: cf('live'), moving: cf('moving'), vitess: cf('vitess'),
	outroIn: cf('outroIn'), never: cf('never'), credit: cf('credit'),
};
export const FR = F;

// ───────── 形 ─────────
export const Cyl: React.FC<{x: number; y: number; w?: number; h?: number; s?: number; color: string; o?: number; glow?: number; fill?: number}> = ({
	x, y, w = 240, h = 200, s = 1, color, o = 1, glow = 0, fill = 0,
}) => {
	const rx = w / 2, ry = w * 0.15;
	const body = `M${-rx},${-h / 2} L${-rx},${h / 2} A${rx},${ry} 0 0 0 ${rx},${h / 2} L${rx},${-h / 2}`;
	return (
		<g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
			{glow > 0 && <ellipse cx={0} cy={0} rx={rx * 1.5} ry={h * 0.95} fill={color} opacity={0.18 * glow} filter="url(#soft)" />}
			<path d={body} fill={C.panel} stroke={color} strokeWidth={3 / s} />
			{fill > 0 && (
				<clipPath id={`cl${Math.round(x)}${Math.round(y)}`}>
					<path d={body} />
				</clipPath>
			)}
			{fill > 0 && (
				<rect x={-rx} y={h / 2 + ry - (h + ry) * fill} width={w} height={(h + ry) * fill} fill={color} opacity={0.22}
					clipPath={`url(#cl${Math.round(x)}${Math.round(y)})`} />
			)}
			{[-h / 6, h / 6].map((yy) => (
				<path key={yy} d={`M${-rx},${yy} A${rx},${ry} 0 0 0 ${rx},${yy}`} fill="none" stroke={color} strokeWidth={2 / s} opacity={0.45} />
			))}
			<ellipse cx={0} cy={-h / 2} rx={rx} ry={ry} fill={C.panel2} stroke={color} strokeWidth={3 / s} />
		</g>
	);
};

const Chip: React.FC<{x: number; y: number; text: string; color: string; o?: number; size?: number}> = ({x, y, text, color, o = 1, size = 26}) => {
	const w = text.length * size * 0.62 + 32;
	return (
		<g transform={`translate(${x},${y})`} opacity={o}>
			<rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={size * 0.5} fill={C.bg} stroke={color} strokeWidth={2} />
			<text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontSize={size} fill={color} fontWeight={600}>{text}</text>
		</g>
	);
};

const Mono: React.FC<{x: number; y: number; children: any; size?: number; color?: string; o?: number; anchor?: string; weight?: number; ls?: number}> = ({
	x, y, children, size = 24, color = C.dim, o = 1, anchor = 'middle', weight = 600, ls = 2,
}) => (
	<text x={x} y={y} textAnchor={anchor as any} fontFamily={MONO} fontSize={size} fill={color} opacity={o} fontWeight={weight} letterSpacing={ls}>
		{children}
	</text>
);

// ───────── 1台目のDB：位置・大きさ・熱 ─────────
const STEPS = [1, 1.35, 1.75, 2.15];
const dbScale = (f: number) => {
	let s = 1;
	STEPS.forEach((v, i) => {
		if (i === 0) return;
		const t0 = F.bigger + (i - 1) * 9;
		s = lerp(s, v, ip(f, t0, t0 + 8, 0, 1));
	});
	s = lerp(s, 2.5, ip(f, F.ceiling - 10, F.ceiling, 0, 1, INOUT));
	return s;
};
const dbX = (f: number, v = false) => {
	let x = ip(f, F.wallIn, F.wallIn + 18, 0, v ? -400 : -440, INOUT);
	x = lerp(x, 0, ip(f, F.scaleIn, F.scaleIn + 18, 0, 1, INOUT));
	return x;
};
const heat = (f: number) => {
	let h = 0.08;
	h = lerp(h, 0.55, ip(f, F.flood, F.d2 + 10, 0, 1));
	h = lerp(h, 0.97, ip(f, F.d2 + 10, F.climb + 12, 0, 1));
	h = lerp(h, 0.42, ip(f, F.bigger, F.bigger + 28, 0, 1));
	h = lerp(h, 1, ip(f, F.bigger + 30, F.ceiling, 0, 1));
	return h;
};

// ───────── 流れる要求（決定的に作っておく） ─────────
const spawnList = (from: number, to: number, rate: (k: number) => number) => {
	const out: number[] = [];
	let cum = 0;
	for (let k = from; k < to; k++) {
		cum += rate(k) / FPS;
		while (cum >= 1) {
			out.push(k + (1 - cum + Math.floor(cum)) * 0.999);
			cum -= 1;
		}
	}
	return out;
};
const SPAWN_A = spawnList(F.flood - 6, F.split - 4, (k) => ip(k, F.flood - 6, F.climb, 2.5, 46));
const SPAWN_B = spawnList(F.spread - 10, F.credit, () => 34);

// ───────── シャードの位置 ─────────
const SH_Y = 150;
const slots4 = [-510, -170, 170, 510];
const slots5 = [-600, -300, 0, 300, 600];
const shardX = (j: number, f: number, v = false) => {
	const t = ip(f, F.addShard, F.addShard + 18, 0, 1, INOUT);
	const k = v ? 0.86 : 1; // 縦型は両端が切れないよう詰める
	const a = j < 4 ? slots4[j] * k : 900;
	return lerp(a, slots5[j] * k, t);
};
const RANGES4 = ['0–249', '250–499', '500–749', '750–999'];
const QUERIES = [
	{id: 318, j: 1, dt: 0},
	{id: 42, j: 0, dt: 20},
	{id: 871, j: 3, dt: 40},
];

export const World: React.FC<{dim?: number; v?: boolean}> = ({dim = 1, v = false}) => {
	const f = useCurrentFrame();
	const RX = v ? 660 : 760; // 縦型では左右が切れるので、端の表示を内側に寄せる
	const h = heat(f);
	const hc = heatColor(h);
	const sx = dbX(f, v);
	const ss = dbScale(f);
	const sp = F.split;
	const shake = f > F.ceiling && f < F.ceiling + 14 ? Math.sin(f * 2.3) * ip(f, F.ceiling, F.ceiling + 14, 9, 0) : 0;
	const dbO = ip(f, 0, 10, 0, 1) * ip(f, sp, sp + 9, 1, 0);
	const dbS = ss * ip(f, sp, sp + 8, 1, 0.45, INOUT);
	const after = (a: number) => f >= a;
	const worldDim = ip(f, F.credit, F.credit + 14, 1, 0.13, INOUT) * dim;

	// 1台目のDBのラベル
	const vcpuIdx = STEPS.reduce((acc, _, i) => (i > 0 && f >= F.bigger + (i - 1) * 9 ? i : acc), 0);
	const VCPU = ['4 vCPU', '16 vCPU', '64 vCPU', '192 vCPU'];
	const COST = ['$', '$$', '$$$', '$$$$'];
	const showScaleLabels = f >= F.scaleIn && f < sp;

	// チャート（壁のシーン）
	const chartO = ip(f, F.chart - 4, F.chart + 8, 0, 1) * ip(f, F.scaleIn - 4, F.scaleIn + 8, 1, 0);
	const prog = ip(f, F.chart, F.climb + 16, 0, 1, (t) => t);
	const CX0 = v ? -40 : 40, CX1 = v ? 600 : 740, CY0 = -230, CY1 = 170;
	const curve = (fn: (x: number) => number) => {
		const pts: string[] = [];
		const n = 70;
		for (let i = 0; i <= n * prog; i++) {
			const x = i / n;
			pts.push(`${lerp(CX0, CX1, x).toFixed(1)},${(CY1 - fn(x) * (CY1 - CY0)).toFixed(1)}`);
		}
		return pts.length > 1 ? 'M' + pts.join(' L') : '';
	};
	const p99 = (x: number) => 0.1 + 0.82 * Math.pow(x, 3.1) + 0.015 * Math.sin(x * 40);
	const p50 = (x: number) => 0.07 + 0.07 * x + 0.008 * Math.sin(x * 33);
	const endX = lerp(CX0, CX1, prog), endY99 = CY1 - p99(prog) * (CY1 - CY0), endY50 = CY1 - p50(prog) * (CY1 - CY0);
	const feelT = ip(f, F.feel - 2, F.feel + 6, 0, 1);
	const p99Color = interpolateColors(feelT, [0, 1], [C.warm, C.hot]);

	// ルーターとシャード
	const routerW = ip(f, F.router, F.router + 14, 0, 1000);
	const routerO = ip(f, F.router, F.router + 6, 0, 1);
	const nShard = f >= F.addShard ? 5 : 4;
	const outro = ip(f, F.outroIn, F.outroIn + 20, 0, 1, INOUT);

	// クエリのチップ
	const activeShard: number[] = [0, 0, 0, 0, 0];
	const chips = QUERIES.map((q) => {
		const t0 = F.query + q.dt;
		const tx = shardX(q.j, f, v);
		const a = ip(f, t0, t0 + 10, 0, 1, INOUT);
		const b = ip(f, t0 + 14, t0 + 26, 0, 1, INOUT);
		const x = lerp(0, tx, b);
		const y = lerp(lerp(-330, -160, a), SH_Y - 120, b);
		const o = ip(f, t0, t0 + 4, 0, 1) * ip(f, t0 + 26, t0 + 32, 1, 0);
		activeShard[q.j] = Math.max(activeShard[q.j], ip(f, t0 + 24, t0 + 28, 0, 1) * ip(f, t0 + 30, t0 + 44, 1, 0));
		const routerHit = ip(f, t0 + 9, t0 + 12, 0, 1) * ip(f, t0 + 14, t0 + 22, 1, 0);
		return {q, x, y, o, routerHit, tx, b, t0};
	});
	const routerHit = Math.max(0, ...chips.map((c) => c.routerHit));

	// 行のかけら（テーブルを切る）
	const ROWS = [12, 87, 140, 233, 301, 377, 455, 512, 640, 702, 811, 960];

	return (
		<svg viewBox="-800 -300 1600 600" style={{width: '100%', height: '100%', overflow: 'visible'}}>
			<defs>
				<filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="28" />
				</filter>
				<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto">
					<path d="M0,0 L10,5 L0,10 z" fill={C.ok} />
				</marker>
			</defs>
			<g opacity={worldDim}>
				{/* ── 天井（スケールアップの限界） ── */}
				{(() => {
					const o = ip(f, F.ceiling - 22, F.ceiling - 12, 0, 1) * ip(f, sp, sp + 10, 1, 0);
					const y = ip(f, F.ceiling - 22, F.ceiling - 8, -340, -250);
					if (o <= 0.001) return null;
					return (
						<g opacity={o}>
							<line x1={-RX} x2={RX} y1={y} y2={y} stroke={C.hot} strokeWidth={3} strokeDasharray="14 10" />
							{v ? (
								<>
									<Mono x={-RX} y={y - 52} anchor="start" size={26} color={C.hot}>LARGEST MACHINE</Mono>
									<Mono x={-RX} y={y - 18} anchor="start" size={26} color={C.hot}>YOU CAN BUY</Mono>
								</>
							) : (
								<Mono x={-RX} y={y - 16} anchor="start" size={22} color={C.hot}>LARGEST MACHINE YOU CAN BUY</Mono>
							)}
						</g>
					);
				})()}

				{/* ── 要求の流れ A（1台に集中） ── */}
				{SPAWN_A.map((s, i) => {
					const travel = 26;
					if (f < s || f > s + travel) return null;
					const t = (f - s) / travel;
					const jy = (random(`a${i}`) - 0.5) * 150;
					const x = lerp(-820, sx - 60 * dbS, t);
					const y = lerp(jy, jy * 0.15, t);
					return <circle key={i} cx={x} cy={y} r={5} fill={hc} opacity={Math.min(1, (1 - t) * 3) * 0.9} />;
				})}

				{/* ── 1台目のDB ── */}
				{dbO > 0.001 && (
					<g transform={`translate(${shake},0)`}>
						<Cyl x={sx} y={0} s={dbS} color={hc} o={dbO} glow={h} fill={h} />
						{f < F.scaleIn + 6 && (
							<g opacity={dbO * ip(f, F.scaleIn - 4, F.scaleIn + 4, 1, 0)}>
								<Mono x={sx} y={178} size={24}>{'CPU ' + Math.round(h * 100) + '%'}</Mono>
								<rect x={sx - 100} y={194} width={200} height={8} rx={4} fill={C.line} />
								<rect x={sx - 100} y={194} width={200 * h} height={8} rx={4} fill={hc} />
							</g>
						)}
						{showScaleLabels && (
							<g opacity={ip(f, F.scaleIn + 6, F.scaleIn + 14, 0, 1) * dbO}>
								<Mono x={sx + 120 * dbS + 40} y={-10} anchor="start" size={32} color={C.ink}>{VCPU[vcpuIdx]}</Mono>
								<Mono x={sx + 120 * dbS + 40} y={34} anchor="start" size={28} color={C.warm}>{COST[vcpuIdx]}</Mono>
							</g>
						)}
					</g>
				)}

				{/* ── レイテンシのグラフ ── */}
				{chartO > 0.001 && (
					<g opacity={chartO}>
						{[0, 1, 2, 3, 4].map((i) => (
							<line key={i} x1={CX0} x2={CX1} y1={lerp(CY1, CY0, i / 4)} y2={lerp(CY1, CY0, i / 4)} stroke={C.line} strokeWidth={1.5} />
						))}
						<Mono x={CX0} y={CY1 + 36} anchor="start" size={20}>TRAFFIC →</Mono>
						<Mono x={CX0 - 14} y={CY0 + 6} anchor="end" size={20}>ms</Mono>
						<path d={curve(p50)} fill="none" stroke={C.dim} strokeWidth={4} strokeLinecap="round" />
						<path d={curve(p99)} fill="none" stroke={p99Color} strokeWidth={6} strokeLinecap="round" />
						<Mono x={endX + 16} y={endY50 + 8} anchor="start" size={22}>p50</Mono>
						<Mono x={endX + 16} y={endY99 + 8} anchor="start" size={26} color={p99Color}>p99</Mono>
						<g opacity={ip(f, F.slowest, F.slowest + 8, 0, 1)}>
							<Mono x={CX0 + 20} y={CY0 + 34} anchor="start" size={22} color={C.warm}>p99 = the slowest 1% of requests</Mono>
						</g>
						{feelT > 0 && (
							<g>
								<circle cx={endX} cy={endY99} r={ip(f, F.feel, F.feel + 24, 8, 60)} fill="none" stroke={C.hot} strokeWidth={3} opacity={ip(f, F.feel, F.feel + 24, 1, 0)} />
								<circle cx={endX} cy={endY99} r={9} fill={C.hot} />
								<Mono x={endX - 20} y={endY99 + 50} anchor="end" size={24} color={C.hot}>what your users feel</Mono>
							</g>
						)}
					</g>
				)}

				{/* ── ルーター ── */}
				{routerO > 0 && (
					<g opacity={routerO}>
						{Array.from({length: nShard}).map((_, j) => {
							const x = shardX(j, f, v);
							const act = activeShard[j];
							return (
								<line key={j} x1={lerp(-300, 300, nShard === 1 ? 0.5 : j / (nShard - 1)) * 0.6} y1={-128} x2={x} y2={SH_Y - 100}
									stroke={act > 0 ? C.ok : C.line} strokeWidth={2 + act * 3} opacity={0.9} />
							);
						})}
						<rect x={-routerW / 2} y={-200} width={routerW} height={72} rx={36} fill={C.panel}
							stroke={interpolateColors(routerHit, [0, 1], [C.line, C.ok])} strokeWidth={3} />
						<Mono x={0} y={-155} size={26} color={C.ink} o={ip(f, F.router + 8, F.router + 16, 0, 1)}>
							ROUTER · reads user_id → picks a shard
						</Mono>
					</g>
				)}

				{/* ── 要求の流れ B（ルーター経由で分散） ── */}
				{SPAWN_B.map((s, i) => {
					const travel = 30;
					if (f < s || f > s + travel) return null;
					const t = (f - s) / travel;
					const cutover = s >= F.vitess + 6;
					const n = s >= F.addShard && cutover ? 5 : 4;
					const j = Math.floor(random(`b${i}`) * n);
					const jx = (random(`bx${i}`) - 0.5) * 500;
					const tx = shardX(j, f, v);
					let x, y;
					if (t < 0.38) {
						const u = t / 0.38;
						x = lerp(jx, jx * 0.3, u);
						y = lerp(-330, -164, u);
					} else {
						const u = (t - 0.38) / 0.62;
						x = lerp(jx * 0.3, tx, u);
						y = lerp(-128, SH_Y - 80, u);
					}
					return <circle key={i} cx={x} cy={y} r={4.5} fill={C.ok} opacity={Math.min(1, (1 - t) * 4) * 0.85} />;
				})}

				{/* ── シャード ── */}
				{f >= sp + 4 &&
					Array.from({length: nShard}).map((_, j) => {
						const born = j < 4 ? sp + 4 + j * 2 : F.addShard;
						const t = ip(f, born, born + 20, 0, 1, OUT);
						const x = j < 4 ? lerp(0, shardX(j, f, v), t) : shardX(j, f, v);
						const y = j < 4 ? lerp(0, SH_Y, t) : lerp(SH_Y + 140, SH_Y, ip(f, born, born + 16, 0, 1));
						const o = j < 4 ? 1 : ip(f, born, born + 10, 0, 1);
						const act = activeShard[j];
						const glowNever = ip(f, F.never, F.never + 10, 0, 1);
						const col = interpolateColors(Math.max(act, glowNever, j === 4 ? ip(f, F.vitess, F.vitess + 10, 0, 1) : 1), [0, 1], [C.dim, C.ok]);
						const range =
							j < 4 ? (j === 3 && f >= F.vitess ? '750–874' : RANGES4[j]) : f >= F.vitess ? '875–999' : 'new';
						const load = f >= F.spread ? 0.22 + 0.06 * Math.sin(f / 9 + j * 1.7) : 0;
						const loadO = ip(f, F.spread + 6, F.spread + 16, 0, 1) * (j === 4 ? ip(f, F.vitess + 6, F.vitess + 16, 0, 1) : 1);
						return (
							<g key={j} opacity={o}>
								<Cyl x={x} y={y} w={150} h={110} color={col} glow={act + glowNever * 0.5} fill={load * loadO} />
								<Mono x={x} y={y + 98} size={22} color={C.ink} o={ip(f, F.slice + j * 3, F.slice + 8 + j * 3, 0, 1) * (1 - outro * 0.0)}>
									{range}
								</Mono>
								<g opacity={loadO}>
									<rect x={x - 60} y={y + 116} width={120} height={7} rx={3.5} fill={C.line} />
									<rect x={x - 60} y={y + 116} width={120 * load} height={7} rx={3.5} fill={C.ok} />
								</g>
							</g>
						);
					})}

				{/* ── 行のかけらが各シャードへ ── */}
				{f >= F.slice &&
					f < F.slice + 50 &&
					ROWS.map((id, i) => {
						const j = Math.min(3, Math.floor(id / 250));
						const t0 = F.slice + i * 2;
						const t = ip(f, t0, t0 + 20, 0, 1, INOUT);
						const x = lerp((i - 5.5) * 48, slots4[j] * (v ? 0.86 : 1), t);
						const y = lerp(-20, SH_Y - 20, t);
						const o = ip(f, t0, t0 + 3, 0, 1) * ip(f, t0 + 17, t0 + 22, 1, 0);
						return <Chip key={id} x={x} y={y} text={'#' + id} color={C.blue} o={o} size={18} />;
					})}

				{/* ── クエリ ── */}
				{chips.map(({q, x, y, o}) =>
					o > 0.001 ? <Chip key={q.id} x={x} y={y} text={`user_id = ${q.id}`} color={C.ok} o={o} size={24} /> : null,
				)}

				{/* ── 結果：p99 の表示 ── */}
				{(() => {
					const o = ip(f, F.spread + 12, F.spread + 22, 0, 1) * ip(f, F.live - 6, F.live + 4, 1, 0);
					if (o <= 0) return null;
					return (
						<g opacity={o}>
							<Mono x={RX} y={-262} anchor="end" size={20}>p99 LATENCY</Mono>
							<text x={RX} y={-214} textAnchor="end" fontFamily={MONO} fontSize={44} fontWeight={700} fill={C.ok}>
								{Math.round(ip(f, F.spread + 12, F.spread + 40, 480, 38)) + ' ms'}
							</text>
						</g>
					);
				})()}

				{/* ── 横に伸びる ── */}
				{(() => {
					const o = ip(f, F.sideways - 2, F.sideways + 6, 0, 1) * ip(f, F.live - 6, F.live + 4, 1, 0);
					if (o <= 0) return null;
					const x2 = ip(f, F.sideways, F.sideways + 22, -RX + 60, RX - 40);
					return (
						<g opacity={o}>
							<line x1={-RX + 40} x2={x2} y1={292} y2={292} stroke={C.ok} strokeWidth={4} markerEnd="url(#arr)" />
							<Mono x={-RX + 40} y={276} anchor="start" size={20} color={C.ok}>CAPACITY GROWS SIDEWAYS</Mono>
						</g>
					);
				})()}

				{/* ── 生きたまま移す ── */}
				{(() => {
					const o = ip(f, F.live, F.live + 8, 0, 1) * ip(f, F.outroIn - 4, F.outroIn + 6, 1, 0);
					if (o <= 0) return null;
					const blocks = Array.from({length: 8}).map((_, i) => {
						const t0 = F.moving + i * 6;
						const t = ip(f, t0, t0 + 22, 0, 1, INOUT);
						if (f < t0 || f > t0 + 24) return null;
						const x0 = shardX(3, f, v), x1 = shardX(4, f, v);
						const x = lerp(x0, x1, t);
						const y = SH_Y - 20 - Math.sin(t * Math.PI) * 150;
						return <rect key={i} x={x - 11} y={y - 11} width={22} height={22} rx={4} fill={C.blue} />;
					});
					const pulse = 0.55 + 0.45 * Math.sin(f / 4);
					const t = (f - F.live) / FPS;
					return (
						<g opacity={o}>
							{blocks}
							<circle cx={RX - 200} cy={-240} r={9} fill={C.hot} opacity={pulse} />
							<Mono x={RX - 180} y={-232} anchor="start" size={24} color={C.ink}>LIVE</Mono>
							<Mono x={RX} y={-196} anchor="end" size={20}>{'downtime  0.00 s'}</Mono>
							<Mono x={RX} y={-166} anchor="end" size={20}>{'resharding  ' + Math.min(100, Math.round(ip(f, F.moving, F.vitess + 4, 0, 100, (x) => x))) + '%'}</Mono>
						</g>
					);
				})()}

				{/* ── アプリ（最後） ── */}
				{outro > 0 && (
					<g opacity={outro}>
						<line x1={0} y1={-252} x2={0} y2={-200} stroke={C.ok} strokeWidth={3} />
						<rect x={-150} y={-292} width={300} height={44} rx={22} fill={C.bg} stroke={interpolateColors(ip(f, F.never, F.never + 8, 0, 1), [0, 1], [C.ink, C.ok])} strokeWidth={2.5} />
						<Mono x={0} y={-262} size={22} color={C.ink}>YOUR APP</Mono>
					</g>
				)}
			</g>
		</svg>
	);
};
