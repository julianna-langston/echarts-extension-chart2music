const http = require("http");
const fs = require("fs");
const path = require("path");

const log = (...parts) => {
  const message = parts.join(" ");
  console.log(message);
  if (logFile) {
    fs.appendFileSync(logFile, `${message}\n`);
  }
};

const readArg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
};

const root = path.resolve(__dirname, "..");
const port = Number(readArg("port", process.env.PORT || "4173"));
const host = readArg("host", process.env.HOST || "127.0.0.1");
const logFile = readArg("log", process.env.DEV_SERVER_LOG || "");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));

  if (!file.startsWith(root)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end(`Not found: ${url.pathname}`);
      return;
    }

    response.writeHead(200, {
      "content-type": mime[path.extname(file)] || "application/octet-stream"
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  log(`Demo server: http://${host}:${port}/examples/all-chart-types.html`);
});
