(function () {
  const returnBtn = document.getElementById("forgotReturnBtn");
  const enterBtn = document.getElementById("forgotEnterBtn");
  const emailInput = document.getElementById("forgotEmailInput");

  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || "info");
  }
  let hasSubmitted = false;

  function validateEmailInput() {
    if (!enterBtn || !emailInput) return false;
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    emailInput.classList.toggle("input-error", hasSubmitted && !isValid);
    enterBtn.disabled = !isValid;
    return isValid;
  }

  if (emailInput) {
    const seedEmail = sessionStorage.getItem("passwordResetEmail");
    if (seedEmail) emailInput.value = seedEmail;
    emailInput.addEventListener("input", validateEmailInput);
  }

  if (returnBtn) {
    returnBtn.addEventListener("click", function () {
      window.location.href = "../auth/log-sign.html";
    });
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", async function () {
      hasSubmitted = true;
      if (!validateEmailInput()) return;
      const email = emailInput.value.trim();
      emailInput.setAttribute("title", "");
      enterBtn.disabled = true;
      
      try {
        // Send the reset code directly - if email doesn't exist, the sendPasswordResetOtp function will handle it
        console.log('DEBUG: Sending password reset OTP to:', email);
        if (window.RJGDb && typeof window.RJGDb.sendPasswordResetOtp === "function") {
          await window.RJGDb.sendPasswordResetOtp(email);
        }
        sessionStorage.setItem("passwordResetEmail", email);
        notify("Verification code sent.", "success");
        window.location.href = "../auth/forgot-password-code.html";
      } catch (error) {
        // Check if the error indicates that the email doesn't exist
        const errorMessage = error && error.message ? error.message.toLowerCase() : "";
        if (errorMessage.includes('rate limit') || errorMessage.includes('over_email_send_rate_limit') || errorMessage.includes('too many requests')) {
          notify("The rate limit for email sending is currently reached. Please wait for an hour and try again.", "info");
        } else if (errorMessage.includes('user not found') || errorMessage.includes('invalid email') || errorMessage.includes('email not registered') || errorMessage.includes('no user found') || errorMessage.includes('unable to identify user')) {
          notify("This email doesn't exist in our system", "warn");
          emailInput.classList.add("input-error");
          emailInput.focus();
        } else {
          const resetMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(error, "Failed to send reset code. Please try again.")) || "Failed to send reset code. Please try again.";
          notify(resetMsg, "error");
        }
        enterBtn.disabled = false;
        validateEmailInput();
      }
    });
  }

  validateEmailInput();
})();
