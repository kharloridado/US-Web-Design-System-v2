// Static server for the behavior tests (started by playwright.config.mjs):
//   /fixtures/...  reference/fixtures (spec fixture pages)
//   /uswds/...     official USWDS dist (css, img, fonts)
//   /elements/...  dist/js (our custom elements)

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const port = Number(process.env.BEHAVIOR_PORT || 4310);
const routes = [
  ["/fixtures/", path.join(root, "reference/fixtures")],
  ["/uswds/", path.join(root, "node_modules/@uswds/uswds/dist")],
  ["/elements/", path.join(root, "dist/js")],
];
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".woff2": "font/woff2" };

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  for (const [prefix, base] of routes) {
    if (!urlPath.startsWith(prefix)) continue;
    const file = path.join(base, urlPath.slice(prefix.length));
    if (file.startsWith(base + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
      return;
    }
  }
  // USWDS fixtures reference images by root paths (e.g. /img/...); serve them from dist.
  const fallback = path.join(root, "node_modules/@uswds/uswds/dist", urlPath);
  if (fs.existsSync(fallback) && fs.statSync(fallback).isFile()) {
    res.writeHead(200, { "content-type": MIME[path.extname(fallback)] ?? "application/octet-stream" });
    fs.createReadStream(fallback).pipe(res);
    return;
  }
  res.writeHead(404).end("not found");
}).listen(port, "127.0.0.1", () => console.log(`behavior fixtures on http://127.0.0.1:${port}`));
