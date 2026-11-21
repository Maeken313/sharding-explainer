import React from 'react';
import {Composition, Still, AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, MONO, SANS, TOTAL_F, s2f, Layout, ip} from './lib';
import {World, FR} from './World';
import {Overlay} from './Overlay';
import SEG from '../../short_segments.json';
import {Thumb} from './Thumb';
import {MakingOf, MK_FRAMES} from './MakingOf';

const Bg: React.FC<{layout: Layout}> = ({layout}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<AbsoluteFill style={{
				backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.6px, transparent 1.6px)',
				backgroundSize: '44px 44px', backgroundPosition: `${f * 0.15}px ${f * 0.08}px`,
			}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.65) 100%)'}} />
		</AbsoluteFill>
	);
};

// 本編の画（音なし）。ショートでも同じものを切って使う
export const MainVisual: React.FC<{layout: Layout; captions?: boolean}> = ({layout, captions = true}) => {
	const v = layout === 'v';
	return (
		<AbsoluteFill>
			<Bg layout={layout} />
			<div style={v
				? {position: 'absolute', left: (1080 - 1248) / 2, top: 640, width: 1248, height: 468}
				: {position: 'absolute', left: 160, top: 262, width: 1600, height: 600}}>
				<World v={v} />
			</div>
			<Overlay layout={layout} captions={captions} />
		</AbsoluteFill>
	);
};

const Main: React.FC<{withAudio?: boolean; captions?: boolean}> = ({withAudio = true, captions = true}) => (
	<AbsoluteFill>
		<MainVisual layout="h" captions={captions} />
		{withAudio && <Audio src={staticFile('main_mix.wav')} />}
	</AbsoluteFill>
);

export const SHORT_F = (SEG as any[]).reduce((a, s) => a + s2f(s.len), 0);
const Short: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
	let at = 0;
	return (
		<AbsoluteFill style={{background: C.bg}}>
			{(SEG as any[]).map((s, i) => {
				const from = at;
				const len = s2f(s.len);
				at += len;
				return (
					<Sequence key={i} from={from} durationInFrames={len}>
						<Sequence from={-s2f(s.src)}>
							<MainVisual layout="v" />
						</Sequence>
					</Sequence>
				);
			})}
			{withAudio && <Audio src={staticFile('short_mix.wav')} />}
		</AbsoluteFill>
	);
};

export const Root: React.FC = () => (
	<>
		<Composition id="Main" component={Main} durationInFrames={TOTAL_F} fps={30} width={1920} height={1080} defaultProps={{withAudio: true, captions: true}} />
		<Composition id="Short" component={Short} durationInFrames={SHORT_F} fps={30} width={1080} height={1920} defaultProps={{withAudio: true}} />
		<Composition id="MakingOf" component={MakingOf} durationInFrames={MK_FRAMES} fps={30} width={1920} height={1080} />
		<Still id="ThumbA" component={Thumb} width={1280} height={720} defaultProps={{variant: 'A'}} />
		<Still id="ThumbB" component={Thumb} width={1280} height={720} defaultProps={{variant: 'B'}} />
	</>
);
