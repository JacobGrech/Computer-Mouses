const fs = require("fs");
const path = require("path");

const MICE_FILE = path.join(__dirname, "..", "data", "mice.json");

function loadMice() {
  try {
    const raw = fs.readFileSync(MICE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    console.log("❌ Chyba při čtení mice.json:", e.message);
    return [];
  }
}

function saveMice(mice) {
  fs.writeFileSync(MICE_FILE, JSON.stringify(mice, null, 2), "utf-8");
}

function getAll() {
  return loadMice();
}

function getById(id) {
  return loadMice().find((m) => m.id === id) || null;
}

function create({ brand, model, type, dpi, price }) {
  const mice = loadMice();
  const newId = mice.length ? Math.max(...mice.map((m) => m.id)) + 1 : 1;
  const mouse = { id: newId, brand, model, type, dpi: Number(dpi), price: Number(price) };
  mice.push(mouse);
  saveMice(mice);
  return mouse;
}

function update(id, patch) {
  const mice = loadMice();
  const idx = mice.findIndex((m) => m.id === id);
  if (idx === -1) return null;

  if (patch.brand !== undefined) mice[idx].brand = patch.brand;
  if (patch.model !== undefined) mice[idx].model = patch.model;
  if (patch.type !== undefined) mice[idx].type = patch.type;
  if (patch.dpi !== undefined) mice[idx].dpi = Number(patch.dpi);
  if (patch.price !== undefined) mice[idx].price = Number(patch.price);

  saveMice(mice);
  return mice[idx];
}

function remove(id) {
  const mice = loadMice();
  const idx = mice.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const removed = mice.splice(idx, 1)[0];
  saveMice(mice);
  return removed;
}

module.exports = { getAll, getById, create, update, remove };
