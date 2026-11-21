import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, SANS, MONO} from './lib';
import {Cyl} from './World';

const Dots = () => (
	<AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.6px, transparent 1.6px)', backgroundSize: '36px 36px'}} />
);
const Vig = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)'}} />;

export const Thumb: React.FC<{variant: 'A' | 'B'}> = ({variant}) => {
	if (variant === 'A') {
		return (
			<AbsoluteFill style={{background: C.bg}}>
				<Dots />
				<svg viewBox="-640 -360 1280 720" style={{position: 'absolute', inset: 0}}>
					{/* 熱くなった1台が、4つに割れる */}
					<Cyl x={300} y={-60} w={260} h={210} color={C.hot} glow={1} fill={0.95} o={0.95} />
					{[-1.5, -0.5, 0.5, 1.5].map((k, i) => (
						<Cyl key={i} x={300 + k * 150} y={200} w={120} h={86} color={C.ok} glow={0.6} fill={0.25} />
					))}
					{[-1.5, -0.5, 0.5, 1.5].map((k, i) => (
						<line key={i} x1={300} y1={60} x2={300 + k * 150} y2={146} stroke={C.ok} strokeWidth={3} strokeDasharray="8 7" />
					))}
				</svg>
				<Vig />
				<div style={{position: 'absolute', left: 64, top: 92, fontFamily: SANS, fontWeight: 900, fontSize: 118, lineHeight: 0.95, letterSpacing: -5, color: C.ink}}>
					ONE<br />DATABASE<br />ISN’T<br /><span style={{color: C.ok}}>ENOUGH.</span>
				</div>
				<div style={{position: 'absolute', left: 68, bottom: 44, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.dim}}>SHARDING, EXPLAINED</div>
			</AbsoluteFill>
		);
	}
	// B：p99 が跳ね上がる
	const pts: string[] = [];
	for (let i = 0; i <= 80; i++) {
		const x = i / 80;
		const y = 0.08 + 0.86 * Math.pow(x, 3.4) + 0.012 * Math.sin(x * 50);
		pts.push(`${(-560 + x * 1120).toFixed(1)},${(300 - y * 560).toFixed(1)}`);
	}
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Dots />
			<svg viewBox="-640 -360 1280 720" style={{position: 'absolute', inset: 0}}>
				{[0, 1, 2, 3].map((i) => <line key={i} x1={-560} x2={560} y1={300 - i * 160} y2={300 - i * 160} stroke={C.line} strokeWidth={2} />)}
				<path d={'M' + pts.join(' L')} fill="none" stroke={C.hot} strokeWidth={12} strokeLinecap="round" />
				<circle cx={560} cy={300 - (0.08 + 0.86 + 0.012 * Math.sin(50)) * 560} r={20} fill={C.hot} />
			</svg>
			<Vig />
			<div style={{position: 'absolute', left: 64, top: 70, fontFamily: SANS, fontWeight: 900, fontSize: 150, letterSpacing: -6, color: C.ink, lineHeight: 0.9}}>
				p99 <span style={{color: C.hot}}>↑</span>
			</div>
			<div style={{position: 'absolute', left: 68, top: 230, fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: -2, color: C.ink, lineHeight: 1.0}}>
				Why your database<br />hits a wall
			</div>
			<div style={{position: 'absolute', left: 68, bottom: 44, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.ok}}>→ AND HOW SHARDING FIXES IT</div>
		</AbsoluteFill>
	);
};
