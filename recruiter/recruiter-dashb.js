(function () {
  "use strict";

  // ── PSGC API Cascading Location Logic ──
  const regionSelect = document.getElementById("jpLocationRegion");
  const provinceSelect = document.getElementById("jpLocationProvince");
  const citySelect = document.getElementById("jpLocationCity");
  const barangaySelect = document.getElementById("jpLocationBarangay");

  async function fetchPSGC(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("API request failed");
      return await response.json();
    } catch (error) {
      console.error("PSGC Fetch error:", error);
      return [];
    }
  }

  async function loadRegions() {
    const regions = await fetchPSGC("https://psgc.cloud/api/regions");
    if (!regionSelect) return;
    
    // Sort regions by name
    regions.sort((a, b) => a.name.localeCompare(b.name));
    
    regionSelect.innerHTML = '<option value="">Select Region</option>';
    regions.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.code;
      opt.textContent = r.name;
      regionSelect.appendChild(opt);
    });
  }

  regionSelect?.addEventListener("change", async () => {
    const regionCode = regionSelect.value;
    provinceSelect.innerHTML = '<option value="">Select Province</option>';
    citySelect.innerHTML = '<option value="">Select City</option>';
    barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
    
    provinceSelect.disabled = !regionCode;
    citySelect.disabled = true;
    barangaySelect.disabled = true;

    if (regionCode) {
      const provinces = await fetchPSGC(`https://psgc.cloud/api/regions/${regionCode}/provinces`);
      provinces.sort((a, b) => a.name.localeCompare(b.name));
      provinces.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.code;
        opt.textContent = p.name;
        provinceSelect.appendChild(opt);
      });
    }
  });

  provinceSelect?.addEventListener("change", async () => {
    const provinceCode = provinceSelect.value;
    citySelect.innerHTML = '<option value="">Select City</option>';
    barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
    
    citySelect.disabled = !provinceCode;
    barangaySelect.disabled = true;

    if (provinceCode) {
      const cities = await fetchPSGC(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
      cities.sort((a, b) => a.name.localeCompare(b.name));
      cities.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.code;
        opt.textContent = c.name;
        citySelect.appendChild(opt);
      });
    }
  });

  citySelect?.addEventListener("change", async () => {
    const cityCode = citySelect.value;
    barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
    
    barangaySelect.disabled = !cityCode;

    if (cityCode) {
      const barangays = await fetchPSGC(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
      barangays.sort((a, b) => a.name.localeCompare(b.name));
      barangays.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.code;
        opt.textContent = b.name;
        barangaySelect.appendChild(opt);
      });
    }
  });

  // Enforce numeric-only input for Unit field
  const unitInput = document.getElementById("jpLocationUnit");
  if (unitInput) {
    unitInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    unitInput.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
        e.preventDefault();
      }
    });
  }

  // Enforce ZIP code max length of 4 characters
  const zipInput = document.getElementById("jpLocationZip");
  if (zipInput) {
    zipInput.addEventListener("input", (e) => {
      if (e.target.value.length > 4) {
        e.target.value = e.target.value.slice(0, 4);
      }
    });
  }

  // Load regions on page load
  document.addEventListener("DOMContentLoaded", loadRegions);

  // ── Location data storage ──
  let pendingStructuredLocation = null;

  // ── Character limits for job posting ──
  const MAX_JOB_TITLE_LENGTH = 25;
  const MAX_JOB_DESCRIPTION_LENGTH = 500;

  // ── Input clamping helpers ──
  function clampInputValue(el, maxLength) {
    if (!el || !el.value) return;
    if (el.value.length > maxLength) {
      el.value = el.value.slice(0, maxLength);
    }
  }

  function showLengthWarning(el, maxLength, fieldName) {
    if (!el) return;
    const remaining = maxLength - (el.value || "").length;
    if (remaining < 0) {
      notify(`${fieldName} exceeds maximum length of ${maxLength} characters.`, "warn");
    }
  }

  // ── Auth guard: redirect non-recruiters to login ──
  async function enforceRecruiter() {
    if (!window.RJGDb || typeof window.RJGDb.getCurrentUserRole !== "function") return;
    try {
      const role = (await window.RJGDb.getCurrentUserRole()) || "";
      const r = role.toLowerCase();
      if (!r) { window.location.href = "../auth/log-sign.html"; return; }
      if (r !== "recruiter" && r !== "employer") { window.location.href = "../seeker/dashb.html"; }
      try { sessionStorage.setItem("rjgUserRole", r); localStorage.setItem("rjgUserRole", r); } catch (e) {}
    } catch (e) {
      console.error("Role check failed:", e);
    }
  }

  // ── Header menu toggle ──
  const headerMenuBtn = document.getElementById("headerMenuBtn");
  const headerMenuDropdown = document.getElementById("headerMenuDropdown");

  // ── Job detail back button (mirrors seeker dashb.js pattern) ──
  const sidebarJobBackBtn = document.getElementById("sidebarJobBackBtn");

  function enterDetailView() {
    document.body.classList.add("job-detail-open");
  }

  function exitDetailView() {
    document.body.classList.remove("job-detail-open");
  }

  if (sidebarJobBackBtn) {
    sidebarJobBackBtn.addEventListener("click", function () { closeJobDetail(); });
  }
  if (headerMenuBtn && headerMenuDropdown) {
    headerMenuBtn.addEventListener("click", function () {
      const isHidden = headerMenuDropdown.hidden;
      headerMenuDropdown.hidden = !isHidden;
      headerMenuBtn.setAttribute("aria-expanded", String(isHidden));
    });
    document.addEventListener("click", function (e) {
      if (!headerMenuBtn.contains(e.target) && !headerMenuDropdown.contains(e.target)) {
        headerMenuDropdown.hidden = true;
        headerMenuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ── Logout ──
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (window.showLogoutModal) { window.showLogoutModal(); return; }
      if (window.RJGDb && typeof window.RJGDb.resetClient === "function") {
        window.RJGDb.resetClient().then(function () { window.location.href = "../auth/log-sign.html"; });
      } else {
        window.location.href = "../auth/log-sign.html";
      }
    });
  }

  // ── State ──
  let postedJobs = [];
  const JOBS_PER_PAGE = 8;
  let currentPage = 1;
  let totalJobs = 0;
  let currentEditJobId = null;
  let pendingLocation = null;
  let pendingRate = null;
  let pendingSkills = [];
  let pendingImageFile = null;
  let pendingImageUrl = null; // Stores existing image URL when editing

  function notify(msg, type) {
    if (window.showAppToast) window.showAppToast(msg, type || "info");
  }

  // ── Load posted jobs from DB ──
  async function loadPostedJobs() {
    if (!window.RJGDb || typeof window.RJGDb.loadPostedJobs !== "function") return;
    try {
      const jobs = await window.RJGDb.loadPostedJobs();
      postedJobs = Array.isArray(jobs) ? jobs : [];
      totalJobs = postedJobs.length;
      currentPage = 1; // Reset to first page when loading jobs
    } catch (e) {
      console.error("Failed to load posted jobs:", e);
      postedJobs = [];
      totalJobs = 0;
      currentPage = 1;
    }
    renderGrid();
    updatePaginationUI();
  }

  // ── Render posted job cards ──
  function renderGrid() {
    const grid = document.getElementById("jp-grid");
    if (!grid) return;
    if (postedJobs.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;font-family:Inter,sans-serif;color:#666;padding:32px 0;">No jobs posted yet. Click <strong>Post Job</strong> to get started.</p>';
      return;
    }
    
    // Get current page jobs
    const currentPageJobs = getCurrentPageJobs();
    grid.innerHTML = currentPageJobs.map(function (job) {
      const thumb = job.image
        ? `<img src="${job.image}" alt="" style="width:100%;height:100%;object-fit:cover;">`
        : "";
      const isArchived = job.is_archived === true;
      const archivedClass = isArchived ? "jp-card--archived" : "";
      const jobTitle = isArchived ? "Removed by the Admin" : (job.title || "Untitled");
      const ariaLabel = isArchived ? `Removed job: ${job.title || "Untitled"}` : job.title;
      
      if (isArchived) {
        return `<div class="jp-card jp-card--archived" data-id="${job.id}" tabindex="0" role="button" aria-label="${ariaLabel}">
          <div class="jp-thumb">
            ${thumb}
            <div class="jp-card-archived-overlay">
              <p class="jp-card-archived-text">This job is hidden to others because it is removed by the admin</p>
            </div>
          </div>
          <p class="jp-card-title jp-card-title--archived">${job.title || "Untitled"}</p>
          <p class="jp-card-desc">${job.category || ""} · ${job.schedule || ""}</p>
        </div>`;
      } else {
        return `<div class="jp-card" data-id="${job.id}" tabindex="0" role="button" aria-label="${ariaLabel}">
          <div class="jp-thumb">${thumb}</div>
          <p class="jp-card-title">${jobTitle}</p>
          <p class="jp-card-desc">${job.category || ""} · ${job.schedule || ""}</p>
        </div>`;
      }
    }).join("");
    grid.querySelectorAll(".jp-card").forEach(function (card) {
      card.addEventListener("click", function () { openJobDetail(card.dataset.id); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openJobDetail(card.dataset.id); }
      });
    });
  }

  // ── Pagination Helper Functions ──
  function getCurrentPageJobs() {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    return postedJobs.slice(startIndex, endIndex);
  }

  function updatePaginationUI() {
    const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);
    
    // Header pagination
    const headerPagination = document.getElementById('jpHeaderPagination');
    const headerPaginationText = document.getElementById('jpPaginationText');
    const headerPrevBtn = document.getElementById('jpPrevPageBtn');
    const headerNextBtn = document.getElementById('jpNextPageBtn');
    
    // Footer pagination
    const footerPagination = document.getElementById('jpPagination');
    const footerPaginationText = document.getElementById('jpPaginationFooterText');
    const footerPrevBtn = document.getElementById('jpPrevPageFooterBtn');
    const footerNextBtn = document.getElementById('jpNextPageFooterBtn');
    
    if (totalJobs <= JOBS_PER_PAGE) {
      // Hide both pagination controls
      if (headerPagination) headerPagination.hidden = true;
      if (footerPagination) footerPagination.hidden = true;
      return;
    }
    
    // Show both pagination controls
    if (headerPagination) {
      headerPagination.hidden = false;
      if (headerPaginationText) headerPaginationText.textContent = `Page ${currentPage} of ${totalPages}`;
      if (headerPrevBtn) headerPrevBtn.disabled = currentPage === 1;
      if (headerNextBtn) headerNextBtn.disabled = currentPage === totalPages;
    }
    
    if (footerPagination) {
      footerPagination.hidden = false;
      if (footerPaginationText) footerPaginationText.textContent = `Page ${currentPage} of ${totalPages}`;
      if (footerPrevBtn) footerPrevBtn.disabled = currentPage === 1;
      if (footerNextBtn) footerNextBtn.disabled = currentPage === totalPages;
    }
  }

  function goToPage(page) {
    const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderGrid();
    updatePaginationUI();
  }

  // ── Job Detail Panel ──
  const jobDetailModal = document.getElementById("jobDetailModal");
  const jobDetailApplicantsBtn = document.getElementById("jobDetailApplicantsBtn");
  const jobDetailEditBtn = document.getElementById("jobDetailEditBtn");
  const jobDetailRemoveBtn = document.getElementById("jobDetailRemoveBtn");
  const jobDetailOpenToggle = document.getElementById("jobDetailOpenToggle");

  function openJobDetail(jobId) {
    enterDetailView();
    const job = postedJobs.find(function (j) { return String(j.id) === String(jobId); });
    if (!job || !jobDetailModal) return;
    currentEditJobId = jobId;
    document.getElementById("jobDetailTitle").textContent = job.title || "";
    document.getElementById("jobDetailPoster").textContent = job.posterName || job.company || "You";
    document.getElementById("jobDetailPostedAgo").textContent = job.postedAgo || "";
    document.getElementById("jobDetailSchedule").textContent = job.schedule || "";
    document.getElementById("jobDetailType").textContent = job.category || "";
    document.getElementById("jobDetailLocation").textContent = job.location || "";
    document.getElementById("jobDetailSalary").textContent = job.rate || "";
    document.getElementById("jobDetailSettings").textContent = job.type || "";
    document.getElementById("jobDetailDescription").textContent = job.description || "";
    const tags = document.getElementById("jobDetailTags");
    if (tags) tags.innerHTML = Array.isArray(job.skills) && job.skills.length
      ? job.skills.map(function (s) { return `<span class="job-detail-tag">${s}</span>`; }).join("")
      : "";
    const hero = jobDetailModal.querySelector(".job-detail-hero");
    if (hero) {
      const imageSrc = String(job.image || job.imageUrl || "").trim();
      hero.innerHTML = imageSrc
        ? `<img src="${imageSrc}" alt="" class="job-detail-hero-img" loading="eager" decoding="async">`
        : `<span class="job-detail-hero-no-image">No Image</span>`;
    }
    const ownerRow = document.getElementById("jobDetailOwnerOpenRow");
    if (ownerRow) {
      ownerRow.hidden = false;
      const toggle = document.getElementById("jobDetailOpenToggle");
      const stateText = document.getElementById("jobDetailOpenStateText");
      const isOpen = job.listingOpen !== false;
      if (toggle) toggle.setAttribute("aria-checked", String(isOpen));
      if (stateText) stateText.textContent = isOpen ? "Open" : "Closed";
    }

    const seekerActions = document.getElementById("jobDetailActionsSeeker");
    const ownerActions = document.getElementById("jobDetailActionsOwner");
    if (seekerActions) seekerActions.hidden = true;
    if (ownerActions) ownerActions.hidden = false;

    const reportBtn = document.getElementById("jobDetailReportBtn");
    if (reportBtn) reportBtn.hidden = true;

    // Remove button always stays visible for the recruiter
    if (jobDetailRemoveBtn) jobDetailRemoveBtn.hidden = false;
    // Hide edit and applicants buttons for admin-archived jobs
    const jobDetailEditBtn2 = document.getElementById("jobDetailEditBtn");
    if (jobDetailEditBtn2) jobDetailEditBtn2.hidden = !!job.is_archived;
    const jobDetailApplicantsBtn2 = document.getElementById("jobDetailApplicantsBtn");
    if (jobDetailApplicantsBtn2) jobDetailApplicantsBtn2.hidden = !!job.is_archived;

    // Show or hide the admin-archived notice banner
    let archivedNotice = document.getElementById("jobDetailArchivedNotice");
    if (job.is_archived) {
      if (!archivedNotice) {
        archivedNotice = document.createElement("div");
        archivedNotice.id = "jobDetailArchivedNotice";
        archivedNotice.style.cssText = [
          "margin:0 0 12px",
          "padding:11px 14px",
          "background:#fff3f3",
          "border:1.5px solid #f5c6c6",
          "border-radius:8px",
          "font-family:Inter,sans-serif",
          "font-size:13px",
          "font-weight:600",
          "color:#b91c1c",
          "display:flex",
          "align-items:flex-start",
          "gap:8px",
          "line-height:1.5"
        ].join(";");
        archivedNotice.innerHTML = "<span style='font-size:16px;flex-shrink:0;margin-top:1px'>&#128683;</span><span>This job is hidden to others because it is removed by the admin.</span>";
        const detailMeta = jobDetailModal.querySelector(".job-detail-meta");
        if (detailMeta) detailMeta.insertAdjacentElement("afterbegin", archivedNotice);
      }
      archivedNotice.hidden = false;
    } else {
      // Hide and remove the archived notice when job is unarchived
      if (archivedNotice) {
        archivedNotice.hidden = true;
        // Also remove it from DOM to ensure it's completely gone
        archivedNotice.remove();
      }
    }
    jobDetailModal.setAttribute("aria-hidden", "false");
    jobDetailModal.classList.add("open");
  }

  function closeJobDetail() {
    if (!jobDetailModal) return;
    jobDetailModal.setAttribute("aria-hidden", "true");
    jobDetailModal.classList.remove("open");
    currentEditJobId = null;
    exitDetailView();
  }

  if (jobDetailModal) {
    jobDetailModal.addEventListener("click", function (e) {
      if (e.target === jobDetailModal) closeJobDetail();
    });
  }

  if (jobDetailRemoveBtn) {
    jobDetailRemoveBtn.addEventListener("click", async function () {
      if (!currentEditJobId) return;
      if (typeof window.showAppConfirmModal === "function") {
        window.showAppConfirmModal({
          title: "Remove Job Posting",
          message: "Are you sure you want to remove this job posting? This action cannot be undone.",
          confirmLabel: "Remove",
          cancelLabel: "Cancel",
          danger: true,
          onConfirm: async function () {
            try {
              postedJobs = postedJobs.filter(function (j) { return String(j.id) !== String(currentEditJobId); });
              await window.RJGDb.savePostedJobs(postedJobs);
              notify("Job removed.", "success");
              closeJobDetail();
              renderGrid();
            } catch (e) {
              const rmMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, "Unable to remove this job. Please try again.")) || "Unable to remove this job. Please try again.";
              notify(rmMsg, "error");
              await loadPostedJobs();
            }
          }
        });
      }
    });
  }

  if (jobDetailOpenToggle) {
    jobDetailOpenToggle.addEventListener("click", async function () {
      if (!currentEditJobId || !window.RJGDb) return;
      const current = jobDetailOpenToggle.getAttribute("aria-checked") === "true";
      const next = !current;
      
      // Add loading state
      jobDetailOpenToggle.classList.add("loading");
      jobDetailOpenToggle.disabled = true;
      
      try {
        const job = postedJobs.find(function (j) { return String(j.id) === String(currentEditJobId); });
        if (job) job.listingOpen = next;
        await window.RJGDb.savePostedJobs(postedJobs);
        jobDetailOpenToggle.setAttribute("aria-checked", String(next));
        document.getElementById("jobDetailOpenStateText").textContent = next ? "Open" : "Closed";
      } catch (e) {
        const availMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, "Unable to update job availability. Please try again.")) || "Unable to update job availability. Please try again.";
        notify(availMsg, "error");
      } finally {
        // Remove loading state
        jobDetailOpenToggle.classList.remove("loading");
        jobDetailOpenToggle.disabled = false;
      }
    });
  }

  if (jobDetailApplicantsBtn) {
    jobDetailApplicantsBtn.addEventListener("click", function () {
      if (currentEditJobId) openApplicantsList(currentEditJobId);
    });
  }

  if (jobDetailEditBtn) {
    jobDetailEditBtn.addEventListener("click", function () {
      if (!currentEditJobId) return;
      const job = postedJobs.find(function (j) { return String(j.id) === String(currentEditJobId); });
      if (job) openPostJobModal(job);
    });
  }

  // ── Post / Edit Job Modal ──
  const postJobModal = document.getElementById("postJobModal");
  const closePostJobModal = document.getElementById("closePostJobModal");
  const jpCancelPostBtn = document.getElementById("jpCancelPostBtn");
  const jpSubmitPostBtn = document.getElementById("jpSubmitPostBtn");
  const jpJobName = document.getElementById("jpJobName");
  const jpCategory = document.getElementById("jpCategory");
  const jpSchedule = document.getElementById("jpSchedule");
  const jpType = document.getElementById("jpType");
  const jpDescription = document.getElementById("jpDescription");
  const jpIsUrgent = document.getElementById("jpIsUrgent");
  const jpPickedLocation = document.getElementById("jpPickedLocation");
  const jpPickedRate = document.getElementById("jpPickedRate");
  const jpPickedSkills = document.getElementById("jpPickedSkills");
  const jpPickedImage = document.getElementById("jpPickedImage");
  const jpJobImage = document.getElementById("jpJobImage");
  const openPostJobBtn = document.getElementById("openPostJobBtn");

  function parseExistingRate(rateText, fallbackCurrency, fallbackUnit, fallbackAmount) {
    const raw = String(rateText || "").trim();
    const amountMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)/);
    const currencyMatch = raw.match(/^([A-Za-z]{3})\s+/);
    const unitMatch = raw.match(/\/\s*([A-Za-z]+)/);
    return {
      amount: Number(
        fallbackAmount != null ? fallbackAmount : (amountMatch ? Number(amountMatch[1]) : 0)
      ) || 0,
      currency: String(fallbackCurrency || (currencyMatch ? currencyMatch[1].toUpperCase() : "PHP")),
      unit: String(fallbackUnit || (unitMatch ? unitMatch[1] : "Hour"))
    };
  }

  function openPostJobModal(editJob) {
    if (!postJobModal) return;
    pendingLocation = null; pendingRate = null; pendingSkills = []; pendingImageFile = null; pendingImageUrl = null;
    document.getElementById("jpModalTitle").textContent = editJob ? "Edit Job" : "Post a Job";
    if (jpSubmitPostBtn) jpSubmitPostBtn.textContent = editJob ? "Save" : "Post Job";
    if (jpJobName) jpJobName.value = editJob ? (editJob.title || "") : "";
    if (jpCategory) jpCategory.value = editJob ? (editJob.category || "") : "";
    if (jpSchedule) jpSchedule.value = editJob ? (editJob.schedule || "") : "";
    if (jpType) jpType.value = editJob ? (editJob.type || "") : "";
    if (jpDescription) jpDescription.value = editJob ? (editJob.description || "") : "";
    if (jpIsUrgent) jpIsUrgent.checked = editJob ? !!editJob.urgent : false;
    if (jpPickedLocation) jpPickedLocation.textContent = editJob && editJob.location ? editJob.location : "No location selected";
    if (jpPickedRate) jpPickedRate.textContent = editJob && editJob.rate ? editJob.rate : "No rate selected";
    if (jpPickedSkills) jpPickedSkills.textContent = editJob && Array.isArray(editJob.skills) && editJob.skills.length ? editJob.skills.join(", ") : "No skills selected";
    if (jpPickedImage) jpPickedImage.textContent = editJob && editJob.image ? "Image saved" : "No image selected";
    if (editJob) {
      currentEditJobId = editJob.id;
      if (editJob.location) pendingLocation = editJob.location;
      pendingRate = parseExistingRate(editJob.rate, editJob.rateCurrency, editJob.rateUnit, editJob.rateAmount);
      if (Array.isArray(editJob.skills)) pendingSkills = [...editJob.skills];
      if (editJob.image) pendingImageUrl = editJob.image;
    } else {
      currentEditJobId = null;
    }
    validatePostForm();
    postJobModal.classList.add("open");
  }

  function closePostJobModalFn() {
    if (postJobModal) postJobModal.classList.remove("open");
    if (jpSubmitPostBtn) jpSubmitPostBtn.textContent = "Post Job";
    // Keep selected detail job context if detail modal is still open.
    // This prevents Edit Info / Applied Users List buttons from becoming inactive
    // after closing the edit modal.
    if (!jobDetailModal || !jobDetailModal.classList.contains("open")) {
      currentEditJobId = null;
    }
  }

  if (openPostJobBtn) openPostJobBtn.addEventListener("click", function () { openPostJobModal(null); });
  if (closePostJobModal) closePostJobModal.addEventListener("click", closePostJobModalFn);
  if (jpCancelPostBtn) jpCancelPostBtn.addEventListener("click", closePostJobModalFn);
  if (postJobModal) postJobModal.addEventListener("click", function (e) { if (e.target === postJobModal) closePostJobModalFn(); });

  function validatePostForm() {
    if (!jpSubmitPostBtn) return;
    const valid = jpJobName && jpJobName.value.trim() !== "" &&
      jpCategory && jpCategory.value !== "" &&
      jpSchedule && jpSchedule.value !== "" &&
      jpType && jpType.value !== "" &&
      jpDescription && jpDescription.value.trim() !== "" &&
      pendingLocation && pendingLocation.trim() !== "" &&
      pendingRate && pendingRate.amount > 0 &&
      pendingSkills && pendingSkills.length > 0;
    jpSubmitPostBtn.disabled = !valid;
  }

  [jpJobName, jpCategory, jpSchedule, jpType, jpDescription].forEach(function (el) {
    if (el) el.addEventListener("input", validatePostForm);
    if (el && el.tagName === "SELECT") el.addEventListener("change", validatePostForm);
  });

  // Live input clamping for character limits
  if (jpJobName) {
    jpJobName.addEventListener("input", function () {
      clampInputValue(jpJobName, MAX_JOB_TITLE_LENGTH);
    });
  }
  if (jpDescription) {
    jpDescription.addEventListener("input", function () {
      clampInputValue(jpDescription, MAX_JOB_DESCRIPTION_LENGTH);
    });
  }

  if (jpSubmitPostBtn) {
    jpSubmitPostBtn.addEventListener("click", async function () {
      if (!window.RJGDb) { notify("Database not ready.", "error"); return; }
      const title = jpJobName.value.trim();
      const description = jpDescription ? jpDescription.value.trim() : "";

      // Validate character limits before saving
      if (title.length > MAX_JOB_TITLE_LENGTH) {
        notify(`Job title must be ${MAX_JOB_TITLE_LENGTH} characters or less.`, "warn");
        jpJobName.focus();
        return;
      }
      if (description.length > MAX_JOB_DESCRIPTION_LENGTH) {
        notify(`Job description must be ${MAX_JOB_DESCRIPTION_LENGTH} characters or less.`, "warn");
        jpDescription.focus();
        return;
      }

      // Validate required fields
      if (!title) { notify("Job title is required.", "warn"); jpJobName.focus(); return; }
      if (!jpCategory.value) { notify("Category is required.", "warn"); jpCategory.focus(); return; }
      if (!jpSchedule.value) { notify("Schedule is required.", "warn"); jpSchedule.focus(); return; }
      if (!jpType.value) { notify("Job type is required.", "warn"); jpType.focus(); return; }
      if (!description) { notify("Description is required.", "warn"); jpDescription.focus(); return; }
      if (!pendingLocation || !pendingLocation.trim()) { notify("Location is required. Click 'Set Location'.", "warn"); return; }
      if (!pendingRate || !pendingRate.amount) { notify("Rate is required. Click 'Set Rate'.", "warn"); return; }
      if (!pendingSkills || pendingSkills.length === 0) { notify("At least one skill is required. Click 'Set Skills'.", "warn"); return; }

      const jobData = {
        title,
        category: jpCategory.value,
        schedule: jpSchedule.value,
        type: jpType.value,
        description,
        urgent: jpIsUrgent ? jpIsUrgent.checked : false,
        location: pendingLocation || "",
        rate: pendingRate ? `${pendingRate.currency} ${pendingRate.amount}/${pendingRate.unit}` : "",
        rateAmount: pendingRate ? pendingRate.amount : null,
        rateCurrency: pendingRate ? pendingRate.currency : "PHP",
        rateUnit: pendingRate ? pendingRate.unit : "Hour",
        skills: pendingSkills,
        imageFile: pendingImageFile || null
      };
      jpSubmitPostBtn.disabled = true;
      try {
        const targetId = currentEditJobId || ("new-" + Date.now());
        console.log("[Save Job] Starting save, targetId:", targetId, "Edit mode:", !!currentEditJobId);
        console.log("[Save Job] pendingImageFile:", pendingImageFile ? "Yes" : "No", "pendingImageUrl:", pendingImageUrl);
        if (pendingImageFile && typeof window.RJGDb.uploadJobImage === "function") {
          try {
            console.log("[Save Job] Uploading new image...");
            jobData.image = await window.RJGDb.uploadJobImage(pendingImageFile, targetId);
            console.log("[Save Job] Image uploaded, URL:", jobData.image ? jobData.image.substring(0, 80) + "..." : "EMPTY");
          } catch (imgErr) {
            console.error("[Save Job] Image upload failed:", imgErr);
            const imgMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(imgErr, "Image upload failed. Please try again.")) || "Image upload failed. Please try again.";
            notify(imgMsg, "warn");
            jobData.image = pendingImageUrl || "";
          }
        } else {
          // Preserve existing image when editing and no new image selected
          jobData.image = pendingImageUrl || "";
          console.log("[Save Job] Using existing/pending image URL:", jobData.image ? "Yes" : "No");
        }
        const nextJobs = Array.isArray(postedJobs) ? postedJobs.map(function (j) { return Object.assign({}, j); }) : [];
        if (currentEditJobId) {
          const idx = nextJobs.findIndex(function (j) { return String(j.id) === String(currentEditJobId); });
          if (idx >= 0) {
            nextJobs[idx] = Object.assign({}, nextJobs[idx], jobData, { id: currentEditJobId });
          } else {
            nextJobs.unshift(Object.assign({ id: currentEditJobId }, jobData));
          }
        } else {
          nextJobs.unshift(Object.assign({ id: targetId }, jobData));
        }
        // Show confirmation before saving
        if (typeof window.showAppConfirmModal === "function") {
          window.showAppConfirmModal({
            title: currentEditJobId ? "Confirm Job Update" : "Confirm Job Post",
            message: currentEditJobId 
              ? "Are you sure you want to update this job posting?"
              : "Are you sure you want to post this job?",
            confirmLabel: currentEditJobId ? "Update" : "Post",
            cancelLabel: "Cancel",
            danger: false,
            onConfirm: async () => {
              try {
                await doSaveJob(nextJobs);
              } catch (err) {
                const saveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Unable to save this job. Please try again.")) || "Unable to save this job. Please try again.";
                notify(saveMsg, "error");
                jpSubmitPostBtn.disabled = false;
              }
            }
          });
        } else {
          await doSaveJob(nextJobs);
        }
        
        async function doSaveJob(nextJobsPayload) {
          await window.RJGDb.savePostedJobs(nextJobsPayload);
          postedJobs = nextJobsPayload;
          notify(currentEditJobId ? "Job updated successfully." : "Job posted successfully.", "success");
          closePostJobModalFn();
          await loadPostedJobs();
        }
      } catch (e) {
        const saveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, "Unable to save this job. Please try again.")) || "Unable to save this job. Please try again.";
        notify(saveMsg, "error");
        jpSubmitPostBtn.disabled = false;
      }
    });
  }

  // ── Location sub-modal ──
  const jpPickLocationBtn = document.getElementById("jpPickLocationBtn");
  const jpLocationModal = document.getElementById("jpLocationModal");
  const jpSaveLocationBtn = document.getElementById("jpSaveLocationBtn");
  const jpCancelLocationBtn = document.getElementById("jpCancelLocationBtn");

  if (jpPickLocationBtn) jpPickLocationBtn.addEventListener("click", function () { if (jpLocationModal) jpLocationModal.classList.add("open"); });
  if (jpCancelLocationBtn) jpCancelLocationBtn.addEventListener("click", function () { if (jpLocationModal) jpLocationModal.classList.remove("open"); });
  if (jpSaveLocationBtn) {
    jpSaveLocationBtn.addEventListener("click", function () {
      const unit = document.getElementById("jpLocationUnit")?.value.trim() || "";
      const street = document.getElementById("jpLocationStreet")?.value.trim() || "";
      
      // Get selected text from dropdowns
      const regionSelect = document.getElementById("jpLocationRegion");
      const provinceSelect = document.getElementById("jpLocationProvince");
      const citySelect = document.getElementById("jpLocationCity");
      const barangaySelect = document.getElementById("jpLocationBarangay");
      
      console.log("Debug - Region select:", regionSelect);
      console.log("Debug - Region value:", regionSelect?.value);
      console.log("Debug - Region selectedIndex:", regionSelect?.selectedIndex);
      
      const region = regionSelect?.options[regionSelect.selectedIndex]?.text || "";
      const province = provinceSelect?.options[provinceSelect.selectedIndex]?.text || "";
      const city = citySelect?.options[citySelect.selectedIndex]?.text || "";
      const barangay = barangaySelect?.options[barangaySelect.selectedIndex]?.text || "";
      
      console.log("Debug - Extracted values:", { region, province, city, barangay });
      
      // Validate that all location fields are selected
      if (!region || !province || !city || !barangay || barangay === "Select Barangay") {
        if (window.showAppToast) {
          window.showAppToast("Please select all location fields (Region, Province, City, and Barangay)", "warn");
        } else {
          console.error("Please select all location fields (Region, Province, City, and Barangay)");
        }
        return;
      }
      
      const country = document.getElementById("jpLocationCountry")?.value.trim() || "";
      const zip = document.getElementById("jpLocationZip")?.value.trim() || "";
      
      const parts = [unit, street, barangay, city, province, country, zip].filter(Boolean);
      pendingLocation = parts.join(", ") || null;
      
      console.log("Debug - Final location string:", pendingLocation);
      
      // Also store the structured location data
      pendingStructuredLocation = {
        unitNo: unit,
        street: street,
        region: region,
        province: province,
        city: city,
        barangay: barangay,
        country: country,
        zip: zip
      };
      
      console.log("Debug - Structured location:", pendingStructuredLocation);
      
      if (jpPickedLocation) jpPickedLocation.textContent = pendingLocation || "No location selected";
      if (jpLocationModal) jpLocationModal.classList.remove("open");
    });
  }

  // ── Rate sub-modal ──
  const jpPickRateBtn = document.getElementById("jpPickRateBtn");
  const jpRateModal = document.getElementById("jpRateModal");
  const jpSaveRateBtn = document.getElementById("jpSaveRateBtn");
  const jpCancelRateBtn = document.getElementById("jpCancelRateBtn");

  if (jpPickRateBtn) jpPickRateBtn.addEventListener("click", function () { if (jpRateModal) jpRateModal.classList.add("open"); });
  if (jpCancelRateBtn) jpCancelRateBtn.addEventListener("click", function () { if (jpRateModal) jpRateModal.classList.remove("open"); });
  if (jpSaveRateBtn) {
    jpSaveRateBtn.addEventListener("click", function () {
      const amount = Number(document.getElementById("jpRateAmount").value);
      const currency = document.getElementById("jpRateCurrency").value || "PHP";
      const unit = document.getElementById("jpRateUnit").value || "Hour";
      if (!amount || amount < 1) { notify("Please enter a valid rate amount.", "warn"); return; }
      pendingRate = { amount, currency, unit };
      if (jpPickedRate) jpPickedRate.textContent = `${currency} ${amount}/${unit}`;
      if (jpRateModal) jpRateModal.classList.remove("open");
    });
  }

  // ── Skills sub-modal ──
  const jpPickSkillsBtn = document.getElementById("jpPickSkillsBtn");
  const jpSkillsModal = document.getElementById("jpSkillsModal");
  const jpSaveSkillsBtn = document.getElementById("jpSaveSkillsBtn");
  const jpCancelSkillsBtn = document.getElementById("jpCancelSkillsBtn");
  const jpSkillsList = document.getElementById("jpSkillsList");
  const SKILLS = [
    "Communication and Teamwork","Problem Solving","Time Management","Adaptability","Leadership",
    "Critical Thinking","Microsoft Office (Word, Excel, PowerPoint)","Data Entry","Basic Programming","Web Development",
    "Graphic Design","Video Editing","UI/UX Design","Email Management","Scheduling",
    "Documentation","Customer Support","File Management","Writing","Photography",
    "Illustration / Drawing","Content Creation","Social Media Management","Cleaning","Cooking / Food Preparation",
    "Driving","Delivery / Logistics","Construction / Manual Labor","Heavy Lifting and Carrying", "Physical Stamina/Endurance",
    "Tutoring / Teaching","Baby / Pet Sitting","Sales","Marketing","Translation","Event Planning"
  ];

  function buildSkillsList() {
    if (!jpSkillsList) return;
    jpSkillsList.innerHTML = SKILLS.map(function (s) {
      const checked = pendingSkills.includes(s) ? "checked" : "";
      return `<label><input type="checkbox" value="${s}" ${checked}><span>${s}</span></label>`;
    }).join("");
  }

  if (jpPickSkillsBtn) jpPickSkillsBtn.addEventListener("click", function () { buildSkillsList(); if (jpSkillsModal) jpSkillsModal.classList.add("open"); });
  if (jpCancelSkillsBtn) jpCancelSkillsBtn.addEventListener("click", function () { if (jpSkillsModal) jpSkillsModal.classList.remove("open"); });
  if (jpSaveSkillsBtn) {
    jpSaveSkillsBtn.addEventListener("click", function () {
      pendingSkills = Array.from(jpSkillsList.querySelectorAll("input[type=checkbox]:checked")).map(function (cb) { return cb.value; });
      if (jpPickedSkills) jpPickedSkills.textContent = pendingSkills.length ? pendingSkills.join(", ") : "No skills selected";
      if (jpSkillsModal) jpSkillsModal.classList.remove("open");
    });
  }

  // ── Image picker ──
  if (jpJobImage) {
    jpJobImage.addEventListener("change", function () {
      const file = jpJobImage.files[0];
      if (!file) { pendingImageFile = null; if (jpPickedImage) jpPickedImage.textContent = "No image selected"; return; }
      if (file.size > 3 * 1024 * 1024) { notify("Image must be under 3MB.", "warn"); jpJobImage.value = ""; return; }
      pendingImageFile = file;
      if (jpPickedImage) jpPickedImage.textContent = file.name;
    });
  }

  // ── Applicants Modal ──
  const applicantsListModal = document.getElementById("applicantsListModal");
  const applicantsListBody = document.getElementById("applicantsListBody");
  const applicantsListCloseBtn = document.getElementById("applicantsListCloseBtn");
  let currentApplicantsJobId = null;
  let applicantsByTab = { pending: [], accepted: [], rejected: [] };
  let activeApplicantsTab = "pending";

  if (applicantsListCloseBtn) applicantsListCloseBtn.addEventListener("click", function () { if (applicantsListModal) applicantsListModal.classList.remove("open"); });

  async function openApplicantsList(jobId) {
    if (!applicantsListModal) return;
    currentApplicantsJobId = jobId;
    const job = postedJobs.find(function (j) { return String(j.id) === String(jobId); });
    const titleEl = document.getElementById("applicantsListJobTitle");
    if (titleEl) titleEl.textContent = job ? job.title : "";
    applicantsByTab = { pending: [], accepted: [], rejected: [] };
    activeApplicantsTab = "pending";
    applicantsListModal.classList.add("open");
    renderApplicantsTab("pending");
    if (window.RJGDb && typeof window.RJGDb.listApplicantsForJob === "function") {
      try {
        const list = await window.RJGDb.listApplicantsForJob(jobId);
        if (Array.isArray(list)) {
          list.forEach(function (a) {
            const status = (a.applicationStatus || a.status || "pending").toLowerCase();
            if (applicantsByTab[status]) applicantsByTab[status].push(a);
            else applicantsByTab.pending.push(a);
          });
        }
      } catch (e) {
        console.error("Failed to load applicants:", e);
      }
      updateApplicantTabCounts();
      renderApplicantsTab(activeApplicantsTab);
    }
  }

  function updateApplicantTabCounts() {
    ["pending","accepted","rejected"].forEach(function (tab) {
      const btn = document.querySelector(`[data-applicants-tab="${tab}"] .applicants-tab-count`);
      if (btn) btn.textContent = applicantsByTab[tab].length;
    });
  }

  function renderApplicantsTab(tab) {
    if (!applicantsListBody) return;
    const list = applicantsByTab[tab] || [];
    if (list.length === 0) {
      applicantsListBody.innerHTML = `<li class="applicants-list-empty">No ${tab} applicants.</li>`;
      return;
    }
    applicantsListBody.innerHTML = list.map(function (a) {
      return `<li class="applicants-list-item">
        <div class="applicants-list-row">
          <div class="applicants-list-main">
            <div class="applicants-list-name">${a.name || a.applicantName || "Applicant"}</div>
            <div class="applicants-list-line applicants-list-email">${a.email || a.applicantEmail || ""}</div>
            <span class="applicants-list-status applicants-list-status--${tab}">${tab}</span>
          </div>
          <button type="button" class="applicants-view-resume-btn" data-applicant-id="${a.applicantId}" data-job-id="${currentApplicantsJobId}">View Resume</button>
        </div>
      </li>`;
    }).join("");
    applicantsListBody.querySelectorAll(".applicants-view-resume-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { openResumeView(btn.dataset.applicantId, btn.dataset.jobId); });
    });
  }

  document.querySelectorAll("[data-applicants-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeApplicantsTab = btn.dataset.applicantsTab;
      document.querySelectorAll(".applicants-tab").forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected","false"); });
      btn.classList.add("is-active"); btn.setAttribute("aria-selected","true");
      renderApplicantsTab(activeApplicantsTab);
    });
  });

  // ── Resume View Modal ──
  const resumeViewModal = document.getElementById("resumeViewModal");
  const resumeViewCloseBtn = document.getElementById("resumeViewCloseBtn");
  const resumeViewAcceptBtn = document.getElementById("resumeViewAcceptBtn");
  const resumeViewRejectBtn = document.getElementById("resumeViewRejectBtn");
  const resumeViewTerminateBtn = document.getElementById("resumeViewTerminateBtn");
  const resumeViewReportBtn = document.getElementById("resumeViewReportBtn");
  let currentResumeApplicantId = null;
  let currentResumeJobId = null;
  let currentResumeTab = "pending";

  function setResumeButtons(tab) {
    const isPending = tab === "pending";
    const isAccepted = tab === "accepted";
    const isRejected = tab === "rejected";
    if (resumeViewAcceptBtn) resumeViewAcceptBtn.hidden = !isPending;
    if (resumeViewRejectBtn) resumeViewRejectBtn.hidden = !isPending;
    if (resumeViewTerminateBtn) resumeViewTerminateBtn.hidden = !isAccepted;
    if (resumeViewReportBtn) resumeViewReportBtn.hidden = !isRejected;
  }

  if (resumeViewCloseBtn) resumeViewCloseBtn.addEventListener("click", function () { if (resumeViewModal) resumeViewModal.classList.remove("open"); });

  function findApplicantFromTabs(applicantId) {
    const all = [].concat(applicantsByTab.pending, applicantsByTab.accepted, applicantsByTab.rejected);
    return all.find(function (a) { return String(a.applicantId) === String(applicantId); }) || null;
  }

  async function openResumeView(applicantId, jobId) {
    if (!resumeViewModal) return;
    currentResumeApplicantId = applicantId;
    currentResumeJobId = jobId;
    const nameEl = document.getElementById("resumeViewApplicantName");
    const bodyEl = document.getElementById("resumeViewBody");
    const applicant = findApplicantFromTabs(applicantId);
    const tab = applicantsByTab.accepted.find(function (a) { return String(a.applicantId) === String(applicantId); }) ? "accepted"
      : applicantsByTab.rejected.find(function (a) { return String(a.applicantId) === String(applicantId); }) ? "rejected"
      : "pending";
    currentResumeTab = tab;
    setResumeButtons(tab);
    resumeViewModal.classList.add("open");
    if (applicant) {
      const profile = applicant.resumeProfile || {};
      if (nameEl) nameEl.innerHTML = applicant.name || profile.name || "Applicant";
      if (bodyEl) bodyEl.innerHTML = buildResumeHTML(profile, applicant.email || "");
    } else {
      if (nameEl) nameEl.textContent = "Applicant";
      if (bodyEl) bodyEl.innerHTML = "<p>Could not load resume.</p>";
    }
  }

  
  
  
  function buildResumeHTML(p, email) {
    const esc = function (s) { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
    const section = function (title, content) {
      return content ? `<div class="resume-view-block"><p class="resume-view-section-title">${esc(title)}</p>${content}</div>` : "";
    };
    const row = function (label, value) {
      return value ? `<div class="resume-view-dl"><span class="resume-view-dl-label">${esc(label)}</span> ${esc(value)}</div>` : "";
    };

    const addr = p.address && typeof p.address === "object" ? p.address : {};
    const addrParts = [addr.unitNo, addr.street, addr.barangay, addr.city, addr.province, addr.country, addr.zip].filter(Boolean).map(String);
    const addrStr = addrParts.join(", ");

    const avatarImg = p.avatarUrl
      ? `<div class="resume-view-avatar-wrap"><img src="${esc(p.avatarUrl)}" alt="Applicant profile picture" class="resume-view-avatar"></div>`
      : "";

    const contactLines = [
      row("Email", email),
      row("Phone", p.phone),
      row("Address", addrStr)
    ].filter(Boolean).join("");
    const contact = contactLines ? section("Contact", contactLines) : "";

    const personalLines = [
      row("Birth Date", p.birthDate),
      row("Sex", p.sex),
      row("Education Level", p.educationStatus)
    ].filter(Boolean).join("");
    const personal = personalLines ? section("Personal Info", personalLines) : "";

    const desc = p.description ? section("About", `<p class="resume-view-p">${esc(p.description)}</p>`) : "";

    // Valid Documents section — only show if verified by admin
    const validDocuments = [];
    if (p.id_url && p.id_status === 'verified') {
      validDocuments.push(`<li class="resume-view-li"><a href="${esc(p.id_url)}" target="_blank" rel="noopener noreferrer">📄 Valid ID <span style="color:#1a7a35;font-size:11px;font-weight:600;">✔ Verified</span></a></li>`);
    }
    if (p.cert_url && p.cert_status === 'verified') {
      validDocuments.push(`<li class="resume-view-li"><a href="${esc(p.cert_url)}" target="_blank" rel="noopener noreferrer">📜 Certificate <span style="color:#1a7a35;font-size:11px;font-weight:600;">✔ Verified</span></a></li>`);
    }
    const documents = validDocuments.length 
      ? section("Valid Documents", `<ul class="resume-view-ul">${validDocuments.join("")}</ul>`) : "";

    const work = Array.isArray(p.workExperiences) && p.workExperiences.length
      ? section("Work Experience", p.workExperiences.map(function (w) {
          return `<div class="resume-view-dl"><span class="resume-view-dl-label">${esc(w.positionName || "")}</span> at ${esc(w.companyName || "")} ${esc(w.startYear || "")}–${esc(w.endYear || "")}</div>`;
        }).join("")) : "";

    const edu = Array.isArray(p.educationBackgrounds) && p.educationBackgrounds.length
      ? section("Education", p.educationBackgrounds.map(function (e) {
          return `<div class="resume-view-dl"><span class="resume-view-dl-label">${esc(e.schoolName || "")}</span> ${esc(e.program || "")} ${esc(e.startYear || "")}–${esc(e.endYear || "")}</div>`;
        }).join("")) : "";

    const skills = Array.isArray(p.skills) && p.skills.length
      ? section("Skills", `<ul class="resume-view-ul resume-view-ul--inline">${p.skills.map(function (s) { return `<li class="resume-view-li">${esc(s)}</li>`; }).join("")}</ul>`) : "";

    const languages = Array.isArray(p.languages) && p.languages.length
      ? section("Languages", `<ul class="resume-view-ul resume-view-ul--inline">${p.languages.map(function (l) {
          const label = l && typeof l === "object" ? [l.language, l.level].filter(Boolean).join(" – ") : String(l || "");
          return `<li class="resume-view-li">${esc(label)}</li>`;
        }).join("")}</ul>`) : "";

    const personality = Array.isArray(p.personality) && p.personality.length
      ? section("Personality", `<ul class="resume-view-ul resume-view-ul--inline">${p.personality.map(function (t) { return `<li class="resume-view-li">${esc(t)}</li>`; }).join("")}</ul>`) : "";

    const links = Array.isArray(p.profileLinks) && p.profileLinks.length
      ? section("Profile Links", `<ul class="resume-view-ul">${p.profileLinks.map(function (l) { return `<li class="resume-view-li"><a href="${esc(l)}" target="_blank" rel="noopener noreferrer">${esc(l)}</a></li>`; }).join("")}</ul>`) : "";

    return avatarImg + contact + personal + desc + documents + work + edu + skills + languages + personality + links
      || "<p class='resume-view-p resume-view-empty'>No resume data available.</p>";
  }

  async function updateApplicantStatus(status) {
    if (!currentResumeApplicantId || !currentResumeJobId) return;
    if (!window.RJGDb || typeof window.RJGDb.updateApplicationStatus !== "function") { notify("Function not available.", "error"); return; }
    try {
      await window.RJGDb.updateApplicationStatus(currentResumeJobId, currentResumeApplicantId, status);
      notify(`Applicant ${status}.`, "success");
      if (resumeViewModal) resumeViewModal.classList.remove("open");
      await openApplicantsList(currentApplicantsJobId);
    } catch (e) {
      const applMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, `Unable to ${status} this applicant. Please try again.`)) || `Unable to ${status} this applicant. Please try again.`;
      notify(applMsg, "error");
    }
  }

  function confirmAndUpdateStatus(status, title, message) {
    if (typeof window.showAppConfirmModal === "function") {
      window.showAppConfirmModal({
        title: title,
        message: message,
        confirmLabel: status.charAt(0).toUpperCase() + status.slice(1),
        cancelLabel: "Cancel",
        danger: status === "rejected" || status === "terminated",
        onConfirm: () => updateApplicantStatus(status)
      });
    } else {
      updateApplicantStatus(status);
    }
  }

  if (resumeViewAcceptBtn) resumeViewAcceptBtn.addEventListener("click", function () { 
    confirmAndUpdateStatus("accepted", "Accept Applicant?", "Are you sure you want to accept this applicant?");
  });
  if (resumeViewRejectBtn) resumeViewRejectBtn.addEventListener("click", function () { 
    confirmAndUpdateStatus("rejected", "Reject Applicant?", "Are you sure you want to reject this applicant? This action cannot be undone.");
  });
  if (resumeViewTerminateBtn) resumeViewTerminateBtn.addEventListener("click", function () { 
    confirmAndUpdateStatus("terminated", "Terminate Applicant?", "Are you sure you want to terminate this applicant? This action cannot be undone.");
  });

  // ── Resume Report Handler ──
  const resumeReportReasons = [
    'Misleading Responsibilities',
    'Suspicious Behavior',
    'Identity Theft',
    'Malicious Content',
    'Spam or Duplicate'
  ];

  function ensureResumeReportModal() {
    let overlay = document.getElementById('resumeReportReasonModal');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'resumeReportReasonModal';
    overlay.className = 'jp-submodal-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    const options = resumeReportReasons
      .map(
        (reason, idx) => `<label class="resume-report-option">
              <input type="radio" name="resumeReportReason" value="${reason}" ${idx === 0 ? '' : ''}>
              <span>${reason}</span>
            </label>`
      )
      .join('');
    overlay.innerHTML = `<div class="jp-submodal jp-submodal--resume-report" role="dialog" aria-modal="true" aria-labelledby="resumeReportTitle">
          <h3 id="resumeReportTitle">Report Resume</h3>
          <p class="resume-report-subtitle">Select a reason for reporting this resume:</p>
          <div class="resume-report-options">${options}</div>
          <div class="jp-submodal-actions">
            <button type="button" class="jp-modal-btn jp-modal-btn--cancel" id="resumeReportCancelBtn">Cancel</button>
            <button type="button" class="jp-modal-btn jp-modal-btn--report" id="resumeReportSubmitBtn">Submit Report</button>
          </div>
        </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeResumeReportModal() {
    const overlay = document.getElementById('resumeReportReasonModal');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function openResumeReportModal(displayName) {
    const overlay = ensureResumeReportModal();
    const sub = overlay.querySelector('.resume-report-subtitle');
    if (sub) sub.textContent = `Select a reason for reporting ${displayName}'s resume:`;
    overlay.querySelectorAll('input[name="resumeReportReason"]').forEach(input => {
      input.checked = false;
    });
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  if (resumeViewReportBtn) {
    resumeViewReportBtn.addEventListener('click', function () {
      const applicant = currentResumeApplicantId 
        ? findApplicantFromTabs(currentResumeApplicantId) 
        : null;
      if (applicant) {
        openResumeReportModal(applicant.resumeProfile?.name || applicant.applicantName || 'Applicant');
      }
    });
  }

  // Handle resume report modal submission
  const resumeReportModal = ensureResumeReportModal();
  if (resumeReportModal) {
    resumeReportModal.addEventListener('click', async e => {
      if (e.target === resumeReportModal) return;
      const cancelBtn = e.target.closest('#resumeReportCancelBtn');
      if (cancelBtn) {
        closeResumeReportModal();
        return;
      }
      const submitBtn = e.target.closest('#resumeReportSubmitBtn');
      if (submitBtn) {
        const selected = resumeReportModal.querySelector('input[name="resumeReportReason"]:checked');
        if (!selected) {
          notify('Please select a report reason first.', 'warn');
          return;
        }
        if (currentResumeApplicantId && currentResumeJobId) {
          // Submit resume report to database
          if (window.RJGDb && typeof window.RJGDb.submitReport === 'function') {
            try {
              await window.RJGDb.submitReport({
                targetType: 'resume',
                targetJobId: null,
                targetUserId: currentResumeApplicantId,
                reason: selected.value
              });
              notify(`Resume reported: ${selected.value}.`, 'info');
            } catch (err) {
              console.warn('Failed to submit resume report to DB:', err);
              notify('Report submitted locally but database save failed.', 'warn');
            }
          } else {
            notify('Database function not available.', 'error');
          }
          closeResumeReportModal();
        }
      }
    });
  }

  // ── Init ──
  async function init() {
    await enforceRecruiter();
    await loadPostedJobs();
  }

  init();

  // Update menu notification indicator with unread count
  (function updateMenuNotificationIndicator() {
    async function refreshMenuIndicator() {
      const indicator = document.getElementById('menuNotificationIndicator');
      if (!indicator || !window.RJGDb || typeof window.RJGDb.countUnreadNotifications !== 'function') return;
      try {
        const count = await window.RJGDb.countUnreadNotifications();
        if (count > 0) {
          indicator.hidden = false;
        } else {
          indicator.hidden = true;
        }
      } catch (e) {
        console.warn('Failed to update menu notification indicator:', e);
      }
    }

    // Update immediately
    refreshMenuIndicator();
    
    // Update every 30 seconds
    setInterval(refreshMenuIndicator, 30000);
    
    // Update when page becomes visible again
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        refreshMenuIndicator();
      }
    });
  })();

  // ── Pagination Event Listeners ──
  // Header pagination buttons
  const jpPrevPageBtn = document.getElementById('jpPrevPageBtn');
  const jpNextPageBtn = document.getElementById('jpNextPageBtn');
  
  if (jpPrevPageBtn) {
    jpPrevPageBtn.addEventListener('click', function () {
      goToPage(currentPage - 1);
    });
  }
  
  if (jpNextPageBtn) {
    jpNextPageBtn.addEventListener('click', function () {
      goToPage(currentPage + 1);
    });
  }
  
  // Footer pagination buttons
  const jpPrevPageFooterBtn = document.getElementById('jpPrevPageFooterBtn');
  const jpNextPageFooterBtn = document.getElementById('jpNextPageFooterBtn');
  
  if (jpPrevPageFooterBtn) {
    jpPrevPageFooterBtn.addEventListener('click', function () {
      goToPage(currentPage - 1);
    });
  }
  
  if (jpNextPageFooterBtn) {
    jpNextPageFooterBtn.addEventListener('click', function () {
      goToPage(currentPage + 1);
    });
  }

  // Initial load of posted jobs
  loadPostedJobs();
})();