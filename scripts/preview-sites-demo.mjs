import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve(process.cwd(), "dist");
const port = Number(process.env.SITE_PREVIEW_PORT ?? 4173);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(`${root}${path.sep}`) && filename !== path.join(root, "index.html")) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = await stat(filename);
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": file.size,
      "Content-Type": mimeTypes[path.extname(filename)] ?? "application/octet-stream",
    });
    createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Site preview: http://127.0.0.1:${port}/`);
});
