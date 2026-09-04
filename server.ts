import { createServer } from "node:http";

createServer((req, res) => {
    debugger
    res.end('llllllll')
}).listen(3002)
console.log('----------server started on 3001',);