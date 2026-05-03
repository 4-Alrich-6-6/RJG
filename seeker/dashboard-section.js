(function () {
  const sectionTitleEl = document.getElementById('sectionTitle');
  const sectionSubtitleEl = document.getElementById('sectionSubtitle');
  const sectionGridEl = document.getElementById('sectionGrid');
  const sectionEmptyEl = document.getElementById('sectionEmpty');
  const backBtn = document.getElementById('sectionBackBtn');
  const sectionSearchInput = document.getElementById('sectionSearchInput');
  const sectionSearchBtn = document.getElementById('sectionSearchBtn');
  const sectionFilterBtn = document.getElementById('sectionFilterBtn');
  const sectionFilterModal = document.getElementById('sectionFilterModal');
  const sectionFilterRateMin = document.getElementById('sectionFilterRateMin');
  const sectionFilterRateMax = document.getElementById('sectionFilterRateMax');
  const sectionFilterRateCurrency = document.getElementById('sectionFilterRateCurrency');
  const sectionFilterApplyBtn = document.getElementById('sectionFilterApplyBtn');
  const sectionFilterResetBtn = document.getElementById('sectionFilterResetBtn');
  const sectionPagination = document.getElementById('sectionPagination');
  const paginationText = document.getElementById('paginationText');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  
  // Header pagination elements
  const headerPagination = document.getElementById('headerPagination');
  const headerPaginationText = document.getElementById('headerPaginationText');
  const headerPrevPageBtn = document.getElementById('headerPrevPageBtn');
  const headerNextPageBtn = document.getElementById('headerNextPageBtn');
  const headerMenuBtn = document.getElementById('headerMenuBtn');
  const headerMenuDropdown = document.getElementById('headerMenuDropdown');
  const headerMenu = document.querySelector('.header-menu');
  const SA = window.SeekerApp;
  const listingFilters = {
    category: null,
    schedule: null,
    type: null,
    rateUnit: null
  };

  // Pagination state
  const JOBS_PER_PAGE = 8;
  let currentPage = 1;
  let totalJobs = 0;
  let filteredJobs = [];
  let snapshotData = null;
  let liveJobsCache = [];
  function getRoleHomePage() {
    const role = String(
      (sessionStorage.getItem('rjgUserRole') || localStorage.getItem('rjgUserRole') || '')
    ).toLowerCase();
    return role === 'recruiter' || role === 'employer' ? '../recruiter/job-posting.html' : '../seeker/dashb.html';
  }
  async function resolveRoleHomePage() {
    if (window.RJGDb && typeof window.RJGDb.getCurrentUserRole === 'function') {
      try {
        const dbRole = String((await window.RJGDb.getCurrentUserRole()) || '').toLowerCase();
        if (dbRole) {
          sessionStorage.setItem('rjgUserRole', dbRole);
          localStorage.setItem('rjgUserRole', dbRole);
          return dbRole === 'recruiter' || dbRole === 'employer' ? '../recruiter/recruiter-dashb.html' : '../seeker/dashb.html';
        }
      } catch (error) {}
    }
    return getRoleHomePage();
  }

  function currencySymbolFor(code) {
    return SA && typeof SA.currencySymbolFor === 'function' ? SA.currencySymbolFor(code) : '';
  }

  function formatSalaryDisplay(job) {
    return SA && typeof SA.formatSalaryDisplay === 'function'
      ? SA.formatSalaryDisplay(job)
      : `${currencySymbolFor('PHP')}— / Hour`;
  }

  function formatJobInfo(job) {
    const ratePart = job.rate ? formatSalaryDisplay(job) : '';
    const urgentPart = job.urgent ? 'Urgent' : '';
    const third = [ratePart, urgentPart].filter(Boolean).join(ratePart && urgentPart ? ' · ' : '');
    const parts = [
      `${job.company || '—'} · ${job.location || '—'}`,
      `${job.category || 'Job'} · ${job.schedule || '—'} · ${job.type || 'On-Site'}`,
      third || '—'
    ];
    return parts.join(' · ');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function makeCard(job) {
    const payload = encodeURIComponent(JSON.stringify({ ...job, _moreSource: 'listing' }));
    const imageSrc = escapeHtml(String(job.image || job.imageUrl || job.jobImage || '').trim());
    const thumbMarkup = imageSrc
      ? `<img src="${imageSrc}" alt="" class="job-thumb-img" loading="lazy">`
      : `<span class="job-thumb-no-image">No Image</span>`;
    return `<div class="job-card" role="button" tabindex="0" data-job-detail="${payload}">
      <div class="card-thumb">${thumbMarkup}</div>
      <div class="card-title">${escapeHtml(job.title || 'Job')}</div>
      <div class="card-info">${escapeHtml(formatJobInfo(job))}</div>
    </div>`;
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
    return { currency: '', amount: NaN };
  }

  function applySectionFilters(data, query) {
    const q = String(query || '').trim().toLowerCase();
    return data.filter(job => {
      const info = formatJobInfo(job).toLowerCase();
      const matchesSearch = !q || String(job.title || '').toLowerCase().includes(q) || info.includes(q);
      const matchesCategory = !listingFilters.category || job.category === listingFilters.category;
      const matchesSchedule = !listingFilters.schedule || job.schedule === listingFilters.schedule;
      const matchesType = !listingFilters.type || job.type === listingFilters.type;
      const matchesRate = !listingFilters.rateUnit || job.rateUnit === listingFilters.rateUnit;
      const { currency, amount } = parseRateParts(job.rate);
      const minValue = sectionFilterRateMin && sectionFilterRateMin.value !== '' ? Number(sectionFilterRateMin.value) : null;
      const maxValue = sectionFilterRateMax && sectionFilterRateMax.value !== '' ? Number(sectionFilterRateMax.value) : null;
      const selectedCurrency = sectionFilterRateCurrency ? sectionFilterRateCurrency.value : '';
      const matchesCurrency = !listingFilters.currency || currency === listingFilters.currency;
      const matchesMin = !listingFilters.rateMin || amount >= listingFilters.rateMin;
      const matchesMax = !listingFilters.rateMax || amount <= listingFilters.rateMax;
      return matchesSearch && matchesCategory && matchesSchedule && matchesType && matchesRate && matchesCurrency && matchesMin && matchesMax;
    });
  }

  function updatePaginationUI() {
    const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);
    
    if (totalJobs <= JOBS_PER_PAGE) {
      // Hide both pagination controls
      if (sectionPagination) sectionPagination.hidden = true;
      if (headerPagination) headerPagination.hidden = true;
      return;
    }
    
    // Show both pagination controls
    if (sectionPagination) {
      sectionPagination.hidden = false;
      if (paginationText) paginationText.textContent = `Page ${currentPage} of ${totalPages}`;
      if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
      if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
    }
    
    if (headerPagination) {
      headerPagination.hidden = false;
      if (headerPaginationText) headerPaginationText.textContent = `Page ${currentPage} of ${totalPages}`;
      if (headerPrevPageBtn) headerPrevPageBtn.disabled = currentPage === 1;
      if (headerNextPageBtn) headerNextPageBtn.disabled = currentPage === totalPages;
    }
  }

  function getCurrentPageJobs() {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    return filteredJobs.slice(startIndex, endIndex);
  }

  function goToPage(page) {
    const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    const currentPageJobs = getCurrentPageJobs();
    renderJobsList(currentPageJobs);
    updatePaginationUI();
    
    // Scroll to top of job list
    sectionGridEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderJobsList(jobs) {
    console.log('renderJobsList called with jobs:', jobs.length, 'jobs data:', jobs.slice(0, 2).map(j => ({ title: j.title, postedAgo: j.postedAgo })));
    console.log('renderJobsList: SA available?', !!SA, 'SA.renderJobCard available?', !!(SA && SA.renderJobCard));
    
    if (!sectionGridEl) {
      console.log('renderJobsList: sectionGridEl not found');
      return;
    }
    sectionGridEl.innerHTML = '';
    
    if (!Array.isArray(jobs) || !jobs.length) {
      console.log('renderJobsList: No jobs to display, showing empty message');
      if (sectionEmptyEl) sectionEmptyEl.hidden = false;
      if (sectionPagination) sectionPagination.hidden = true;
      return;
    }
    
    if (sectionEmptyEl) sectionEmptyEl.hidden = true;
    
    const fragment = document.createDocumentFragment();
    let cardsCreated = 0;
    jobs.forEach(job => {
      let card = null;
      
      // Try to get card from SeekerApp
      if (SA && typeof SA.renderJobCard === 'function') {
        try {
          card = SA.renderJobCard(job);
        } catch (e) {
          console.log('renderJobsList: SA.renderJobCard threw error for job:', job.title, e);
        }
      } else {
        console.log('renderJobsList: SA.renderJobCard not available for job:', job.title);
      }
      
      // Fallback: create a basic card if SA.renderJobCard fails
      if (!card) {
        card = createBasicJobCard(job);
      }
      
      if (card) {
        fragment.appendChild(card);
        cardsCreated++;
      } else {
        console.log('renderJobsList: Failed to create card for job:', job.title);
      }
    });
    console.log('renderJobsList: Created', cardsCreated, 'cards out of', jobs.length, 'jobs');
    sectionGridEl.appendChild(fragment);
  }

  function createBasicJobCard(job) {
    const payload = encodeURIComponent(JSON.stringify(job));
    const isArchived = job.is_archived === true || job.status === 'archived' || job.listing_open === false;
    const archivedClass = isArchived ? ' job-archived' : '';
    const archivedTitle = isArchived ? ' (Archived)' : '';
    
    // Debug: Check what image fields are available
    console.log('createBasicJobCard - job image fields:', {
      avatarUrl: job.avatarUrl,
      image: job.image,
      imageUrl: job.imageUrl,
      logo: job.logo,
      logoUrl: job.logoUrl,
      thumbnail: job.thumbnail,
      thumbnailUrl: job.thumbnailUrl,
      companyLogo: job.companyLogo,
      company_logo: job.company_logo
    });
    
    // Try multiple possible image field names
    const imageUrl = job.avatarUrl || job.image || job.imageUrl || job.logo || job.logoUrl || job.thumbnail || job.thumbnailUrl || job.companyLogo || job.company_logo;
    
    // Create thumbnail
    const thumbMarkup = imageUrl 
      ? `<img src="${imageUrl}" alt="${job.title}" class="job-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="card-thumb-placeholder" style="display:none;">
           <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
             <rect width="40" height="40" rx="8" fill="#f0f0f0"/>
             <path d="M20 12C16.6863 12 14 14.6863 14 18C14 21.3137 16.6863 24 20 24C23.3137 24 26 21.3137 26 18C26 14.6863 23.3137 12 20 12Z" fill="#999"/>
             <path d="M10 30C10 26.6863 12.6863 24 16 24H24C27.3137 24 30 26.6863 30 30V32H10V30Z" fill="#999"/>
           </svg>
         </div>`
      : `<div class="card-thumb-placeholder">
           <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
             <rect width="40" height="40" rx="8" fill="#f0f0f0"/>
             <path d="M20 12C16.6863 12 14 14.6863 14 18C14 21.3137 16.6863 24 20 24C23.3137 24 26 21.3137 26 18C26 14.6863 23.3137 12 20 12Z" fill="#999"/>
             <path d="M10 30C10 26.6863 12.6863 24 16 24H24C27.3137 24 30 26.6863 30 30V32H10V30Z" fill="#999"/>
           </svg>
         </div>`;
    
    // Format job info like the main dashboard
    const jobInfo = formatJobInfo(job);
    
    const card = document.createElement('div');
    card.className = `job-card${archivedClass}`;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('data-job-detail', payload);
    card.innerHTML = `
      <div class="card-thumb">${thumbMarkup}</div>
      <div class="card-title">${job.title || 'Untitled Job'}${archivedTitle}</div>
      <div class="card-info">${jobInfo}</div>
    `;
    
    return card;
  }

  function formatJobInfo(job) {
    const parts = [];
    
    // Company/Posted by
    if (job.company || job.postedBy) {
      parts.push(job.company || job.postedBy);
    }
    
    // Location
    if (job.location) {
      parts.push(job.location);
    }
    
    // Job type
    if (job.type) {
      parts.push(job.type);
    }
    
    // Schedule
    if (job.schedule) {
      parts.push(job.schedule);
    }
    
    // Rate
    if (job.rate) {
      parts.push(job.rate);
    }
    
    // Posted time
    if (job.postedAgo) {
      parts.push(job.postedAgo);
    }
    
    return parts.join(' · ') || 'No additional info';
  }

  function readSnapshot() {
    try {
      const raw = sessionStorage.getItem('dashboardSectionSnapshot');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.jobs)) parsed.jobs = [];
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function postedAgoToDays(value) {
    const text = String(value || '').trim().toLowerCase();
    console.log('Seeker postedAgoToDays called with:', value, '-> text:', text);
    
    if (!text || text === 'recently' || text === 'just now' || text === 'today') {
      console.log('Seeker returning 0 for recently/just now/today');
      return 0;
    }
    
    // Handle new format: "1d ago", "2d ago", "1h ago", "1m ago"
    const newFormatMatch = text.match(/^(\d+)([dmhdw])\s*ago$/);
    if (newFormatMatch) {
      const n = Number(newFormatMatch[1]);
      const unit = newFormatMatch[2];
      console.log('Seeker new format match:', n, unit);
      switch (unit) {
        case 'm': console.log('Seeker returning 0 for minutes'); return 0; // minutes - less than 1 day
        case 'h': console.log('Seeker returning 0 for hours'); return 0; // hours - less than 1 day  
        case 'd': console.log('Seeker returning', n, 'for days'); return n; // days
        case 'w': console.log('Seeker returning', n * 7, 'for weeks'); return n * 7; // weeks
        default: console.log('Seeker returning infinity for unknown unit'); return Number.POSITIVE_INFINITY;
      }
    }
    
    // Handle old format: "1 day ago", "2 weeks ago"
    const m = text.match(/^(\d+)\s*(day|days|week|weeks)\s*ago$/);
    if (!m) {
      console.log('Seeker no format match, returning infinity');
      return Number.POSITIVE_INFINITY;
    }
    const n = Number(m[1]);
    if (!Number.isFinite(n)) {
      console.log('Seeker invalid number, returning infinity');
      return Number.POSITIVE_INFINITY;
    }
    const result = m[2].startsWith('week') ? n * 7 : n;
    console.log('Seeker old format match, returning:', result);
    return result;
  }

  function getStoredJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (e) {
      return fallback;
    }
  }

  function sectionMetaFromKey(sectionKey) {
    if (sectionKey === 'now') return { title: 'Jobs Right Now' };
    if (sectionKey === 'new') return { title: 'Recently Posted' };
    if (sectionKey === 'urgent') return { title: 'Urgent Jobs' };
    return { title: 'Jobs' };
  }

  function readSectionFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return String(params.get('section') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function loadSectionJobsFromLive(sectionKey, jobs) {
    const list = Array.isArray(jobs) ? jobs : [];
    if (sectionKey === 'new') {
      console.log('Seeker new section filter - total jobs:', list.length);
      console.log('Seeker jobs data:', list.map(j => ({ title: j.title, postedAgo: j.postedAgo })));
      const filtered = list.filter(job => {
        const days = postedAgoToDays(job.postedAgo);
        const result = days <= 7;
        console.log('Seeker new filter check - Job:', job.title, 'postedAgo:', job.postedAgo, 'days:', days, 'result:', result);
        return result;
      });
      console.log('Seeker new section filtered jobs:', filtered.length);
      return filtered;
    }
    if (sectionKey === 'urgent') return list.filter(job => !!job.urgent);
    return list;
  }

  async function hydrateLiveJobs() {
    if (!window.RJGDb || typeof window.RJGDb.loadAllJobs !== 'function') {
      liveJobsCache = [];
      return;
    }
    try {
      const allJobs = await window.RJGDb.loadAllJobs();
      console.log('Seeker hydrateLiveJobs - allJobs count:', allJobs.length);
      console.log('Seeker allJobs sample:', allJobs.slice(0, 3).map(j => ({ title: j.title, isOwnerPost: j.isOwnerPost, listingOpen: j.listingOpen, listing_open: j.listing_open, postedAgo: j.postedAgo })));
      
      liveJobsCache = (Array.isArray(allJobs) ? allJobs : []).filter(
        job => {
          const isOwnerPost = job.isOwnerPost;
          const listingOpen = job.listingOpen;
          const listing_open = job.listing_open;
          const passes = !isOwnerPost && listingOpen !== false;
          console.log('Seeker job filter - Job:', job.title, 'isOwnerPost:', isOwnerPost, 'listingOpen:', listingOpen, 'listing_open:', listing_open, 'passes:', passes);
          return passes;
        }
      );
      console.log('Seeker hydrateLiveJobs - liveJobsCache count:', liveJobsCache.length);
    } catch (e) {
      console.log('Seeker hydrateLiveJobs error:', e);
      liveJobsCache = [];
    }
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

  function loadReportedJobKeys() {
    try {
      const raw = localStorage.getItem(`reportedJobs:${currentReporterIdentity()}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      return [];
    }
  }

  function storedJobIdForDetailJob(job) {
    if (!job || typeof job !== 'object') return '';
    const title = String(job.title || '').trim();
    if (job.id != null && String(job.id).trim() !== '') return String(job.id);
    if (!title && job.id == null) return '';
    return `${title}|${String(job.company || '').trim()}`;
  }

  function isJobReportedForCurrentUser(job) {
    const key = storedJobIdForDetailJob(job);
    if (!key) return false;
    return loadReportedJobKeys().includes(key);
  }

  function openJobInMainDashboard(job) {
    if (!job || typeof job !== 'object') return;
    const payload = encodeURIComponent(JSON.stringify({ ...job, _moreSource: 'listing' }));
    const sectionKey =
      snapshotData && typeof snapshotData.section === 'string' && snapshotData.section
        ? snapshotData.section
        : '';
    const returnUrl = sectionKey
      ? `dashboard-section.html?section=${encodeURIComponent(sectionKey)}`
      : 'dashboard-section.html';
    sessionStorage.setItem('dashboardSectionReturnAfterReport', returnUrl);
    sessionStorage.setItem('pendingJobDetailPayload', payload);
    window.location.href = getRoleHomePage();
  }

  async function render() {
    snapshotData = readSnapshot();
    const sectionKeyFromUrl = readSectionFromUrl();
    const sectionKey =
      sectionKeyFromUrl ||
      (snapshotData && typeof snapshotData.section === 'string' ? snapshotData.section : 'now');
    const meta = sectionMetaFromKey(sectionKey);
    if (!snapshotData || typeof snapshotData !== 'object') {
      snapshotData = { section: sectionKey, title: meta.title };
    }
    await hydrateLiveJobs();
    if (sectionTitleEl) sectionTitleEl.textContent = snapshotData.title || meta.title || 'Jobs';
    const liveJobs = loadSectionJobsFromLive(sectionKey, liveJobsCache);
    console.log('Dashboard-section - liveJobs count:', liveJobs.length);
    console.log('Dashboard-section - liveJobs sample:', liveJobs.slice(0, 2).map(j => ({ title: j.title, postedAgo: j.postedAgo })));
    
    filteredJobs = applySectionFilters(liveJobs, sectionSearchInput ? sectionSearchInput.value : '')
      .filter(job => !isJobReportedForCurrentUser(job));
    console.log('Dashboard-section - filteredJobs count:', filteredJobs.length);
    
    // Reset pagination when filters change
    currentPage = 1;
    totalJobs = filteredJobs.length;
    console.log('Dashboard-section - totalJobs:', totalJobs, 'currentPage:', currentPage);
    
    const currentPageJobs = getCurrentPageJobs();
    console.log('Dashboard-section - currentPageJobs count:', currentPageJobs.length);
    console.log('Dashboard-section - currentPageJobs sample:', currentPageJobs.slice(0, 2).map(j => ({ title: j.title, postedAgo: j.postedAgo })));
    
    renderJobsList(currentPageJobs);
    updatePaginationUI();
  }

  function openSectionFilter() {
    if (!sectionFilterModal) return;
    sectionFilterModal.classList.add('open');
  }

  function closeSectionFilter() {
    if (!sectionFilterModal) return;
    sectionFilterModal.classList.remove('open');
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
    // Capture filter values from modal inputs
    if (sectionFilterRateMin) {
      const minValue = sectionFilterRateMin.value !== '' ? Number(sectionFilterRateMin.value) : null;
      listingFilters.rateMin = minValue;
    }
    
    if (sectionFilterRateMax) {
      const maxValue = sectionFilterRateMax.value !== '' ? Number(sectionFilterRateMax.value) : null;
      listingFilters.rateMax = maxValue;
    }
    
    if (sectionFilterRateCurrency) {
      listingFilters.currency = sectionFilterRateCurrency.value || null;
    }
    
    console.log('Applied filters:', listingFilters);
    render();
    closeSectionFilter();
  }

  function resetFilters() {
    Object.keys(listingFilters).forEach(key => {
      listingFilters[key] = null;
    });
    document.querySelectorAll('.chip[data-group]').forEach(chip => chip.classList.remove('selected'));
    if (sectionFilterRateMin) sectionFilterRateMin.value = '';
    if (sectionFilterRateMax) sectionFilterRateMax.value = '';
    if (sectionFilterRateCurrency) sectionFilterRateCurrency.value = '';
    render();
    closeSectionFilter();
  }

  if (backBtn) {
    backBtn.addEventListener('click', async function () {
      window.location.href = await resolveRoleHomePage();
    });
  }

  if (sectionSearchBtn) {
    sectionSearchBtn.addEventListener('click', function () {
      render();
    });
  }
  if (sectionSearchInput) {
    sectionSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') render();
    });
  }
  if (sectionFilterBtn) {
    sectionFilterBtn.addEventListener('click', openSectionFilter);
  }
  if (sectionFilterApplyBtn) {
    sectionFilterApplyBtn.addEventListener('click', applyFilters);
  }
  if (sectionFilterResetBtn) {
    sectionFilterResetBtn.addEventListener('click', resetFilters);
  }
  if (sectionFilterModal) {
    sectionFilterModal.addEventListener('click', function (e) {
      if (e.target === sectionFilterModal) closeSectionFilter();
    });
  }
  
  // Pagination event listeners
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function () {
      goToPage(currentPage - 1);
    });
  }
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function () {
      goToPage(currentPage + 1);
    });
  }
  
  // Header pagination event listeners
  if (headerPrevPageBtn) {
    headerPrevPageBtn.addEventListener('click', function () {
      goToPage(currentPage - 1);
    });
  }
  if (headerNextPageBtn) {
    headerNextPageBtn.addEventListener('click', function () {
      goToPage(currentPage + 1);
    });
  }

  if (sectionGridEl) {
    sectionGridEl.addEventListener('click', e => {
      const card = e.target.closest('.job-card[data-job-detail]');
      if (!card) return;
      const payload = card.getAttribute('data-job-detail');
      if (!payload) return;
      try {
        const job = JSON.parse(decodeURIComponent(payload));
        openJobInMainDashboard(job);
      } catch (err) {
        /* ignore */
      }
    });
    sectionGridEl.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.job-card[data-job-detail]');
      if (!card || e.target !== card) return;
      e.preventDefault();
      const payload = card.getAttribute('data-job-detail');
      if (!payload) return;
      try {
        const job = JSON.parse(decodeURIComponent(payload));
        openJobInMainDashboard(job);
      } catch (err) {
        /* ignore */
      }
    });
  }

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
    headerMenuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleHeaderMenu();
    });
    document.addEventListener('click', closeHeaderMenu);
    headerMenuDropdown.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('a')) closeHeaderMenu();
    });
  }

  // Add filter chip event listeners
  document.addEventListener('click', function(e) {
    const chip = e.target.closest('.chip[data-group]');
    if (chip) {
      console.log('Filter chip clicked:', chip.dataset.group, chip.dataset.value);
      toggleChip(chip);
    }
  });

  render();
})();
