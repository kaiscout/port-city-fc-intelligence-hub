import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.WALKTHROUGH_PORT ?? 8099);

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const relative =
    url.pathname === "/"
      ? "walkthrough/port-city-fc-intelligence-hub-walkthrough.webm"
      : url.pathname.slice(1);
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = await stat(filename);
    response.writeHead(200, {
      "Content-Length": file.size,
      "Content-Type":
        path.extname(filename) === ".webm" ? "video/webm" : "application/octet-stream",
    });
    createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Walkthrough preview: http://127.0.0.1:${port}/`);
});
