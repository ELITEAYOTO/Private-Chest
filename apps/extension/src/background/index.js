const HOST_NAME = "io.privatechest.native";
const TIMEOUT_STORAGE_KEY = "nativeRequestTimeoutMs";
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const MIN_REQUEST_TIMEOUT_MS = 3000;
const MAX_REQUEST_TIMEOUT_MS = 20000;

let nativePort = null;
let timeoutCache = DEFAULT_REQUEST_TIMEOUT_MS;
let timeoutLoaded = false;

function getRuntime() {
  if (typeof browser !== "undefined" && browser.runtime) {
    return browser.runtime;
  }
  return chrome.runtime;
}

function getStorageLocal() {
  if (typeof browser !== "undefined" && browser.storage?.local) {
    return browser.storage.local;
  }
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return chrome.storage.local;
  }
  return null;
}

function clampTimeoutMs(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }
  return Math.min(MAX_REQUEST_TIMEOUT_MS, Math.max(MIN_REQUEST_TIMEOUT_MS, Math.round(parsed)));
}

async function loadTimeoutMs() {
  if (timeoutLoaded) {
    return timeoutCache;
  }

  const storage = getStorageLocal();
  if (!storage) {
    timeoutLoaded = true;
    return timeoutCache;
  }

  try {
    const maybePromise = storage.get(TIMEOUT_STORAGE_KEY);
    let values;

    if (maybePromise && typeof maybePromise.then === "function") {
      values = await maybePromise;
    } else {
      values = await new Promise((resolve) => {
        storage.get(TIMEOUT_STORAGE_KEY, (result) => resolve(result || {}));
      });
    }

    timeoutCache = clampTimeoutMs(values?.[TIMEOUT_STORAGE_KEY]);
  } catch {
    timeoutCache = DEFAULT_REQUEST_TIMEOUT_MS;
  }

  timeoutLoaded = true;
  return timeoutCache;
}

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeBackgroundError(error) {
  const raw = typeof error === "string" ? error : error?.message || "unknown";

  if (raw.includes("timeout")) {
    return "Le coffre ne repond pas assez vite. Reessayez.";
  }
  if (raw.includes("disconnected")) {
    return "La connexion avec l'application desktop a ete perdue.";
  }
  if (raw.includes("challenge")) {
    return "Session invalide. Reessayez l'action.";
  }

  return "Action impossible pour le moment.";
}

function ensurePort() {
  const runtime = getRuntime();

  if (nativePort) {
    return nativePort;
  }

  nativePort = runtime.connectNative(HOST_NAME);
  nativePort.onDisconnect.addListener(() => {
    nativePort = null;
  });

  return nativePort;
}

async function sendNative(message) {
  const timeoutMs = await loadTimeoutMs();

  return new Promise((resolve, reject) => {
    const port = ensurePort();
    let timer = null;

    const onMessage = (response) => {
      cleanup();
      resolve(response);
    };

    const onDisconnect = () => {
      cleanup();
      reject(new Error("native host disconnected"));
    };

    function cleanup() {
      if (timer) {
        clearTimeout(timer);
      }
      port.onMessage.removeListener(onMessage);
      port.onDisconnect.removeListener(onDisconnect);
    }

    port.onMessage.addListener(onMessage);
    port.onDisconnect.addListener(onDisconnect);

    timer = setTimeout(() => {
      cleanup();
      reject(new Error("native request timeout"));
    }, timeoutMs);

    port.postMessage(message);
  });
}

async function requestChallenge() {
  const response = await sendNative({ type: "get_challenge" });
  if (!response || response.type !== "challenge") {
    throw new Error("challenge denied");
  }
  return response.token;
}

async function listEntriesForOrigin(origin) {
  if (!isAllowedOrigin(origin)) {
    return { type: "error", message: "Origine non autorisee." };
  }

  const challenge = await requestChallenge();
  return sendNative({
    type: "list_entries",
    origin,
    challenge,
  });
}

async function fillForOrigin(origin, entryId) {
  if (!isAllowedOrigin(origin)) {
    return { type: "error", message: "Origine non autorisee." };
  }

  if (!entryId || typeof entryId !== "string") {
    return { type: "error", message: "Entree invalide." };
  }

  const challenge = await requestChallenge();
  return sendNative({
    type: "fill_for_origin",
    origin,
    entry_id: entryId,
    challenge,
    user_gesture: true,
  });
}

function runMessage(message, sender) {
  const senderUrl = sender?.url || "";

  switch (message?.type) {
    case "private_chest_list": {
      return listEntriesForOrigin(message.origin || senderUrl);
    }
    case "private_chest_fill": {
      return fillForOrigin(message.origin || senderUrl, message.entryId || "");
    }
    case "private_chest_lock": {
      return sendNative({ type: "lock" });
    }
    default:
      return Promise.resolve({ type: "error", message: "Requete inconnue." });
  }
}

getRuntime().onMessage.addListener((message, sender, sendResponse) => {
  runMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      sendResponse({
        type: "error",
        message: normalizeBackgroundError(error),
      });
    });

  return true;
});