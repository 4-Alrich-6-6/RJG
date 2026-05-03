/**
 * for-you.js — Powers the "For You" page in Ready-Job-Go
 * Depends on: database.js (window.RJGDb), ai-job-matcher.js (window.RJGMatcher)
 */

(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────────────────────────
  let currentMode = "";         // "skills" | "work" | "location" | ""
  let isLoading   = false;

  // ─── DOM refs ───────────────────────────────────────────────────────────────
  const grid       = document.getElementById("fy-grid");
  const modeSelect = document.getElementById("forYouBasis");

  // ─── Render helpers ─────────────────────────────────────────────────────────

  function scoreColor(score) {
    if (score >= 70) return "#2d9f6e";   // green
    if (score >= 40) return "#e07b1a";   // amber
    return "#b0b0b0";                    // grey
  }

  function scoreLabel(score) {
    if (score >= 70) return "Great match";
    if (score >= 40) return "Possible match";
    return "Low match";
  }

  function renderSkillTags(skills) {
    if (!skills || !skills.length) return "";
    return skills
      .slice(0, 4)
      .map((s) => `<span class="fy-skill-tag">${escHtml(s)}</span>`)
      .join("") + (skills.length > 4 ? `<span class="fy-skill-tag fy-skill-more">+${skills.length - 4}</span>` : "");
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPreferenceSignals(job) {
    const signals = [];
    const prefs = job.matchedPreferences || {};

    if (prefs.schedule) signals.push({ icon: "🕐", label: "Schedule" });
    if (prefs.setting) signals.push({ icon: "🏢", label: "Setting" });
    if (prefs.type) signals.push({ icon: "💼", label: "Job Type" });
    if (prefs.rate) signals.push({ icon: "💰", label: "Rate" });

    if (!signals.length) return "";

    return `
      <div class="fy-signals">
        <span class="fy-signals-title">Based on your:</span>
        <div class="fy-signals-list">
          ${signals.map(s => `<span class="fy-signal-badge">${s.icon} ${s.label}</span>`).join("")}
        </div>
      </div>`;
  }

  function renderCard(job) {
    const color = scoreColor(job.matchScore);
    const label = scoreLabel(job.matchScore);
    const reasonsHtml = job.matchReasons && job.matchReasons.length
      ? `<ul class="fy-reasons">${job.matchReasons.map((r) => `<li>${escHtml(r)}</li>`).join("")}</ul>`
      : "";
    const appliedBadge = job.alreadyApplied
      ? `<span class="fy-applied-badge">Applied</span>`
      : "";
    const urgentBadge = job.urgent
      ? `<span class="fy-urgent-badge">Urgent</span>`
      : "";

    const detailPayload = encodeURIComponent(
      JSON.stringify({
        ...job,
        _moreSource: "foryou"
      })
    );

    const signalsHtml = renderPreferenceSignals(job);

    const imageHtml = job.image 
      ? `<img src="${escHtml(job.image)}" alt="" class="fy-card-img" loading="lazy">`
      : `<div class="fy-card-no-image">No Image</div>`;

    return `
      <article class="fy-card" data-job-detail="${detailPayload}" tabindex="0" role="button" aria-label="View ${escHtml(job.title)}">
        <div class="fy-card-image">${imageHtml}</div>
        <div class="fy-card-top">
          <div class="fy-card-title-row">
            <h2 class="fy-card-title">${escHtml(job.title)}</h2>
            <div class="fy-badges">${urgentBadge}${appliedBadge}</div>
          </div>
          <p class="fy-card-meta">${escHtml(job.category)} · ${escHtml(job.schedule)} · ${escHtml(job.type)}</p>
          <p class="fy-card-meta">${escHtml(job.location)}</p>
          ${job.rate ? `<p class="fy-card-rate">${escHtml(job.rate)}</p>` : ""}
        </div>
        <div class="fy-card-skills">${renderSkillTags(job.skills)}</div>
        ${signalsHtml}
        <div class="fy-match-bar">
          <div class="fy-match-score" style="color:${color}">
            <span class="fy-match-pct">${job.matchScore}%</span>
            <span class="fy-match-label">${label}</span>
          </div>
          <div class="fy-match-progress-track">
            <div class="fy-match-progress-fill" style="width:${job.matchScore}%;background:${color}"></div>
          </div>
        </div>
        ${reasonsHtml}
        <p class="fy-card-posted">${escHtml(job.postedAgo)}</p>
      </article>`;
  }

  function renderSkeleton(n) {
    return Array.from({ length: n }, () => `
      <div class="fy-card fy-card--skeleton" aria-hidden="true">
        <div class="fy-skel fy-skel--title"></div>
        <div class="fy-skel fy-skel--meta"></div>
        <div class="fy-skel fy-skel--meta short"></div>
        <div class="fy-skel fy-skel--bar"></div>
      </div>`).join("");
  }

  function renderEmpty() {
    return `
      <div class="fy-empty">
        <p class="fy-empty-icon">🔍</p>
        <p class="fy-empty-title">No recommendations yet</p>
        <p class="fy-empty-sub">Complete your profile with skills and work experience to get personalised matches.</p>
      </div>`;
  }

  function renderError(msg) {
    return `
      <div class="fy-empty fy-empty--error">
        <p class="fy-empty-icon">⚠️</p>
        <p class="fy-empty-title">Could not load recommendations</p>
        <p class="fy-empty-sub">${escHtml(msg)}</p>
        <button class="fy-retry-btn" onclick="refreshForYou()">Try again</button>
      </div>`;
  }

  // ─── Core load function ──────────────────────────────────────────────────────

  async function loadRecommendations() {
    if (isLoading) return;
    if (!grid) {
      console.error("[For You] Grid element (#fy-grid) not found in DOM");
      return;
    }
    isLoading = true;

    // Show skeletons immediately
    grid.innerHTML = renderSkeleton(8);

    try {
      console.log("[For You] Loading recommendations with mode:", currentMode);
      const jobs = await window.RJGMatcher.getRecommendations({
        mode: currentMode,
        topK: 8,
      });

      console.log("[For You] Got recommendations:", jobs?.length || 0, "jobs");

      if (!jobs || !jobs.length) {
        console.log("[For You] No recommendations found, showing empty state");
        grid.innerHTML = renderEmpty();
      } else {
        console.log("[For You] Rendering", jobs.length, "job cards");
        grid.innerHTML = jobs.map(renderCard).join("");
        attachCardListeners();
      }
    } catch (err) {
      console.error("[For You] Error loading recommendations:", err);
      const errorMsg = err.message || "Unknown error occurred";
      
      // Provide more specific error messages for common issues
      let userFriendlyMsg = errorMsg;
      if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
        userFriendlyMsg = "Network error. Please check your connection and try again.";
      } else if (errorMsg.includes("auth") || errorMsg.includes("unauthorized")) {
        userFriendlyMsg = "Authentication error. Please log in again.";
      } else if (errorMsg.includes("profile") || errorMsg.includes("incomplete")) {
        userFriendlyMsg = "Please complete your profile to get personalized recommendations.";
      }
      
      grid.innerHTML = renderError(userFriendlyMsg);
    } finally {
      isLoading = false;
    }
  }

  // ─── Card interaction ────────────────────────────────────────────────────────

  function attachCardListeners() {
    grid.querySelectorAll(".fy-card[data-job-detail]").forEach((card) => {
      card.addEventListener("click", () => openJobDetail(card.getAttribute("data-job-detail")));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openJobDetail(card.getAttribute("data-job-detail"));
      });
    });
  }

  /**
   * Delegates to the shared job-detail modal already present in for-you.html.
   * If window.SeekerApp.openJobDetail exists we call it, otherwise fall back
   * to dispatching a custom event that dashb.js / seeker-application.js can
   * listen to.
   */
  function openJobDetail(encodedPayload) {
    if (window.openJobDetailFromEncodedPayload && typeof window.openJobDetailFromEncodedPayload === "function") {
      window.openJobDetailFromEncodedPayload(encodedPayload);
      return;
    }
    sessionStorage.setItem("pendingJobDetailPayload", encodedPayload || "");
    window.location.href = "../seeker/for-you.html";
  }

  // ─── Public API (called from HTML) ───────────────────────────────────────────

  /** Called by the Refresh button and by the mode <select> */
  window.refreshForYou = function () {
    loadRecommendations();
  };

  // ─── Init ────────────────────────────────────────────────────────────────────

  function init() {
    if (modeSelect) {
      modeSelect.addEventListener("change", () => {
        currentMode = modeSelect.value || "";
        loadRecommendations();
      });
    }

    // Wait for RJGDb and RJGMatcher to be ready
    if (!window.RJGDb || !window.RJGMatcher) {
      console.warn("[For You] Waiting for RJGDb / RJGMatcher…");
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (window.RJGDb && window.RJGMatcher) {
          console.log("[For You] Dependencies loaded, starting recommendations");
          clearInterval(poll);
          loadRecommendations();
        } else if (attempts > 20) {
          clearInterval(poll);
          console.error("[For You] Dependencies failed to load after 3 seconds");
          if (grid) {
            const missingDeps = [];
            if (!window.RJGDb) missingDeps.push("RJGDb (database.js)");
            if (!window.RJGMatcher) missingDeps.push("RJGMatcher (ai-job-matcher.js)");
            grid.innerHTML = renderError(`Missing dependencies: ${missingDeps.join(", ")}. Please refresh the page.`);
          }
        }
      }, 150);
    } else {
      console.log("[For You] Dependencies already available, starting recommendations");
      loadRecommendations();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Update menu notification indicator with unread count
  (function updateMenuNotificationIndicator() {
    async function refreshMenuIndicator() {
      const indicator = document.getElementById('menuNotificationIndicator');
      if (!indicator || !window.RJGDb || typeof window.RJGDb.countUnreadNotifications !== 'function') return;
      try {
        const count = await window.RJGDb.countUnreadNotifications();
        if (count > 0) {
          indicator.hidden = false;
        } else {
          indicator.hidden = true;
        }
      } catch (e) {
        console.warn('[For You] Failed to update menu notification indicator:', e);
      }
    }

    // Update immediately
    refreshMenuIndicator();
    
    // Update every 30 seconds
    setInterval(refreshMenuIndicator, 30000);
    
    // Update when page becomes visible again
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        refreshMenuIndicator();
      }
    });
  })();
})();