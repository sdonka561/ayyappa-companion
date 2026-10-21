import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./public/", import.meta.url)));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  let path;
  try {
    path = resolve(root, "." + decodeURIComponent(new URL(request.url, "http://localhost").pathname).replaceAll("/", sep));
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  if (path === resolve(root)) path = resolve(root, "index.html");
  try {
    const data = await readFile(path);
    response.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    response.end(data);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      response.writeHead(404).end("Not found");
    } else {
      console.error("Could not serve file:", error);
      response.writeHead(500).end("Unable to read this file.");
    }
  }
}).listen(port, "127.0.0.1", () => console.log(`Ayyappa companion: http://127.0.0.1:${port}`));
