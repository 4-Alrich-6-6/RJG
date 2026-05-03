/**
 * Auth Guard - Protects pages that require authentication
 * Shows a login modal for unauthenticated users
 * Enforces role-based access for recruiter and seeker pages
 */

(function () {
  "use strict";

  const PROTECTED_PAGES = new Set([
    "dashb.html",
    "for-you.html",
    "application.html",
    "bookmark.html",
    "job-posting.html",
    "recruiter-dashb.html",
    "recruiter-profile.html",
    "recruiter-account.html",
    "preferences.html",
    "setup.html",
    "admin-dashboard.html",
    "admin-account.html",
    "notifications.html",
    "profile.html",
    "account.html",
    "dashboard-section.html"
  ]);

  const PUBLIC_PAGES = new Set([
    "log-sign.html",
    "admin-log-sign.html",
    "signverf.html",
    "forgot-password.html",
    "reset-password.html",
    "index.html",
    ""
  ]);

  const RECRUITER_ONLY_PAGES = new Set([
    "recruiter-dashb.html",
    "recruiter-profile.html",
    "recruiter-account.html"
  ]);

  const SEEKER_ONLY_PAGES = new Set([
    "dashb.html",
    "for-you.html",
    "application.html",
    "bookmark.html",
    "preferences.html"
  ]);

  function basename(pathname) {
    const p = String(pathname || "").split("?")[0].split("#")[0];
    const parts = p.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1].toLowerCase() : "";
  }

  function isProtectedPage(page) {
    return PROTECTED_PAGES.has(page) || PROTECTED_PAGES.has(page + ".html");
  }

  function isPublicPage(page) {
    return PUBLIC_PAGES.has(page) || PUBLIC_PAGES.has(page + ".html");
  }

  function isRecruiterLikeRole(role) {
    const r = String(role || "").toLowerCase();
    return r === "recruiter" || r === "employer";
  }

  async function checkAuth() {
    const currentPage = basename(window.location.pathname);

    if (isPublicPage(currentPage)) return;
    if (!isProtectedPage(currentPage)) return;

    const supa = window.RJGDb?.getClient?.();
    if (!supa) {
      showLoginModal();
      return;
    }

    try {
      const { data: { user } } = await supa.auth.getUser();
      if (!user) {
        showLoginModal();
        return;
      }

      let userRole = "";
      if (window.RJGDb && typeof window.RJGDb.getCurrentUserRole === "function") {
        try {
          userRole = (await window.RJGDb.getCurrentUserRole()) || "";
        } catch (e) {}
      }

      const isRecruiter = isRecruiterLikeRole(userRole);

      if (RECRUITER_ONLY_PAGES.has(currentPage) && !isRecruiter) {
        window.location.href = "../auth/log-sign.html";
        return;
      }

      if (SEEKER_ONLY_PAGES.has(currentPage) && isRecruiter) {
        window.location.href = "../recruiter/job-posting.html";
        return;
      }
    } catch (err) {
      showLoginModal();
    }
  }

  function showLoginModal() {
    // Store intended destination so we can redirect after login
    sessionStorage.setItem("authGuardRedirect", window.location.href);

    // Use app-confirm modal if available
    if (typeof window.showAppConfirmModal === "function") {
      window.showAppConfirmModal({
        title: "Login Required",
        message: "You need to log in first before you can view this page.",
        confirmLabel: "Go to Login",
        hideCancel: true,
        danger: false,
        onConfirm: () => {
          window.location.href = "../auth/log-sign.html";
        }
      });
    } else {
      // Fallback: console error then redirect
      console.error("You need to log in first before you can view this page.");
      window.location.href = "../auth/log-sign.html";
    }
  }

  // Run auth check when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAuth);
  } else {
    checkAuth();
  }
})();
