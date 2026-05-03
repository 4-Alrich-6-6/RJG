(function () {
  if (window.showBanNotificationModal) return;

  const STYLE_ID = "banNotificationModalStyles";
  const OVERLAY_ID = "banNotificationOverlay";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ban-notification-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        padding: 16px;
        overflow-y: auto;
      }

      .ban-notification-overlay.open {
        display: flex;
      }

      .ban-notification-modal {
        width: min(480px, 100%);
        max-height: min(90vh, 600px);
        overflow-y: auto;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e9e9e9;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 32px;
        text-align: center;
      }

      .ban-notification-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 20px;
        background: #dc3545;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: white;
      }

      .ban-notification-title {
        margin: 0 0 16px;
        font-family: Montserrat, Inter, sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #dc3545;
        line-height: 1.2;
      }

      .ban-notification-message {
        margin: 0 0 24px;
        font-family: Inter, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
      }

      .ban-notification-support-info {
        margin: 0 0 32px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        font-family: Inter, sans-serif;
        font-size: 14px;
        color: #666;
      }

      .ban-notification-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-family: Inter, sans-serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .ban-notification-btn:hover {
        background: #c82333;
      }

      .ban-notification-btn:focus {
        outline: 2px solid #dc3545;
        outline-offset: 2px;
      }

      @media (max-width: 768px) {
        .ban-notification-modal {
          width: min(380px, 100%);
          max-height: 95vh;
          padding: 24px;
          margin: 16px;
        }

        .ban-notification-title {
          font-size: 24px;
        }

        .ban-notification-message {
          font-size: 15px;
        }

        .ban-notification-btn {
          width: 100%;
          padding: 14px 20px;
          font-size: 15px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "ban-notification-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="ban-notification-modal" role="dialog" aria-modal="true" aria-labelledby="banNotificationTitle">
        <div class="ban-notification-icon">🚫</div>
        <h2 class="ban-notification-title" id="banNotificationTitle">Account Suspended</h2>
        <p class="ban-notification-message">
          You got banned. Contact support for more inquiries.
        </p>
        <div class="ban-notification-support-info">
          <strong>Need assistance?</strong><br>
          If you believe this is an error or need more information, please contact our support team.
        </div>
        <button type="button" class="ban-notification-btn" id="banNotificationBtn">
          Log-out
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    function closeBanNotification() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }

    // Handle button click - redirect to login
    overlay.querySelector("#banNotificationBtn").addEventListener("click", () => {
      // Clear any stored session data
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore storage errors
      }
      
      // Redirect to login page
      window.location.href = "../auth/log-sign.html";
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        // For banned users, we don't allow closing with escape - they must go to login
        return;
      }
    });

    // Prevent closing by clicking outside
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        // Don't allow closing by clicking outside - banned users must go to login
        return;
      }
    });

    return overlay;
  }

  window.showBanNotificationModal = function showBanNotificationModal(options = {}) {
    ensureStyles();
    const overlay = ensureOverlay();
    
    // Update content if custom options provided
    if (options.title) {
      overlay.querySelector("#banNotificationTitle").textContent = options.title;
    }
    if (options.message) {
      overlay.querySelector(".ban-notification-message").textContent = options.message;
    }
    if (options.buttonText) {
      overlay.querySelector("#banNotificationBtn").textContent = options.buttonText;
    }
    
    // Show the modal
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    
    // Prevent scrolling of background content
    document.body.style.overflow = "hidden";
    
    console.log("Ban notification modal displayed");
  };

  // Function to hide the modal (mostly for internal use)
  window.hideBanNotificationModal = function hideBanNotificationModal() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "";
    }
  };

})();
