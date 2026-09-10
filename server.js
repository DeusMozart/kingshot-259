const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = path.resolve(__dirname);
const port = Number.parseInt(process.env.PORT, 10) || 3000;
const host = process.env.HOST || '0.0.0.0';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

function withinRoot(filePath) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

function serve(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return sendText(response, 405, 'Method Not Allowed\n');
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    return sendText(response, 400, 'Bad Request\n');
  }

  const requestedPath = path.resolve(root, `.${urlPath}`);
  if (!withinRoot(requestedPath)) {
    return sendText(response, 403, 'Forbidden\n');
  }

  fs.stat(requestedPath, (statError, stats) => {
    if (statError) return sendText(response, 404, 'Not Found\n');

    let filePath = requestedPath;
    if (stats.isDirectory()) filePath = path.join(requestedPath, 'index.html');

    if (!withinRoot(filePath)) return sendText(response, 403, 'Forbidden\n');

    fs.stat(filePath, (fileError, fileStats) => {
      if (fileError || !fileStats.isFile()) return sendText(response, 404, 'Not Found\n');

      const headers = {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': fileStats.size,
        'Cache-Control': 'public, max-age=3600'
      };
      response.writeHead(200, headers);
      if (request.method === 'HEAD') return response.end();
      fs.createReadStream(filePath).pipe(response);
    });
  });
}

http.createServer(serve).listen(port, host, () => {
  console.log(`Kingshot 259 site listening on ${host}:${port}`);
});
