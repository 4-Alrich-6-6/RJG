// ============================================================
// SETUP.JS — all top-level DOM queries and event-listener
// attachments moved inside DOMContentLoaded so the DOM is
// guaranteed to exist when we touch it.
// ============================================================

// ── Non-DOM state (safe at top level) ──────────────────────
const pendingSignupRole = sessionStorage.getItem("pendingSignupRole") || "seeker";

let workExperiences = [];
let educationBackgrounds = [];
let skills = [];
let languages = [];
let profileLinks = [];
let address = {};
let personality = [];
let pendingProfilePicFile = null;
let pendingProfilePicUrl = null;
let seekerPreferences = null;
let validDocs = { validId: null, validCertificate: null };
let validIdFile = null;
let validCertFile = null;
let currentDocCameraTarget = null;
let cameraStream = null;
let setupNameData = { lastName: '', firstName: '', middleName: '', suffix: '' };

const MAX_WORK_EXPERIENCES = 7;
const MAX_EDUCATION_HISTORY = 2;
const MAX_DESCRIPTION_LENGTH = 500;

const languageOptions = [
    "English","Filipino / Tagalog","Cebuano","Ilocano","Hiligaynon",
    "Bicolano","Chinese (Mandarin)","Spanish","Japanese","Korean",
    "Arabic","French","German","Hindi","Malay / Indonesian","Other"
];
const levelOptions = ["Native","Fluent","Intermediate","Basic"];

const validIDs = [
    "Philippine National ID (PhilSys)","Passport","Driver's License (LTO)",
    "SSS ID / SSS UMID Card","GSIS ID / GSIS UMID Card","PhilHealth ID",
    "Pag-IBIG (HDMF) ID","Voter's ID / Voter's Certification",
    "PRC ID (Professional Regulation Commission)","NBI Clearance",
    "Police Clearance","Postal ID","Barangay ID / Barangay Clearance",
    "Senior Citizen ID","PWD ID (Person with Disability)","OFW ID / iDOLE Card",
    "TIN ID (BIR)","School ID (for students)","Company ID"
];
const validCertifications = [
    "Barangay Clearance","Barangay Certificate of Residency","NBI Clearance",
    "Police Clearance","Court Clearance","Birth Certificate (PSA)",
    "Marriage Certificate (PSA)","Death Certificate (PSA)",
    "Certificate of No Marriage (CENOMAR)","Certificate of Employment",
    "Certificate of Indigency","Good Moral Character Certificate",
    "Medical Certificate","Business Permit / Mayor's Permit",
    "DTI Certificate of Registration","SEC Certificate of Registration",
    "BIR Certificate of Registration (Form 2303)","PhilHealth MDR (Member Data Record)",
    "SSS Employment History","TOR (Transcript of Records)","Diploma",
    "CAV (Certification, Authentication, Verification) — DepEd"
];

// ── Utility functions (no DOM needed) ──────────────────────
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

function clampDescriptionValue(el) {
    if (!el) return;
    if (el.value.length > MAX_DESCRIPTION_LENGTH) {
        el.value = el.value.slice(0, MAX_DESCRIPTION_LENGTH);
    }
}

// ── PSGC helpers (no DOM needed until called) ───────────────
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
    const regionSelect = document.getElementById("regionSelect");
    if (!regionSelect) return;
    const regions = await fetchPSGC("https://psgc.cloud/api/regions");
    regions.sort((a, b) => a.name.localeCompare(b.name));
    regionSelect.innerHTML = '<option value="">Select Region</option>';
    regions.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.code;
        opt.textContent = r.name;
        regionSelect.appendChild(opt);
    });
}

// ── Auth helpers ────────────────────────────────────────────
async function ensureAuthenticated() {
    if (!window.RJGDb || typeof window.RJGDb.currentUser !== "function") return true;
    try {
        const user = await window.RJGDb.currentUser();
        if (user) return true;
    } catch (err) {
        console.error("Unable to verify authentication:", err);
    }
    showLoginRequiredModal();
    return false;
}

