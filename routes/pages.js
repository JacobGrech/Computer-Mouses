const fs = require("fs");
const path = require("path");
const store = require("../storage/miceStore");

const VIEWS_DIR = path.join(__dirname, "..", "views");

function loadView(name) {
  return fs.readFileSync(path.join(VIEWS_DIR, name), "utf-8");
}

function render(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v ?? ""));
  }
  return out;
}

function renderLayout({ title, content }) {
  const layout = loadView("layout.html");
  return render(layout, { title, content });
}

function sendHtml(res, html, status = 200) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function handlePages(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/public/app.js" && req.method === "GET") {
    const file = path.join(__dirname, "..", "public", "app.js");
    const js = fs.readFileSync(file, "utf-8");
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    return res.end(js);
  }

  if (url.pathname === "/" && req.method === "GET") {
    let mice = store.getAll();

    const typeFilter  = url.searchParams.get("type")     || "";
    const searchFilter= url.searchParams.get("search")   || "";
    const minDpi      = url.searchParams.get("minDpi")   || "";
    const maxDpi      = url.searchParams.get("maxDpi")   || "";
    const minPrice    = url.searchParams.get("minPrice") || "";
    const maxPrice    = url.searchParams.get("maxPrice") || "";

    if (typeFilter)  mice = mice.filter(m => m.type === typeFilter);
    if (searchFilter){ const q = searchFilter.toLowerCase(); mice = mice.filter(m => m.brand.toLowerCase().includes(q) || m.model.toLowerCase().includes(q)); }
    if (minDpi)   mice = mice.filter(m => m.dpi   >= Number(minDpi));
    if (maxDpi)   mice = mice.filter(m => m.dpi   <= Number(maxDpi));
    if (minPrice) mice = mice.filter(m => m.price >= Number(minPrice));
    if (maxPrice) mice = mice.filter(m => m.price <= Number(maxPrice));

    const badgeClass = (type) => type === "Gaming" ? "gaming" : type === "Kancelářská" ? "kancelarska" : "bezdratova";

    const rows = mice.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>${escHtml(m.brand)}</td>
        <td><a href="/mouse/${m.id}">${escHtml(m.model)}</a></td>
        <td><span class="badge ${badgeClass(m.type)}">${escHtml(m.type)}</span></td>
        <td>${m.dpi.toLocaleString("cs-CZ")}</td>
        <td>${m.price.toLocaleString("cs-CZ")} Kč</td>
        <td class="actions">
          <a class="btn btn-detail" href="/mouse/${m.id}">Detail</a>
          <a class="btn btn-edit" href="/edit/${m.id}">Upravit</a>
          <button class="btn btn-delete" data-delete-id="${m.id}">Smazat</button>
        </td>
      </tr>`).join("");

    const indexTpl = loadView("index.html");
    const content = render(indexTpl, {
      rows: rows || `<tr><td colspan="7" class="empty">Žádné myši nenalezeny.</td></tr>`,
      typeFilter, searchFilter, minDpi, maxDpi, minPrice, maxPrice,
      count: mice.length,
      selAll:       !typeFilter              ? "selected" : "",
      selGaming:    typeFilter === "Gaming"       ? "selected" : "",
      selKancelar:  typeFilter === "Kancelářská"  ? "selected" : "",
      selBezdrat:   typeFilter === "Bezdrátová"   ? "selected" : "",
    });

    return sendHtml(res, renderLayout({ title: "Katalog počítačových myší", content }));
  }

  if (url.pathname.startsWith("/mouse/") && req.method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const mouse = store.getById(id);
    if (!mouse) {
      return sendHtml(res, renderLayout({ title: "Chyba", content: render(loadView("error.html"), { message: "Myš nenalezena." }) }), 404);
    }
    const badgeClass = (type) => type === "Gaming" ? "gaming" : type === "Kancelářská" ? "kancelarska" : "bezdratova";
    const content = render(loadView("detail.html"), {
      id: mouse.id, brand: escHtml(mouse.brand), model: escHtml(mouse.model),
      type: escHtml(mouse.type), dpi: mouse.dpi.toLocaleString("cs-CZ"),
      price: mouse.price.toLocaleString("cs-CZ"), badgeClass: badgeClass(mouse.type),
    });
    return sendHtml(res, renderLayout({ title: `${mouse.brand} ${mouse.model}`, content }));
  }

  if (url.pathname.startsWith("/edit/") && req.method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const mouse = store.getById(id);
    if (!mouse) {
      return sendHtml(res, renderLayout({ title: "Chyba", content: render(loadView("error.html"), { message: "Myš nenalezena." }) }), 404);
    }
    const content = render(loadView("edit.html"), {
      id: mouse.id, brand: escHtml(mouse.brand), model: escHtml(mouse.model),
      dpi: mouse.dpi, price: mouse.price,
      selGaming:   mouse.type === "Gaming"      ? "selected" : "",
      selKancelar: mouse.type === "Kancelářská" ? "selected" : "",
      selBezdrat:  mouse.type === "Bezdrátová"  ? "selected" : "",
    });
    return sendHtml(res, renderLayout({ title: `Editace – ${mouse.brand} ${mouse.model}`, content }));
  }

  return false;
}

module.exports = { handlePages };
