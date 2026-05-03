/**
 * AI-Driven Job Matching for Ready-Job-Go (RJG) — v3 (Edge Function Edition)
 *
 * Drop-in replacement for ai-job-matcher.js.
 * Gemini API calls are now routed through a Supabase Edge Function
 * so the API key is never exposed in the browser.
 *
 * Architecture — 2-stage hybrid:
 *  Stage 1  Weighted scorer picks the top 8 from all open jobs.
 *  Stage 2  Gemini 2.5 Pro semantically re-scores all 8 via Edge Function.
 *  Final    score = 40% stage-1 + 60% Gemini score.
 *
 * Data sources used (all loaded in parallel):
 *  user_profile          — bio, location, education_status
 *  user_skill            — skill list
 *  user_work_experience  — positions, companies, descriptions
 *  user_education        — school, degree program
 *  user_personality      — personality traits
 *  user_language         — languages spoken
 *  seeker_preferences    — schedule, setting, type, rate
 *  user_job_interaction  — views, applies
 *  job_application       — applied jobs
 *  job_bookmark          — bookmarked jobs
 *  user_hidden_job       — hidden jobs
 *
 * Scoring weights (Stage 1, normalized to 100):
 *  Skills overlap        30 pts
 *  Work experience       25 pts
 *  Location proximity    20 pts
 *  Preferences match     25 pts  (schedule 8, setting 8, type 5, rate 4)
 *  Interaction history   10 pts
 *  Urgency bonus          5 pts
 */