function showLoginRequiredModal() {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;";
    const card = document.createElement("div");
    card.style.cssText = "background:#fff;border-radius:16px;padding:32px;max-width:360px;text-align:center;font-family:Inter,sans-serif;";
    card.innerHTML = `
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;">Login required</h2>
      <p style="margin:0 0 24px;font-size:16px;color:#444;">Please sign in before accessing this page.</p>
      <button id="authRequiredBtn" style="padding:10px 18px;border:none;border-radius:999px;background:#5b8c51;color:#fff;font-weight:600;cursor:pointer;">Go to Login</button>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const redirect = () => { window.location.href = "../auth/log-sign.html"; };
    card.querySelector("#authRequiredBtn").addEventListener("click", redirect);
    setTimeout(redirect, 2500);
}

// ── Form helpers ─────────────────────────────────────────────
function applyFormToggle(roleLower) {
    const toggleBtns   = document.querySelectorAll(".toggle-btn");
    const seekingForm  = document.querySelector(".seeking-form");
    const recruitmentForm = document.querySelector(".recruitment-form");
    const recruiterView = roleLower === "recruiter" || roleLower === "employer";
    if (recruiterView) {
        recruitmentForm.classList.add("active");
        seekingForm.classList.remove("active");
        toggleBtns[1].classList.add("active");
        toggleBtns[0].classList.remove("active");
    } else {
        seekingForm.classList.add("active");
        recruitmentForm.classList.remove("active");
        toggleBtns[0].classList.add("active");
        toggleBtns[1].classList.remove("active");
    }
    validateSetupForm();
}

function validateSetupForm() {
    const saveBtn = document.querySelector(".save-btn");
    if (!saveBtn) return;
    const seekingForm = document.querySelector(".seeking-form");
    const activeForm = document.querySelector(".form-section.active") || seekingForm;
    if (!activeForm) return;
    let allFilled = true;

    activeForm.querySelectorAll("input[type='text'], input[type='date'], input[type='number'], textarea").forEach(input => {
        if (input.offsetParent === null) return;
        if (input.value.trim() === "") allFilled = false;
    });

    if (
        !address.street?.trim() ||
        !address.barangay?.trim() ||
        !address.city?.trim() ||
        !address.province?.trim() ||
        !address.country?.trim() ||
        !address.zip?.trim()
    ) { allFilled = false; }

    if (activeForm.classList.contains("seeking-form")) {
        if (workExperiences.length === 0)   allFilled = false;
        if (educationBackgrounds.length === 0) allFilled = false;
        if (skills.length === 0)            allFilled = false;
        if (languages.length === 0)         allFilled = false;
        if (profileLinks.length === 0)      allFilled = false;
        if (personality.length === 0)       allFilled = false;
    } else if (activeForm.classList.contains("recruitment-form")) {
        if (profileLinks.length === 0)      allFilled = false;
    }

    saveBtn.disabled = !allFilled;
    saveBtn.style.opacity = allFilled ? "1" : "0.5";
    saveBtn.style.cursor  = allFilled ? "pointer" : "not-allowed";
}

function setupFormValidationListeners() {
    document.querySelectorAll("input, textarea, select").forEach(input => {
        input.addEventListener("input",  validateSetupForm);
        input.addEventListener("change", validateSetupForm);
    });
}

// ── Modal helpers ────────────────────────────────────────────
function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("show");
    const form = modal.querySelector(".modal-form");
    if (form && form.tagName === "FORM") form.reset();
    const languagesModal = document.getElementById("languagesModal");
    const profileLinksModal = document.getElementById("profileLinksModal");
    const languageRows = document.getElementById("languageRows");
    const profileLinkRows = document.getElementById("profileLinkRows");
    if (modal === languagesModal && languageRows) languageRows.innerHTML = "";
    if (modal === profileLinksModal && profileLinkRows) profileLinkRows.innerHTML = "";
}

function openWorkExperienceModal() {
    document.getElementById("workExperienceModal")?.classList.add("show");
}
function openEducationModal() {
    document.getElementById("educationModal")?.classList.add("show");
}
function openSkillsModal() {
    document.getElementById("skillsModal")?.classList.add("show");
}
function openLanguagesModal() {
    const languageRows = document.getElementById("languageRows");
    if (languageRows) languageRows.innerHTML = "";
    if (languages.length === 0) { addLanguageRow(); }
    else { languages.forEach(e => addLanguageRow(e.language, e.level)); }
    document.getElementById("languagesModal")?.classList.add("show");
}
function openProfileLinksModal() {
    const profileLinkRows = document.getElementById("profileLinkRows");
    if (profileLinkRows) profileLinkRows.innerHTML = "";
    if (profileLinks.length === 0) { addProfileLinkRow(); }
    else { profileLinks.forEach(link => addProfileLinkRow(link)); }
    document.getElementById("profileLinksModal")?.classList.add("show");
}
function openPersonalityModal() {
    document.getElementById("personalityModal")?.classList.add("show");
}
function openPreferencesModal() {
    loadPreferencesIntoForm();
    document.getElementById("preferencesModal")?.classList.add("show");
}

async function openAddressModal() {
    const regionSelect   = document.getElementById("regionSelect");
    const provinceSelect = document.getElementById("provinceSelect");
    const citySelect     = document.getElementById("citySelect");
    const barangaySelect = document.getElementById("barangaySelect");
    const unitEl = document.getElementById("unitNoInput");
    if (unitEl) unitEl.value = address.unitNo || "";
    const streetEl = document.getElementById("streetInput");
    if (streetEl) streetEl.value = address.street || "";
    const zipEl = document.getElementById("zipInput");
    if (zipEl) zipEl.value = address.zip || "";
    const countryEl = document.getElementById("countryInput");
    if (countryEl) countryEl.value = address.country || "Philippines";

    await loadRegions();

    if (address.region && regionSelect) {
        const regionOpt = Array.from(regionSelect.options).find(opt => opt.text === address.region);
        if (regionOpt) {
            regionSelect.value = regionOpt.value;
            regionSelect.dispatchEvent(new Event("change"));
            setTimeout(async () => {
                if (address.province && provinceSelect) {
                    const provOpt = Array.from(provinceSelect.options).find(opt => opt.text === address.province);
                    if (provOpt) {
                        provinceSelect.value = provOpt.value;
                        provinceSelect.dispatchEvent(new Event("change"));
                        setTimeout(async () => {
                            if (address.city && citySelect) {
                                const cityOpt = Array.from(citySelect.options).find(opt => opt.text === address.city);
                                if (cityOpt) {
                                    citySelect.value = cityOpt.value;
                                    citySelect.dispatchEvent(new Event("change"));
                                    setTimeout(async () => {
                                        if (address.barangay && barangaySelect) {
                                            const brgyOpt = Array.from(barangaySelect.options).find(opt => opt.text === address.barangay);
                                            if (brgyOpt) barangaySelect.value = brgyOpt.value;
                                        }
                                    }, 800);
                                }
                            }
                        }, 800);
                    }
                }
            }, 800);
        }
    }
    document.getElementById("addressModal")?.classList.add("show");
}

function openValidDocsModal() {
    const validDocsModal = document.getElementById("validDocsModal");
    if (!validDocsModal) { console.error("validDocsModal not found"); return; }
    const validIdTypeSelect   = document.getElementById("validIdType");
    const validCertTypeSelect = document.getElementById("validCertType");

    if (validIdTypeSelect) {
        validIdTypeSelect.innerHTML = '<option value="">Select ID Type</option>';
        validIDs.forEach(id => {
            const opt = document.createElement("option");
            opt.value = id; opt.textContent = id;
            validIdTypeSelect.appendChild(opt);
        });
        if (validDocs.validId?.type) validIdTypeSelect.value = validDocs.validId.type;
    }
    if (validCertTypeSelect) {
        validCertTypeSelect.innerHTML = '<option value="">Select Certificate Type</option>';
        validCertifications.forEach(cert => {
            const opt = document.createElement("option");
            opt.value = cert; opt.textContent = cert;
            validCertTypeSelect.appendChild(opt);
        });
        if (validDocs.validCertificate?.type) validCertTypeSelect.value = validDocs.validCertificate.type;
    }
    if (validDocs.validId?.imageUrl)
        document.getElementById("validIdPreview").innerHTML = `<img src="${validDocs.validId.imageUrl}" alt="Valid ID">`;
    if (validDocs.validCertificate?.imageUrl)
        document.getElementById("validCertPreview").innerHTML = `<img src="${validDocs.validCertificate.imageUrl}" alt="Valid Certificate">`;

    validDocsModal.classList.add("show");
}

// ── Render functions ─────────────────────────────────────────
function renderWorkExperiences() {
    const workExperiencesStorage = document.getElementById("workExperiencesStorage");
    if (!workExperiencesStorage) return;
    workExperiencesStorage.innerHTML = "";
    if (workExperiences.length === 0) {
        workExperiencesStorage.innerHTML = '<p style="color:#999;font-style:italic;margin:0;">No work experiences added yet</p>';
        return;
    }
    workExperiences.forEach((exp, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "item-card";
        const start = exp.startMonth ? `${exp.startMonth}/${exp.startYear}` : exp.startYear;
        const end   = exp.endMonth   ? `${exp.endMonth}/${exp.endYear}`     : exp.endYear;
        itemCard.innerHTML = `
            <div class="item-content">
                <div class="item-title">${exp.positionName}</div>
                <div class="item-subtitle">${exp.companyName} • ${exp.location} (${start}-${end})</div>
            </div>
            <button type="button" class="item-remove-btn" data-type="work" data-index="${index}">×</button>`;
        workExperiencesStorage.appendChild(itemCard);
    });
    workExperiencesStorage.querySelectorAll(".item-remove-btn[data-type='work']").forEach(btn => {
        btn.addEventListener("click", e => {
            const doRemove = () => {
                workExperiences.splice(parseInt(e.target.dataset.index), 1);
                renderWorkExperiences(); validateSetupForm();
                notify("Work experience removed.", "info");
            };
            typeof window.showAppConfirmModal === "function"
                ? window.showAppConfirmModal({ title:"Remove Work Experience?", message:"Are you sure?", confirmLabel:"Remove", cancelLabel:"Cancel", danger:true, onConfirm:doRemove })
                : doRemove();
        });
    });
}

function renderEducationBackgrounds() {
    const educationBackgroundStorage = document.getElementById("educationBackgroundStorage");
    if (!educationBackgroundStorage) return;
    educationBackgroundStorage.innerHTML = "";
    if (educationBackgrounds.length === 0) {
        educationBackgroundStorage.innerHTML = '<p style="color:#999;font-style:italic;margin:0;">No educational background added yet</p>';
        return;
    }
    educationBackgrounds.forEach((edu, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "item-card";
        const start = edu.startMonth ? `${edu.startMonth}/${edu.startYear}` : edu.startYear;
        const end   = edu.endMonth   ? `${edu.endMonth}/${edu.endYear}`     : edu.endYear;
        itemCard.innerHTML = `
            <div class="item-content">
                <div class="item-title">${edu.schoolName}</div>
                <div class="item-subtitle">${edu.educationLevel} • ${edu.program} (${start}-${end})</div>
            </div>
            <button type="button" class="item-remove-btn" data-type="education" data-index="${index}">×</button>`;
        educationBackgroundStorage.appendChild(itemCard);
    });
    educationBackgroundStorage.querySelectorAll(".item-remove-btn[data-type='education']").forEach(btn => {
        btn.addEventListener("click", e => {
            const doRemove = () => {
                educationBackgrounds.splice(parseInt(e.target.dataset.index), 1);
                renderEducationBackgrounds(); validateSetupForm();
                notify("Education removed.", "info");
            };
            typeof window.showAppConfirmModal === "function"
                ? window.showAppConfirmModal({ title:"Remove Education?", message:"Are you sure?", confirmLabel:"Remove", cancelLabel:"Cancel", danger:true, onConfirm:doRemove })
                : doRemove();
        });
    });
}

function renderSkills() {
    const skillsStorage = document.getElementById("skillsStorage");
    if (!skillsStorage) return;
    skillsStorage.innerHTML = "";
    if (skills.length === 0) {
        skillsStorage.innerHTML = '<p style="color:#999;font-style:italic;margin:0;">No skills added yet</p>';
        return;
    }
    skills.forEach((skill, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "item-card";
        itemCard.innerHTML = `
            <div class="item-content"><div class="item-title">${skill}</div></div>
            <button type="button" class="item-remove-btn" data-type="skill" data-index="${index}">×</button>`;
        skillsStorage.appendChild(itemCard);
    });
    skillsStorage.querySelectorAll(".item-remove-btn[data-type='skill']").forEach(btn => {
        btn.addEventListener("click", e => {
            const doRemove = () => {
                skills.splice(parseInt(e.target.dataset.index), 1);
                renderSkills(); validateSetupForm();
                notify("Skill removed.", "info");
            };
            typeof window.showAppConfirmModal === "function"
                ? window.showAppConfirmModal({ title:"Remove Skill?", message:"Are you sure?", confirmLabel:"Remove", cancelLabel:"Cancel", danger:true, onConfirm:doRemove })
                : doRemove();
        });
    });
}

function renderPersonality() {
    const personalityStorage = document.getElementById("personalityStorage");
    if (!personalityStorage) return;
    personalityStorage.innerHTML = "";
    if (personality.length === 0) {
        personalityStorage.innerHTML = '<p style="color:#999;font-style:italic;margin:0;">No personality traits added yet</p>';
        return;
    }
    personality.forEach((trait, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "item-card";
        itemCard.innerHTML = `
            <div class="item-content"><div class="item-title">${trait}</div></div>
            <button type="button" class="item-remove-btn" data-type="personality" data-index="${index}">×</button>`;
        personalityStorage.appendChild(itemCard);
    });
    personalityStorage.querySelectorAll(".item-remove-btn[data-type='personality']").forEach(btn => {
        btn.addEventListener("click", e => {
            const doRemove = () => {
                personality.splice(parseInt(e.target.dataset.index), 1);
                renderPersonality(); validateSetupForm();
                notify("Personality trait removed.", "info");
            };
            typeof window.showAppConfirmModal === "function"
                ? window.showAppConfirmModal({ title:"Remove Personality Trait?", message:"Are you sure?", confirmLabel:"Remove", cancelLabel:"Cancel", danger:true, onConfirm:doRemove })
                : doRemove();
        });
    });
}

function renderProfileLinks() {
    document.querySelectorAll(".profile-links-preview").forEach(preview => {
        preview.innerHTML = "";
        if (profileLinks.length === 0) {
            preview.innerHTML = '<p class="small-muted">No profile links saved yet.</p>';
            return;
        }
        const list = document.createElement("div");
        list.className = "items-list";
        profileLinks.forEach(link => {
            const item = document.createElement("div");
            item.className = "item-card";
            item.innerHTML = `<div class="item-content"><div class="item-title">${link}</div></div>`;
            list.appendChild(item);
        });
        preview.appendChild(list);
    });
}

// ── Language row helpers ──────────────────────────────────────
function createLanguageRow(language = "", level = "") {
    const row = document.createElement("div");
    row.className = "language-row";
    row.innerHTML = `
        <div class="language-cell">
            <label>Language</label>
            <select class="language-select">
                ${languageOptions.map(o => `<option value="${o}">${o}</option>`).join("")}
            </select>
            <input type="text" class="custom-language" placeholder="Enter language" style="display:none;">
        </div>
        <div class="language-cell">
            <label>Level</label>
            <select class="level-select">
                ${levelOptions.map(o => `<option value="${o}">${o}</option>`).join("")}
            </select>
        </div>
        <button type="button" class="btn-remove-language">×</button>`;

    const select      = row.querySelector(".language-select");
    const customInput = row.querySelector(".custom-language");
    const levelSelect = row.querySelector(".level-select");

    if (language && !languageOptions.includes(language)) {
        select.value = "Other"; customInput.style.display = "block"; customInput.value = language;
    } else if (language) { select.value = language; }
    if (level) levelSelect.value = level;

    select.addEventListener("change", () => {
        customInput.style.display = select.value === "Other" ? "block" : "none";
        if (select.value !== "Other") customInput.value = "";
    });
    row.querySelector(".btn-remove-language").addEventListener("click", () => row.remove());
    return row;
}

function addLanguageRow(language = "", level = "") {
    const languageRows = document.getElementById("languageRows");
    if (languageRows) languageRows.appendChild(createLanguageRow(language, level));
}

function saveLanguages() {
    const languageRows = document.getElementById("languageRows");
    if (!languageRows) return false;
    const rows = languageRows.querySelectorAll(".language-row");
    if (rows.length === 0) { notify("Add at least one language before saving.", "warn"); return false; }
    const newLanguages = [];
    for (const row of rows) {
        const select      = row.querySelector(".language-select");
        const customInput = row.querySelector(".custom-language");
        const levelSelect = row.querySelector(".level-select");
        let lang = select.value === "Other" ? customInput.value.trim() : select.value;
        if (!lang)         { notify("Please enter a language for each row.", "warn");   return false; }
        if (!levelSelect.value) { notify("Please select a level for each language.", "warn"); return false; }
        newLanguages.push({ language: lang, level: levelSelect.value });
    }
    languages = newLanguages;
    return true;
}

// ── Profile link helpers ──────────────────────────────────────
function createProfileLinkRow(link = "") {
    const row = document.createElement("div");
    row.className = "link-row";
    row.innerHTML = `
        <div class="link-cell">
            <label>Link</label>
            <input type="text" class="profile-link-input" placeholder="https://example.com" value="${link}">
        </div>
        <button type="button" class="btn-remove-link">×</button>`;
    row.querySelector(".btn-remove-link").addEventListener("click", () => row.remove());
    return row;
}

function addProfileLinkRow(link = "") {
    const profileLinkRows = document.getElementById("profileLinkRows");
    if (profileLinkRows) profileLinkRows.appendChild(createProfileLinkRow(link));
}

function saveProfileLinks() {
    const profileLinkRows = document.getElementById("profileLinkRows");
    if (!profileLinkRows) return false;
    const rows = profileLinkRows.querySelectorAll(".link-row");
    if (rows.length === 0) { notify("Add at least one profile link before saving.", "warn"); return false; }
    const newLinks = [];
    for (const row of rows) {
        const value = row.querySelector(".profile-link-input").value.trim();
        if (!value) { notify("Please enter a link for each row.", "warn"); return false; }
        newLinks.push(value);
    }
    profileLinks = newLinks;
    renderProfileLinks();
    return true;
}

// ── Preferences helpers ───────────────────────────────────────
function resolveLabelFromCode(category, code) {
    if (!code || !window.RJGDb || typeof window.RJGDb.getDropdownOptions !== "function") return code;
    const options = window.RJGDb.getDropdownOptions(category);
    const match   = options.find(opt => opt.code === code || opt.label === code);
    return match ? match.label : code;
}

function loadPreferencesIntoForm() {
    const pref = seekerPreferences || {};
    const scheduleSelect = document.getElementById("prefSchedule");
    const settingSelect  = document.getElementById("prefSetting");
    const typeSelect     = document.getElementById("prefType");
    const currencySelect = document.getElementById("prefCurrency");
    const minRate  = document.getElementById("prefMinRate");
    const maxRate  = document.getElementById("prefMaxRate");
    const rateUnit = document.getElementById("prefRateUnit");
    const notes    = document.getElementById("prefNotes");

    if (scheduleSelect) scheduleSelect.value = resolveLabelFromCode("schedule",    pref.schedule)  || "";
    if (settingSelect)  settingSelect.value  = resolveLabelFromCode("work_setting",pref.setting)   || "";
    if (typeSelect)     typeSelect.value     = resolveLabelFromCode("job_category",pref.type)      || "";
    if (currencySelect) currencySelect.value = resolveLabelFromCode("currency",    pref.currency)  || "PHP";
    if (minRate)  minRate.value  = pref.minRate  || "";
    if (maxRate)  maxRate.value  = pref.maxRate  || "";
    if (rateUnit) rateUnit.value = resolveLabelFromCode("rate_unit", pref.rateUnit) || "hour";
    if (notes)    notes.value    = pref.notes    || "";
}

async function savePreferencesFromForm() {
    const scheduleSelect = document.getElementById("prefSchedule");
    const settingSelect  = document.getElementById("prefSetting");
    const typeSelect     = document.getElementById("prefType");
    const currencySelect = document.getElementById("prefCurrency");
    const minRate  = document.getElementById("prefMinRate");
    const maxRate  = document.getElementById("prefMaxRate");
    const rateUnit = document.getElementById("prefRateUnit");
    const notes    = document.getElementById("prefNotes");

    const minRateVal = minRate && minRate.value ? Number(minRate.value) : null;
    const maxRateVal = maxRate && maxRate.value ? Number(maxRate.value) : null;
    if (minRateVal !== null && maxRateVal !== null && minRateVal >= maxRateVal) {
        notify("Minimum rate must be less than maximum rate.", "warn");
        return;
    }
    seekerPreferences = {
        schedule: scheduleSelect ? scheduleSelect.value : "",
        scheduleOther: "",
        setting: settingSelect ? settingSelect.value : "",
        settingOther: "",
        type: typeSelect ? typeSelect.value : "",
        typeOther: "",
        currency: currencySelect ? currencySelect.value : "PHP",
        minRate: minRateVal,
        maxRate: maxRateVal,
        rateUnit: rateUnit ? rateUnit.value : "hour",
        notes: notes ? notes.value.trim() : ""
    };
    notify("Preferences saved.");
    closeModal(document.getElementById("preferencesModal"));
}

// ── Camera helpers ────────────────────────────────────────────
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
        const cameraVideo = document.getElementById("cameraVideo");
        if (cameraVideo) cameraVideo.srcObject = null;
    }
}

// ── Database bootstrap ────────────────────────────────────────
async function bootstrapFromDatabase() {
    if (!await ensureAuthenticated()) return;
    if (!window.RJGDb) return;
    try {
        const [roleResult, profile, prefs] = await Promise.all([
            typeof window.RJGDb.getCurrentUserRole === "function"    ? window.RJGDb.getCurrentUserRole()    : Promise.resolve(""),
            typeof window.RJGDb.loadCurrentUserProfile === "function"? window.RJGDb.loadCurrentUserProfile(): Promise.resolve(null),
            typeof window.RJGDb.loadSeekerPreferences === "function" ? window.RJGDb.loadSeekerPreferences() : Promise.resolve(null)
        ]);
        if (prefs) seekerPreferences = prefs;

        const roleLower = String(roleResult || pendingSignupRole || "seeker").toLowerCase();
        applyFormToggle(roleLower);

        if (sessionStorage.getItem("forceProfileSetup") === "1") {
            sessionStorage.removeItem("forceProfileSetup");
            notify("Please finish setting up your profile.", "info");
        }

        if (profile) {
            const nameInput             = document.getElementById("seekerName");
            const employerNameInput     = document.getElementById("employerCompanyName");
            const contactInput          = document.getElementById("seekerContact");
            const empContactInput       = document.getElementById("employerContact");
            const descriptionInput      = document.getElementById("seekerDescription");
            const educationStatusSelect = document.getElementById("seekerEducationStatus");
            const sexSelect             = document.querySelector(".seeking-form .sex-select");
            const birthDateInput        = document.getElementById("seekerBirthDate");
            const seekerProfilePicPreview = document.getElementById("seekerProfilePicPreview");

            if (roleLower === "recruiter" || roleLower === "employer") {
                if (employerNameInput) employerNameInput.value = profile.firstName || "";
                if (empContactInput)   empContactInput.value   = profile.phone     || "";
            } else {
                if (nameInput)             nameInput.value             = profile.name            || "";
                if (contactInput)          contactInput.value          = profile.phone           || "";
                if (descriptionInput)      descriptionInput.value      = profile.description     || "";
                if (educationStatusSelect && profile.educationStatus)
                    educationStatusSelect.value = profile.educationStatus;
                if (sexSelect && profile.sex)           sexSelect.value      = profile.sex;
                if (birthDateInput && profile.birthDate) birthDateInput.value = profile.birthDate;
            }

            const addr = profile.address && typeof profile.address === "object" ? profile.address : {};
            address = {
                unitNo: addr.unitNo || "", street: addr.street || "",
                region: addr.region || "", barangay: addr.barangay || "",
                city: addr.city || "", province: addr.province || "",
                country: addr.country || "", zip: addr.zip || ""
            };
            workExperiences    = Array.isArray(profile.workExperiences)    ? profile.workExperiences.slice(0, MAX_WORK_EXPERIENCES)    : [];
            educationBackgrounds = Array.isArray(profile.educationBackgrounds) ? profile.educationBackgrounds.slice(0, MAX_EDUCATION_HISTORY) : [];
            skills       = Array.isArray(profile.skills)       ? profile.skills.slice()       : [];
            languages    = Array.isArray(profile.languages)    ? profile.languages.slice()    : [];
            profileLinks = Array.isArray(profile.profileLinks) ? profile.profileLinks.slice() : [];
            personality  = Array.isArray(profile.personality)  ? profile.personality.slice()  : [];

            renderWorkExperiences();
            renderEducationBackgrounds();
            renderSkills();
            renderPersonality();
            renderProfileLinks();
            validateSetupForm();

            if (seekerProfilePicPreview && profile.avatarUrl) {
                pendingProfilePicUrl = profile.avatarUrl;
                seekerProfilePicPreview.innerHTML = `<img src="${profile.avatarUrl}" alt="Profile preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
        }
    } catch (err) {
        console.error("Unable to bootstrap setup page:", err);
    }
}

