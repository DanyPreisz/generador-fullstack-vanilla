import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#gen-form");
const saveForm = document.querySelector("#save-form");
const formError = document.querySelector("#form-error");
const result = document.querySelector("#result");
let mode = "login";
let current = "";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/saved");
  listEl.innerHTML = "";
  if (!data.saved.length) {
    const empty = document.createElement("li");
    empty.textContent = "No hay claves guardadas.";
    listEl.append(empty);
    return;
  }
  data.saved.forEach((item) => {
    const li = document.createElement("li");
    li.className = "item";
    const text = document.createElement("span");
    text.textContent = `${item.label} \u00b7 ${item.length}`;
    const show = document.createElement("button");
    show.type = "button";
    show.className = "ghost";
    show.textContent = "Ver";
    show.addEventListener("click", async () => {
      const data = await api(`/api/saved/${item.id}/reveal`, { method: "POST" });
      text.textContent = `${item.label} \u00b7 ${data.password}`;
      setTimeout(() => { text.textContent = `${item.label} \u00b7 ${item.length}`; }, 8000);
    });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/saved/${item.id}`, { method: "DELETE" }); await refresh(); });
    li.append(text, show, del);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    const data = await api("/api/generate", { method: "POST", body: JSON.stringify({ length: document.querySelector("#length").value, symbols: document.querySelector("#symbols").checked }) });
    current = data.password;
    result.textContent = current;
    result.classList.remove("hidden");
    saveForm.classList.remove("hidden");
  } catch (err) { showError(formError, err.message); }
});
saveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/saved", { method: "POST", body: JSON.stringify({ label: document.querySelector("#label").value.trim(), password: current }) });
    saveForm.reset();
    current = "";
    result.classList.add("hidden");
    saveForm.classList.add("hidden");
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
