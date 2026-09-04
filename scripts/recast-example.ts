/** !!IMPORTANT Need `ffmpeg`  */

import { Recast } from 'playwright-recast';
// Minimal — trace to video
await Recast.from('./traces').parse().render().toFile('output.mp4');

// await Recast
// 	.from('./test-results/')
// 	.parse()
// 	.hideSteps(s => s.keyword === 'Given' && s.text?.includes('logged in'))
// 	.speedUp({
// 		duringIdle: 4.0,
// 		duringUserAction: 1.0,
// 		duringNetworkWait: 2.0,
// 		minSegmentDuration: 500,
// 	})
// 	.subtitlesFromSrt('./narration.srt')
// 	.voiceover(OpenAIProvider({
// 		voice: 'nova',
// 		speed: 1.2,
// 		instructions: 'Professional product demo narration.',
// 	}))
// 	.render({
// 		format: 'mp4',
// 		resolution: '1080p',
// 		fps: 60,
// 		burnSubtitles: true,
// 		subtitleStyle: {
// 			fontSize: 48,
// 			primaryColor: '#1a1a1a',
// 			backgroundColor: '#FFFFFF',
// 			backgroundOpacity: 0.75,
// 			padding: 20,
// 			bold: true,
// 			chunkOptions: { maxCharsPerLine: 55 },
// 		},
// 	})
// 	.toFile('demo.mp4');