// ── Name modal functions ──────────────────────────────────────
function openNameEditModal() {
    const nameModal       = document.getElementById("nameEditModal");
    const lastNameInput   = document.getElementById("lastNameInput");
    const firstNameInput  = document.getElementById("firstNameInput");
    const middleNameInput = document.getElementById("middleNameInput");
    const suffixInput     = document.getElementById("suffixInput");
    if (!nameModal) return;
    if (lastNameInput)   lastNameInput.value   = setupNameData.lastName;
    if (firstNameInput)  firstNameInput.value  = setupNameData.firstName;
    if (middleNameInput) middleNameInput.value  = setupNameData.middleName;
    if (suffixInput)     suffixInput.value      = setupNameData.suffix;
    nameModal.style.display = "block";
}

function closeNameEditModal() {
    const nameModal = document.getElementById("nameEditModal");
    if (nameModal) nameModal.style.display = "none";
}

function saveNameChanges() {
    const lastNameInput   = document.getElementById("lastNameInput");
    const firstNameInput  = document.getElementById("firstNameInput");
    const middleNameInput = document.getElementById("middleNameInput");
    const suffixInput     = document.getElementById("suffixInput");
    const lastName   = lastNameInput   ? lastNameInput.value.trim()   : "";
    const firstName  = firstNameInput  ? firstNameInput.value.trim()  : "";
    const middleName = middleNameInput ? middleNameInput.value.trim() : "";
    const suffix     = suffixInput     ? suffixInput.value.trim()     : "";
    if (!lastName || !firstName) { notify("Last Name and First Name are required.", "warn"); return; }
    setupNameData = { lastName, firstName, middleName, suffix };
    closeNameEditModal();
    validateSetupForm();
    notify("Name saved.");
}

