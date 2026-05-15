const http = require('http');
const path = require('path');
const fs = require('fs');

const DEFAULT_PORT = 3001;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function createRequestHandler(outDir) {
  return (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    let filePath = req.url.split('?')[0];
    if (filePath === '/') {
      filePath = '/index.html';
    }

    const fullPath = path.join(outDir, filePath);
    console.log(`  -> Resolved to: ${fullPath}`);

    if (!fullPath.startsWith(outDir)) {
      console.log(`  -> FORBIDDEN: Path traversal detected`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    fs.stat(fullPath, (err, stats) => {
      if (err || !stats.isFile()) {
        console.log(`  -> File not found, serving index.html for SPA routing`);
        const indexPath = path.join(outDir, 'index.html');
        fs.readFile(indexPath, (readErr, data) => {
          if (readErr) {
            console.log(`  -> ERROR: Could not read index.html at ${indexPath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`<h1>404 - Not Found</h1><p>Could not find out folder or index.html at ${indexPath}</p>`);
            return;
          }
          console.log(`  -> Serving index.html (${data.length} bytes)`);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
        return;
      }

      fs.readFile(fullPath, (readErr, data) => {
        if (readErr) {
          console.log(`  -> ERROR: Could not read file: ${readErr.message}`);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }

        const contentType = getMimeType(fullPath);
        const headers = { 'Content-Type': contentType };

        if (filePath.includes('/_next/') || filePath.includes('/favicons/')) {
          headers['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else if (filePath.endsWith('.html')) {
          headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
        }

        console.log(`  -> Serving ${contentType} (${data.length} bytes)`);
        res.writeHead(200, headers);
        res.end(data);
      });
    });
  };
}

function startServer({ port = DEFAULT_PORT, appPath = path.join(__dirname, '..') } = {}) {
  const outDir = path.join(appPath, 'out');
  console.log(`[Server] Starting on port ${port}`);
  console.log(`[Server] App path: ${appPath}`);
  console.log(`[Server] Serving from: ${outDir}`);

  const server = http.createServer(createRequestHandler(outDir));

  server.listen(port, '127.0.0.1', () => {
    console.log(`[Server] ReddiTunes server running at http://localhost:${port}/`);
  });

  function shutdown() {
    console.log('[Server] Shutting down');
    server.close(() => process.exit(0));
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
};
