(function () {
  "use strict";
  const ROLE_CACHE_KEY = "rjgUserRole";

  function basename(pathname) {
    const p = String(pathname || "").split("?")[0].split("#")[0];
    const parts = p.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1].toLowerCase() : "";
  }

  function hideMenuForRole(role) {
    const navLinks = Array.from(document.querySelectorAll(".nav a[href]"));
    const headerLinks = Array.from(document.querySelectorAll("#headerMenuDropdown a[href]"));
    const roleLower = String(role || "").toLowerCase();
    if (roleLower) document.documentElement.setAttribute("data-rjg-role", roleLower);

    const isRecruiter = roleLower === "recruiter" || roleLower === "employer";

    // Always explicitly set each link's visibility so a second call with the correct
    // role fully corrects any nav state left by a stale cached role call.
    navLinks.forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href.includes("dashb.html") || href.includes("for-you.html")) {
        a.style.display = isRecruiter ? "none" : "";
      }
    });

    headerLinks.forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href.includes("application.html") || href.includes("bookmark.html")) {
        a.style.display = isRecruiter ? "none" : "";
      }
    });
  }

  function readCachedRole() {
    try {
      const role = sessionStorage.getItem(ROLE_CACHE_KEY) || localStorage.getItem(ROLE_CACHE_KEY) || "";
      return String(role).toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function writeCachedRole(role) {
    const normalized = String(role || "").toLowerCase();
    if (!normalized) return;
    try {
      sessionStorage.setItem(ROLE_CACHE_KEY, normalized);
      localStorage.setItem(ROLE_CACHE_KEY, normalized);
    } catch (e) {
    }
  }

  async function enforceRoleAccess() {
    const page = basename(window.location.pathname);
    const cachedRole = readCachedRole();
    if (cachedRole) hideMenuForRole(cachedRole);

    if (!window.RJGDb || typeof window.RJGDb.getCurrentUserRole !== "function") return;

    // Get role from database (not localStorage) - returns empty string if no valid session
    const role = await window.RJGDb.getCurrentUserRole();
    const roleLower = String(role || "seeker").toLowerCase();

    // Only cache role if we have a valid database session
    if (role && String(role).trim()) {
      writeCachedRole(roleLower);
    }
    hideMenuForRole(roleLower);

    const seekerOnly = new Set(["dashb.html", "for-you.html", "application.html", "bookmark.html", "dashboard-section.html"]);
    const recruiterOnly = new Set(["recruiter-dashb.html", "recruiter-profile.html", "recruiter-account.html"]);
    const adminOnly = new Set(["admin-dashboard.html"]);

    // Only redirect if we have a confirmed database session, not just cached role
    const liveRoleAvailable = !!(role && String(role).trim());
    if (!liveRoleAvailable) return;

    // Admin redirect - if admin is not on admin dashboard, redirect there
    if (roleLower === "admin" && !adminOnly.has(page)) {
      window.location.href = "../admin/admin-dashboard.html";
      return;
    }

    if ((roleLower === "recruiter" || roleLower === "employer") && seekerOnly.has(page)) {
      window.location.href = "../recruiter/recruiter-dashb.html";
      return;
    }
    if (roleLower !== "recruiter" && roleLower !== "employer" && recruiterOnly.has(page)) {
      window.location.href = "../seeker/dashb.html";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enforceRoleAccess);
  } else {
    enforceRoleAccess();
  }
})();