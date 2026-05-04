(function () {
  "use strict";

  // ── Auth guard ──
  async function enforceRecruiter() {
    if (!window.RJGDb || typeof window.RJGDb.getCurrentUserRole !== "function") return;
    try {
      const role = (await window.RJGDb.getCurrentUserRole()) || "";
      const r = role.toLowerCase();
      if (!r) { window.location.href = "log-sign.html"; return; }
      if (r !== "recruiter" && r !== "employer") { window.location.href = "profile.html"; }
      try { sessionStorage.setItem("rjgUserRole", r); localStorage.setItem("rjgUserRole", r); } catch (e) {}
    } catch (e) { console.error("Role check failed:", e); }
  }

  // ── Back button ──
  const backBtn = document.getElementById("profileBackBtn");
  if (backBtn) backBtn.addEventListener("click", function () { window.location.href = "recruiter-dashb.html"; });

  // ── Logout ──
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (window.showLogoutModal) { window.showLogoutModal(); return; }
      if (window.RJGDb && typeof window.RJGDb.resetClient === "function") {
        window.RJGDb.resetClient().then(function () { window.location.href = "log-sign.html"; });
      } else {
        window.location.href = "log-sign.html";
      }
    });
  }

  // ── Elements ──
  const rpName = document.getElementById("rpName");
  const rpEmail = document.getElementById("rpEmail");
  const rpPhone = document.getElementById("rpPhone");
  const rpAddress = document.getElementById("rpAddress");
  const rpLinks = document.getElementById("rpLinks");

  const rpEditModal = document.getElementById("rpEditModal");
  const rpModalTitle = document.getElementById("rpModalTitle");
  const rpModalBody = document.getElementById("rpModalBody");
  const rpModalClose = document.getElementById("rpModalClose");
  const rpModalCancel = document.getElementById("rpModalCancel");
  const rpModalSave = document.getElementById("rpModalSave");

  let currentProfile = {};
  let currentEditSection = null;

  function notify(msg, type) {
    if (window.showAppToast) window.showAppToast(msg, type || "info");
  }

  // ── Render ──
  function renderProfile(profile) {
    currentProfile = profile || {};
    if (rpName) rpName.textContent = profile.name || "—";
    if (rpEmail) rpEmail.textContent = profile.email || "—";
    if (rpPhone) rpPhone.textContent = profile.phone || "—";
    if (rpAddress) rpAddress.textContent = buildAddress(profile);
    if (rpLinks) renderLinks(profile.profileLinks);
  }

  function buildAddress(p) {
    const a = p.address && typeof p.address === "object" ? p.address : {};
    const parts = [
      a.unitNo,
      a.street, 
      a.barangay, 
      a.city, 
      a.province, 
      a.region,
      a.country
    ].filter(function(part) {
      return part && typeof part === 'string' && part.trim().length > 0;
    });
    return parts.join(", ") || "—";
  }

  function renderLinks(links) {
    if (!rpLinks) return;
    const list = Array.isArray(links) ? links.filter(Boolean) : [];
    if (list.length === 0) { rpLinks.innerHTML = '<span class="rp-empty">No links added yet.</span>'; return; }
    rpLinks.innerHTML = list.map(function (url) {
      const href = /^https?:\/\//i.test(url) ? url : "https://" + url;
      return `<a class="rp-link" href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    }).join("");
  }

  // ── Load from DB ──
  async function loadProfile() {
    if (!window.RJGDb || typeof window.RJGDb.loadCurrentUserProfile !== "function") return;
    try {
      const profile = await window.RJGDb.loadCurrentUserProfile();
      if (profile) {
        renderProfile(profile);
        try { localStorage.setItem("profileData", JSON.stringify(profile)); } catch (e) {}
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
      const cached = getCachedProfile();
      if (cached) renderProfile(cached);
    }
  }

  function getCachedProfile() {
    try { return JSON.parse(localStorage.getItem("profileData") || "null"); } catch (e) { return null; }
  }

  // ── Edit Modal ──
  function openEditModal(section) {
    currentEditSection = section;
    const title = (function () {
      const map = { name: "Edit Name", phone: "Edit Contact Number", address: "Edit Address", links: "Edit Profile Links" };
      return map[section] || "Edit";
    })();
    rpModalTitle.textContent = title;
    rpModalBody.innerHTML = buildEditForm(currentProfile, section);
    rpEditModal.hidden = false;
    rpModalCancel.onclick = closeModal;
    rpModalClose.onclick = closeModal;
    rpModalSave.onclick = function () { saveChanges(section); };
    
    // If address section, populate location dropdowns and add event listeners
    if (section === "address") {
      populateLocationDropdowns();
      
      // Add event listeners for cascading dropdowns
      const regionSelect = document.getElementById('rpEditRegion');
      const provinceSelect = document.getElementById('rpEditProvince');
      const citySelect = document.getElementById('rpEditCity');
      
      if (regionSelect) {
        regionSelect.addEventListener('change', async function() {
          const selectedRegion = this.value;
          if (selectedRegion) {
            await populateProvinces(selectedRegion);
          } else {
            document.getElementById('rpEditProvince').disabled = true;
            document.getElementById('rpEditCity').disabled = true;
            document.getElementById('rpEditBarangay').disabled = true;
          }
        });
      }
      
      if (provinceSelect) {
        provinceSelect.addEventListener('change', async function() {
          const selectedProvince = this.value;
          if (selectedProvince) {
            await populateCities(selectedProvince);
          } else {
            document.getElementById('rpEditCity').disabled = true;
            document.getElementById('rpEditBarangay').disabled = true;
          }
        });
      }
      
      if (citySelect) {
        citySelect.addEventListener('change', async function() {
          const selectedCity = this.value;
          if (selectedCity) {
            await populateBarangays(selectedCity);
          } else {
            document.getElementById('rpEditBarangay').disabled = true;
          }
        });
      }
      
      // Add input validation for ZIP code
      const zipInput = document.getElementById('rpEditZip');
      if (zipInput) {
        zipInput.addEventListener('input', function() {
          // Remove any non-numeric characters
          this.value = this.value.replace(/[^0-9]/g, '');
          // Limit to 4 digits
          if (this.value.length > 4) {
            this.value = this.value.slice(0, 4);
          }
        });
        
        zipInput.addEventListener('keypress', function(e) {
          // Only allow numbers
          const char = String.fromCharCode(e.which);
          if (!/[0-9]/.test(char)) {
            e.preventDefault();
          }
        });
      }
    }
    
    // Add input validation for contact number (for phone section)
    if (section === "phone") {
      const phoneInput = document.getElementById('rpEditPhone');
      if (phoneInput) {
        phoneInput.addEventListener('input', function() {
          // Remove any non-numeric characters
          this.value = this.value.replace(/[^0-9]/g, '');
          // Limit to 11 digits
          if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
          }
        });
        
        phoneInput.addEventListener('keypress', function(e) {
          // Only allow numbers
          const char = String.fromCharCode(e.which);
          if (!/[0-9]/.test(char)) {
            e.preventDefault();
          }
        });
      }
    }
    
    // Focus first input
    const firstInput = rpModalBody.querySelector("input, select");
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    rpEditModal.hidden = true;
    currentEditSection = null;
  }

  function buildEditForm(p, section) {
    if (section === "name") {
      return field("Full Name", "rpEditName", "text", p.name || "", "e.g. Juan dela Cruz");
    }
    if (section === "phone") {
      return field("Contact Number", "rpEditPhone", "tel", p.phone || "", "e.g. 09123456789", { maxlength: "11", inputmode: "numeric", pattern: "[0-9]{11}" });
    }
    if (section === "address") {
      const a = p.address && typeof p.address === "object" ? p.address : {};
      return [
        field("Unit / No", "rpEditUnitNo", "number", a.unitNo || "", "Unit / No", { placeholder: "e.g., 123", inputmode: "numeric", min: "0" }),
        field("Street", "rpEditStreet", "text", a.street || "", "Street", { placeholder: "e.g., Main Street" }),
        `<div class="rp-location-cascade">
          <div class="rp-location-row">
            <label for="rpEditCountry" class="rp-field-label">Country</label>
            <select id="rpEditCountry" class="rp-select" name="country" disabled>
              <option value="Philippines" selected>Philippines</option>
            </select>
          </div>
          <div class="rp-location-row">
            <label for="rpEditRegion" class="rp-field-label">Region</label>
            <select id="rpEditRegion" class="rp-select" name="region" disabled>
              <option value="">Select Region</option>
            </select>
          </div>
          <div class="rp-location-row">
            <label for="rpEditProvince" class="rp-field-label">Province</label>
            <select id="rpEditProvince" class="rp-select" name="province" disabled>
              <option value="">Select Province</option>
            </select>
          </div>
          <div class="rp-location-row">
            <label for="rpEditCity" class="rp-field-label">City / Municipality</label>
            <select id="rpEditCity" class="rp-select" name="city" disabled>
              <option value="">Select City / Municipality</option>
            </select>
          </div>
          <div class="rp-location-row">
            <label for="rpEditBarangay" class="rp-field-label">Barangay</label>
            <select id="rpEditBarangay" class="rp-select" name="barangay" disabled>
              <option value="">Select Barangay</option>
            </select>
          </div>
        </div>`,
        field("ZIP", "rpEditZip", "text", a.zip || "", "ZIP", { inputmode: "numeric", pattern: "[0-9]{4}", maxlength: "4", placeholder: "e.g., 1000" })
      ].join("");
    }
    if (section === "links") {
      const existing = Array.isArray(p.profileLinks) ? p.profileLinks.filter(Boolean) : [];
      const rows = existing.length > 0
        ? existing.map(function (url) { return linkRow(url); }).join("")
        : linkRow("");
      return `<div class="rp-link-list" id="rpLinkList">${rows}</div>
        <button type="button" class="rp-add-link-btn" id="rpAddLinkBtn">+ Add Link</button>`;
    }
    return "";
  }

  function linkRow(value) {
    return `<div class="rp-link-row">
      <input class="rp-link-input" type="url" value="${escHtml(value)}" placeholder="https://linkedin.com/in/yourname">
      <button type="button" class="rp-link-remove" aria-label="Remove">&times;</button>
    </div>`;
  }

  function field(label, id, type, value, placeholder) {
    return `<div class="rp-modal-field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" value="${escHtml(value)}" placeholder="${placeholder}">
    </div>`;
  }

  function escHtml(str) {
    return String(str || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "rpAddLinkBtn") {
      const list = document.getElementById("rpLinkList");
      if (list) {
        const div = document.createElement("div");
        div.innerHTML = linkRow("");
        list.appendChild(div.firstElementChild);
      }
    }
    if (e.target && e.target.classList.contains("rp-link-remove")) {
      const row = e.target.closest(".rp-link-row");
      const list = document.getElementById("rpLinkList");
      if (row && list && list.querySelectorAll(".rp-link-row").length > 1) {
        row.remove();
      } else if (row) {
        const input = row.querySelector(".rp-link-input");
        if (input) input.value = "";
      }
    }
  });

  if (rpModalSave) {
    rpModalSave.addEventListener("click", async function () {
      if (!currentEditSection || !window.RJGDb || typeof window.RJGDb.saveCurrentUserProfile !== "function") {
        notify("Save function not available.", "error"); return;
      }
      const updates = collectEdits(currentEditSection);
      if (!updates) return;
      const merged = Object.assign({}, currentProfile, updates);
      rpModalSave.disabled = true;
      try {
        if (window.RJGLoading) window.RJGLoading.show("Saving profile...");
        await window.RJGDb.saveCurrentUserProfile(merged);
        if (window.RJGLoading) window.RJGLoading.hide();
        renderProfile(merged);
        try { localStorage.setItem("profileData", JSON.stringify(merged)); } catch (e) {}
        notify("Profile updated.", "success");
        closeModal();
      } catch (e) {
        const saveMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, "Unable to save your profile. Please try again.")) || "Unable to save your profile. Please try again.";
        notify(saveMsg, "error");
      } finally {
        rpModalSave.disabled = false;
      }
    });
  }

  function collectEdits(section) {
    if (section === "name") {
      const val = (document.getElementById("rpEditName") || {}).value || "";
      return { name: val.trim() };
    }
    if (section === "phone") {
      const val = (document.getElementById("rpEditPhone") || {}).value || "";
      return { phone: val.trim() };
    }
    if (section === "address") {
      const regionSelect = document.getElementById("rpEditRegion");
      const provinceSelect = document.getElementById("rpEditProvince");
      const citySelect = document.getElementById("rpEditCity");
      const barangaySelect = document.getElementById("rpEditBarangay");
      
      return {
        address: {
          unitNo: ((document.getElementById("rpEditUnitNo") || {}).value || "").trim(),
          street: ((document.getElementById("rpEditStreet") || {}).value || "").trim(),
          barangay: barangaySelect ? (barangaySelect.options[barangaySelect.selectedIndex]?.text || "").trim() : "",
          city: citySelect ? (citySelect.options[citySelect.selectedIndex]?.text || "").trim() : "",
          province: provinceSelect ? (provinceSelect.options[provinceSelect.selectedIndex]?.text || "").trim() : "",
          region: regionSelect ? (regionSelect.options[regionSelect.selectedIndex]?.text || "").trim() : "",
          country: "Philippines", // Locked to Philippines
          zip: ((document.getElementById("rpEditZip") || {}).value || "").trim()
        }
      };
    }
    if (section === "links") {
      const inputs = document.querySelectorAll("#rpLinkList .rp-link-input");
      const profileLinks = Array.from(inputs).map(function (i) { return i.value.trim(); }).filter(Boolean);
      return { profileLinks };
    }
    return null;
  }

  // ── Location Cascade Functionality ──
  async function populateLocationDropdowns() {
    try {
      // Country is locked to Philippines, so just populate regions
      await populateRegions();
      
      // Set current values if they exist
      const currentRegion = currentProfile.address && currentProfile.address.region;
      const currentProvince = currentProfile.address && currentProfile.address.province;
      const currentCity = currentProfile.address && currentProfile.address.city;
      const currentBarangay = currentProfile.address && currentProfile.address.barangay;
      
      if (currentRegion) {
        const regionSelect = document.getElementById('rpEditRegion');
        if (regionSelect) {
          // Find region by name
          const response = await fetch('https://psgc.cloud/api/regions');
          if (response.ok) {
            const regions = await response.json();
            const matchingRegion = regions.find(r => r.name === currentRegion);
            if (matchingRegion) {
              regionSelect.value = matchingRegion.code;
              await populateProvinces(matchingRegion.code);
              
              if (currentProvince) {
                const provinceSelect = document.getElementById('rpEditProvince');
                if (provinceSelect) {
                  const provinceResponse = await fetch(`https://psgc.cloud/api/regions/${matchingRegion.code}/provinces`);
                  if (provinceResponse.ok) {
                    const provinces = await provinceResponse.json();
                    const matchingProvince = provinces.find(p => p.name === currentProvince);
                    if (matchingProvince) {
                      provinceSelect.value = matchingProvince.code;
                      await populateCities(matchingProvince.code);
                      
                      if (currentCity) {
                        const citySelect = document.getElementById('rpEditCity');
                        if (citySelect) {
                          const cityResponse = await fetch(`https://psgc.cloud/api/provinces/${matchingProvince.code}/cities-municipalities`);
                          if (cityResponse.ok) {
                            const cities = await cityResponse.json();
                            const matchingCity = cities.find(c => c.name === currentCity);
                            if (matchingCity) {
                              citySelect.value = matchingCity.code;
                              await populateBarangays(matchingCity.code);
                              
                              if (currentBarangay) {
                                const barangaySelect = document.getElementById('rpEditBarangay');
                                if (barangaySelect) {
                                  const barangayResponse = await fetch(`https://psgc.cloud/api/cities-municipalities/${matchingCity.code}/barangays`);
                                  if (barangayResponse.ok) {
                                    const barangays = await barangayResponse.json();
                                    const matchingBarangay = barangays.find(b => b.name === currentBarangay);
                                    if (matchingBarangay) {
                                      barangaySelect.value = matchingBarangay.code;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to populate location dropdowns:', error);
    }
  }
  
  async function populateRegions() {
    const regionSelect = document.getElementById('rpEditRegion');
    
    if (!regionSelect) return;
    
    try {
      // Clear existing options
      regionSelect.innerHTML = '<option value="">Select Region</option>';
      
      // Fetch regions from PSGC API
      const response = await fetch('https://psgc.cloud/api/regions');
      if (!response.ok) throw new Error('Failed to fetch regions');
      
      const regions = await response.json();
      
      regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.code;
        option.textContent = region.name;
        option.dataset.regionCode = region.code;
        regionSelect.appendChild(option);
      });
      
      regionSelect.disabled = false;
    } catch (error) {
      console.warn('Failed to populate regions:', error);
    }
  }
  
  async function populateProvinces(regionCode) {
    const provinceSelect = document.getElementById('rpEditProvince');
    const citySelect = document.getElementById('rpEditCity');
    const barangaySelect = document.getElementById('rpEditBarangay');
    
    if (!provinceSelect || !regionCode) return;
    
    try {
      // Clear existing options
      provinceSelect.innerHTML = '<option value="">Select Province</option>';
      citySelect.innerHTML = '<option value="">Select City / Municipality</option>';
      barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
      citySelect.disabled = true;
      barangaySelect.disabled = true;
      
      // Fetch provinces from PSGC API
      const response = await fetch(`https://psgc.cloud/api/regions/${regionCode}/provinces`);
      if (!response.ok) throw new Error('Failed to fetch provinces');
      
      const provinces = await response.json();
      
      provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province.code;
        option.textContent = province.name;
        option.dataset.provinceCode = province.code;
        provinceSelect.appendChild(option);
      });
      
      provinceSelect.disabled = false;
    } catch (error) {
      console.warn('Failed to populate provinces:', error);
    }
  }
  
  async function populateCities(provinceCode) {
    const citySelect = document.getElementById('rpEditCity');
    const barangaySelect = document.getElementById('rpEditBarangay');
    
    if (!citySelect || !provinceCode) return;
    
    try {
      // Clear existing options
      citySelect.innerHTML = '<option value="">Select City / Municipality</option>';
      barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
      barangaySelect.disabled = true;
      
      // Fetch cities from PSGC API
      const response = await fetch(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      
      const cities = await response.json();
      
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.code;
        option.textContent = city.name;
        option.dataset.cityCode = city.code;
        citySelect.appendChild(option);
      });
      
      citySelect.disabled = false;
    } catch (error) {
      console.warn('Failed to populate cities:', error);
    }
  }
  
  async function populateBarangays(cityCode) {
    const barangaySelect = document.getElementById('rpEditBarangay');
    
    if (!barangaySelect || !cityCode) return;
    
    try {
      // Clear existing options
      barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
      
      // Fetch barangays from PSGC API
      const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
      if (!response.ok) throw new Error('Failed to fetch barangays');
      
      const barangays = await response.json();
      
      barangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay.code;
        option.textContent = barangay.name;
        option.dataset.barangayCode = barangay.code;
        barangaySelect.appendChild(option);
      });
      
      barangaySelect.disabled = false;
    } catch (error) {
      console.warn('Failed to populate barangays:', error);
    }
  }

  // ── Bind edit buttons ──
  document.querySelectorAll(".profile-edit-btn[data-edit]").forEach(function (btn) {
    btn.addEventListener("click", function () { openEditModal(btn.getAttribute("data-edit")); });
  });

  // ── Init ──
  async function init() {
    const cached = getCachedProfile();
    if (cached) renderProfile(cached);
    await enforceRecruiter();
    await loadProfile();
  }

  init();
})();