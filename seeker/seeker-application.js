/**
 * Shared job snapshot + apply flow for My Applications (used by dashb.js and bookmark.js).
 */
(function () {
  const defaultJobDescription =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

  const CURRENCY_SYMBOLS = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£'
  };

  function currencySymbolFor(code) {
    const u = String(code || '').trim().toUpperCase();
    if (!u) return '';
    return CURRENCY_SYMBOLS[u] !== undefined ? CURRENCY_SYMBOLS[u] : `${u} `;
  }

  function formatSalaryDisplay(job) {
    const raw = job.rate || '';
    if (!raw) return `${currencySymbolFor('PHP')}### / Hour`;
    const m = String(raw)
      .trim()
      .match(/^([A-Za-z]{3})\s+([\d.,]+)\s*\/\s*(.+)$/i);
    if (!m) return raw;
    const unit = m[3].trim();
    return `${currencySymbolFor(m[1])}${m[2]} / ${unit}`;
  }

  function formatSettingsDisplay(value) {
    if (!value) return 'On-site';
    const v = String(value);
    if (v === 'On-Site') return 'On-site';
    return v;
  }

  function normalizeJobDetailPayload(job) {
    const moreSource =
      job._moreSource === 'foryou'
        ? 'foryou'
        : job._moreSource === 'posted'
          ? 'posted'
          : 'listing';

    if (moreSource === 'posted') {
      const j = job;
      return {
        title: j.title,
        posterName: 'You',
        postedAgo: j.postedAgo || 'Recently',
        schedule: j.schedule || '—',
        typeLabel: j.category || 'Job',
        settingsLabel: formatSettingsDisplay(j.type),
        location: j.location || '—',
        salary: j.rate ? formatSalaryDisplay(j) : `${currencySymbolFor('PHP')}— / Hour`,
        skills: Array.isArray(j.skills) && j.skills.length ? j.skills : ['—'],
        description: j.description || defaultJobDescription,
        moreSource: 'posted',
        isOwnerView: true
      };
    }

    if (moreSource === 'foryou') {
      const remote = job.location === 'Remote';
      const skills =
        job.skillTags && job.skillTags.length
          ? job.skillTags.slice(0, 6)
          : ['Communication Skills', 'Problem-Solving'];
      const rateHint = 400 + (String(job.title || '').length % 8) * 25;
      return {
        title: job.title,
        posterName: job.company,
        postedAgo: job.postedAgo || '3 Days Ago',
        schedule: job.schedule,
        typeLabel: job.category || 'Job',
        settingsLabel: formatSettingsDisplay(job.type || (remote ? 'Remote' : 'On-Site')),
        location:
          (job.location && String(job.location).trim()) ||
          job.address ||
          (remote ? 'Remote' : 'BLDG, Street, Barangay, City, Province, Country'),
        salary: job.rate ? formatSalaryDisplay(job) : `${currencySymbolFor('PHP')}${rateHint} / Hour`,
        skills,
        description: job.description || defaultJobDescription,
        moreSource
      };
    }
    const loc =
      job.location && String(job.location).trim()
        ? String(job.location).trim()
        : 'BLDG, Street, Barangay, City, Province, Country';
    return {
      title: job.title,
      posterName: job.company || '—',
      postedAgo: job.postedAgo || '3 Days Ago',
      schedule: job.schedule || '—',
      typeLabel: job.category || 'Job',
      settingsLabel: formatSettingsDisplay(job.type),
      location: loc,
      salary: formatSalaryDisplay(job),
      skills: Array.isArray(job.skills) && job.skills.length ? job.skills : ['—'],
      description: job.description && String(job.description).trim() ? job.description : defaultJobDescription,
      moreSource
    };
  }

  function getPosterContactSnapshotFromStorage() {
    let phone = '';
    let email = '';
    let profileLinks = [];
    try {
      const p = JSON.parse(localStorage.getItem('profileData') || '{}');
      if (p && typeof p === 'object') {
        phone = String(p.phone || '').trim();
        email = String(p.email || '').trim();
        profileLinks = Array.isArray(p.profileLinks) ? p.profileLinks.filter(Boolean).map(String) : [];
      }
    } catch (e) {}
    if (!email) {
      try {
        const acc = JSON.parse(localStorage.getItem('accountData') || '{}');
        if (acc && acc.email) email = String(acc.email).trim();
      } catch (e2) {}
    }
    return { posterPhone: phone, posterEmail: email, posterProfileLinks: profileLinks };
  }

  function buildApplicationSnapshotForStorage(job) {
    if (!job || typeof job !== 'object') return null;
    const d = normalizeJobDetailPayload(job);
    const title = String(job.title || '').trim();
    if (!title && job.id == null) return null;
    const jobId = String(job.id != null ? job.id : `${title}|${String(job.company || '').trim()}`);
    const company = String(job.company || '—').trim();
    let posterName = d.posterName || company || '—';
    if (job._moreSource === 'posted') {
      posterName = company && company !== '—' ? company : d.posterName || 'You';
    }
    const skills =
      Array.isArray(d.skills) && d.skills.length
        ? d.skills
        : ['Communication Skills', 'Problem-Solving'];
    const description =
      d.description && String(d.description).trim()
        ? String(d.description).trim()
        : defaultJobDescription;

    let posterPhone = '';
    let posterEmail = '';
    let posterProfileLinks = [];
    if (job._moreSource === 'posted') {
      const c = getPosterContactSnapshotFromStorage();
      posterPhone = c.posterPhone;
      posterEmail = c.posterEmail;
      posterProfileLinks = c.posterProfileLinks;
    }

    return {
      jobId,
      title: d.title || title || 'Job',
      company,
      posterName,
      location: d.location || '—',
      postedAgo: d.postedAgo || '—',
      schedule: d.schedule || '—',
      typeLabel: d.typeLabel || '—',
      settingsLabel: d.settingsLabel || '—',
      salary: d.salary || '—',
      skills,
      description,
      posterPhone,
      posterEmail,
      posterProfileLinks,
      _appSnapVersion: 3
    };
  }

  function recordSeekerApplication(job) {
    if (!job || typeof job !== 'object') return Promise.resolve(false);
    const jobId = job.id != null ? String(job.id) : '';
    if (!jobId) return Promise.resolve(false);
    if (!window.RJGDb || typeof window.RJGDb.applyToJob !== 'function') return Promise.resolve(false);
    return window.RJGDb.applyToJob(jobId);
  }

  /**
   * True when profile matches the full Job Seeking setup (not recruitment-only).
   * Mirrors setup.js validateSetupForm rules for the seeking form.
   */
  function isSeekerProfileCompleteForApplication() {
    try {
      const raw = localStorage.getItem('profileData');
      if (!raw) return false;
      const p = JSON.parse(raw);
      if (!p || typeof p !== 'object') return false;
      const s = function (v) {
        return String(v == null ? '' : v).trim();
      };
      if (!s(p.name)) return false;
      if (!s(p.phone)) return false;
      if (!s(p.birthDate)) return false;
      if (!s(p.educationStatus)) return false;
      if (!s(p.description)) return false;
      if (!s(p.sex)) return false;

      const addr = p.address && typeof p.address === 'object' ? p.address : {};
      if (
        !s(addr.street) ||
        !s(addr.barangay) ||
        !s(addr.city) ||
        !s(addr.province) ||
        !s(addr.country) ||
        !s(addr.zip)
      ) {
        return false;
      }

      const sections = [
        'workExperiences',
        'educationBackgrounds',
        'skills',
        'languages',
        'profileLinks',
        'personality'
      ];
      for (let i = 0; i < sections.length; i++) {
        const arr = p[sections[i]];
        if (!Array.isArray(arr) || arr.length === 0) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function openCompleteProfileModalForApply() {
    if (typeof window.showAppConfirmModal !== 'function') return;
    window.showAppConfirmModal({
      title: 'Complete your profile',
      message:
        'You have not filled in all information needed to apply for jobs (for example work experience, education, skills, or description). Go to your Profile page to finish, or choose Not now to stay here — you will not be able to submit an application until your profile is complete.',
      confirmLabel: 'Go to Profile',
      cancelLabel: 'Not now',
      danger: false,
      onConfirm: function () {
        window.location.href = '../seeker/profile.html';
      }
    });
  }

  window.SeekerApp = {
    defaultJobDescription,
    currencySymbolFor,
    formatSalaryDisplay,
    formatSettingsDisplay,
    normalizeJobDetailPayload,
    getPosterContactSnapshotFromStorage,
    buildApplicationSnapshotForStorage,
    recordSeekerApplication,
    isSeekerProfileCompleteForApplication,
    openCompleteProfileModalForApply
  };
})();
