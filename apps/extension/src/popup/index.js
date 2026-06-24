function getRuntime() {
  if (typeof browser !== "undefined" && browser.runtime) {
    return browser.runtime;
  }
  return chrome.runtime;
}
const lockBtn = document.getElementById("lockBtn");
const notice = document.getElementById("notice");

function setNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("error", isError);
}

lockBtn?.addEventListener("click", async () => {
  lockBtn.disabled = true;
  setNotice("");

  try {
    const response = await getRuntime().sendMessage({ type: "private_chest_lock" });
    if (!response || response.type === "error") {
      setNotice(response?.message || "Impossible de verrouiller le coffre.", true);
      return;
    }

    setNotice("Vault locked.");
    setTimeout(() => window.close(), 400);
  } catch {
    setNotice("Impossible de contacter l'application desktop.", true);
  } finally {
    lockBtn.disabled = false;
  }
});