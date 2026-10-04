// import { preview } from 'vite';

// TODO: 
// 0) Learning debugging on server side
// 0*) методы создание,удаление,чтение файл\директория (исп. *Sync методы)
// 1) add 3 button for get
// 2) add 3 button for post(store in json)
// 3) investigate headers logic and add new custom header
// 4) настоить .git#config (перенаправить коммиты, доступ по токену, user)


import { readFile, readFileSync } from "node:fs";
import { createServer, Server } from "node:http";
class B {

}
// /** simple way */
// preview({
// 	build: {
// 		outDir: './playground'
// 	},
// 	preview: {
// 		port: 3002,
// 		open: true,
// 	}
// });
const port = 3002;
/** custom server {@link B} */
const server = createServer((req, resp) => {
  // C: \playwright - template\playground\index.html
  debugger
  if (req.url!.includes('main.js')) {
    const js = readFileSync('./playground/playground-main.js')
    resp.end(js);
  } else if (req.url!.includes("test1-data")) {
    // btn1 handling
    // throw new Error('Unsupported operation')
    const json = readFileSync('./playground/data1.json')
    // TODO: see headers and set new custom 
    resp.getHeaders();
    resp.end(json)
  } else {
    const html = readFileSync('./playground/index.html')
    resp.end(html);
  }
});

server.listen(port);
console.log(`------------ server started on ${port}`);