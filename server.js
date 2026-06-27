import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

async function send(res, filePath, status = 200) {
  const data = await readFile(filePath);
  const type = TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': type });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    // Prevent path traversal
    const safePath = normalize(url).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(DIST, safePath);

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = join(filePath, 'index.html');
      await send(res, filePath);
      return;
    } catch {
      // Not a static file -> SPA fallback to index.html
      await send(res, join(DIST, 'index.html'));
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving dist on http://${HOST}:${PORT}`);
});
