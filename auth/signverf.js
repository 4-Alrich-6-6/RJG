// Sign Verification Page JavaScript

// Get elements
const submitBtn = document.querySelector('.submit-btn');
const otpInput = document.querySelector('.otp-input');
const resendLink = document.querySelector('.resend-link');
const returnBtn = document.querySelector('.return-btn');

// Disable submit button initially
submitBtn.disabled = true;
submitBtn.style.opacity = "0.5";
submitBtn.style.cursor = "not-allowed";

// Validate OTP input
function validateOTP() {
    const otp = otpInput.value.trim();
    const isValid = otp !== "";
    
    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? "1" : "0.5";
    submitBtn.style.cursor = isValid ? "pointer" : "not-allowed";
}

// Listen for input changes
otpInput.addEventListener('input', () => {
    // Format input to only numbers
    otpInput.value = otpInput.value.replace(/\D/g, '');
    validateOTP();
});

submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    const otp = otpInput.value.trim();
    if (otp === '') return;
    const pendingEmail = sessionStorage.getItem('pendingSignupEmail') || (function () {
      try {
        const acc = JSON.parse(localStorage.getItem('accountData') || '{}');
        return String(acc.email || '').trim();
      } catch (err) {
        return '';
      }
    })();
    if (!pendingEmail) {
      if (window.showAppToast) {
        window.showAppToast('Missing signup email. Please sign up again.', 'error');
      } else {
        console.error('Missing signup email. Please sign up again.');
      }
      window.location.href = '../auth/log-sign.html';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";
    Promise.resolve()
      .then(function () {
        if (window.RJGDb && typeof window.RJGDb.verifyEmailOtp === "function") {
          return window.RJGDb.verifyEmailOtp(pendingEmail, otp, 'signup');
        }
        return null;
      })
      .then(function () {
        if (window.RJGDb && typeof window.RJGDb.ensureProfileRow === "function") {
          return window.RJGDb.ensureProfileRow({});
        }
        return null;
      })
      .then(function () {
        const pendingAccountRaw = sessionStorage.getItem('pendingSignupAccountData');
        if (pendingAccountRaw) {
          localStorage.setItem('accountData', pendingAccountRaw);
        }
        sessionStorage.removeItem('pendingSignupEmail');
        sessionStorage.removeItem('pendingSignupAccountData');
        sessionStorage.setItem('signupSuccessToast', 'Sign-up successful! Please complete your profile setup.');
        sessionStorage.setItem('newSetupSession', '1');
        window.location.href = '../seeker/setup.html';
      })
      .catch(function (error) {
        console.error('[RJG verify signup OTP error]', error);
        
        // Provide user-friendly messages instead of database errors
        let userMessage = 'Invalid or expired verification code.';
        if (error && error.message) {
          const errorMsg = error.message.toLowerCase();
          if (errorMsg.includes('invalid') || errorMsg.includes('wrong') || errorMsg.includes('incorrect')) {
            userMessage = 'Invalid verification code. Please check and try again.';
          } else if (errorMsg.includes('expired') || errorMsg.includes('timeout')) {
            userMessage = 'Verification code has expired. Please request a new one.';
          } else if (errorMsg.includes('too many') || errorMsg.includes('rate limit') || errorMsg.includes('attempts')) {
            userMessage = 'The rate limit for email sending is currently reached. Please wait for an hour and try again.';
          } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
            userMessage = 'Verification session expired. Please sign up again.';
          }
        }
        
        if (window.showAppToast) {
            const toastType = (errorMsg.includes('too many') || errorMsg.includes('rate limit') || errorMsg.includes('attempts')) ? 'info' : 'error';
            window.showAppToast(userMessage, toastType);
        } else {
            console.error('User message:', userMessage);
            console.error('Technical error:', error);
        }
        validateOTP();
      });
});

let resendCooldown = false;
const COOLDOWN_SECONDS = 60;

// Start countdown immediately when page loads
function startInitialCooldown() {
    // Start cooldown immediately
    resendCooldown = true;
    resendLink.style.opacity = '0.5';
    resendLink.style.cursor = 'not-allowed';
    resendLink.style.pointerEvents = 'none';
    
    let secondsLeft = COOLDOWN_SECONDS;
    resendLink.textContent = `Resend in ${secondsLeft}s`;
    
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            resendLink.textContent = `Resend in ${secondsLeft}s`;
        } else {
            clearInterval(countdownInterval);
            resendCooldown = false;
            resendLink.textContent = "Didn't get a code? Click here to resend.";
            resendLink.style.opacity = '1';
            resendLink.style.cursor = 'pointer';
            resendLink.style.pointerEvents = 'auto';
        }
    }, 1000);
}

// Start countdown immediately when page loads
startInitialCooldown();

resendLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (resendCooldown) return;
    
    const pendingEmail = sessionStorage.getItem('pendingSignupEmail');
    if (!pendingEmail) {
      if (window.showAppToast) {
          window.showAppToast('Missing signup email. Please sign up again.', 'error');
      } else {
          console.error('Missing signup email. Please sign up again.');
      }
      return;
    }
    
    // Start cooldown
    resendCooldown = true;
    resendLink.style.opacity = '0.5';
    resendLink.style.cursor = 'not-allowed';
    resendLink.style.pointerEvents = 'none';
    
    let secondsLeft = COOLDOWN_SECONDS;
    resendLink.textContent = `Resend in ${secondsLeft}s`;
    
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            resendLink.textContent = `Resend in ${secondsLeft}s`;
        } else {
            clearInterval(countdownInterval);
            resendCooldown = false;
            resendLink.textContent = "Didn't get a code? Click here to resend.";
            resendLink.style.opacity = '1';
            resendLink.style.cursor = 'pointer';
            resendLink.style.pointerEvents = 'auto';
        }
    }, 1000);
    
    Promise.resolve()
      .then(function () {
        if (window.RJGDb && typeof window.RJGDb.sendEmailOtp === "function") {
          return window.RJGDb.sendEmailOtp(pendingEmail, 'signup');
        }
        return null;
      })
      .then(function () {
        console.log('[RJG resend signup OTP] OTP resent successfully to:', pendingEmail);
        if (window.showAppToast) {
            window.showAppToast('Verification code sent! Please check all folders including spam.', 'success');
        } else {
            console.log('OTP resent successfully to:', pendingEmail);
        }
      })
      .catch(function (error) {
        console.error('[RJG resend signup OTP error]', error);
        let userMessage = 'Unable to resend OTP. Please try again.';
        
        if (error && error.message) {
          const errorMsg = error.message.toLowerCase();
          
          // Provide user-friendly messages for common errors
          if (errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) {
            userMessage = 'The rate limit for email sending is currently reached. Please wait for an hour and try again.';
          } else if (errorMsg.includes('invalid email') || errorMsg.includes('email not found')) {
            userMessage = 'Email address not found. Please sign up again.';
          } else if (errorMsg.includes('expired') || errorMsg.includes('token')) {
            userMessage = 'Verification session expired. Please sign up again.';
          } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
            userMessage = 'Network error. Please check your connection and try again.';
          } else if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
            userMessage = 'A verification code was already sent. Please check your email.';
          }
        }
        
        if (window.showAppToast) {
            const toastType = (errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) ? 'info' : 'error';
            window.showAppToast(userMessage, toastType);
        } else {
            console.error('User message:', userMessage);
            console.error('Technical error:', error);
        }
      });
});

if (returnBtn) {
    returnBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('pendingSignupEmail');
        sessionStorage.removeItem('pendingSignupAccountData');
        window.location.href = '../auth/log-sign.html';
    });
}
