(function () {
  const STORAGE_KEY = "adminAccountData";

  const backBtn = document.getElementById("accountBackBtn");
  const emailValueEl = document.querySelector(".account-row:nth-child(1) .account-value");
  const passwordValueEl = document.querySelector(".account-row:nth-child(2) .account-value");
  const lastChangedEl = document.querySelector(".account-row:nth-child(3) .account-value");

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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveAccountData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function formatDate(raw) {
    if (!raw) return "Not set";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function renderAccountData() {
    const accountData = getStoredAccountData();
    if (emailValueEl) {
      emailValueEl.textContent = accountData.email || "No email set";
      emailValueEl.setAttribute("title", accountData.email || "No email set");
    }
    if (passwordValueEl) {
      const maskLength = Math.max(8, Number(accountData.passwordLength) || 8);
      passwordValueEl.textContent = "*".repeat(maskLength);
    }
    if (lastChangedEl) {
      lastChangedEl.textContent = formatDate(accountData.lastChangedAt);
    }
  }

  function goBack() {
    window.location.href = "../admin/admin-dashboard.html";
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
    if (sendOtpBtn) {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Send Email";
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
      console.log('DEBUG: Sending verification email to:', email);
      console.log('DEBUG: window.RJGDb available:', !!window.RJGDb);
      console.log('DEBUG: sendVerificationOtp function available:', !!(window.RJGDb && typeof window.RJGDb.sendVerificationOtp === "function"));
      
      if (window.RJGDb && typeof window.RJGDb.sendVerificationOtp === "function") {
        await window.RJGDb.sendVerificationOtp(email);
        console.log('DEBUG: Verification email sent successfully');
        return true;
      }
      console.log('DEBUG: Database not ready');
      notify("Database not ready. Please refresh.", "error");
      return false;
    } catch (err) {
      console.error("Verification email send error:", err);
      // Handle rate limit error with user-friendly message
      if (err && err.code === 'over_email_send_rate_limit') {
        notify("The rate limit for email sending is currently reached. Please wait for an hour and try again.", "info");
      } else {
        const sendMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Failed to send verification email. Please try again.")) || "Failed to send verification email. Please try again.";
        notify(sendMsg, "error");
      }
      return false;
    }
  }

  function handleSendOtp() {
    const accountData = getStoredAccountData();
    console.log('DEBUG: Account data:', accountData);
    const currentEmail = accountData.email || "your email";
    console.log('DEBUG: Current email being used:', currentEmail);
    const sectionLabel = currentEditSection === "password" ? "password" : "email";

    // Validate email before sending
    if (!currentEmail || currentEmail === "your email") {
      notify("Please wait for your email to load before sending verification.", "error");
      return;
    }

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending\u2026";
    sendOtpBtn.style.opacity = "0.65";
    sendOtpBtn.style.cursor = "not-allowed";

    sendOtpViaSupabase(currentEmail).then(function (sent) {
      if (sent) {
        sendOtpBtn.textContent = "Email Sent";
        notify("Verification email sent to " + currentEmail, "success");
      } else {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Send Email";
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
    const accountData = getStoredAccountData();
    const email = accountData.email || "";
    if (!email) {
      notify("Email not found. Please sign in again.", "warn");
      return;
    }
    otpSubmitBtn.disabled = true;
    otpSubmitBtn.style.opacity = "0.55";
    if (window.RJGDb && typeof window.RJGDb.verifyEmailOtp === "function") {
      window.RJGDb.verifyEmailOtp(email, otpValue, "email")
        .then(function () {
          notify("OTP verified successfully.", "success");
          closeModal(otpOverlay);
          openEditModal();
        })
        .catch(function (error) {
          const otpErrMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(error, "OTP verification failed. Please try again.")) || "OTP verification failed. Please try again.";
          notify(otpErrMsg, "error");
          otpSubmitBtn.disabled = false;
          otpSubmitBtn.style.opacity = "1";
          validateOtpInput();
        });
    } else {
      closeModal(otpOverlay);
      openEditModal();
    }
  }

  async function handleEditFormSubmit(event) {
    event.preventDefault();
    if (!window.RJGDb) { notify("Database not ready.", "error"); return; }
    if (editSubmitBtn) editSubmitBtn.disabled = true;
    try {
      if (currentEditSection === "email") {
        const newEmail = editEmailInput.value.trim();
        if (!newEmail || !newEmail.includes("@")) {
          notify("Please enter a valid email address.", "warn");
          return;
        }
        await window.RJGDb.updateCurrentUserEmail(newEmail);
        notify("A confirmation link has been sent to " + newEmail + ". Please check your inbox to confirm the email change.", "success");
      } else if (currentEditSection === "password") {
        const newPassword = editPasswordInput.value.trim();
        const confirmPassword = editConfirmPasswordInput.value.trim();
        if (newPassword.length < 8 || newPassword !== confirmPassword) {
          notify("Passwords must match and be at least 8 characters.", "warn");
          return;
        }
        await window.RJGDb.updateCurrentUserPassword(newPassword);
        const accountData = getStoredAccountData();
        accountData.passwordLength = newPassword.length;
        accountData.lastChangedAt = new Date().toISOString();
        if (!accountData.accountCreatedAt) accountData.accountCreatedAt = new Date().toISOString();
        saveAccountData(accountData);
        renderAccountData();
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
    }
  }

  function handleOverlayClick(event) {
    if (event.target === otpOverlay) closeModal(otpOverlay);
    if (event.target === editOverlay) closeModal(editOverlay);
  }

  if (backBtn) {
    backBtn.addEventListener("click", goBack);
  }

  renderAccountData();

  document.querySelectorAll(".profile-edit-btn[data-edit]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const section = btn.getAttribute("data-edit");
      if (section === "email" || section === "password") {
        openOtpVerificationPrompt(section);
      }
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

  // Initialize: Load current user email from database
  async function loadCurrentUserEmail() {
    try {
      console.log('DEBUG: Loading current user email...');
      console.log('DEBUG: window.RJGDb available:', !!window.RJGDb);
      
      let emailFound = false;
      
      // Method 1: Try currentUser function
      if (window.RJGDb && typeof window.RJGDb.currentUser === 'function') {
        console.log('DEBUG: Calling currentUser function...');
        const currentUser = await window.RJGDb.currentUser();
        console.log('DEBUG: Current user result:', currentUser);
        
        if (currentUser && currentUser.email) {
          console.log('DEBUG: Found email from currentUser:', currentUser.email);
          const accountData = getStoredAccountData();
          accountData.email = currentUser.email;
          saveAccountData(accountData);
          renderAccountData();
          console.log('DEBUG: Email saved and rendered');
          emailFound = true;
        }
      }
      
      // Method 2: Try auth directly
      if (!emailFound && window.RJGDb && typeof window.RJGDb.getClient === 'function') {
        console.log('DEBUG: Trying auth directly...');
        const client = window.RJGDb.getClient();
        if (client) {
          const { data: authData } = await client.auth.getUser();
          const user = authData && authData.user ? authData.user : null;
          console.log('DEBUG: Auth user result:', user);
          if (user && user.email) {
            console.log('DEBUG: Found email from auth:', user.email);
            const accountData = getStoredAccountData();
            accountData.email = user.email;
            saveAccountData(accountData);
            renderAccountData();
            console.log('DEBUG: Email from auth saved and rendered');
            emailFound = true;
          }
        }
      }
      
      // Method 3: Query app_user table directly
      if (!emailFound && window.RJGDb && typeof window.RJGDb.getClient === 'function') {
        console.log('DEBUG: Querying app_user table directly...');
        const client = window.RJGDb.getClient();
        if (client) {
          const { data: authData } = await client.auth.getUser();
          const user = authData && authData.user ? authData.user : null;
          if (user && user.id) {
            const { data: appUserData, error } = await client
              .from('app_user')
              .select('email')
              .eq('id', user.id)
              .maybeSingle();
            
            console.log('DEBUG: App user data:', appUserData);
            if (!error && appUserData && appUserData.email) {
              console.log('DEBUG: Found email from app_user table:', appUserData.email);
              const accountData = getStoredAccountData();
              accountData.email = appUserData.email;
              saveAccountData(accountData);
              renderAccountData();
              console.log('DEBUG: Email from app_user saved and rendered');
              emailFound = true;
            } else if (error) {
              console.error('DEBUG: Error querying app_user:', error);
            }
          }
        }
      }
      
      if (!emailFound) {
        console.log('DEBUG: No email found from any method');
      }
      
    } catch (error) {
      console.error('Failed to load current user email:', error);
    }
  }

  // Initialize the page
  renderAccountData();
  loadCurrentUserEmail();
})();