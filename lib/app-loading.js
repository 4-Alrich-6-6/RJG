// RJG Loading Overlay Utility
// Usage: window.RJGLoading.show("Message...") / window.RJGLoading.hide()

(function () {
  function ensureOverlay() {
    let overlay = document.getElementById("rjgLoadingOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "rjgLoadingOverlay";
      overlay.className = "rjg-loading-overlay";
      overlay.hidden = true;
      overlay.innerHTML = `
        <div class="rjg-loading-spinner"></div>
        <p class="rjg-loading-text" id="rjgLoadingText">Please wait...</p>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function show(message) {
    const overlay = ensureOverlay();
    const text = document.getElementById("rjgLoadingText");
    if (text) text.textContent = message || "Please wait...";
    overlay.hidden = false;
  }

  function hide() {
    const overlay = document.getElementById("rjgLoadingOverlay");
    if (overlay) overlay.hidden = true;
  }

  window.RJGLoading = { show, hide };
})();