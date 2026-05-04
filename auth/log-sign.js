// Toggle between Login and Signup forms
const tabBtns = document.querySelectorAll(".tab-btn");
const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
const signupTab = document.querySelector('.tab-btn[data-tab="signup"]');

const loginForm = document.querySelector(".lForm");
const signupForm = document.querySelector(".sForm");
let loginValidationInitialized = false;
let signupValidationInitialized = false;
function notify(message, type = "success") {
    if (window.showAppToast) window.showAppToast(message, type);
}
function toDisplayName(raw) {
    const base = String(raw || "").trim();
    if (!base) return "User";
    return base
        .replace(/[_\-.]+/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function isRecruiterLikeRole(role) {
    const r = String(role || "").toLowerCase();
    return r === "recruiter" || r === "employer";
}

function readCachedRoleHints() {
    let cachedRole = "";
    let profileRole = "";
    try {
        cachedRole = String(
            sessionStorage.getItem("rjgUserRole") || localStorage.getItem("rjgUserRole") || ""
        ).toLowerCase();
    } catch (e) {}
    try {
        const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");
        profileRole = String(profileData && profileData.role ? profileData.role : "").toLowerCase();
    } catch (e) {}
    return { cachedRole, profileRole };
}

function switchTab(tab) {
    const isLogin = tab === "login";
    tabBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
    loginForm.style.display = isLogin ? "flex" : "none";
    signupForm.style.display = isLogin ? "none" : "flex";
    if (loginTab) loginTab.textContent = isLogin ? "LOGIN" : "Already have an Account?";
    if (signupTab) signupTab.textContent = isLogin ? "Create an Account" : "SIGNUP";
    if (isLogin) validateLoginForm();
    else validateSignupForm();
}

tabBtns.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// Toggle password visibility
const togglePasswordBtns = document.querySelectorAll(".toggle-password");
togglePasswordBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const passwordInput = btn.previousElementSibling;
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        btn.style.opacity = isPassword ? "0.6" : "1";
    });
});

