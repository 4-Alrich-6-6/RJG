(function () {
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const submitBtn = document.getElementById("resetSubmitBtn");
  let hasAttemptedSubmit = false;

  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || "info");
  }

  function getStoredAccountData() {
    try {
      const raw = localStorage.getItem("accountData");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveStoredAccountData(next) {
    localStorage.setItem("accountData", JSON.stringify(next));
  }

  function validateForm() {
    const nextPassword = newPasswordInput ? newPasswordInput.value : "";
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
    const account = getStoredAccountData();
    const previousPassword = String(account.password || "");

    const isLengthValid = nextPassword.length >= 6;
    const isDifferentFromOld = !previousPassword || nextPassword !== previousPassword;
    const isConfirmMatching = confirmPassword === nextPassword && confirmPassword !== "";

    if (newPasswordInput) {
      const nextErr = !isLengthValid || !isDifferentFromOld;
      newPasswordInput.classList.toggle(
        "input-error",
        nextErr && (nextPassword.length > 0 || hasAttemptedSubmit)
      );
      if (!isLengthValid && nextPassword.length > 0) {
        newPasswordInput.setAttribute("title", "Password must be at least 6 characters.");
      } else if (!isDifferentFromOld && nextPassword.length > 0) {
        newPasswordInput.setAttribute("title", "New password must be different from your previous password.");
      } else {
        newPasswordInput.setAttribute("title", "");
      }
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.classList.toggle(
        "input-error",
        !isConfirmMatching && (confirmPassword.length > 0 || hasAttemptedSubmit)
      );
      confirmPasswordInput.setAttribute(
        "title",
        !isConfirmMatching && confirmPassword.length > 0
          ? "Confirm password must match the new password."
          : ""
      );
    }

    const isValid = isLengthValid && isDifferentFromOld && isConfirmMatching;
    if (submitBtn) submitBtn.disabled = !isValid;
    return isValid;
  }

  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", function () {
      const passwordInput = btn.previousElementSibling;
      if (!passwordInput) return;
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      btn.style.opacity = isPassword ? "0.6" : "1";
    });
  });

  [newPasswordInput, confirmPasswordInput].forEach(input => {
    if (!input) return;
    input.addEventListener("input", validateForm);
  });

  if (submitBtn) {
    submitBtn.addEventListener("click", async function () {
      hasAttemptedSubmit = true;
      if (!validateForm()) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Updating...";
      
      try {
        // Show loading feedback
        notify("Updating your password...", "info");
        
        if (window.RJGDb && typeof window.RJGDb.updateCurrentUserPassword === "function") {
          await window.RJGDb.updateCurrentUserPassword(newPasswordInput.value);
        }
        
        const account = getStoredAccountData();
        const nowIso = new Date().toISOString();
        const next = {
          ...account,
          passwordLength: newPasswordInput.value.length,
          lastChangedAt: nowIso
        };
        saveStoredAccountData(next);
        sessionStorage.setItem("passwordChangedModal", "1");
        
        // Show success feedback
        notify("Password successfully updated! You can now log in with your new password.", "success");
        
        // Brief delay before redirect to allow user to see the success message
        setTimeout(() => {
          window.location.href = "../auth/log-sign.html";
        }, 1500);
        
      } catch (error) {
        // Enhanced error handling with specific messages
        const errorMessage = error && error.message ? error.message.toLowerCase() : "";
        
        if (errorMessage.includes("weak password") || errorMessage.includes("password too weak")) {
          notify("Password is too weak. Please choose a stronger password with at least 6 characters.", "warn");
        } else if (errorMessage.includes("same_password") || errorMessage.includes("same as old") || errorMessage.includes("identical to current")) {
          notify("New password should be different from the old password.", "warn");
        } else if (errorMessage.includes("session expired") || errorMessage.includes("not authenticated")) {
          notify("Session expired. Please log in again and try resetting your password.", "warn");
        } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
          notify("Network error. Please check your connection and try again.", "warn");
        } else {
          // Use user-friendly error handling for unknown errors
          if (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage) {
            const userMessage = window.RJGErrorHandler.getUserFriendlyMessage(error, "Failed to update password. Please try again.");
            notify(userMessage, "warn");
          } else {
            notify("Failed to update password. Please try again.", "warn");
          }
        }
        
        submitBtn.textContent = "LOG-IN";
        submitBtn.disabled = false;
        validateForm();
      }
    });
  }

  validateForm();
})();
