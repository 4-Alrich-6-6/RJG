const supabaseUrl = "https://jokoectulwjmawscvscf.supabase.co";
const supabaseAnonKey = "sb_publishable_ps3FXfmZThtbKJ8R_OYwCw_VZ2ctyLr";

(function () {
  function hasSupabaseRuntime() {
    return !!(window.supabase && typeof window.supabase.createClient === "function");
  }

  let client = null;
  
  async function resetClient() {
    // Sign out from current session if client exists (await to ensure clean state)
    if (client && client.auth) {
      try {
        await client.auth.signOut();
      } catch (e) {
        // Ignore signOut errors (e.g., if already signed out)
      }
    }
    // Force clear the client reference
    client = null;
    // Clear ALL Supabase session data from localStorage and sessionStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(function (key) { localStorage.removeItem(key); });
    } catch (e) {}
    try {
      sessionStorage.removeItem("sb-session");
      sessionStorage.removeItem("supabase.auth.token");
    } catch (e) {}
  }

  function getClient() {
    if (client) return client;
    if (!hasSupabaseRuntime()) return null;
    client = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    return client;
  }

  function toSafeError(error, fallback) {
    if (!error) return fallback || "Unexpected error.";
    return String(error.message || error.error_description || fallback || "Unexpected error.");
  }

  function normalizeError(error, fallback) {
    const message = toSafeError(error, fallback);
    const code = error && (error.code || error.error_code) ? String(error.code || error.error_code) : "";
    const status =
      error && (error.status || error.statusCode)
        ? String(error.status || error.statusCode)
        : "";
    const details = error && error.details ? String(error.details) : "";
    const hint = error && error.hint ? String(error.hint) : "";
    return { message, code, status, details, hint };
  }

  function formatDebugError(error, fallback) {
    const n = normalizeError(error, fallback);
    const parts = [n.message];
    if (n.code) parts.push(`code=${n.code}`);
    if (n.status) parts.push(`status=${n.status}`);
    if (n.details) parts.push(`details=${n.details}`);
    if (n.hint) parts.push(`hint=${n.hint}`);
    return parts.join(" | ");
  }

  const POSTER_NAME_CACHE_KEY = "rjgPosterNameCache";
  let dropdownOptionCache = null;
  function normalizeDropdownToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, "_");
  }
  async function ensureDropdownOptionCache(supa) {
    if (dropdownOptionCache) return dropdownOptionCache;
    const { data, error } = await supa
      .from("dropdown_option")
      .select("category,code,label,is_active,is_other")
      .eq("is_active", true);
    if (error) {
      console.warn("Dropdown option cache unavailable, using raw codes:", error.message);
      dropdownOptionCache = {};
      return dropdownOptionCache;
    }
    const rows = Array.isArray(data) ? data : [];
    const cache = {};
    rows.forEach((row) => {
      const category = String(row.category || "").trim();
      const code = String(row.code || "").trim();
      if (!category || !code) return;
      if (!cache[category]) {
        cache[category] = {
          byCode: new Map(),
          byToken: new Map()
        };
      }
      const label = String(row.label || code).trim();
      cache[category].byCode.set(code, {
        code,
        label: label || code,
        isOther: !!row.is_other
      });
      cache[category].byToken.set(normalizeDropdownToken(code), code);
      cache[category].byToken.set(normalizeDropdownToken(label), code);
    });
    dropdownOptionCache = cache;
    return dropdownOptionCache;
  }
  function resolveDropdownCode(category, rawValue, fallbackCode) {
    const categoryMap = dropdownOptionCache && dropdownOptionCache[category];
    const fallback = fallbackCode ? String(fallbackCode) : null;
    if (!categoryMap) return fallback;
    const token = normalizeDropdownToken(rawValue);
    if (!token) return fallback;
    const direct = categoryMap.byToken.get(token);
    if (direct) return direct;
    return fallback;
  }
  function resolveDropdownLabel(category, rawCodeOrLabel, fallbackLabel) {
    const categoryMap = dropdownOptionCache && dropdownOptionCache[category];
    const raw = String(rawCodeOrLabel || "").trim();
    if (!categoryMap) return raw || fallbackLabel || "";
    if (!raw) return fallbackLabel || "";
    const byCode = categoryMap.byCode.get(raw);
    if (byCode) return byCode.label || raw;
    const code = categoryMap.byToken.get(normalizeDropdownToken(raw));
    if (!code) return raw || fallbackLabel || "";
    const item = categoryMap.byCode.get(code);
    return item ? item.label : raw;
  }
  function getDropdownOptions(category) {
    const categoryMap = dropdownOptionCache && dropdownOptionCache[category];
    if (!categoryMap) return [];
    const options = [];
    categoryMap.byCode.forEach((item) => {
      options.push({ code: item.code, label: item.label, isOther: item.isOther });
    });
    return options;
  }
  function isOtherCode(category, code) {
    const categoryMap = dropdownOptionCache && dropdownOptionCache[category];
    if (!categoryMap) return normalizeDropdownToken(code) === "other";
    const item = categoryMap.byCode.get(String(code || ""));
    return !!(item && item.isOther);
  }
  function readPosterNameCache() {
    try {
      const raw = localStorage.getItem(POSTER_NAME_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }
  function writePosterNameCache(cache) {
    try {
      localStorage.setItem(POSTER_NAME_CACHE_KEY, JSON.stringify(cache || {}));
    } catch (e) {
      /* ignore localStorage write errors */
    }
  }
  function getCachedPosterNameById(userId) {
    const id = String(userId || "").trim();
    if (!id) return "";
    const cache = readPosterNameCache();
    return String(cache[id] || "").trim();
  }
  function upsertPosterNameCache(userId, displayName) {
    const id = String(userId || "").trim();
    const name = String(displayName || "").trim();
    if (!id || !name) return;
    const cache = readPosterNameCache();
    cache[id] = name;
    writePosterNameCache(cache);
  }

  async function isEmailTaken(email) {
    const supa = getClient();
    if (!supa) return false;
    const { data, error } = await supa
      .from("app_user")
      .select("id")
      .eq("email", String(email || "").trim())
      .in("account_status", ["active", "suspended"]) // Exclude archived/deleted accounts
      .maybeSingle();
    if (error) {
      console.warn("isEmailTaken check failed:", error.message);
      return false;
    }
    return !!data;
  }

  // Check if email exists for forgot password (includes all non-archived accounts)
  async function checkEmailExistsForPasswordReset(email) {
    console.log('DEBUG: checkEmailExistsForPasswordReset called with email:', email);
    const supa = getClient();
    if (!supa) {
      console.log('DEBUG: No Supabase client available');
      return false;
    }
    const trimmedEmail = String(email || "").trim();
    console.log('DEBUG: Querying app_user table for email:', trimmedEmail);
    
    // First, let's check if the email exists at all (including archived accounts)
    const { data: allData, error: allError } = await supa
      .from("app_user")
      .select("id, account_status, email")
      .eq("email", trimmedEmail)
      .maybeSingle();
    console.log('DEBUG: All accounts query result - data:', allData, 'error:', allError);
    
    if (allError) {
      console.warn("All accounts query failed:", allError.message);
      return false;
    }
    
    if (!allData) {
      console.log('DEBUG: Email not found in any account status');
      
      // Check database connection and table existence
      console.log('DEBUG: Checking database connection...');
      console.log('DEBUG: Supabase URL:', supa.supabaseUrl);
      
      // Test basic connection
      const { data: testData, error: testError } = await supa
        .from("app_user")
        .select("count")
        .limit(1);
      console.log('DEBUG: Basic connection test - data:', testData, 'error:', testError);
      
      // Check if table exists and get sample records
      const { data: sampleUsers, error: sampleError } = await supa
        .from("app_user")
        .select("id, email, account_status")
        .limit(5);
      console.log('DEBUG: Sample users from database:', sampleUsers, 'error:', sampleError);
      
      // If no users found, try to get total count
      if (!sampleError && (!sampleUsers || sampleUsers.length === 0)) {
        const { data: countData, error: countError } = await supa
          .from("app_user")
          .select("id", { count: 'exact', head: true });
        console.log('DEBUG: Total user count:', countData, 'error:', countError);
        
        // Check if RLS is blocking access by trying with service role key
        console.log('DEBUG: Testing if RLS is blocking access...');
        
        // Try to get the current user
        const { data: { user }, error: userError } = await supa.auth.getUser();
        console.log('DEBUG: Current authenticated user:', user, 'error:', userError);
        
        // Try a different approach - check if we can bypass RLS by using a different query
        const { data: rlsTestData, error: rlsTestError } = await supa
          .from("app_user")
          .select("id, email, account_status")
          .limit(1);
        console.log('DEBUG: RLS test query result:', rlsTestData, 'error:', rlsTestError);
        
        // Check if there's an RLS policy error
        if (rlsTestError && rlsTestError.message.includes('row-level security')) {
          console.log('DEBUG: RLS is blocking access to app_user table');
          console.log('DEBUG: RLS Error details:', rlsTestError);
        }
      }
      
      // Let's try a case-insensitive search to see if there are similar emails
      const { data: similarEmails, error: similarError } = await supa
        .from("app_user")
        .select("id, account_status, email")
        .ilike("email", `%${trimmedEmail}%`)
        .limit(5);
      console.log('DEBUG: Similar emails found:', similarEmails, 'error:', similarError);
      
      // Also try searching for just the domain to see if there are any gmail accounts
      const { data: gmailUsers, error: gmailError } = await supa
        .from("app_user")
        .select("id, email, account_status")
        .ilike("email", "%@gmail.com%")
        .limit(5);
      console.log('DEBUG: Gmail users found:', gmailUsers, 'error:', gmailError);
      
      return false;
    }
    
    console.log('DEBUG: Found account with status:', allData.account_status);
    
    // Now check with the original logic (excluding archived)
    const { data, error } = await supa
      .from("app_user")
      .select("id, account_status")
      .eq("email", trimmedEmail)
      .neq("account_status", "archived") // Exclude only archived accounts
      .maybeSingle();
    console.log('DEBUG: Non-archived query result - data:', data, 'error:', error);
    
    if (error) {
      console.warn("checkEmailExistsForPasswordReset failed:", error.message);
      return false;
    }
    const exists = !!data;
    console.log('DEBUG: Email exists result:', exists);
    return exists;
  }

  async function signUpWithEmailPassword(email, password, role) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const payload = {
      email: String(email || "").trim(),
      password: String(password || ""),
      options: {
        data: {
          role: role || "seeker"
        },
        emailRedirectTo: window.location.origin
      }
    };
    const { data, error } = await supa.auth.signUp(payload);
    if (error) throw new Error(formatDebugError(error, "Sign up failed."));
    // Supabase returns a user with empty identities when the email is already registered
    if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error("user already registered");
    }
    return data;
  }

  async function signInWithEmailPassword(email, password) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data, error } = await supa.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || "")
    });
    if (error) throw new Error(formatDebugError(error, "Login failed."));
    const signedUser = data && data.user ? data.user : null;
    if (signedUser) {
      // Check database first to preserve existing role (especially admin) and check account status
      let dbRole = "seeker";
      try {
        const { data: existingUser } = await supa
          .from("app_user")
          .select("role, account_status")
          .eq("id", signedUser.id)
          .maybeSingle();
        
        // Check if account is archived/deleted
        if (existingUser && existingUser.account_status === "archived") {
          throw new Error("These account is archived, Please contact the developer for more info.");
        }
        
        if (existingUser && existingUser.role) {
          dbRole = String(existingUser.role).toLowerCase();
        }
      } catch (e) {
        // If it's our custom error, re-throw it
        if (e.message && e.message.includes("archived")) {
          throw e;
        }
        // If database check fails, fall back to metadata
      }
      
      // Only use metadata role if no database role exists
      const roleValue = dbRole !== "seeker" ? dbRole : 
        (signedUser.user_metadata && signedUser.user_metadata.role
          ? String(signedUser.user_metadata.role).toLowerCase()
          : "seeker");
      try {
        await supa.from("app_user").upsert(
          {
            id: signedUser.id,
            email: signedUser.email || "",
            role: roleValue,
            is_active: true,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );
      } catch (e) {
        /* ignore app_user upsert errors on sign-in */
      }
      let displayName = String(
        (signedUser.user_metadata &&
          (signedUser.user_metadata.full_name ||
            signedUser.user_metadata.name ||
            signedUser.user_metadata.display_name)) ||
          ""
      ).trim();
      if (!displayName) {
        try {
          const { data: profileRow } = await supa
            .from("user_profile")
            .select("last_name,first_name,middle_name,suffix")
            .eq("user_id", signedUser.id)
            .maybeSingle();
          if (profileRow) {
            const lastName = profileRow.last_name || "";
            const firstName = profileRow.first_name || "";
            const middleName = profileRow.middle_name || "";
            const suffix = profileRow.suffix || "";
            const nameParts = [lastName, firstName];
            if (middleName) nameParts.push(middleName);
            if (suffix) nameParts.push(suffix);
            displayName = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
          }
        } catch (e) {
          /* ignore profile lookup errors on sign-in */
        }
      }
      if (!displayName) displayName = String(signedUser.email || "").trim();
      if (displayName) {
        try {
          // Parse displayName to extract name parts for storage
          const nameParts = displayName.split(',').map(p => p.trim());
          let lastName = '', firstName = '', middleName = '', suffix = '';
          
          if (nameParts.length >= 1) lastName = nameParts[0];
          if (nameParts.length >= 2) {
            const firstParts = nameParts[1].split(' ').map(p => p.trim());
            const lastPart = firstParts[firstParts.length - 1];
            const commonSuffixes = ['Jr', 'Sr', 'II', 'III', 'IV', 'V', 'Jr.', 'Sr.', 'II.', 'III.', 'IV.', 'V.'];
            
            if (firstParts.length > 1 && commonSuffixes.includes(lastPart)) {
              // If last part is a suffix, remove it and keep the rest as first name
              firstName = firstParts.slice(0, -1).join(' ');
              suffix = lastPart;
            } else {
              // Otherwise, keep all parts as first name (handles multi-word first names)
              firstName = firstParts.join(' ');
            }
          }
          
          await supa.from("user_profile").upsert(
            {
              user_id: signedUser.id,
              last_name: lastName || null,
              first_name: firstName || null,
              middle_name: middleName || null,
              suffix: suffix || null
            },
            { onConflict: "user_id" }
          );
        } catch (e) {
          /* ignore profile upsert errors on sign-in */
        }
      }
      upsertPosterNameCache(signedUser.id, displayName);
    }
    return data;
  }

  async function verifyEmailOtp(email, token, type) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data, error } = await supa.auth.verifyOtp({
      email: String(email || "").trim(),
      token: String(token || "").trim(),
      type: type || "signup"
    });
    if (error) throw new Error(formatDebugError(error, "OTP verification failed."));
    return data;
  }

  async function sendEmailOtp(email, type) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const targetType = type || "signup";
    const targetEmail = String(email || "").trim();
    const { error } = await supa.auth.resend({
      type: targetType,
      email: targetEmail
    });
    if (error) {
      if (targetType === "signup") {
        const fallback = await supa.auth.signInWithOtp({
          email: targetEmail,
          options: {
            shouldCreateUser: false
          }
        });
        if (fallback.error) {
          throw new Error(
            formatDebugError(
              fallback.error,
              `Unable to resend code. Resend failed: ${toSafeError(error)}`
            )
          );
        }
      } else {
        throw new Error(formatDebugError(error, "Unable to resend code."));
      }
    }
    return true;
  }

  async function sendPasswordResetOtp(email) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const targetEmail = String(email || "").trim();
    const { error } = await supa.auth.resetPasswordForEmail(targetEmail);
    if (error) throw new Error(formatDebugError(error, "Unable to send reset code."));
    return true;
  }

  async function checkIfEmailIsAdmin(email) {
    // Check if an email belongs to an admin user
    try {
      const supa = getClient();
      if (!supa) return false;
      
      const targetEmail = String(email || "").trim();
      const { data, error } = await supa
        .from("app_user")
        .select("role")
        .eq("email", targetEmail)
        .eq("role", "admin")
        .maybeSingle();
      
      if (error) {
        console.warn("checkIfEmailIsAdmin error:", error.message);
        return false;
      }
      
      return !!data; // Returns true if admin user found
    } catch (err) {
      console.warn("checkIfEmailIsAdmin exception:", err);
      return false;
    }
  }

  async function checkEmailExists(email) {
    // This function is deprecated - we'll handle email existence check
    // directly in the sendPasswordResetOtp error handling
    return true;
  }

  async function sendVerificationOtp(email) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const targetEmail = String(email || "").trim();
    // Use password reset flow for email verification since OTP is disabled
    const { error } = await supa.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: window.location.origin + '/admin/admin-account.html'
    });
    if (error) throw new Error(formatDebugError(error, "Unable to send verification code."));
    return true;
  }

  async function updateCurrentUserPassword(newPassword) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data, error } = await supa.auth.updateUser({
      password: String(newPassword || "")
    });
    if (error) throw new Error(formatDebugError(error, "Unable to update password."));
    return data;
  }

  async function updateCurrentUserEmail(newEmail) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data, error } = await supa.auth.updateUser({
      email: String(newEmail || "").trim()
    });
    if (error) throw new Error(formatDebugError(error, "Unable to update email."));
    return data;
  }

  async function deleteCurrentAccountWithPassword(password) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const user = await requireUser();
    const email = String(user.email || "").trim();
    const pass = String(password || "");
    if (!email) throw new Error("Current account email is unavailable.");
    if (pass.length < 6) throw new Error("Please enter your current password.");

    // Verify password before proceeding with archiving
    const { error: verifyErr } = await supa.auth.signInWithPassword({
      email,
      password: pass
    });
    if (verifyErr) throw new Error(formatDebugError(verifyErr, "Password verification failed."));

    // NOTE: Archive account instead of permanent deletion
    // This preserves data integrity and prevents email reuse
    
    const runUpdate = async (table, predicateBuilder, updateData, friendlyName) => {
      const q = supa.from(table).update(updateData);
      const scoped = predicateBuilder(q);
      const { error } = await scoped;
      if (error) throw new Error(formatDebugError(error, `Unable to archive ${friendlyName}.`));
    };

    const runDelete = async (table, predicateBuilder, friendlyName) => {
      const q = supa.from(table).delete();
      const scoped = predicateBuilder(q);
      const { error } = await scoped;
      if (error) throw new Error(formatDebugError(error, `Unable to delete ${friendlyName}.`));
    };

    try {
      // Archive user profile and app_user first
      await runUpdate(
        "user_profile",
        (q) => q.eq("user_id", user.id),
        {
          account_status: "archived",
          archived_at: new Date().toISOString(),
          first_name: "Deleted",
          last_name: "User",
          middle_name: null,
          suffix: null,
          phone: null,
          bio: "This account has been deleted.",
          description: "This account has been deleted.",
          address: null,
          unit_no: null,
          street: null,
          barangay: null,
          city: null,
          province: null,
          country: null,
          education_status_code: null,
          education_status_other_text: null
        },
        "your profile"
      );

      // Update app_user account status
      console.log("Updating app_user account status to archived for user:", user.id);
      try {
        await runUpdate(
          "app_user",
          (q) => q.eq("id", user.id),
          {
            account_status: "archived"
          },
          "your app user row"
        );
        console.log("Successfully updated app_user account status");
      } catch (e) {
        console.error("Failed to update app_user account status:", e);
        throw e;
      }

      // Collect posted job IDs before archiving
      const { data: postedRows, error: postedErr } = await supa
        .from("job_post")
        .select("id")
        .eq("posted_by", user.id);
      if (postedErr) throw new Error(formatDebugError(postedErr, "Unable to load your posted jobs."));
      const postedIds = Array.isArray(postedRows) ? postedRows.map((r) => String(r.id)).filter(Boolean) : [];

      // Mark job postings as hidden from public view (keep them for integrity and admin access)
      if (postedIds.length) {
        await runUpdate(
          "job_post",
          (q) => q.in("id", postedIds).eq("posted_by", user.id),
          {
            title: "[Deleted User] Job Posting",
            description: "This job posting is from a deleted account."
          },
          "your posted jobs"
        );
      }

      let relatedReportIds = [];
      {
        let reportQuery = supa
          .from("content_report")
          .select("id,reporter_id,target_user_id,reviewed_by,target_type,target_job_id");
        if (postedIds.length) {
          reportQuery = reportQuery.or(
            `reporter_id.eq.${user.id},target_user_id.eq.${user.id},reviewed_by.eq.${user.id},and(target_type.eq.job,target_job_id.in.(${postedIds.join(",")}))`
          );
        } else {
          reportQuery = reportQuery.or(
            `reporter_id.eq.${user.id},target_user_id.eq.${user.id},reviewed_by.eq.${user.id}`
          );
        }
        const { data: reportRows, error: reportRowsErr } = await reportQuery;
        if (reportRowsErr) throw new Error(formatDebugError(reportRowsErr, "Unable to load related reports."));
        relatedReportIds = Array.isArray(reportRows)
          ? reportRows.map((r) => String(r.id || "")).filter(Boolean)
          : [];
      }

      // Delete posted job-related data first (respects FK constraints)
      if (postedIds.length) {
        await runDelete("job_skill", (q) => q.in("job_id", postedIds), "posted job skills");
        await runDelete("job_rate", (q) => q.in("job_id", postedIds), "posted job rates");
        await runDelete("job_location", (q) => q.in("job_id", postedIds), "posted job locations");
        await runDelete("job_bookmark", (q) => q.in("job_id", postedIds), "bookmarks on your posted jobs");
        await runDelete("user_job_interaction", (q) => q.in("job_id", postedIds), "interactions on your posted jobs");
        await runDelete("user_hidden_job", (q) => q.in("job_id", postedIds), "hidden-job links on your posted jobs");
        await runDelete("job_application", (q) => q.in("job_id", postedIds), "applications on your posted jobs");
        await runDelete("job_post", (q) => q.in("id", postedIds).eq("posted_by", user.id), "your posted jobs");
      }

      // Archive user's personal data (anonymize but keep for integrity)
      await runUpdate("job_bookmark", (q) => q.eq("user_id", user.id), { user_id: null }, "your bookmarks");
      await runUpdate("user_hidden_job", (q) => q.eq("user_id", user.id), { user_id: null }, "your hidden jobs");
      await runUpdate("user_job_interaction", (q) => q.eq("user_id", user.id), { user_id: null }, "your interactions");
      
      // Mark applications as hidden from public view (keep them for integrity and admin access)
      // RLS policy violation - commented out
      // await runUpdate(
      //   "job_application", 
      //   (q) => q.eq("applicant_id", user.id), 
      //   { 
      //     applicant_id: null
      //   }, 
      //   "your applications"
      // );

      // Archive user-specific data
      await runUpdate("user_skill", (q) => q.eq("user_id", user.id), { user_id: null }, "your skills");
      await runUpdate("user_work_experience", (q) => q.eq("user_id", user.id), { user_id: null }, "your work experiences");
      await runUpdate("user_education", (q) => q.eq("user_id", user.id), { user_id: null }, "your education entries");
      await runUpdate("user_language", (q) => q.eq("user_id", user.id), { user_id: null }, "your language entries");
      await runUpdate("user_personality", (q) => q.eq("user_id", user.id), { user_id: null }, "your personality entries");
      await runUpdate("user_profile_link", (q) => q.eq("user_id", user.id), { user_id: null }, "your profile links");
      // await runUpdate("notification", (q) => q.eq("user_id", user.id), { user_id: null }, "your notifications"); // RLS policy violation - commented out
      await runUpdate("account_security_event", (q) => q.eq("user_id", user.id), { user_id: null }, "your account security events");
      await runUpdate("otp_verification", (q) => q.eq("user_id", user.id), { user_id: null }, "your OTP verification records");
      await runUpdate("password_reset_token", (q) => q.eq("user_id", user.id), { user_id: null }, "your password reset tokens");
      await runUpdate("user_ban", (q) => q.eq("user_id", user.id), { user_id: null }, "your ban records");

      // Mark reports involving this user (commented out due to non-existent columns)
      // await runUpdate("content_report", (q) => q.eq("reporter_id", user.id), { reporter_id: null, reporter_name: "Deleted User" }, "reports you made");
      // await runUpdate("content_report", (q) => q.eq("target_user_id", user.id), { target_user_id: null, target_user_name: "Deleted User" }, "reports about you");
      // await runUpdate("moderation_action", (q) => q.eq("admin_id", user.id), { admin_id: null, admin_name: "Deleted User" }, "moderation actions by your account");
      // await runUpdate("moderation_action", (q) => q.eq("target_user_id", user.id), { target_user_id: null, target_user_name: "Deleted User" }, "moderation actions targeting your account");

      // Revoke auth session but keep the user record
      try {
        await supa.auth.signOut();
      } catch (signOutErr) {
        console.warn("Failed to sign out:", signOutErr);
      }

      return { success: true, message: "Account archived successfully." };
    } catch (err) {
      throw err;
    }
  }

  async function ensureProfileRow(defaults) {
    const supa = getClient();
    if (!supa) return null;
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) return null;
    const roleValue = (
      (user.user_metadata && user.user_metadata.role)
        ? String(user.user_metadata.role)
        : (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pendingSignupRole")) || "seeker"
    ).toLowerCase();
    const { error: appUserErr } = await supa.from("app_user").upsert(
      {
        id: user.id,
        email: user.email || "",
        role: roleValue || "seeker",
        is_active: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );
    if (appUserErr) throw new Error(formatDebugError(appUserErr, "Unable to initialize app user row."));
    const defaultFullName = String(
      (defaults && defaults.full_name) ||
        (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.display_name)) ||
        user.email ||
        ""
    ).trim();
    
    // Parse defaultFullName to extract name parts
    const nameParts = defaultFullName.split(',').map(p => p.trim());
    let lastName = '', firstName = '', middleName = '', suffix = '';
    
    if (nameParts.length >= 1) lastName = nameParts[0];
    if (nameParts.length >= 2) {
      const firstParts = nameParts[1].split(' ').map(p => p.trim());
      const lastPart = firstParts[firstParts.length - 1];
      const commonSuffixes = ['Jr', 'Sr', 'II', 'III', 'IV', 'V', 'Jr.', 'Sr.', 'II.', 'III.', 'IV.', 'V.'];
      
      if (firstParts.length > 1 && commonSuffixes.includes(lastPart)) {
        // If last part is a suffix, remove it and keep the rest as first name
        firstName = firstParts.slice(0, -1).join(' ');
        suffix = lastPart;
      } else {
        // Otherwise, keep all parts as first name (handles multi-word first names)
        firstName = firstParts.join(' ');
      }
    }
    
    const row = {
      user_id: user.id,
      last_name: lastName || null,
      first_name: firstName || null,
      middle_name: middleName || null,
      suffix: suffix || null
    };
    const { error } = await supa.from("user_profile").upsert(row, { onConflict: "user_id" });
    if (error) throw new Error(formatDebugError(error, "Unable to initialize profile row."));
    upsertPosterNameCache(user.id, defaultFullName || String(user.email || "").trim());
    return true;
  }

  async function saveCurrentUserProfile(profile) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    await ensureDropdownOptionCache(supa);
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) throw new Error("Not signed in.");
    const p = profile && typeof profile === "object" ? profile : {};
    
    console.log("saveCurrentUserProfile called with:", {
      id_url: p.id_url,
      cert_url: p.cert_url,
      preferences: p.preferences
    });
    console.log("Full profile object:", p);
    const rawEducation = String(p.educationStatus || "").trim();
    let educationCode = resolveDropdownCode("education_status", rawEducation, null);
    // Don't force to "other" - keep the original text if no code is found
    const addressObj = p.address && typeof p.address === "object" ? p.address : {};
    const row = {
      user_id: user.id,
      last_name: p.lastName ? String(p.lastName) : null,
      first_name: p.firstName ? String(p.firstName) : null,
      middle_name: p.middleName ? String(p.middleName) : null,
      suffix: p.suffix ? String(p.suffix) : null,
      phone: p.phone ? String(p.phone) : null,
      address: addressObj,
      unit_no: addressObj.unitNo ? String(addressObj.unitNo) : null,
      street: addressObj.street ? String(addressObj.street) : null,
      barangay: addressObj.barangay ? String(addressObj.barangay) : null,
      city: addressObj.city ? String(addressObj.city) : null,
      province: addressObj.province ? String(addressObj.province) : null,
      country: addressObj.country ? String(addressObj.country) : null,
      bio: p.description ? String(p.description) : null,
      description: p.description ? String(p.description) : null,
      education_status_code: educationCode || null,
      education_status_other_text:
        educationCode && isOtherCode("education_status", educationCode) && rawEducation
          ? rawEducation
          : null,
      education_status: rawEducation || null,
      birth_date: p.birthDate ? String(p.birthDate) : null,
      sex: p.sex ? String(p.sex) : null,
      work_experiences: Array.isArray(p.workExperiences) ? p.workExperiences : [],
      education_backgrounds: Array.isArray(p.educationBackgrounds) ? p.educationBackgrounds : [],
      skills: Array.isArray(p.skills) ? p.skills : [],
      languages: Array.isArray(p.languages) ? p.languages : [],
      personality: Array.isArray(p.personality) ? p.personality : [],
      profile_links: Array.isArray(p.profileLinks) ? p.profileLinks : [],
      avatar_url: (p.avatarUrl || p.avatar_url) ? String(p.avatarUrl || p.avatar_url) : null,
      id_url: p.id_url ? String(p.id_url) : null,
      cert_url: p.cert_url ? String(p.cert_url) : null,
      id_status: p._resetIdStatus ? "pending" : (p.id_status || null),
      cert_status: p._resetCertStatus ? "pending" : (p.cert_status || null),
      preferences: p.preferences ? JSON.stringify(p.preferences) : null
    };
    let { error } = await supa.from("user_profile").upsert(row, { onConflict: "user_id" });
    if (error) {
      const msg = String(error.message || "").toLowerCase();
      const details = String(error.details || "").toLowerCase();
      const code = String(error.code || "").toLowerCase();
      const missingAvatarColumn =
        code === "42703" ||
        (msg.includes("avatar_url") && msg.includes("does not exist")) ||
        (details.includes("avatar_url") && details.includes("does not exist"));
      if (code === "42703" || msg.includes("does not exist") || details.includes("does not exist")) {
        console.error("MISSING DATABASE COLUMNS DETECTED!");
        console.error("Please run this SQL in Supabase SQL Editor:");
        console.error(`
ALTER TABLE public.user_profile 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS id_url TEXT,
  ADD COLUMN IF NOT EXISTS cert_url TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB;
        `);
        
        // Fallback: save without the problematic columns
        const rowWithoutOptional = Object.assign({}, row);
        delete rowWithoutOptional.avatar_url;
        delete rowWithoutOptional.id_url;
        delete rowWithoutOptional.cert_url;
        delete rowWithoutOptional.id_status;
        delete rowWithoutOptional.cert_status;
        delete rowWithoutOptional.preferences;
        const retry = await supa.from("user_profile").upsert(rowWithoutOptional, { onConflict: "user_id" });
        error = retry.error || null;
        console.log("Saved without optional columns - please add the missing columns to save URLs");
      }
    }
    if (error) throw new Error(formatDebugError(error, "Unable to save profile."));
    
    // Verify the save worked by checking the saved data
    console.log("Profile saved, verifying data...");
    const { data: verifyData, error: verifyError } = await supa
      .from("user_profile")
      .select("id_url, cert_url, preferences")
      .eq("user_id", user.id)
      .single();
    
    if (verifyError) {
      console.error("Verification failed:", verifyError);
    } else {
      console.log("Verification successful - saved data:", verifyData);
    }
    
    const lastName = row.last_name || "";
    const firstName = row.first_name || "";
    const middleName = row.middle_name || "";
    const suffix = row.suffix || "";
    const nameParts = [lastName, firstName];
    if (middleName) nameParts.push(middleName);
    if (suffix) nameParts.push(suffix);
    const fullName = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
    upsertPosterNameCache(user.id, String(fullName || "").trim() || String(user.email || "").trim());
    return true;
  }

  async function loadCurrentUserProfile() {
    const supa = getClient();
    if (!supa) return null;
    await ensureDropdownOptionCache(supa);
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) return null;
    const { data, error } = await supa
      .from("user_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(formatDebugError(error, "Unable to load profile."));
    if (!data) return null;
    const educationLabel =
      resolveDropdownLabel("education_status", data.education_status_code, "") ||
      data.education_status ||
      "";
    const addr = data.address && typeof data.address === "object" ? data.address : {};
    // Build full name from separate fields
    const lastName = data.last_name ? String(data.last_name).trim() : "";
    const firstName = data.first_name ? String(data.first_name).trim() : "";
    const middleName = data.middle_name ? String(data.middle_name).trim() : "";
    const suffix = data.suffix ? String(data.suffix).trim() : "";
    const fullName = lastName
      ? [lastName, [firstName, middleName, suffix].filter(Boolean).join(' ')].filter(Boolean).join(', ')
      : [firstName, middleName, suffix].filter(Boolean).join(' ');

    return {
      name: fullName,
      lastName: lastName,
      firstName: firstName,
      middleName: middleName,
      suffix: suffix,
      email: user.email || "",
      phone: data.phone || "",
      address: {
        unitNo: addr.unitNo || data.unit_no || "",
        street: addr.street || data.street || "",
        barangay: addr.barangay || data.barangay || "",
        city: addr.city || data.city || "",
        province: addr.province || data.province || "",
        country: addr.country || data.country || "",
        zip: addr.zip || ""
      },
      description: data.description || data.bio || "",
      educationStatus: educationLabel,
      birthDate: data.birth_date || "",
      sex: data.sex || "",
      workExperiences: Array.isArray(data.work_experiences) ? data.work_experiences : [],
      educationBackgrounds: Array.isArray(data.education_backgrounds) ? data.education_backgrounds : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      personality: Array.isArray(data.personality) ? data.personality : [],
      profileLinks: Array.isArray(data.profile_links) ? data.profile_links : [],
      avatarUrl: data.avatar_url || "",
      id_url: data.id_url || "",
      cert_url: data.cert_url || "",
      id_status: data.id_status || "pending",
      cert_status: data.cert_status || "pending",
      preferences: data.preferences ? JSON.parse(data.preferences) : {}
    };
  }

  function hasMeaningfulAddress(address) {
    if (!address || typeof address !== "object") return false;
    const required = ["street", "barangay", "city", "province", "country", "zip"];
    return required.every((key) => {
      const value = address[key];
      return typeof value === "string" && value.trim().length > 0;
    });
  }

  function hasArrayItems(arr, min = 1) {
    if (!Array.isArray(arr)) return false;
    return arr.filter((item) => {
      if (item == null) return false;
      if (typeof item === "string") return item.trim().length > 0;
      if (typeof item === "object") return Object.values(item).some((v) => String(v || "").trim().length > 0);
      return true;
    }).length >= min;
  }

  function isSeekerProfileComplete(profile) {
    if (!profile || typeof profile !== "object") return false;
    const name = String(profile.name || "").trim();
    const phone = String(profile.phone || "").trim();
    const description = String(profile.description || "").trim();
    const hasWork = hasArrayItems(profile.workExperiences);
    const hasEducation = hasArrayItems(profile.educationBackgrounds);
    const hasSkills = hasArrayItems(profile.skills);
    const hasLanguages = hasArrayItems(profile.languages);
    const hasLinks = hasArrayItems(profile.profileLinks);
    const hasPersonality = hasArrayItems(profile.personality);
    return (
      name.length > 0 &&
      phone.length > 0 &&
      description.length > 0 &&
      hasMeaningfulAddress(profile.address) &&
      hasWork &&
      hasEducation &&
      hasSkills &&
      hasLanguages &&
      hasLinks &&
      hasPersonality
    );
  }

  function isRecruiterProfileComplete(profile) {
    if (!profile || typeof profile !== "object") return false;
    const name = String(profile.name || "").trim();
    const phone = String(profile.phone || "").trim();
    const hasLinks = hasArrayItems(profile.profileLinks);
    return name.length > 0 && phone.length > 0 && hasMeaningfulAddress(profile.address) && hasLinks;
  }

  function isProfileComplete(profile, roleHint) {
    const roleLower = String(roleHint || "").trim().toLowerCase();
    if (roleLower === "recruiter" || roleLower === "employer") {
      return isRecruiterProfileComplete(profile);
    }
    return isSeekerProfileComplete(profile);
  }

  function toRelativePostedAgo(isoText) {
    const dt = new Date(isoText || "");
    if (Number.isNaN(dt.getTime())) return "Just now";
    const diff = Date.now() - dt.getTime();
    if (diff <= 0) return "Just now";
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  }

  async function loadPostedJobs() {
    const supa = getClient();
    if (!supa) return [];
    await ensureDropdownOptionCache(supa);
    const auth = await supa.auth.getUser();
    const user = auth && auth.data ? auth.data.user : null;
    if (!user) return [];
    const { data, error } = await supa
      .from("job_post")
      .select("id,title,category_code,schedule_code,setting_code,description,is_urgent,listing_open,is_archived,archived_at,image_url,posted_at,job_location(full_text,street,barangay,city,province,country),job_rate(amount,currency_code,unit_code),job_skill(skill_name)")
      .eq("posted_by", user.id)
      .order("posted_at", { ascending: false });
    if (error) throw new Error(formatDebugError(error, "Unable to load posted jobs."));
    
    // Get user profile once for poster name
    let posterName = "You";
    try {
      const { data: profile } = await supa
        .from("user_profile")
        .select("last_name,first_name,middle_name,suffix")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        posterName = formatApplicantName(profile) || "You";
      }
    } catch (e) {
      // Fallback to "You" if profile fetch fails
    }
    
    return (data || []).map((row) => {
      const rateRow = Array.isArray(row.job_rate) ? row.job_rate[0] : row.job_rate;
      const locRow = Array.isArray(row.job_location) ? row.job_location[0] : row.job_location;
      const skills = Array.isArray(row.job_skill) ? row.job_skill.map((s) => s.skill_name).filter(Boolean) : [];
      const rateAmount = rateRow && rateRow.amount != null ? Number(rateRow.amount) : null;
      const rateCurrency = rateRow && rateRow.currency_code ? String(rateRow.currency_code) : "PHP";
      const rateUnit = rateRow && rateRow.unit_code ? String(rateRow.unit_code) : "Hour";

      return {
        id: row.id,
        title: row.title || "Untitled Job",
        company: "You",
        posterName: posterName,
        category: resolveDropdownLabel("job_category", row.category_code, row.category_code || "Job"),
        schedule: resolveDropdownLabel("schedule", row.schedule_code, row.schedule_code || "Full-time"),
        type: resolveDropdownLabel("work_setting", row.setting_code, row.setting_code || "On-Site"),
        location: (locRow && (locRow.full_text || locRow.city || locRow.province || locRow.country)) || "Remote",
        rate: rateAmount != null ? `${rateCurrency} ${rateAmount}/${rateUnit}` : "",
        rateUnit,
        skills,
        description: row.description || "",
        postedAgo: toRelativePostedAgo(row.posted_at),
        urgent: !!row.is_urgent,
        listingOpen: row.listing_open !== false,
        is_archived: row.is_archived === true,
        archived_at: row.archived_at || null,
        image: row.image_url || "",
        _moreSource: "posted"
      };
    });
  }

  async function loadAllJobs() {
    const supa = getClient();
    if (!supa) return [];
    await ensureDropdownOptionCache(supa);
    const auth = await supa.auth.getUser();
    const currentUserId = auth && auth.data && auth.data.user ? auth.data.user.id : null;
    
    // Check if current user is admin
    let isAdmin = false;
    if (currentUserId) {
      try {
        const { data: currentUser } = await supa
          .from("app_user")
          .select("role")
          .eq("id", currentUserId)
          .maybeSingle();
        isAdmin = currentUser && currentUser.role === "admin";
      } catch (e) {
        // If check fails, assume not admin
      }
    }
    
    // Build query - include account status for styling
    let query = supa
      .from("job_post")
      .select("id,title,category_code,schedule_code,setting_code,description,is_urgent,listing_open,is_archived,archived_at,image_url,posted_at,posted_by,poster_profile:user_profile!job_post_posted_by_fkey(last_name,first_name,middle_name,suffix),job_location(full_text,city,province,country),job_rate(amount,currency_code,unit_code),job_skill(skill_name)");
    
    // Only filter hidden jobs for non-admin users (when columns exist)
    // Temporarily disabled until is_hidden column is added to database
    // if (!isAdmin) {
    //   query = query.eq("is_hidden", false);
    // }
    
    const { data, error } = await query.order("posted_at", { ascending: false });
    if (error) throw new Error(formatDebugError(error, "Unable to load jobs."));
    const rows = Array.isArray(data) ? data : [];
    const posterNameById = await buildPosterNameMap(
      supa,
      rows.map((row) => row && row.posted_by)
    );
    return rows.map((row) => {
      const rateRow = Array.isArray(row.job_rate) ? row.job_rate[0] : row.job_rate;
      const locRow = Array.isArray(row.job_location) ? row.job_location[0] : row.job_location;
      const skills = Array.isArray(row.job_skill) ? row.job_skill.map((s) => s.skill_name).filter(Boolean) : [];
      const rateAmount = rateRow && rateRow.amount != null ? Number(rateRow.amount) : null;
      const rateCurrency = rateRow && rateRow.currency_code ? String(rateRow.currency_code) : "PHP";
      const rateUnit = rateRow && rateRow.unit_code ? String(rateRow.unit_code) : "Hour";
      const postedById = row.posted_by ? String(row.posted_by) : "";
      const relPoster = Array.isArray(row.poster_profile) ? row.poster_profile[0] : row.poster_profile;
      const lastName = relPoster && relPoster.last_name ? String(relPoster.last_name).trim() : "";
      const firstName = relPoster && relPoster.first_name ? String(relPoster.first_name).trim() : "";
      const middleName = relPoster && relPoster.middle_name ? String(relPoster.middle_name).trim() : "";
      const suffix = relPoster && relPoster.suffix ? String(relPoster.suffix).trim() : "";
      const nameParts = [lastName, firstName];
      if (middleName) nameParts.push(middleName);
      if (suffix) nameParts.push(suffix);
      const relPosterName = nameParts.join(' ');
      // poster_name and other name columns don't exist in DB, rely on buildPosterNameMap
      const directPosterName = "";
      return {
        id: row.id,
        title: row.title || "Untitled Job",
        company: relPosterName || directPosterName || posterNameById.get(postedById) || "Employer",
        postedById: postedById || null,
        isOwnerPost: !!(currentUserId && row.posted_by && String(row.posted_by) === String(currentUserId)),
        accountStatus: 'active', // Default to active - will be updated in a separate query if needed
        category: resolveDropdownLabel("job_category", row.category_code, row.category_code || "Job"),
        schedule: resolveDropdownLabel("schedule", row.schedule_code, row.schedule_code || "Full-time"),
        type: resolveDropdownLabel("work_setting", row.setting_code, row.setting_code || "On-Site"),
        location: (locRow && (locRow.full_text || locRow.city || locRow.province || locRow.country)) || "Remote",
        rate: rateAmount != null ? `${rateCurrency} ${rateAmount}/${rateUnit}` : "",
        rateUnit,
        skills,
        description: row.description || "",
        postedAgo: toRelativePostedAgo(row.posted_at),
        urgent: !!row.is_urgent,
        listingOpen: row.listing_open !== false,
        is_archived: row.is_archived === true,
        archived_at: row.archived_at || null,
        image: row.image_url || ""
      };
    });
  }

  async function loadSeekerPreferences() {
    const supa = getClient();
    if (!supa) return null;
    await ensureDropdownOptionCache(supa);
    const auth = await supa.auth.getUser();
    const user = auth && auth.data ? auth.data.user : null;
    if (!user) return null;
    const { data, error } = await supa
      .from("seeker_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      throw new Error(formatDebugError(error, "Unable to load preferences."));
    }
    if (!data) return null;
    return {
      schedule: data.preferred_schedule_code || "",
      scheduleOther: data.preferred_schedule_other || "",
      setting: data.preferred_setting_code || "",
      settingOther: data.preferred_setting_other || "",
      type: data.preferred_type_code || "",
      typeOther: data.preferred_type_other || "",
      minRate: data.min_rate_amount || null,
      maxRate: data.max_rate_amount || null,
      currency: data.preferred_currency_code || "PHP",
      rateUnit: data.preferred_rate_unit_code || "hour",
      notes: data.preferences_notes || ""
    };
  }

  async function saveSeekerPreferences(prefs) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    await ensureDropdownOptionCache(supa);
    const auth = await supa.auth.getUser();
    const user = auth && auth.data ? auth.data.user : null;
    if (!user) throw new Error("User not authenticated.");

    const scheduleCode = resolveDropdownCode("schedule", String(prefs.schedule || ""), "");
    const settingCode = resolveDropdownCode("work_setting", String(prefs.setting || ""), "");
    const typeCode = resolveDropdownCode("job_category", String(prefs.type || ""), "");
    const currencyCode = resolveDropdownCode("currency", String(prefs.currency || "PHP"), "PHP");
    const rateUnitCode = resolveDropdownCode("rate_unit", String(prefs.rateUnit || "hour"), "hour");

    const base = {
      user_id: user.id,
      preferred_schedule_code: scheduleCode || null,
      preferred_schedule_other: isOtherCode("schedule", scheduleCode) ? prefs.schedule : null,
      preferred_setting_code: settingCode || null,
      preferred_setting_other: isOtherCode("work_setting", settingCode) ? prefs.setting : null,
      preferred_type_code: typeCode || null,
      preferred_type_other: isOtherCode("job_category", typeCode) ? prefs.type : null,
      min_rate_amount: prefs.minRate ? Number(prefs.minRate) : null,
      max_rate_amount: prefs.maxRate ? Number(prefs.maxRate) : null,
      preferred_currency_code: currencyCode,
      preferred_rate_unit_code: rateUnitCode,
      preferences_notes: String(prefs.notes || "").slice(0, 500)
    };

    const { error } = await supa.from("seeker_preferences").upsert(base, { onConflict: "user_id" });
    if (error) throw new Error(formatDebugError(error, "Unable to save preferences."));
    return true;
  }

  async function currentUser() {
    const supa = getClient();
    if (!supa) return null;
    const { data } = await supa.auth.getUser();
    return data && data.user ? data.user : null;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user) throw new Error("Not signed in.");
    return user;
  }

  async function getCurrentUserRole() {
    const supa = getClient();
    if (!supa) return "";
    const user = await currentUser();
    if (!user) return "";
    const { data, error } = await supa
      .from("app_user")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data && data.role) return String(data.role).toLowerCase();
    const metaRole =
      user.user_metadata && user.user_metadata.role
        ? String(user.user_metadata.role).toLowerCase()
        : "";
    return metaRole || "seeker";
  }

  async function setCurrentUserRole(role) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const user = await requireUser();
    const normalized = String(role || "").trim().toLowerCase();
    if (!normalized) throw new Error("Role is required.");
    const { error } = await supa
      .from("app_user")
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          role: normalized,
          created_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
    if (error) throw new Error(formatDebugError(error, "Unable to update user role."));
    return normalized;
  }

  async function signOut() {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { error } = await supa.auth.signOut();
    if (error) throw new Error(formatDebugError(error, "Unable to sign out."));
    // Clear client session
    client = null;
    return true;
  }

  function fallbackNameFromEmail(email) {
    const local = String(email || "").split("@")[0] || "";
    if (!local) return "Employer";
    return local
      .replace(/[_\-.]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  function normalizePosterDisplayName(value, fallbackEmail) {
    const raw = String(value || "").trim();
    if (raw && !raw.includes("@")) return raw;
    return "";
  }

  async function buildPosterNameMap(supa, postedByIds) {
    const ids = Array.from(new Set((postedByIds || []).map((v) => String(v || "").trim()).filter(Boolean)));
    const map = new Map();
    if (!ids.length) return map;

    const { data: appUsers, error: appUsersErr } = await supa
      .from("app_user")
      .select("id,email")
      .in("id", ids);
    if (appUsersErr) {
      console.warn("Could not load poster accounts (RLS?):", appUsersErr.message);
    }

    const { data: profiles, error: profilesErr } = await supa
      .from("user_profile")
      .select("last_name,first_name,middle_name,suffix,user_id")
      .in("user_id", ids);
    if (profilesErr) {
      console.warn("Could not load poster profiles (RLS?):", profilesErr.message);
    }

    function pickNameFromProfile(profile) {
      if (!profile || typeof profile !== "object") return "";
      const lastName = profile.last_name || "";
      const firstName = profile.first_name || "";
      const middleName = profile.middle_name || "";
      const suffix = profile.suffix || "";
      const nameParts = [lastName, firstName];
      if (middleName) nameParts.push(middleName);
      if (suffix) nameParts.push(suffix);
      const direct = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
      const normalizedDirect = normalizePosterDisplayName(direct, "");
      if (normalizedDirect) return normalizedDirect;
      const first = String(profile.first_name || "").trim();
      const last = String(profile.last_name || "").trim();
      const joined = [first, last].filter(Boolean).join(" ").trim();
      return joined;
    }

    function pickNameFromAppUser(user) {
      if (!user || typeof user !== "object") return "";
      return normalizePosterDisplayName(String(user.full_name || user.name || user.display_name || "").trim(), user.email);
    }

    const emailById = new Map(
      (Array.isArray(appUsers) ? appUsers : []).map((u) => [String(u.id), String(u.email || "")])
    );
    const appUserNameById = new Map(
      (Array.isArray(appUsers) ? appUsers : [])
        .map((u) => [String(u.id), pickNameFromAppUser(u)])
        .filter(([, name]) => !!name)
    );
    const profileNameById = new Map(
      (Array.isArray(profiles) ? profiles : [])
        .map((p) => [String(p.user_id), pickNameFromProfile(p)])
        .filter(([, name]) => !!name)
    );

    ids.forEach((id) => {
      const fullName = profileNameById.get(id) || appUserNameById.get(id);
      if (fullName) {
        map.set(id, fullName);
        upsertPosterNameCache(id, fullName);
        return;
      }
      const cachedName = getCachedPosterNameById(id);
      if (cachedName) {
        const normalizedCached = normalizePosterDisplayName(cachedName, emailById.get(id) || "");
        if (normalizedCached) {
          map.set(id, normalizedCached);
          return;
        }
      }
      map.set(id, "Employer");
    });
    return map;
  }

  // -------------------------------
  // BOOKMARKS (job_bookmark)
  // -------------------------------
  async function listBookmarks() {
    const supa = getClient();
    if (!supa) return [];
    await ensureDropdownOptionCache(supa);
    const user = await requireUser();
    const { data, error } = await supa
      .from("job_bookmark")
      .select(
        "created_at, job_post:job_id(*,poster_profile:user_profile!job_post_posted_by_fkey(last_name,first_name,middle_name,suffix),job_location(full_text,city,province,country),job_rate(amount,currency_code,unit_code),job_skill(skill_name))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(formatDebugError(error, "Unable to load bookmarks."));
    const rows = Array.isArray(data) ? data : [];
    const posterNameById = await buildPosterNameMap(
      supa,
      rows.map((row) => row && row.job_post && row.job_post.posted_by)
    );
    return rows
      .map((row) => {
        const job = row.job_post;
        if (!job) return null;
        const rateRow = Array.isArray(job.job_rate) ? job.job_rate[0] : job.job_rate;
        const locRow = Array.isArray(job.job_location) ? job.job_location[0] : job.job_location;
        const skills = Array.isArray(job.job_skill) ? job.job_skill.map((s) => s.skill_name).filter(Boolean) : [];
        const rateAmount = rateRow && rateRow.amount != null ? Number(rateRow.amount) : null;
        const rateCurrency = rateRow && rateRow.currency_code ? String(rateRow.currency_code) : "PHP";
        const rateUnit = rateRow && rateRow.unit_code ? String(rateRow.unit_code) : "Hour";
        const relPoster = Array.isArray(job.poster_profile) ? job.poster_profile[0] : job.poster_profile;
        const lastName = relPoster && relPoster.last_name ? String(relPoster.last_name).trim() : "";
        const firstName = relPoster && relPoster.first_name ? String(relPoster.first_name).trim() : "";
        const middleName = relPoster && relPoster.middle_name ? String(relPoster.middle_name).trim() : "";
        const suffix = relPoster && relPoster.suffix ? String(relPoster.suffix).trim() : "";
        const nameParts = [lastName, firstName];
        if (middleName) nameParts.push(middleName);
        if (suffix) nameParts.push(suffix);
        const relPosterName = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
        const normalizedPosterName = normalizePosterDisplayName(relPosterName, "");
        const directPosterName = normalizePosterDisplayName(String(
          job.poster_name || job.posted_by_name || job.company_name || job.employer_name || ""
        ).trim(), "");
        return {
          id: job.id,
          title: job.title || "Job",
          company: relPosterName || normalizePosterDisplayName(directPosterName, "") || posterNameById.get(String(job.posted_by || "")) || "Employer",
          category: resolveDropdownLabel("job_category", job.category_code, job.category_code || "Job"),
          schedule: resolveDropdownLabel("schedule", job.schedule_code, job.schedule_code || "—"),
          type: resolveDropdownLabel("work_setting", job.setting_code, job.setting_code || "On-Site"),
          location: (locRow && (locRow.full_text || locRow.city || locRow.province || locRow.country)) || "—",
          rate: rateAmount != null ? `${rateCurrency} ${rateAmount}/${rateUnit}` : "",
          rateUnit,
          skills,
          description: job.description || "",
          postedAgo: toRelativePostedAgo(job.posted_at),
          urgent: !!job.is_urgent,
          listingOpen: job.listing_open !== false,
          image: job.image_url || "",
          _bookmarkedAt: row.created_at,
          _moreSource: "listing"
        };
      })
      .filter(Boolean);
  }

  async function isBookmarked(jobId) {
    const supa = getClient();
    if (!supa) return false;
    const user = await requireUser();
    const { data, error } = await supa
      .from("job_bookmark")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_id", String(jobId))
      .maybeSingle();
    if (error) throw new Error(formatDebugError(error, "Unable to check bookmark."));
    return !!data;
  }

  async function addBookmark(jobId) {
    const supa = getClient();
    if (!supa) return false;
    const user = await requireUser();
    // Use upsert with onConflict to make this idempotent
    const { error } = await supa.from("job_bookmark").upsert({
      user_id: user.id,
      job_id: String(jobId)
    }, { onConflict: "user_id,job_id" });
    // Ignore duplicate key errors as it means already bookmarked
    if (error && !String(error.message || "").includes("duplicate")) {
      throw new Error(formatDebugError(error, "Unable to add bookmark."));
    }

    // Send notification to user about bookmark
    try {
      const { data: job, error: jobErr } = await supa
        .from("job_post")
        .select("id,title")
        .eq("id", String(jobId))
        .maybeSingle();
      if (!jobErr && job) {
        await createNotification(user.id, "job_bookmarked", {
          job_title: job.title || "Untitled Job"
        });
      }
    } catch (notifyErr) {
      console.warn("Failed to send bookmark notification:", notifyErr);
    }

    return true;
  }

  async function removeBookmark(jobId) {
    const supa = getClient();
    if (!supa) return false;
    const user = await requireUser();
    const { error } = await supa
      .from("job_bookmark")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", String(jobId));
    if (error) throw new Error(formatDebugError(error, "Unable to remove bookmark."));
    return true;
  }

  async function toggleBookmark(jobId) {
    if (await isBookmarked(jobId)) {
      await removeBookmark(jobId);
      return false;
    }
    await addBookmark(jobId);
    return true;
  }

  // -------------------------------
  // APPLICATIONS (job_application)
  // -------------------------------
  async function listApplications() {
    const supa = getClient();
    if (!supa) return [];
    await ensureDropdownOptionCache(supa);
    const user = await requireUser();
    const { data, error } = await supa
      .from("job_application")
      .select(
        "id,status,applied_at,updated_at, job_post:job_id(*,poster_profile:user_profile!job_post_posted_by_fkey(last_name,first_name,middle_name,suffix,phone,profile_links),job_location(full_text,city,province,country),job_rate(amount,currency_code,unit_code),job_skill(skill_name))"
      )
      .eq("applicant_id", user.id)
      .order("applied_at", { ascending: false });
    if (error) throw new Error(formatDebugError(error, "Unable to load applications."));
    const rows = Array.isArray(data) ? data : [];
    const posterIds = Array.from(
      new Set(
        rows
          .map((row) => row && row.job_post && row.job_post.posted_by)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );
    let posterEmailById = new Map();
    if (posterIds.length) {
      const { data: appUsers } = await supa
        .from("app_user")
        .select("id,email")
        .in("id", posterIds);
      posterEmailById = new Map(
        (Array.isArray(appUsers) ? appUsers : []).map((u) => [String(u.id), String(u.email || "").trim()])
      );
    }
    const posterNameById = await buildPosterNameMap(
      supa,
      rows.map((row) => row && row.job_post && row.job_post.posted_by)
    );
    return rows
      .map((row) => {
        const job = row.job_post;
        if (!job) return null;
        const rateRow = Array.isArray(job.job_rate) ? job.job_rate[0] : job.job_rate;
        const locRow = Array.isArray(job.job_location) ? job.job_location[0] : job.job_location;
        const skills = Array.isArray(job.job_skill) ? job.job_skill.map((s) => s.skill_name).filter(Boolean) : [];
        const rateAmount = rateRow && rateRow.amount != null ? Number(rateRow.amount) : null;
        const rateCurrency = rateRow && rateRow.currency_code ? String(rateRow.currency_code) : "PHP";
        const rateUnit = rateRow && rateRow.unit_code ? String(rateRow.unit_code) : "Hour";
        const relPoster = Array.isArray(job.poster_profile) ? job.poster_profile[0] : job.poster_profile;
        const lastName = relPoster && relPoster.last_name ? String(relPoster.last_name).trim() : "";
        const firstName = relPoster && relPoster.first_name ? String(relPoster.first_name).trim() : "";
        const middleName = relPoster && relPoster.middle_name ? String(relPoster.middle_name).trim() : "";
        const suffix = relPoster && relPoster.suffix ? String(relPoster.suffix).trim() : "";
        const nameParts = [lastName, firstName];
        if (middleName) nameParts.push(middleName);
        if (suffix) nameParts.push(suffix);
        const relPosterName = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
        const normalizedPosterName = normalizePosterDisplayName(relPosterName, "");
        const relPosterPhone = relPoster && relPoster.phone ? String(relPoster.phone).trim() : "";
        const relPosterLinks = relPoster && Array.isArray(relPoster.profile_links)
          ? relPoster.profile_links.filter(Boolean).map((v) => String(v))
          : [];
        const directPosterName = normalizePosterDisplayName(String(
          job.poster_name || job.posted_by_name || job.company_name || job.employer_name || ""
        ).trim(), "");
        const postedById = job.posted_by ? String(job.posted_by) : "";
        return {
          applicationId: row.id,
          jobId: job.id,
          postedBy: job.posted_by ? String(job.posted_by) : "",
          title: job.title || "Job",
          company: relPosterName || directPosterName || posterNameById.get(String(job.posted_by || "")) || "Employer",
          posterName: relPosterName || directPosterName || posterNameById.get(String(job.posted_by || "")) || "Employer",
          posterPhone: relPosterPhone || "",
          posterEmail: postedById ? posterEmailById.get(postedById) || "" : "",
          posterProfileLinks: relPosterLinks,
          location: (locRow && (locRow.full_text || locRow.city || locRow.province || locRow.country)) || "—",
          postedAgo: toRelativePostedAgo(job.posted_at),
          schedule: resolveDropdownLabel("schedule", job.schedule_code, job.schedule_code || "—"),
          typeLabel: resolveDropdownLabel("job_category", job.category_code, job.category_code || "Job"),
          settingsLabel: resolveDropdownLabel("work_setting", job.setting_code, job.setting_code || "On-Site"),
          salary: rateAmount != null ? `${rateCurrency} ${rateAmount} / ${rateUnit}` : "—",
          skills,
          description: job.description || "",
          appliedAt: row.applied_at,
          status: row.status || "pending",
          listingOpen: job.listing_open !== false,
          image: job.image_url || ""
        };
      })
      .filter(Boolean);
  }

  async function hasApplied(jobId) {
    const supa = getClient();
    if (!supa) return false;
    const user = await requireUser();
    const { data, error } = await supa
      .from("job_application")
      .select("id,status")
      .eq("applicant_id", user.id)
      .eq("job_id", String(jobId))
      .in("status", ["pending", "accepted"])
      .maybeSingle();
    if (error) throw new Error(formatDebugError(error, "Unable to check application."));
    return !!data;
  }

  async function applyToJob(jobId) {
    const supa = getClient();
    if (!supa) return false;
    const user = await requireUser();
    // Upsert to make this idempotent; prevent duplicate applications
    const { error } = await supa.from("job_application").upsert({
      job_id: String(jobId),
      applicant_id: user.id,
      status: "pending"
    }, { onConflict: "applicant_id,job_id" });
    // Ignore duplicate/constraint errors as it means already applied
    if (error && !String(error.message || "").includes("duplicate")) {
      throw new Error(formatDebugError(error, "Unable to apply to job."));
    }

    // Send notification to recruiter about new application
    try {
      const { data: job, error: jobErr } = await supa
        .from("job_post")
        .select("id,title,posted_by")
        .eq("id", String(jobId))
        .maybeSingle();
      if (!jobErr && job && job.posted_by) {
        let applicantName = "";
        try {
          const { data: applicantProfile } = await supa
            .from("user_profile")
            .select("last_name,first_name,middle_name,suffix")
            .eq("user_id", user.id)
            .maybeSingle();
          if (applicantProfile) {
            const lastName = applicantProfile.last_name || "";
            const firstName = applicantProfile.first_name || "";
            const middleName = applicantProfile.middle_name || "";
            const suffix = applicantProfile.suffix || "";
            
            // Format name with middle name initial and hover tooltip
            let formattedName = "";
            if (lastName) {
              formattedName = `${lastName} ${firstName}`;
              if (middleName) {
                const middleInitial = middleName.charAt(0).toUpperCase();
                formattedName += ` <span class="middle-initial" title="${middleName}">${middleInitial}.</span>`;
              }
              if (suffix) {
                formattedName += ` ${suffix}`;
              }
            } else {
              formattedName = firstName;
              if (middleName) {
                const middleInitial = middleName.charAt(0).toUpperCase();
                formattedName += ` <span class="middle-initial" title="${middleName}">${middleInitial}.</span>`;
              }
              if (suffix) {
                formattedName += ` ${suffix}`;
              }
            }
            applicantName = formattedName;
          }
        } catch (e) {}
        if (!applicantName) {
          try {
            const profileRaw = localStorage.getItem("profileData");
            if (profileRaw) {
              const p = JSON.parse(profileRaw);
              // Use new column structure from localStorage
              const lastName = p.lastName || "";
              const firstName = p.firstName || "";
              const middleName = p.middleName || "";
              const suffix = p.suffix || "";
              
              let formattedName = "";
              if (lastName) {
                formattedName = `${lastName} ${firstName}`;
                if (middleName) {
                  const middleInitial = middleName.charAt(0).toUpperCase();
                  formattedName += ` <span class="middle-initial" title="${middleName}">${middleInitial}.</span>`;
                }
                if (suffix) {
                  formattedName += ` ${suffix}`;
                }
              } else {
                formattedName = firstName;
                if (middleName) {
                  const middleInitial = middleName.charAt(0).toUpperCase();
                  formattedName += ` <span class="middle-initial" title="${middleName}">${middleInitial}.</span>`;
                }
                if (suffix) {
                  formattedName += ` ${suffix}`;
                }
              }
              applicantName = formattedName || "Applicant";
            }
          } catch (e) {}
        }

        // Create plain text version of applicant name for notifications
        const plainTextApplicantName = applicantName ? applicantName.replace(/<[^>]*>/g, '') : "Applicant";
        
        await createNotification(job.posted_by, "application_received", {
          job_title: job.title || "Untitled Job",
          applicant_name: plainTextApplicantName
        });
      }
    } catch (notifyErr) {
      console.warn("Failed to send application notification:", notifyErr);
    }

    return true;
  }

  async function withdrawApplication(jobId) {
    const supa = getClient();
    if (!supa) return false;
    const user = await requireUser();
    const { error } = await supa
      .from("job_application")
      .delete()
      .eq("applicant_id", user.id)
      .eq("job_id", String(jobId));
    if (error) throw new Error(formatDebugError(error, "Unable to cancel application."));
    return true;
  }

  async function updateApplicationStatus(jobId, applicantId, status) {
    const supa = getClient();
    if (!supa) return false;
    const owner = await requireUser();
    const jobRef = String(jobId || "").trim();
    const applicantRef = String(applicantId || "").trim();
    const requestedStatus = String(status || "").trim().toLowerCase();
    const nextStatus = requestedStatus === "terminated" ? "rejected" : requestedStatus;
    if (!jobRef || !applicantRef) return false;
    if (nextStatus !== "accepted" && nextStatus !== "rejected" && nextStatus !== "pending") return false;

    const { data: jobRow, error: jobErr } = await supa
      .from("job_post")
      .select("id,title,posted_by")
      .eq("id", jobRef)
      .maybeSingle();
    if (jobErr) throw new Error(formatDebugError(jobErr, "Unable to verify job ownership."));
    if (!jobRow || String(jobRow.posted_by) !== String(owner.id)) {
      throw new Error("Only the job owner can change application status.");
    }

    const { error: updateErr } = await supa
      .from("job_application")
      .update({ status: nextStatus })
      .eq("job_id", jobRef)
      .eq("applicant_id", applicantRef);
    if (updateErr) throw new Error(formatDebugError(updateErr, "Unable to update application status."));

    // Send notification to applicant about status change
    try {
      const statusToTemplate = {
        accepted: "application_accepted",
        rejected: "application_rejected",
        terminated: "application_terminated"
      };
      const templateCode = statusToTemplate[requestedStatus] || statusToTemplate[nextStatus];
      if (templateCode) {
        const sent = await createNotification(applicantRef, templateCode, {
          job_title: jobRow.title || "Untitled Job"
        });
        if (!sent && templateCode === "application_terminated") {
          await createNotification(applicantRef, "application_rejected", {
            job_title: jobRow.title || "Untitled Job"
          });
        }
      }
    } catch (notifyErr) {
      console.warn("Failed to send status change notification:", notifyErr);
    }

    return true;
  }

  async function listApplicantsForJob(jobId) {
    const supa = getClient();
    if (!supa) return [];
    const user = await requireUser();
    const jobRef = String(jobId || "").trim();
    if (!jobRef) return [];

    const { data: jobRow, error: jobErr } = await supa
      .from("job_post")
      .select("id,posted_by")
      .eq("id", jobRef)
      .maybeSingle();
    if (jobErr) throw new Error(formatDebugError(jobErr, "Unable to verify job ownership."));
    if (!jobRow || String(jobRow.posted_by) !== String(user.id)) return [];

    // Check if current user is admin
    let isAdmin = false;
    try {
      const { data: currentUser } = await supa
        .from("app_user")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = currentUser && currentUser.role === "admin";
    } catch (e) {
      // If check fails, assume not admin
    }

    // Build query - exclude hidden applications unless user is admin
    let query = supa
      .from("job_application")
      .select("id,applicant_id,status,applied_at")
      .eq("job_id", jobRef);
    
    // Only filter hidden applications for non-admin users (when columns exist)
    // Temporarily disabled until is_hidden column is added to database
    // if (!isAdmin) {
    //   query = query.eq("is_hidden", false);
    // }
    
    const { data: apps, error: appErr } = await query.order("applied_at", { ascending: false });
    if (appErr) throw new Error(formatDebugError(appErr, "Unable to load job applicants."));
    const rows = Array.isArray(apps) ? apps : [];
    if (!rows.length) return [];

    const applicantIds = Array.from(
      new Set(
        rows
          .map((r) => (r && r.applicant_id != null ? String(r.applicant_id) : ""))
          .filter(Boolean)
      )
    );

    const { data: appUsers, error: usersErr } = await supa
      .from("app_user")
      .select("id,email")
      .in("id", applicantIds);
    if (usersErr) console.warn("Could not load applicant accounts (RLS?):", usersErr.message);

    const { data: profiles, error: profileErr } = await supa
      .from("user_profile")
      .select("*")
      .in("user_id", applicantIds);
    if (profileErr) console.warn("Could not load applicant profiles (RLS?):", profileErr.message);

    const emailById = new Map(
      (Array.isArray(appUsers) ? appUsers : []).map((u) => [String(u.id), String(u.email || "")])
    );
    const profileById = new Map(
      (Array.isArray(profiles) ? profiles : []).map((p) => [String(p.user_id), p || {}])
    );

    function fallbackNameFromEmail(email) {
      const local = String(email || "").split("@")[0] || "";
      if (!local) return "Applicant";
      return local
        .replace(/[_\-.]+/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }

    function toObj(v) {
      if (!v) return {};
      if (typeof v === "object") return v;
      try {
        const parsed = JSON.parse(String(v));
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        return {};
      }
    }

    function toArr(v) {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      try {
        const parsed = JSON.parse(String(v));
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    function pickString(profile, keys) {
      for (let i = 0; i < keys.length; i += 1) {
        const val = profile[keys[i]];
        if (val != null && String(val).trim() !== "") return String(val);
      }
      return "";
    }

    function formatApplicantName(profile) {
      const p = profile && typeof profile === "object" ? profile : {};
      const lastName = p.last_name || "";
      const firstName = p.first_name || "";
      const middleName = p.middle_name || "";
      const suffix = p.suffix || "";
      
      // Format name with middle name initial and hover tooltip
      let formattedName = "";
      if (lastName) {
        formattedName = `${lastName} ${firstName}`;
        if (middleName) {
          const middleInitial = middleName.charAt(0).toUpperCase();
          formattedName += ` <span class="middle-initial" title="${middleName}">${middleInitial}.</span>`;
        }
        if (suffix) {
          formattedName += ` ${suffix}`;
        }
      } else {
        formattedName = firstName;
        if (middleName) {
          const middleInitial = middleName.charAt(0).toUpperCase();
          formattedName += ` <span class="middle-initial" title="${middleName}">${middleInitial}.</span>`;
        }
        if (suffix) {
          formattedName += ` ${suffix}`;
        }
      }
      return formattedName || null;
    }

    function mapResumeProfile(profile, fallbackName) {
      const p = profile && typeof profile === "object" ? profile : {};
      
      // Check if profile is archived and return anonymized data
      if (p.account_status === 'archived') {
        console.log('Archived applicant profile detected - returning anonymized data');
        return {
          name: "Deleted User",
          phone: null,
          address: null,
          description: "This account has been deleted.",
          educationStatus: null,
          birthDate: null,
          sex: null,
          workExperiences: [],
          educationBackgrounds: [],
          skills: [],
          languages: [],
          personality: [],
          profileLinks: [],
          avatarUrl: "",
          id_url: "",
          cert_url: "",
          id_status: "archived",
          cert_status: "archived"
        };
      }
      
      // Debug valid document fields
      console.log('DEBUG mapResumeProfile - id_url:', p.id_url);
      console.log('DEBUG mapResumeProfile - cert_url:', p.cert_url);
      console.log('DEBUG mapResumeProfile - id_status:', p.id_status);
      console.log('DEBUG mapResumeProfile - cert_status:', p.cert_status);
      
      const addressFromFlat = {
        unitNo: pickString(p, ["unit_no", "address_unit", "unit"]),
        street: pickString(p, ["street", "address_street"]),
        barangay: pickString(p, ["barangay", "address_barangay"]),
        city: pickString(p, ["city", "address_city"]),
        province: pickString(p, ["province", "address_province"]),
        country: pickString(p, ["country", "address_country"]),
        zip: pickString(p, ["zip", "zip_code", "postal_code"])
      };
      const hasFlatAddr = Object.values(addressFromFlat).some((x) => String(x || "").trim() !== "");
      const profileAddress = toObj(p.address);
      return {
        name: formatApplicantName(p) || fallbackName || "Applicant",
        phone: pickString(p, ["phone", "contact_no", "mobile"]),
        address: hasFlatAddr ? addressFromFlat : profileAddress,
        description: pickString(p, ["description", "bio", "summary"]),
        educationStatus: pickString(p, ["education_status"]),
        birthDate: pickString(p, ["birth_date", "birthdate"]),
        sex: pickString(p, ["sex"]),
        workExperiences: toArr(p.work_experiences || p.workExperiences),
        educationBackgrounds: toArr(p.education_backgrounds || p.educationBackgrounds),
        skills: toArr(p.skills),
        languages: toArr(p.languages),
        personality: toArr(p.personality),
        profileLinks: toArr(p.profile_links || p.profileLinks),
        avatarUrl: p.avatar_url || "",
        validId: p.id_url ? { url: p.id_url, type: 'ID', status: p.id_status || 'unknown' } : null,
        validCert: p.cert_url ? { url: p.cert_url, type: 'Certificate', status: p.cert_status || 'unknown' } : null,
        id_url: p.id_status === 'verified' ? (p.id_url || "") : "",
        cert_url: p.cert_status === 'verified' ? (p.cert_url || "") : "",
        id_status: p.id_status || "pending",
        cert_status: p.cert_status || "pending"
      };
    }

    return rows.map((r) => {
      const applicantId = String(r.applicant_id || "");
      const email = emailById.get(applicantId) || "";
      const profile = profileById.get(applicantId) || {};
      const fullName = formatApplicantName(profile) || fallbackNameFromEmail(email);
      return {
        id: r.id,
        applicantId,
        name: fullName || "Applicant",
        email: email || "",
        appliedAt: r.applied_at || "",
        applicationStatus: r.status || "pending",
        resumeProfile: mapResumeProfile(profile, fullName || fallbackNameFromEmail(email))
      };
    });
  }

  // -------------------------------
  // ADMIN: LIST ALL USERS
  // -------------------------------
  async function listAllUsers() {
    const supa = getClient();
    if (!supa) return [];
    
    // Verify current user is admin
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can list all users.");
    }

    // Fetch all app users
    const { data: appUsers, error: usersErr } = await supa
      .from("app_user")
      .select("id,email,role,is_active,created_at,updated_at,account_status")
      .order("created_at", { ascending: false });
    
    if (usersErr) throw new Error(formatDebugError(usersErr, "Unable to load users."));
    
    const userIds = (appUsers || []).map((u) => u.id);
    
    // Fetch profiles for these users
    const { data: profiles, error: profilesErr } = await supa
      .from("user_profile")
      .select("*")
      .in("user_id", userIds);
    
    if (profilesErr) console.warn("Could not load profiles:", profilesErr.message);
    
    const profileById = new Map(
      (Array.isArray(profiles) ? profiles : []).map((p) => [String(p.user_id), p || {}])
    );
    
    // Count applications per user
    const { data: applications, error: appsErr } = await supa
      .from("job_application")
      .select("applicant_id", { count: "exact" })
      .in("applicant_id", userIds);
    
    if (appsErr) console.warn("Could not load applications:", appsErr.message);
    
    const applicationCountByUser = {};
    (applications || []).forEach((app) => {
      const id = String(app.applicant_id);
      applicationCountByUser[id] = (applicationCountByUser[id] || 0) + 1;
    });
    
    // Count posted jobs per user
    const { data: postedJobs, error: jobsErr } = await supa
      .from("job_post")
      .select("posted_by", { count: "exact" })
      .in("posted_by", userIds);
    
    if (jobsErr) console.warn("Could not load posted jobs:", jobsErr.message);
    
    const jobCountByUser = {};
    (postedJobs || []).forEach((job) => {
      const id = String(job.posted_by);
      jobCountByUser[id] = (jobCountByUser[id] || 0) + 1;
    });
    
    return (appUsers || []).map((u) => {
      const rawProfile = profileById.get(u.id) || {};
      // Map snake_case DB fields to camelCase for UI consistency
      const profile = {
        ...rawProfile,
        name: rawProfile.full_name || rawProfile.name || u.email.split("@")[0],
        phone: rawProfile.phone || "",
        address: rawProfile.address || {},
        birthDate: rawProfile.birth_date || "",
        sex: rawProfile.sex || "",
        educationStatus: rawProfile.education_status || rawProfile.education_status_other_text || "",
        education_status_code: rawProfile.education_status_code || "",
        education_status_other_text: rawProfile.education_status_other_text || "",
        description: rawProfile.description || rawProfile.bio || "",
        profileLinks: rawProfile.profile_links || [],
        languages: rawProfile.languages || [],
        personality: rawProfile.personality || [],
        skills: rawProfile.skills || [],
        workExperiences: rawProfile.work_experiences || [],
        educationBackgrounds: rawProfile.education_backgrounds || [],
        imageUrl: rawProfile.avatar_url || rawProfile.profile_image_url || rawProfile.image_url || rawProfile.image || "",
        avatar_url: rawProfile.avatar_url || "",
        id_url: rawProfile.id_url || "",
        cert_url: rawProfile.cert_url || "",
        id_status: rawProfile.id_status || "pending",
        cert_status: rawProfile.cert_status || "pending"
      };
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        account_status: u.account_status || 'active',
        name: profile.name,
        phone: profile.phone,
        jobsApplied: applicationCountByUser[u.id] || 0,
        jobsPosted: jobCountByUser[u.id] || 0,
        profile: profile
      };
    });
  }

  // -------------------------------
  // ADMIN: UPDATE JOB
  // -------------------------------
  async function adminUpdateJob(jobId, updates) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    // Verify admin
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (roleErr || !currentAppUser || String(currentAppUser.role || "").toLowerCase() !== "admin") {
      throw new Error("Only admins can update jobs.");
    }
    
    const { error } = await supa
      .from("job_post")
      .update(updates)
      .eq("id", jobId);
    
    if (error) throw new Error(formatDebugError(error, "Unable to update job."));
    return true;
  }

  async function adminUpdateJobLocation(jobId, locationUpdates) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");

    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (roleErr || !currentAppUser || String(currentAppUser.role || "").toLowerCase() !== "admin") {
      throw new Error("Only admins can update job location.");
    }

    const fullText = [
      locationUpdates && locationUpdates.street,
      locationUpdates && locationUpdates.barangay,
      locationUpdates && locationUpdates.city,
      locationUpdates && locationUpdates.province,
      locationUpdates && locationUpdates.country
    ]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(", ");

    const row = {
      job_id: String(jobId),
      full_text: fullText,
      street: locationUpdates && locationUpdates.street ? String(locationUpdates.street) : null,
      barangay: locationUpdates && locationUpdates.barangay ? String(locationUpdates.barangay) : null,
      city: locationUpdates && locationUpdates.city ? String(locationUpdates.city) : null,
      province: locationUpdates && locationUpdates.province ? String(locationUpdates.province) : null,
      country: locationUpdates && locationUpdates.country ? String(locationUpdates.country) : "Philippines"
    };

    const { error } = await supa.from("job_location").upsert(row);
    if (error) throw new Error(formatDebugError(error, "Unable to update job location."));
    return true;
  }

  async function adminUpdateJobRate(jobId, rateUpdates) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");

    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (roleErr || !currentAppUser || String(currentAppUser.role || "").toLowerCase() !== "admin") {
      throw new Error("Only admins can update job rate.");
    }

    const row = {
      job_id: String(jobId),
      amount: Number(rateUpdates && rateUpdates.amount != null ? rateUpdates.amount : 0) || 0,
      currency_code: String((rateUpdates && rateUpdates.currency_code) || "PHP"),
      unit_code: String((rateUpdates && rateUpdates.unit_code) || "hour")
    };

    const { error } = await supa.from("job_rate").upsert(row);
    if (error) throw new Error(formatDebugError(error, "Unable to update job rate."));
    return true;
  }

  async function adminUpdateJobSkills(jobId, skills) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");

    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (roleErr || !currentAppUser || String(currentAppUser.role || "").toLowerCase() !== "admin") {
      throw new Error("Only admins can update job skills.");
    }

    const jobRef = String(jobId || "").trim();
    if (!jobRef) return false;

    await supa.from("job_skill").delete().eq("job_id", jobRef);
    const nextSkills = Array.isArray(skills)
      ? skills.map((s) => String(s || "").trim()).filter(Boolean)
      : [];
    if (!nextSkills.length) return true;

    const rows = nextSkills.map((skill) => ({ job_id: jobRef, skill_name: skill }));
    const { error } = await supa.from("job_skill").insert(rows);
    if (error) throw new Error(formatDebugError(error, "Unable to update job skills."));
    return true;
  }

  // -------------------------------
  // ADMIN: UPDATE USER PROFILE
  // -------------------------------
  async function adminUpdateUserProfile(userId, profileUpdates) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    // Verify admin
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can update user profiles.");
    }
    
    // Map camelCase updates to snake_case
    const mapped = {};
    if (profileUpdates.full_name !== undefined) mapped.full_name = profileUpdates.full_name;
    if (profileUpdates.first_name !== undefined) mapped.first_name = profileUpdates.first_name;
    if (profileUpdates.last_name !== undefined) mapped.last_name = profileUpdates.last_name;
    if (profileUpdates.middle_name !== undefined) mapped.middle_name = profileUpdates.middle_name;
    if (profileUpdates.suffix !== undefined) mapped.suffix = profileUpdates.suffix;
    if (profileUpdates.phone !== undefined) mapped.phone = profileUpdates.phone;
    if (profileUpdates.bio !== undefined) mapped.bio = profileUpdates.bio;
    if (profileUpdates.description !== undefined) mapped.description = profileUpdates.description;
    if (profileUpdates.birth_date !== undefined) mapped.birth_date = profileUpdates.birth_date;
    if (profileUpdates.sex !== undefined) mapped.sex = profileUpdates.sex;
    if (profileUpdates.education_status_code !== undefined) mapped.education_status_code = profileUpdates.education_status_code;
    if (profileUpdates.education_status_other_text !== undefined) mapped.education_status_other_text = profileUpdates.education_status_other_text;
    if (profileUpdates.avatar_url !== undefined) mapped.avatar_url = profileUpdates.avatar_url;
    if (profileUpdates.address !== undefined) mapped.address = profileUpdates.address;
    if (profileUpdates.profile_links !== undefined) mapped.profile_links = profileUpdates.profile_links;
    if (profileUpdates.languages !== undefined) mapped.languages = profileUpdates.languages;
    if (profileUpdates.skills !== undefined) mapped.skills = profileUpdates.skills;
    if (profileUpdates.personality !== undefined) mapped.personality = profileUpdates.personality;
    if (profileUpdates.work_experiences !== undefined) mapped.work_experiences = profileUpdates.work_experiences;
    if (profileUpdates.education_backgrounds !== undefined) mapped.education_backgrounds = profileUpdates.education_backgrounds;
    
    if (Object.keys(mapped).length === 0) return true;
    
    const { error } = await supa
      .from("user_profile")
      .update(mapped)
      .eq("user_id", userId);
    
    if (error) throw new Error(formatDebugError(error, "Unable to update user profile."));
    return true;
  }

  // -------------------------------
  // ADMIN: UPDATE USER EMAIL (via auth admin)
  // -------------------------------
  async function adminUpdateUserEmail(userId, newEmail) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    // Verify admin
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can update user emails.");
    }
    
    // Update email in auth.users via RPC (requires admin function in Supabase)
    const { error } = await supa.rpc("admin_update_user_email", {
      target_user_id: userId,
      new_email: newEmail
    });
    
    if (error) {
      // Fallback: update app_user email only
      const { error: appError } = await supa
        .from("app_user")
        .update({ email: newEmail })
        .eq("id", userId);
      if (appError) throw new Error(formatDebugError(appError, "Unable to update user email."));
    }
    
    return true;
  }

  // -------------------------------
  // ADMIN: UPDATE USER PASSWORD (via auth admin)
  // -------------------------------
  async function adminUpdateUserPassword(userId, newPassword) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    // Verify admin
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can update user passwords.");
    }
    
    // Update password via RPC (requires admin function in Supabase)
    const { error } = await supa.rpc("admin_update_user_password", {
      target_user_id: userId,
      new_password: newPassword
    });
    
    if (error) throw new Error(formatDebugError(error, "Unable to update user password. Use Supabase Dashboard to reset password."));
    return true;
  }

  // -------------------------------
  // NOTIFICATIONS (notification)
  // -------------------------------
  async function listNotifications() {
    const supa = getClient();
    if (!supa) return [];
    const user = await requireUser();
    const { data, error } = await supa
      .from("notification")
      .select("id,title,body,created_at,read_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(formatDebugError(error, "Unable to load notifications."));
    return (data || []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.created_at,
      readAt: n.read_at
    }));
  }

  async function countUnreadNotifications() {
    const supa = getClient();
    if (!supa) return 0;
    const user = await requireUser();
    const { count, error } = await supa
      .from("notification")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) {
      console.warn("Failed to count unread notifications:", error);
      return 0;
    }
    return count || 0;
  }

  async function markNotificationAsRead(notificationId) {
    const supa = getClient();
    if (!supa || !notificationId) return false;
    const user = await requireUser();
    const { error } = await supa
      .from("notification")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);
    if (error) {
      console.warn("Failed to mark notification as read:", error);
      return false;
    }
    return true;
  }

  async function deleteNotification(notificationId) {
    const supa = getClient();
    if (!supa || !notificationId) return false;
    const user = await requireUser();
    const { error } = await supa
      .from("notification")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);
    if (error) {
      console.warn("Failed to delete notification:", error);
      return false;
    }
    return true;
  }

  /**
   * Create a notification for a user based on a template.
   * @param {string} targetUserId - The user ID to notify
   * @param {string} templateCode - The notification template code (e.g., 'application_received')
   * @param {Object} payload - Data to substitute in template placeholders like {{job_title}}
   */
  async function createNotification(targetUserId, templateCode, payload = {}) {
    const supa = getClient();
    if (!supa || !targetUserId || !templateCode) return false;

    // Get the template
    const { data: template, error: templateErr } = await supa
      .from("notification_template")
      .select("code,title_template,body_template,is_active")
      .eq("code", templateCode)
      .eq("is_active", true)
      .maybeSingle();

    if (templateErr || !template) {
      console.warn("Notification template not found or inactive:", templateCode);
      const fallbackTitleByCode = {
        application_received: "New application received",
        application_accepted: "Application accepted",
        application_rejected: "Application rejected",
        application_terminated: "Application terminated",
        job_bookmarked: "Job bookmarked",
        job_archived: "Job archived",
        account_banned: "Account banned"
      };
      const fallbackBodyByCode = {
        application_received: `Someone applied to your job: ${payload.job_title || "Untitled Job"}`,
        application_accepted: `Your application was accepted for: ${payload.job_title || "Untitled Job"}`,
        application_rejected: `Your application was rejected for: ${payload.job_title || "Untitled Job"}`,
        application_terminated: `Your accepted application was terminated for: ${payload.job_title || "Untitled Job"}`,
        job_bookmarked: `You bookmarked: ${payload.job_title || "Untitled Job"}`,
        job_archived: `Your job "${payload.job_title || "Untitled Job"}" has been archived by an admin. Reason: ${payload.reason || "Violation of community guidelines"}`,
        account_banned: `Your account has been banned. Reason: ${payload.reason || "Violation of community guidelines"}`
      };
      const { error: fallbackInsertErr } = await supa.from("notification").insert({
        user_id: targetUserId,
        template_code: null,
        title: fallbackTitleByCode[templateCode] || "Notification",
        body: fallbackBodyByCode[templateCode] || "You have a new notification.",
        payload: payload
      });
      if (fallbackInsertErr) {
        console.warn("Fallback notification insert failed:", fallbackInsertErr);
        return false;
      }
      return true;
    }

    // Replace placeholders in templates
    function replacePlaceholders(text, data) {
      const raw = String(text || "");
      // Support both {{key}} and {key}
      const withDouble = raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
      });
      return withDouble.replace(/\{\s*(\w+)\s*\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
      });
    }

    const nowIso = new Date().toISOString();
    const nowDisplay = new Date(nowIso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    const payloadWithDefaults = Object.assign(
      {
        date: nowDisplay,
        created_at: nowIso,
        delivered_at: nowDisplay,
        delivered_date: nowDisplay
      },
      payload || {}
    );

    const title = replacePlaceholders(template.title_template || "", payloadWithDefaults);
    const body = replacePlaceholders(template.body_template || "", payloadWithDefaults);

    // Insert the notification
    const { error: insertErr } = await supa.from("notification").insert({
      user_id: targetUserId,
      template_code: templateCode,
      title: title,
      body: body,
      payload: payloadWithDefaults
    });

    if (insertErr) {
      console.error("Failed to create notification:", insertErr);
      return false;
    }

    return true;
  }

  async function savePostedJobs(jobs) {
    const supa = getClient();
    if (!supa) return false;
    await ensureDropdownOptionCache(supa);
    const auth = await supa.auth.getUser();
    const signedUser = auth && auth.data ? auth.data.user : null;
    if (!signedUser) return false;
    let roleValue = "seeker";
    if (typeof sessionStorage !== "undefined") {
      roleValue = String(sessionStorage.getItem("rjgUserRole") || "").toLowerCase();
    }
    if (!roleValue && typeof localStorage !== "undefined") {
      roleValue = String(localStorage.getItem("rjgUserRole") || "").toLowerCase();
    }
    if (!roleValue) roleValue = "seeker";
    const { error: appUserErr } = await supa.from("app_user").upsert(
      {
        id: signedUser.id,
        email: signedUser.email || "",
        role: roleValue || "seeker",
        is_active: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );
    if (appUserErr) throw new Error(formatDebugError(appUserErr, "Unable to initialize app user row."));
    let fallbackProfileName = "";
    try {
      const profileRaw = localStorage.getItem("profileData");
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        fallbackProfileName = String((p && (p.name || p.full_name)) || "").trim();
      }
    } catch (e) {
      fallbackProfileName = "";
    }
    if (!fallbackProfileName) {
      try {
        const accRaw = localStorage.getItem("accountData");
        if (accRaw) {
          const acc = JSON.parse(accRaw);
          const emailLocal = String((acc && acc.email) || signedUser.email || "")
            .split("@")[0]
            .trim();
          fallbackProfileName = emailLocal
            ? emailLocal
                .replace(/[_\-.]+/g, " ")
                .split(/\s+/)
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join(" ")
            : "";
        }
      } catch (e2) {
        fallbackProfileName = "";
      }
    }
    // Update user_profile with new name structure (first_name, last_name, middle_name, suffix)
    if (fallbackProfileName) {
      const { error: profileNameErr } = await supa.from("user_profile").upsert(
        {
          user_id: signedUser.id,
          first_name: fallbackProfileName, // For recruiters, this stores company name
          last_name: null, // Recruiters don't have last_name
          middle_name: null,
          suffix: null
        },
        { onConflict: "user_id" }
      );
      if (profileNameErr) throw new Error(formatDebugError(profileNameErr, "Unable to initialize poster profile name."));
    }
    upsertPosterNameCache(
      signedUser.id,
      fallbackProfileName ||
        String(
          (signedUser.user_metadata && (signedUser.user_metadata.full_name || signedUser.user_metadata.name)) || signedUser.email || ""
        ).trim()
    );
    const list = Array.isArray(jobs) ? jobs : [];
    const incomingIds = new Set();
    for (let i = 0; i < list.length; i += 1) {
      const job = list[i] || {};
      const rawId = job.id && String(job.id).trim() ? String(job.id).trim() : "";
      const jobId = isUuid(rawId) ? rawId : genRandomId();
      if (!isUuid(rawId)) {
        job.id = jobId;
      }
      incomingIds.add(jobId);
      const rawCategory = String(job.category || "");
      const rawSchedule = String(job.schedule || "");
      const rawSetting = String(job.type || "");
      const rawCurrency = parseRateCurrency(job.rate);
      const rawRateUnit = String(job.rateUnit || parseRateUnit(job.rate) || "Hour");
      const categoryCode = resolveDropdownCode("job_category", rawCategory, "job");
      const scheduleCode = resolveDropdownCode("schedule", rawSchedule, "full_time");
      const settingCode = resolveDropdownCode("work_setting", rawSetting, "on_site");
      const currencyCode = resolveDropdownCode("currency", rawCurrency, "PHP");
      const rateUnitCode = resolveDropdownCode("rate_unit", rawRateUnit, "hour");
      const imageUrlValue = String(job.image || job.imageUrl || "");
      console.log("[savePostedJobs] Job:", jobId, "image value:", imageUrlValue ? imageUrlValue.substring(0, 80) + "..." : "EMPTY", "raw image:", job.image, "raw imageUrl:", job.imageUrl);
      const base = {
        id: jobId,
        posted_by: signedUser.id,
        title: String(job.title || "Untitled Job"),
        category_code: categoryCode,
        category_other_text:
          isOtherCode("job_category", categoryCode) && normalizeDropdownToken(rawCategory) !== "other"
            ? rawCategory
            : null,
        schedule_code: scheduleCode,
        schedule_other_text:
          isOtherCode("schedule", scheduleCode) && normalizeDropdownToken(rawSchedule) !== "other"
            ? rawSchedule
            : null,
        setting_code: settingCode,
        setting_other_text:
          isOtherCode("work_setting", settingCode) && normalizeDropdownToken(rawSetting) !== "other"
            ? rawSetting
            : null,
        description: String(job.description || ""),
        is_urgent: !!job.urgent,
        listing_open: job.listingOpen !== false,
        image_url: imageUrlValue
      };
      const { error: postErr } = await supa.from("job_post").upsert(base);
      if (postErr) throw new Error(formatDebugError(postErr, "Unable to save job post."));

      const { error: locErr } = await supa.from("job_location").upsert({
        job_id: jobId,
        full_text: String(job.location || "")
      });
      if (locErr) throw new Error(formatDebugError(locErr, "Unable to save job location."));

      const { error: rateErr } = await supa.from("job_rate").upsert({
        job_id: jobId,
        amount: parseRateAmount(job.rate),
        currency_code: currencyCode,
        currency_other_text:
          isOtherCode("currency", currencyCode) && normalizeDropdownToken(rawCurrency) !== "other"
            ? rawCurrency
            : null,
        unit_code: rateUnitCode,
        unit_other_text:
          isOtherCode("rate_unit", rateUnitCode) && normalizeDropdownToken(rawRateUnit) !== "other"
            ? rawRateUnit
            : null
      });
      if (rateErr) throw new Error(formatDebugError(rateErr, "Unable to save job rate."));

      const skills = Array.isArray(job.skills) ? job.skills.filter(Boolean) : [];
      await supa.from("job_skill").delete().eq("job_id", jobId);
      if (skills.length > 0) {
        const rows = skills.map((skill) => ({ job_id: jobId, skill_name: String(skill) }));
        const { error: skillsErr } = await supa.from("job_skill").insert(rows);
        if (skillsErr) throw new Error(formatDebugError(skillsErr, "Unable to save job skills."));
      }
    }
    const { data: existingRows, error: existingErr } = await supa
      .from("job_post")
      .select("id")
      .eq("posted_by", signedUser.id);
    if (existingErr) throw new Error(formatDebugError(existingErr, "Unable to load existing posted jobs."));
    const existingIds = Array.isArray(existingRows) ? existingRows.map((r) => String(r.id)) : [];
    const deleteIds = existingIds.filter((id) => !incomingIds.has(String(id)));
    if (deleteIds.length > 0) {
      const { error: delErr } = await supa
        .from("job_post")
        .delete()
        .in("id", deleteIds)
        .eq("posted_by", signedUser.id);
      if (delErr) throw new Error(formatDebugError(delErr, "Unable to remove deleted job posts."));
    }
    return true;
  }

  function parseRateAmount(rateText) {
    const raw = String(rateText || "");
    const m = raw.match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? Number(m[1]) : 1;
  }

  function parseRateCurrency(rateText) {
    const raw = String(rateText || "").trim();
    const m = raw.match(/^([A-Za-z]{3})\s+/);
    return m ? m[1].toUpperCase() : "PHP";
  }

  function parseRateUnit(rateText) {
    const raw = String(rateText || "");
    const m = raw.match(/\/\s*([A-Za-z]+)/);
    return m ? m[1] : "Hour";
  }

  function genRandomId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    // UUID v4 fallback for environments without crypto.randomUUID.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async function uploadJobImage(file, jobId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) throw new Error("Not signed in.");
    const ext = String(file.name || "").split(".").pop().toLowerCase() || "jpg";
    // Use recruiter's user ID as directory, similar to profile images
    const path = `${user.id}/${genRandomId()}.${ext}`;
    console.log("[uploadJobImage] Uploading to path:", path, "file type:", file.type, "size:", file.size);
    const { error: uploadErr } = await supa.storage
      .from("job-images")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (uploadErr) {
      console.error("[uploadJobImage] Upload failed:", uploadErr);
      throw new Error("Image upload failed: " + uploadErr.message);
    }
    console.log("[uploadJobImage] Upload successful, getting URL...");
    // Return full URL with version parameter, like profile images
    const { data: urlData } = supa.storage.from("job-images").getPublicUrl(path);
    const timestamp = Date.now();
    return `${urlData.publicUrl}?v=${timestamp}`;
  }

  async function getJobImageUrl(imageUrlOrPath) {
    if (!imageUrlOrPath) return "";
    // If it's already a full URL with signed token, extract the path
    let path = imageUrlOrPath;
    if (String(imageUrlOrPath).startsWith("http")) {
      try {
        const url = new URL(imageUrlOrPath);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/job-images\/(.*)/);
        if (pathMatch) {
          path = pathMatch[1];
        } else {
          // If it's a different URL format, try to extract the path after the last /
          const parts = url.pathname.split('/');
          path = parts[parts.length - 1];
        }
      } catch (e) {
        // Fall back to original
        return imageUrlOrPath;
      }
    }
    // Create fresh signed URL
    const supa = getClient();
    if (!supa) return imageUrlOrPath;
    const { data, error } = await supa.storage
      .from("job-images")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!error && data && data.signedUrl) return data.signedUrl;
    // Fall back to public URL
    const { data: urlData } = supa.storage.from("job-images").getPublicUrl(path);
    return urlData && urlData.publicUrl ? urlData.publicUrl : imageUrlOrPath;
  }

  async function getProfileImageUrl(imageUrlOrPath) {
    if (!imageUrlOrPath) return "";
    // If it's already a full URL, extract the path
    let path = imageUrlOrPath;
    if (String(imageUrlOrPath).startsWith("http")) {
      try {
        const url = new URL(imageUrlOrPath);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/profile-pictures\/(.*)/);
        if (pathMatch) {
          path = pathMatch[1];
        } else {
          const parts = url.pathname.split('/');
          path = parts[parts.length - 1];
        }
      } catch (e) {
        return imageUrlOrPath;
      }
    }
    // Create fresh signed URL
    const supa = getClient();
    if (!supa) return imageUrlOrPath;
    const { data, error } = await supa.storage
      .from("profile-pictures")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!error && data && data.signedUrl) return data.signedUrl;
    const { data: urlData } = supa.storage.from("profile-pictures").getPublicUrl(path);
    return urlData && urlData.publicUrl ? urlData.publicUrl : imageUrlOrPath;
  }

  async function getIdImageUrl(imageUrlOrPath) {
    if (!imageUrlOrPath) return "";
    let path = imageUrlOrPath;
    if (String(imageUrlOrPath).startsWith("http")) {
      try {
        const url = new URL(imageUrlOrPath);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/id-image\/(.*)/);
        if (pathMatch) {
          path = pathMatch[1];
        } else {
          const parts = url.pathname.split('/');
          path = parts[parts.length - 1];
        }
      } catch (e) {
        return imageUrlOrPath;
      }
    }
    const supa = getClient();
    if (!supa) return imageUrlOrPath;
    const { data, error } = await supa.storage
      .from("id-image")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!error && data && data.signedUrl) return data.signedUrl;
    const { data: urlData } = supa.storage.from("id-image").getPublicUrl(path);
    return urlData && urlData.publicUrl ? urlData.publicUrl : imageUrlOrPath;
  }

  async function getCertImageUrl(imageUrlOrPath) {
    if (!imageUrlOrPath) return "";
    let path = imageUrlOrPath;
    if (String(imageUrlOrPath).startsWith("http")) {
      try {
        const url = new URL(imageUrlOrPath);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/cert-image\/(.*)/);
        if (pathMatch) {
          path = pathMatch[1];
        } else {
          const parts = url.pathname.split('/');
          path = parts[parts.length - 1];
        }
      } catch (e) {
        return imageUrlOrPath;
      }
    }
    const supa = getClient();
    if (!supa) return imageUrlOrPath;
    const { data, error } = await supa.storage
      .from("cert-image")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!error && data && data.signedUrl) return data.signedUrl;
    const { data: urlData } = supa.storage.from("cert-image").getPublicUrl(path);
    return urlData && urlData.publicUrl ? urlData.publicUrl : imageUrlOrPath;
  }

  async function uploadProfileImage(file) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) throw new Error("Not signed in.");
    const ext = String(file.name || "").split(".").pop().toLowerCase() || "jpg";
    const path = `${user.id}/${user.id}.${ext}`;
    const { error: uploadErr } = await supa.storage
      .from("profile-pictures")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (uploadErr) throw new Error("Profile image upload failed: " + uploadErr.message);
    // Return full URL with version parameter
    const { data: urlData } = supa.storage.from("profile-pictures").getPublicUrl(path);
    const timestamp = Date.now();
    return `${urlData.publicUrl}?v=${timestamp}`;
  }

  // Admin-specific profile picture upload for any user
  async function adminUploadProfileImage(userId, file) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    // Verify admin
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can upload profile images for other users.");
    }
    
    const ext = String(file.name || "").split(".").pop().toLowerCase() || "jpg";
    const path = `${userId}/${userId}.${ext}`;
    const { error: uploadErr } = await supa.storage
      .from("profile-pictures")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (uploadErr) throw new Error("Profile image upload failed: " + uploadErr.message);
    // Return full URL with version parameter
    const { data: urlData } = supa.storage.from("profile-pictures").getPublicUrl(path);
    const timestamp = Date.now();
    return `${urlData.publicUrl}?v=${timestamp}`;
  }

  async function uploadFile(file, bucket) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) throw new Error("Not signed in.");
    
    // Validate bucket name
    if (!bucket || (bucket !== "id-image" && bucket !== "cert-image")) {
      throw new Error("Invalid bucket name. Must be 'id-image' or 'cert-image'.");
    }
    
    // Generate unique filename
    const ext = String(file.name || "").split(".").pop().toLowerCase() || "jpg";
    const timestamp = Date.now();
    const path = `${user.id}/${timestamp}.${ext}`;
    
    // Upload to specified bucket
    const { error: uploadErr } = await supa.storage
      .from(bucket)
      .upload(path, file, { 
        upsert: true, 
        contentType: file.type || "image/jpeg" 
      });
    
    if (uploadErr) {
      console.error(`Upload to ${bucket} failed:`, uploadErr);
      throw new Error(`File upload failed: ${uploadErr.message}`);
    }
    
    // Return full URL with version parameter
    const { data: urlData } = supa.storage.from(bucket).getPublicUrl(path);
    return `${urlData.publicUrl}?v=${timestamp}`;
  }

  async function saveCurrentUserAvatarUrl(avatarUrl) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const { data: authData } = await supa.auth.getUser();
    const user = authData && authData.user ? authData.user : null;
    if (!user) throw new Error("Not signed in.");
    await ensureProfileRow();
    const { error } = await supa
      .from("user_profile")
      .update({ avatar_url: avatarUrl ? String(avatarUrl) : null })
      .eq("user_id", user.id);
    if (error) throw new Error(formatDebugError(error, "Unable to save avatar URL."));
    return true;
  }

  async function loadAllReports() {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can view reports.");
    }
    const { data: reports, error } = await supa
      .from("content_report")
      .select("id,reporter_id,target_user_id,target_type,target_job_id,reason,status,created_at,reviewed_by")
      .neq("status", "invalidated")
      .order("created_at", { ascending: false });
    if (error) throw new Error(formatDebugError(error, "Unable to load reports."));
    if (!Array.isArray(reports) || !reports.length) return [];

    // Gather unique user IDs and job IDs for enrichment
    const userIds = new Set();
    const jobIds = new Set();
    reports.forEach(r => {
      if (r.reporter_id) userIds.add(r.reporter_id);
      if (r.target_user_id) userIds.add(r.target_user_id);
      if (r.target_job_id) jobIds.add(r.target_job_id);
    });

    // Collect resume target user IDs for full profile fetch
    const resumeTargetIds = new Set();
    reports.forEach(r => {
      if (r.target_type === 'resume' && r.target_user_id) resumeTargetIds.add(r.target_user_id);
    });

    // Fetch user names
    const userMap = new Map();
    if (userIds.size) {
      const { data: profiles } = await supa
        .from("user_profile")
        .select("user_id,last_name,first_name,middle_name,suffix")
        .in("user_id", Array.from(userIds));
      if (Array.isArray(profiles)) {
        profiles.forEach(p => {
          const lastName = p.last_name || "";
          const firstName = p.first_name || "";
          const middleName = p.middle_name || "";
          const suffix = p.suffix || "";
          const nameParts = [lastName, firstName];
          if (middleName) nameParts.push(middleName);
          if (suffix) nameParts.push(suffix);
          const fullName = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
          userMap.set(p.user_id, fullName || "");
        });
      }
      // Also fetch emails from app_user
      const { data: appUsers } = await supa
        .from("app_user")
        .select("id,email")
        .in("id", Array.from(userIds));
      if (Array.isArray(appUsers)) {
        appUsers.forEach(u => {
          if (!userMap.get(u.id)) userMap.set(u.id, u.email || "");
        });
      }
    }

    // Fetch full profiles for resume report targets
    const resumeProfileMap = new Map();
    if (resumeTargetIds.size) {
      const { data: fullProfiles } = await supa
        .from("user_profile")
        .select("user_id,last_name,first_name,middle_name,suffix,phone,sex,birth_date,education_status_code,address,profile_links,languages,skills,personality,work_experiences,education_backgrounds,description,avatar_url,id_url,cert_url,id_status,cert_status")
        .in("user_id", Array.from(resumeTargetIds));
      
      console.log('DEBUG buildReportDataset - Query executed, fullProfiles:', fullProfiles);
      console.log('DEBUG buildReportDataset - First profile keys:', fullProfiles && fullProfiles[0] ? Object.keys(fullProfiles[0]) : 'No profiles');
      if (Array.isArray(fullProfiles)) {
        const emailMap = new Map();
        const { data: emails } = await supa
          .from("app_user")
          .select("id,email")
          .in("id", Array.from(resumeTargetIds));
        if (Array.isArray(emails)) emails.forEach(e => emailMap.set(e.id, e.email || ""));

        fullProfiles.forEach(p => {
          console.log('DEBUG mapResumeProfile forEach - Processing profile:', p);
          console.log('DEBUG mapResumeProfile forEach - Profile id_url:', p.id_url);
          console.log('DEBUG mapResumeProfile forEach - Profile cert_url:', p.cert_url);
          
          const lastName = p.last_name || "";
          const firstName = p.first_name || "";
          const middleName = p.middle_name || "";
          const suffix = p.suffix || "";
          const nameParts = [lastName, firstName];
          if (middleName) nameParts.push(middleName);
          if (suffix) nameParts.push(suffix);
          const fullName = lastName ? `${lastName}, ${nameParts.slice(1).join(' ')}` : nameParts.join(' ');
          resumeProfileMap.set(p.user_id, {
            name: fullName || "",
            email: emailMap.get(p.user_id) || "",
            phone: p.phone || "",
            sex: p.sex || "",
            birthDate: p.birth_date || "",
            educationStatus: p.education_status_code || "",
            address: p.address || null,
            profileLinks: p.profile_links || [],
            languages: p.languages || [],
            skills: p.skills || [],
            personality: p.personality || [],
            workExperiences: p.work_experiences || [],
            educationBackgrounds: p.education_backgrounds || [],
            description: p.description || "",
            avatarUrl: p.avatar_url || "",
            validId: p.id_url ? { url: p.id_url, type: 'ID', status: p.id_status || 'unknown' } : null,
            validCert: p.cert_url ? { url: p.cert_url, type: 'Certificate', status: p.cert_status || 'unknown' } : null,
            id_url: p.id_url || "",
            cert_url: p.cert_url || "",
            id_status: p.id_status || "pending",
            cert_status: p.cert_status || "pending"
          });
        });
      }
    }

    // Fetch job titles and archived status
    const jobMap = new Map();
    const archivedJobIds = new Set();
    if (jobIds.size) {
      const { data: jobRows } = await supa
        .from("job_post")
        .select("id,title,is_archived")
        .in("id", Array.from(jobIds));
      if (Array.isArray(jobRows)) {
        jobRows.forEach(j => {
          jobMap.set(j.id, j.title || "");
          if (j.is_archived === true) archivedJobIds.add(j.id);
        });
      }
    }

    // Fetch account status for resume report targets to filter out archived accounts
    const archivedUserIds = new Set();
    if (resumeTargetIds.size) {
      const { data: accountRows } = await supa
        .from("app_user")
        .select("id,account_status")
        .in("id", Array.from(resumeTargetIds));
      if (Array.isArray(accountRows)) {
        accountRows.forEach(u => {
          if (u.account_status === "archived") archivedUserIds.add(u.id);
        });
      }
    }

    // Filter out reports whose job is archived or whose resume owner account is archived
    const activeReports = reports.filter(r => {
      if (r.target_type === "job" && r.target_job_id && archivedJobIds.has(r.target_job_id)) return false;
      if (r.target_type === "resume" && r.target_user_id && archivedUserIds.has(r.target_user_id)) return false;
      return true;
    });

    return activeReports.map(r => ({
      id: r.id,
      reporterId: r.reporter_id,
      reporterName: userMap.get(r.reporter_id) || "Unknown",
      targetUserId: r.target_user_id,
      targetUserName: r.target_user_id ? (userMap.get(r.target_user_id) || "Unknown") : null,
      targetType: r.target_type || "job",
      targetJobId: r.target_job_id,
      targetJobTitle: r.target_job_id ? (jobMap.get(r.target_job_id) || "Unknown Job") : null,
      reason: r.reason || "No reason provided",
      status: r.status || "pending",
      createdAt: r.created_at,
      reviewedBy: r.reviewed_by,
      resumeProfile: r.target_user_id ? (resumeProfileMap.get(r.target_user_id) || null) : null,
      snapshot: r.target_user_id ? { resumeProfile: resumeProfileMap.get(r.target_user_id) || null } : null
    }));
  }

  async function adminDeleteReport(reportId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can manage reports.");
    }
