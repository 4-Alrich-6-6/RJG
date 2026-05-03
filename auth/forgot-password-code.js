(function () {
  const returnBtn = document.getElementById("forgotCodeReturnBtn");
  const enterBtn = document.getElementById("forgotCodeEnterBtn");
  const codeInput = document.getElementById("forgotCodeInput");
  const emailText = document.getElementById("forgotEmailText");

  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || "info");
  }

  const resetEmail = sessionStorage.getItem("passwordResetEmail") || "";
  if (emailText) {
    emailText.textContent = resetEmail ? `Email: ${resetEmail}` : "";
  }

  function validateCodeInput() {
    if (!enterBtn || !codeInput) return;
    const isValid = codeInput.value.trim().length > 0;
    enterBtn.disabled = !isValid;
  }

  if (codeInput) {
    codeInput.addEventListener("input", function () {
      codeInput.value = codeInput.value.replace(/\D/g, "");
      validateCodeInput();
    });
  }

  if (returnBtn) {
    returnBtn.addEventListener("click", function () {
      window.location.href = "../auth/forgot-password.html";
    });
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", async function () {
      if (enterBtn.disabled) return;
      const email = (sessionStorage.getItem("passwordResetEmail") || "").trim();
      const token = codeInput ? codeInput.value.trim() : "";
      if (!email || !token) {
        notify("Missing email or code.", "warn");
        return;
      }
      enterBtn.disabled = true;
      try {
        if (window.RJGDb && typeof window.RJGDb.verifyEmailOtp === "function") {
          await window.RJGDb.verifyEmailOtp(email, token, "recovery");
        }
        notify("Code verified.", "success");
        window.location.href = "../auth/reset-password.html";
      } catch (error) {
        const codeMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(error, "Invalid or expired code. Please try again.")) || "Invalid or expired code. Please try again.";
        notify(codeMsg, "warn");
        validateCodeInput();
      }
    });
  }

  validateCodeInput();
})();
