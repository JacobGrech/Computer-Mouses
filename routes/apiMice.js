const store = require("../storage/miceStore");

function readBodyJson(req, cb) {
  let body = "";
  req.on("data", (ch) => (body += ch));
  req.on("end", () => {
    try {
      cb(null, JSON.parse(body || "{}"));
    } catch (e) {
      cb(e);
    }
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function validateMouse({ brand, model, type, dpi, price }) {
  const errors = [];
  if (!brand || String(brand).trim().length < 1) errors.push("Značka je povinná.");
  if (!model || String(model).trim().length < 1) errors.push("Model je povinný.");
  const validTypes = ["Gaming", "Kancelářská", "Bezdrátová"];
  if (!validTypes.includes(type)) errors.push("Typ musí být Gaming, Kancelářská nebo Bezdrátová.");
  if (!dpi || Number(dpi) < 100 || Number(dpi) > 100000) errors.push("DPI musí být mezi 100 a 100 000.");
  if (!price || Number(price) < 1) errors.push("Cena musí být kladné číslo.");
  return errors;
}

function handleApiMice(req, res) {
  const url = new URL(req.url, "http://localhost");

  // GET /api/mice – vrátí všechny (s volitelnou filtrací)
  if (url.pathname === "/api/mice" && req.method === "GET") {
    let mice = store.getAll();

    const type = url.searchParams.get("type");
    const minDpi = url.searchParams.get("minDpi");
    const maxDpi = url.searchParams.get("maxDpi");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const search = url.searchParams.get("search");

    if (type) mice = mice.filter((m) => m.type === type);
    if (minDpi) mice = mice.filter((m) => m.dpi >= Number(minDpi));
    if (maxDpi) mice = mice.filter((m) => m.dpi <= Number(maxDpi));
    if (minPrice) mice = mice.filter((m) => m.price >= Number(minPrice));
    if (maxPrice) mice = mice.filter((m) => m.price <= Number(maxPrice));
    if (search) {
      const q = search.toLowerCase();
      mice = mice.filter(
        (m) =>
          m.brand.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q)
      );
    }

    return sendJson(res, 200, mice);
  }

  // GET /api/mice/:id
  if (url.pathname.startsWith("/api/mice/") && req.method === "GET") {
    const id = Number(url.pathname.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });
    const mouse = store.getById(id);
    if (!mouse) return sendJson(res, 404, { error: "Myš nenalezena" });
    return sendJson(res, 200, mouse);
  }

  // POST /api/mice
  if (url.pathname === "/api/mice" && req.method === "POST") {
    return readBodyJson(req, (err, data) => {
      if (err) return sendJson(res, 400, { error: "Neplatný JSON" });

      const errors = validateMouse(data);
      if (errors.length) return sendJson(res, 400, { error: errors.join(" ") });

      const created = store.create({
        brand: String(data.brand).trim(),
        model: String(data.model).trim(),
        type: data.type,
        dpi: Number(data.dpi),
        price: Number(data.price),
      });
      return sendJson(res, 201, created);
    });
  }

  // PUT /api/mice/:id
  if (url.pathname.startsWith("/api/mice/") && req.method === "PUT") {
    const id = Number(url.pathname.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });

    return readBodyJson(req, (err, data) => {
      if (err) return sendJson(res, 400, { error: "Neplatný JSON" });

      const errors = validateMouse(data);
      if (errors.length) return sendJson(res, 400, { error: errors.join(" ") });

      const patch = {
        brand: String(data.brand).trim(),
        model: String(data.model).trim(),
        type: data.type,
        dpi: Number(data.dpi),
        price: Number(data.price),
      };

      const updated = store.update(id, patch);
      if (!updated) return sendJson(res, 404, { error: "Myš nenalezena" });
      return sendJson(res, 200, updated);
    });
  }

  // DELETE /api/mice/:id
  if (url.pathname.startsWith("/api/mice/") && req.method === "DELETE") {
    const id = Number(url.pathname.split("/")[3]);
    if (Number.isNaN(id)) return sendJson(res, 400, { error: "Neplatné ID" });

    const removed = store.remove(id);
    if (!removed) return sendJson(res, 404, { error: "Myš nenalezena" });
    return sendJson(res, 200, { message: "Myš smazána", mouse: removed });
  }

  return false;
}

module.exports = { handleApiMice };