// FORM VALIDATION
function validateLoginForm() {
    if (loginValidationInitialized) return;
    const loginEmail = loginForm.querySelector('input[type="email"]');
    const loginPassword = loginForm.querySelector('input[type="password"]');
    const loginSubmit = loginForm.querySelector('.submit');
    
    const checkLogin = () => {
        const isValid = loginEmail.value.trim() !== "" && loginPassword.value.trim() !== "";
        loginSubmit.disabled = !isValid;
        loginSubmit.style.opacity = isValid ? "1" : "0.5";
        loginSubmit.style.cursor = isValid ? "pointer" : "not-allowed";
        loginEmail.classList.remove("input-error");
        loginPassword.classList.remove("input-error");
    };
    
    loginEmail.addEventListener("input", checkLogin);
    loginPassword.addEventListener("input", checkLogin);
    loginSubmit.addEventListener("click", async (e) => {
    if (window.RJGLoading) window.RJGLoading.show("Signing in...");
        e.preventDefault();
        if (loginSubmit.disabled) return;
        const emailValue = loginEmail.value.trim();
        const passwordValue = loginPassword.value;
        loginSubmit.disabled = true;
        try {
            // CRITICAL: Clear any cached role/session data from localStorage first
            // This prevents the previous user's cached role from interfering
            try {
                localStorage.removeItem("rjgUserRole");
                localStorage.removeItem("accountData");
                localStorage.removeItem("adminAccountData");
                localStorage.removeItem("profileData");
                localStorage.removeItem("profileName");
                // Clear all Supabase auth keys from localStorage
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(function (key) { localStorage.removeItem(key); });
                sessionStorage.clear();
            } catch (e) {
                // Ignore storage errors
            }

            // CRITICAL: Reset client to clear any stale session before new login
            // This ensures a different account can log in cleanly in the same browser window
            if (window.RJGDb && typeof window.RJGDb.resetClient === "function") {
                await window.RJGDb.resetClient();
            }

            // Perform authentication against Supabase (database-backed)
            if (!window.RJGDb || typeof window.RJGDb.signInWithEmailPassword !== "function") {
                throw new Error("Database service not initialized.");
            }
            
            await window.RJGDb.signInWithEmailPassword(emailValue, passwordValue);
            
            // Retrieve authenticated user data from database (not just localStorage)
            let role = "seeker";
            if (typeof window.RJGDb.getCurrentUserRole === "function") {
                try {
                    role = (await window.RJGDb.getCurrentUserRole()) || "seeker";
                } catch (e) {
                    console.error("Could not fetch role from database:", e);
                    role = "seeker";
                }
            }
            
            console.log("DEBUG - Raw role from database:", role);
            const roleLower = String(role).toLowerCase();
            console.log("DEBUG - Processed roleLower:", roleLower);

            // Fetch the real display name from the database for the welcome toast
            let welcomeDisplayName = "";
            let dbProfile = null;
            if (typeof window.RJGDb.loadCurrentUserProfile === "function") {
                try {
                    dbProfile = await window.RJGDb.loadCurrentUserProfile();
                    welcomeDisplayName = (dbProfile && dbProfile.name) ? dbProfile.name.trim() : "";
                    // Cache profile data from DB so other pages can use it immediately
                    if (dbProfile && Object.keys(dbProfile).length > 0) {
                        localStorage.setItem("profileData", JSON.stringify(dbProfile));
                        if (dbProfile.name) localStorage.setItem("profileName", dbProfile.name);
                    }
                } catch (e) {
                    console.error("Could not fetch profile from database:", e);
                }
            }
            const emailNamePart = emailValue.includes("@") ? emailValue.split("@")[0] : emailValue;
            const welcomeName = toDisplayName(welcomeDisplayName || emailNamePart);
            const nowIso = new Date().toISOString();
            
            localStorage.setItem("accountData", JSON.stringify({
                email: emailValue,
                lastLoginAt: nowIso
            }));
            
            const hasCompletenessHelpers = window.RJGDb && typeof window.RJGDb.isProfileComplete === "function";
            const profileComplete = hasCompletenessHelpers
                ? window.RJGDb.isProfileComplete(dbProfile, roleLower)
                : !!(dbProfile && Object.keys(dbProfile).length > 0);

            sessionStorage.setItem("postLoginToast", `Welcome ${welcomeName}!!!`);
            sessionStorage.setItem("rjgUserRole", roleLower);
            localStorage.setItem("rjgUserRole", roleLower);

            // Check if there's a stored redirect from auth-guard
            const authGuardRedirect = sessionStorage.getItem("authGuardRedirect");
            sessionStorage.removeItem("authGuardRedirect");

            // Admins bypass profile setup and go directly to admin dashboard
            if (roleLower === "admin") {
                window.location.href = "../admin/admin-dashboard.html";
                return;
            }

            if (!profileComplete) {
                sessionStorage.setItem("forceProfileSetup", "1");
                window.location.href = "../seeker/setup.html";
                return;
            }

            // Redirect: prioritize auth-guard stored URL, then based on role
            if (authGuardRedirect) {
                window.location.href = authGuardRedirect;
            } else {
                window.location.href = (roleLower === "recruiter" || roleLower === "employer") ? "../recruiter/recruiter-dashb.html" : "../seeker/dashb.html";
            }
        } catch (error) {
            const errStr = String(error && error.message ? error.message : "").toLowerCase();
            let msg = "Login failed. Please check your email and password.";
            let focusField = null;
            if (errStr.includes("invalid login credentials") || errStr.includes("invalid_grant") || errStr.includes("wrong password") || errStr.includes("invalid password")) {
                msg = "Invalid email or password. Please try again.";
                loginEmail.classList.add("input-error");
                loginPassword.classList.add("input-error");
                focusField = loginEmail;
            } else if (errStr.includes("email not confirmed") || errStr.includes("email_not_confirmed")) {
                msg = "Your email is not yet verified. Please check your inbox for the verification link.";
                loginEmail.classList.add("input-error");
                focusField = loginEmail;
            } else if (errStr.includes("too many requests") || errStr.includes("rate_limit")) {
                msg = "Too many login attempts. Please wait a moment and try again.";
            } else if (errStr.includes("user not found") || errStr.includes("no user found")) {
                msg = "No account found with this email. Please sign up first.";
                loginEmail.classList.add("input-error");
                focusField = loginEmail;
            } else {
                // Use user-friendly error handling for unknown errors
                if (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage) {
                    msg = window.RJGErrorHandler.getUserFriendlyMessage(error, "Login failed. Please try again.");
                } else {
                    msg = "Login failed. Please try again.";
                }
            }
            notify(msg, "warn");
            if (focusField) focusField.focus();
            if (window.RJGLoading) window.RJGLoading.hide();
            loginSubmit.disabled = false;
            checkLogin();
        }
    });
    checkLogin();
    loginValidationInitialized = true;
}