// Delete related rows first — wrapped in try/catch so missing tables don't abort the main delete
    console.log("adminDeleteReport: Deleting report with ID:", reportId);
    try { 
      await supa.from("moderation_action").delete().eq("report_id", reportId); 
      console.log("adminDeleteReport: Deleted moderation_action rows");
    } catch (_) {}
    try { 
      await supa.from("report_resume_snapshot").delete().eq("report_id", reportId); 
      console.log("adminDeleteReport: Deleted report_resume_snapshot rows");
    } catch (_) {}
    
    console.log("adminDeleteReport: Checking if report exists before deletion...");
    const { data: existingReport, error: checkError } = await supa
      .from("content_report")
      .select("id")
      .eq("id", reportId)
      .maybeSingle();
    
    if (checkError) {
      console.error("adminDeleteReport: Error checking report existence:", checkError);
      throw new Error(formatDebugError(checkError, "Unable to check report existence."));
    }
    
    if (!existingReport) {
      console.log("adminDeleteReport: Report not found, may already be deleted");
      return true;
    }
    
    console.log("adminDeleteReport: Report exists, proceeding with deletion...");
    const { error, count } = await supa.from("content_report").delete().eq("id", reportId);
    console.log("adminDeleteReport: Delete result - error:", error, "count:", count);
    
    if (error) {
      console.error("adminDeleteReport: Delete failed with error:", error);
      throw new Error(formatDebugError(error, "Unable to delete report."));
    }
    
    // Verify deletion by checking if report still exists
    const { data: verifyReport, error: verifyError } = await supa
      .from("content_report")
      .select("id")
      .eq("id", reportId)
      .maybeSingle();
    
    if (verifyError) {
      console.error("adminDeleteReport: Error verifying deletion:", verifyError);
    } else if (verifyReport) {
      console.error("adminDeleteReport: CRITICAL - Report still exists after deletion!");
      throw new Error("Report deletion failed - report still exists in database");
    } else {
      console.log("adminDeleteReport: Deletion verified - report no longer exists");
    }
    
    return true;
  }

  async function adminUpdateReportStatus(reportId, status) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can manage reports.");
    }
    console.log("adminUpdateReportStatus: Updating report", reportId, "to status:", status);
    const { error, count } = await supa
      .from("content_report")
      .update({ status, reviewed_by: currentUser.id })
      .eq("id", reportId);
    console.log("adminUpdateReportStatus: Update result - error:", error, "count:", count);
    
    if (error) {
      console.error("adminUpdateReportStatus: Update failed:", error);
      throw new Error(formatDebugError(error, "Unable to update report status."));
    }
    
    // Verify the update
    const { data: verifyReport, error: verifyError } = await supa
      .from("content_report")
      .select("status")
      .eq("id", reportId)
      .maybeSingle();
    
    if (verifyError) {
      console.error("adminUpdateReportStatus: Error verifying update:", verifyError);
    } else if (verifyReport) {
      console.log("adminUpdateReportStatus: Verified report status is now:", verifyReport.status);
    } else {
      console.log("adminUpdateReportStatus: Report not found after update");
    }
    
    return true;
  }

  async function adminUnarchiveUser(userId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can unarchive users.");
    }
    const { error } = await supa
      .from("app_user")
      .update({ account_status: 'active' })
      .eq("id", userId);
    if (error) throw new Error(formatDebugError(error, "Unable to unarchive user."));
    return true;
  }

  async function adminBanUser(userId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can ban users.");
    }
    const { error } = await supa
      .from("app_user")
      .update({ account_status: "archived" })
      .eq("id", userId);
    if (error) throw new Error(formatDebugError(error, "Unable to ban user."));
    const now = new Date().toISOString();
    await supa.from("user_profile").update({ archived_at: now }).eq("user_id", userId);
    return true;
  }

  async function adminArchiveUser(userId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can archive users.");
    }
    const now = new Date().toISOString();
        const { error } = await supa
          .from("app_user")
          .update({ account_status: "archived" })
          .eq("id", userId);
        if (error) throw new Error(formatDebugError(error, "Unable to archive user."));
        await supa.from("user_profile").update({ archived_at: now }).eq("user_id", userId);

        // Notify the user that their account has been banned/archived
        try {
          await createNotification(userId, "account_banned", {
            reason: "Violation of community guidelines"
          });
        } catch (notifErr) {
          console.warn("Failed to send account banned notification:", notifErr);
        }

        return true;
  }

  async function adminArchiveJob(jobId, reason) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can archive jobs.");
    }
    // First get job details to send notification
    const { data: jobData, error: fetchError } = await supa
      .from("job_post")
      .select("posted_by, title")
      .eq("id", jobId)
      .maybeSingle();
    
    if (fetchError) {
      console.warn("Failed to fetch job details for notification:", fetchError);
    }
    
    // Archive the job
    const { error } = await supa
      .from("job_post")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        listing_open: false
      })
      .eq("id", jobId);
    if (error) throw new Error(formatDebugError(error, "Unable to archive job."));
    
    // Job is now archived and will appear as "Removed by the Admin" in recruiter dashboard
    console.log("adminArchiveJob: Job archived successfully:", jobId);

    // Notify the recruiter that their job was removed by admin
    if (jobData && jobData.posted_by) {
      try {
        await createNotification(jobData.posted_by, "job_archived", {
          job_title: jobData.title || "Untitled Job",
          reason: reason || "Violation of community guidelines"
        });
      } catch (notifErr) {
        console.warn("Failed to send job archived notification:", notifErr);
      }
    }
    
    return true;
  }

  async function adminUnarchiveJob(jobId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const { data: currentAppUser, error: roleErr } = await supa
      .from("app_user")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (roleErr || !currentAppUser || currentAppUser.role !== "admin") {
      throw new Error("Only admins can unarchive jobs.");
    }
    
    // Unarchive the job
    const { error } = await supa
      .from("job_post")
      .update({
        is_archived: false,
        archived_at: null,
        listing_open: true
      })
      .eq("id", jobId);
    if (error) throw new Error(formatDebugError(error, "Unable to unarchive job."));
    
    console.log("adminUnarchiveJob: Job unarchived successfully:", jobId);
    return true;
  }

  async function submitReport({ targetType, targetJobId, targetUserId, reason }) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const currentUser = await requireUser();
    const row = {
      reporter_id: currentUser.id,
      target_type: targetType || "job",
      reason: reason || "No reason provided"
    };
    if (targetJobId) row.target_job_id = targetJobId;
    if (targetUserId) row.target_user_id = targetUserId;
    const { error } = await supa.from("content_report").insert(row);
    if (error) throw new Error(formatDebugError(error, "Unable to submit report."));
    return true;
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || "")
    );
  }

  // User documents
  async function listUserDocuments(userId) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    try {
      console.log('DEBUG: Querying app_user table for userId:', userId);
      
      // First, get all columns to see what's available
      // Use service role key for admin access to bypass RLS if needed
      const { data: allUserData, error: allUserError } = await supa
        .from('app_user')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('DEBUG: All user data - data:', allUserData);
      console.log('DEBUG: All user data - error:', allUserError);
      
      if (allUserError) {
        console.log('DEBUG: Error with regular client, trying service role...');
        // If regular client fails due to RLS, we might need service role
        // For now, let's try a more specific query that might work
        const { data: limitedData, error: limitedError } = await supa
          .from('app_user')
          .select('id, email, role, created_at, updated_at')
          .eq('id', userId)
          .maybeSingle();
        
        console.log('DEBUG: Limited data - data:', limitedData);
        console.log('DEBUG: Limited data - error:', limitedError);
        
        if (limitedError) {
          throw new Error(formatDebugError(limitedError, "Unable to fetch user data due to RLS policies."));
        }
        
        // If we can only get basic data, inform about RLS issue
        console.log('DEBUG: RLS policy blocking access to document fields');
        return [];
      }
      
      const documents = [];
      
      // Check for document-related fields in all user data
      if (allUserData) {
        console.log('DEBUG: All available fields:', Object.keys(allUserData));
        
        // Look for common document field names
        const possibleDocFields = [
          'id_url', 'cert_url', 'id_document_url', 'certificate_url',
          'id_document', 'certificate', 'id_file', 'cert_file',
          'identification_url', 'certification_url'
        ];
        
        possibleDocFields.forEach(field => {
          if (allUserData[field] && allUserData[field].trim() !== '') {
            console.log(`DEBUG: Found document field: ${field} = ${allUserData[field]}`);
            
            let docName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (field.includes('id') && !field.includes('cert')) {
              docName = 'ID Document';
            } else if (field.includes('cert')) {
              docName = 'Certificate';
            }
            
            documents.push({
              name: docName,
              type: field,
              url: allUserData[field],
              downloadUrl: allUserData[field],
              status: 'verified'
            });
          }
        });
        
        // If still no documents, check any field containing URL
        if (documents.length === 0) {
          Object.keys(allUserData).forEach(key => {
            const value = allUserData[key];
            if (value && typeof value === 'string' && 
                (value.includes('http') || value.includes('supabase') || value.includes('.pdf') || value.includes('.jpg') || value.includes('.png'))) {
              console.log(`DEBUG: Found potential URL field: ${key} = ${value}`);
              
              let docName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (key.includes('id')) {
                docName = 'ID Document';
              } else if (key.includes('cert')) {
                docName = 'Certificate';
              }
              
              documents.push({
                name: docName,
                type: key,
                url: value,
                downloadUrl: value,
                status: 'verified'
              });
            }
          });
        }
      }
      
      // If still no documents, try user_profile table
      if (documents.length === 0) {
        console.log('DEBUG: No documents in app_user, trying user_profile table...');
        const { data: profileData, error: profileError } = await supa
          .from('user_profile')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        console.log('DEBUG: User profile query result - data:', profileData);
        console.log('DEBUG: User profile query result - error:', profileError);
        
        if (!profileError && profileData) {
          console.log('DEBUG: User profile fields:', Object.keys(profileData));
          
          // Check user_profile for document fields
          const possibleDocFields = [
            'id_url', 'cert_url', 'id_document_url', 'certificate_url',
            'id_document', 'certificate', 'id_file', 'cert_file'
          ];
          
          possibleDocFields.forEach(field => {
            if (profileData[field] && profileData[field].trim() !== '') {
              console.log(`DEBUG: Found document in user_profile: ${field} = ${profileData[field]}`);
              
              let docName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (field.includes('id') && !field.includes('cert')) {
                docName = 'ID Document';
              } else if (field.includes('cert')) {
                docName = 'Certificate';
              }
              
              documents.push({
                name: docName,
                type: field,
                url: profileData[field],
                downloadUrl: profileData[field],
                status: 'verified'
              });
            }
          });
        }
      }
      
      console.log('DEBUG: Final documents array:', documents);
      return documents;
    } catch (error) {
      console.error('Error fetching user documents:', error);
      return []; // Return empty array on error
    }
  }

  // -------------------------------
  // ADMIN: VERIFICATION
  // -------------------------------
  async function listPendingVerifications() {
    const supa = getClient();
    if (!supa) return [];
    const { data: profiles, error } = await supa
      .from("user_profile")
      .select("user_id, first_name, last_name, middle_name, suffix, phone, address, avatar_url, id_url, cert_url, id_status, cert_status")
      .or("id_url.not.is.null,cert_url.not.is.null")
      .order("user_id");
    if (error) throw new Error(formatDebugError(error, "Unable to load verifications."));
    const userIds = (profiles || []).map(p => p.user_id);
    if (!userIds.length) return [];
    const { data: appUsers } = await supa
      .from("app_user")
      .select("id,email")
      .in("id", userIds);
    const emailById = new Map((appUsers || []).map(u => [u.id, u.email]));
    return (profiles || [])
      .filter(p => p.id_url || p.cert_url)
      .map(p => {
        const lastName = p.last_name || "";
        const firstName = p.first_name || "";
        const middleName = p.middle_name || "";
        const suffix = p.suffix || "";
        const nameParts = [lastName, firstName];
        if (middleName) nameParts.push(middleName);
        if (suffix) nameParts.push(suffix);
        const fullName = lastName ? `${lastName}, ${nameParts.slice(1).join(" ")}` : nameParts.join(" ");
        const addr = p.address && typeof p.address === "object" ? p.address : {};
        const addrParts = [addr.street, addr.barangay, addr.city, addr.province].filter(Boolean);
        return {
          userId: p.user_id,
          name: fullName || emailById.get(p.user_id) || "Unknown",
          email: emailById.get(p.user_id) || "",
          phone: p.phone || "",
          address: addrParts.join(", ") || "",
          avatarUrl: p.avatar_url || "",
          id_url: p.id_url || "",
          cert_url: p.cert_url || "",
          id_status: p.id_status || "pending",
          cert_status: p.cert_status || "pending"
        };
      });
  }

  async function adminUpdateVerificationStatus(userId, idStatus, certStatus) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    const updates = {};
    if (idStatus) updates.id_status = idStatus;
    if (certStatus) updates.cert_status = certStatus;
    if (!Object.keys(updates).length) return true;
    const { error } = await supa
      .from("user_profile")
      .update(updates)
      .eq("user_id", userId);
    if (error) throw new Error(formatDebugError(error, "Unable to update verification status."));
    return true;
  }

  function getValidJobImageURL(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    // Basic URL validation
    try {
      new URL(trimmed);
      return trimmed;
    } catch (e) {
      return '';
    }
  }

  window.RJGDb = {
    getClient,
    resetClient,
    getCurrentUserRole,
    setCurrentUserRole,
    signOut,
    isEmailTaken,
    checkEmailExistsForPasswordReset,
    signUpWithEmailPassword,
    signInWithEmailPassword,
    verifyEmailOtp,
    sendEmailOtp,
    sendPasswordResetOtp,
    checkIfEmailIsAdmin,
    checkEmailExists,
    sendVerificationOtp,
    updateCurrentUserEmail,
    updateCurrentUserPassword,
    deleteCurrentAccountWithPassword,
    ensureProfileRow,
    saveCurrentUserProfile,
    loadCurrentUserProfile,
    isSeekerProfileComplete,
    isRecruiterProfileComplete,
    isProfileComplete,
    loadAllJobs,
    loadPostedJobs,
    savePostedJobs,
    listBookmarks,
    toggleBookmark,
    listApplications,
    hasApplied,
    applyToJob,
    withdrawApplication,
    updateApplicationStatus,
    listApplicantsForJob,
    listAllUsers,
    adminUpdateJob,
    adminUpdateJobLocation,
    adminUpdateJobRate,
    adminUpdateJobSkills,
    adminUpdateUserProfile,
    adminUpdateUserEmail,
    adminUpdateUserPassword,
    listNotifications,
    countUnreadNotifications,
    markNotificationAsRead,
    deleteNotification,
    createNotification,
    uploadJobImage,
    getJobImageUrl,
    uploadProfileImage,
    getProfileImageUrl,
    adminUploadProfileImage,
    uploadFile,
    getIdImageUrl,
    getCertImageUrl,
    saveCurrentUserAvatarUrl,
    loadSeekerPreferences,
    saveSeekerPreferences,
    ensureDropdownOptionCache,
    getDropdownOptions,
    loadAllReports,
    adminDeleteReport,
    adminUpdateReportStatus,
    adminBanUser,
    adminArchiveUser,
    adminArchiveJob,
    adminUnarchiveUser,
    adminUnarchiveJob,
    submitReport,
    listUserDocuments,
    getValidJobImageURL,
    listPendingVerifications,
    adminUpdateVerificationStatus,
    checkUserBanStatus,
    testArchiveJobWithoutAdminCheck
  };

  async function checkUserBanStatus() {
    const supa = getClient();
    if (!supa) return { isBanned: false, reason: null };
    
    try {
      const { data: authData } = await supa.auth.getUser();
      const user = authData && authData.user ? authData.user : null;
      
      if (!user) {
        return { isBanned: false, reason: null };
      }
      
      // Check user's account status in database
      const { data: userData, error } = await supa
        .from("app_user")
        .select("account_status, role")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) {
        console.warn("Failed to check user ban status:", error);
        return { isBanned: false, reason: null };
      }
      
      const isBanned = userData && (
        userData.account_status === 'archived' || 
        userData.account_status === 'suspended' ||
        userData.account_status === 'banned'
      );
      
      return {
        isBanned,
        reason: isBanned ? "Your account has been suspended. Contact support for more inquiries." : null,
        userData
      };
      
    } catch (error) {
      console.warn("Error checking user ban status:", error);
      return { isBanned: false, reason: null };
    }
  }

  // Test function to simulate admin archive job without admin check (for testing only)
  async function testArchiveJobWithoutAdminCheck(jobId, reason) {
    const supa = getClient();
    if (!supa) throw new Error("Supabase client not initialized.");
    
    // First get job details to send notification
    const { data: jobData, error: fetchError } = await supa
      .from("job_post")
      .select("posted_by, title")
      .eq("id", jobId)
      .maybeSingle();
    
    if (fetchError) {
      console.warn("Failed to fetch job details for notification:", fetchError);
    }
    
    // Archive the job
    const { error } = await supa
      .from("job_post")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        listing_open: false
      })
      .eq("id", jobId);
    if (error) throw new Error(formatDebugError(error, "Unable to archive job."));
    
    // Send notification to recruiter if we have their ID
    if (jobData && jobData.posted_by) {
      try {
        await createNotification(jobData.posted_by, "JOB_REMOVED_BY_ADMIN", {
          job_title: jobData.title || "Untitled Job",
          reason: reason || "Violation of community guidelines"
        });
        console.log("Notification sent to recruiter for archived job:", jobId);
      } catch (notifyErr) {
        console.warn("Failed to send notification to recruiter:", notifyErr);
      }
    }
    
    return true;
  }
})();