(function () {
  const backBtn = document.getElementById("accountBackBtn");
  const deleteBtn = document.getElementById("accountDeleteBtn");
  console.log("Delete button element found:", deleteBtn);
  const deleteOverlay = document.getElementById("accountDeleteOverlay");
  const deleteForm = document.getElementById("accountDeleteForm");
  const deletePasswordInput = document.getElementById("accountDeletePasswordInput");
  const deleteSubmitBtn = document.getElementById("accountDeleteSubmitBtn");
  const emailValueEl = document.getElementById("accountEmailValue");
  const passwordValueEl = document.getElementById("accountPasswordValue");
  
  const otpOverlay = document.getElementById("accountOtpOverlay");
  const editOverlay = document.getElementById("accountEditOverlay");
  const otpForm = document.getElementById("accountOtpForm");
  const otpInput = document.getElementById("accountOtpInput");
  const otpSubmitBtn = document.getElementById("accountOtpSubmitBtn");
  const sendOtpBtn = document.getElementById("accountSendOtpBtn");
  const accountOtpText = document.getElementById("accountOtpText");
  const editTitle = document.getElementById("accountEditTitle");
  const editText = document.getElementById("accountEditText");
  const editForm = document.getElementById("accountEditForm");
  const editEmailRow = document.getElementById("accountEditEmailRow");
  const editPasswordRow = document.getElementById("accountEditPasswordRow");
  const editConfirmPasswordRow = document.getElementById("accountEditConfirmPasswordRow");
  const editEmailInput = document.getElementById("editEmailInput");
  const editPasswordInput = document.getElementById("editPasswordInput");
  const editConfirmPasswordInput = document.getElementById("editConfirmPasswordInput");
  const editSubmitBtn = document.getElementById("accountEditSubmitBtn");

  let currentEditSection = null;

  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || "info");
  }

  function getStoredAccountData() {
    try {
      const raw = localStorage.getItem("accountData");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveAccountData(data) {
    localStorage.setItem("accountData", JSON.stringify(data));
  }

  function formatDate(raw) {
    if (!raw) return "Not set";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function renderFromCache() {
    const accountData = getStoredAccountData();
    if (emailValueEl) {
      emailValueEl.textContent = accountData.email || "—";
      emailValueEl.setAttribute("title", accountData.email || "");
    }
    if (passwordValueEl) {
      const maskLength = Math.max(8, Number(accountData.passwordLength) || 8);
      passwordValueEl.textContent = "*".repeat(maskLength);
    }
  }

  async function loadAccountData() {
    if (!window.RJGDb) return;
    try {
      // Get current user from Supabase auth
      const supa = window.RJGDb.getClient();
      const { data: { user }, error: userError } = await supa.auth.getUser();
      
      // Load profile data
      let profile = null;
      try {
        if (typeof window.RJGDb.loadCurrentUserProfile === "function") {
          profile = await window.RJGDb.loadCurrentUserProfile();
        }
      } catch (e) {
        console.warn("Failed to load profile:", e);
      }
      
      const currentUser = user || null;
      const profileEmail = profile && profile.email;
      const userEmail = currentUser && currentUser.email;
      const email = profileEmail || userEmail || "";
      const createdAt = (currentUser && currentUser.created_at) || "";
      const lastSignIn = (currentUser && currentUser.last_sign_in_at) || "";
      
      // Always update the display with fresh data
      if (emailValueEl) { 
        emailValueEl.textContent = email || "—"; 
        emailValueEl.setAttribute("title", email || ""); 
      }
      
      // Update cache with fresh data
      const cached = { email };
      try { localStorage.setItem("accountData", JSON.stringify(cached)); } catch (e) {}
    } catch (e) {
      console.error("Failed to load account data:", e);
      renderFromCache();
    }
  }

  function renderAccountData() { renderFromCache(); }

  function goBack() {
    window.location.href = "../seeker/dashb.html";
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function resetOtpModal() {
    if (!otpInput) return;
    otpInput.value = "";
    otpSubmitBtn.disabled = true;
    otpSubmitBtn.style.opacity = "0.55";
    otpSubmitBtn.style.cursor = "not-allowed";
    // Reset send button state
    if (sendOtpBtn) {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Send OTP";
      sendOtpBtn.style.opacity = "1";
      sendOtpBtn.style.cursor = "pointer";
    }
  }

  function resetEditModal() {
    if (!editForm) return;
    editForm.reset();
    editSubmitBtn.disabled = true;
    editSubmitBtn.style.opacity = "0.55";
    editSubmitBtn.style.cursor = "not-allowed";
  }

  function validateOtpInput() {
    const value = otpInput.value.trim();
    const valid = value !== "" && /^\d{4,8}$/.test(value);
    otpSubmitBtn.disabled = !valid;
    otpSubmitBtn.style.opacity = valid ? "1" : "0.55";
    otpSubmitBtn.style.cursor = valid ? "pointer" : "not-allowed";
  }

  function validateEditForm() {
    if (!currentEditSection) return;
    if (currentEditSection === "email") {
      const validEmail = editEmailInput.value.trim().length > 5 && editEmailInput.value.includes("@");
      editSubmitBtn.disabled = !validEmail;
    } else if (currentEditSection === "password") {
      const password = editPasswordInput.value.trim();
      const confirm = editConfirmPasswordInput.value.trim();
      const validPassword = password.length >= 8 && password === confirm;
      editSubmitBtn.disabled = !validPassword;
    }
    editSubmitBtn.style.opacity = editSubmitBtn.disabled ? "0.55" : "1";
    editSubmitBtn.style.cursor = editSubmitBtn.disabled ? "not-allowed" : "pointer";
  }

  async function sendOtpViaSupabase(email) {
    try {
      if (window.RJGDb && typeof window.RJGDb.sendVerificationOtp === "function") {
        await window.RJGDb.sendVerificationOtp(email);
        // Use security feedback system for success message
        if (window.securityFeedback) {
          await window.securityFeedback.showFeedback('send_otp', 'success');
        } else {
          notify(`OTP sent successfully to ${email}. Please check your inbox.`, "success");
        }
        return true;
      }
      notify("Database not ready. Please refresh.", "error");
      return false;
    } catch (err) {
      console.error("OTP send error:", err);
      // Use security feedback system for error handling
      if (window.securityFeedback) {
        if (err && err.code === 'over_email_send_rate_limit') {
          await window.securityFeedback.showFeedback('send_otp', 'rate_limit');
        } else {
          await window.securityFeedback.showFeedback('send_otp', 'error');
        }
      } else {
        // Fallback to original error handling
        if (err && err.code === 'over_email_send_rate_limit') {
          notify("The rate limit for email sending is currently reached. Please wait for an hour and try again.", "info");
        } else {
          const sendMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Failed to send OTP. Please try again.")) || "Failed to send OTP. Please try again.";
          notify(sendMsg, "error");
        }
      }
      return false;
    }
  }

  function handleSendOtp() {
    const accountData = getStoredAccountData();
    const currentEmail = accountData.email || "your email";
    const sectionLabel = currentEditSection === "password" ? "password" : "email";

    // Disable button while sending
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending\u2026";
    sendOtpBtn.style.opacity = "0.65";
    sendOtpBtn.style.cursor = "not-allowed";

    accountOtpText.textContent = `Sending a verification code to ${currentEmail}\u2026`;

    sendOtpViaSupabase(currentEmail).then(function (sent) {
      if (sent) {
        accountOtpText.textContent = `A verification code has been sent to ${currentEmail}. Enter it below to continue editing your ${sectionLabel}.`;
        // Keep button disabled after success so they can't spam it
        sendOtpBtn.textContent = "OTP Sent";
      } else {
        accountOtpText.textContent = `Failed to send a verification code. Please try again.`;
        // Re-enable on failure so they can retry
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Send OTP";
        sendOtpBtn.style.opacity = "1";
        sendOtpBtn.style.cursor = "pointer";
      }
    });
  }

  function openOtpVerificationPrompt(section) {
    currentEditSection = section;
    const sectionLabel = section === "password" ? "password" : "email";
    accountOtpText.textContent = `Click "Send OTP" to receive a verification code for editing your ${sectionLabel}.`;
    resetOtpModal();
    openModal(otpOverlay);
  }

  function openEditModal() {
    const accountData = getStoredAccountData();
    resetEditModal();
    if (currentEditSection === "email") {
      editTitle.textContent = "Update Email";
      editText.textContent = "Enter a new email address and save your changes.";
      editEmailRow.classList.remove("account-modal-hidden");
      editPasswordRow.classList.add("account-modal-hidden");
      editConfirmPasswordRow.classList.add("account-modal-hidden");
      editEmailInput.value = accountData.email || "";
      editEmailInput.focus();
    } else if (currentEditSection === "password") {
      editTitle.textContent = "Update Password";
      editText.textContent = "Enter a new password and confirm it to save your changes.";
      editEmailRow.classList.add("account-modal-hidden");
      editPasswordRow.classList.remove("account-modal-hidden");
      editConfirmPasswordRow.classList.remove("account-modal-hidden");
      editPasswordInput.value = "";
      editConfirmPasswordInput.value = "";
      editPasswordInput.focus();
    }
    validateEditForm();
    openModal(editOverlay);
  }

  function handleOtpFormSubmit(event) {
    event.preventDefault();
    const otpValue = otpInput.value.trim();
    if (!otpValue || !/^\d{4,8}$/.test(otpValue)) {
      notify("Please enter a valid OTP code.", "warn");
      return;
    }
    
    // Verify OTP server-side using database.js
    const accountData = getStoredAccountData();
    const email = accountData.email || "";
    
    if (!email) {
      notify("Email not found. Please sign in again.", "warn");
      return;
    }

    // Disable button during submission
    otpSubmitBtn.disabled = true;
    otpSubmitBtn.style.opacity = "0.55";
    
    if (window.RJGDb && typeof window.RJGDb.verifyEmailOtp === "function") {
      window.RJGDb.verifyEmailOtp(email, otpValue, "email")
        .then(async () => {
          // OTP verified successfully on server
          if (window.securityFeedback) {
            await window.securityFeedback.showFeedback('verify_otp', 'success');
          } else {
            notify("OTP verified successfully.", "success");
          }
          closeModal(otpOverlay);
          openEditModal();
        })
        .catch(async (error) => {
          // Use security feedback system for error handling
          if (window.securityFeedback) {
            if (error && error.message && error.message.includes('expired')) {
              await window.securityFeedback.showFeedback('verify_otp', 'expired');
            } else if (error && error.message && error.message.includes('invalid')) {
              await window.securityFeedback.showFeedback('verify_otp', 'invalid');
            } else {
              await window.securityFeedback.showFeedback('verify_otp', 'error');
            }
          } else {
            const otpErrMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(error, "OTP verification failed. Please try again.")) || "OTP verification failed. Please try again.";
            notify(otpErrMsg, "error");
          }
          otpSubmitBtn.disabled = false;
          otpSubmitBtn.style.opacity = "1";
          validateOtpInput();
        });
    } else {
      // Fallback if RJGDb isn't ready - format-only validation
      console.warn("[Account] RJGDb not ready, using format-only OTP validation");
      closeModal(otpOverlay);
      openEditModal();
      otpSubmitBtn.disabled = false;
      otpSubmitBtn.style.opacity = "1";
    }
  }

  async function handleEditFormSubmit(event) {
    event.preventDefault();
    if (!window.RJGDb) { notify("Database not ready.", "error"); return; }
    if (editSubmitBtn) editSubmitBtn.disabled = true;
    try {
      if (currentEditSection === "email") {
        const newEmail = editEmailInput ? editEmailInput.value.trim() : "";
        if (!newEmail || !newEmail.includes("@")) { notify("Please enter a valid email address.", "warn"); return; }
        await window.RJGDb.updateCurrentUserEmail(newEmail);
        notify("A confirmation link has been sent to " + newEmail + ". Please check your inbox to confirm the email change.", "success");
      } else if (currentEditSection === "password") {
        const pw = editPasswordInput ? editPasswordInput.value.trim() : "";
        const cpw = editConfirmPasswordInput ? editConfirmPasswordInput.value.trim() : "";
        if (pw.length < 8 || pw !== cpw) { notify("Passwords must match and be at least 8 characters.", "warn"); return; }
        await window.RJGDb.updateCurrentUserPassword(pw);
        notify("Password updated.", "success");
      }
      closeModal(editOverlay);
    } catch (err) {
      const updMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Unable to update your account. Please try again.")) || "Unable to update your account. Please try again.";
      notify(updMsg, "error");
    } finally {
      if (editSubmitBtn) editSubmitBtn.disabled = false;
    }
  }

  function handleModalClose(event) {
    const target = event.target.closest("[data-modal-close]");
    if (!target) return;
    const type = target.getAttribute("data-modal-close");
    if (type === "otp") {
      closeModal(otpOverlay);
    } else if (type === "edit") {
      closeModal(editOverlay);
    } else if (type === "delete") {
      closeDeleteModal();
    }
  }

  function handleOverlayClick(event) {
    if (event.target === otpOverlay) closeModal(otpOverlay);
    if (event.target === editOverlay) closeModal(editOverlay);
    if (event.target === deleteOverlay) closeDeleteModal();
  }

  if (backBtn) {
    backBtn.addEventListener("click", goBack);
  }

  renderFromCache();

  document.querySelectorAll(".profile-edit-btn[data-edit]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const section = btn.getAttribute("data-edit");
      if (section === "email" || section === "password") {
        openOtpVerificationPrompt(section);
        return;
      }
      console.log("Edit account field:", section);
      notify("Edit " + section + " coming soon.");
    });
  });

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", handleSendOtp);
  }

  if (otpInput) {
    otpInput.addEventListener("input", function () {
      otpInput.value = otpInput.value.replace(/\D/g, "");
      validateOtpInput();
    });
  }

  if (otpForm) {
    otpForm.addEventListener("submit", handleOtpFormSubmit);
  }

  if (editEmailInput) {
    editEmailInput.addEventListener("input", validateEditForm);
  }

  if (editPasswordInput) {
    editPasswordInput.addEventListener("input", validateEditForm);
  }

  if (editConfirmPasswordInput) {
    editConfirmPasswordInput.addEventListener("input", validateEditForm);
  }

  if (editForm) {
    editForm.addEventListener("submit", handleEditFormSubmit);
  }

  if (otpOverlay) {
    otpOverlay.addEventListener("click", handleOverlayClick);
    otpOverlay.addEventListener("click", handleModalClose);
  }

  if (editOverlay) {
    editOverlay.addEventListener("click", handleOverlayClick);
    editOverlay.addEventListener("click", handleModalClose);
  }

  if (deleteOverlay) {
    deleteOverlay.addEventListener("click", handleOverlayClick);
    deleteOverlay.addEventListener("click", handleModalClose);
  }

  console.log("Setting up delete button event listener...");
  if (deleteBtn) {
    console.log("Adding click listener to delete button");
    deleteBtn.addEventListener("click", async function () {
      console.log("Delete button clicked!");
      openDeleteModal();
    });
  } else {
    console.log("Delete button not found!");
  }

  function openDeleteModal() {
    console.log("openDeleteModal called");
    if (deleteOverlay) {
      console.log("Delete overlay found, opening modal");
      deleteOverlay.setAttribute("aria-hidden", "false");
      deleteOverlay.classList.remove("account-modal-hidden");
      deleteOverlay.style.display = "flex"; // Add this line
      if (deletePasswordInput) {
        deletePasswordInput.value = "";
        deletePasswordInput.focus();
      }
    } else {
      console.log("Delete overlay not found!");
    }
  }

  function closeDeleteModal() {
    if (deleteOverlay) {
      deleteOverlay.setAttribute("aria-hidden", "true");
      deleteOverlay.classList.add("account-modal-hidden");
      deleteOverlay.style.display = "none"; // Add this line
    }
  }

  if (deleteForm) {
    deleteForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!window.RJGDb) { notify("Database not ready.", "error"); return; }
      
      const password = deletePasswordInput ? deletePasswordInput.value.trim() : "";
      if (!password) { notify("Please enter your password.", "warn"); return; }
      
      if (deleteSubmitBtn) deleteSubmitBtn.disabled = true;
      
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
          if (deletePasswordInput) {
            deletePasswordInput.value = "";
            deletePasswordInput.focus();
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
          if (deletePasswordInput) {
            deletePasswordInput.value = "";
            deletePasswordInput.focus();
          }
        } else {
          const valMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Failed to validate password. Please try again.")) || "Failed to validate password. Please try again.";
          notify(valMsg, "error");
        }
      } finally {
        if (deleteSubmitBtn) deleteSubmitBtn.disabled = false;
      }
    });
  }

  async function init() {
    renderFromCache();
    await loadAccountData();
  }

  init();
})();