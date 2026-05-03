/**
 * app-loader.js  –  RJG Global Loading & Offline Screen
 *
 * Drop ONE script tag at the very top of <body> (or end of <head>) on any page:
 *   <script src="app-loader.js"></script>
 *
 * API (window.RJGLoader):
 *   RJGLoader.show(message?)   – show loader with optional message
 *   RJGLoader.hide()           – fade-out and remove loader
 *   RJGLoader.progress(0-100) – switch to determinate bar (pass pct)
 *   RJGLoader.update(message)  – change the status message while loading
 *
 * Offline overlay appears automatically when navigator.onLine === false
 * and auto-dismisses when the connection returns.
 */

(function () {
  "use strict";

  /* ─── 1. INJECT STYLES ─────────────────────────────────────────────── */
  const STYLE = `
    /* ── Shared ── */
    #rjg-loader, #rjg-offline {
      font-family: Montserrat, 'DM Sans', Inter, sans-serif;
      box-sizing: border-box;
    }
    #rjg-loader *, #rjg-offline * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Loader overlay ── */
    #rjg-loader {
      position: fixed;
      inset: 0;
      z-index: 99998;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      background: #fff;
      transition: opacity 0.35s ease;
    }
    #rjg-loader .rl-logo {
      width: 76px; height: 76px;
      object-fit: contain;
      animation: rl-pulse 2s ease-in-out infinite;
      filter: drop-shadow(0 4px 18px rgba(91,140,81,.22));
    }
    @keyframes rl-pulse {
      0%,100% { transform: scale(1);    opacity: 1;   }
      50%      { transform: scale(1.08); opacity: .72; }
    }
    #rjg-loader .rl-label {
      font-size: 10px; font-weight: 600;
      letter-spacing: 4px; text-transform: uppercase; color: #bbb;
    }
    #rjg-loader .rl-msg {
      font-size: 14px; font-weight: 500;
      color: #1a1a1a; letter-spacing: .3px; min-height: 20px;
    }
    #rjg-loader .rl-track {
      width: 200px; height: 3px;
      background: #ebebeb; border-radius: 99px; overflow: hidden;
    }
    #rjg-loader .rl-fill {
      height: 100%; width: 0%;
      background: linear-gradient(90deg,#5b8c51 0%,#3775F0 100%);
      border-radius: 99px;
      transition: width .35s cubic-bezier(.4,0,.2,1);
      animation: rl-indeterminate 1.6s ease-in-out infinite;
    }
    @keyframes rl-indeterminate {
      0%   { transform: translateX(-100%) scaleX(.4); }
      50%  { transform: translateX(0%)    scaleX(.8); }
      100% { transform: translateX(100%)  scaleX(.4); }
    }
    #rjg-loader .rl-dots { display: flex; gap: 7px; }
    #rjg-loader .rl-dots span {
      width: 6px; height: 6px; border-radius: 50%; background: #5b8c51;
      animation: rl-bounce 1.3s ease-in-out infinite;
    }
    #rjg-loader .rl-dots span:nth-child(2) { animation-delay:.15s; background:#89b87f; }
    #rjg-loader .rl-dots span:nth-child(3) { animation-delay:.30s; background:#3775F0; }
    @keyframes rl-bounce {
      0%,80%,100% { transform:translateY(0);    opacity:.45; }
      40%          { transform:translateY(-8px); opacity:1;  }
    }

    /* ── Offline overlay ── */
    #rjg-offline {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      background: #fff;
      padding: 32px;
      text-align: center;
    }
    #rjg-offline.visible { display: flex; }
    #rjg-offline .ro-logo {
      width: 64px; height: 64px;
      object-fit: contain;
      filter: grayscale(1) opacity(.35);
    }
    #rjg-offline .ro-wifi-wrap {
      position: relative;
      width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
    }
    #rjg-offline .ro-ring {
      position: absolute; inset: -10px;
      border-radius: 50%;
      border: 2px solid rgba(239,68,68,.2);
      animation: ro-ring 2s ease-out infinite;
    }
    @keyframes ro-ring {
      0%   { transform:scale(.85); opacity:1; }
      100% { transform:scale(1.4); opacity:0; }
    }
    #rjg-offline .ro-wifi {
      position: relative; width: 64px; height: 50px;
    }
    #rjg-offline .ro-arc {
      position: absolute;
      border: 3px solid #d1d5db;
      border-bottom: none;
      border-radius: 50% 50% 0 0;
      left: 50%; transform: translateX(-50%);
    }
    #rjg-offline .ro-arc1 { width:64px; height:32px; top:0; }
    #rjg-offline .ro-arc2 { width:42px; height:21px; top:10px; }
    #rjg-offline .ro-arc3 { width:20px; height:10px; top:20px; }
    #rjg-offline .ro-dot {
      position:absolute; width:7px; height:7px;
      background:#d1d5db; border-radius:50%;
      bottom:0; left:50%; transform:translateX(-50%);
    }
    #rjg-offline .ro-slash {
      position:absolute; width:3px; height:72px;
      background:#ef4444; border-radius:2px;
      top:-11px; left:50%;
      transform:translateX(-50%) rotate(45deg);
    }
    #rjg-offline .ro-label {
      font-size: 10px; font-weight: 600;
      letter-spacing: 3.5px; text-transform: uppercase; color: #bbb;
    }
    #rjg-offline .ro-title {
      font-size: 20px; font-weight: 700;
      color: #1a1a1a; line-height: 1.3; max-width: 280px;
    }
    #rjg-offline .ro-sub {
      font-size: 13px; color: #888; line-height: 1.7; max-width: 260px;
    }
    #rjg-offline .ro-btn {
      margin-top: 6px;
      font-family: inherit;
      font-size: 13px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase;
      padding: 13px 32px;
      background: #5b8c51; color: #fff;
      border: none; border-radius: 7px; cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      transition: background .2s, transform .15s;
    }
    #rjg-offline .ro-btn:hover  { background: #2d5a28; }
    #rjg-offline .ro-btn:active { transform: scale(.97); }
    #rjg-offline .ro-btn.spinning .ro-icon {
      animation: ro-spin .8s linear infinite;
    }
    @keyframes ro-spin { to { transform: rotate(360deg); } }
  `;

  var styleEl = document.createElement("style");
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ─── 2. INJECT LOADER HTML ─────────────────────────────────────────── */
  var loaderEl = document.createElement("div");
  loaderEl.id = "rjg-loader";
  loaderEl.setAttribute("role", "status");
  loaderEl.setAttribute("aria-live", "polite");
  loaderEl.setAttribute("aria-label", "Loading");
  loaderEl.innerHTML = `
    <img src="../assets/images/Logo_RJG.png" alt="Ready-Job-Go" class="rl-logo">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
      <span class="rl-label">RJG</span>
      <span class="rl-msg" id="rjg-loader-msg">Loading…</span>
    </div>
    <div class="rl-track"><div class="rl-fill" id="rjg-loader-bar"></div></div>
    <div class="rl-dots"><span></span><span></span><span></span></div>
  `;

  /* ─── 3. INJECT OFFLINE HTML ────────────────────────────────────────── */
  var offlineEl = document.createElement("div");
  offlineEl.id = "rjg-offline";
  offlineEl.setAttribute("role", "alert");
  offlineEl.setAttribute("aria-live", "assertive");
  offlineEl.innerHTML = `
    <img src="../assets/images/Logo_RJG.png" alt="Ready-Job-Go" class="ro-logo">
    <div class="ro-wifi-wrap">
      <div class="ro-ring"></div>
      <div class="ro-wifi">
        <div class="ro-arc ro-arc1"></div>
        <div class="ro-arc ro-arc2"></div>
        <div class="ro-arc ro-arc3"></div>
        <div class="ro-dot"></div>
        <div class="ro-slash"></div>
      </div>
    </div>
    <span class="ro-label">RJG</span>
    <h1 class="ro-title">You're Offline.</h1>
    <p class="ro-sub">Please check your internet connection and try again.</p>
    <button class="ro-btn" id="rjg-retry-btn" aria-label="Retry connection">
      <svg class="ro-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/>
      </svg>
      Try Again
    </button>
  `;

  /* Append both overlays as soon as the body is available */
  function mountOverlays() {
    document.body.insertBefore(loaderEl, document.body.firstChild);
    document.body.insertBefore(offlineEl, document.body.firstChild);
    _initOffline();
  }

  if (document.body) {
    mountOverlays();
  } else {
    document.addEventListener("DOMContentLoaded", mountOverlays);
  }

  /* ─── 4. LOADER API ─────────────────────────────────────────────────── */
  var barEl, msgEl;

  function _getEls() {
    if (!barEl) barEl = document.getElementById("rjg-loader-bar");
    if (!msgEl) msgEl = document.getElementById("rjg-loader-msg");
  }

  window.RJGLoader = {
    /**
     * Show the loader. Optionally pass a status message.
     * @param {string} [message]
     */
    show: function (message) {
      _getEls();
      if (msgEl) msgEl.textContent = message || "Loading…";
      if (barEl) {
        barEl.style.animation = "rl-indeterminate 1.6s ease-in-out infinite";
        barEl.style.width = "0%";
      }
      loaderEl.style.opacity = "1";
      loaderEl.style.display = "flex";
    },

    /** Fade out and hide the loader. */
    hide: function () {
      loaderEl.style.transition = "opacity 0.35s ease";
      loaderEl.style.opacity = "0";
      setTimeout(function () { loaderEl.style.display = "none"; }, 380);
    },

    /**
     * Switch the bar to determinate mode and set a percentage (0–100).
     * @param {number} pct
     */
    progress: function (pct) {
      _getEls();
      if (!barEl) return;
      barEl.style.animation = "none";
      barEl.style.width = Math.min(100, Math.max(0, pct)) + "%";
    },

    /**
     * Update the status message while the loader is visible.
     * @param {string} message
     */
    update: function (message) {
      _getEls();
      if (msgEl) msgEl.textContent = message;
    }
  };

  /* ─── 5. OFFLINE LOGIC ──────────────────────────────────────────────── */
  function _initOffline() {
    var retryBtn = document.getElementById("rjg-retry-btn");

    function showOffline() { offlineEl.classList.add("visible"); }
    function hideOffline() { offlineEl.classList.remove("visible"); }

    /* Show immediately if already offline */
    if (!navigator.onLine) showOffline();

    window.addEventListener("offline", showOffline);
    window.addEventListener("online",  function () {
      hideOffline();
      window.location.reload();
    });

    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        retryBtn.classList.add("spinning");
        retryBtn.disabled = true;
        setTimeout(function () {
          retryBtn.classList.remove("spinning");
          retryBtn.disabled = false;
          if (navigator.onLine) {
            window.location.reload();
          }
        }, 1500);
      });
    }
  }

  /* ─── 6. AUTO-HIDE LOADER ON DOMContentLoaded ───────────────────────── */
  // Pages can override this by calling RJGLoader.show() explicitly and
  // then RJGLoader.hide() when their own async work is done.
  // By default we hide as soon as the DOM is ready.
  document.addEventListener("DOMContentLoaded", function () {
    // Small delay so the loader is at least briefly visible on fast loads
    setTimeout(function () { window.RJGLoader.hide(); }, 400);
  });

})();
