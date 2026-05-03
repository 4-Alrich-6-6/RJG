(function () {
  if (window.showAppToast) return;

  const STYLE_ID = "appToastStyles";
  const CONTAINER_ID = "appToastContainer";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .app-toast-container {
        position: fixed;
        right: 16px;
        bottom: 18px;
        z-index: 1500;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .app-toast {
        min-width: 220px;
        max-width: min(86vw, 360px);
        border-radius: 12px;
        padding: 10px 12px;
        color: #fff;
        font-family: Inter, Arial, sans-serif;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.35;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
        transform: translateY(8px);
        opacity: 0;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }

      .app-toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .app-toast.success { background: #2f7d32; }
      .app-toast.info { background: #2f5ea8; }
      .app-toast.warn { background: #9a6700; }

      @media (max-width: 768px) {
        .app-toast-container {
          left: 10px;
          right: 10px;
          bottom: 14px;
        }

        .app-toast {
          max-width: 100%;
          font-size: 12px;
          padding: 9px 11px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (container) return container;
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className = "app-toast-container";
    document.body.appendChild(container);
    return container;
  }

  window.showAppToast = function showAppToast(message, type, durationMs) {
    if (!message) return;
    ensureStyles();
    const container = ensureContainer();
    const toast = document.createElement("div");
    toast.className = `app-toast ${type || "success"}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("show");
    });

    const duration = typeof durationMs === "number" ? durationMs : 2300;
    window.setTimeout(function () {
      toast.classList.remove("show");
      window.setTimeout(function () {
        toast.remove();
      }, 220);
    }, duration);
  };
})();
