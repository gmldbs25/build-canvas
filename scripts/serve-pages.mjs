import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist-pages");
const portIndex = process.argv.indexOf("--port");
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 5173;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function filePathFor(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const withoutBase = pathname.startsWith("/build-canvas/")
    ? pathname.slice("/build-canvas".length)
    : pathname;
  const relative = withoutBase === "/" ? "/index.html" : withoutBase;
  const candidate = path.resolve(root, `.${relative}`);
  return candidate.startsWith(`${root}${path.sep}`) ? candidate : null;
}

const server = createServer(async (request, response) => {
  const candidate = filePathFor(request.url ?? "/");
  if (!candidate) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  let filePath = candidate;
  try {
    if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
    await access(filePath);
  } catch {
    filePath = path.join(root, "404.html");
    response.statusCode = 404;
  }

  response.setHeader("content-type", contentTypes[path.extname(filePath)] ?? "application/octet-stream");
  createReadStream(filePath).on("error", () => response.destroy()).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`build _ canvas preview: http://localhost:${port}/build-canvas/`);
});
