const http = require("http");
const { handleApiMice } = require("./routes/apiMice");
const { handlePages } = require("./routes/pages");

const server = http.createServer((req, res) => {
  const apiHandled = handleApiMice(req, res);
  if (apiHandled !== false) return;

  const pageHandled = handlePages(req, res);
  if (pageHandled !== false) return;

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Server běží na http://localhost:3000");
});
