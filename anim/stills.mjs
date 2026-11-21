import {renderStill, selectComposition} from '@remotion/renderer';
const [comp, framesArg, prefix] = process.argv.slice(2);
const serveUrl = new URL('./build', import.meta.url).pathname;
const c = await selectComposition({serveUrl, id: comp, browserExecutable: process.env.CHROME || null, inputProps: {}});
for (const fr of framesArg.split(',').map(Number)) {
  await renderStill({composition: c, serveUrl, frame: fr, output: `check/${prefix}_${String(fr).padStart(4,'0')}.png`, browserExecutable: process.env.CHROME || null, imageFormat: 'png', scale: 0.5});
}
console.log('done');