// ════════════════════════════════════════════════════════════
//  DOMContentLoaded — ALL DOM queries & event listeners here
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

    // ── Element references ──────────────────────────────────
    const toggleBtns        = document.querySelectorAll(".toggle-btn");
    const seekingForm       = document.querySelector(".seeking-form");
    const recruitmentForm   = document.querySelector(".recruitment-form");
    const toggleSection     = document.querySelector(".toggle-section");
    const saveBtn           = document.querySelector(".save-btn");

    const workExperienceModal  = document.getElementById("workExperienceModal");
    const educationModal       = document.getElementById("educationModal");
    const skillsModal          = document.getElementById("skillsModal");
    const languagesModal       = document.getElementById("languagesModal");
    const addressModal         = document.getElementById("addressModal");
    const personalityModal     = document.getElementById("personalityModal");
    const preferencesModal     = document.getElementById("preferencesModal");
    const validDocsModal       = document.getElementById("validDocsModal");
    const profileLinksModal    = document.getElementById("profileLinksModal");
    const cameraModal          = document.getElementById("cameraModal");

    const regionSelect    = document.getElementById("regionSelect");
    const provinceSelect  = document.getElementById("provinceSelect");
    const citySelect      = document.getElementById("citySelect");
    const barangaySelect  = document.getElementById("barangaySelect");

    const addWorkExperienceBtn         = document.getElementById("addWorkExperienceBtn");
    const addEducationBtn              = document.getElementById("addEducationBtn");
    const addSkillsBtn                 = document.getElementById("addSkillsBtn");
    const addLanguagesBtn              = document.getElementById("addLanguagesBtn");
    const addSkillsToStorageBtn        = document.getElementById("addSkillsToStorage");
    const addPersonalityToStorageBtn   = document.getElementById("addPersonalityToStorage");
    const addPersonalityBtn            = document.getElementById("addPersonalityBtn");
    const addPreferencesBtn            = document.getElementById("addPreferencesBtn");
    const addLanguageRowBtn            = document.getElementById("addLanguageRowBtn");
    const addProfileLinksBtn           = document.getElementById("addProfileLinksBtn");
    const addProfileLinksBtnRecruitment = document.getElementById("addProfileLinksBtnRecruitment");
    const editAddressBtnSeeking        = document.getElementById("editAddressBtnSeeking");
    const editAddressBtnRecruitment    = document.getElementById("editAddressBtnRecruitment");
    const saveAddressBtn               = document.getElementById("saveAddressBtn");
    const addValidDocsBtn              = document.getElementById("addValidDocsBtn");
    const saveValidDocsBtn             = document.getElementById("saveValidDocsBtn");
    const savePreferencesBtn           = document.getElementById("savePreferencesBtn");

    const seekerProfilePicBtn      = document.getElementById("seekerProfilePicBtn");
    const seekerProfilePicInput    = document.getElementById("seekerProfilePicInput");
    const seekerProfilePicPreview  = document.getElementById("seekerProfilePicPreview");
    const seekerProfilePicCaptureBtn = document.getElementById("seekerProfilePicCaptureBtn");

    const cameraVideo      = document.getElementById("cameraVideo");
    const cameraCanvas     = document.getElementById("cameraCanvas");
    const cameraCaptureBtn = document.getElementById("cameraCaptureBtn");
    const cameraModalClose = document.getElementById("cameraModalClose");

    const birthDateInput     = document.getElementById("seekerBirthDate");
    const descriptionInput   = document.getElementById("seekerDescription");
    const zipInput           = document.getElementById("zipInput");
    const seekerContactInput = document.getElementById("seekerContact");
    const employerContactInput = document.getElementById("employerContact");

    const editNameBtnSeeking   = document.getElementById("editNameBtnSeeking");
    const nameEditModalClose   = document.getElementById("nameEditModalClose");
    const nameEditModalSave    = document.getElementById("nameEditModalSave");
    const nameModal            = document.getElementById("nameEditModal");

    // ── Initialise toggle ────────────────────────────────────
    const isRecruiterSetup = pendingSignupRole === "recruiter" || pendingSignupRole === "employer";
    if (isRecruiterSetup) {
        recruitmentForm?.classList.add("active");
        seekingForm?.classList.remove("active");
        toggleBtns[1]?.classList.add("active");
        toggleBtns[0]?.classList.remove("active");
    } else {
        seekingForm?.classList.add("active");
        recruitmentForm?.classList.remove("active");
        toggleBtns[0]?.classList.add("active");
        toggleBtns[1]?.classList.remove("active");
    }
    if (toggleSection) toggleSection.style.display = "none";

    // ── Toggle buttons ───────────────────────────────────────
    if (toggleBtns[0]) toggleBtns[0].addEventListener("click", () => {
        seekingForm?.classList.add("active");
        recruitmentForm?.classList.remove("active");
        toggleBtns[0].classList.add("active");
        toggleBtns[1]?.classList.remove("active");
        validateSetupForm();
    });
    if (toggleBtns[1]) toggleBtns[1].addEventListener("click", () => {
        seekingForm?.classList.remove("active");
        recruitmentForm?.classList.add("active");
        toggleBtns[1].classList.add("active");
        toggleBtns[0]?.classList.remove("active");
        validateSetupForm();
    });

    // ── Save button: disable until form valid ────────────────
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.5";
        saveBtn.style.cursor  = "not-allowed";
    }

    // ── Form validation listeners ────────────────────────────
    setupFormValidationListeners();
    validateSetupForm();

    // ── Initial renders ──────────────────────────────────────
    renderWorkExperiences();
    renderEducationBackgrounds();
    renderSkills();
    renderPersonality();
    renderProfileLinks();

    // ── Load regions & bootstrap ─────────────────────────────
    loadRegions();
    bootstrapFromDatabase();

    // ── Sign-up success toast ────────────────────────────────
    const signupSuccessToast = sessionStorage.getItem("signupSuccessToast");
    if (signupSuccessToast) {
        notify(signupSuccessToast, "success");
        sessionStorage.removeItem("signupSuccessToast");
    }

    // ── Modal open buttons ───────────────────────────────────
    if (addWorkExperienceBtn) addWorkExperienceBtn.addEventListener("click", () => {
        if (workExperiences.length >= MAX_WORK_EXPERIENCES) {
            notify(`You can only add up to ${MAX_WORK_EXPERIENCES} work experiences.`, "warn"); return;
        }
        openWorkExperienceModal();
    });
    if (addEducationBtn)       addEducationBtn.addEventListener("click",     openEducationModal);
    if (addLanguagesBtn)       addLanguagesBtn.addEventListener("click",     openLanguagesModal);
    if (addSkillsBtn)          addSkillsBtn.addEventListener("click",        openSkillsModal);
    if (addProfileLinksBtn)    addProfileLinksBtn.addEventListener("click",  openProfileLinksModal);
    if (addProfileLinksBtnRecruitment) addProfileLinksBtnRecruitment.addEventListener("click", openProfileLinksModal);
    if (editAddressBtnSeeking)    editAddressBtnSeeking.addEventListener("click",    openAddressModal);
    if (editAddressBtnRecruitment) editAddressBtnRecruitment.addEventListener("click", openAddressModal);
    if (addPersonalityBtn)     addPersonalityBtn.addEventListener("click",   openPersonalityModal);
    if (addPreferencesBtn)     addPreferencesBtn.addEventListener("click",   openPreferencesModal);
    if (addValidDocsBtn)       addValidDocsBtn.addEventListener("click",     openValidDocsModal);

    // ── Modal close buttons (×) ──────────────────────────────
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", e => closeModal(e.target.closest(".modal-overlay")));
    });

    // ── Click-outside to close modals ────────────────────────
    [workExperienceModal, educationModal, skillsModal, languagesModal,
     addressModal, personalityModal, preferencesModal, profileLinksModal].forEach(modal => {
        if (modal) modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
    });
    if (validDocsModal) validDocsModal.addEventListener("click", e => { if (e.target === validDocsModal) closeModal(validDocsModal); });

    const validDocsModalClose = document.getElementById("validDocsModalClose");
    if (validDocsModalClose) validDocsModalClose.addEventListener("click", () => closeModal(validDocsModal));

    // ── Done buttons in language / profile-links modals ──────
    document.querySelectorAll(".btn-done").forEach(btn => {
        btn.addEventListener("click", e => {
            const modal = e.target.closest(".modal-overlay");
            if (modal === languagesModal) {
                if (saveLanguages()) { closeModal(modal); validateSetupForm(); }
            } else if (modal === profileLinksModal) {
                if (saveProfileLinks()) { closeModal(modal); validateSetupForm(); }
            } else { closeModal(modal); }
        });
    });

    // ── Add row buttons inside modals ────────────────────────
    if (addLanguageRowBtn)  addLanguageRowBtn.addEventListener("click",  () => addLanguageRow());
    const addProfileLinkRowBtn = document.getElementById("addProfileLinkRowBtn");
    if (addProfileLinkRowBtn) addProfileLinkRowBtn.addEventListener("click", () => addProfileLinkRow());

    // ── Work experience form submit ──────────────────────────
    workExperienceModal?.querySelector(".modal-form")?.addEventListener("submit", e => {
        e.preventDefault();
        const textInputs  = workExperienceModal.querySelectorAll(".modal-form > .form-group input[type='text']");
        const yearInputs  = workExperienceModal.querySelectorAll(".year-input");
        const monthSelects = workExperienceModal.querySelectorAll(".month-select");
        const positionName = textInputs[0]?.value.trim() || "";
        const companyName  = textInputs[1]?.value.trim() || "";
        const location     = textInputs[2]?.value.trim() || "";
        const startYear  = yearInputs[0]?.value.trim()  || "";
        const startMonth = monthSelects[0]?.value.trim()|| "";
        const endYear    = yearInputs[1]?.value.trim()  || "";
        const endMonth   = monthSelects[1]?.value.trim()|| "";
        if (!positionName || !companyName || !location || !startYear || !startMonth || !endYear || !endMonth) {
            notify("Please fill in all fields", "warn"); return;
        }
        const sy = Number(startYear), ey = Number(endYear);
        const sm = Number(startMonth), em = Number(endMonth);
        if (!Number.isInteger(sy) || !Number.isInteger(ey)) { notify("Please enter valid years.", "warn"); return; }
        if (sy > ey || (sy === ey && sm > em)) { notify("Start date must be earlier than or equal to end date.", "warn"); return; }
        if (workExperiences.length >= MAX_WORK_EXPERIENCES) { notify(`Max ${MAX_WORK_EXPERIENCES} work experiences.`, "warn"); return; }
        workExperiences.push({ positionName, companyName, location, startMonth, startYear, endMonth, endYear });
        renderWorkExperiences(); validateSetupForm();
        workExperienceModal.querySelector(".modal-form").reset();
        notify("Work experience added.");
    });

    // ── Education form submit ────────────────────────────────
    educationModal?.querySelector(".modal-form")?.addEventListener("submit", e => {
        e.preventDefault();
        const [schoolInput, programInput] = Array.from(educationModal.querySelectorAll("input")).slice(0, 2);
        const yearInputs  = educationModal.querySelectorAll(".year-input");
        const monthSelects = educationModal.querySelectorAll(".month-select");
        const select = educationModal.querySelector("select");
        const educationLevel = select?.value.trim() || "";
        const schoolName  = schoolInput?.value.trim() || "";
        const program     = programInput?.value.trim() || "";
        const startYear   = yearInputs[0]?.value.trim()  || "";
        const startMonth  = monthSelects[0]?.value.trim()|| "";
        const endYear     = yearInputs[1]?.value.trim()  || "";
        const endMonth    = monthSelects[1]?.value.trim()|| "";
        if (!educationLevel || !schoolName || !startYear || !startMonth || !endYear || !endMonth) {
            notify("Please fill in all required fields", "warn"); return;
        }
        const sy = Number(startYear), ey = Number(endYear);
        const sm = Number(startMonth), em = Number(endMonth);
        if (!Number.isInteger(sy) || !Number.isInteger(ey)) { notify("Please enter valid years.", "warn"); return; }
        if (sy > ey || (sy === ey && sm > em)) { notify("Start date must be earlier than or equal to end date.", "warn"); return; }
        if (educationBackgrounds.length >= MAX_EDUCATION_HISTORY) { notify(`Max ${MAX_EDUCATION_HISTORY} education entries.`, "warn"); return; }
        educationBackgrounds.push({ educationLevel, schoolName, program: program || "NA", startMonth, startYear, endMonth, endYear });
        renderEducationBackgrounds(); validateSetupForm();
        educationModal.querySelector(".modal-form").reset();
        notify("Educational background added.");
    });

    // ── Personality – add to storage ─────────────────────────
    if (addPersonalityToStorageBtn) addPersonalityToStorageBtn.addEventListener("click", () => {
        const checkedBoxes = personalityModal?.querySelectorAll("input[type='checkbox']:checked") || [];
        if (personality.length + checkedBoxes.length > 5) { notify("Maximum 5 personality traits.", "warn"); return; }
        checkedBoxes.forEach(box => { if (!personality.includes(box.value)) personality.push(box.value); });
        renderPersonality(); validateSetupForm();
        notify("Personality traits updated.");
        checkedBoxes.forEach(box => box.checked = false);
    });

    // ── Skills – add to storage ───────────────────────────────
    if (addSkillsToStorageBtn) addSkillsToStorageBtn.addEventListener("click", () => {
        const checkedBoxes = skillsModal?.querySelectorAll("input[type='checkbox']:checked") || [];
        if (skills.length + checkedBoxes.length > 5) { notify("Maximum 5 skills.", "warn"); return; }
        checkedBoxes.forEach(box => { if (!skills.includes(box.value)) skills.push(box.value); });
        renderSkills(); validateSetupForm();
        notify("Skills updated.");
        checkedBoxes.forEach(box => box.checked = false);
    });

    // ── Address – save ───────────────────────────────────────
    if (saveAddressBtn) saveAddressBtn.addEventListener("click", () => {
        const unitNoEl      = document.getElementById("unitNoInput");
        const streetInput   = document.getElementById("streetInput");
        const countryInput  = document.getElementById("countryInput");
        const zipEl         = document.getElementById("zipInput");
        const unitNo  = unitNoEl    ? unitNoEl.value.trim()    : "";
        const street  = streetInput ? streetInput.value.trim() : "";
        const country = countryInput? countryInput.value.trim(): "";
        const zip     = zipEl       ? zipEl.value.trim()       : "";
        const region   = regionSelect?.options[regionSelect.selectedIndex]?.text   || "";
        const province = provinceSelect?.options[provinceSelect.selectedIndex]?.text || "";
        const city     = citySelect?.options[citySelect.selectedIndex]?.text       || "";
        const barangay = barangaySelect?.options[barangaySelect.selectedIndex]?.text || "";
        if (!street)                  { notify("Please enter your street address.", "warn"); return; }
        if (!regionSelect?.value)     { notify("Please select a region.", "warn");           return; }
        if (!provinceSelect?.value)   { notify("Please select a province.", "warn");         return; }
        if (!citySelect?.value)       { notify("Please select a city.", "warn");             return; }
        if (!barangaySelect?.value)   { notify("Please select a barangay.", "warn");         return; }
        if (!country)                 { notify("Please enter your country.", "warn");         return; }
        if (!zip)                     { notify("Please enter your ZIP code.", "warn");        return; }
        address = { unitNo, street, region, barangay, city, province, country, zip };
        closeModal(addressModal); validateSetupForm();
        notify("Address saved.");
    });

    // ── PSGC cascading selects ───────────────────────────────
    if (regionSelect) regionSelect.addEventListener("change", async () => {
        const code = regionSelect.value;
        provinceSelect.innerHTML = '<option value="">Select Province</option>';
        citySelect.innerHTML     = '<option value="">Select City</option>';
        barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
        provinceSelect.disabled  = !code;
        citySelect.disabled      = true;
        barangaySelect.disabled  = true;
        if (code) {
            const provinces = await fetchPSGC(`https://psgc.cloud/api/regions/${code}/provinces`);
            provinces.sort((a,b) => a.name.localeCompare(b.name));
            provinces.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.code; opt.textContent = p.name;
                provinceSelect.appendChild(opt);
            });
        }
    });
    if (provinceSelect) provinceSelect.addEventListener("change", async () => {
        const code = provinceSelect.value;
        citySelect.innerHTML     = '<option value="">Select City</option>';
        barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
        citySelect.disabled      = !code;
        barangaySelect.disabled  = true;
        if (code) {
            const cities = await fetchPSGC(`https://psgc.cloud/api/provinces/${code}/cities-municipalities`);
            cities.sort((a,b) => a.name.localeCompare(b.name));
            cities.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.code; opt.textContent = c.name;
                citySelect.appendChild(opt);
            });
        }
    });
    if (citySelect) citySelect.addEventListener("change", async () => {
        const code = citySelect.value;
        barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
        barangaySelect.disabled  = !code;
        if (code) {
            const barangays = await fetchPSGC(`https://psgc.cloud/api/cities-municipalities/${code}/barangays`);
            barangays.sort((a,b) => a.name.localeCompare(b.name));
            barangays.forEach(b => {
                const opt = document.createElement("option");
                opt.value = b.code; opt.textContent = b.name;
                barangaySelect.appendChild(opt);
            });
        }
    });

    // ── Input length clamps ──────────────────────────────────
    if (zipInput) zipInput.addEventListener("input", e => {
        if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4);
    });
    if (seekerContactInput) seekerContactInput.addEventListener("input", e => {
        if (e.target.value.length > 11) e.target.value = e.target.value.slice(0, 11);
    });
    if (employerContactInput) employerContactInput.addEventListener("input", e => {
        if (e.target.value.length > 11) e.target.value = e.target.value.slice(0, 11);
    });

    // ── Birth date ────────────────────────────────────────────
    if (birthDateInput) {
        birthDateInput.placeholder = "YYYY-MM-DD";
        const fifteenYearsAgo = new Date();
        fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
        birthDateInput.setAttribute("max", fifteenYearsAgo.toISOString().split("T")[0]);
        birthDateInput.addEventListener("change", () => {
            if (birthDateInput.value) {
                const sel = new Date(birthDateInput.value);
                const min = new Date();
                min.setFullYear(min.getFullYear() - 15);
                if (sel > min) { notify("You must be at least 15 years old.", "warn"); birthDateInput.value = ""; }
            }
        });
    }

    // ── Description clamp ────────────────────────────────────
    if (descriptionInput) descriptionInput.addEventListener("input", () => clampDescriptionValue(descriptionInput));

    // ── Profile picture upload ────────────────────────────────
    if (seekerProfilePicBtn && seekerProfilePicInput)
        seekerProfilePicBtn.addEventListener("click", () => seekerProfilePicInput.click());
    if (seekerProfilePicInput) seekerProfilePicInput.addEventListener("change", e => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { notify("Image must be under 3MB.", "warn"); seekerProfilePicInput.value = ""; return; }
        pendingProfilePicFile = file;
        const url = URL.createObjectURL(file);
        pendingProfilePicUrl = url;
        if (seekerProfilePicPreview)
            seekerProfilePicPreview.innerHTML = `<img src="${url}" alt="Profile preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    });

    // ── Camera: profile picture ───────────────────────────────
    if (seekerProfilePicCaptureBtn) seekerProfilePicCaptureBtn.addEventListener("click", async () => {
        if (!cameraModal) return;
        currentDocCameraTarget = null;
        cameraModal.classList.add("show");
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"user", width:640, height:480 } });
            if (cameraVideo) cameraVideo.srcObject = cameraStream;
        } catch (err) {
            console.error("Camera access denied:", err);
            notify("Unable to access camera. Please allow camera permissions or use Choose Image.", "warn");
            closeModal(cameraModal);
        }
    });

    // ── Camera: capture ───────────────────────────────────────
    if (cameraCaptureBtn) cameraCaptureBtn.addEventListener("click", () => {
        if (!cameraStream || !cameraVideo || !cameraCanvas) return;
        cameraCanvas.width  = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;
        cameraCanvas.getContext("2d").drawImage(cameraVideo, 0, 0);
        cameraCanvas.toBlob(blob => {
            if (!blob) return;
            if (currentDocCameraTarget === "validId") {
                const file = new File([blob], "valid-id.jpg", { type:"image/jpeg" });
                if (file.size > 5*1024*1024) { notify("Image must be under 5MB.", "warn"); return; }
                validIdFile = file;
                const preview = document.getElementById("validIdPreview");
                if (preview) preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Valid ID preview">`;
            } else if (currentDocCameraTarget === "validCert") {
                const file = new File([blob], "valid-cert.jpg", { type:"image/jpeg" });
                if (file.size > 5*1024*1024) { notify("Image must be under 5MB.", "warn"); return; }
                validCertFile = file;
                const preview = document.getElementById("validCertPreview");
                if (preview) preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Valid Cert preview">`;
            } else {
                const file = new File([blob], "profile-photo.jpg", { type:"image/jpeg" });
                if (file.size > 3*1024*1024) { notify("Photo must be under 3MB.", "warn"); return; }
                pendingProfilePicFile = file;
                const url = URL.createObjectURL(file);
                pendingProfilePicUrl  = url;
                if (seekerProfilePicPreview)
                    seekerProfilePicPreview.innerHTML = `<img src="${url}" alt="Profile preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                validateSetupForm();
                notify("Photo captured.");
            }
            closeModal(cameraModal); stopCamera();
        }, "image/jpeg", 0.85);
    });

    if (cameraModalClose) cameraModalClose.addEventListener("click", () => { closeModal(cameraModal); stopCamera(); });
    if (cameraModal) cameraModal.addEventListener("click", e => { if (e.target === cameraModal) { closeModal(cameraModal); stopCamera(); } });

    // ── Valid Docs modal toggles & uploads ────────────────────
    const validIdUploadBtn    = document.getElementById("validIdUploadBtn");
    const validIdCaptureBtn   = document.getElementById("validIdCaptureBtn");
    const validIdUploadGroup  = document.getElementById("validIdUploadGroup");
    const validIdCaptureGroup = document.getElementById("validIdCaptureGroup");
    if (validIdUploadBtn && validIdCaptureBtn) {
        validIdUploadBtn.addEventListener("click", () => {
            validIdUploadBtn.classList.add("active"); validIdCaptureBtn.classList.remove("active");
            if (validIdUploadGroup) validIdUploadGroup.style.display = "block";
            if (validIdCaptureGroup) validIdCaptureGroup.style.display = "none";
        });
        validIdCaptureBtn.addEventListener("click", () => {
            validIdCaptureBtn.classList.add("active"); validIdUploadBtn.classList.remove("active");
            if (validIdCaptureGroup) validIdCaptureGroup.style.display = "block";
            if (validIdUploadGroup) validIdUploadGroup.style.display = "none";
        });
    }
    const validCertUploadBtn    = document.getElementById("validCertUploadBtn");
    const validCertCaptureBtn   = document.getElementById("validCertCaptureBtn");
    const validCertUploadGroup  = document.getElementById("validCertUploadGroup");
    const validCertCaptureGroup = document.getElementById("validCertCaptureGroup");
    if (validCertUploadBtn && validCertCaptureBtn) {
        validCertUploadBtn.addEventListener("click", () => {
            validCertUploadBtn.classList.add("active"); validCertCaptureBtn.classList.remove("active");
            if (validCertUploadGroup) validCertUploadGroup.style.display = "block";
            if (validCertCaptureGroup) validCertCaptureGroup.style.display = "none";
        });
        validCertCaptureBtn.addEventListener("click", () => {
            validCertCaptureBtn.classList.add("active"); validCertUploadBtn.classList.remove("active");
            if (validCertCaptureGroup) validCertCaptureGroup.style.display = "block";
            if (validCertUploadGroup) validCertUploadGroup.style.display = "none";
        });
    }
    const validIdInput       = document.getElementById("validIdInput");
    const validIdSelectBtn   = document.getElementById("validIdSelectBtn");
    const validIdPreview     = document.getElementById("validIdPreview");
    if (validIdSelectBtn && validIdInput) validIdSelectBtn.addEventListener("click", () => validIdInput.click());
    if (validIdInput) validIdInput.addEventListener("change", e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 5*1024*1024) { notify("Image must be under 5MB.", "warn"); validIdInput.value = ""; return; }
        validIdFile = file;
        if (validIdPreview) validIdPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Valid ID preview">`;
    });
    const validIdCameraBtn = document.getElementById("validIdCameraBtn");
    if (validIdCameraBtn) validIdCameraBtn.addEventListener("click", () => {
        currentDocCameraTarget = "validId";
        if (cameraModal) cameraModal.classList.add("show");
        navigator.mediaDevices.getUserMedia({ video: { facingMode:"user", width:640, height:480 } })
            .then(stream => { cameraStream = stream; if (cameraVideo) cameraVideo.srcObject = stream; })
            .catch(err => { console.error("Camera access denied:", err); notify("Unable to access camera.", "warn"); });
    });

    const validCertInput     = document.getElementById("validCertInput");
    const validCertSelectBtn = document.getElementById("validCertSelectBtn");
    const validCertPreview   = document.getElementById("validCertPreview");
    if (validCertSelectBtn && validCertInput) validCertSelectBtn.addEventListener("click", () => validCertInput.click());
    if (validCertInput) validCertInput.addEventListener("change", e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 5*1024*1024) { notify("Image must be under 5MB.", "warn"); validCertInput.value = ""; return; }
        validCertFile = file;
        if (validCertPreview) validCertPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Valid Cert preview">`;
    });
    const validCertCameraBtn = document.getElementById("validCertCameraBtn");
    if (validCertCameraBtn) validCertCameraBtn.addEventListener("click", () => {
        currentDocCameraTarget = "validCert";
        if (cameraModal) cameraModal.classList.add("show");
        navigator.mediaDevices.getUserMedia({ video: { facingMode:"user", width:640, height:480 } })
            .then(stream => { cameraStream = stream; if (cameraVideo) cameraVideo.srcObject = stream; })
            .catch(err => { console.error("Camera access denied:", err); notify("Unable to access camera.", "warn"); });
    });

    // ── Save Valid Docs ───────────────────────────────────────
    if (saveValidDocsBtn) saveValidDocsBtn.addEventListener("click", () => {
        const validIdType   = document.getElementById("validIdType")?.value   || "";
        const validCertType = document.getElementById("validCertType")?.value || "";
        if (!validIdType && !validCertType) { notify("Please select at least one document type.", "warn"); return; }
        if (validIdType   && !validIdFile)   { notify("Please upload or capture a Valid ID image.", "warn"); return; }
        if (validCertType && !validCertFile) { notify("Please upload or capture a Valid Certificate image.", "warn"); return; }
        validDocs = {};
        if (validIdType && validIdFile)
            validDocs.validId = { type:validIdType, file:validIdFile, imageUrl:URL.createObjectURL(validIdFile) };
        if (validCertType && validCertFile)
            validDocs.validCertificate = { type:validCertType, file:validCertFile, imageUrl:URL.createObjectURL(validCertFile) };
        closeModal(validDocsModal);
        notify("Valid Documentations saved.");
    });

    // ── Preferences save ─────────────────────────────────────
    if (savePreferencesBtn) savePreferencesBtn.addEventListener("click", savePreferencesFromForm);

    // ── Name modal ────────────────────────────────────────────
    if (editNameBtnSeeking)  editNameBtnSeeking.addEventListener("click",  openNameEditModal);
    if (nameEditModalClose)  nameEditModalClose.addEventListener("click",  closeNameEditModal);
    if (nameEditModalSave)   nameEditModalSave.addEventListener("click",   saveNameChanges);
    if (nameModal) nameModal.addEventListener("click", e => { if (e.target === nameModal) closeNameEditModal(); });

    // ── Main Save button ──────────────────────────────────────
    if (saveBtn) saveBtn.addEventListener("click", async e => {
        e.preventDefault();
        if (saveBtn.disabled) return;

        const activeForm  = document.querySelector(".form-section.active") || seekingForm;
        const isSeeking   = activeForm?.classList.contains("seeking-form");
        const nameInput   = isSeeking ? document.getElementById("seekerName")          : document.getElementById("employerCompanyName");
        const contactInput = isSeeking ? document.getElementById("seekerContact")       : document.getElementById("employerContact");
        const sexSelect        = isSeeking ? activeForm.querySelector(".sex-select")    : null;
        const birthDateEl      = isSeeking ? document.getElementById("seekerBirthDate") : null;
        const descriptionEl    = isSeeking ? document.getElementById("seekerDescription") : null;
        const educationStatusEl = isSeeking ? document.getElementById("seekerEducationStatus") : null;

        let profileName = "";
        if (isSeeking) {
            // Only include lastName and firstName in profileName to avoid parsing issues
            const nameParts = [setupNameData.lastName, setupNameData.firstName];
            profileName = setupNameData.lastName
                ? `${setupNameData.lastName}, ${setupNameData.firstName}`
                : setupNameData.firstName;
        } else {
            profileName = nameInput ? nameInput.value.trim() : "";
        }
        if (profileName) localStorage.setItem("profileName", profileName);

        const accountData = JSON.parse(localStorage.getItem("accountData") || "{}");
        let avatarUrl = "";
        try {
            const existing = JSON.parse(localStorage.getItem("profileData") || "{}");
            if (existing && typeof existing === "object") avatarUrl = String(existing.avatarUrl || "").trim();
        } catch (_) {}

        if (isSeeking && pendingProfilePicFile && window.RJGDb?.uploadProfileImage) {
            try {
                const uploaded = await window.RJGDb.uploadProfileImage(pendingProfilePicFile);
                if (uploaded) avatarUrl = uploaded;
            } catch (err) {
                console.error("Profile picture upload failed:", err);
                notify("Profile picture upload failed. Please check your Supabase storage policy.", "error");
                return;
            }
        }

        let idUrl = "", certUrl = "";
        if (isSeeking && validDocs.validId?.file && window.RJGDb?.uploadFile) {
            try {
                idUrl = await window.RJGDb.uploadFile(validDocs.validId.file, "id-image");
                if (!idUrl) throw new Error("Upload returned empty URL");
            } catch (err) {
                console.error("Valid ID upload failed:", err);
                notify("Valid ID upload failed. Please check your Supabase storage policy.", "error");
                return;
            }
        }
        if (isSeeking && validDocs.validCertificate?.file && window.RJGDb?.uploadFile) {
            try {
                certUrl = await window.RJGDb.uploadFile(validDocs.validCertificate.file, "cert-image");
                if (!certUrl) throw new Error("Upload returned empty URL");
            } catch (err) {
                console.error("Valid Certificate upload failed:", err);
                notify("Valid Certificate upload failed. Please check your Supabase storage policy.", "error");
                return;
            }
        }

        let descriptionValue = descriptionEl ? descriptionEl.value.trim() : "";
        if (descriptionValue.length > MAX_DESCRIPTION_LENGTH) descriptionValue = descriptionValue.slice(0, MAX_DESCRIPTION_LENGTH);

        if (isSeeking && birthDateEl?.value) {
            const sel = new Date(birthDateEl.value);
            const min = new Date();
            min.setFullYear(min.getFullYear() - 15);
            if (sel > min) { notify("You must be at least 15 years old.", "warn"); return; }
        }

        const profileData = {
            name: profileName,
            lastName:   isSeeking ? (setupNameData.lastName   || null) : null,
            firstName:  isSeeking ? (setupNameData.firstName  || null) : profileName,
            middleName: isSeeking ? (setupNameData.middleName || null) : null,
            suffix:     isSeeking ? (setupNameData.suffix     || null) : null,
            email: accountData.email || "",
            role:  isSeeking ? "seeker" : "employer",
            phone: contactInput ? contactInput.value.trim() : "",
            address: { ...address },
            description: descriptionValue,
            sex:         isSeeking && sexSelect        ? sexSelect.value        : "",
            birthDate:   isSeeking && birthDateEl      ? birthDateEl.value      : "",
            educationStatus: isSeeking && educationStatusEl ? educationStatusEl.value : "",
            workExperiences:    isSeeking ? [...workExperiences]    : [],
            educationBackgrounds: isSeeking ? [...educationBackgrounds] : [],
            skills:      isSeeking ? [...skills]      : [],
            languages:   isSeeking ? [...languages]   : [],
            profileLinks: [...profileLinks],
            personality: isSeeking ? [...personality] : [],
            avatar_url: avatarUrl || "",
            id_url:     idUrl     || "",
            cert_url:   certUrl   || "",
            _resetIdStatus:   !!idUrl,
            _resetCertStatus: !!certUrl,
            preferences: seekerPreferences || null
        };

        localStorage.setItem("profileData", JSON.stringify(profileData));

        try {
            if (window.RJGDb?.saveCurrentUserProfile) await window.RJGDb.saveCurrentUserProfile(profileData);
        } catch (err) {
            console.error("Unable to save profile to DB:", err);
            notify("Unable to save your profile. Please try again.", "error");
            return;
        }
        if (isSeeking && seekerPreferences && window.RJGDb?.saveSeekerPreferences) {
            try { await window.RJGDb.saveSeekerPreferences(seekerPreferences); }
            catch (err) { console.warn("Preferences saved to profile but seeker_preferences sync failed:", err); }
        }
        try {
            if (window.RJGDb?.setCurrentUserRole) {
                const dbRole = profileData.role === "employer" ? "recruiter" : "seeker";
                await window.RJGDb.setCurrentUserRole(dbRole);
            }
        } catch (err) { console.warn("Role sync failed:", err); }

        const welcomeName = toDisplayName(profileName || localStorage.getItem("profileName"));
        sessionStorage.setItem("postLoginToast", `Welcome ${welcomeName}!!!`);
        try {
            sessionStorage.setItem("rjgUserRole", profileData.role);
            localStorage.setItem("rjgUserRole", profileData.role);
        } catch (_) {}

        notify("Profile setup saved.");
        // Add delay to ensure database save completes
        setTimeout(() => {
            if (profileData.role === "admin") {
                window.location.href = "../admin/admin-dashboard.html";
            } else {
                window.location.href = profileData.role === "employer" ? "../recruiter/recruiter-dashb.html" : "../seeker/dashb.html";
            }
        }, 1000);
    });

}); // end DOMContentLoaded