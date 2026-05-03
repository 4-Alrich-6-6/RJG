
  const listingFilters = {
    category: null,
    schedule: null,
    type: null,
    rateUnit: null
  };
  const filterRateMinInput = document.getElementById('filterRateMin');
  const filterRateMaxInput = document.getElementById('filterRateMax');
  const filterRateCurrencySelect = document.getElementById('filterRateCurrency');
  function notify(message, type) {
    if (window.showAppToast) window.showAppToast(message, type || 'success');
  }

  const postLoginToast = sessionStorage.getItem('postLoginToast');
  if (postLoginToast) {
    notify(postLoginToast, 'success');
    sessionStorage.removeItem('postLoginToast');
  }

  function formatJobInfo(job) {
    const ratePart = job.rate ? formatSalaryDisplay(job) : '';
    const urgentPart = job.urgent ? 'Urgent' : '';
    const third = [ratePart, urgentPart].filter(Boolean).join(ratePart && urgentPart ? ' · ' : '');
    const parts = [
      `${job.company} · ${job.location}`,
      `${job.category} · ${job.schedule} · ${job.type}`,
      third || '—'
    ];
    return parts.join(' · ');
  }

  const SA = window.SeekerApp;
  function currencySymbolFor(code) {
    return SA.currencySymbolFor(code);
  }
  function formatSalaryDisplay(job) {
    return SA.formatSalaryDisplay(job);
  }
  function formatSettingsDisplay(value) {
    return SA.formatSettingsDisplay(value);
  }
  function normalizeJobDetailPayload(job) {
    return SA.normalizeJobDetailPayload(job);
  }
  function getPosterContactSnapshotFromStorage() {
    return SA.getPosterContactSnapshotFromStorage();
  }
  function buildApplicationSnapshotForStorage(job) {
    return SA.buildApplicationSnapshotForStorage(job);
  }
  function recordSeekerApplication(job) {
    return SA.recordSeekerApplication(job);
  }

  function moreLikeInfoLine(job, source) {
    if (source === 'foryou') {
      return `${job.company} · ${job.location} · ${job.schedule}`;
    }
    return formatJobInfo(job);
  }

  function makeMoreLikeCard(job, moreSource) {
    const payload = encodeURIComponent(JSON.stringify({ ...job, _moreSource: moreSource }));
    const info = moreLikeInfoLine(job, moreSource);
    const imageSrc = escapeHtml(String(job.image || job.imageUrl || job.jobImage || '').trim());
    const thumbMarkup = imageSrc
      ? `<img src="${imageSrc}" alt="" class="job-detail-mini-thumb-img" loading="lazy">`
      : `<span class="job-detail-mini-thumb-no-image">No Image</span>`;
    return `
      <article class="job-detail-more-card" tabindex="0" role="button" data-job-detail="${payload}">
        <div class="job-detail-mini-thumb" aria-hidden="true">${thumbMarkup}</div>
        <div class="card-title">${escapeHtml(job.title)}</div>
        <div class="card-info">${escapeHtml(info)}</div>
      </article>`;
  }

  function fillMoreLikeThumbs(currentTitle, moreSource, currentJob) {
    const row = document.getElementById('jobDetailMoreRow');
    if (!row) return;
    if (moreSource === 'posted') {
      row.innerHTML = '';
      return;
    }
    
    let pool = getDashboardListingPool().filter(j => j.title !== currentTitle);
    
    // If we have current job details, sort by similarity
    if (currentJob) {
      pool = pool.map(job => {
        let score = 0;
        // Match by category (highest priority)
        if (currentJob.category && job.category && currentJob.category === job.category) {
          score += 3;
        }
        // Match by schedule
        if (currentJob.schedule && job.schedule && currentJob.schedule === job.schedule) {
          score += 2;
        }
        // Match by type/settings
        if (currentJob.type && job.type && currentJob.type === job.type) {
          score += 2;
        }
        // Match by location (city)
        if (currentJob.location && job.location) {
          const currentCity = currentJob.location.split(',')[0]?.trim();
          const jobCity = job.location.split(',')[0]?.trim();
          if (currentCity && jobCity && currentCity === jobCity) {
            score += 1;
          }
        }
        return { job, score };
      })
      .filter(item => item.score > 0) // Only show jobs with at least one match
      .sort((a, b) => b.score - a.score) // Higher scores first
      .map(item => item.job);
    }
    
    const key = moreSource === 'foryou' ? 'foryou' : 'listing';
    const similarJobs = pool
      .filter(job => !isJobReportedForCurrentUser(job))
      .slice(0, 8);
    
    if (similarJobs.length === 0) {
      row.innerHTML = '<p style="padding: 20px; color: #666; font-size: 14px;">No similar jobs found.</p>';
      return;
    }
    
    row.innerHTML = similarJobs.map(job => makeMoreLikeCard(job, key)).join('');
  }

  function parseRateParts(rateText) {
    if (!rateText) return { currency: '', amount: NaN };
    const m = String(rateText)
      .trim()
      .match(/^([A-Za-z]{3})\s+([\d.,]+)\s*\/\s*/i);
    if (m) {
      return {
        currency: m[1].toUpperCase(),
        amount: Number(String(m[2]).replace(/,/g, ''))
      };
    }
    const [currencyPart, rest = ''] = rateText.trim().split(/\s+/);
    const amountPart = rest.split('/')[0];
    return {
      currency: (currencyPart || '').toUpperCase(),
      amount: Number(String(amountPart).replace(/,/g, ''))
    };
  }

  function makeCard(job) {
    const payload = encodeURIComponent(
      JSON.stringify({ ...job, _moreSource: 'listing' })
    );
    const imageSrc = escapeHtml(String(job.image || job.imageUrl || job.jobImage || '').trim());
    const thumbMarkup = imageSrc
      ? `<img src="${imageSrc}" alt="" class="job-thumb-img" loading="lazy">`
      : `<span class="job-thumb-no-image">No Image</span>`;
    const isArchived = job.accountStatus === 'archived';
    const archivedClass = isArchived ? ' job-archived' : '';
    const archivedTitle = isArchived ? ' (Archived)' : '';
    return `
      <div class="job-card${archivedClass}" tabindex="0" role="button" data-job-detail="${payload}">
        <div class="card-thumb">${thumbMarkup}</div>
        <div class="card-title">${job.title}${archivedTitle}</div>
        <div class="card-info">${formatJobInfo(job)}</div>
      </div>`;
  }

  function renderGrid(id, data) {
    const grid = document.getElementById(id);
    if (!grid) return;
    grid.innerHTML = data.map(makeCard).join('');
  }

  function applyListingFilters(data, query) {
    return data.filter(job => {
      const matchesSearch = !query ||
        job.title.toLowerCase().includes(query) ||
        formatJobInfo(job).toLowerCase().includes(query);
      const matchesCategory = !listingFilters.category || job.category === listingFilters.category;
      const matchesSchedule = !listingFilters.schedule || job.schedule === listingFilters.schedule;
      const matchesType = !listingFilters.type || job.type === listingFilters.type;
      const matchesRate = !listingFilters.rateUnit || job.rateUnit === listingFilters.rateUnit;
      const { currency, amount } = parseRateParts(job.rate);
      const minValue = filterRateMinInput && filterRateMinInput.value !== '' ? Number(filterRateMinInput.value) : null;
      const maxValue = filterRateMaxInput && filterRateMaxInput.value !== '' ? Number(filterRateMaxInput.value) : null;
      const selectedCurrency = filterRateCurrencySelect ? filterRateCurrencySelect.value : '';
      const matchesCurrency = !selectedCurrency || currency === selectedCurrency;
      const matchesMin = minValue === null || amount >= minValue;
      const matchesMax = maxValue === null || amount <= maxValue;
      return matchesSearch && matchesCategory && matchesSchedule && matchesType && matchesRate && matchesCurrency && matchesMin && matchesMax;
    });
  }

  function renderListings() {
    const q = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const visibleNow = applyListingFilters(getSectionJobs('now'), q).filter(job => !isJobReportedForCurrentUser(job));
    const visibleNew = applyListingFilters(getSectionJobs('new'), q).filter(job => !isJobReportedForCurrentUser(job));
    const visibleUrgent = applyListingFilters(getSectionJobs('urgent'), q).filter(job => !isJobReportedForCurrentUser(job));
    renderGrid('grid-now', visibleNow.slice(0, 4));
    renderGrid('grid-new', visibleNew.slice(0, 4));
    renderGrid('grid-urgent', visibleUrgent.slice(0, 4));
  }

  function postedAgoToDays(value) {
    const text = String(value || '').trim().toLowerCase();
    console.log('Dashboard postedAgoToDays called with:', value, '-> text:', text);
    
    if (!text || text === 'recently' || text === 'just now' || text === 'today') {
      console.log('Dashboard returning 0 for recently/just now/today');
      return 0;
    }
    
    // Handle new format: "1d ago", "2d ago", "1h ago", "1m ago"
    const newFormatMatch = text.match(/^(\d+)([dmhdw])\s*ago$/);
    if (newFormatMatch) {
      const n = Number(newFormatMatch[1]);
      const unit = newFormatMatch[2];
      console.log('Dashboard new format match:', n, unit);
      switch (unit) {
        case 'm': console.log('Dashboard returning 0 for minutes'); return 0; // minutes - less than 1 day
        case 'h': console.log('Dashboard returning 0 for hours'); return 0; // hours - less than 1 day  
        case 'd': console.log('Dashboard returning', n, 'for days'); return n; // days
        case 'w': console.log('Dashboard returning', n * 7, 'for weeks'); return n * 7; // weeks
        default: console.log('Dashboard returning infinity for unknown unit'); return Number.POSITIVE_INFINITY;
      }
    }
    
    // Handle old format: "1 day ago", "2 weeks ago"
    const m = text.match(/^(\d+)\s*(day|days|week|weeks)\s*ago$/);
    if (!m) {
      console.log('Dashboard no format match, returning infinity');
      return Number.POSITIVE_INFINITY;
    }
    const n = Number(m[1]);
    if (!Number.isFinite(n)) {
      console.log('Dashboard invalid number, returning infinity');
      return Number.POSITIVE_INFINITY;
    }
    const result = m[2].startsWith('week') ? n * 7 : n;
    console.log('Dashboard old format match, returning:', result);
    return result;
  }

  let dbListingJobs = [];

  function getDashboardListingPool() {
    return dbListingJobs
      .map(job => ({ ...job, _source: 'listing' }))
      .filter(job => !job.isOwnerPost && job.listingOpen !== false);
  }

  function sectionMetaFromKey(sectionKey) {
    if (sectionKey === 'now') return { title: 'Jobs Right Now' };
    if (sectionKey === 'new') return { title: 'Recently Posted' };
    return { title: 'Urgent Jobs' };
  }

  function getSectionJobs(sectionKey) {
    const pool = getDashboardListingPool();
    if (sectionKey === 'new') {
      return pool.filter(job => postedAgoToDays(job.postedAgo) <= 7);
    }
    if (sectionKey === 'urgent') {
      return pool.filter(job => !!job.urgent);
    }
    return pool;
  }

  function openSectionPage(sectionKey) {
    const meta = sectionMetaFromKey(sectionKey);
    const payload = {
      section: sectionKey,
      title: meta.title
    };
    sessionStorage.setItem('dashboardSectionSnapshot', JSON.stringify(payload));
    window.location.href = `dashboard-section.html?section=${encodeURIComponent(sectionKey)}`;
  }

  ['now', 'new', 'urgent'].forEach(sectionKey => {
    const seeMoreEl = document.querySelector(`#sec-${sectionKey} .see-more`);
    if (!seeMoreEl) return;
    seeMoreEl.setAttribute('role', 'button');
    seeMoreEl.setAttribute('tabindex', '0');
    seeMoreEl.addEventListener('click', () => openSectionPage(sectionKey));
    seeMoreEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSectionPage(sectionKey);
      }
    });
  });

  // ── SEARCH ──
  function doSearch() {
    renderListings();
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });
  }

  // ── FILTER MODAL ──
  function openFilter() {
    const modal = document.getElementById('filterModal');
    if (!modal) return;
    modal.classList.add('open');
  }
  function closeFilter() {
    const modal = document.getElementById('filterModal');
    if (!modal) return;
    modal.classList.remove('open');
  }
  const filterModal = document.getElementById('filterModal');
  if (filterModal) {
    filterModal.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeFilter();
    });
  }
  function toggleChip(el) {
    const group = el.dataset.group;
    const value = el.dataset.value;
    if (!group || !value) return;
    const nextValue = listingFilters[group] === value ? null : value;
    listingFilters[group] = nextValue;
    document.querySelectorAll(`.chip[data-group="${group}"]`).forEach(chip => {
      chip.classList.toggle('selected', chip.dataset.value === nextValue);
    });
  }

  function applyFilters() {
    renderListings();
    closeFilter();
    notify('Filters applied.');
  }

  function resetFilters() {
    Object.keys(listingFilters).forEach(key => {
      listingFilters[key] = null;
    });
    document.querySelectorAll('.chip[data-group]').forEach(chip => chip.classList.remove('selected'));
    if (filterRateMinInput) filterRateMinInput.value = '';
    if (filterRateMaxInput) filterRateMaxInput.value = '';
    if (filterRateCurrencySelect) filterRateCurrencySelect.value = '';
    renderListings();
    closeFilter();
    notify('Filters reset.', 'info');
  }

  window.applyFilters = applyFilters;
  window.resetFilters = resetFilters;

  const forYouJobs = [
    { title: 'UX Researcher', company: 'DesignLab', location: 'Makati', schedule: 'Contract', skillTags: ['UI/UX Design', 'Communication and Teamwork'], workTags: ['designer', 'ux'] },
    { title: 'Content Writer', company: 'MediaHouse', location: 'Remote', schedule: 'Part-time', skillTags: ['Writing', 'Content Creation'], workTags: ['writer', 'content'] },
    { title: 'HR Specialist', company: 'PeopleFirst', location: 'BGC', schedule: 'Full-time', skillTags: ['Communication and Teamwork', 'Documentation'], workTags: ['hr', 'recruiter'] },
    { title: 'QA Engineer', company: 'ShipRight', location: 'Cebu', schedule: 'Full-time', skillTags: ['Critical Thinking', 'Basic Programming'], workTags: ['qa', 'engineer'] },
    { title: 'Graphic Designer', company: 'StudioNorth', location: 'QC', schedule: 'Contract', skillTags: ['Graphic Design', 'Illustration / Drawing'], workTags: ['designer'] },
    { title: 'Sales Associate', company: 'RetailCo', location: 'Manila', schedule: 'Full-time', skillTags: ['Sales', 'Communication and Teamwork'], workTags: ['sales'] },
    { title: 'IT Support', company: 'HelpStack', location: 'Ortigas', schedule: 'Full-time', skillTags: ['Customer Support', 'Troubleshooting'], workTags: ['it support', 'technician'] },
    { title: 'Social Media Manager', company: 'BuzzAgency', location: 'Remote', schedule: 'Contract', skillTags: ['Social Media Management', 'Content Creation'], workTags: ['social', 'marketing'] },
    { title: 'Warehouse Lead', company: 'LogiFlow', location: 'Laguna', schedule: 'Full-time', skillTags: ['Delivery / Logistics', 'Heavy Lifting and Carrying'], workTags: ['warehouse', 'logistics'] },
    { title: 'Barista', company: 'BrewDaily', location: 'Taguig', schedule: 'Part-time', skillTags: ['Customer Support', 'Physical Stamina/Endurance'], workTags: ['barista', 'service'] },
    { title: 'Bookkeeper', company: 'LedgerPH', location: 'Remote', schedule: 'Part-time', skillTags: ['Documentation', 'Data Entry'], workTags: ['bookkeeper', 'accountant'] },
    { title: 'Field Technician', company: 'NetFix', location: 'Cavite', schedule: 'Contract', skillTags: ['Driving', 'Physical Stamina/Endurance'], workTags: ['technician', 'field'] }
  ];

  function getStoredJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function tokenize(value) {
    return normalizeText(value).split(/[^a-z0-9]+/).filter(Boolean);
  }

  function buildUserSignals() {
    const workExperiences = getStoredJSON('workExperiences', []);
    const userSkills = getStoredJSON('skills', []);
    const userAddress = getStoredJSON('address', {});
    const workTokens = workExperiences.flatMap(exp => {
      return tokenize(`${exp.positionName || ''} ${exp.companyName || ''} ${exp.location || ''}`);
    });
    const locationTokens = tokenize(`${userAddress.city || ''} ${userAddress.province || ''} ${userAddress.country || ''}`);
    return {
      workTokens,
      userSkills: userSkills.map(normalizeText),
      locationTokens
    };
  }

  function scoreForYouJob(job, basis, signals) {
    let score = 0;
    const jobSkills = (job.skillTags || []).map(normalizeText);
    const jobWorkTags = (job.workTags || []).map(normalizeText);
    const jobLocationTokens = tokenize(job.location);

    const skillsScore = signals.userSkills.reduce((sum, skill) => sum + (jobSkills.includes(skill) ? 3 : 0), 0);
    const workScore = signals.workTokens.reduce((sum, token) => sum + (jobWorkTags.some(tag => tag.includes(token)) ? 2 : 0), 0);
    const locationScore = signals.locationTokens.reduce((sum, token) => sum + (jobLocationTokens.includes(token) ? 4 : 0), 0);

    if (basis === 'skills') score = skillsScore;
    else if (basis === 'work') score = workScore;
    else if (basis === 'location') score = locationScore;
    else score = skillsScore + workScore + locationScore;

    return score;
  }

  function buildForYouGrid() {
    const grid = document.getElementById('fy-grid');
    if (!grid) return;
    const isDedicatedForYouPage = /for-you\.html$/i.test(window.location.pathname || '');
    // On the dedicated For You page, let for-you.js own fy-grid rendering.
    if (isDedicatedForYouPage) return;
    const basisSelect = document.getElementById('forYouBasis');
    const basis = basisSelect ? basisSelect.value : '';
    const signals = buildUserSignals();

    const postedForYou = getDashboardListingPool()
      .filter(job => job.listingOpen !== false)
      .map(job => ({
        ...job,
        skillTags: Array.isArray(job.skills) ? job.skills.slice() : [],
        workTags: [],
        _moreSource: 'foryou'
      }));

    const ranked = postedForYou
      .map(job => ({ ...job, score: scoreForYouJob(job, basis, signals) }))
      .filter(job => !isJobReportedForCurrentUser(job))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);

    grid.innerHTML = ranked
      .map(job => {
        const payload = encodeURIComponent(JSON.stringify({ ...job, _moreSource: 'foryou' }));
        const imageSrc = escapeHtml(String(job.image || job.imageUrl || job.jobImage || '').trim());
        const thumbMarkup = imageSrc
          ? `<img src="${imageSrc}" alt="" class="job-thumb-img" loading="lazy">`
          : `<span class="job-thumb-no-image">No Image</span>`;
        return `<article class="fy-card" tabindex="0" role="button" data-job-detail="${payload}">
        <div class="fy-thumb">${thumbMarkup}</div>
        <p class="fy-card-title">${job.title}</p>
        <p class="fy-card-desc">${job.company} · ${job.location} · ${job.schedule}</p>
      </article>`;
      })
      .join('');
  }

  window.refreshForYou = function () {
    buildForYouGrid();
    notify('Recommendations refreshed.', 'info');
  };

  function makeMockApplicants(count) {
    const first = [
      'Ana', 'Ben', 'Carlos', 'Dina', 'Elena', 'Frank', 'Gina', 'Hugo', 'Ivy', 'Jun', 'Kate', 'Leo',
      'Mia', 'Noah', 'Olivia', 'Paolo', 'Quinn', 'Rosa', 'Sam', 'Tina', 'Uly', 'Vince', 'Wena', 'Xian'
    ];
    const last = [
      'Reyes', 'Santos', 'Cruz', 'Tan', 'Lim', 'Garcia', 'Torres', 'Ramos', 'Lee', 'Chua', 'Ong',
      'Bautista', 'Flores', 'Diaz', 'Navarro', 'Villanueva', 'Del Rosario', 'Fernandez', 'Aquino'
    ];
    const out = [];
    for (let i = 0; i < count; i++) {
      const days = i % 15;
      const displayName = `${first[i % first.length]} ${last[i % last.length]}`;
      out.push({
        name: displayName,
        email: `applicant${i + 1}@email.com`,
        appliedAt: days === 0 ? 'Just now' : `${days} day${days === 1 ? '' : 's'} ago`,
        resumeProfile: makeMockResumeProfile(i, displayName)
      });
    }
    return out;
  }

  function savePostedJobsToStorage() {
    // DB-reliant mode: no localStorage cache for posted jobs.
  }

  async function syncPostedJobsToDbOrThrow() {
    if (!window.RJGDb || typeof window.RJGDb.savePostedJobs !== 'function') {
      throw new Error('Database connection is not ready.');
    }
    const ok = await window.RJGDb.savePostedJobs(postedJobPlaceholders);
    if (!ok) {
      throw new Error('Please sign in first before posting jobs.');
    }
  }

  const postedJobPlaceholders = [];

  async function hydratePostedJobsFromDb() {
    if (!window.RJGDb || typeof window.RJGDb.loadPostedJobs !== 'function') {
      console.warn('RJGDb.loadPostedJobs not available');
      return;
    }
    try {
      const remoteJobs = await window.RJGDb.loadPostedJobs();
      postedJobPlaceholders.splice(0, postedJobPlaceholders.length, ...(Array.isArray(remoteJobs) ? remoteJobs : []));
      renderListings();
      buildForYouGrid();
      if (typeof buildPostingGrid === 'function') buildPostingGrid();
      console.log('Loaded posted jobs from database:', postedJobPlaceholders.length);
    } catch (e) {
      console.error('Failed to load posted jobs from database:', e);
      postedJobPlaceholders.splice(0, postedJobPlaceholders.length);
    }
  }

  async function hydrateAllListingsFromDb() {
    if (!window.RJGDb || typeof window.RJGDb.loadAllJobs !== 'function') {
      console.warn('RJGDb.loadAllJobs not available');
      return;
    }
    try {
      const allJobs = await window.RJGDb.loadAllJobs();
      dbListingJobs = Array.isArray(allJobs) ? allJobs : [];
      renderListings();
      buildForYouGrid();
      console.log('Loaded all jobs from database:', dbListingJobs.length);
    } catch (e) {
      console.error('Failed to load all jobs from database:', e);
      dbListingJobs = [];
      renderListings();
      buildForYouGrid();
    }
  }

  // Initialize dashboard with database data
  async function initializeDashboard() {
    await hydratePostedJobsFromDb();
    await hydrateAllListingsFromDb();
    await hydrateMyApplicationsFromDb();
    await hydrateMyBookmarksFromDb();
    buildForYouGrid();
    renderListings();
  }

  initializeDashboard();

  const forYouBasisSelect = document.getElementById('forYouBasis');
  if (forYouBasisSelect) {
    forYouBasisSelect.addEventListener('change', buildForYouGrid);
  }

  let dbMyApplications = [];
  const dbMyAppliedJobIdSet = new Set();
  const dbMyBookmarkJobIdSet = new Set();

  async function hydrateMyApplicationsFromDb() {
    if (!window.RJGDb || typeof window.RJGDb.listApplications !== 'function') {
      dbMyApplications = [];
      dbMyAppliedJobIdSet.clear();
      return;
    }
    try {
      const list = await window.RJGDb.listApplications();
      dbMyApplications = Array.isArray(list) ? list : [];
      dbMyAppliedJobIdSet.clear();
      dbMyApplications.forEach(a => {
        if (!a || a.jobId == null) return;
        const status = String(a.status || a.applicationStatus || '').toLowerCase();
        const isActiveApplication = status === 'pending' || status === 'accepted' || status === '';
        if (isActiveApplication) dbMyAppliedJobIdSet.add(String(a.jobId));
      });
    } catch (e) {
      dbMyApplications = [];
      dbMyAppliedJobIdSet.clear();
    }
  }

  async function hydrateMyBookmarksFromDb() {
    if (!window.RJGDb || typeof window.RJGDb.listBookmarks !== 'function') {
      dbMyBookmarkJobIdSet.clear();
      return;
    }
    try {
      const list = await window.RJGDb.listBookmarks();
      const items = Array.isArray(list) ? list : [];
      dbMyBookmarkJobIdSet.clear();
      items.forEach(b => {
        if (b && b.id != null) dbMyBookmarkJobIdSet.add(String(b.id));
      });
    } catch (e) {
      dbMyBookmarkJobIdSet.clear();
    }
  }

  function loadMyApplicationsRaw() {
    return Array.isArray(dbMyApplications) ? dbMyApplications.slice() : [];
  }

  function storedJobIdForDetailJob(job) {
    if (!job || typeof job !== 'object') return '';
    const title = String(job.title || '').trim();
    if (job.id != null && String(job.id).trim() !== '') return String(job.id);
    if (!title && job.id == null) return '';
    return `${title}|${String(job.company || '').trim()}`;
  }

  function hasAppliedToJob(job) {
    const key = storedJobIdForDetailJob(job);
    if (!key) return false;
    return dbMyAppliedJobIdSet.has(String(key));
  }

  function currentReporterIdentity() {
    try {
      const acc = JSON.parse(localStorage.getItem('accountData') || '{}');
      const email = String(acc.email || '').trim().toLowerCase();
      if (email) return `acct:${email}`;
    } catch (e) {}
    try {
      const p = JSON.parse(localStorage.getItem('profileData') || '{}');
      const email = String(p.email || '').trim().toLowerCase();
      if (email) return `profile:${email}`;
    } catch (e2) {}
    return 'guest';
  }

  function reportedJobsStorageKey() {
    return `reportedJobs:${currentReporterIdentity()}`;
  }

  const REPORTED_JOBS_META_KEY = 'reportedJobsMeta';

  function loadReportedJobKeys() {
    try {
      const raw = localStorage.getItem(reportedJobsStorageKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      return [];
    }
  }

  function saveReportedJobKeys(keys) {
    localStorage.setItem(reportedJobsStorageKey(), JSON.stringify(Array.from(new Set(keys.map(String)))));
  }

  function loadReportedJobsMeta() {
    try {
      const raw = localStorage.getItem(REPORTED_JOBS_META_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveReportedJobsMeta(map) {
    localStorage.setItem(REPORTED_JOBS_META_KEY, JSON.stringify(map || {}));
  }

  function saveReportedJobSnapshot(job, reason) {
    const ref = storedJobIdForDetailJob(job);
    if (!ref || !job || typeof job !== 'object') return;
    const reporter = currentReporterIdentity();
    const composite = `${reporter}::${ref}`;
    const meta = loadReportedJobsMeta();
    const snapshot = { ...job };
    delete snapshot.applicants;
    delete snapshot.reportedApplicantKeys;
    meta[composite] = {
      reference: ref,
      reporter,
      reason: String(reason || '').trim(),
      reportedAt: new Date().toISOString(),
      job: snapshot
    };
    saveReportedJobsMeta(meta);
  }

  function isJobReportedForCurrentUser(job) {
    const key = storedJobIdForDetailJob(job);
    if (!key) return false;
    return loadReportedJobKeys().includes(key);
  }

  function hideJobForCurrentUser(job, reason) {
    const key = storedJobIdForDetailJob(job);
    if (!key) return;
    saveReportedJobSnapshot(job, reason);
    const keys = loadReportedJobKeys();
    if (keys.includes(key)) return;
    keys.push(key);
    saveReportedJobKeys(keys);
  }

  function getSeekerDisplayNameForEmployer() {
    try {
      const p = JSON.parse(localStorage.getItem('profileData') || '{}');
      const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || String(p.name || '').trim();
      return n || 'Applicant';
    } catch (e) {
      return 'Applicant';
    }
  }

  function getSeekerEmailForEmployer() {
    try {
      const acc = JSON.parse(localStorage.getItem('accountData') || '{}');
      if (acc.email) return String(acc.email);
    } catch (e) {}
    try {
      const p = JSON.parse(localStorage.getItem('profileData') || '{}');
      if (p.email) return String(p.email);
    } catch (e) {}
    return '';
  }

  function formatAppliedAtLabelForApplicants(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const dayMs = 86400000;
    const diff = Math.floor((now - d) / dayMs);
    if (diff <= 0) return 'Applied today';
    if (diff === 1) return 'Applied 1 day ago';
    if (diff < 14) return `Applied ${diff} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function hydrateApplicantsForPostedJob(job) {
    if (!job || job._moreSource !== 'posted' || job.id == null) return;
    if (!window.RJGDb || typeof window.RJGDb.listApplicantsForJob !== 'function') return;
    try {
      const rows = await window.RJGDb.listApplicantsForJob(String(job.id));
      const normalized = Array.isArray(rows)
        ? rows.map(a => ({
            name: a.name || 'Applicant',
            email: a.email || '',
            appliedAt: formatAppliedAtLabelForApplicants(a.appliedAt),
            applicationStatus:
              a.applicationStatus === 'accepted'
                ? 'accepted'
                : a.applicationStatus === 'rejected'
                  ? 'rejected'
                  : undefined,
            _dbApplicationId: a.id || '',
            _applicantId: a.applicantId || '',
            _fromDbApplication: true,
            resumeProfile:
              a.resumeProfile && typeof a.resumeProfile === 'object'
                ? a.resumeProfile
                : null
          }))
        : [];
      job.applicants = normalized;
      const idx = postedJobPlaceholders.findIndex(p =>
        job.id != null ? p.id === job.id : p.title === job.title
      );
      if (idx !== -1) {
        postedJobPlaceholders[idx].applicants = normalized.slice();
      }
    } catch (e) {
      // Keep existing list if loading from DB fails.
    }
  }

  function applicantIdentityKey(applicant) {
    if (!applicant || typeof applicant !== 'object') return '';
    if (applicant._seekerApplicationJobId) return `seeker:${String(applicant._seekerApplicationJobId)}`;
    const email = String(applicant.email || '').trim().toLowerCase();
    const name = String(applicant.name || '').trim().toLowerCase();
    if (email || name) return `app:${email}|${name}`;
    return '';
  }

  function getPostedStoreIndexForJob(job) {
    return postedJobPlaceholders.findIndex(p =>
      job.id != null ? p.id === job.id : p.title === job.title
    );
  }

  function getReportedApplicantKeySet(job) {
    const keys = new Set();
    if (!job || typeof job !== 'object') return keys;
    if (Array.isArray(job.reportedApplicantKeys)) {
      job.reportedApplicantKeys.forEach(k => keys.add(String(k)));
    }
    const idx = getPostedStoreIndexForJob(job);
    if (idx !== -1 && Array.isArray(postedJobPlaceholders[idx].reportedApplicantKeys)) {
      postedJobPlaceholders[idx].reportedApplicantKeys.forEach(k => keys.add(String(k)));
    }
    return keys;
  }

  function markApplicantReportedForJob(job, applicant, reason) {
    if (!job || !applicant || job._moreSource !== 'posted') return;
    const key = applicantIdentityKey(applicant);
    if (!key) return;
    const trimmedReason = String(reason || '').trim();
    const reporter = currentReporterIdentity();
    if (!Array.isArray(job.reportedApplicantKeys)) job.reportedApplicantKeys = [];
    if (!job.reportedApplicantKeys.includes(key)) job.reportedApplicantKeys.push(key);
    if (!job.reportedApplicantReasons || typeof job.reportedApplicantReasons !== 'object') {
      job.reportedApplicantReasons = {};
    }
    job.reportedApplicantReasons[key] = trimmedReason || 'Reported Resume';
    if (!job.reportedApplicantProfiles || typeof job.reportedApplicantProfiles !== 'object') {
      job.reportedApplicantProfiles = {};
    }
    job.reportedApplicantProfiles[key] = JSON.parse(JSON.stringify(applicant));
    if (!job.reportedApplicantMeta || typeof job.reportedApplicantMeta !== 'object') {
      job.reportedApplicantMeta = {};
    }
    job.reportedApplicantMeta[key] = { reporter, reportedAt: new Date().toISOString() };
    const idx = getPostedStoreIndexForJob(job);
    if (idx !== -1) {
      if (!Array.isArray(postedJobPlaceholders[idx].reportedApplicantKeys)) {
        postedJobPlaceholders[idx].reportedApplicantKeys = [];
      }
      if (!postedJobPlaceholders[idx].reportedApplicantKeys.includes(key)) {
        postedJobPlaceholders[idx].reportedApplicantKeys.push(key);
      }
      if (
        !postedJobPlaceholders[idx].reportedApplicantReasons ||
        typeof postedJobPlaceholders[idx].reportedApplicantReasons !== 'object'
      ) {
        postedJobPlaceholders[idx].reportedApplicantReasons = {};
      }
      postedJobPlaceholders[idx].reportedApplicantReasons[key] = trimmedReason || 'Reported Resume';
      if (
        !postedJobPlaceholders[idx].reportedApplicantProfiles ||
        typeof postedJobPlaceholders[idx].reportedApplicantProfiles !== 'object'
      ) {
        postedJobPlaceholders[idx].reportedApplicantProfiles = {};
      }
      postedJobPlaceholders[idx].reportedApplicantProfiles[key] = JSON.parse(JSON.stringify(applicant));
      if (
        !postedJobPlaceholders[idx].reportedApplicantMeta ||
        typeof postedJobPlaceholders[idx].reportedApplicantMeta !== 'object'
      ) {
        postedJobPlaceholders[idx].reportedApplicantMeta = {};
      }
      postedJobPlaceholders[idx].reportedApplicantMeta[key] = { reporter, reportedAt: new Date().toISOString() };
      if (Array.isArray(postedJobPlaceholders[idx].applicants)) {
        postedJobPlaceholders[idx].applicants = postedJobPlaceholders[idx].applicants.filter(
          a => applicantIdentityKey(a) !== key
        );
      }
    }
    if (Array.isArray(job.applicants)) {
      job.applicants = job.applicants.filter(a => applicantIdentityKey(a) !== key);
    }
    savePostedJobsToStorage();
  }

  function getApplicantsListIncludingSeeker(job) {
    if (!job || job._moreSource !== 'posted') {
      return Array.isArray(job.applicants) ? job.applicants.slice() : [];
    }
    const storeIdx = postedJobPlaceholders.findIndex(p =>
      job.id != null ? p.id === job.id : p.title === job.title
    );
    const base =
      storeIdx !== -1 && Array.isArray(postedJobPlaceholders[storeIdx].applicants)
        ? postedJobPlaceholders[storeIdx].applicants.slice()
        : Array.isArray(job.applicants)
          ? job.applicants.slice()
          : [];

    const jobKey = storedJobIdForDetailJob(job);
    const myApps = loadMyApplicationsRaw();
    const matching = myApps.filter(app => String(app.jobId) === jobKey);

    const seenSeekerKeys = new Set(
      base.map(a => a && a._seekerApplicationJobId).filter(Boolean)
    );

    const reportedKeys = getReportedApplicantKeySet(job);
    const extras = [];
    matching.forEach(app => {
      if (seenSeekerKeys.has(app.jobId)) return;
      seenSeekerKeys.add(app.jobId);
      let applicationStatus;
      if (app.status === 'accepted') applicationStatus = 'accepted';
      else if (app.status === 'rejected') applicationStatus = 'rejected';
      else applicationStatus = undefined;

      const candidate = {
        name: getSeekerDisplayNameForEmployer(),
        email: getSeekerEmailForEmployer(),
        appliedAt: formatAppliedAtLabelForApplicants(app.appliedAt),
        applicationStatus,
        _seekerApplicationJobId: app.jobId,
        _fromSeekerApplication: true,
        resumeProfile: null
      };
      if (reportedKeys.has(applicantIdentityKey(candidate))) return;
      extras.push(candidate);
    });
    const filteredBase = base.filter(a => !reportedKeys.has(applicantIdentityKey(a)));
    return extras.concat(filteredBase);
  }

  function updateMyApplicationStatusByJobId(jobId, status) {
    // Application status decisions should be persisted in DB by the job owner.
    // This dashboard no longer stores application state in localStorage.
    return false;
  }

  function formatPostedCardDesc(job) {
    const tail = job.listingOpen === false ? 'Closed' : 'Open';
    if (job._moreSource === 'posted') {
      const n = getApplicantsListIncludingSeeker(job).length;
      const posted = job.postedAgo || 'Recently';
      return `${posted} · ${n} applicant${n === 1 ? '' : 's'} · ${tail}`;
    }
    if (Array.isArray(job.applicants)) {
      const n = job.applicants.length;
      const posted = job.postedAgo || 'Recently';
      return `${posted} · ${n} applicant${n === 1 ? '' : 's'} · ${tail}`;
    }
    if (job.infoLine) return `${job.infoLine} · ${tail}`;
    if (job.info) {
      const stripped = String(job.info)
        .replace(/\s*·\s*(Open|Closed)\s*$/i, '')
        .trim();
      return `${stripped} · ${tail}`;
    }
    return tail;
  }

  function buildPostingGrid() {
    const grid = document.getElementById('jp-grid');
    if (!grid) return;
    grid.innerHTML = postedJobPlaceholders
      .map(row => {
        const payload = encodeURIComponent(JSON.stringify({ ...row, _moreSource: 'posted' }));
        const imageSrc = escapeHtml(String(row.image || row.imageUrl || row.jobImage || '').trim());
        const thumbMarkup = imageSrc
          ? `<img src="${imageSrc}" alt="" class="job-thumb-img" loading="lazy">`
          : `<span class="job-thumb-no-image">No Image</span>`;
        return `<article class="jp-card" tabindex="0" role="button" data-job-detail="${payload}">
        <div class="jp-thumb">${thumbMarkup}</div>
        <p class="jp-card-title">${escapeHtml(row.title)}</p>
        <p class="jp-card-desc">${escapeHtml(formatPostedCardDesc(row))}</p>
      </article>`;
      })
      .join('');
  }

  window.buildPostingGrid = buildPostingGrid;

  const postJobModal = document.getElementById('postJobModal');
  const locationModal = document.getElementById('jpLocationModal');
  const rateModal = document.getElementById('jpRateModal');
  const skillsModal = document.getElementById('jpSkillsModal');
  const closePostJobModalBtn = document.getElementById('closePostJobModal');
  const cancelPostBtn = document.getElementById('jpCancelPostBtn');
  const submitPostBtn = document.getElementById('jpSubmitPostBtn');
  const jobNameInput = document.getElementById('jpJobName');
  const categorySelect = document.getElementById('jpCategory');
  const scheduleSelect = document.getElementById('jpSchedule');
  const typeSelect = document.getElementById('jpType');
  const descriptionInput = document.getElementById('jpDescription');
  const jobImageInput = document.getElementById('jpJobImage');
  const pickedImageText = document.getElementById('jpPickedImage');
  const urgentCheckbox = document.getElementById('jpIsUrgent');
  const pickLocationBtn = document.getElementById('jpPickLocationBtn');
  const pickRateBtn = document.getElementById('jpPickRateBtn');
  const pickSkillsBtn = document.getElementById('jpPickSkillsBtn');
  const pickedLocationText = document.getElementById('jpPickedLocation');
  const pickedRateText = document.getElementById('jpPickedRate');
  const pickedSkillsText = document.getElementById('jpPickedSkills');

  const locationUnit = document.getElementById('jpLocationUnit');
  const locationStreet = document.getElementById('jpLocationStreet');
  const locationBarangay = document.getElementById('jpLocationBarangay');
  const locationCity = document.getElementById('jpLocationCity');
  const locationProvince = document.getElementById('jpLocationProvince');
  const locationCountry = document.getElementById('jpLocationCountry');
  const locationZip = document.getElementById('jpLocationZip');
  const saveLocationBtn = document.getElementById('jpSaveLocationBtn');
  const cancelLocationBtn = document.getElementById('jpCancelLocationBtn');

  const rateAmount = document.getElementById('jpRateAmount');
  const rateCurrency = document.getElementById('jpRateCurrency');
  const rateUnit = document.getElementById('jpRateUnit');
  const saveRateBtn = document.getElementById('jpSaveRateBtn');
  const cancelRateBtn = document.getElementById('jpCancelRateBtn');

  const skillsList = document.getElementById('jpSkillsList');
  const saveSkillsBtn = document.getElementById('jpSaveSkillsBtn');
  const cancelSkillsBtn = document.getElementById('jpCancelSkillsBtn');

  const setupSkillOptions = [
    'Communication and Teamwork', 'Problem Solving', 'Time Management', 'Adaptability',
    'Leadership', 'Critical Thinking', 'Microsoft Office (Word, Excel, PowerPoint)',
    'Data Entry', 'Basic Programming', 'Web Development', 'Graphic Design',
    'Video Editing', 'UI/UX Design', 'Email Management', 'Scheduling',
    'Documentation', 'Customer Support', 'File Organization', 'Writing',
    'Photography', 'Illustration / Drawing', 'Content Creation', 'Social Media Management',
    'Cleaning', 'Cooking / Food Preparation', 'Driving', 'Delivery / Logistics',
    'Construction / Manual Labor', 'Heavy Lifting and Carrying', 'Physical Stamina/Endurance',
    'Tutoring / Teaching', 'Baby / Pet Sitting',
    'Sales', 'Marketing', 'Translation', 'Event Planning'
  ];

  const postFormState = {
    location: '',
    rate: '',
    skills: [],
    image: ''
  };

  let postJobModalMode = 'create';
  let editingJobRef = null;

  const jpModalTitle = document.getElementById('jpModalTitle');

  function fillLocationInputsFromString(loc) {
    if (!locationStreet) return;
    const parts = String(loc || '').split(',').map(s => s.trim());
    const m = parts.length;
    if (m >= 6) {
      if (locationUnit) locationUnit.value = parts[0] || '';
      locationStreet.value = parts[1] || '';
      locationBarangay.value = parts[2] || '';
      locationCity.value = parts[3] || '';
      locationProvince.value = parts[4] || '';
      locationCountry.value = parts.slice(5).join(', ') || '';
    } else {
      if (locationUnit) locationUnit.value = '';
      locationStreet.value = parts[0] || '';
      locationBarangay.value = parts[1] || '';
      locationCity.value = parts[2] || '';
      locationProvince.value = parts[3] || '';
      locationCountry.value = parts[4] || '';
    }
  }

  function fillRateInputsFromRateString(rateStr) {
    if (!rateAmount || !rateCurrency || !rateUnit) return;
    const m = String(rateStr || '')
      .trim()
      .match(/^([A-Za-z]{3})\s+([\d.,]+)\s*\/\s*(.+)$/i);
    if (m) {
      rateCurrency.value = m[1].toUpperCase();
      rateAmount.value = String(m[2]).replace(/,/g, '');
      const unit = m[3].trim();
      rateUnit.value = unit;
      if (![...rateUnit.options].some(o => o.value === unit || o.textContent === unit)) {
        rateUnit.value = '';
      }
    } else {
      rateAmount.value = '';
      rateCurrency.value = '';
      rateUnit.value = '';
    }
  }

  function applyPostedJobToPostForm(job) {
    if (!jobNameInput) return;
    jobNameInput.value = job.title || '';
    if (categorySelect) categorySelect.value = job.category || '';
    if (scheduleSelect) scheduleSelect.value = job.schedule || '';
    if (typeSelect) typeSelect.value = job.type || '';
    postFormState.location = job.location || '';
    if (pickedLocationText) {
      pickedLocationText.textContent = job.location || 'No location selected';
    }
    fillLocationInputsFromString(job.location);
    postFormState.rate = job.rate || '';
    if (pickedRateText) {
      pickedRateText.textContent = job.rate || 'No rate selected';
    }
    fillRateInputsFromRateString(job.rate);
    postFormState.skills = Array.isArray(job.skills) ? [...job.skills] : [];
    if (pickedSkillsText) {
      pickedSkillsText.textContent = postFormState.skills.length
        ? postFormState.skills.join(', ')
        : 'No skills selected';
    }
    if (skillsList) {
      skillsList.querySelectorAll('input[type="checkbox"]').forEach(box => {
        box.checked = postFormState.skills.includes(box.value);
      });
    }
    if (descriptionInput) descriptionInput.value = job.description || '';
    postFormState.image = String(job.image || '').trim();
    if (pickedImageText) {
      pickedImageText.textContent = postFormState.image ? 'Image selected' : 'No image selected';
    }
    if (jobImageInput) jobImageInput.value = '';
    if (urgentCheckbox) urgentCheckbox.checked = !!job.urgent;
    validatePostJobForm();
  }

  function handleJobImageSelection(file) {
    if (!file) {
      postFormState.image = '';
      if (pickedImageText) pickedImageText.textContent = 'No image selected';
      return;
    }
    if (!String(file.type || '').startsWith('image/')) {
      notify('Please upload an image file only.', 'warn');
      if (jobImageInput) jobImageInput.value = '';
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      notify('Image must be 2MB or less.', 'warn');
      if (jobImageInput) jobImageInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      postFormState.image = typeof reader.result === 'string' ? reader.result : '';
      if (pickedImageText) pickedImageText.textContent = file.name || 'Image selected';
    };
    reader.onerror = () => {
      notify('Could not read the selected image.', 'warn');
      if (jobImageInput) jobImageInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  function openOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.add('open');
  }

  function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('open');
  }

  function resetPostForm() {
    if (!jobNameInput) return;
    postJobModalMode = 'create';
    editingJobRef = null;
    if (jpModalTitle) jpModalTitle.textContent = 'Post a Job';
    if (submitPostBtn) submitPostBtn.textContent = 'Post Job';
    jobNameInput.value = '';
    categorySelect.value = '';
    scheduleSelect.value = '';
    typeSelect.value = '';
    descriptionInput.value = '';
    urgentCheckbox.checked = false;
    postFormState.location = '';
    postFormState.rate = '';
    postFormState.skills = [];
    postFormState.image = '';
    pickedLocationText.textContent = 'No location selected';
    pickedRateText.textContent = 'No rate selected';
    pickedSkillsText.textContent = 'No skills selected';
    if (pickedImageText) pickedImageText.textContent = 'No image selected';
    if (jobImageInput) jobImageInput.value = '';
    if (locationStreet) {
      if (locationUnit) locationUnit.value = '';
      locationStreet.value = '';
      locationBarangay.value = '';
      locationCity.value = '';
      locationProvince.value = '';
      locationCountry.value = '';
    }
    if (rateAmount) {
      rateAmount.value = '';
      rateCurrency.value = '';
      rateUnit.value = '';
    }
    if (skillsList) {
      skillsList.querySelectorAll('input[type="checkbox"]').forEach(box => {
        box.checked = false;
      });
    }
    validatePostJobForm();
  }

  function validatePostJobForm() {
    if (!submitPostBtn || !jobNameInput) return;
    const valid = jobNameInput.value.trim() &&
      categorySelect.value &&
      scheduleSelect.value &&
      postFormState.location &&
      postFormState.rate &&
      typeSelect.value &&
      postFormState.skills.length > 0 &&
      descriptionInput.value.trim();

    submitPostBtn.disabled = !valid;
  }

  function buildSkillOptions() {
    if (!skillsList) return;
    skillsList.innerHTML = setupSkillOptions
      .map(skill => `<label><input type="checkbox" value="${skill}"><span>${skill}</span></label>`)
      .join('');
  }

  function updateSkillSelectionsInModal() {
    if (!skillsList) return;
    skillsList.querySelectorAll('input[type="checkbox"]').forEach(box => {
      box.checked = postFormState.skills.includes(box.value);
    });
  }

  function initializePostingModal() {
    if (!postJobModal) return;

    buildSkillOptions();
    validatePostJobForm();

    [jobNameInput, categorySelect, scheduleSelect, typeSelect, descriptionInput].forEach(el => {
      if (!el) return;
      el.addEventListener('input', validatePostJobForm);
      el.addEventListener('change', validatePostJobForm);
    });

    if (jobImageInput) {
      jobImageInput.addEventListener('change', () => {
        const file = jobImageInput.files && jobImageInput.files[0] ? jobImageInput.files[0] : null;
        handleJobImageSelection(file);
      });
    }

    closePostJobModalBtn.addEventListener('click', () => {
      closeOverlay(postJobModal);
      resetPostForm();
    });
    cancelPostBtn.addEventListener('click', () => {
      closeOverlay(postJobModal);
      resetPostForm();
    });

    pickLocationBtn.addEventListener('click', () => openOverlay(locationModal));
    pickRateBtn.addEventListener('click', () => openOverlay(rateModal));
    pickSkillsBtn.addEventListener('click', () => {
      updateSkillSelectionsInModal();
      openOverlay(skillsModal);
    });

    cancelLocationBtn.addEventListener('click', () => closeOverlay(locationModal));
    saveLocationBtn.addEventListener('click', () => {
      const u = locationUnit ? locationUnit.value.trim() : '';
      const s = locationStreet.value.trim();
      const b = locationBarangay.value.trim();
      const c = locationCity.value.trim();
      const p = locationProvince.value.trim();
      const co = locationCountry.value.trim();
      const z = locationZip ? locationZip.value.trim() : '';
      const core = [s, b, c, p, co, z].filter(Boolean);
      if (core.length === 0) {
        notify('Please enter location details first.', 'warn');
        return;
      }
      postFormState.location = u
        ? [u, s, b, c, p, co, z].map(x => String(x || '').trim()).join(', ')
        : core.join(', ');
      pickedLocationText.textContent = postFormState.location;
      closeOverlay(locationModal);
      validatePostJobForm();
      notify('Location saved for this post.');
    });

    cancelRateBtn.addEventListener('click', () => closeOverlay(rateModal));
    saveRateBtn.addEventListener('click', () => {
      if (!rateAmount.value || !rateCurrency.value || !rateUnit.value) {
        notify('Complete rate amount, currency, and unit.', 'warn');
        return;
      }
      postFormState.rate = `${rateCurrency.value} ${rateAmount.value}/${rateUnit.value}`;
      pickedRateText.textContent = postFormState.rate;
      closeOverlay(rateModal);
      validatePostJobForm();
      notify('Rate saved for this post.');
    });

    cancelSkillsBtn.addEventListener('click', () => closeOverlay(skillsModal));
    saveSkillsBtn.addEventListener('click', () => {
      postFormState.skills = Array.from(skillsList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(box => box.value);
      if (postFormState.skills.length === 0) {
        notify('Select at least one skill.', 'warn');
        return;
      }
      pickedSkillsText.textContent = postFormState.skills.join(', ');
      closeOverlay(skillsModal);
      validatePostJobForm();
      notify('Skills requirements saved.');
    });

    [postJobModal, locationModal, rateModal, skillsModal].forEach(overlay => {
      if (!overlay) return;
      overlay.addEventListener('click', () => {
        // Keep modal open on outside click.
      });
    });

    submitPostBtn.addEventListener('click', async () => {
      if (submitPostBtn.disabled) return;
      if (postJobModalMode === 'edit' && editingJobRef) {
        const idx = postedJobPlaceholders.findIndex(p =>
          editingJobRef.id != null ? p.id === editingJobRef.id : p.title === editingJobRef.title
        );
        if (idx === -1) {
          notify('Could not find this job to update.', 'warn');
          return;
        }
        const prev = { ...postedJobPlaceholders[idx] };
        postedJobPlaceholders[idx] = {
          ...prev,
          title: jobNameInput.value.trim(),
          infoLine: prev.infoLine || 'Posted · 0 applicants',
          applicants: Array.isArray(prev.applicants) ? prev.applicants : [],
          listingOpen: prev.listingOpen !== false,
          company: 'You',
          category: categorySelect.value,
          schedule: scheduleSelect.value,
          type: typeSelect.value,
          location: postFormState.location,
          rate: postFormState.rate,
          rateUnit: (postFormState.rate.match(/\/\s*([^/]+)\s*$/) || [])[1] || '',
          skills: [...postFormState.skills],
          description: descriptionInput.value.trim(),
          image: postFormState.image || prev.image || '',
          urgent: urgentCheckbox.checked,
          _moreSource: 'posted'
        };
        const updated = postedJobPlaceholders[idx];
        savePostedJobsToStorage();
        try {
          await syncPostedJobsToDbOrThrow();
        } catch (err) {
          postedJobPlaceholders[idx] = prev;
          savePostedJobsToStorage();
          const editMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to save job changes. Please try again.')) || 'Unable to save job changes. Please try again.';
          notify(editMsg, 'warn');
          return;
        }
        buildPostingGrid();
        closeOverlay(postJobModal);
        resetPostForm();
        if (typeof window.refreshJobDetailAfterEdit === 'function') {
          window.refreshJobDetailAfterEdit(updated);
        }
        notify('Job updated.', 'success');
        return;
      }
      const urgentTag = urgentCheckbox.checked ? ' · Urgent' : '';
      const newJob = {
        id:
          globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : `job-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        title: jobNameInput.value.trim(),
        infoLine: `Just posted · 0 applicants`,
        applicants: [],
        listingOpen: true,
        company: 'You',
        category: categorySelect.value,
        schedule: scheduleSelect.value,
        type: typeSelect.value,
        location: postFormState.location,
        rate: postFormState.rate,
        rateUnit: (postFormState.rate.match(/\/\s*([^/]+)\s*$/) || [])[1] || '',
        skills: [...postFormState.skills],
        description: descriptionInput.value.trim(),
        image: postFormState.image || '',
        postedAgo: 'Just now',
        urgent: urgentCheckbox.checked,
        _moreSource: 'posted'
      };
      postedJobPlaceholders.unshift(newJob);
      savePostedJobsToStorage();
      try {
        await syncPostedJobsToDbOrThrow();
      } catch (err) {
        postedJobPlaceholders.shift();
        savePostedJobsToStorage();
        const postMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to post this job. Please try again.')) || 'Unable to post this job. Please try again.';
        notify(postMsg, 'warn');
        return;
      }
      buildPostingGrid();
      closeOverlay(postJobModal);
      resetPostForm();
      notify('Job posted successfully.');
    });
  }

  window.openPostJob = function () {
    if (!postJobModal) return;
    resetPostForm();
    openOverlay(postJobModal);
  };

  window.openEditJob = function (job) {
    if (!postJobModal || !jobNameInput || !job) return;
    postJobModalMode = 'edit';
    editingJobRef = { id: job.id, title: job.title };
    applyPostedJobToPostForm(job);
    if (jpModalTitle) jpModalTitle.textContent = 'Edit job';
    if (submitPostBtn) submitPostBtn.textContent = 'Save changes';
    openOverlay(postJobModal);
  };

  buildPostingGrid();
  initializePostingModal();
  renderListings();

  // ── HEADER MENU (⋯) ──
  const headerMenuBtn = document.getElementById('headerMenuBtn');
  const headerMenuDropdown = document.getElementById('headerMenuDropdown');
  const headerMenu = document.querySelector('.header-menu');

  function closeHeaderMenu() {
    if (!headerMenuDropdown || !headerMenuBtn) return;
    headerMenuDropdown.hidden = true;
    headerMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleHeaderMenu() {
    if (!headerMenuDropdown || !headerMenuBtn) return;
    const open = headerMenuDropdown.hidden;
    headerMenuDropdown.hidden = !open;
    headerMenuBtn.setAttribute('aria-expanded', String(open));
  }

  if (headerMenuBtn && headerMenuDropdown && headerMenu) {
    headerMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleHeaderMenu();
    });
    document.addEventListener('click', closeHeaderMenu);
    headerMenuDropdown.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.closest('a')) closeHeaderMenu();
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getStoredProfileDataForResume() {
    try {
      const raw = localStorage.getItem('profileData');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  /** Profile fields only — never login/account identifiers on the resume. */
  function sanitizeProfileForResume(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const o = { ...raw };
    delete o.email;
    return o;
  }

  function formatAddressForResume(addr) {
    if (!addr || typeof addr !== 'object') return '';
    return [addr.unitNo, addr.street, addr.barangay, addr.city, addr.province, addr.country, addr.zip]
      .map(x => (x && String(x).trim()) || '')
      .filter(Boolean)
      .join(', ');
  }

  function formatBirthForResume(raw) {
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return String(raw);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function makeMockResumeProfile(index, displayName) {
    const cities = ['Makati', 'Quezon City', 'Cebu', 'Davao', 'Manila', 'Taguig', 'Pasig'];
    const i = index;
    return {
      name: displayName,
      phone: `+63 917 000 ${String(1000 + (i % 9000)).padStart(4, '0')}`,
      address: {
        unitNo: i % 3 === 0 ? `Unit ${200 + i}` : '',
        street: `${10 + (i % 80)} Sample Street`,
        barangay: `Barangay ${(i % 12) + 1}`,
        city: cities[i % cities.length],
        province: i % 4 === 0 ? 'Cebu' : 'Metro Manila',
        country: 'Philippines',
        zip: String(1000 + (i % 8999))
      },
      description:
        'Motivated candidate with experience in customer-facing roles, documentation, and teamwork. Open to schedules that fit the role.',
      educationStatus: ['College Graduate', 'Senior High School Graduate', 'College Level'][i % 3],
      birthDate: `199${i % 10}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      sex: i % 2 === 0 ? 'Male' : 'Female',
      workExperiences: [
        {
          positionName: i % 2 === 0 ? 'Sales Associate' : 'Service Staff',
          companyName: 'Previous Employer Inc.',
          location: cities[(i + 1) % cities.length],
          startYear: String(2019 + (i % 3)),
          endYear: String(2022 + (i % 2))
        }
      ],
      educationBackgrounds: [
        {
          educationLevel: "Bachelor's Degree",
          schoolName: 'University of Sample',
          program: i % 2 === 0 ? 'Business Administration' : 'Communication',
          startYear: '2015',
          endYear: '2019'
        }
      ],
      skills: ['Customer Support', 'Communication and Teamwork', 'Documentation'].slice(0, 2 + (i % 2)),
      languages: [
        { language: 'English', level: 'Fluent' },
        { language: 'Filipino / Tagalog', level: 'Native' }
      ],
      personality: ['Responsible', 'Team Player', 'Organized'].slice(0, 2),
      profileLinks: [`https://linkedin.com/in/profile-${i + 1}`]
    };
  }

  function buildResumeHtmlFromProfile(p) {
    if (!p || typeof p !== 'object') return '';
    const blocks = [];

    const phone = p.phone && String(p.phone).trim();
    const addr = formatAddressForResume(p.address);
    if (phone || addr) {
      let contactHtml = '';
      if (phone) {
        contactHtml += `<p class="resume-view-contact"><strong>Phone:</strong> ${escapeHtml(phone)}</p>`;
      }
      if (addr) {
        contactHtml += `<p class="resume-view-contact"><strong>Address:</strong> ${escapeHtml(addr)}</p>`;
      }
      blocks.push(`<div class="resume-view-block">${contactHtml}</div>`);
    }

    if (p.description && String(p.description).trim()) {
      blocks.push(
        `<h4 class="resume-view-section-title">Summary</h4><p class="resume-view-p">${escapeHtml(String(p.description).trim())}</p>`
      );
    }

    const personalBits = [];
    if (p.educationStatus && String(p.educationStatus).trim()) {
      personalBits.push(['Education status', p.educationStatus]);
    }
    if (p.birthDate && String(p.birthDate).trim()) {
      personalBits.push(['Birth date', formatBirthForResume(p.birthDate)]);
    }
    if (p.sex && String(p.sex).trim()) personalBits.push(['Sex', p.sex]);
    if (personalBits.length) {
      const rows = personalBits
        .map(
          ([lab, val]) =>
            `<div class="resume-view-dl-row"><span class="resume-view-dl-label">${escapeHtml(lab)}</span> ${escapeHtml(String(val))}</div>`
        )
        .join('');
      blocks.push(`<h4 class="resume-view-section-title">Personal</h4><div class="resume-view-dl">${rows}</div>`);
    }

    const work = Array.isArray(p.workExperiences) ? p.workExperiences : [];
    if (work.length) {
      const items = work
        .map(w => {
          const line = [w.positionName, w.companyName].filter(Boolean).join(' — ');
          const sub = [w.location, w.startYear && w.endYear ? `${w.startYear}–${w.endYear}` : '']
            .filter(Boolean)
            .join(' · ');
          return `<li class="resume-view-li"><strong>${escapeHtml(line || 'Role')}</strong>${sub ? `<br><span class="resume-view-li-sub">${escapeHtml(sub)}</span>` : ''}</li>`;
        })
        .join('');
      blocks.push(`<h4 class="resume-view-section-title">Work experience</h4><ul class="resume-view-ul">${items}</ul>`);
    }

    const edu = Array.isArray(p.educationBackgrounds) ? p.educationBackgrounds : [];
    if (edu.length) {
      const items = edu
        .map(e => {
          const line = [e.educationLevel, e.schoolName].filter(Boolean).join(' — ');
          const sub = [e.program, e.startYear && e.endYear ? `${e.startYear}–${e.endYear}` : '']
            .filter(Boolean)
            .join(' · ');
          return `<li class="resume-view-li"><strong>${escapeHtml(line || 'Education')}</strong>${sub ? `<br><span class="resume-view-li-sub">${escapeHtml(sub)}</span>` : ''}</li>`;
        })
        .join('');
      blocks.push(`<h4 class="resume-view-section-title">Education</h4><ul class="resume-view-ul">${items}</ul>`);
    }

    const skills = Array.isArray(p.skills) ? p.skills.filter(Boolean) : [];
    if (skills.length) {
      blocks.push(
        `<h4 class="resume-view-section-title">Skills</h4><ul class="resume-view-ul resume-view-ul--inline">${skills.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      );
    }

    const langs = Array.isArray(p.languages) ? p.languages : [];
    if (langs.length) {
      const items = langs
        .map(
          entry =>
            `<li class="resume-view-li">${escapeHtml(entry.language || '')}${entry.level ? ` — ${escapeHtml(entry.level)}` : ''}</li>`
        )
        .join('');
      blocks.push(`<h4 class="resume-view-section-title">Languages</h4><ul class="resume-view-ul">${items}</ul>`);
    }

    const pers = Array.isArray(p.personality) ? p.personality.filter(Boolean) : [];
    if (pers.length) {
      blocks.push(
        `<h4 class="resume-view-section-title">Personality</h4><ul class="resume-view-ul resume-view-ul--inline">${pers.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
      );
    }

    const links = Array.isArray(p.profileLinks) ? p.profileLinks.filter(Boolean) : [];
    if (links.length) {
      const items = links
        .map(href => {
          const safe = escapeHtml(href);
          return `<li class="resume-view-li"><a class="resume-view-link" href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a></li>`;
        })
        .join('');
      blocks.push(`<h4 class="resume-view-section-title">Profile links</h4><ul class="resume-view-ul">${items}</ul>`);
    }

    return blocks.join('');
  }

  function resumeProfileHasContent(html) {
    return String(html || '').trim().length > 0;
  }

  function resolveApplicantResumeProfile(applicant) {
    if (!applicant || typeof applicant !== 'object') return null;
    if (applicant.resumeProfile && typeof applicant.resumeProfile === 'object') {
      return sanitizeProfileForResume({ ...applicant.resumeProfile, name: applicant.resumeProfile.name || applicant.name });
    }
    const mine = getStoredProfileDataForResume();
    const applicantEmail = (applicant.email || '').trim().toLowerCase();
    if (applicantEmail && mine && typeof mine === 'object') {
      const profileEmail = String(mine.email || '').trim().toLowerCase();
      let accountEmail = '';
      try {
        const acc = JSON.parse(localStorage.getItem('accountData') || '{}');
        accountEmail = String(acc.email || '').trim().toLowerCase();
      } catch (e) {}
      if (applicantEmail === profileEmail || (accountEmail && applicantEmail === accountEmail)) {
        return sanitizeProfileForResume({ ...mine, name: mine.name || applicant.name });
      }
    }
    return null;
  }

  async function fetchApplicantEmailFallback(applicantId) {
    const id = String(applicantId || '').trim();
    if (!id) return '';
    if (!window.RJGDb || typeof window.RJGDb.getClient !== 'function') return '';
    try {
      const supa = window.RJGDb.getClient();
      if (!supa) return '';
      const { data, error } = await supa
        .from('app_user')
        .select('email')
        .eq('id', id)
        .maybeSingle();
      if (error) return '';
      return String(data && data.email ? data.email : '').trim();
    } catch (e) {
      return '';
    }
  }

  function initJobDetailModal() {
    const modal = document.getElementById('jobDetailModal');
    if (!modal) return;

    const titleEl = document.getElementById('jobDetailTitle');
    const posterEl = document.getElementById('jobDetailPoster');
    const postedEl = document.getElementById('jobDetailPostedAgo');
    const scheduleEl = document.getElementById('jobDetailSchedule');
    const typeEl = document.getElementById('jobDetailType');
    const locationEl = document.getElementById('jobDetailLocation');
    const salaryEl = document.getElementById('jobDetailSalary');
    const settingsEl = document.getElementById('jobDetailSettings');
    const tagsEl = document.getElementById('jobDetailTags');
    const descEl = document.getElementById('jobDetailDescription');
    const reportBtn = document.getElementById('jobDetailReportBtn');
    const removeBtn = document.getElementById('jobDetailRemoveBtn');
    const applyBtn = document.getElementById('jobDetailApplyBtn');
    const bookmarkBtn = document.getElementById('jobDetailBookmarkBtn');
    const actionsSeeker = document.getElementById('jobDetailActionsSeeker');
    const actionsOwner = document.getElementById('jobDetailActionsOwner');
    const moreSection = modal.querySelector('.job-detail-more');
    const applicantsBtn = document.getElementById('jobDetailApplicantsBtn');
    const editBtn = document.getElementById('jobDetailEditBtn');
    const byRow = document.getElementById('jobDetailByRow');
    const ownerOpenRow = document.getElementById('jobDetailOwnerOpenRow');
    const openToggle = document.getElementById('jobDetailOpenToggle');
    const openStateText = document.getElementById('jobDetailOpenStateText');
    const heroEl = modal.querySelector('.job-detail-hero');

    let currentDetailJob = null;
    const jobReportReasons = [
      'Fake Job or Scam',
      'Requesting Money/Fees',
      'Misleading Information',
      'Discriminatory Content',
      'Malicious Content',
      'Spam or Duplicate'
    ];

    function ensureJobReportReasonModal() {
      let overlay = document.getElementById('jobReportReasonModal');
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.id = 'jobReportReasonModal';
      overlay.className = 'job-report-reason-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      const options = jobReportReasons
        .map(
          reason => `<label class="job-report-reason-option">
              <input type="radio" name="jobReportReason" value="${escapeHtml(reason)}">
              <span>${escapeHtml(reason)}</span>
            </label>`
        )
        .join('');
      overlay.innerHTML = `<div class="job-report-reason-panel" role="dialog" aria-modal="true" aria-labelledby="jobReportReasonTitle">
          <h3 id="jobReportReasonTitle">Report Job</h3>
          <p class="job-report-reason-subtitle">Choose a reason for reporting this job:</p>
          <div class="job-report-reason-list">${options}</div>
          <div class="job-report-reason-actions">
            <button type="button" class="job-report-reason-btn job-report-reason-btn--cancel" id="jobReportReasonCancelBtn">Cancel</button>
            <button type="button" class="job-report-reason-btn job-report-reason-btn--submit" id="jobReportReasonSubmitBtn">Submit Report</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      return overlay;
    }

    function closeJobReportReasonModal() {
      const overlay = document.getElementById('jobReportReasonModal');
      if (!overlay) return;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }

    function openJobReportReasonModal() {
      const overlay = ensureJobReportReasonModal();
      overlay.querySelectorAll('input[name="jobReportReason"]').forEach(input => {
        input.checked = false;
      });
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }

    function syncOwnerListingToggleUI(job) {
      if (!openToggle || !openStateText) return;
      const isOpen = job.listingOpen !== false;
      openToggle.setAttribute('aria-checked', isOpen ? 'true' : 'false');
      openStateText.textContent = isOpen ? 'Open' : 'Closed';
    }

    async function persistListingOpenToStore(job, listingOpen) {
      const idx = postedJobPlaceholders.findIndex(p =>
        job.id != null ? p.id === job.id : p.title === job.title
      );
      if (idx === -1) return;
      const prev = postedJobPlaceholders[idx].listingOpen;
      postedJobPlaceholders[idx].listingOpen = listingOpen;
      if (currentDetailJob) currentDetailJob.listingOpen = listingOpen;
      savePostedJobsToStorage();
      try {
        await syncPostedJobsToDbOrThrow();
      } catch (err) {
        postedJobPlaceholders[idx].listingOpen = prev;
        if (currentDetailJob) currentDetailJob.listingOpen = prev;
        savePostedJobsToStorage();
        throw err;
      }
    }

    function setJobDetailOwnerMode(isOwner) {
      if (reportBtn) reportBtn.hidden = isOwner;
      if (removeBtn) removeBtn.hidden = !isOwner;
      if (actionsSeeker) actionsSeeker.hidden = isOwner;
      if (actionsOwner) actionsOwner.hidden = !isOwner;
      if (moreSection) moreSection.hidden = isOwner;
      if (byRow) byRow.hidden = isOwner;
      if (ownerOpenRow) ownerOpenRow.hidden = !isOwner;
    }

    function closeJobDetail() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('job-detail-open');
      currentDetailJob = null;
      setJobDetailOwnerMode(false);
    }

    function syncApplyButtonState(job) {
      if (!applyBtn) return;
      const d = normalizeJobDetailPayload(job);
      if (d.isOwnerView) {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply';
        applyBtn.classList.remove('job-detail-btn--applied');
        applyBtn.removeAttribute('aria-label');
        return;
      }
      const applied = hasAppliedToJob(job);
      applyBtn.disabled = applied;
      if (applied) {
        applyBtn.textContent = 'Applied';
        applyBtn.classList.add('job-detail-btn--applied');
        applyBtn.setAttribute('aria-label', 'You have already applied to this job');
      } else {
        applyBtn.textContent = 'Apply';
        applyBtn.classList.remove('job-detail-btn--applied');
        applyBtn.removeAttribute('aria-label');
      }
    }

    function applyJobDetailFromJobObject(job) {
      const d = normalizeJobDetailPayload(job);
      currentDetailJob = job;
      if (heroEl) {
        const imageSrc = escapeHtml(String(job.image || job.imageUrl || job.jobImage || '').trim());
        heroEl.innerHTML = imageSrc
          ? `<img src="${imageSrc}" alt="" class="job-detail-hero-img" loading="eager" decoding="async">`
          : `<span class="job-detail-hero-no-image">No Image</span>`;
      }
      if (titleEl) titleEl.textContent = d.title;
      if (posterEl) posterEl.textContent = d.posterName;
      if (postedEl) postedEl.textContent = d.postedAgo;
      if (scheduleEl) scheduleEl.textContent = d.schedule;
      if (typeEl) typeEl.textContent = d.typeLabel;
      if (locationEl) locationEl.textContent = d.location;
      if (salaryEl) salaryEl.textContent = d.salary;
      if (settingsEl) settingsEl.textContent = d.settingsLabel;
      if (tagsEl) {
        tagsEl.innerHTML = d.skills
          .map(s => `<span class="job-detail-tag">${escapeHtml(s)}</span>`)
          .join('');
      }
      if (descEl) descEl.textContent = d.description;
      fillMoreLikeThumbs(d.title, d.moreSource, job);
      setJobDetailOwnerMode(!!d.isOwnerView);
      if (d.isOwnerView) syncOwnerListingToggleUI(job);
      syncApplyButtonState(job);
      syncBookmarkButtonState(job);
    }

    function syncBookmarkButtonState(job) {
      if (!bookmarkBtn) return;
      const d = normalizeJobDetailPayload(job);
      if (d.isOwnerView) {
        bookmarkBtn.disabled = false;
        bookmarkBtn.textContent = 'Bookmark';
        bookmarkBtn.classList.remove('job-detail-btn--bookmarked');
        bookmarkBtn.removeAttribute('aria-label');
        return;
      }
      const marked = job && job.id != null ? dbMyBookmarkJobIdSet.has(String(job.id)) : false;
      bookmarkBtn.disabled = false;
      if (marked) {
        bookmarkBtn.textContent = 'Bookmarked';
        bookmarkBtn.classList.add('job-detail-btn--bookmarked');
        bookmarkBtn.setAttribute('aria-label', 'Saved to bookmarks');
      } else {
        bookmarkBtn.textContent = 'Bookmark';
        bookmarkBtn.classList.remove('job-detail-btn--bookmarked');
        bookmarkBtn.removeAttribute('aria-label');
      }
    }

    function openJobDetailFromPayload(raw) {
      closeHeaderMenu();
      let job;
      try {
        job = JSON.parse(decodeURIComponent(raw));
      } catch (err) {
        return;
      }
      if (isJobReportedForCurrentUser(job)) return;
      applyJobDetailFromJobObject(job);
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('job-detail-open');
      modal.scrollTop = 0;
    }
    window.openJobDetailFromEncodedPayload = openJobDetailFromPayload;

    const jobCardSelector =
      '.job-card[data-job-detail], .fy-card[data-job-detail], .job-detail-more-card[data-job-detail], .jp-card[data-job-detail]';

    document.body.addEventListener('click', e => {
      const card = e.target.closest(jobCardSelector);
      if (!card) return;
      const raw = card.getAttribute('data-job-detail');
      if (!raw) return;
      openJobDetailFromPayload(raw);
    });

    document.body.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest(jobCardSelector);
      if (!card || e.target !== card) return;
      e.preventDefault();
      const raw = card.getAttribute('data-job-detail');
      if (raw) openJobDetailFromPayload(raw);
    });

    const sidebarJobBackBtn = document.getElementById('sidebarJobBackBtn');
    if (sidebarJobBackBtn) {
      sidebarJobBackBtn.addEventListener('click', () => {
        if (!modal.classList.contains('open')) return;
        closeJobDetail();
      });
    }

    const applicantsListModal = document.getElementById('applicantsListModal');
    const applicantsListJobTitle = document.getElementById('applicantsListJobTitle');
    const applicantsListBody = document.getElementById('applicantsListBody');
    const applicantsListCloseBtn = document.getElementById('applicantsListCloseBtn');
    const resumeViewModal = document.getElementById('resumeViewModal');
    const resumeViewApplicantName = document.getElementById('resumeViewApplicantName');
    const resumeViewBody = document.getElementById('resumeViewBody');
    const resumeViewCloseBtn = document.getElementById('resumeViewCloseBtn');
    const resumeViewAcceptBtn = document.getElementById('resumeViewAcceptBtn');
    const resumeViewRejectBtn = document.getElementById('resumeViewRejectBtn');
    const resumeViewReportBtn = document.getElementById('resumeViewReportBtn');
    let resumeViewApplicantIndex = null;
    let applicantsListActiveTab = 'pending';
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
              <input type="radio" name="resumeReportReason" value="${escapeHtml(reason)}" ${idx === 0 ? '' : ''}>
              <span>${escapeHtml(reason)}</span>
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

    function closeApplicantsListModal() {
      if (!applicantsListModal) return;
      applicantsListModal.classList.remove('open');
      applicantsListModal.setAttribute('aria-hidden', 'true');
    }

    function closeResumeViewModal() {
      if (!resumeViewModal) return;
      resumeViewModal.classList.remove('open');
      resumeViewModal.setAttribute('aria-hidden', 'true');
      resumeViewApplicantIndex = null;
    }

    function removeApplicantFromCurrentJob(index) {
      const job = currentDetailJob;
      if (!job || !Array.isArray(job.applicants) || index == null || !job.applicants[index]) return false;
      const removed = job.applicants.splice(index, 1)[0];
      if (!removed) return false;
      const storeIdx = postedJobPlaceholders.findIndex(p =>
        job.id != null ? p.id === job.id : p.title === job.title
      );
      if (storeIdx !== -1 && Array.isArray(postedJobPlaceholders[storeIdx].applicants)) {
        const list = postedJobPlaceholders[storeIdx].applicants;
        const i = list.findIndex(
          a =>
            a === removed ||
            (
              String(a.name || '') === String(removed.name || '') &&
              String(a.email || '').toLowerCase() === String(removed.email || '').toLowerCase()
            )
        );
        if (i !== -1) list.splice(i, 1);
      }
      return true;
    }

    function syncResumeActionButtons(applicant) {
      if (!resumeViewAcceptBtn || !resumeViewRejectBtn || !resumeViewReportBtn || !resumeViewCloseBtn) return;
      const status = applicant && applicant.applicationStatus ? String(applicant.applicationStatus) : '';
      const accepted = status === 'accepted';
      const rejected = status === 'rejected';

      if (accepted) {
        resumeViewAcceptBtn.hidden = true;
        resumeViewRejectBtn.hidden = true;
        resumeViewReportBtn.hidden = true;
        resumeViewCloseBtn.hidden = false;
        return;
      }

      if (rejected) {
        resumeViewAcceptBtn.hidden = true;
        resumeViewRejectBtn.hidden = false;
        resumeViewRejectBtn.textContent = 'Remove';
        resumeViewReportBtn.hidden = false;
        resumeViewCloseBtn.hidden = false;
        return;
      }

      // Pending/default
      resumeViewAcceptBtn.hidden = false;
      resumeViewRejectBtn.hidden = false;
      resumeViewRejectBtn.textContent = 'Reject';
      resumeViewReportBtn.hidden = false;
      resumeViewCloseBtn.hidden = false;
    }

    async function setApplicantApplicationStatus(applicantIndex, status) {
      const job = currentDetailJob;
      if (!job || job._moreSource !== 'posted' || !Array.isArray(job.applicants)) return false;
      const a = job.applicants[applicantIndex];
      if (!a) return false;

      const jobId = job.id != null ? String(job.id) : '';
      const applicantId = a && a._applicantId ? String(a._applicantId) : '';
      if (!jobId || !applicantId) return false;
      if (!window.RJGDb || typeof window.RJGDb.updateApplicationStatus !== 'function') return false;

      await window.RJGDb.updateApplicationStatus(jobId, applicantId, status);

      a.applicationStatus = status;
      const storeIdx = postedJobPlaceholders.findIndex(p =>
        job.id != null ? p.id === job.id : p.title === job.title
      );
      if (storeIdx !== -1 && Array.isArray(postedJobPlaceholders[storeIdx].applicants)) {
        const storedList = postedJobPlaceholders[storeIdx].applicants;
        const storeA = storedList.find(
          s =>
            s === a ||
            (String(s.name || '') === String(a.name || '') &&
              String(s.email || '').toLowerCase() === String(a.email || '').toLowerCase())
        );
        if (storeA) storeA.applicationStatus = status;
      savePostedJobsToStorage();
      }
      return true;
    }

    async function applyResumeDecision(status) {
      if (resumeViewApplicantIndex == null || !currentDetailJob) return;
      let ok = false;
      try {
        ok = await setApplicantApplicationStatus(resumeViewApplicantIndex, status);
      } catch (e) {
        const statMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, 'Unable to update application status. Please try again.')) || 'Unable to update application status. Please try again.';
        notify(statMsg, 'warn');
        return;
      }
      if (!ok) return;
      await hydrateMyApplicationsFromDb();
      await hydrateApplicantsForPostedJob(currentDetailJob);
      closeResumeViewModal();
      if (applicantsListModal && applicantsListModal.classList.contains('open')) {
        openApplicantsListModal(currentDetailJob, {
          tab: status === 'accepted' ? 'accepted' : 'rejected'
        });
      }
      notify(
        status === 'accepted' ? 'Application accepted.' : 'Application rejected.',
        status === 'accepted' ? 'success' : 'info'
      );
    }

    function promptResumeDecision(status) {
      if (resumeViewApplicantIndex == null || !currentDetailJob) return;
      const list = currentDetailJob.applicants;
      if (!Array.isArray(list) || !list[resumeViewApplicantIndex]) return;
      const applicant = list[resumeViewApplicantIndex];
      const displayName = applicant.name || 'this applicant';
      const jobTitle = currentDetailJob.title || 'this job';

      if (status === 'accepted') {
        window.showAppConfirmModal({
          title: 'Accept this applicant?',
          message: `You are about to accept ${displayName} for “${jobTitle}”. Do you want to continue?`,
          confirmLabel: 'Accept',
          cancelLabel: 'Cancel',
          danger: false,
          onConfirm: () => applyResumeDecision('accepted')
        });
      } else {
        window.showAppConfirmModal({
          title: 'Reject this applicant?',
          message: `You are about to reject ${displayName} for “${jobTitle}”. Do you want to continue?`,
          confirmLabel: 'Reject',
          cancelLabel: 'Cancel',
          danger: true,
          onConfirm: () => applyResumeDecision('rejected')
        });
      }
    }

    async function openResumeViewModal(applicant, applicantIdx) {
      if (!resumeViewModal || !applicant) return;
      resumeViewApplicantIndex = typeof applicantIdx === 'number' ? applicantIdx : null;
      const profile = resolveApplicantResumeProfile(applicant);
      console.log('Resume profile data:', profile); // Debug: Check what profile data is available
      const displayName = (profile && profile.name) || applicant.name || 'Applicant';
      let applicantEmail = String(applicant.email || '').trim();
      if (!applicantEmail && applicant && applicant._applicantId) {
        const fallbackEmail = await fetchApplicantEmailFallback(applicant._applicantId);
        if (fallbackEmail) applicantEmail = fallbackEmail;
      }
      if (resumeViewApplicantName) resumeViewApplicantName.textContent = displayName;
      if (resumeViewBody) {
        const html = profile ? buildResumeHtmlFromProfile(profile) : '';
        const emailBlock = applicantEmail
          ? `<div class="resume-view-block"><p class="resume-view-contact"><strong>Email:</strong> <a class="resume-view-link" href="mailto:${escapeHtml(applicantEmail)}">${escapeHtml(applicantEmail)}</a></p></div>`
          : `<div class="resume-view-block"><p class="resume-view-contact"><strong>Email:</strong> —</p></div>`;
        if (resumeProfileHasContent(html)) {
          resumeViewBody.innerHTML = emailBlock + html;
        } else {
          resumeViewBody.innerHTML =
            emailBlock + '<p class="resume-view-p resume-view-empty">No profile details are available for this applicant yet.</p>';
        }
      }
      syncResumeActionButtons(applicant);
      resumeViewModal.classList.add('open');
      resumeViewModal.setAttribute('aria-hidden', 'false');
    }

    function renderApplicantsListModalContent(job) {
      if (!applicantsListModal || !job || !applicantsListBody) return;
      if (job._moreSource === 'posted') {
        job.applicants = getApplicantsListIncludingSeeker(job);
      }
      const applicants = Array.isArray(job.applicants) ? job.applicants : [];
      const counts = { pending: 0, accepted: 0, rejected: 0 };
      applicants.forEach(a => {
        if (a.applicationStatus === 'accepted') counts.accepted += 1;
        else if (a.applicationStatus === 'rejected') counts.rejected += 1;
        else counts.pending += 1;
      });

      applicantsListModal.querySelectorAll('[data-applicants-tab]').forEach(btn => {
        const t = btn.dataset.applicantsTab;
        const countEl = btn.querySelector('.applicants-tab-count');
        if (countEl && counts[t] !== undefined) countEl.textContent = String(counts[t]);
        const isActive = applicantsListActiveTab === t;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      const tabLabelIds = {
        pending: 'tab-applicants-pending',
        accepted: 'tab-applicants-accepted',
        rejected: 'tab-applicants-rejected'
      };
      applicantsListBody.setAttribute('aria-labelledby', tabLabelIds[applicantsListActiveTab] || tabLabelIds.pending);

      const filtered = applicants
        .map((a, index) => ({ a, index }))
        .filter(({ a }) => {
          if (applicantsListActiveTab === 'accepted') return a.applicationStatus === 'accepted';
          if (applicantsListActiveTab === 'rejected') return a.applicationStatus === 'rejected';
          return a.applicationStatus !== 'accepted' && a.applicationStatus !== 'rejected';
        });

      if (applicants.length === 0) {
        applicantsListBody.innerHTML =
          '<li class="applicants-list-empty">No applications yet.</li>';
      } else if (filtered.length === 0) {
        const msg =
          applicantsListActiveTab === 'pending'
            ? 'No pending applications.'
            : applicantsListActiveTab === 'accepted'
              ? 'No accepted applicants yet.'
              : 'No rejected applicants yet.';
        applicantsListBody.innerHTML = `<li class="applicants-list-empty">${escapeHtml(msg)}</li>`;
      } else {
        applicantsListBody.innerHTML = filtered
          .map(({ a, index: idx }) => {
            const name = escapeHtml(a.name || 'Applicant');
            const email = a.email
              ? `<span class="applicants-list-email">${escapeHtml(a.email)}</span>`
              : '';
            const when = a.appliedAt
              ? `<span class="applicants-list-when">${escapeHtml(a.appliedAt)}</span>`
              : '';
            return `<li class="applicants-list-item">
                <div class="applicants-list-row">
                  <div class="applicants-list-main">
                    <div class="applicants-list-name">${name}</div>
                    ${email ? `<div class="applicants-list-line">${email}</div>` : ''}
                    ${when ? `<div class="applicants-list-line applicants-list-line--meta">${when}</div>` : ''}
                  </div>
                  <button type="button" class="applicants-view-resume-btn" data-applicant-idx="${idx}">View Resume</button>
                </div>
              </li>`;
          })
          .join('');
      }
    }

    async function openApplicantsListModal(job, opts) {
      if (!applicantsListModal || !job) return;
      const o = opts && typeof opts === 'object' ? opts : {};
      if (o.tab === 'pending' || o.tab === 'accepted' || o.tab === 'rejected') {
        applicantsListActiveTab = o.tab;
      } else {
        applicantsListActiveTab = 'pending';
      }
      if (applicantsListJobTitle) applicantsListJobTitle.textContent = job.title || 'Job';
      await hydrateApplicantsForPostedJob(job);
      renderApplicantsListModalContent(job);
      applicantsListModal.classList.add('open');
      applicantsListModal.setAttribute('aria-hidden', 'false');
    }

    if (applicantsListCloseBtn) {
      applicantsListCloseBtn.addEventListener('click', closeApplicantsListModal);
    }
    if (applicantsListModal) {
      applicantsListModal.addEventListener('click', e => {
        const tabBtn = e.target.closest('[data-applicants-tab]');
        if (tabBtn && applicantsListModal.contains(tabBtn)) {
          const tab = tabBtn.dataset.applicantsTab;
          if (
            (tab === 'pending' || tab === 'accepted' || tab === 'rejected') &&
            tab !== applicantsListActiveTab &&
            currentDetailJob
          ) {
            applicantsListActiveTab = tab;
            renderApplicantsListModalContent(currentDetailJob);
          }
          return;
        }
        if (e.target === applicantsListModal) return;
      });
    }
    if (applicantsListBody) {
      applicantsListBody.addEventListener('click', e => {
        const btn = e.target.closest('.applicants-view-resume-btn');
        if (!btn) return;
        const idx = Number(btn.dataset.applicantIdx);
        const j = currentDetailJob;
        const list = j && Array.isArray(j.applicants) ? j.applicants : [];
        const applicant = list[idx];
        if (applicant) Promise.resolve(openResumeViewModal(applicant, idx));
      });
    }
    if (resumeViewAcceptBtn) {
      resumeViewAcceptBtn.addEventListener('click', () => promptResumeDecision('accepted'));
    }
    if (resumeViewRejectBtn) {
      resumeViewRejectBtn.addEventListener('click', () => {
        const list = currentDetailJob && Array.isArray(currentDetailJob.applicants) ? currentDetailJob.applicants : [];
        const applicant =
          resumeViewApplicantIndex != null && list[resumeViewApplicantIndex]
            ? list[resumeViewApplicantIndex]
            : null;
        if (applicant && applicant.applicationStatus === 'rejected') {
          const removed = removeApplicantFromCurrentJob(resumeViewApplicantIndex);
          if (removed) {
            closeResumeViewModal();
            if (applicantsListModal && applicantsListModal.classList.contains('open') && currentDetailJob) {
              renderApplicantsListModalContent(currentDetailJob);
            }
            buildPostingGrid();
            notify('Applicant removed from rejected list.', 'info');
          }
          return;
        }
        promptResumeDecision('rejected');
      });
    }
    if (resumeViewReportBtn) {
      resumeViewReportBtn.addEventListener('click', () => {
        const list = currentDetailJob && Array.isArray(currentDetailJob.applicants) ? currentDetailJob.applicants : [];
        const applicant =
          resumeViewApplicantIndex != null && list[resumeViewApplicantIndex]
            ? list[resumeViewApplicantIndex]
            : null;
        const displayName = applicant && applicant.name ? applicant.name : 'this applicant';
        openResumeReportModal(displayName);
      });
    }
    if (resumeViewCloseBtn) {
      resumeViewCloseBtn.addEventListener('click', closeResumeViewModal);
    }
    if (resumeViewModal) {
      resumeViewModal.addEventListener('click', e => {
        if (e.target === resumeViewModal) return;
      });
    }
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
          const list = currentDetailJob && Array.isArray(currentDetailJob.applicants) ? currentDetailJob.applicants : [];
          const applicant =
            resumeViewApplicantIndex != null && list[resumeViewApplicantIndex]
              ? list[resumeViewApplicantIndex]
              : null;
          if (currentDetailJob && applicant) {
            markApplicantReportedForJob(currentDetailJob, applicant, selected.value);
            // Submit resume report to database
            if (window.RJGDb && typeof window.RJGDb.submitReport === 'function') {
              const targetUserId = applicant._applicantId ? String(applicant._applicantId) : null;
              try {
                await window.RJGDb.submitReport({
                  targetType: 'resume',
                  targetJobId: null,
                  targetUserId: targetUserId,
                  reason: selected.value
                });
                notify(`Resume reported: ${selected.value}.`, 'info');
              } catch (err) {
                console.warn('Failed to submit resume report to DB:', err);
                notify('Report submitted locally but database save failed.', 'warn');
              }
            } else {
              notify(`Resume reported: ${selected.value}.`, 'info');
            }
            currentDetailJob.applicants = getApplicantsListIncludingSeeker(currentDetailJob);
            buildPostingGrid();
            closeResumeViewModal();
            if (applicantsListModal && applicantsListModal.classList.contains('open')) {
              renderApplicantsListModalContent(currentDetailJob);
            }
          }
          closeResumeReportModal();
        }
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const confirmEl = document.getElementById('appConfirmOverlay');
      if (confirmEl && confirmEl.classList.contains('open')) return;
      const jobReportOverlay = document.getElementById('jobReportReasonModal');
      if (jobReportOverlay && jobReportOverlay.classList.contains('open')) {
        closeJobReportReasonModal();
        return;
      }
      const resumeReportEl = document.getElementById('resumeReportReasonModal');
      if (resumeReportEl && resumeReportEl.classList.contains('open')) {
        closeResumeReportModal();
        return;
      }
      if (resumeViewModal && resumeViewModal.classList.contains('open')) {
        closeResumeViewModal();
        return;
      }
      if (applicantsListModal && applicantsListModal.classList.contains('open')) {
        closeApplicantsListModal();
        return;
      }
      if (document.querySelector('.jp-modal-overlay.open, .jp-submodal-overlay.open')) return;
      if (modal.classList.contains('open')) closeJobDetail();
    });

    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        if (!currentDetailJob) return;
        openJobReportReasonModal();
      });
    }
    const jobReportReasonModal = ensureJobReportReasonModal();
    if (jobReportReasonModal) {
      jobReportReasonModal.addEventListener('click', async e => {
        if (e.target === jobReportReasonModal) return;
        const cancelBtn = e.target.closest('#jobReportReasonCancelBtn');
        if (cancelBtn) {
          closeJobReportReasonModal();
          return;
        }
        const submitBtn = e.target.closest('#jobReportReasonSubmitBtn');
        if (submitBtn) {
          const selected = jobReportReasonModal.querySelector('input[name="jobReportReason"]:checked');
          if (!selected) {
            notify('Please select a report reason first.', 'warn');
            return;
          }
          if (currentDetailJob) hideJobForCurrentUser(currentDetailJob, selected.value);
          // Submit report to database
          if (currentDetailJob && window.RJGDb && typeof window.RJGDb.submitReport === 'function') {
            const jobId = currentDetailJob.id != null ? String(currentDetailJob.id) : null;
            try {
              await window.RJGDb.submitReport({
                targetType: 'job',
                targetJobId: jobId,
                targetUserId: null,
                reason: selected.value
              });
              notify(`Job reported: ${selected.value}.`, 'info');
            } catch (err) {
              console.warn('Failed to submit job report to DB:', err);
              notify('Report submitted locally but database save failed.', 'warn');
            }
          } else {
            notify(`Job reported: ${selected.value}.`, 'info');
          }
          closeJobReportReasonModal();
          closeJobDetail();
          renderListings();
          buildForYouGrid();
          const returnToSectionUrl = sessionStorage.getItem('dashboardSectionReturnAfterReport');
          if (currentDetailJob && currentDetailJob._moreSource === 'listing' && returnToSectionUrl) {
            sessionStorage.removeItem('dashboardSectionReturnAfterReport');
            window.location.href = returnToSectionUrl;
          }
        }
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const j = currentDetailJob;
        if (!j || j._moreSource !== 'posted') return;
        window.showAppConfirmModal({
          title: 'Remove this job?',
          message:
            'This listing will be removed from your posted jobs. You can post a new job anytime.',
          confirmLabel: 'Remove',
          cancelLabel: 'Cancel',
          danger: true,
          onConfirm: async () => {
            const idx = postedJobPlaceholders.findIndex(p =>
              j.id != null ? p.id === j.id : p.title === j.title
            );
            let removed = null;
            if (idx !== -1) {
              removed = postedJobPlaceholders[idx];
              postedJobPlaceholders.splice(idx, 1);
            }
            savePostedJobsToStorage();
            try {
              await syncPostedJobsToDbOrThrow();
            } catch (err) {
              if (idx !== -1 && removed) postedJobPlaceholders.splice(idx, 0, removed);
              savePostedJobsToStorage();
              const rmMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to remove this job. Please try again.')) || 'Unable to remove this job. Please try again.';
              notify(rmMsg, 'warn');
              return;
            }
            buildPostingGrid();
            closeJobDetail();
            notify('Job removed.', 'info');
          }
        });
      });
    }
    if (openToggle) {
      openToggle.addEventListener('click', async () => {
        const j = currentDetailJob;
        if (!j || j._moreSource !== 'posted') return;
        const wasOpen = j.listingOpen !== false;
        const nextOpen = !wasOpen;
        try {
          await persistListingOpenToStore(j, nextOpen);
        } catch (err) {
          const availMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to update job availability. Please try again.')) || 'Unable to update job availability. Please try again.';
          notify(availMsg, 'warn');
          return;
        }
        syncOwnerListingToggleUI(currentDetailJob);
        buildPostingGrid();
        notify(nextOpen ? 'Availability is open for applicants.' : 'Availability closed. You can reopen anytime.', 'info');
      });
    }
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (!currentDetailJob || hasAppliedToJob(currentDetailJob)) return;
        const detailPayload = normalizeJobDetailPayload(currentDetailJob);
        if (
          !detailPayload.isOwnerView &&
          typeof SA.isSeekerProfileCompleteForApplication === 'function' &&
          !SA.isSeekerProfileCompleteForApplication()
        ) {
          if (typeof SA.openCompleteProfileModalForApply === 'function') SA.openCompleteProfileModalForApply();
          return;
        }
        window.showAppConfirmModal({
          title: 'Submit application?',
          message: 'Your application will be sent to the employer for this job.',
          confirmLabel: 'Apply',
          cancelLabel: 'Cancel',
          danger: false,
          onConfirm: async () => {
            try {
              if (currentDetailJob) await recordSeekerApplication(currentDetailJob);
              await hydrateMyApplicationsFromDb();
              notify('Application submitted.', 'success');
            } catch (e) {
              notify('Unable to submit application.', 'warn');
            }
            if (currentDetailJob) syncApplyButtonState(currentDetailJob);
            if (currentDetailJob) syncBookmarkButtonState(currentDetailJob);
            buildPostingGrid();
            closeJobDetail();
          }
        });
      });
    }
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', async () => {
        const j = currentDetailJob;
        if (!j) return;
        const d = normalizeJobDetailPayload(j);
        if (d.isOwnerView) return;
        if (!window.RJGDb || typeof window.RJGDb.toggleBookmark !== 'function') return;
        let nowMarked = false;
        try {
          nowMarked = await window.RJGDb.toggleBookmark(String(j.id));
          await hydrateMyBookmarksFromDb();
        } catch (e) {
          notify('Unable to update bookmark.', 'warn');
          return;
        }
        syncBookmarkButtonState(j);
        notify(nowMarked ? 'Saved to bookmarks.' : 'Removed from bookmarks.', nowMarked ? 'success' : 'info');
      });
    }
    if (applicantsBtn) {
      applicantsBtn.addEventListener('click', () => {
        const j = currentDetailJob;
        if (!j || j._moreSource !== 'posted') return;
        openApplicantsListModal(j);
      });
    }
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const j = currentDetailJob;
        if (!j || j._moreSource !== 'posted') return;
        if (typeof window.openEditJob === 'function') {
          window.openEditJob(j);
        } else {
          notify('Edit form could not be opened.', 'warn');
        }
      });
    }

    window.refreshJobDetailAfterEdit = function (updatedJob) {
      if (!modal.classList.contains('open') || !updatedJob) return;
      applyJobDetailFromJobObject({ ...updatedJob, _moreSource: 'posted' });
    };
  }

  initJobDetailModal();
  hydrateMyApplicationsFromDb();
  hydrateMyBookmarksFromDb();
  try {
    const pendingPayload = sessionStorage.getItem('pendingJobDetailPayload');
    if (pendingPayload && typeof window.openJobDetailFromEncodedPayload === 'function') {
      sessionStorage.removeItem('pendingJobDetailPayload');
      window.openJobDetailFromEncodedPayload(pendingPayload);
    }
  } catch (e) {
    /* ignore */
  }

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