(function () {
  "use strict";

  // ─── Config ──────────────────────────────────────────────────────────────────

  const MAX_JOBS             = 8;
  const EDGE_FUNCTION_NAME   = "job-matcher"; // must match your deployed function name

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function toArr(v) {
    if (Array.isArray(v)) return v;
    if (!v) return [];
    try { const p = JSON.parse(String(v)); return Array.isArray(p) ? p : []; }
    catch (_) { return []; }
  }

  function normalize(s) { return String(s || "").toLowerCase().trim(); }

  function overlapCoeff(userSet, jobSet) {
    if (!jobSet.size) return 0;
    let n = 0;
    for (const x of jobSet) if (userSet.has(x)) n++;
    return n / jobSet.size;
  }

  // ─── Data loading ─────────────────────────────────────────────────────────────

  async function fetchUserProfile(supa, userId) {
    const { data, error } = await supa
      .from("user_profile").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new Error("AI Matcher: profile load failed — " + error.message);
    return data || {};
  }

  async function fetchUserSkills(supa, userId) {
    const { data } = await supa.from("user_skill").select("skill_name").eq("user_id", userId);
    return (data || []).map(r => r.skill_name).filter(Boolean);
  }

  async function fetchUserWorkExperiences(supa, userId) {
    const { data } = await supa
      .from("user_work_experience")
      .select("position_name,company_name,location_text,date_from,date_to,is_present,description")
      .eq("user_id", userId);
    return data || [];
  }

  async function fetchUserEducation(supa, userId) {
    const { data } = await supa
      .from("user_education")
      .select("school_name,degree_program,date_from,date_to,is_present,description")
      .eq("user_id", userId);
    return data || [];
  }

  async function fetchUserPersonality(supa, userId) {
    const { data } = await supa
      .from("user_personality").select("trait_name").eq("user_id", userId);
    return (data || []).map(r => r.trait_name).filter(Boolean);
  }

  async function fetchUserLanguages(supa, userId) {
    const { data } = await supa
      .from("user_language").select("language_name").eq("user_id", userId);
    return (data || []).map(r => r.language_name).filter(Boolean);
  }

  async function fetchUserPreferences(supa, userId) {
    const { data, error } = await supa
      .from("seeker_preferences").select("*").eq("user_id", userId).maybeSingle();
    if (error && error.code !== "PGRST116") {
      console.warn("AI Matcher: preferences load failed:", error.message);
      return null;
    }
    if (!data) return null;
    return {
      scheduleCode: data.preferred_schedule_code  || "",
      settingCode:  data.preferred_setting_code   || "",
      typeCode:     data.preferred_type_code      || "",
      minRate:      data.min_rate_amount          || null,
      maxRate:      data.max_rate_amount          || null,
      currency:     data.preferred_currency_code  || "PHP",
      rateUnit:     data.preferred_rate_unit_code || "hour",
      notes:        data.preferences_notes        || "",
    };
  }

  async function fetchUserInteractions(supa, userId) {
    const { data } = await supa
      .from("user_job_interaction").select("job_id,event_type").eq("user_id", userId);
    const map = {};
    for (const row of data || []) {
      if (!map[row.job_id]) map[row.job_id] = new Set();
      map[row.job_id].add(row.event_type);
    }
    return map;
  }

  async function fetchUserApplications(supa, userId) {
    const { data } = await supa
      .from("job_application").select("job_id").eq("applicant_id", userId);
    return new Set((data || []).map(r => r.job_id));
  }

  async function fetchUserBookmarks(supa, userId) {
    const { data } = await supa
      .from("job_bookmark").select("job_id").eq("user_id", userId);
    return new Set((data || []).map(r => r.job_id));
  }

  async function fetchHiddenJobs(supa, userId) {
    const { data } = await supa
      .from("user_hidden_job").select("job_id").eq("user_id", userId);
    return new Set((data || []).map(r => r.job_id));
  }

  async function fetchOpenJobs(supa, currentUserId) {
    const { data, error } = await supa
      .from("job_post")
      .select(
        "*," +
        "poster_profile:user_profile!job_post_posted_by_fkey(first_name,last_name,middle_name,suffix)," +
        "job_location(full_text,city,province,country)," +
        "job_rate(amount,currency_code,unit_code)," +
        "job_skill(skill_name)"
      )
      .eq("listing_open", true)
      .neq("posted_by", currentUserId)
      .order("posted_at", { ascending: false });
    if (error) throw new Error("AI Matcher: jobs load failed — " + error.message);
    return data || [];
  }

  async function fetchDropdownOptionMap(supa) {
    const { data, error } = await supa
      .from("dropdown_option").select("category,code,label,is_active").eq("is_active", true);
    if (error) return {};
    const out = {};
    for (const row of data || []) {
      const cat = String(row.category || ""), code = String(row.code || "");
      if (!cat || !code) continue;
      if (!out[cat]) out[cat] = new Map();
      out[cat].set(code, String(row.label || code));
    }
    return out;
  }

  async function buildPosterNameMap(supa, jobs) {
    const ids = Array.from(new Set(
      (jobs || []).map(j => j && j.posted_by != null ? String(j.posted_by).trim() : "").filter(Boolean)
    ));
    const out = new Map();
    if (!ids.length) return out;

    const [{ data: users }, { data: profiles }] = await Promise.all([
      supa.from("app_user").select("id,email,full_name,name").in("id", ids),
      supa.from("user_profile").select("user_id,full_name,first_name,last_name,display_name,name").in("user_id", ids),
    ]);

    const pick = p => p ? (
      String(p.full_name || p.name || p.display_name || "").trim() ||
      [p.first_name, p.last_name].filter(Boolean).join(" ").trim()
    ) : "";

    const byProfile = new Map((profiles || []).map(p => [String(p.user_id), pick(p)]).filter(([, n]) => n));
    const byUser    = new Map((users || []).map(u => [String(u.id), String(u.full_name || u.name || "").trim()]).filter(([, n]) => n));
    const byEmail   = new Map((users || []).map(u => [String(u.id), String(u.email || "")]));

    ids.forEach(id => {
      const name = byProfile.get(id) || byUser.get(id);
      if (name) { out.set(id, name); return; }
      const local = (byEmail.get(id) || "").split("@")[0] || "";
      out.set(id, local
        ? local.replace(/[_\-.]+/g, " ").split(/\s+/).filter(Boolean)
            .map(p => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(" ")
        : "Employer");
    });
    return out;
  }

  // ─── Stage 1: Weighted scorer ─────────────────────────────────────────────────

  function buildUserSignals(profile, skills, workExps) {
    const profileSkills = toArr(profile.skills).map(s =>
      typeof s === "string" ? s : s.name || s.skill_name || "");
    const allSkills = Array.from(
      new Set([...skills, ...profileSkills].map(normalize).filter(Boolean))
    );

    const workKeywords = new Set();
    for (const we of workExps) {
      if (we.position_name) workKeywords.add(normalize(we.position_name));
      normalize(we.description || "")
        .split(/[\s,;.]+/).filter(w => w.length > 3).forEach(w => workKeywords.add(w));
    }
    for (const we of toArr(profile.work_experiences)) {
      const pos = normalize(we.position || we.position_name || we.title || "");
      if (pos) workKeywords.add(pos);
    }

    return {
      allSkills,
      workKeywords,
      city:     normalize(profile.city || ""),
      province: normalize(profile.province || ""),
      country:  normalize(profile.country || "Philippines"),
    };
  }

  function scorePreferences(job, prefs, reasons) {
    if (!prefs) return { score: 0, matched: {} };
    let score = 0;
    const matched = {};

    if (prefs.scheduleCode && job.schedule_code &&
        normalize(job.schedule_code) === normalize(prefs.scheduleCode)) {
      score += 8;
      matched.schedule = true;
      reasons.push("Matches your preferred schedule");
    }
    if (prefs.settingCode && job.setting_code &&
        normalize(job.setting_code) === normalize(prefs.settingCode)) {
      score += 8;
      matched.setting = true;
      reasons.push("Matches your preferred work setting");
    }
    if (prefs.typeCode && job.category_code &&
        normalize(job.category_code) === normalize(prefs.typeCode)) {
      score += 5;
      matched.type = true;
      reasons.push("Matches your preferred job category");
    }
    if (prefs.minRate || prefs.maxRate) {
      const rateRow  = Array.isArray(job.job_rate) ? job.job_rate[0] : job.job_rate;
      const amount   = rateRow && rateRow.amount != null ? Number(rateRow.amount) : null;
      const jobCurr  = rateRow ? normalize(rateRow.currency_code || "") : "";
      const prefCurr = normalize(prefs.currency || "PHP");
      if (amount != null && jobCurr === prefCurr) {
        const ok = (!prefs.minRate || amount >= Number(prefs.minRate)) &&
                   (!prefs.maxRate || amount <= Number(prefs.maxRate));
        if (ok) { score += 4; matched.rate = true; reasons.push("Rate is within your preferred range"); }
      }
    }
    return { score, matched };
  }

  function scoreJob(job, userSig, prefs, opts) {
    const { appliedJobIds, bookmarkedJobIds, interactionMap, mode } = opts;
    const jobId      = job.id;
    const jobSkills  = (job.job_skill || []).map(s => normalize(s.skill_name)).filter(Boolean);
    const jobTitle   = normalize(job.title || "");
    const jobDesc    = normalize(job.description || "");
    const locRow     = Array.isArray(job.job_location) ? job.job_location[0] : job.job_location;
    const jobCity    = normalize(locRow ? locRow.city    || locRow.full_text || "" : "");
    const jobProv    = normalize(locRow ? locRow.province || "" : "");
    const jobCountry = normalize(locRow ? locRow.country  || "" : "");
    const isRemote   = normalize(job.setting_code) === "remote";
    const isUrgent   = !!job.is_urgent;
    const reasons    = [];
    const raw        = {};

    // 1. Skills (30 pts)
    const userSkillSet = new Set(userSig.allSkills);
    const jobSkillSet  = new Set(jobSkills);
    raw.skills = overlapCoeff(userSkillSet, jobSkillSet) * 30;
    if (raw.skills > 0) {
      const matched = jobSkills.filter(s => userSkillSet.has(s));
      reasons.push(`Matches ${matched.length} of your skills (${matched.slice(0,3).join(", ")}${matched.length > 3 ? "…" : ""})`);
    }

    // 2. Work experience (25 pts)
    let weHits = 0;
    for (const kw of userSig.workKeywords)
      if (jobTitle.includes(kw) || jobDesc.includes(kw)) weHits++;
    raw.work = userSig.workKeywords.size
      ? Math.min(weHits / Math.max(userSig.workKeywords.size, 1), 1) * 25 : 0;
    if (raw.work > 5) reasons.push("Aligns with your work experience");

    // 3. Location (20 pts)
    let locScore = 0;
    if (isRemote)                                                       { locScore = 20; reasons.push("Remote — matches any location"); }
    else if (userSig.city    && jobCity.includes(userSig.city))         { locScore = 20; reasons.push(`In your city (${userSig.city})`); }
    else if (userSig.province && jobProv.includes(userSig.province))    { locScore = 14; reasons.push(`In your province (${userSig.province})`); }
    else if (userSig.country  && jobCountry.includes(userSig.country))  { locScore = 8; }
    raw.location = locScore;

    // 4. Preferences (25 pts)
    const prefResult = scorePreferences(job, prefs, reasons);
    raw.preferences = prefResult.score;
    const matchedPreferences = prefResult.matched;

    // 5. Interaction history (10 pts)
    let interScore = 0;
    const events = interactionMap[jobId] || new Set();
    if (bookmarkedJobIds.has(jobId)) { interScore += 5; reasons.push("You bookmarked similar roles"); }
    if (events.has("view"))           interScore += 2;
    if (events.has("apply"))          interScore += 3;
    raw.interaction = Math.min(interScore, 10);

    // 6. Urgency (5 pts)
    raw.urgency = isUrgent ? 5 : 0;
    if (isUrgent) reasons.push("Urgently hiring");

    // Mode multipliers
    const m = { skills: 1, work: 1, location: 1, preferences: 1, interaction: 1, urgency: 1 };
    if      (mode === "skills")   { m.skills = 2;   m.work = 0.5; m.location = 0.5; }
    else if (mode === "work")     { m.work = 2;     m.skills = 0.5; m.location = 0.5; }
    else if (mode === "location") { m.location = 2; m.skills = 0.5; m.work = 0.5; }
    else if (mode === "schedule") { m.preferences = 2; m.skills = 0.5; m.work = 0.5; }
    else if (mode === "setting")  { m.preferences = 2; m.skills = 0.5; m.work = 0.5; }
    else if (mode === "type")     { m.preferences = 2; m.skills = 0.5; m.work = 0.5; }
    else if (mode === "rate")     { m.preferences = 2; m.skills = 0.5; m.work = 0.5; }

    const total = raw.skills * m.skills + raw.work * m.work + raw.location * m.location
                + raw.preferences * m.preferences + raw.interaction * m.interaction + raw.urgency * m.urgency;
    const max   = 30 * m.skills + 25 * m.work + 20 * m.location
                + 25 * m.preferences + 10 * m.interaction + 5 * m.urgency;

    return { score: Math.round((total / max) * 100), reasons, alreadyApplied: appliedJobIds.has(jobId), matchedPreferences };
  }

  // ─── Stage 2: Gemini via Edge Function ───────────────────────────────────────

  function buildUserSummary(profile, skills, workExps, education, personality, languages, prefs) {
    const lines = [];
    // Construct full name from individual name parts
    if (profile) {
      const parts = [
        profile.first_name || "",
        profile.middle_name || "",
        profile.last_name || ""
      ].filter(Boolean);
      const fullName = parts.join(" ").trim();
      if (profile.suffix) fullName += ` ${profile.suffix}`;
      if (fullName) lines.push(`Name: ${fullName}`);
    }
    if (profile.bio)       lines.push(`Bio: ${profile.bio}`);

    if (skills.length) lines.push(`Skills: ${skills.join(", ")}`);

    if (workExps.length) {
      const we = workExps.map(w =>
        `${w.position_name || "Role"}${w.company_name ? " at " + w.company_name : ""}` +
        (w.description ? ": " + w.description.slice(0, 100) : "")
      ).join(" | ");
      lines.push(`Work experience: ${we}`);
    }

    if (education.length) {
      const ed = education.map(e =>
        `${e.degree_program || ""}${e.school_name ? " at " + e.school_name : ""}`
      ).filter(Boolean).join(", ");
      if (ed) lines.push(`Education: ${ed}`);
    }

    if (personality.length) lines.push(`Personality traits: ${personality.join(", ")}`);
    if (languages.length)   lines.push(`Languages: ${languages.join(", ")}`);

    const loc = [profile.city, profile.province, profile.country].filter(Boolean).join(", ");
    if (loc) lines.push(`Location: ${loc}`);

    if (prefs) {
      const pl = [];
      if (prefs.scheduleCode) pl.push(`Preferred schedule: ${prefs.scheduleCode}`);
      if (prefs.settingCode)  pl.push(`Preferred work setting: ${prefs.settingCode}`);
      if (prefs.typeCode)     pl.push(`Preferred job category: ${prefs.typeCode}`);
      if (prefs.minRate || prefs.maxRate) {
        const min = prefs.minRate ? `${prefs.currency} ${prefs.minRate}` : "any";
        const max = prefs.maxRate ? `${prefs.currency} ${prefs.maxRate}` : "any";
        pl.push(`Preferred rate: ${min} – ${max} per ${prefs.rateUnit}`);
      }
      if (prefs.notes) pl.push(`Candidate notes: ${prefs.notes}`);
      if (pl.length) lines.push("Job Preferences:\n  " + pl.join("\n  "));
    }

    return lines.join("\n");
  }

  /**
   * Calls the Supabase Edge Function instead of Gemini directly.
   * The API key lives securely on the server.
   */
  async function geminiScoreAllJobs(jobs, userSummary) {
    const supa = window.RJGDb?.getClient?.();
    if (!supa) throw new Error("AI Matcher: Supabase client not available.");

    const { data, error } = await supa.functions.invoke(EDGE_FUNCTION_NAME, {
      body: { jobs, userSummary },
    });

    if (error) throw new Error("Edge Function error: " + error.message);
    if (!Array.isArray(data)) throw new Error("Edge Function returned non-array response.");
    return data;
  }

  async function geminiRerank(jobs, userSummary) {
    let aiResults = [];
    try {
      aiResults = await geminiScoreAllJobs(jobs, userSummary);
    } catch (err) {
      console.warn("[AI Matcher] Gemini Edge Function failed, using stage-1 scores:", err.message);
      return jobs.sort((a, b) => b.matchScore - a.matchScore);
    }

    const aiMap = new Map();
    for (const { id, aiScore } of aiResults)
      if (id != null && typeof aiScore === "number") aiMap.set(String(id), aiScore);

    return jobs
      .map(job => {
        const aiScore = aiMap.has(String(job.id)) ? aiMap.get(String(job.id)) : job.matchScore;
        return { ...job, matchScore: Math.round(0.4 * job.matchScore + 0.6 * aiScore), aiScore };
      })
      .sort((a, b) => b.matchScore !== a.matchScore
        ? b.matchScore - a.matchScore
        : (a.alreadyApplied ? 1 : 0) - (b.alreadyApplied ? 1 : 0));
  }

  // ─── Display helpers ──────────────────────────────────────────────────────────

  function toRelativePostedAgo(iso) {
    const dt = new Date(iso || "");
    if (isNaN(dt)) return "Just now";
    const days = Math.floor((Date.now() - dt) / 86400000);
    if (days <= 0) return "Just now";
    return days === 1 ? "1 Day Ago" : `${days} Days Ago`;
  }

  function mapJobRow(row, dropdownMap) {
    const lbl = (cat, code, fb) => {
      const m = dropdownMap && dropdownMap[cat];
      return m && m.get(String(code || "")) ? m.get(String(code || "")) : fb;
    };
    const rateRow = Array.isArray(row.job_rate)    ? row.job_rate[0]    : row.job_rate;
    const locRow  = Array.isArray(row.job_location) ? row.job_location[0] : row.job_location;
    const skills  = Array.isArray(row.job_skill) ? row.job_skill.map(s => s.skill_name).filter(Boolean) : [];
    const amt     = rateRow && rateRow.amount != null ? Number(rateRow.amount) : null;
    const curr    = rateRow?.currency_code || "PHP";
    const unit    = rateRow?.unit_code     || "Hour";
    return {
      id:          row.id,
      postedById:  row.posted_by,
      title:       row.title || "Untitled Job",
      category:    lbl("job_category", row.category_code, row.category_code || "Job"),
      schedule:    lbl("schedule",     row.schedule_code,  row.schedule_code  || "Full-time"),
      type:        lbl("work_setting", row.setting_code,   row.setting_code   || "On-Site"),
      location:    (locRow && (locRow.full_text || locRow.city || locRow.province || locRow.country)) || "Remote",
      rate:        amt != null ? `${curr} ${amt}/${unit}` : "",
      rateUnit:    unit,
      skills,
      description: row.description || "",
      postedAgo:   toRelativePostedAgo(row.posted_at),
      urgent:      !!row.is_urgent,
      listingOpen: row.listing_open !== false,
      image:       row.image_url || "",
    };
  }

  // ─── Main public API ──────────────────────────────────────────────────────────

  /**
   * Get AI-powered job recommendations for the signed-in user.
   * Returns up to MAX_JOBS (8) results.
   * Called by for-you.js on page load and every Refresh click.
   *
   * @param {object} [opts]
   * @param {string} [opts.mode]  "skills"|"work"|"location"|""
   */
  async function getRecommendations({ mode = "" } = {}) {
    const supa = window.RJGDb?.getClient?.();
    if (!supa) throw new Error("AI Matcher: Supabase client not available.");

    const { data: auth } = await supa.auth.getUser();
    const user = auth?.user;
    if (!user) throw new Error("AI Matcher: user not signed in.");
    const userId = user.id;

    // Load all data in parallel
    const [
      profile, skills, workExps, education, personality, languages,
      prefs, interactions, applied, bookmarks, hidden, rawJobs, dropdownMap
    ] = await Promise.all([
      fetchUserProfile(supa, userId),
      fetchUserSkills(supa, userId),
      fetchUserWorkExperiences(supa, userId),
      fetchUserEducation(supa, userId),
      fetchUserPersonality(supa, userId),
      fetchUserLanguages(supa, userId),
      fetchUserPreferences(supa, userId),
      fetchUserInteractions(supa, userId),
      fetchUserApplications(supa, userId),
      fetchUserBookmarks(supa, userId),
      fetchHiddenJobs(supa, userId),
      fetchOpenJobs(supa, userId),
      fetchDropdownOptionMap(supa),
    ]);

    const userSig        = buildUserSignals(profile, skills, workExps);
    const userSummary    = buildUserSummary(profile, skills, workExps, education, personality, languages, prefs);
    const posterNameById = await buildPosterNameMap(supa, rawJobs);

    // Stage 1 — score all visible jobs, keep top 8
    const stage1 = rawJobs
      .filter(j => !hidden.has(j.id))
      .map(rawJob => {
        const rel     = Array.isArray(rawJob.poster_profile) ? rawJob.poster_profile[0] : rawJob.poster_profile;
        // Construct full name from individual name parts
        let relName = "";
        if (rel) {
          const parts = [
            rel.first_name || "",
            rel.middle_name || "",
            rel.last_name || ""
          ].filter(Boolean);
          relName = parts.join(" ").trim();
          if (rel.suffix) relName += ` ${rel.suffix}`;
        }
        const dirName = String(rawJob.poster_name || rawJob.posted_by_name || rawJob.company_name || "").trim();
        const { score, reasons, alreadyApplied, matchedPreferences } = scoreJob(rawJob, userSig, prefs, {
          appliedJobIds: applied, bookmarkedJobIds: bookmarks, interactionMap: interactions, mode,
        });
        return {
          ...mapJobRow(rawJob, dropdownMap),
          company:      relName || dirName || posterNameById.get(String(rawJob.posted_by || "")) || "Employer",
          posterName:   relName || dirName || posterNameById.get(String(rawJob.posted_by || "")) || "Employer",
          matchScore:   score,
          matchReasons: reasons,
          alreadyApplied,
          matchedPreferences,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_JOBS);

    // Stage 2 — Gemini re-rank via Edge Function
    return await geminiRerank(stage1, userSummary);
  }

  /**
   * Rank an in-memory job list — used by "More like this" section.
   */
  async function rankJobs(jobs, mode = "") {
    const supa = window.RJGDb?.getClient?.();
    if (!supa || !jobs?.length) return jobs || [];

    const { data: auth } = await supa.auth.getUser();
    const user = auth?.user;
    if (!user) return jobs;
    const userId = user.id;

    const [profile, skills, workExps, education, personality, languages, prefs] = await Promise.all([
      fetchUserProfile(supa, userId),
      fetchUserSkills(supa, userId),
      fetchUserWorkExperiences(supa, userId),
      fetchUserEducation(supa, userId),
      fetchUserPersonality(supa, userId),
      fetchUserLanguages(supa, userId),
      fetchUserPreferences(supa, userId),
    ]);

    const userSig     = buildUserSignals(profile, skills, workExps);
    const userSummary = buildUserSummary(profile, skills, workExps, education, personality, languages, prefs);

    const stage1 = jobs.map(job => {
      const pseudo = {
        id: job.id, title: job.title, description: job.description,
        setting_code: job.type, schedule_code: job.schedule,
        category_code: job.category, is_urgent: job.urgent,
        job_skill:    (job.skills || []).map(s => ({ skill_name: s })),
        job_location: [{ city: job.location, full_text: job.location }],
        job_rate:     [],
      };
      const { score, reasons, matchedPreferences } = scoreJob(pseudo, userSig, prefs, {
        appliedJobIds: new Set(), bookmarkedJobIds: new Set(), interactionMap: {}, mode,
      });
      return { ...job, matchScore: score, matchReasons: reasons, matchedPreferences };
    });

    // Stage 2 — Gemini re-rank via Edge Function
    return await geminiRerank(stage1, userSummary);
  }

  // ─── Expose globally ──────────────────────────────────────────────────────────
  window.RJGMatcher = { getRecommendations, rankJobs };

})();