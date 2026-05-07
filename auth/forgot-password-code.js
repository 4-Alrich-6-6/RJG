(function () {
  const returnBtn = document.getElementById("forgotCodeReturnBtn");
  const enterBtn = document.getElementById("forgotCodeEnterBtn");
  const codeInput = document.getElementById("forgotCodeInput");
  const emailText = document.getElementById("forgotEmailText");
  const resendBtn = document.getElementById("forgotResendBtn");

  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || "info");
  }

  const resetEmail = sessionStorage.getItem("passwordResetEmail") || "";
  if (emailText) {
    emailText.textContent = resetEmail ? `Email: ${resetEmail}` : "";
  }

  /* ── Resend countdown ── */
  let countdownTimer = null;
  let countdownValue = 60;

  function startCountdown(seconds) {
    countdownValue = seconds;
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.textContent = `Resend Code (${countdownValue})`;
    }
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      countdownValue -= 1;
      if (resendBtn) resendBtn.textContent = `Resend Code (${countdownValue})`;
      if (countdownValue <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = "Resend Code";
        }
      }
    }, 1000);
  }

  if (resendBtn) {
    resendBtn.addEventListener("click", async function () {
      if (!resetEmail) {
        notify("No email address found. Please go back and try again.", "warn");
        return;
      }
      resendBtn.disabled = true;
      try {
        if (window.RJGDb && typeof window.RJGDb.sendPasswordResetOtp === "function") {
          await window.RJGDb.sendPasswordResetOtp(resetEmail);
        }
        notify("Verification code resent. Check your email.", "success");
        startCountdown(60);
      } catch (error) {
        const errorMessage = error && error.message ? error.message.toLowerCase() : "";
        if (errorMessage.includes("rate limit") || errorMessage.includes("over_email_send_rate_limit") || errorMessage.includes("too many requests")) {
          notify("The rate limit for email sending is currently reached. Please wait for a moment and try again.", "info");
        } else {
          const msg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(error, "Failed to resend code. Please try again.")) || "Failed to resend code. Please try again.";
          notify(msg, "error");
        }
        if (resendBtn) resendBtn.disabled = false;
      }
    });
  }

  // Start countdown immediately on page load
  startCountdown(60);

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
