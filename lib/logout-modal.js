(function () {
  if (window.__logoutModalInitialized) return;
  window.__logoutModalInitialized = true;

  function injectStyles() {
    if (document.getElementById("logoutModalStyles")) return;

    const style = document.createElement("style");
    style.id = "logoutModalStyles";
    style.textContent = `
      .logout-modal-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.38);
        z-index: 1000;
        padding: 16px;
      }

      .logout-modal-overlay.open {
        display: flex;
      }

      .logout-modal {
        width: min(460px, 100%);
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e9e9e9;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.2);
        padding: 24px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .logout-modal-title {
        margin: 0 0 10px;
        font-family: Montserrat, Inter, Arial, sans-serif;
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;
        color: #000;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .logout-modal-text {
        margin: 0;
        font-family: Inter, Arial, sans-serif;
        font-size: 16px;
        font-weight: 400;
        line-height: 1.45;
        color: #1a1a1a;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .logout-modal-actions {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .logout-modal-btn {
        border: none;
        border-radius: 10px;
        padding: 10px 16px;
        font-family: Inter, Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
      }

      .logout-modal-btn-cancel {
        background: #efefef;
        color: #1a1a1a;
      }

      .logout-modal-btn-confirm {
        background: #70170a;
        color: #fff;
      }

      .logout-modal-btn:hover {
        opacity: 0.92;
      }

      @media (max-width: 768px) {
        .logout-modal {
          width: min(380px, 100%);
          padding: 20px;
          border-radius: 14px;
        }

        .logout-modal-title {
          font-size: 22px;
        }

        .logout-modal-text {
          font-size: 15px;
        }

        .logout-modal-actions {
          justify-content: stretch;
        }

        .logout-modal-btn {
          flex: 1;
          font-size: 14px;
          padding: 11px 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createModal() {
    const overlay = document.createElement("div");
    overlay.className = "logout-modal-overlay";
    overlay.id = "logoutConfirmModal";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
      <div class="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle">
        <h2 id="logoutModalTitle" class="logout-modal-title">Log out?</h2>
        <p class="logout-modal-text">Are you sure you want to log out of your account?</p>
        <div class="logout-modal-actions">
          <button type="button" class="logout-modal-btn logout-modal-btn-cancel" id="logoutCancelBtn">Cancel</button>
          <button type="button" class="logout-modal-btn logout-modal-btn-confirm" id="logoutConfirmBtn">Log out</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function initializeLogoutModal() {
    injectStyles();

    const overlay = createModal();
    const cancelBtn = overlay.querySelector("#logoutCancelBtn");
    const confirmBtn = overlay.querySelector("#logoutConfirmBtn");

    function closeModal() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }

    function openModal() {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
    }

    document.querySelectorAll(".logout").forEach(function (logoutEl) {
      logoutEl.addEventListener("click", function (event) {
        event.preventDefault();
        openModal();
      });
    });

    // Also handle the logout button in the header menu dropdown
    const headerMenuLogoutBtn = document.getElementById("headerMenuLogoutBtn");
    if (headerMenuLogoutBtn) {
      headerMenuLogoutBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openModal();
      });
    }

    cancelBtn.addEventListener("click", closeModal);

    confirmBtn.addEventListener("click", async function () {
      confirmBtn.disabled = true;

      function clearAllSessionData() {
        try {
          // Wipe ALL Supabase auth keys from localStorage
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(function (key) { localStorage.removeItem(key); });
          localStorage.removeItem("rjgUserRole");
          localStorage.removeItem("accountData");
          localStorage.removeItem("adminAccountData");
        } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
      }

      // Use RJGDb.signOut() for proper session termination
      try {
        if (window.RJGDb && typeof window.RJGDb.signOut === "function") {
          await window.RJGDb.signOut();
        } else {
          // Fallback if RJGDb isn't ready
          const supabaseUrl = "https://jokoectulwjmawscvscf.supabase.co";
          const supabaseAnonKey = "sb_publishable_ps3FXfmZThtbKJ8R_OYwCw_VZ2ctyLr";
          if (window.supabase && typeof window.supabase.createClient === "function") {
            const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            await client.auth.signOut();
          }
        }
      } catch (e) {
        // Continue even if signOut fails; tokens must be cleared client-side
        console.error("Sign out error:", e);
      }

      clearAllSessionData();
      window.location.href = "../auth/log-sign.html";
    });

    overlay.addEventListener("click", function (event) {
      // Close on any click outside the modal (desktop & mobile)
      if (event.target === overlay) {
        closeModal();
      }
    });

    // Enhanced touch support for mobile — close on tap outside
    overlay.addEventListener("touchend", function (event) {
      const modal = overlay.querySelector(".logout-modal");
      const touch = event.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element === overlay || !modal.contains(element)) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("open")) {
        closeModal();
      }
    });

    // Export openModal as window.showLogoutModal for external scripts
    window.showLogoutModal = openModal;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLogoutModal);
  } else {
    initializeLogoutModal();
  }
})();