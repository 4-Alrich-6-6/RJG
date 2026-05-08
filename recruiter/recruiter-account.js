(function () {
  "use strict";

  // ── Auth guard ──
  async function enforceRecruiter() {
    if (!window.RJGDb || typeof window.RJGDb.getCurrentUserRole !== "function") return;
    try {
      const role = (await window.RJGDb.getCurrentUserRole()) || "";
      const r = role.toLowerCase();
      if (!r) { window.location.href = "../auth/log-sign.html"; return; }
      if (r !== "recruiter" && r !== "employer") { window.location.href = "../seeker/account.html"; }
      try { sessionStorage.setItem("rjgUserRole", r); localStorage.setItem("rjgUserRole", r); } catch (e) {}
    } catch (e) { console.error("Role check failed:", e); }
  }

  // ── Back button ──
  const backBtn = document.getElementById("accountBackBtn");
  if (backBtn) backBtn.addEventListener("click", function () { window.location.href = "../recruiter/recruiter-dashb.html"; });

  // ── Logout ──
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (window.showLogoutModal) { window.showLogoutModal(); return; }
      if (window.RJGDb && typeof window.RJGDb.resetClient === "function") {
        window.RJGDb.resetClient().then(function () { window.location.href = "../auth/log-sign.html"; });
      } else {
        window.location.href = "../auth/log-sign.html";
      }
    });
  }

  // ── Elements ──
  const raEmailValue = document.getElementById("raEmailValue");
  const raPasswordValue = document.getElementById("raPasswordValue");
  
  const raOtpOverlay = document.getElementById("raOtpOverlay");
  const raEditOverlay = document.getElementById("raEditOverlay");
  const raOtpForm = document.getElementById("raOtpForm");
  const raOtpInput = document.getElementById("raOtpInput");
  const raOtpSubmitBtn = document.getElementById("raOtpSubmitBtn");
  const raSendOtpBtn = document.getElementById("raSendOtpBtn");
  const raOtpText = document.getElementById("raOtpText");
  const raEditTitle = document.getElementById("raEditTitle");
  const raEditText = document.getElementById("raEditText");
  const raEditForm = document.getElementById("raEditForm");
  const raEditEmailRow = document.getElementById("raEditEmailRow");
  const raEditPasswordRow = document.getElementById("raEditPasswordRow");
  const raEditConfirmPasswordRow = document.getElementById("raEditConfirmPasswordRow");
  const raEditEmailInput = document.getElementById("raEditEmailInput");
  const raEditPasswordInput = document.getElementById("raEditPasswordInput");
  const raEditConfirmPasswordInput = document.getElementById("raEditConfirmPasswordInput");
  const raEditSubmitBtn = document.getElementById("raEditSubmitBtn");
  const raDeleteBtn = document.getElementById("raDeleteBtn");
  const raDeleteOverlay = document.getElementById("raDeleteOverlay");
  const raDeleteForm = document.getElementById("raDeleteForm");
  const raDeletePasswordInput = document.getElementById("raDeletePasswordInput");
  const raDeleteSubmitBtn = document.getElementById("raDeleteSubmitBtn");
  console.log("Recruiter delete button element found:", raDeleteBtn);

  let currentEditSection = null;

  function notify(msg, type) {
    if (window.showAppToast) window.showAppToast(msg, type || "info");
  }

  function formatDate(raw) {
    if (!raw) return "Not set";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? "Not set" : d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  // ── Load real data from DB ──
  async function loadAccountData() {
    if (!window.RJGDb) return;
    try {
      const [profileResult, userResult] = await Promise.allSettled([
        typeof window.RJGDb.loadCurrentUserProfile === "function" ? window.RJGDb.loadCurrentUserProfile() : Promise.resolve(null),
        typeof window.RJGDb.currentUser === "function" ? window.RJGDb.currentUser() : Promise.resolve(null)
      ]);
      const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
      const user = userResult.status === "fulfilled" ? userResult.value : null;
      const email = (profile && profile.email) || (user && user.email) || "";
      const createdAt = (user && user.created_at) || "";
      const lastSignIn = (user && user.last_sign_in_at) || "";
      if (raEmailValue) { raEmailValue.textContent = email || "—"; raEmailValue.setAttribute("title", email || ""); }
            const cached = { email };
      try { localStorage.setItem("accountData", JSON.stringify(cached)); } catch (e) {}
    } catch (e) {
      console.error("Failed to load account data:", e);
      renderFromCache();
    }
  }

  function renderFromCache() {
    try {
      const d = JSON.parse(localStorage.getItem("accountData") || "{}");
      if (raEmailValue) { raEmailValue.textContent = d.email || "—"; }
    } catch (e) {}
  }

  // ── Modal helpers ──
  function openModal(overlay) {
    if (!overlay) return;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal(overlay) {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function resetOtpModal() {
    if (raOtpInput) raOtpInput.value = "";
    if (raOtpSubmitBtn) { raOtpSubmitBtn.disabled = true; }
    if (raSendOtpBtn) { raSendOtpBtn.disabled = false; raSendOtpBtn.textContent = "Send OTP"; }
  }

  function resetEditModal() {
    if (raEditForm) raEditForm.reset();
    if (raEditSubmitBtn) raEditSubmitBtn.disabled = true;
  }

  function validateOtp() {
    if (!raOtpInput || !raOtpSubmitBtn) return;
    const valid = /^\d{4,8}$/.test(raOtpInput.value.trim());
    raOtpSubmitBtn.disabled = !valid;
  }

  function validateEditForm() {
    if (!currentEditSection || !raEditSubmitBtn) return;
    let valid = false;
    if (currentEditSection === "email") {
      valid = raEditEmailInput && raEditEmailInput.value.trim().includes("@") && raEditEmailInput.value.trim().length > 5;
    } else if (currentEditSection === "password") {
      const pw = raEditPasswordInput ? raEditPasswordInput.value.trim() : "";
      const cpw = raEditConfirmPasswordInput ? raEditConfirmPasswordInput.value.trim() : "";
      valid = pw.length >= 8 && pw === cpw;
    }
    raEditSubmitBtn.disabled = !valid;
  }

  // ── OTP send ──
  async function sendOtp(email) {
    try {
      if (window.RJGDb && typeof window.RJGDb.sendVerificationOtp === "function") {
        await window.RJGDb.sendVerificationOtp(email);
        return true;
      }
      notify("Database not ready. Please refresh.", "error");
      return false;
    } catch (e) {
      // Handle rate limit error with user-friendly message
      if (e && e.code === 'over_email_send_rate_limit') {
        notify("The rate limit for email sending is currently reached. Please wait for an hour and try again.", "info");
      } else {
        // Use user-friendly error handling for unknown errors
        if (window.RJGErrorHandler && window.RJGErrorHandler.showUserError) {
          window.RJGErrorHandler.showUserError(e, "Failed to send OTP. Please try again.");
        } else {
          notify("Failed to send OTP. Please try again.", "error");
        }
      }
      return false;
    }
  }

  function openOtpPrompt(section) {
    currentEditSection = section;
    if (raOtpText) raOtpText.textContent = `Click "Send OTP" to verify your identity before editing your ${section}.`;
    resetOtpModal();
    openModal(raOtpOverlay);
  }

  function openEditModal() {
    resetEditModal();
    const cached = (() => { try { return JSON.parse(localStorage.getItem("accountData") || "{}"); } catch(e) { return {}; } })();
    if (currentEditSection === "email") {
      if (raEditTitle) raEditTitle.textContent = "Update Email";
      if (raEditText) raEditText.textContent = "Enter a new email address.";
      if (raEditEmailRow) raEditEmailRow.classList.remove("ra-modal-hidden");
      if (raEditPasswordRow) raEditPasswordRow.classList.add("ra-modal-hidden");
      if (raEditConfirmPasswordRow) raEditConfirmPasswordRow.classList.add("ra-modal-hidden");
      if (raEditEmailInput) { raEditEmailInput.value = cached.email || ""; raEditEmailInput.focus(); }
    } else if (currentEditSection === "password") {
      if (raEditTitle) raEditTitle.textContent = "Update Password";
      if (raEditText) raEditText.textContent = "Enter and confirm your new password.";
      if (raEditEmailRow) raEditEmailRow.classList.add("ra-modal-hidden");
      if (raEditPasswordRow) raEditPasswordRow.classList.remove("ra-modal-hidden");
      if (raEditConfirmPasswordRow) raEditConfirmPasswordRow.classList.remove("ra-modal-hidden");
      if (raEditPasswordInput) raEditPasswordInput.focus();
    }
    validateEditForm();
    openModal(raEditOverlay);
  }

  // ── Event wiring ──
  if (raSendOtpBtn) {
    raSendOtpBtn.addEventListener("click", function () {
      const cached = (() => { try { return JSON.parse(localStorage.getItem("accountData") || "{}"); } catch(e) { return {}; } })();
      const email = cached.email || "";
      if (!email) { notify("Email not found. Please sign in again.", "warn"); return; }
      raSendOtpBtn.disabled = true; raSendOtpBtn.textContent = "Sending…";
      if (raOtpText) raOtpText.textContent = `Sending a code to ${email}…`;
      sendOtp(email).then(function (ok) {
        if (ok) {
          if (raOtpText) raOtpText.textContent = `A code was sent to ${email}. Enter it below.`;
          raSendOtpBtn.textContent = "OTP Sent";
          notify(`OTP sent to ${email}. Please check all folders including spam.`, "success");
        } else {
          raSendOtpBtn.disabled = false; raSendOtpBtn.textContent = "Send OTP";
        }
      });
    });
  }

  if (raOtpInput) raOtpInput.addEventListener("input", function () { raOtpInput.value = raOtpInput.value.replace(/\D/g,""); validateOtp(); });

  if (raOtpForm) {
    raOtpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const val = raOtpInput ? raOtpInput.value.trim() : "";
      if (!val || !/^\d{4,8}$/.test(val)) { notify("Please enter a valid OTP.", "warn"); return; }
      const cached = (() => { try { return JSON.parse(localStorage.getItem("accountData") || "{}"); } catch(e) { return {}; } })();
      if (raOtpSubmitBtn) raOtpSubmitBtn.disabled = true;
      if (window.RJGDb && typeof window.RJGDb.verifyEmailOtp === "function") {
        window.RJGDb.verifyEmailOtp(cached.email || "", val, "email")
          .then(function () {
            notify("OTP verified.", "success");
            closeModal(raOtpOverlay);
            openEditModal();
          })
          .catch(function (err) {
            const otpMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "OTP verification failed. Please try again.")) || "OTP verification failed. Please try again.";
            notify(otpMsg, "error");
            if (raOtpSubmitBtn) raOtpSubmitBtn.disabled = false;
          });
      } else {
        closeModal(raOtpOverlay);
        openEditModal();
      }
    });
  }

  if (raEditEmailInput) raEditEmailInput.addEventListener("input", validateEditForm);
  if (raEditPasswordInput) raEditPasswordInput.addEventListener("input", validateEditForm);
  if (raEditConfirmPasswordInput) raEditConfirmPasswordInput.addEventListener("input", validateEditForm);

  if (raEditForm) {
    raEditForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!window.RJGDb) { notify("Database not ready.", "error"); return; }
      if (raEditSubmitBtn) raEditSubmitBtn.disabled = true;
      try {
        if (currentEditSection === "email") {
          const newEmail = raEditEmailInput ? raEditEmailInput.value.trim() : "";
          if (!newEmail.includes("@")) { notify("Enter a valid email.", "warn"); return; }
          await window.RJGDb.updateCurrentUserEmail(newEmail);
          notify("A confirmation link has been sent to " + newEmail + ". Please check your inbox to confirm the email change.", "success");
        } else if (currentEditSection === "password") {
          const pw = raEditPasswordInput ? raEditPasswordInput.value.trim() : "";
          const cpw = raEditConfirmPasswordInput ? raEditConfirmPasswordInput.value.trim() : "";
          if (pw.length < 8 || pw !== cpw) { notify("Passwords must match and be at least 8 characters.", "warn"); return; }
          await window.RJGDb.updateCurrentUserPassword(pw);
          notify("Password updated.", "success");
        }
        closeModal(raEditOverlay);
      } catch (err) {
        const updMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Unable to update your account. Please try again.")) || "Unable to update your account. Please try again.";
        notify(updMsg, "error");
      } finally {
        if (raEditSubmitBtn) raEditSubmitBtn.disabled = false;
      }
    });
  }

  document.querySelectorAll("[data-modal-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const type = btn.getAttribute("data-modal-close");
      if (type === "otp") closeModal(raOtpOverlay);
      else if (type === "edit") closeModal(raEditOverlay);
    });
  });

  if (raOtpOverlay) raOtpOverlay.addEventListener("click", function (e) { if (e.target === raOtpOverlay) closeModal(raOtpOverlay); });
  if (raEditOverlay) raEditOverlay.addEventListener("click", function (e) { if (e.target === raEditOverlay) closeModal(raEditOverlay); });

  document.querySelectorAll(".profile-edit-btn[data-edit]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const section = btn.getAttribute("data-edit");
      if (section === "email" || section === "password") openOtpPrompt(section);
    });
  });

  console.log("Setting up recruiter delete button event listener...");
  if (raDeleteBtn) {
    console.log("Adding click listener to recruiter delete button");
    raDeleteBtn.addEventListener("click", async function () {
      console.log("Recruiter delete button clicked!");
      openDeleteModal();
    });
  } else {
    console.log("Recruiter delete button not found!");
  }

  function openDeleteModal() {
    console.log("Recruiter openDeleteModal called");
    if (raDeleteOverlay) {
      console.log("Recruiter delete overlay found, opening modal");
      raDeleteOverlay.setAttribute("aria-hidden", "false");
      raDeleteOverlay.classList.remove("ra-modal-hidden");
      raDeleteOverlay.style.display = "flex"; // Add this line
      if (raDeletePasswordInput) {
        raDeletePasswordInput.value = "";
        raDeletePasswordInput.focus();
      }
    } else {
      console.log("Recruiter delete overlay not found!");
    }
  }

  function closeDeleteModal() {
    if (raDeleteOverlay) {
      raDeleteOverlay.setAttribute("aria-hidden", "true");
      raDeleteOverlay.classList.add("ra-modal-hidden");
      raDeleteOverlay.style.display = "none"; // Add this line
    }
  }

  if (raDeleteForm) {
    raDeleteForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!window.RJGDb) { notify("Database not ready.", "error"); return; }
      
      const password = raDeletePasswordInput ? raDeletePasswordInput.value.trim() : "";
      if (!password) { notify("Please enter your password.", "warn"); return; }
      
      if (raDeleteSubmitBtn) raDeleteSubmitBtn.disabled = true;
      
      try {
        // First, validate the password by attempting to sign in
        const supa = window.RJGDb.getClient();
        if (!supa) throw new Error("Database client not initialized.");
        
        // Get current user from Supabase auth
        const { data: { user }, error: userError } = await supa.auth.getUser();
        if (userError || !user || !user.email) {
          throw new Error("Unable to get current user information.");
        }
        
        const email = String(user.email || "").trim();
        
        // Verify password by attempting to sign in
        const { error: verifyErr } = await supa.auth.signInWithPassword({
          email,
          password: password
        });
        
        if (verifyErr) {
          // Password is wrong
          notify("Wrong password", "error");
          // Clear password field and focus for retry
          if (raDeletePasswordInput) {
            raDeletePasswordInput.value = "";
            raDeletePasswordInput.focus();
          }
          return;
        }
        
        // Password is correct, now show final confirmation
        // Show final confirmation modal
        window.showAppConfirmModal({
          title: "Final Confirmation",
          message: "⚠️ FINAL WARNING: This will permanently delete your account and all associated data. This action CANNOT be undone. Are you absolutely sure?",
          confirmText: "Yes, Delete My Account",
          cancelText: "Cancel",
          type: "danger",
          onConfirm: async () => {
            // User confirmed, proceed with deletion
            try {
              await window.RJGDb.deleteCurrentAccountWithPassword(password);
              notify("Account deleted successfully. Redirecting...", "success");
              setTimeout(() => {
                window.location.href = "../auth/log-sign.html";
              }, 2000);
            } catch (err) {
              const delMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Failed to delete account. Please try again.")) || "Failed to delete account. Please try again.";
              notify(delMsg, "error");
            }
          }
        });
        
      } catch (err) {
        const rawMsg = String(err && err.message ? err.message : "").toLowerCase();
        
        // Provide specific feedback for wrong password
        if (rawMsg.includes("password") || rawMsg.includes("invalid") || rawMsg.includes("credentials")) {
          notify("Wrong password", "error");
          // Clear password field and focus for retry
          if (raDeletePasswordInput) {
            raDeletePasswordInput.value = "";
            raDeletePasswordInput.focus();
          }
        } else {
          const valMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Failed to validate password. Please try again.")) || "Failed to validate password. Please try again.";
          notify(valMsg, "error");
        }
      } finally {
        if (raDeleteSubmitBtn) raDeleteSubmitBtn.disabled = false;
      }
    });
  }

// ... (rest of the code remains the same)
  // ── Init ──
  async function init() {
    renderFromCache();
    await enforceRecruiter();
    await loadAccountData();
  }

  init();
})();
