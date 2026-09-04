import { preview } from 'vite';

/** simple way */
preview({
	build: {
		outDir: './playground'
	},
	preview: {
		port: 3002,
		open: true,
	}
});

/** custom server */
// const server = createServer((req, resp) => {

// });

// server.listen(3003);