function validateSignupForm() {
    if (signupValidationInitialized) return;
    const signupEmail = signupForm.querySelector('input[type="email"]');
    const signupPassword = signupForm.querySelectorAll('input[type="password"]');
    const signupSubmit = signupForm.querySelector('.submit');
    const passwordInput = signupPassword[0];
    const confirmPasswordInput = signupPassword[1];
    const termsCheckbox = signupForm.querySelector('#signupTermsCheckbox');
    
        const checkSignup = () => {
        const emailFilled = signupEmail.value.trim() !== "";
        const passwordValue = passwordInput.value;
        const confirmPasswordValue = confirmPasswordInput.value;
        const isPasswordLongEnough = passwordValue.length >= 6;
        const isConfirmMatching = confirmPasswordValue === passwordValue && confirmPasswordValue !== "";

        passwordInput.classList.toggle("input-error", !isPasswordLongEnough && passwordValue.length > 0);
        confirmPasswordInput.classList.toggle("input-error", !isConfirmMatching && confirmPasswordValue.length > 0);
        signupEmail.classList.remove("input-error");
        passwordInput.setAttribute(
            "title",
            !isPasswordLongEnough && passwordValue.length > 0
                ? "Password must be at least 6 characters."
                : ""
        );
        confirmPasswordInput.setAttribute(
            "title",
            !isConfirmMatching && confirmPasswordValue.length > 0
                ? "Confirm password must match the password."
                : ""
        );

        const termsAccepted = !!(termsCheckbox && termsCheckbox.checked);
        const isValid = emailFilled && isPasswordLongEnough && isConfirmMatching && termsAccepted;
        signupSubmit.disabled = !isValid;
        signupSubmit.style.opacity = isValid ? "1" : "0.5";
        signupSubmit.style.cursor = isValid ? "pointer" : "not-allowed";
    };
    
    signupEmail.addEventListener("input", checkSignup);
    signupPassword.forEach(input => input.addEventListener("input", checkSignup));
    if (termsCheckbox) termsCheckbox.addEventListener("change", checkSignup);
    signupSubmit.addEventListener("click", async (e) => {
    if (window.RJGLoading) window.RJGLoading.show("Creating account...");
        e.preventDefault();
        if (signupSubmit.disabled) return;
        signupSubmit.disabled = true;
        try {
            const nowIso = new Date().toISOString();
            const emailValue = signupEmail.value.trim();
            const passwordValue = passwordInput.value;
            // Pre-check: is this email already registered?
            if (window.RJGDb && typeof window.RJGDb.isEmailTaken === "function") {
                const taken = await window.RJGDb.isEmailTaken(emailValue);
                if (taken) {
                    signupEmail.classList.add("input-error");
                    signupEmail.focus();
                    notify("This email is already registered. Please enter a different email instead.", "warn");
                    if (window.RJGLoading) window.RJGLoading.hide();
                    return;
                }
            }
            if (window.RJGDb && typeof window.RJGDb.signUpWithEmailPassword === "function") {
                const roleSelect = document.getElementById("signupRoleSelect");
                const selectedRole = roleSelect ? roleSelect.value : "seeker";
                await window.RJGDb.signUpWithEmailPassword(emailValue, passwordValue, selectedRole);
                sessionStorage.setItem("pendingSignupRole", selectedRole);
            }
            const pendingSignupAccountData = {
                email: emailValue,
                passwordLength: passwordValue.length,
                accountCreatedAt: nowIso,
                lastChangedAt: nowIso
            };
            sessionStorage.setItem("pendingSignupEmail", emailValue);
            sessionStorage.setItem("pendingSignupAccountData", JSON.stringify(pendingSignupAccountData));
            notify("Verification code sent to your email.", "success");
            window.location.href = "../auth/signverf.html";
        } catch (error) {
            console.error("[RJG signup error]", error);
            let msg = error && error.message ? error.message : "Sign up failed.";
            let focusField = null;
            // Detect duplicate email/user already exists errors
            const errStr = String(msg).toLowerCase();
            if (errStr.includes("user already registered") || 
                errStr.includes("email address is already") ||
                errStr.includes("user_already_exists") ||
                errStr.includes("duplicate key") ||
                errStr.includes("already in use")) {
                msg = "An account with this email already exists. Please log in instead.";
                signupEmail.classList.add("input-error");
                focusField = signupEmail;
            } else if (errStr.includes("weak password") || errStr.includes("password too short") || errStr.includes("password_strength")) {
                msg = "Password is too weak. Use at least 6 characters with a mix of letters and numbers.";
                passwordInput.classList.add("input-error");
                focusField = passwordInput;
            } else if (errStr.includes("invalid email") || errStr.includes("email_address_invalid")) {
                msg = "Please enter a valid email address.";
                signupEmail.classList.add("input-error");
                focusField = signupEmail;
            } else if (errStr.includes("too many requests") || errStr.includes("rate_limit")) {
                msg = "Too many signup attempts. Please wait a moment and try again.";
            } else {
                // Use user-friendly error handling for unknown errors
                if (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage) {
                    msg = window.RJGErrorHandler.getUserFriendlyMessage(error, "Sign up failed. Please try again.");
                } else {
                    msg = "Sign up failed. Please try again.";
                }
            }
            notify(msg, "warn");
            if (focusField) focusField.focus();
        } finally {
            if (window.RJGLoading) window.RJGLoading.hide();
            checkSignup();
        }
    });
    checkSignup();
    signupValidationInitialized = true;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Clear any stale cached role/session data on page load to ensure clean login state
    // This prevents issues when a different user tries to login on the same browser
    try {
        localStorage.removeItem("rjgUserRole");
        localStorage.removeItem("accountData");
        localStorage.removeItem("profileData");
        localStorage.removeItem("profileName");
    } catch (e) {
        // Ignore storage errors
    }

    const passwordChangedModal = sessionStorage.getItem("passwordChangedModal");
    if (passwordChangedModal === "1") {
        sessionStorage.removeItem("passwordChangedModal");
        if (typeof window.showAppConfirmModal === "function") {
            window.showAppConfirmModal({
                title: "Password changed",
                message: "Your password was changed successfully. You can now log in.",
                confirmLabel: "OK",
                cancelLabel: "Close",
                hideCancel: true,
                danger: false
            });
        } else {
            notify("Password changed successfully.", "success");
        }
    }

    validateLoginForm();
    validateSignupForm();
    const forgetPasswordLink = document.getElementById("forgetPasswordLink");
    if (forgetPasswordLink) {
        forgetPasswordLink.addEventListener("click", () => {
            const loginEmail = loginForm.querySelector('input[type="email"]');
            const emailValue = loginEmail ? loginEmail.value.trim() : "";
            if (emailValue) sessionStorage.setItem("passwordResetEmail", emailValue);
        });
    }
});