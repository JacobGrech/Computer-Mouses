// ===================== POMOCNÁ FUNKCE =====================
async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

function setMsg(el, text, isError) {
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (isError ? "error" : "success");
}

function validateCreate() {
  const brand = document.getElementById("f-brand")?.value.trim();
  const model = document.getElementById("f-model")?.value.trim();
  const type  = document.getElementById("f-type")?.value;
  const dpi   = Number(document.getElementById("f-dpi")?.value);
  const price = Number(document.getElementById("f-price")?.value);

  const errors = [];
  if (!brand) errors.push("Značka je povinná.");
  if (!model) errors.push("Model je povinný.");
  if (!type)  errors.push("Vyberte typ.");
  if (!dpi || dpi < 100 || dpi > 100000) errors.push("DPI musí být 100–100 000.");
  if (!price || price < 1) errors.push("Cena musí být kladné číslo.");
  return errors;
}

// ===================== VYTVOŘIT (POST) =====================
const createBtn = document.getElementById("createBtn");
if (createBtn) {
  createBtn.addEventListener("click", async () => {
    const msg = document.getElementById("createMsg");
    const errors = validateCreate();
    if (errors.length) {
      setMsg(msg, errors[0], true);
      return;
    }

    const payload = {
      brand: document.getElementById("f-brand").value.trim(),
      model: document.getElementById("f-model").value.trim(),
      type:  document.getElementById("f-type").value,
      dpi:   Number(document.getElementById("f-dpi").value),
      price: Number(document.getElementById("f-price").value),
    };

    try {
      await api("/api/mice", { method: "POST", body: JSON.stringify(payload) });
      window.location.reload();
    } catch (err) {
      setMsg(msg, "Chyba: " + (err.data?.error || JSON.stringify(err.data)), true);
    }
  });
}

// ===================== EDITACE (PUT) =====================
const editForm = document.getElementById("editForm");
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id  = editForm.dataset.id;
    const msg = document.getElementById("editMsg");

    const brand = document.getElementById("e-brand").value.trim();
    const model = document.getElementById("e-model").value.trim();
    const type  = document.getElementById("e-type").value;
    const dpi   = Number(document.getElementById("e-dpi").value);
    const price = Number(document.getElementById("e-price").value);

    const errors = [];
    if (!brand) errors.push("Značka je povinná.");
    if (!model) errors.push("Model je povinný.");
    if (!type)  errors.push("Vyberte typ.");
    if (!dpi || dpi < 100 || dpi > 100000) errors.push("DPI musí být 100–100 000.");
    if (!price || price < 1) errors.push("Cena musí být kladné číslo.");

    if (errors.length) {
      setMsg(msg, errors[0], true);
      return;
    }

    try {
      await api(`/api/mice/${id}`, {
        method: "PUT",
        body: JSON.stringify({ brand, model, type, dpi, price }),
      });
      window.location.href = `/mouse/${id}`;
    } catch (err) {
      setMsg(msg, "Chyba: " + (err.data?.error || JSON.stringify(err.data)), true);
    }
  });
}

// ===================== SMAZAT (DELETE) =====================
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-delete-id]");
  if (!btn) return;

  const id = btn.dataset.deleteId;
  if (!confirm(`Opravdu chcete smazat myš #${id}?`)) return;

  try {
    await api(`/api/mice/${id}`, { method: "DELETE" });
    window.location.href = "/";
  } catch (err) {
    alert("Chyba: " + (err.data?.error || JSON.stringify(err.data)));
  }
});
