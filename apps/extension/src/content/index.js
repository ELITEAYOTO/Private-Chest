function getRuntime() {
  if (typeof browser !== "undefined" && browser.runtime) {
    return browser.runtime;
  }
  return chrome.runtime;
}
const CHOOSER_ROOT_ID = "private-chest-quickfill-root";
const CHOOSER_STYLE_ID = "private-chest-quickfill-style";

function findLoginFields() {
  const password = document.querySelector('input[type="password"]');
  if (!password) {
    return null;
  }

  const form = password.closest("form") || document;
  const username = form.querySelector(
    'input[type="email"], input[name*="user" i], input[name*="login" i], input[type="text"]'
  );

  return { username, password };
}

function fillFields(data) {
  const fields = findLoginFields();
  if (!fields) {
    return false;
  }

  if (fields.username && typeof data.username === "string") {
    fields.username.focus();
    fields.username.value = data.username;
    fields.username.dispatchEvent(new Event("input", { bubbles: true }));
    fields.username.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (typeof data.password === "string") {
    fields.password.focus();
    fields.password.value = data.password;
    fields.password.dispatchEvent(new Event("input", { bubbles: true }));
    fields.password.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return true;
}

function requestEntries() {
  return getRuntime().sendMessage({
    type: "private_chest_list",
    origin: window.location.origin,
  });
}

function requestFill(entryId) {
  return getRuntime().sendMessage({
    type: "private_chest_fill",
    origin: window.location.origin,
    entryId,
  });
}

function ensureChooserStyle() {
  if (document.getElementById(CHOOSER_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = CHOOSER_STYLE_ID;
  style.textContent = `
    #${CHOOSER_ROOT_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      background: rgba(7, 11, 18, 0.48);
      backdrop-filter: blur(2px);
      font-family: "Segoe UI", "Aptos", sans-serif;
    }

    #${CHOOSER_ROOT_ID} .pc-card {
      width: min(460px, calc(100vw - 24px));
      max-height: min(560px, calc(100vh - 24px));
      overflow: hidden;
      border: 1px solid rgba(176, 197, 255, 0.25);
      border-radius: 16px;
      background: linear-gradient(170deg, #181b2f, #141a2a);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
      color: #ecf1ff;
      display: grid;
      grid-template-rows: auto auto minmax(120px, 1fr);
    }

    #${CHOOSER_ROOT_ID} .pc-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 14px 14px 8px;
    }

    #${CHOOSER_ROOT_ID} .pc-title {
      font-size: 15px;
      font-weight: 700;
    }

    #${CHOOSER_ROOT_ID} .pc-sub {
      font-size: 12px;
      color: #a8b5d7;
    }

    #${CHOOSER_ROOT_ID} .pc-close,
    #${CHOOSER_ROOT_ID} .pc-item {
      font: inherit;
      border: 1px solid transparent;
      border-radius: 10px;
      cursor: pointer;
    }

    #${CHOOSER_ROOT_ID} .pc-close {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.06);
      color: #d9e4ff;
    }

    #${CHOOSER_ROOT_ID} .pc-close:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    #${CHOOSER_ROOT_ID} .pc-search-wrap {
      padding: 0 14px 10px;
    }

    #${CHOOSER_ROOT_ID} .pc-search {
      width: 100%;
      border: 1px solid rgba(176, 197, 255, 0.24);
      border-radius: 10px;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.2);
      color: #edf3ff;
      outline: none;
    }

    #${CHOOSER_ROOT_ID} .pc-search:focus {
      border-color: #9b8cff;
      box-shadow: 0 0 0 3px rgba(155, 140, 255, 0.18);
    }

    #${CHOOSER_ROOT_ID} .pc-list {
      overflow: auto;
      padding: 0 10px 12px;
      display: grid;
      gap: 8px;
    }

    #${CHOOSER_ROOT_ID} .pc-item {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.04);
      color: #ecf1ff;
      border-color: rgba(176, 197, 255, 0.16);
      display: grid;
      gap: 2px;
    }

    #${CHOOSER_ROOT_ID} .pc-item:hover,
    #${CHOOSER_ROOT_ID} .pc-item:focus {
      border-color: #9b8cff;
      background: rgba(155, 140, 255, 0.16);
      outline: none;
    }

    #${CHOOSER_ROOT_ID} .pc-item-title {
      font-weight: 650;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${CHOOSER_ROOT_ID} .pc-item-sub {
      font-size: 12px;
      color: #b8c4e4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${CHOOSER_ROOT_ID} .pc-empty {
      border: 1px dashed rgba(176, 197, 255, 0.22);
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      color: #a8b5d7;
      font-size: 13px;
    }

    #${CHOOSER_ROOT_ID} .pc-footer {
      padding: 0 14px 14px;
      color: #9aa8ca;
      font-size: 12px;
    }

    .pc-toast {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 2147483646;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(176, 197, 255, 0.24);
      background: #172033;
      color: #ecf1ff;
      font: 13px "Segoe UI", "Aptos", sans-serif;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
    }

    .pc-toast.error {
      border-color: rgba(255, 99, 99, 0.4);
      background: #3a1720;
      color: #ffd2d9;
    }
  `;

  document.documentElement.append(style);
}

function showToast(message, isError = false) {
  const node = document.createElement("div");
  node.className = `pc-toast${isError ? " error" : ""}`;
  node.textContent = message;
  document.documentElement.append(node);
  setTimeout(() => node.remove(), 2600);
}

function cleanupChooser() {
  const root = document.getElementById(CHOOSER_ROOT_ID);
  if (root) {
    root.remove();
  }
}

function chooseEntry(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return Promise.resolve(null);
  }

  if (entries.length === 1) {
    return Promise.resolve(entries[0]);
  }

  ensureChooserStyle();
  cleanupChooser();

  return new Promise((resolve) => {
    const root = document.createElement("div");
    root.id = CHOOSER_ROOT_ID;

    const card = document.createElement("div");
    card.className = "pc-card";

    const head = document.createElement("div");
    head.className = "pc-head";

    const headText = document.createElement("div");
    const title = document.createElement("div");
    title.className = "pc-title";
    title.textContent = "Choisir une entree";

    const subtitle = document.createElement("div");
    subtitle.className = "pc-sub";
    subtitle.textContent = `${entries.length} correspondances pour ${window.location.hostname}`;

    headText.append(title, subtitle);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "pc-close";
    closeBtn.textContent = "×";

    head.append(headText, closeBtn);

    const searchWrap = document.createElement("div");
    searchWrap.className = "pc-search-wrap";

    const search = document.createElement("input");
    search.className = "pc-search";
    search.type = "search";
    search.placeholder = "Rechercher une entree...";
    searchWrap.append(search);

    const list = document.createElement("div");
    list.className = "pc-list";

    const footer = document.createElement("div");
    footer.className = "pc-footer";
    footer.textContent = "Echap pour fermer";

    card.append(head, searchWrap, list, footer);
    root.append(card);
    document.documentElement.append(root);

    function finish(result) {
      document.removeEventListener("keydown", onKeyDown, true);
      cleanupChooser();
      resolve(result);
    }

    function renderList(query) {
      list.innerHTML = "";
      const q = (query || "").trim().toLowerCase();
      const filtered = entries.filter((entry) => {
        const titleText = (entry?.title || "").toLowerCase();
        const userText = (entry?.username || "").toLowerCase();
        return !q || titleText.includes(q) || userText.includes(q);
      });

      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "pc-empty";
        empty.textContent = "Aucune entree pour cette recherche.";
        list.append(empty);
        return;
      }

      filtered.forEach((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pc-item";

        const entryTitle = document.createElement("div");
        entryTitle.className = "pc-item-title";
        entryTitle.textContent = entry.title || "Sans titre";

        const entrySub = document.createElement("div");
        entrySub.className = "pc-item-sub";
        entrySub.textContent = entry.username || "Sans identifiant";

        button.append(entryTitle, entrySub);
        button.addEventListener("click", () => finish(entry));
        list.append(button);
      });
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(null);
      }
    }

    closeBtn.addEventListener("click", () => finish(null));
    root.addEventListener("click", (event) => {
      if (event.target === root) {
        finish(null);
      }
    });

    search.addEventListener("input", () => renderList(search.value));
    document.addEventListener("keydown", onKeyDown, true);

    renderList("");
    search.focus();
  });
}

async function openQuickFill() {
  const response = await requestEntries();

  if (!response) {
    showToast("Aucune reponse du coffre.", true);
    return;
  }

  if (response.type === "error") {
    showToast(response.message || "Action refusee.", true);
    return;
  }

  if (response.type !== "entries" || !Array.isArray(response.entries)) {
    showToast("Aucune entree compatible.", true);
    return;
  }

  if (response.entries.length === 0) {
    showToast("Aucune entree pour ce site.", false);
    return;
  }

  const selected = await chooseEntry(response.entries);
  if (!selected || !selected.id) {
    return;
  }

  const fillResponse = await requestFill(selected.id);
  if (!fillResponse || fillResponse.type === "error") {
    showToast(fillResponse?.message || "Remplissage impossible.", true);
    return;
  }

  if (fillResponse.type === "fill_data") {
    if (!fillFields(fillResponse)) {
      showToast("Formulaire de connexion non detecte.", true);
      return;
    }
    showToast("Identifiants injectes.", false);
  }
}

window.addEventListener("keydown", (event) => {
  const wantsFill = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l";
  if (!wantsFill) {
    return;
  }

  event.preventDefault();
  openQuickFill().catch(() => {
    showToast("Action impossible pour le moment.", true);
  });
});