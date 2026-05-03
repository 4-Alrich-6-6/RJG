(function () {
  const backBtn = document.getElementById("profileBackBtn");
  const profileMainEl = document.querySelector(".profile-main");
  const profileHeroEl = document.querySelector(".profile-hero");
  const profileAvatarEl = document.getElementById("profileAvatar");
  const profileNameEl = document.querySelector(".profile-name");
  const profileEmailEl = document.querySelector(".profile-contact .profile-contact-info:nth-child(1)");
  const profileAddressEl = document.querySelector(".profile-contact .profile-contact-info:nth-child(2) span");
  const profilePhoneEl = document.querySelector(".profile-contact .profile-contact-info:nth-child(3) span");
  const profileDescriptionEl = document.querySelector(".profile-description");
  const profileDescriptionSectionEl = document.querySelector(".profile-block--full");
  const profileValidDocumentsSectionEl = document.querySelector(".seeker-only");
  const profileEducationSectionEl = document.querySelector(".profile-section--education");
  const profileTimelineEl = document.querySelector(".profile-timeline");
  const profileWorkSectionEl = document.querySelector(".profile-section--work");
  const profileLinksSectionEl = document.querySelector(".profile-section--links");
  const profilePersonalSectionEl = document.querySelector(".profile-section--personal");
  const profileCompetenciesSectionEl = document.querySelector(".profile-section--competencies");
  const profileLinksEl = document.querySelector(".profile-section--links .profile-empty");
  const personalDetailRows = document.querySelectorAll(".profile-section--personal .profile-dl > div dd");
  const languageListEl = document.querySelector(".profile-bullets--languages");
  const personalityListEl = document.querySelector(".profile-competency-group:nth-child(3) .profile-bullets");
  const skillsListEl = document.querySelector(".profile-competency-group:nth-child(4) .profile-bullets");
  let currentViewerRole = "";
  if (profileMainEl) profileMainEl.classList.add("profile-main--loading");

  const editModal = document.getElementById("profileEditModal");
  const editModalTitle = document.getElementById("profileEditModalTitle");
  const editModalBody = document.getElementById("profileEditModalBody");
  const editModalSave = document.getElementById("profileEditModalSave");
  const editModalCancel = document.getElementById("profileEditModalCancel");
  const editModalClose = document.getElementById("profileEditModalClose");

  let currentEditSection = "";
  const languageOptions = [
    "English",
    "Filipino / Tagalog",
    "Cebuano",
    "Ilocano",
    "Hiligaynon",
    "Bicolano",
    "Chinese (Mandarin)",
    "Spanish",
    "Japanese",
    "Korean",
    "Arabic",
    "French",
    "German",
    "Hindi",
    "Malay / Indonesian",
    "Other"
  ];
  const languageLevels = ["Native", "Fluent", "Intermediate", "Basic"];
  const skillOptions = [
    "Communication and Teamwork",
    "Problem Solving",
    "Time Management",
    "Adaptability",
    "Leadership",
    "Critical Thinking",
    "Microsoft Office (Word, Excel, PowerPoint)",
    "Data Entry",
    "Basic Programming",
    "Web Development",
    "Graphic Design",
    "Video Editing",
    "UI/UX Design",
    "Email Management",
    "Scheduling",
    "Documentation",
    "Customer Support",
    "File Organization",
    "Writing",
    "Photography",
    "Illustration / Drawing",
    "Content Creation",
    "Social Media Management",
    "Cleaning",
    "Cooking / Food Preparation",
    "Driving",
    "Delivery / Logistics",
    "Construction / Manual Labor",
    "Heavy Lifting and Carrying",
    "Physical Stamina/Endurance",
    "Tutoring / Teaching",
    "Baby / Pet Sitting",
    "Sales",
    "Marketing",
    "Translation",
    "Event Planning"
  ];
  const personalityOptions = [
    "Hardworking",
    "Responsible",
    "Team Player",
    "Adaptable",
    "Organized",
    "Detail-Oriented",
    "Self-Motivated",
    "Reliable",
    "Creative",
    "Proactive",
    "Honest",
    "Confident"
  ];

  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || "info");
  }

  function getStoredProfileData() {
    try {
      const raw = localStorage.getItem("profileData");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveProfileData(data) {
    localStorage.setItem("profileData", JSON.stringify(data));
  }

  function isRecruiterLikeRole(role) {
    const roleValue = String(role || "").toLowerCase();
    return roleValue === "recruiter" || roleValue === "employer";
  }

  function readCachedRole() {
    try {
      return (
        sessionStorage.getItem("rjgUserRole") ||
        localStorage.getItem("rjgUserRole") ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  async function resolveCurrentRole() {
    // Always verify from the database — never trust only the cache.
    // This prevents a recruiter from being stuck in the seeker view due to a stale cached role.
    if (window.RJGDb && typeof window.RJGDb.getCurrentUserRole === "function") {
      try {
        const dbRole = (await window.RJGDb.getCurrentUserRole()) || "";
        if (dbRole) {
          // Sync cache with live DB value
          try {
            sessionStorage.setItem("rjgUserRole", dbRole);
            localStorage.setItem("rjgUserRole", dbRole);
          } catch (e) {}
          return dbRole;
        }
      } catch (error) {
        // DB unavailable — fall back to cache
      }
    }
    return readCachedRole();
  }

  function openNameEditModal(data) {
    const nameModal = document.getElementById('nameEditModal');
    const nameModalTitle = document.getElementById('nameEditModalTitle');
    const nameModalBody = document.getElementById('nameEditModalBody');
    
    if (!nameModal || !nameModalBody) return;
    
    const isRecruiter = isRecruiterLikeRole(currentViewerRole);
    
    if (isRecruiter) {
        // Recruiter: Single Company Name field
        nameModalTitle.textContent = "Edit Company Name";
        nameModalBody.innerHTML = `
            <div class="profile-edit-modal-field">
                <label for="companyNameInput">Company Name <span class="required">*</span></label>
                <input type="text" id="companyNameInput" required value="${data.firstName || data.name || ''}">
            </div>
        `;
    } else {
        // Seeker: Multiple name fields
        nameModalTitle.textContent = "Edit Name";
        nameModalBody.innerHTML = `
            <div class="profile-edit-modal-field">
                <label for="lastNameInput">Last Name <span class="required">*</span></label>
                <input type="text" id="lastNameInput" required value="${data.lastName || ''}">
            </div>
            <div class="profile-edit-modal-field">
                <label for="firstNameInput">First Name <span class="required">*</span></label>
                <input type="text" id="firstNameInput" required value="${data.firstName || ''}">
            </div>
            <div class="profile-edit-modal-field">
                <label for="middleNameInput">Middle Name <span class="optional">(optional)</span></label>
                <input type="text" id="middleNameInput" value="${data.middleName || ''}">
            </div>
            <div class="profile-edit-modal-field">
                <label for="suffixInput">Suffix <span class="optional">(optional)</span></label>
                <input type="text" id="suffixInput" placeholder="e.g., Jr., Sr., III" value="${data.suffix || ''}">
            </div>
        `;
    }
    
    nameModal.hidden = false;
    nameModal.classList.add('open');
    nameModal.setAttribute('aria-hidden', 'false');
  }

  function closeNameEditModal() {
    const nameModal = document.getElementById('nameEditModal');
    if (nameModal) {
      nameModal.hidden = true;
      nameModal.classList.remove('open');
      nameModal.setAttribute('aria-hidden', 'true');
    }
  }

  function applyRoleScopedProfile(role) {
    currentViewerRole = String(role || "").toLowerCase();
    const isRecruiter = isRecruiterLikeRole(role);

    // Seeker-only sections: show for seeker, hide for recruiter
    if (profileHeroEl) profileHeroEl.style.display = isRecruiter ? "none" : "";
    if (profileDescriptionSectionEl) profileDescriptionSectionEl.style.display = isRecruiter ? "none" : "";
    if (profileValidDocumentsSectionEl) profileValidDocumentsSectionEl.style.display = isRecruiter ? "none" : "";
    if (profileEducationSectionEl) profileEducationSectionEl.style.display = isRecruiter ? "none" : "";
    if (profileWorkSectionEl) profileWorkSectionEl.style.display = isRecruiter ? "none" : "";
    if (profilePersonalSectionEl) profilePersonalSectionEl.style.display = isRecruiter ? "none" : "";
    if (profileCompetenciesSectionEl) profileCompetenciesSectionEl.style.display = isRecruiter ? "none" : "";
    if (profileLinksSectionEl) profileLinksSectionEl.style.display = isRecruiter ? "none" : "";

    // Show/hide edit buttons based on role
    document.querySelectorAll(".profile-edit-btn[data-edit]").forEach(function (btn) {
      const section = btn.getAttribute("data-edit");
      if (isRecruiter) {
        // Recruiter only edits name, address, phone, links — hide all others
        if (section !== "name" && section !== "address" && section !== "phone" && section !== "links") {
          btn.style.display = "none";
        } else {
          btn.style.display = "";
        }
      } else {
        // Seeker: show all edit buttons
        btn.style.display = "";
      }
    });

    // Recruiter card: show for recruiter, remove for seeker
    const existingRecruiterCard = profileMainEl && profileMainEl.querySelector("#recruiterProfileCard");
    if (!isRecruiter && existingRecruiterCard) {
      existingRecruiterCard.remove();
    }
  }

  function buildRecruiterLinksHTML(links) {
    if (!Array.isArray(links) || links.length === 0) return `<span class="recruiter-form-value">No links added yet.</span>`;
    const items = links
      .map(link => {
        const href = normalizeLinkHref(link);
        const label = String(link || "").trim();
        return `<li><a href="${href}" target="_blank" rel="noopener noreferrer" class="recruiter-form-link">${label}</a></li>`;
      })
      .join("");
    return `<ul class="recruiter-form-links-list">${items}</ul>`;
  }

  function renderRecruiterFormView(profileData) {
    if (!profileMainEl) return;
    let card = profileMainEl.querySelector("#recruiterProfileCard");
    if (!card) {
      card = document.createElement("section");
      card.id = "recruiterProfileCard";
      card.className = "recruiter-profile-card";
      profileMainEl.appendChild(card);
    }

    const linksHTML = buildRecruiterLinksHTML(profileData.profileLinks);
    card.innerHTML = `
      <h2 class="recruiter-profile-card-title">Recruiter Profile</h2>
      <div class="recruiter-form-rows">
        <div class="recruiter-form-row">
          <span class="recruiter-form-label">Name</span>
          <div class="recruiter-form-field">
            <button type="button" class="profile-edit-btn profile-edit-btn--inline" data-edit="name" aria-label="Edit name">
              <img src="../assets/images/Pencil.png" alt="Edit" class="profile-edit-icon">
            </button>
            <span class="recruiter-form-value">${profileData.name || "Not set"}</span>
          </div>
        </div>
        <div class="recruiter-form-row">
          <span class="recruiter-form-label">Email</span>
          <div class="recruiter-form-field">
            <span class="recruiter-form-value">${profileData.email || "Not set"}</span>
          </div>
        </div>
        <div class="recruiter-form-row">
          <span class="recruiter-form-label">Contact Number</span>
          <div class="recruiter-form-field">
            <button type="button" class="profile-edit-btn profile-edit-btn--inline" data-edit="phone" aria-label="Edit contact number">
              <img src="../assets/images/Pencil.png" alt="Edit" class="profile-edit-icon">
            </button>
            <span class="recruiter-form-value">${profileData.phone || "Not set"}</span>
          </div>
        </div>
        <div class="recruiter-form-row">
          <span class="recruiter-form-label">Address</span>
          <div class="recruiter-form-field">
            <button type="button" class="profile-edit-btn profile-edit-btn--inline" data-edit="address" aria-label="Edit address">
              <img src="../assets/images/Pencil.png" alt="Edit" class="profile-edit-icon">
            </button>
            <span class="recruiter-form-value">${formatAddress(profileData.address) || "Not set"}</span>
          </div>
        </div>
        <div class="recruiter-form-row">
          <span class="recruiter-form-label">Profile Links</span>
          <div class="recruiter-form-field recruiter-form-field--links">
            <button type="button" class="profile-edit-btn profile-edit-btn--inline" data-edit="links" aria-label="Edit profile links">
              <img src="../assets/images/Pencil.png" alt="Edit" class="profile-edit-icon">
            </button>
            <div class="recruiter-form-links">${linksHTML}</div>
          </div>
        </div>
      </div>
    `;
  }

  function formatAddress(address) {
    if (!address || typeof address !== "object") return "";
    return [address.unitNo, address.street, address.barangay, address.city, address.province, address.country]
      .filter(Boolean)
      .join(", ");
  }

  function formatBirthDate(raw) {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function buildListHTML(items, emptyText) {
    if (!Array.isArray(items) || items.length === 0) {
      return `<li>${emptyText}</li>`;
    }
    return items.map(item => `<li>${item}</li>`).join("");
  }

  function getDirectListItems(listEl) {
    if (!listEl) return [];
    if (typeof listEl.querySelectorAll === "function") {
      try {
        return Array.from(listEl.querySelectorAll(":scope > li"));
      } catch (error) {
        // Fallback for browsers without :scope support in querySelectorAll.
      }
    }
    return Array.from(listEl.children || []).filter(child => child.tagName === "LI");
  }

  function renderSeeMoreSection(listEl, limit) {
    if (!listEl || !listEl.parentElement) return;
    const parent = listEl.parentElement;
    const existingBtn = parent.querySelector(`.profile-see-more-btn[data-target-id="${listEl.dataset.seeMoreId || ""}"]`);
    const items = getDirectListItems(listEl);
    // Profile should always show full content; no see-more toggles.
    items.forEach((item, index) => {
      item.hidden = false;
    });
    if (existingBtn) existingBtn.remove();
  }

  function parseLines(value) {
    return String(value || "")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
  }

  function normalizeLinkHref(link) {
    const value = String(link || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  }

  function createMonthOptions(selectedMonth) {
    const months = [
      { val: "01", name: "January" }, { val: "02", name: "February" }, { val: "03", name: "March" },
      { val: "04", name: "April" }, { val: "05", name: "May" }, { val: "06", name: "June" },
      { val: "07", name: "July" }, { val: "08", name: "August" }, { val: "09", name: "September" },
      { val: "10", name: "October" }, { val: "11", name: "November" }, { val: "12", name: "December" }
    ];
    return months.map(m => `<option value="${m.val}" ${selectedMonth === m.val ? "selected" : ""}>${m.name}</option>`).join("");
  }

  function createEducationRow(entry) {
    const e = entry || {};
    const educationLevelOptions = [
      "Preschool",
      "Elementary School",
      "Junior High School",
      "Senior High School",
      "Vocational",
      "Technical Training",
      "Bachelor's Degree",
      "Master's Degree",
      "Doctoral Degree"
    ];
    const educationLevelMarkup = educationLevelOptions
      .map(option => `<option value="${option}" ${String(e.educationLevel || "") === option ? "selected" : ""}>${option}</option>`)
      .join("");
    return `<div class="profile-edit-modal-row profile-edit-education-row">
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>Education Level</label>
        <select data-name="educationLevel">
          <option value="">Select Education Level</option>
          ${educationLevelMarkup}
        </select>
      </div>
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>School Name</label>
        <input data-name="schoolName" type="text" value="${e.schoolName || ""}">
      </div>
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>Program / Strand / Course</label>
        <input data-name="program" type="text" value="${e.program || ""}">
      </div>
      <div class="profile-edit-modal-field date-group">
        <label>Start Date</label>
        <div class="profile-edit-date-group">
          <select data-name="startMonth">
            <option value="">Month</option>
            ${createMonthOptions(e.startMonth)}
          </select>
          <input data-name="startYear" type="text" placeholder="YYYY" inputmode="numeric" maxlength="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')" value="${e.startYear || ""}">
        </div>
      </div>
      <div class="profile-edit-modal-field date-group">
        <label>End Date</label>
        <div class="profile-edit-date-group">
          <select data-name="endMonth">
            <option value="">Month</option>
            ${createMonthOptions(e.endMonth)}
          </select>
          <input data-name="endYear" type="text" placeholder="YYYY" inputmode="numeric" maxlength="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')" value="${e.endYear || ""}">
        </div>
      </div>
      <div class="profile-edit-row-actions">
        <button type="button" class="profile-edit-row-remove" data-action="remove-row">Remove</button>
      </div>
    </div>`;
  }

  function createWorkRow(entry) {
    const w = entry || {};
    return `<div class="profile-edit-modal-row profile-edit-work-row">
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>Position Name</label>
        <input data-name="positionName" type="text" value="${w.positionName || ""}">
      </div>
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>Company Name</label>
        <input data-name="companyName" type="text" value="${w.companyName || ""}">
      </div>
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>Location</label>
        <input data-name="location" type="text" value="${w.location || ""}">
      </div>
      <div class="profile-edit-modal-field date-group">
        <label>Start Date</label>
        <div class="profile-edit-date-group">
          <select data-name="startMonth">
            <option value="">Month</option>
            ${createMonthOptions(w.startMonth)}
          </select>
          <input data-name="startYear" type="text" placeholder="YYYY" inputmode="numeric" maxlength="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')" value="${w.startYear || ""}">
        </div>
      </div>
      <div class="profile-edit-modal-field date-group">
        <label>End Date</label>
        <div class="profile-edit-date-group">
          <select data-name="endMonth">
            <option value="">Month</option>
            ${createMonthOptions(w.endMonth)}
          </select>
          <input data-name="endYear" type="text" placeholder="YYYY" inputmode="numeric" maxlength="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')" value="${w.endYear || ""}">
        </div>
      </div>
      <div class="profile-edit-row-actions">
        <button type="button" class="profile-edit-row-remove" data-action="remove-row">Remove</button>
      </div>
    </div>`;
  }

  function createLanguageEditRow(entry) {
    const lang = entry || {};
    const selectedLanguage = lang.language || "";
    const selectedLevel = lang.level || "";
    const languageSelectOptions = languageOptions
      .map(option => `<option value="${option}" ${selectedLanguage === option ? "selected" : ""}>${option}</option>`)
      .join("");
    const levelSelectOptions = languageLevels
      .map(option => `<option value="${option}" ${selectedLevel === option ? "selected" : ""}>${option}</option>`)
      .join("");
    const useCustomLanguage = selectedLanguage && !languageOptions.includes(selectedLanguage);

    return `<div class="profile-edit-modal-row profile-edit-language-row">
      <div class="profile-edit-modal-field">
        <label>Language</label>
        <select data-name="language">
          ${languageSelectOptions}
        </select>
        <input data-name="customLanguage" type="text" placeholder="Enter language" value="${useCustomLanguage ? selectedLanguage : ""}" style="${useCustomLanguage ? "" : "display:none;"}">
      </div>
      <div class="profile-edit-modal-field">
        <label>Level</label>
        <select data-name="level">
          <option value="">Select level</option>
          ${levelSelectOptions}
        </select>
      </div>
      <div class="profile-edit-row-actions">
        <button type="button" class="profile-edit-row-remove" data-action="remove-row">Remove</button>
      </div>
    </div>`;
  }

  function createCheckboxGroup(options, selectedItems, name) {
    return `<div class="profile-edit-modal-field profile-edit-modal-field--full">
      <label>${name}</label>
      <div class="profile-edit-modal-checkboxes" data-name="${name}">
        ${options
          .map(option => {
            const checked = Array.isArray(selectedItems) && selectedItems.includes(option);
            return `<label><input type="checkbox" value="${option}" ${checked ? "checked" : ""}><span>${option}</span></label>`;
          })
          .join("")}
      </div>
    </div>`;
  }

  function createProfileLinkEditRow(link) {
    const value = link || "";
    return `<div class="profile-edit-modal-row profile-edit-link-row">
      <div class="profile-edit-modal-field profile-edit-modal-field--full">
        <label>Profile Link</label>
        <input data-name="profileLink" type="text" placeholder="https://example.com" value="${value}">
      </div>
      <div class="profile-edit-row-actions">
        <button type="button" class="profile-edit-row-remove" data-action="remove-row">Remove</button>
      </div>
    </div>`;
  }

  function renderProfileFromStoredData() {
    const profileData = getStoredProfileData();
    if (!profileData || Object.keys(profileData).length === 0) return;

    if (profileNameEl) profileNameEl.textContent = profileData.name || "User";
    if (profileEmailEl) profileEmailEl.textContent = profileData.email || "No email set";
    if (profileAddressEl) profileAddressEl.textContent = formatAddress(profileData.address) || "No address set";
    if (profilePhoneEl) profilePhoneEl.textContent = profileData.phone || "No contact number";
    if (profileDescriptionEl) profileDescriptionEl.textContent = profileData.description || "No profile description added yet.";
    if (profileAvatarEl) {
      const avatarSrc = String(profileData.avatarUrl || "").trim();
      if (avatarSrc) {
        profileAvatarEl.src = avatarSrc;
      } else {
        profileAvatarEl.removeAttribute("src");
      }
      profileAvatarEl.onerror = function () {
        profileAvatarEl.removeAttribute("src");
      };
    }

    const recruiterView = isRecruiterLikeRole(currentViewerRole);
    if (recruiterView) {
      renderRecruiterFormView(profileData);
      return;
    }

    if (profileTimelineEl && !recruiterView) {
      if (Array.isArray(profileData.educationBackgrounds) && profileData.educationBackgrounds.length > 0) {
        profileTimelineEl.innerHTML = profileData.educationBackgrounds
          .map(edu => `<li>
            <span class="profile-meta">${edu.educationLevel || ""}</span>
            <strong class="profile-school-name">${edu.schoolName || "School"}</strong>
            <span class="profile-school-info">${edu.startYear || ""} — ${edu.endYear || ""} · ${edu.program || edu.educationLevel || ""}</span>
          </li>`)
          .join("");
      } else {
        profileTimelineEl.innerHTML = `<li><span class="profile-empty">No educational background added yet.</span></li>`;
      }
      renderSeeMoreSection(profileTimelineEl, 3);
    }

    if (profileWorkSectionEl && !recruiterView) {
      const oldWork = profileWorkSectionEl.querySelector(".profile-job");
      if (oldWork) oldWork.remove();
      const existingList = profileWorkSectionEl.querySelector(".profile-work-list");
      if (existingList) existingList.remove();
      if (Array.isArray(profileData.workExperiences) && profileData.workExperiences.length > 0) {
        profileWorkSectionEl.style.display = "";
        const list = document.createElement("ul");
        list.className = "profile-work-list";
        list.innerHTML = profileData.workExperiences
          .map(work => `<li class="profile-work-item">
              <strong class="profile-position-name">${work.positionName || "Position"}</strong>
              <span class="profile-work-period">${work.startYear || ""} — ${work.endYear || ""}</span>
              <span class="profile-work-org">${[work.companyName, work.location].filter(Boolean).join(" — ")}</span>
            </li>`)
          .join("");
        profileWorkSectionEl.appendChild(list);
        renderSeeMoreSection(list, 3);
      } else {
        profileWorkSectionEl.style.display = "";
        const list = document.createElement("ul");
        list.className = "profile-work-list";
        list.innerHTML = `<li class="profile-work-item"><span class="profile-empty">No work experience added yet.</span></li>`;
        profileWorkSectionEl.appendChild(list);
        renderSeeMoreSection(list, 3);
      }
    }

    if (profileLinksEl) {
      if (Array.isArray(profileData.profileLinks) && profileData.profileLinks.length > 0) {
        profileLinksEl.innerHTML = `
          <div class="profile-links-container">
            ${profileData.profileLinks
              .map(link => {
                const href = normalizeLinkHref(link);
                const label = String(link || "").trim();
                return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="profile-link-item">${label}</a>`;
              })
              .join("")}
          </div>
        `;
      } else {
        profileLinksEl.textContent = "No links added yet.";
      }
    }

    if (!recruiterView && personalDetailRows.length >= 3) {
      personalDetailRows[0].textContent = profileData.educationStatus || "Not set";
      personalDetailRows[1].textContent = formatBirthDate(profileData.birthDate) || "Not set";
      personalDetailRows[2].textContent = profileData.sex || "Not set";
    }

    if (languageListEl && !recruiterView) {
      const languageItems = Array.isArray(profileData.languages)
        ? profileData.languages.map(entry => `${entry.language} - ${entry.level}`)
        : [];
      languageListEl.innerHTML = buildListHTML(languageItems, "No languages added yet.");
      renderSeeMoreSection(languageListEl, 3);
    }

    if (personalityListEl && !recruiterView) {
      personalityListEl.innerHTML = buildListHTML(profileData.personality, "No personality traits added yet.");
      renderSeeMoreSection(personalityListEl, 3);
    }

    if (skillsListEl && !recruiterView) {
      skillsListEl.innerHTML = buildListHTML(profileData.skills, "No skills added yet.");
      renderSeeMoreSection(skillsListEl, 3);
    }
  }

  function field(label, name, value, type, attrs) {
    const inputType = type || "text";
    const extraAttrs = attrs ? Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join("") : "";
    if (inputType === "textarea") {
      return `<div class="profile-edit-modal-field"><label>${label}</label><textarea data-name="${name}">${value || ""}</textarea></div>`;
    }
    return `<div class="profile-edit-modal-field"><label>${label}</label><input data-name="${name}" type="${inputType}" value="${value || ""}"${extraAttrs}></div>`;
  }

  function selectField(label, name, value, options) {
    const optionMarkup = options
      .map(option => `<option value="${option}" ${String(value || "") === option ? "selected" : ""}>${option}</option>`)
      .join("");
    return `<div class="profile-edit-modal-field"><label>${label}</label><select data-name="${name}">${optionMarkup}</select></div>`;
  }

  function validateCurrentSection() {
    if (!currentEditSection || !editModalSave) return;
    let isValid = false;

    if (currentEditSection === "address") {
      const fields = ["unitNo", "street", "country", "zip"];
      const dropdowns = ["region", "province", "city", "barangay"];
      isValid = fields.every(f => getFieldValue(f).length > 0) && 
                 dropdowns.every(d => {
                   const select = document.getElementById(`editAddress${d.charAt(0).toUpperCase() + d.slice(1)}`);
                   return select && select.value && select.value !== "";
                 });
    } else if (currentEditSection === "phone") {
      const phoneValue = getFieldValue("phone");
      isValid = phoneValue.length === 11 && /^[0-9]+$/.test(phoneValue);
    } else if (currentEditSection === "description") {
      isValid = getFieldValue("description").length > 0;
    } else if (currentEditSection === "education") {
      const rows = editModalBody.querySelectorAll(".profile-edit-education-row");
      isValid = Array.from(rows).some(row => {
        const vals = ["educationLevel", "schoolName", "program", "startMonth", "startYear", "endMonth", "endYear"]
          .map(n => row.querySelector(`[data-name="${n}"]`)?.value.trim() || "");
        return vals.every(v => v.length > 0);
      });
    } else if (currentEditSection === "work") {
      const rows = editModalBody.querySelectorAll(".profile-edit-work-row");
      isValid = Array.from(rows).some(row => {
        const vals = ["positionName", "companyName", "location", "startMonth", "startYear", "endMonth", "endYear"]
          .map(n => row.querySelector(`[data-name="${n}"]`)?.value.trim() || "");
        return vals.every(v => v.length > 0);
      });
    } else if (currentEditSection === "links") {
      const links = Array.from(editModalBody.querySelectorAll(".profile-edit-link-row input[data-name='profileLink']"))
        .map(i => i.value.trim()).filter(Boolean);
      isValid = links.length > 0;
    } else if (currentEditSection === "personal") {
      isValid = ["educationStatus", "birthDate", "sex"].every(f => getFieldValue(f).length > 0);
    } else if (currentEditSection === "competencies") {
      const langRows = editModalBody.querySelectorAll(".profile-edit-language-row");
      const hasLang = Array.from(langRows).some(row => {
        const lang = row.querySelector('select[data-name="language"]')?.value || "";
        const custom = row.querySelector('input[data-name="customLanguage"]')?.value.trim() || "";
        const level = row.querySelector('select[data-name="level"]')?.value || "";
        const finalLang = lang === "Other" ? custom : lang;
        return finalLang.length > 0 && level.length > 0;
      });
      const hasPersonality = editModalBody.querySelectorAll('[data-name="Personality (Max 5)"] input[type="checkbox"]:checked').length > 0;
      const hasSkills = editModalBody.querySelectorAll('[data-name="Skills (Max 5)"] input[type="checkbox"]:checked').length > 0;
      isValid = hasLang && hasPersonality && hasSkills;
    }

    editModalSave.disabled = !isValid;
    editModalSave.style.opacity = isValid ? "1" : "0.5";
    editModalSave.style.cursor = isValid ? "pointer" : "not-allowed";
  }

  function attachValidationListeners() {
    const inputs = editModalBody.querySelectorAll("input, select, textarea");
    inputs.forEach(el => {
      el.addEventListener("input", validateCurrentSection);
      el.addEventListener("change", validateCurrentSection);
    });
    const addBtns = editModalBody.querySelectorAll(".profile-edit-row-add");
    addBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        setTimeout(validateCurrentSection, 0);
      });
    });
  }

  function openEditModal(section) {
    const data = getStoredProfileData();
    currentEditSection = section;
    editModalTitle.textContent = "Edit " + section.charAt(0).toUpperCase() + section.slice(1);

    if (section === "name") {
      openNameEditModal(data);
      return;
    } else if (section === "address") {
      const address = data.address || {};
      editModalBody.innerHTML = [
        field("Unit / No.", "unitNo", address.unitNo, "text", { 
          inputmode: "numeric", 
          pattern: "[0-9]*", 
          placeholder: "Unit number (numbers only)" 
        }),
        field("Street", "street", address.street),
        `<div class="profile-edit-field">
          <label>Region</label>
          <select id="editAddressRegion" data-name="region">
            <option value="">Select Region</option>
          </select>
        </div>`,
        `<div class="profile-edit-field">
          <label>Province</label>
          <select id="editAddressProvince" data-name="province" disabled>
            <option value="">Select Province</option>
          </select>
        </div>`,
        `<div class="profile-edit-field">
          <label>City</label>
          <select id="editAddressCity" data-name="city" disabled>
            <option value="">Select City</option>
          </select>
        </div>`,
        `<div class="profile-edit-field">
          <label>Barangay</label>
          <select id="editAddressBarangay" data-name="barangay" disabled>
            <option value="">Select Barangay</option>
          </select>
        </div>`,
        field("Country", "country", address.country),
        field("ZIP", "zip", address.zip, "number", { inputmode: "numeric", min: "0", max: "9999", maxlength: "4", placeholder: "e.g., 1000" })
      ].join("");
      
      // Load regions and set up cascading dropdowns
      initAddressCascadingDropdowns(address);
      
      // Set country to Philippines by default
      const countryInput = editModalBody.querySelector('[data-name="country"]');
      if (countryInput && !address.country) {
        countryInput.value = "Philippines";
      }
      
      // Add validation for unit number (numbers only)
      const unitInput = editModalBody.querySelector('[data-name="unitNo"]');
      if (unitInput) {
        unitInput.addEventListener('input', function(e) {
          // Remove non-numeric characters
          let value = e.target.value.replace(/\D/g, '');
          e.target.value = value;
        });
        
        unitInput.addEventListener('keypress', function(e) {
          // Only allow numbers (0-9)
          const char = String.fromCharCode(e.which);
          if (!/[0-9]/.test(char)) {
            e.preventDefault();
          }
        });
      }
      
      // Add validation for zip code (4 digits max)
      const zipInput = editModalBody.querySelector('[data-name="zip"]');
      if (zipInput) {
        zipInput.addEventListener('input', function(e) {
          // Remove non-numeric characters and limit to 4 digits
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 4) {
            value = value.substring(0, 4);
          }
          e.target.value = value;
        });
        
        zipInput.addEventListener('keypress', function(e) {
          // Only allow numbers (0-9)
          const char = String.fromCharCode(e.which);
          if (!/[0-9]/.test(char)) {
            e.preventDefault();
          }
        });
      }
    } else if (section === "phone") {
      editModalBody.innerHTML = field("Phone Number", "phone", data.phone, "tel", { 
        inputmode: "numeric", 
        pattern: "[0-9]{11}", 
        maxlength: "11", 
        placeholder: "Enter 11-digit number" 
      });
      
      // Add phone number validation
      const phoneInput = editModalBody.querySelector('[data-name="phone"]');
      if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
          // Remove non-numeric characters
          let value = e.target.value.replace(/\D/g, '');
          // Limit to 11 digits
          if (value.length > 11) {
            value = value.substring(0, 11);
          }
          e.target.value = value;
        });
        
        phoneInput.addEventListener('keypress', function(e) {
          // Only allow numbers (0-9)
          const char = String.fromCharCode(e.which);
          if (!/[0-9]/.test(char)) {
            e.preventDefault();
          }
        });
      }
    } else if (section === "description") {
      editModalBody.innerHTML = field("Profile Description", "description", data.description, "textarea");
    } else if (section === "education") {
      const rows = Array.isArray(data.educationBackgrounds) && data.educationBackgrounds.length > 0
        ? data.educationBackgrounds.map(createEducationRow).join("")
        : createEducationRow({});
      editModalBody.innerHTML = `
        <div id="profileEducationRows">${rows}</div>
        <button type="button" class="profile-edit-row-add" id="addEducationRowBtn">+ Add Education</button>
      `;
    } else if (section === "work") {
      const rows = Array.isArray(data.workExperiences) && data.workExperiences.length > 0
        ? data.workExperiences.map(createWorkRow).join("")
        : createWorkRow({});
      editModalBody.innerHTML = `
        <div id="profileWorkRows">${rows}</div>
        <button type="button" class="profile-edit-row-add" id="addWorkRowBtn">+ Add Work Experience</button>
      `;
    } else if (section === "links") {
      const rows = Array.isArray(data.profileLinks) && data.profileLinks.length > 0
        ? data.profileLinks.map(createProfileLinkEditRow).join("")
        : createProfileLinkEditRow("");
      editModalBody.innerHTML = `
        <div id="profileLinkRows">${rows}</div>
        <button type="button" class="profile-edit-row-add" id="addProfileLinkEditRowBtn">+ Add Link</button>
      `;
    } else if (section === "personal") {
      const educationStatusOptions = [
        "No Formal Education",
        "Elementary Level",
        "Elementary Graduate",
        "Junior High School Level",
        "Junior High School Graduate",
        "Senior High School Level",
        "Senior High School Graduate",
        "College Level",
        "College Graduate",
        "Vocational / Technical Graduate",
        "Postgraduate Level",
        "Postgraduate Graduate"
      ];
      const sexOptions = ["Male", "Female"];
      
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
      const maxDate = fifteenYearsAgo.toISOString().split("T")[0];

      editModalBody.innerHTML = [
        selectField("Education Status", "educationStatus", data.educationStatus, educationStatusOptions),
        field("Birth Date", "birthDate", data.birthDate, "date", { max: maxDate, placeholder: "YYYY-MM-DD" }),
        selectField("Sex", "sex", data.sex, sexOptions)
      ].join("");
    } else if (section === "competencies") {
      const languageRows = Array.isArray(data.languages) && data.languages.length > 0
        ? data.languages.map(createLanguageEditRow).join("")
        : createLanguageEditRow({ language: "English", level: "Intermediate" });
      editModalBody.innerHTML = `
        <div class="profile-edit-modal-field profile-edit-modal-field--full">
          <label>Languages</label>
          <div id="profileLanguagesRows">${languageRows}</div>
          <button type="button" class="profile-edit-row-add" id="addLanguageEditRowBtn">+ Add Language</button>
        </div>
        ${createCheckboxGroup(personalityOptions, data.personality || [], "Personality (Max 5)")}
        ${createCheckboxGroup(skillOptions, data.skills || [], "Skills (Max 5)")}
      `;
    } else {
      editModalBody.innerHTML = `<p class="profile-edit-modal-hint">This section is not editable yet.</p>`;
    }

    const addEducationRowBtn = editModalBody.querySelector("#addEducationRowBtn");
    if (addEducationRowBtn) {
      addEducationRowBtn.addEventListener("click", () => {
        const container = editModalBody.querySelector("#profileEducationRows");
        if (!container) return;
        container.insertAdjacentHTML("beforeend", createEducationRow({}));
        setTimeout(validateCurrentSection, 0);
      });
    }

    const addWorkRowBtn = editModalBody.querySelector("#addWorkRowBtn");
    if (addWorkRowBtn) {
      addWorkRowBtn.addEventListener("click", () => {
        const container = editModalBody.querySelector("#profileWorkRows");
        if (!container) return;
        container.insertAdjacentHTML("beforeend", createWorkRow({}));
        setTimeout(validateCurrentSection, 0);
      });
    }

    const addProfileLinkEditRowBtn = editModalBody.querySelector("#addProfileLinkEditRowBtn");
    if (addProfileLinkEditRowBtn) {
      addProfileLinkEditRowBtn.addEventListener("click", () => {
        const container = editModalBody.querySelector("#profileLinkRows");
        if (!container) return;
        container.insertAdjacentHTML("beforeend", createProfileLinkEditRow(""));
        attachRemoveRowHandlers();
        setTimeout(validateCurrentSection, 0);
      });
    }

    editModalBody.querySelectorAll('[data-action="remove-row"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".profile-edit-modal-row");
        if (row) row.remove();
        setTimeout(validateCurrentSection, 0);
      });
    });

    const addLanguageEditRowBtn = editModalBody.querySelector("#addLanguageEditRowBtn");
    if (addLanguageEditRowBtn) {
      addLanguageEditRowBtn.addEventListener("click", () => {
        const rows = editModalBody.querySelector("#profileLanguagesRows");
        if (!rows) return;
        rows.insertAdjacentHTML("beforeend", createLanguageEditRow({}));
        attachLanguageRowHandlers();
        attachRemoveRowHandlers();
        setTimeout(validateCurrentSection, 0);
      });
    }

    attachLanguageRowHandlers();
    attachRemoveRowHandlers();
    attachValidationListeners();
    validateCurrentSection();

    editModal.hidden = false;
  }

  function attachRemoveRowHandlers() {
    editModalBody.querySelectorAll('[data-action="remove-row"]').forEach(btn => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        const row = btn.closest(".profile-edit-modal-row");
        if (row) row.remove();
      });
    });
  }

  function attachLanguageRowHandlers() {
    editModalBody.querySelectorAll(".profile-edit-language-row").forEach(row => {
      const select = row.querySelector('select[data-name="language"]');
      const customInput = row.querySelector('input[data-name="customLanguage"]');
      if (!select || !customInput || select.dataset.bound === "1") return;
      select.dataset.bound = "1";
      select.addEventListener("change", () => {
        if (select.value === "Other") {
          customInput.style.display = "";
        } else {
          customInput.style.display = "none";
          customInput.value = "";
        }
      });
    });
  }

  function closeEditModal() {
    currentEditSection = "";
    editModal.hidden = true;
    editModalBody.innerHTML = "";
  }

  function getFieldValue(name) {
    const el = editModalBody.querySelector(`[data-name="${name}"]`);
    return el ? el.value.trim() : "";
  }

  async function saveModalChanges() {
    const data = getStoredProfileData();
    if (currentEditSection === "address") {
      // Get selected text from dropdowns
      const regionSelect = document.getElementById("editAddressRegion");
      const provinceSelect = document.getElementById("editAddressProvince");
      const citySelect = document.getElementById("editAddressCity");
      const barangaySelect = document.getElementById("editAddressBarangay");
      
      const region = regionSelect?.options[regionSelect.selectedIndex]?.text || "";
      const province = provinceSelect?.options[provinceSelect.selectedIndex]?.text || "";
      const city = citySelect?.options[citySelect.selectedIndex]?.text || "";
      const barangay = barangaySelect?.options[barangaySelect.selectedIndex]?.text || "";
      
      data.address = {
        unitNo: getFieldValue("unitNo"),
        street: getFieldValue("street"),
        region: region,
        barangay: barangay,
        city: city,
        province: province,
        country: getFieldValue("country"),
        zip: getFieldValue("zip")
      };
    } else if (currentEditSection === "phone") {
      data.phone = getFieldValue("phone");
    } else if (currentEditSection === "description") {
      const descriptionValue = getFieldValue("description");
      if (descriptionValue.length > 500) {
        notify("Description must be 500 characters or less.", "warn");
        return;
      }
      data.description = descriptionValue;
    } else if (currentEditSection === "education") {
      const parsedRows = Array.from(editModalBody.querySelectorAll(".profile-edit-education-row"))
        .map(row => {
          const educationLevel = row.querySelector('[data-name="educationLevel"]')?.value.trim() || "";
          const schoolName = row.querySelector('[data-name="schoolName"]')?.value.trim() || "";
          const program = row.querySelector('[data-name="program"]')?.value.trim() || "";
          const startMonth = row.querySelector('[data-name="startMonth"]')?.value.trim() || "";
          const startYear = row.querySelector('[data-name="startYear"]')?.value.trim() || "";
          const endMonth = row.querySelector('[data-name="endMonth"]')?.value.trim() || "";
          const endYear = row.querySelector('[data-name="endYear"]')?.value.trim() || "";
          return { educationLevel, schoolName, program, startMonth, startYear, endMonth, endYear };
        });
      const hasIncomplete = parsedRows.some(item => {
        const values = [item.educationLevel, item.schoolName, item.program, item.startMonth, item.startYear, item.endMonth, item.endYear];
        const hasAny = values.some(Boolean);
        const hasAll = values.every(Boolean);
        return hasAny && !hasAll;
      });
      if (hasIncomplete) {
        notify("Complete all Education Background fields before saving.", "warn");
        return;
      }
      // Validate max 2 education backgrounds
      if (parsedRows.length > 2) {
        notify("Maximum of 2 educational background entries allowed.", "warn");
        return;
      }
      // Validate start date < end date
      const hasInvalidDateRange = parsedRows.some(item => {
        if (!item.startYear || !item.endYear || !item.startMonth || !item.endMonth) return false;
        const startY = Number(item.startYear);
        const endY = Number(item.endYear);
        const startM = Number(item.startMonth);
        const endM = Number(item.endMonth);
        if (startY > endY) return true;
        if (startY === endY && startM > endM) return true;
        return false;
      });
      if (hasInvalidDateRange) {
        notify("Start date must be earlier than end date for all education entries.", "warn");
        return;
      }
      data.educationBackgrounds = parsedRows.filter(item =>
        [item.educationLevel, item.schoolName, item.program, item.startYear, item.endYear].some(Boolean)
      );
    } else if (currentEditSection === "work") {
      const parsedRows = Array.from(editModalBody.querySelectorAll(".profile-edit-work-row"))
        .map(row => {
          const positionName = row.querySelector('[data-name="positionName"]')?.value.trim() || "";
          const companyName = row.querySelector('[data-name="companyName"]')?.value.trim() || "";
          const location = row.querySelector('[data-name="location"]')?.value.trim() || "";
          const startMonth = row.querySelector('[data-name="startMonth"]')?.value.trim() || "";
          const startYear = row.querySelector('[data-name="startYear"]')?.value.trim() || "";
          const endMonth = row.querySelector('[data-name="endMonth"]')?.value.trim() || "";
          const endYear = row.querySelector('[data-name="endYear"]')?.value.trim() || "";
          return { positionName, companyName, location, startMonth, startYear, endMonth, endYear };
        });
      const hasIncomplete = parsedRows.some(item => {
        const values = [item.positionName, item.companyName, item.location, item.startMonth, item.startYear, item.endMonth, item.endYear];
        const hasAny = values.some(Boolean);
        const hasAll = values.every(Boolean);
        return hasAny && !hasAll;
      });
      if (hasIncomplete) {
        notify("Complete all Work Experience fields before saving.", "warn");
        return;
      }
      // Validate max 7 work experiences
      if (parsedRows.length > 7) {
        notify("Maximum of 7 work experience entries allowed.", "warn");
        return;
      }
      // Validate start date < end date
      const hasInvalidDateRange = parsedRows.some(item => {
        if (!item.startYear || !item.endYear || !item.startMonth || !item.endMonth) return false;
        const startY = Number(item.startYear);
        const endY = Number(item.endYear);
        const startM = Number(item.startMonth);
        const endM = Number(item.endMonth);
        if (startY > endY) return true;
        if (startY === endY && startM > endM) return true;
        return false;
      });
      if (hasInvalidDateRange) {
        notify("Start date must be earlier than end date for all work experience entries.", "warn");
        return;
      }
      data.workExperiences = parsedRows.filter(item =>
        [item.positionName, item.companyName, item.location, item.startYear, item.endYear].some(Boolean)
      );
    } else if (currentEditSection === "links") {
      data.profileLinks = Array.from(editModalBody.querySelectorAll(".profile-edit-link-row input[data-name='profileLink']"))
        .map(input => input.value.trim())
        .filter(Boolean);
    } else if (currentEditSection === "personal") {
      const bday = getFieldValue("birthDate");
      if (bday) {
        const selectedDate = new Date(bday);
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 15);
        if (selectedDate > minDate) {
          notify("You must be at least 15 years old.", "warn");
          return;
        }
      }
      data.educationStatus = getFieldValue("educationStatus");
      data.birthDate = bday;
      data.sex = getFieldValue("sex");
    } else if (currentEditSection === "competencies") {
      const languages = Array.from(editModalBody.querySelectorAll(".profile-edit-language-row"))
        .map(row => {
          const languageSelect = row.querySelector('select[data-name="language"]');
          const customLanguage = row.querySelector('input[data-name="customLanguage"]');
          const levelSelect = row.querySelector('select[data-name="level"]');
          const selectedLanguage = languageSelect ? languageSelect.value : "";
          const language = selectedLanguage === "Other"
            ? (customLanguage ? customLanguage.value.trim() : "")
            : selectedLanguage;
          const level = levelSelect ? levelSelect.value : "";
          return { language, level };
        })
        .filter(item => item.language && item.level);

      const selectedPersonality = Array.from(
        editModalBody.querySelectorAll('[data-name="Personality (Max 5)"] input[type="checkbox"]:checked')
      ).map(el => el.value);
      const selectedSkills = Array.from(
        editModalBody.querySelectorAll('[data-name="Skills (Max 5)"] input[type="checkbox"]:checked')
      ).map(el => el.value);

      if (selectedPersonality.length > 5) {
        notify("Personality allows max 5.", "warn");
        return;
      }
      if (selectedSkills.length > 5) {
        notify("Skills allows max 5.", "warn");
        return;
      }

      data.languages = languages;
      data.personality = selectedPersonality;
      data.skills = selectedSkills;
    }

    try {
      if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === "function") {
        await window.RJGDb.saveCurrentUserProfile(data);
      }
    } catch (err) {
      console.error("Unable to save profile updates to DB:", err);
      const profSaveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Unable to save your profile. Please try again.")) || "Unable to save your profile. Please try again.";
      notify(profSaveMsg, "error");
      return;
    }

    saveProfileData(data);
    renderProfileFromStoredData();
    bindEditButtons();
    closeEditModal();
    notify("Profile updated.");
  }

  function bindEditButtons() {
    document.querySelectorAll(".profile-edit-btn[data-edit]").forEach(function (btn) {
      if (btn.dataset.boundEdit === "1") return;
      btn.dataset.boundEdit = "1";
      btn.addEventListener("click", function () {
        const section = btn.getAttribute("data-edit");
        openEditModal(section);
      });
    });

    // Name modal event listeners
    const nameEditModalClose = document.getElementById('nameEditModalClose');
    const nameEditModalCancel = document.getElementById('nameEditModalCancel');
    const nameEditModalSave = document.getElementById('nameEditModalSave');
    const nameModal = document.getElementById('nameEditModal');

    if (nameEditModalClose) {
      nameEditModalClose.addEventListener('click', closeNameEditModal);
    }
    if (nameEditModalCancel) {
      nameEditModalCancel.addEventListener('click', closeNameEditModal);
    }
    if (nameEditModalSave) {
      nameEditModalSave.addEventListener('click', saveNameChanges);
    }
    if (nameModal) {
      nameModal.addEventListener('click', function(e) {
        if (e.target === nameModal) closeNameEditModal();
      });
    }
  }

  async function saveNameChanges() {
    const isRecruiter = isRecruiterLikeRole(currentViewerRole);
    
    if (isRecruiter) {
      // Recruiter: Handle company name
      const companyNameInput = document.getElementById('companyNameInput');
      const companyName = companyNameInput ? companyNameInput.value.trim() : '';
      
      if (!companyName) {
        notify('Company Name is required.', 'warn');
        return;
      }
      
      const data = getStoredProfileData();
      data.name = companyName;
      data.firstName = companyName;
      data.lastName = null;
      data.middleName = null;
      data.suffix = null;
      
      try {
        if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === 'function') {
          await window.RJGDb.saveCurrentUserProfile(data);
        }
        localStorage.setItem('profileData', JSON.stringify(data));
        notify('Company name updated successfully.');
        closeNameEditModal();
        renderProfileFromStoredData();
        bindEditButtons();
      } catch (err) {
        console.error('Failed to save company name:', err);
        notify('Failed to save company name.', 'error');
      }
      return;
    }
    
    // Seeker: Handle multiple name fields
    const lastNameInput = document.getElementById('lastNameInput');
    const firstNameInput = document.getElementById('firstNameInput');
    const middleNameInput = document.getElementById('middleNameInput');
    const suffixInput = document.getElementById('suffixInput');

    const lastName = lastNameInput ? lastNameInput.value.trim() : '';
    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    const middleName = middleNameInput ? middleNameInput.value.trim() : '';
    const suffix = suffixInput ? suffixInput.value.trim() : '';

    if (!lastName || !firstName) {
      notify('Last Name and First Name are required.', 'warn');
      return;
    }

    // Combine into full name format: "Last, First Middle Suffix"
    const nameParts = [lastName, firstName];
    if (middleName) nameParts.push(middleName);
    if (suffix) nameParts.push(suffix);
    const fullName = `${lastName}, ${nameParts.slice(1).join(' ')}`;

    const data = getStoredProfileData();
    data.name = fullName;
    data.lastName = lastName;
    data.firstName = firstName;
    data.middleName = middleName;
    data.suffix = suffix;

    try {
      if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === "function") {
        await window.RJGDb.saveCurrentUserProfile(data);
      }
    } catch (err) {
      console.error("Unable to save name updates to DB:", err);
      const nameSaveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Unable to save your name. Please try again.")) || "Unable to save your name. Please try again.";
      notify(nameSaveMsg, "error");
      return;
    }

    saveProfileData(data);
    renderProfileFromStoredData();
    bindEditButtons();
    closeNameEditModal();
    notify("Name updated.");
  }

  function goBack() {
    const role = readCachedRole();
    if (isRecruiterLikeRole(role)) {
      window.location.href = "../recruiter/recruiter-dashb.html";
      return;
    }
    window.location.href = "../seeker/dashb.html";
  }

  if (backBtn) {
    backBtn.addEventListener("click", goBack);
  }

  if (editModalCancel) editModalCancel.addEventListener("click", closeEditModal);
  if (editModalClose) editModalClose.addEventListener("click", closeEditModal);
  if (editModalSave) editModalSave.addEventListener("click", saveModalChanges);
  if (editModal) {
    editModal.addEventListener("click", event => {
      if (event.target === editModal) closeEditModal();
    });
  }

  // Profile picture modal handlers
  const profileAvatarEditBtn = document.getElementById("profileAvatarEditBtn");
  const profilePicModal = document.getElementById("profilePicModal");
  const profilePicModalClose = document.getElementById("profilePicModalClose");
  const profilePicModalCancel = document.getElementById("profilePicModalCancel");
  const uploadPicBtn = document.getElementById("uploadPicBtn");
  const capturePicBtn = document.getElementById("capturePicBtn");
  const profilePicInput = document.getElementById("profilePicInput");
  
  // Camera modal elements
  const cameraModal = document.getElementById("cameraModal");
  const cameraModalClose = document.getElementById("cameraModalClose");
  const cameraModalCancel = document.getElementById("cameraModalCancel");
  const capturePhotoBtn = document.getElementById("capturePhotoBtn");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  
  let cameraStream = null;

  // Open profile picture modal
  if (profileAvatarEditBtn) {
    profileAvatarEditBtn.addEventListener("click", () => {
      profilePicModal.hidden = false;
      profilePicModal.classList.add('open');
      profilePicModal.setAttribute('aria-hidden', 'false');
    });
  }

  // Close profile picture modal
  function closeProfilePicModal() {
    if (profilePicModal) {
      profilePicModal.hidden = true;
      profilePicModal.classList.remove('open');
      profilePicModal.setAttribute('aria-hidden', 'true');
    }
  }

  // Profile picture modal event listeners
  if (profilePicModalClose) {
    profilePicModalClose.addEventListener('click', closeProfilePicModal);
  }
  if (profilePicModalCancel) {
    profilePicModalCancel.addEventListener('click', closeProfilePicModal);
  }

  // Upload button click
  if (uploadPicBtn) {
    uploadPicBtn.addEventListener("click", () => {
      profilePicInput.click();
    });
  }

  // Handle file upload
  if (profilePicInput) {
    profilePicInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      
      if (file.size > 3 * 1024 * 1024) {
        notify("Image must be under 3MB.", "warn");
        profilePicInput.value = "";
        return;
      }
      
      try {
        // Upload to Supabase
        if (window.RJGDb && typeof window.RJGDb.uploadProfileImage === 'function') {
          const uploadedUrl = await window.RJGDb.uploadProfileImage(file);
          if (uploadedUrl) {
            // Update profile data
            const data = getStoredProfileData();
            data.avatarUrl = uploadedUrl;
            
            if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === 'function') {
              await window.RJGDb.saveCurrentUserProfile(data);
            }
            localStorage.setItem('profileData', JSON.stringify(data));
            
            // Update display
            renderProfileFromStoredData();
            bindEditButtons();
            
            notify('Profile picture updated successfully.');
            closeProfilePicModal();
          }
        }
      } catch (err) {
        console.error('Failed to upload profile picture:', err);
        notify('Failed to upload profile picture.', 'error');
      }
      
      profilePicInput.value = "";
    });
  }

  // Camera button click
  if (capturePicBtn) {
    capturePicBtn.addEventListener("click", () => {
      closeProfilePicModal();
      openCameraModal();
    });
  }

  // Camera modal functions
  async function openCameraModal() {
    if (!cameraModal) return;
    
    cameraModal.hidden = false;
    cameraModal.classList.add('open');
    cameraModal.setAttribute('aria-hidden', 'false');
    
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (cameraVideo) {
        cameraVideo.srcObject = cameraStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      notify('Camera access denied. Please check your permissions.', 'error');
      closeCameraModal();
    }
  }

  function closeCameraModal() {
    if (cameraModal) {
      cameraModal.hidden = true;
      cameraModal.classList.remove('open');
      cameraModal.setAttribute('aria-hidden', 'true');
    }
    
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    
    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }
  }

  // Camera modal event listeners
  if (cameraModalClose) {
    cameraModalClose.addEventListener('click', closeCameraModal);
  }
  if (cameraModalCancel) {
    cameraModalCancel.addEventListener('click', closeCameraModal);
  }

  // Capture photo
  if (capturePhotoBtn) {
    capturePhotoBtn.addEventListener("click", async () => {
      if (!cameraVideo || !cameraCanvas) return;
      
      const context = cameraCanvas.getContext('2d');
      cameraCanvas.width = cameraVideo.videoWidth;
      cameraCanvas.height = cameraVideo.videoHeight;
      context.drawImage(cameraVideo, 0, 0);
      
      // Convert canvas to blob
      cameraCanvas.toBlob(async (blob) => {
        if (!blob) return;
        
        try {
          // Upload to Supabase
          if (window.RJGDb && typeof window.RJGDb.uploadProfileImage === 'function') {
            const uploadedUrl = await window.RJGDb.uploadProfileImage(blob);
            if (uploadedUrl) {
              // Update profile data
              const data = getStoredProfileData();
              data.avatarUrl = uploadedUrl;
              
              if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === 'function') {
                await window.RJGDb.saveCurrentUserProfile(data);
              }
              localStorage.setItem('profileData', JSON.stringify(data));
              
              // Update display
              renderProfileFromStoredData();
              bindEditButtons();
              
              notify('Profile picture updated successfully.');
              closeCameraModal();
            }
          }
        } catch (err) {
          console.error('Failed to upload captured photo:', err);
          notify('Failed to upload captured photo.', 'error');
        }
      }, 'image/jpeg', 0.9);
    });
  }

  async function initProfilePage() {
    // Step 1: Use cached role for immediate layout (prevents flash of wrong view)
    const cachedRole = readCachedRole();
    if (cachedRole) applyRoleScopedProfile(cachedRole);

    // Step 2: Verify role from DB and load profile data in parallel
    let liveRole = cachedRole;
    const [dbRoleResult, dbProfileResult] = await Promise.allSettled([
      (window.RJGDb && typeof window.RJGDb.getCurrentUserRole === "function")
        ? window.RJGDb.getCurrentUserRole()
        : Promise.resolve(""),
      (window.RJGDb && typeof window.RJGDb.loadCurrentUserProfile === "function")
        ? window.RJGDb.loadCurrentUserProfile()
        : Promise.resolve(null)
    ]);

    // Step 3: Apply live DB role — re-render if it differs from the cached one
    if (dbRoleResult.status === "fulfilled" && dbRoleResult.value) {
      liveRole = dbRoleResult.value;
      try {
        sessionStorage.setItem("rjgUserRole", liveRole);
        localStorage.setItem("rjgUserRole", liveRole);
      } catch (e) {}
      // If the DB role differs from what we already applied, re-apply the correct view
      if (liveRole !== cachedRole) {
        applyRoleScopedProfile(liveRole);
      }
    }

    // Step 4: Save DB profile to localStorage so rendering uses fresh data
    if (dbProfileResult.status === "fulfilled" && dbProfileResult.value &&
        Object.keys(dbProfileResult.value).length > 0) {
      saveProfileData(dbProfileResult.value);
    }

    // Step 5: Apply final role scope and render
    applyRoleScopedProfile(liveRole);
    renderProfileFromStoredData();
    bindEditButtons();
    
    // Step 6: Update valid documents display after profile is loaded
    updateValidDocumentsDisplay();
    if (profileMainEl) {
      profileMainEl.classList.remove("profile-main--loading");
      profileMainEl.classList.add("profile-main--ready");
    }
  }

  // PSGC API Cascading Location Logic for Profile Address
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

  async function loadAddressRegions() {
    const regions = await fetchPSGC("https://psgc.cloud/api/regions");
    const regionSelect = document.getElementById("editAddressRegion");
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

  function initAddressCascadingDropdowns(address) {
    loadAddressRegions();
    
    const regionSelect = document.getElementById("editAddressRegion");
    const provinceSelect = document.getElementById("editAddressProvince");
    const citySelect = document.getElementById("editAddressCity");
    const barangaySelect = document.getElementById("editAddressBarangay");

    // Set existing values if available
    if (address && address.province) {
      // Try to set region based on province (would need mapping)
      // For now, just load provinces when region is selected
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
        
        // Set existing province value if matches
        if (address && address.province) {
          const matchingProvince = provinces.find(p => p.name === address.province);
          if (matchingProvince) {
            provinceSelect.value = matchingProvince.code;
            provinceSelect.dispatchEvent(new Event('change'));
          }
        }
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
        
        // Set existing city value if matches
        if (address && address.city) {
          const matchingCity = cities.find(c => c.name === address.city);
          if (matchingCity) {
            citySelect.value = matchingCity.code;
            citySelect.dispatchEvent(new Event('change'));
          }
        }
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
        
        // Set existing barangay value if matches
        if (address && address.barangay) {
          const matchingBarangay = barangays.find(b => b.name === address.barangay);
          if (matchingBarangay) {
            barangaySelect.value = matchingBarangay.code;
          }
        }
      }
    });
  }

  // Valid Documents functionality
  const validIdInput = document.getElementById("validIdInput");
  const validCertInput = document.getElementById("validCertInput");
  const uploadValidIdBtn = document.getElementById("uploadValidIdBtn");
  const uploadValidCertBtn = document.getElementById("uploadValidCertBtn");
  const captureValidIdBtn = document.getElementById("captureValidIdBtn");
  const captureValidCertBtn = document.getElementById("captureValidCertBtn");
  // View buttons removed - images are now directly clickable
  const validIdImage = document.getElementById("validIdImage");
  const validCertImage = document.getElementById("validCertImage");
  const validIdPlaceholder = document.getElementById("validIdPlaceholder");
  const validCertPlaceholder = document.getElementById("validCertPlaceholder");
  const validIdTypeDisplay = document.getElementById("validIdTypeDisplay");
  const validCertTypeDisplay = document.getElementById("validCertTypeDisplay");

  // Valid ID upload
  if (uploadValidIdBtn && validIdInput) {
    uploadValidIdBtn.addEventListener("click", () => validIdInput.click());
  }

  if (validIdInput) {
    validIdInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        if (window.showAppToast) window.showAppToast("Image must be under 5MB", "error");
        validIdInput.value = "";
        return;
      }

      try {
        console.log("Starting ID upload...");
        if (window.RJGDb && typeof window.RJGDb.uploadFile === "function") {
          console.log("Calling uploadFile for id-image bucket...");
          const url = await window.RJGDb.uploadFile(file, "id-image");
          console.log("Upload result:", url);
          if (url) {
            // Update profile with new ID URL
            const profile = JSON.parse(localStorage.getItem("profileData") || "{}");
            profile.id_url = url;
            profile.id_status = "pending";
            profile._resetIdStatus = true;
            profile.validId = { type: "ID", file: file, imageUrl: url };
            
            console.log("Saving profile with ID URL:", url);
            if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === "function") {
              try {
                await window.RJGDb.saveCurrentUserProfile(profile);
                console.log("Profile saved successfully to database");
              } catch (saveErr) {
                console.error("Failed to save profile to database:", saveErr);
                if (window.RJGErrorHandler && window.RJGErrorHandler.showUserError) {
                  window.RJGErrorHandler.showUserError(saveErr, "Failed to save profile. Please try again.");
                } else if (window.showAppToast) {
                  window.showAppToast("Failed to save profile. Please try again.", "error");
                }
              }
            }
            
            localStorage.setItem("profileData", JSON.stringify(profile));
            updateValidDocumentsDisplay();
            if (window.showAppToast) window.showAppToast("Valid ID uploaded successfully", "success");
          } else {
            console.error("Upload returned empty URL");
            if (window.showAppToast) window.showAppToast("Upload failed - no URL returned", "error");
          }
        } else {
          console.error("uploadFile function not available");
          if (window.showAppToast) window.showAppToast("Upload function not available", "error");
        }
      } catch (err) {
        console.error("Failed to upload valid ID:", err);
        if (window.RJGErrorHandler && window.RJGErrorHandler.showUserError) {
          window.RJGErrorHandler.showUserError(err, "Failed to upload valid ID. Please try again.");
        } else if (window.showAppToast) {
          window.showAppToast("Failed to upload valid ID. Please try again.", "error");
        }
      }
      validIdInput.value = "";
    });
  }

  // Valid Certificate upload
  if (uploadValidCertBtn && validCertInput) {
    uploadValidCertBtn.addEventListener("click", () => validCertInput.click());
  }

  if (validCertInput) {
    validCertInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        if (window.showAppToast) window.showAppToast("Image must be under 5MB", "error");
        validCertInput.value = "";
        return;
      }

      try {
        console.log("Starting certificate upload...");
        if (window.RJGDb && typeof window.RJGDb.uploadFile === "function") {
          console.log("Calling uploadFile for cert-image bucket...");
          const url = await window.RJGDb.uploadFile(file, "cert-image");
          console.log("Upload result:", url);
          if (url) {
            // Update profile with new certificate URL
            const profile = JSON.parse(localStorage.getItem("profileData") || "{}");
            profile.cert_url = url;
            profile.cert_status = "pending";
            profile._resetCertStatus = true;
            profile.validCertificate = { type: "Certificate", file: file, imageUrl: url };
            
            console.log("Saving profile with certificate URL:", url);
            if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === "function") {
              try {
                await window.RJGDb.saveCurrentUserProfile(profile);
                console.log("Profile saved successfully to database");
              } catch (saveErr) {
                console.error("Failed to save profile to database:", saveErr);
                const saveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(saveErr, "Unable to save your changes. Please try again.")) || "Unable to save your changes. Please try again.";
                if (window.showAppToast) window.showAppToast(saveMsg, "error");
              }
            }
            
            localStorage.setItem("profileData", JSON.stringify(profile));
            updateValidDocumentsDisplay();
            if (window.showAppToast) window.showAppToast("Valid Certificate uploaded successfully", "success");
          } else {
            console.error("Upload returned empty URL");
            if (window.showAppToast) window.showAppToast("Upload failed - no URL returned", "error");
          }
        } else {
          console.error("uploadFile function not available");
          if (window.showAppToast) window.showAppToast("Upload function not available", "error");
        }
      } catch (err) {
        console.error("Failed to upload valid certificate:", err);
        if (window.RJGErrorHandler && window.RJGErrorHandler.showUserError) {
          window.RJGErrorHandler.showUserError(err, "Failed to upload certificate. Please try again.");
        } else if (window.showAppToast) {
          window.showAppToast("Failed to upload certificate. Please try again.", "error");
                }
      }
      validCertInput.value = "";
    });
  }

  // View buttons removed - images are now directly clickable

  // Valid ID capture
  if (captureValidIdBtn) {
    captureValidIdBtn.addEventListener("click", () => openCameraForId());
  }

  // Valid Certificate capture
  if (captureValidCertBtn) {
    captureValidCertBtn.addEventListener("click", () => openCameraForCert());
  }

  // Camera capture for ID
  function openCameraForId() {
    const video = document.createElement("video");
    video.autoplay = true;
    video.style.width = "100%";
    video.style.maxWidth = "400px";

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const cameraContainer = document.createElement("div");
    cameraContainer.style.background = "#fff";
    cameraContainer.style.padding = "24px";
    cameraContainer.style.borderRadius = "12px";
    cameraContainer.style.textAlign = "center";

    const title = document.createElement("h3");
    title.textContent = "Capture Valid ID";
    title.style.margin = "0 0 16px 0";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "12px";
    buttonContainer.style.marginTop = "16px";

    const captureBtn = document.createElement("button");
    captureBtn.textContent = "Capture";
    captureBtn.style.padding = "10px 20px";
    captureBtn.style.border = "none";
    captureBtn.style.borderRadius = "8px";
    captureBtn.style.background = "#5b8c51";
    captureBtn.style.color = "white";
    captureBtn.style.cursor = "pointer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "10px 20px";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "8px";
    cancelBtn.style.background = "#ccc";
    cancelBtn.style.color = "#333";
    cancelBtn.style.cursor = "pointer";

    cameraContainer.appendChild(title);
    cameraContainer.appendChild(video);
    cameraContainer.appendChild(canvas);
    cameraContainer.appendChild(buttonContainer);
    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(cancelBtn);
    overlay.appendChild(cameraContainer);
    document.body.appendChild(overlay);

    let stream = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => {
        stream = s;
        video.srcObject = stream;
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        if (window.showAppToast) window.showAppToast("Camera access denied", "error");
        overlay.remove();
      });

    captureBtn.addEventListener("click", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], "id-capture.jpg", { type: "image/jpeg" });
        
        try {
          console.log("Starting ID capture upload...");
          if (window.RJGDb && typeof window.RJGDb.uploadFile === "function") {
            const url = await window.RJGDb.uploadFile(file, "id-image");
            console.log("Capture upload result:", url);
            if (url) {
              const profile = JSON.parse(localStorage.getItem("profileData") || "{}");
              profile.id_url = url;
              profile.id_status = "pending";
              profile._resetIdStatus = true;
              profile.validId = { type: "ID", file: file, imageUrl: url };
              
              console.log("Saving profile with captured ID URL:", url);
              if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === "function") {
                try {
                  await window.RJGDb.saveCurrentUserProfile(profile);
                  console.log("Profile saved successfully to database");
                } catch (saveErr) {
                  console.error("Failed to save profile to database:", saveErr);
                  const saveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(saveErr, "Unable to save your changes. Please try again.")) || "Unable to save your changes. Please try again.";
                  if (window.showAppToast) window.showAppToast(saveMsg, "error");
                }
              }
              
              localStorage.setItem("profileData", JSON.stringify(profile));
              updateValidDocumentsDisplay();
              if (window.showAppToast) window.showAppToast("Valid ID captured successfully", "success");
            }
          }
        } catch (err) {
          console.error("Failed to capture ID:", err);
          if (window.RJGErrorHandler && window.RJGErrorHandler.showUserError) {
            window.RJGErrorHandler.showUserError(err, "Failed to capture ID. Please try again.");
          } else if (window.showAppToast) {
            window.showAppToast("Failed to capture ID. Please try again.", "error");
          }
        }
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        overlay.remove();
      }, "image/jpeg", 0.9);
    });

    cancelBtn.addEventListener("click", () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      overlay.remove();
    });
  }

  // Camera capture for Certificate
  function openCameraForCert() {
    const video = document.createElement("video");
    video.autoplay = true;
    video.style.width = "100%";
    video.style.maxWidth = "400px";

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const cameraContainer = document.createElement("div");
    cameraContainer.style.background = "#fff";
    cameraContainer.style.padding = "24px";
    cameraContainer.style.borderRadius = "12px";
    cameraContainer.style.textAlign = "center";

    const title = document.createElement("h3");
    title.textContent = "Capture Valid Certificate";
    title.style.margin = "0 0 16px 0";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "12px";
    buttonContainer.style.marginTop = "16px";

    const captureBtn = document.createElement("button");
    captureBtn.textContent = "Capture";
    captureBtn.style.padding = "10px 20px";
    captureBtn.style.border = "none";
    captureBtn.style.borderRadius = "8px";
    captureBtn.style.background = "#5b8c51";
    captureBtn.style.color = "white";
    captureBtn.style.cursor = "pointer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "10px 20px";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "8px";
    cancelBtn.style.background = "#ccc";
    cancelBtn.style.color = "#333";
    cancelBtn.style.cursor = "pointer";

    cameraContainer.appendChild(title);
    cameraContainer.appendChild(video);
    cameraContainer.appendChild(canvas);
    cameraContainer.appendChild(buttonContainer);
    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(cancelBtn);
    overlay.appendChild(cameraContainer);
    document.body.appendChild(overlay);

    let stream = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => {
        stream = s;
        video.srcObject = stream;
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        if (window.showAppToast) window.showAppToast("Camera access denied", "error");
        overlay.remove();
      });

    captureBtn.addEventListener("click", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], "cert-capture.jpg", { type: "image/jpeg" });
        
        try {
          console.log("Starting certificate capture upload...");
          if (window.RJGDb && typeof window.RJGDb.uploadFile === "function") {
            const url = await window.RJGDb.uploadFile(file, "cert-image");
            console.log("Capture upload result:", url);
            if (url) {
              const profile = JSON.parse(localStorage.getItem("profileData") || "{}");
              profile.cert_url = url;
              profile.cert_status = "pending";
              profile._resetCertStatus = true;
              profile.validCertificate = { type: "Certificate", file: file, imageUrl: url };
              
              console.log("Saving profile with captured certificate URL:", url);
              if (window.RJGDb && typeof window.RJGDb.saveCurrentUserProfile === "function") {
                try {
                  await window.RJGDb.saveCurrentUserProfile(profile);
                  console.log("Profile saved successfully to database");
                } catch (saveErr) {
                  console.error("Failed to save profile to database:", saveErr);
                  const saveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(saveErr, "Unable to save your changes. Please try again.")) || "Unable to save your changes. Please try again.";
                  if (window.showAppToast) window.showAppToast(saveMsg, "error");
                }
              }
              
              localStorage.setItem("profileData", JSON.stringify(profile));
              updateValidDocumentsDisplay();
              if (window.showAppToast) window.showAppToast("Valid Certificate captured successfully", "success");
            }
          }
        } catch (err) {
          console.error("Failed to capture certificate:", err);
          if (window.RJGErrorHandler && window.RJGErrorHandler.showUserError) {
            window.RJGErrorHandler.showUserError(err, "Failed to capture certificate. Please try again.");
          } else if (window.showAppToast) {
            window.showAppToast("Failed to capture certificate. Please try again.", "error");
          }
        }
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        overlay.remove();
      }, "image/jpeg", 0.9);
    });

    cancelBtn.addEventListener("click", () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      overlay.remove();
    });
  }

  // Valid certificate view button removed - image is now directly clickable

  function updateValidDocumentsDisplay() {
    const profile = JSON.parse(localStorage.getItem("profileData") || "{}");
    
    const validIdBadge = document.getElementById("validIdVerificationBadge");
    const validCertBadge = document.getElementById("validCertVerificationBadge");

    function applyBadge(badgeEl, status, hasDoc) {
      if (!badgeEl) return;
      if (!hasDoc) { badgeEl.style.display = "none"; return; }
      badgeEl.style.display = "inline-flex";
      if (status === "verified") {
        badgeEl.className = "doc-verification-badge doc-verification-badge--verified";
        badgeEl.textContent = "✔ Verified";
      } else if (status === "change_requested") {
        badgeEl.className = "doc-verification-badge doc-verification-badge--change";
        badgeEl.textContent = "⚠ Re-upload Required";
      } else {
        badgeEl.className = "doc-verification-badge doc-verification-badge--pending";
        badgeEl.textContent = "⏳ Pending Verification";
      }
    }

    // Update Valid ID display
    if (profile.id_url) {
      validIdImage.src = profile.id_url;
      validIdImage.style.display = "block";
      validIdPlaceholder.style.display = "none";
      // View button removed - image is now directly clickable
      validIdTypeDisplay.textContent = "ID uploaded";
      applyBadge(validIdBadge, profile.id_status || "pending", true);
    } else {
      validIdImage.style.display = "none";
      validIdPlaceholder.style.display = "flex";
      // View button removed - image is now directly clickable
      validIdTypeDisplay.textContent = "Not uploaded";
      applyBadge(validIdBadge, null, false);
    }
    
    // Update Valid Certificate display
    if (profile.cert_url) {
      validCertImage.src = profile.cert_url;
      validCertImage.style.display = "block";
      validCertPlaceholder.style.display = "none";
      // View button removed - image is now directly clickable
      validCertTypeDisplay.textContent = "Certificate uploaded";
      applyBadge(validCertBadge, profile.cert_status || "pending", true);
    } else {
      validCertImage.style.display = "none";
      validCertPlaceholder.style.display = "flex";
      // View button removed - image is now directly clickable
      validCertTypeDisplay.textContent = "Not uploaded";
      applyBadge(validCertBadge, null, false);
    }
  }

  // Update valid documents display when profile loads
  // Valid documents display will be updated after profile loads in initProfilePage

  initProfilePage();
})();

/* ── Download Profile as PDF ── */
(function () {
  function initPdfDownload() {
    const btn = document.getElementById("downloadPdfBtn");
    if (!btn) return;

    btn.addEventListener("click", async function () {
      // Disable button while generating
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Generating…`;
      // Hide the button container immediately so it never appears in the PDF
      const printActions = document.querySelector(".profile-print-actions");
      if (printActions) printActions.style.display = "none";

      // Get the name for the filename
      const nameEl = document.querySelector(".profile-name");
      const profileName = nameEl ? nameEl.textContent.trim().replace(/[^a-zA-Z0-9\s,.-]/g, "").replace(/\s+/g, "_") : "profile";
      const filename = `Resume_${profileName}.pdf`;

      // Apply PDF mode to hide unwanted sections
      document.body.classList.add("pdf-printing");

      // Wrap name-row + contact into one flex child for the hero layout
      const hero = document.querySelector(".profile-hero");
      let heroWrapper = null;
      if (hero) {
        const nameRow = hero.querySelector(".profile-name-row");
        const contact = hero.querySelector(".profile-contact");
        if (nameRow && contact) {
          heroWrapper = document.createElement("div");
          heroWrapper.className = "profile-hero-text-wrap";
          heroWrapper.style.cssText = "display:flex;flex-direction:column;justify-content:center;flex:1;";
          hero.insertBefore(heroWrapper, nameRow);
          heroWrapper.appendChild(nameRow);
          heroWrapper.appendChild(contact);
        }
      }

      // Force the main element to exactly A4 width so html2canvas captures correctly
      const element = document.querySelector(".profile-main");
      const prevStyle = element.getAttribute("style") || "";

      // Scroll to top so canvas captures from correct position
      const prevScrollY = window.scrollY;
      window.scrollTo(0, 0);

      // Force exact A4-friendly width
      element.style.cssText = prevStyle + ";width:740px!important;max-width:740px!important;min-width:740px!important;overflow:visible!important;position:relative!important;box-sizing:border-box!important;padding:20px 32px!important;";

      // Wait for reflow
      await new Promise(r => setTimeout(r, 500));

      const opt = {
        margin:      [0, 0, 0, 0],
        filename:    filename,
        image:       { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 740,
          width: 740,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true
        },
        pagebreak: { mode: "avoid-all" }
      };

      try {
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF generation failed:", err);
        const pdfMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, "Could not generate PDF. Please try again.")) || "Could not generate PDF. Please try again.";
        notify(pdfMsg, "error");
      } finally {
        // Restore element style and scroll
        element.setAttribute("style", prevStyle);
        window.scrollTo(0, prevScrollY);
        // Restore hero DOM
        if (heroWrapper && hero) {
          const nameRow = heroWrapper.querySelector(".profile-name-row");
          const contact = heroWrapper.querySelector(".profile-contact");
          if (nameRow) hero.insertBefore(nameRow, heroWrapper);
          if (contact) hero.insertBefore(contact, heroWrapper);
          heroWrapper.remove();
        }
        // Remove PDF mode class and restore button
        document.body.classList.remove("pdf-printing");
        if (printActions) printActions.style.display = "";
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPdfDownload);
  } else {
    initPdfDownload();
  }
})();