(function () {
  const navButtons = Array.from(document.querySelectorAll('[data-admin-panel]'));
  const panels = Array.from(document.querySelectorAll('[data-admin-panel-content]'));
  const searchInput = document.getElementById('adminDashboardSearchInput');
  const searchBtn = document.getElementById('adminDashboardSearchBtn');
  const filterBtn = document.getElementById('adminDashboardFilterBtn');
  const listEl = document.getElementById('adminDashboardJobList');
  const emptyEl = document.getElementById('adminDashboardEmpty');
  const chips = Array.from(document.querySelectorAll('[data-admin-job-tab]'));
  const filterModal = document.getElementById('adminDashboardFilterModal');
  const filterPosterInput = document.getElementById('adminDashboardFilterPostedBy');
  const filterMaxDaysInput = document.getElementById('adminDashboardFilterMaxDays');
  const filterApplyBtn = document.getElementById('adminDashboardFilterApplyBtn');
  const filterResetBtn = document.getElementById('adminDashboardFilterResetBtn');
  const reviewModal = document.getElementById('adminDashboardReviewModal');
  const reviewTitle = document.getElementById('adminDashboardReviewJobTitle');
  const reviewBy = document.getElementById('adminDashboardReviewPostedBy');
  const reviewAgo = document.getElementById('adminDashboardReviewPostedAgo');
  const reviewCategory = document.getElementById('adminDashboardReviewCategory');
  const reviewSchedule = document.getElementById('adminDashboardReviewSchedule');
  const reviewType = document.getElementById('adminDashboardReviewType');
  const reviewLocation = document.getElementById('adminDashboardReviewLocation');
  const reviewRate = document.getElementById('adminDashboardReviewRate');
  const reviewUrgent = document.getElementById('adminDashboardReviewUrgent');
  const reviewSkills = document.getElementById('adminDashboardReviewSkills');
  const reviewDesc = document.getElementById('adminDashboardReviewDescription');
  const reviewEditBtn = document.getElementById('adminDashboardReviewEditBtn');
  const reviewImageBtn = document.getElementById('adminDashboardReviewImageBtn');
  const reviewCloseBtn = document.getElementById('adminDashboardReviewCloseBtn');
  const userSearchInput = document.getElementById('adminUserSearchInput');
  const userSearchBtn = document.getElementById('adminUserSearchBtn');
  const userRefreshBtn = document.getElementById('adminUserRefreshBtn');
const jobRefreshBtn = document.getElementById('adminDashboardRefreshBtn');
const reportRefreshBtn = document.getElementById('adminReportRefreshBtn');
  const userListEl = document.getElementById('adminUserList');
  const userEmptyEl = document.getElementById('adminUserEmpty');
  const userTabChips = Array.from(document.querySelectorAll('[data-admin-user-tab]'));
  const userReviewModal = document.getElementById('adminUserReviewModal');
  const userReviewId = document.getElementById('adminUserReviewId');
  const userReviewName = document.getElementById('adminUserReviewName');
  const userReviewEmail = document.getElementById('adminUserReviewEmail');
  const userReviewRole = document.getElementById('adminUserReviewRole');
  const userReviewStatus = document.getElementById('adminUserReviewStatus');
  const userReviewCreated = document.getElementById('adminUserReviewCreated');
  const userReviewUpdated = document.getElementById('adminUserReviewUpdated');
  const userReviewApplied = document.getElementById('adminUserReviewApplied');
  const userReviewPosted = document.getElementById('adminUserReviewPosted');
  const userReviewPhone = document.getElementById('adminUserReviewPhone');
  const userReviewAddress = document.getElementById('adminUserReviewAddress');
  const userReviewSex = document.getElementById('adminUserReviewSex');
  const userReviewBirthDate = document.getElementById('adminUserReviewBirthDate');
  const userReviewEducationStatus = document.getElementById('adminUserReviewEducationStatus');
  const userReviewLinks = document.getElementById('adminUserReviewLinks');
  const userReviewLanguages = document.getElementById('adminUserReviewLanguages');
  const userReviewPersonality = document.getElementById('adminUserReviewPersonality');
  const userReviewSkills = document.getElementById('adminUserReviewSkills');
  const userReviewWork = document.getElementById('adminUserReviewWork');
  const userReviewEducation = document.getElementById('adminUserReviewEducation');
  const userReviewDescription = document.getElementById('adminUserReviewDescription');
  const userReviewImage = document.getElementById('adminUserReviewImage');
  const userReviewImagePlaceholder = document.getElementById('adminUserReviewImagePlaceholder');
  const userViewImageBtn = document.getElementById('adminUserViewImageBtn');
  const userReviewCloseBtn = document.getElementById('adminUserReviewCloseBtn');
  const userEditBtn = document.getElementById('adminUserEditBtn');
  const userChangeEmailBtn = document.getElementById('adminUserChangeEmailBtn');
  const userChangePasswordBtn = document.getElementById('adminUserChangePasswordBtn');

  // Admin User Change Modal Elements
  const adminUserChangeModal = document.getElementById('adminUserChangeModal');
  const adminUserChangeCloseBtn = document.getElementById('adminUserChangeCloseBtn');
  const adminUserChangeForm = document.getElementById('adminUserChangeForm');
  const adminUserChangeCancelBtn = document.getElementById('adminUserChangeCancelBtn');
  const adminUserChangeSubmitBtn = document.getElementById('adminUserChangeSubmitBtn');
  const adminUserChangeEmailInput = document.getElementById('adminUserChangeEmailInput');
  const adminUserChangePasswordInput = document.getElementById('adminUserChangePasswordInput');
  const adminUserChangeConfirmPasswordInput = document.getElementById('adminUserChangeConfirmPasswordInput');
  const adminUserChangeEmailRow = document.getElementById('adminUserChangeEmailRow');
  const adminUserChangePasswordRow = document.getElementById('adminUserChangePasswordRow');
  const adminUserChangeConfirmPasswordRow = document.getElementById('adminUserChangeConfirmPasswordRow');
  const adminUserChangeTitle = document.getElementById('adminUserChangeTitle');
  const adminUserChangeText = document.getElementById('adminUserChangeText');
  const adminPasswordStrength = document.getElementById('adminPasswordStrength');
  const adminPasswordStrengthBar = document.getElementById('adminPasswordStrengthBar');

  // Admin User OTP Modal Elements
  const adminUserOtpModal = document.getElementById('adminUserOtpModal');
  const adminUserOtpForm = document.getElementById('adminUserOtpForm');
  const adminUserOtpInput = document.getElementById('adminUserOtpInput');
  const adminUserOtpSubmitBtn = document.getElementById('adminUserOtpSubmitBtn');
  const adminUserOtpCancelBtn = document.getElementById('adminUserOtpCancelBtn');
  const adminUserResendOtpBtn = document.getElementById('adminUserResendOtpBtn');
  const adminUserOtpTitle = document.getElementById('adminUserOtpTitle');
  const adminUserOtpText = document.getElementById('adminUserOtpText');
  const reportSearchInput = document.getElementById('adminReportSearchInput');
  const reportSearchBtn = document.getElementById('adminReportSearchBtn');
  const reportListEl = document.getElementById('adminReportList');
  const reportEmptyEl = document.getElementById('adminReportEmpty');
  const reportListHead = document.getElementById('adminReportListHead');
  const reportHeadCol1 = document.getElementById('adminReportHeadCol1');
  const reportHeadCol2 = document.getElementById('adminReportHeadCol2');
  const reportHeadCol3 = document.getElementById('adminReportHeadCol3');
  const reportHeadCol4 = document.getElementById('adminReportHeadCol4');
  const reportKindChips = Array.from(document.querySelectorAll('[data-admin-report-kind]'));
  const reportTypeSelect = document.getElementById('adminReportTypeSelect');
  const reportReviewModal = document.getElementById('adminReportReviewModal');
  const reportReviewTitle = document.getElementById('adminReportReviewTitle');
  const reportReviewReportedBy = document.getElementById('adminReportReviewReportedBy');
  const reportReviewInfoLabel = document.getElementById('adminReportReviewInfoLabel');
  const reportReviewBody = document.getElementById('adminReportReviewBody');
  const reportReviewActions = document.getElementById('adminReportReviewActions');
  const reportReviewImageBtn = document.getElementById('adminReportReviewImageBtn');
  const reportReviewCloseBtn = document.getElementById('adminReportReviewCloseBtn');
  const reportInvalidateBtn = document.getElementById('adminReportInvalidateBtn');
  const reportRemoveBanBtn = document.getElementById('adminReportRemoveBanBtn');
  const reportRemoveJobBtn = document.getElementById('adminReportRemoveJobBtn');
  const jobImageModal = document.getElementById('adminJobImageModal');
  const jobImagePreview = document.getElementById('adminJobImagePreview');
  const jobImageEmpty = document.getElementById('adminJobImageEmpty');
  const jobImageCloseBtn = document.getElementById('adminJobImageCloseBtn');
  const headerMenuBtn = document.getElementById('headerMenuBtn');
  const headerMenuDropdown = document.getElementById('headerMenuDropdown');
  const headerMenu = document.querySelector('.header-menu');

  let activeTab = 'all';
  let activeUserTab = 'all';
  let activeReportKind = 'job';
  let activeReportReviewId = '';
  let currentReviewedJob = null;
  let currentReviewedReportJob = null;
  let currentReviewedReportResumeImage = null;
  const filterState = { poster: '', maxDays: null };
  const REMOVED_USERS_STORAGE_KEY = 'adminRemovedUsers';

  function formatUserName(user) {
    if (!user) return 'Unknown User';
    
    // Check if user has profile with new name structure
    if (user.profile && typeof user.profile === 'object') {
      const profile = user.profile;
      const lastName = profile.last_name || profile.lastName || "";
      const firstName = profile.first_name || profile.firstName || "";
      const middleName = profile.middle_name || profile.middleName || "";
      const suffix = profile.suffix || "";
      
      let formattedName = "";
      if (lastName) {
        formattedName = `${lastName} ${firstName}`;
        if (middleName) {
          formattedName += ` ${middleName}`;
        }
        if (suffix) {
          formattedName += ` ${suffix}`;
        }
      } else {
        formattedName = firstName;
        if (middleName) {
          formattedName += ` ${middleName}`;
        }
        if (suffix) {
          formattedName += ` ${suffix}`;
        }
      }
      
      if (formattedName) return toTitleCase(formattedName);
    }
    
    // Fallback to old name field or email
    return toTitleCase(user.name || user.email?.split('@')[0] || 'Unknown User');
  }

  function postedAgoToDays(ago) {
    const text = String(ago || '').trim().toLowerCase();
    console.log('postedAgoToDays called with:', ago, '-> text:', text);
    
    if (!text || text === 'just now' || text === 'today' || text === 'recently') {
      console.log('Returning 0 for just now/today/recently');
      return 0;
    }
    
    // Handle new format: "1d ago", "2d ago", "1h ago", "1m ago"
    const newFormatMatch = text.match(/^(\d+)([dmhdw])\s*ago$/);
    if (newFormatMatch) {
      const n = Number(newFormatMatch[1]);
      const unit = newFormatMatch[2];
      console.log('New format match:', n, unit);
      switch (unit) {
        case 'm': console.log('Returning 0 for minutes'); return 0; // minutes - less than 1 day
        case 'h': console.log('Returning 0 for hours'); return 0; // hours - less than 1 day  
        case 'd': console.log('Returning', n, 'for days'); return n; // days
        case 'w': console.log('Returning', n * 7, 'for weeks'); return n * 7; // weeks
        default: console.log('Returning infinity for unknown unit'); return Number.POSITIVE_INFINITY;
      }
    }
    
    // Handle old format: "1 day ago", "2 weeks ago"
    const oldFormatMatch = text.match(/^(\d+)\s*(day|days|week|weeks)\s*ago$/);
    if (!oldFormatMatch) {
      console.log('No format match, returning infinity');
      return Number.POSITIVE_INFINITY;
    }
    const n = Number(oldFormatMatch[1]);
    const result = oldFormatMatch[2].startsWith('week') ? n * 7 : n;
    console.log('Old format match, returning:', result);
    return result;
  }

  // Jobs are loaded exclusively from the database

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

  function toTitleCase(raw) {
    const value = String(raw || '').trim();
    if (!value) return 'User';
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  function formatIsoDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString();
  }

  function parseDisplayDateToTime(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '—') return Number.NEGATIVE_INFINITY;
    const text = raw.toLowerCase();
    if (text === 'just now' || text === 'today' || text === 'recently') return Date.now();
    const ago = text.match(/^(\d+)\s*(day|days|week|weeks)\s*ago$/);
    if (ago) {
      const n = Number(ago[1]);
      const days = ago[2].startsWith('week') ? n * 7 : n;
      return Date.now() - days * 86400000;
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
    return Number.NEGATIVE_INFINITY;
  }

  function removeUsersSet() {
    const removed = getStoredJSON(REMOVED_USERS_STORAGE_KEY, []);
    return new Set(Array.isArray(removed) ? removed.map(String) : []);
  }

  function persistRemovedUsers(set) {
    localStorage.setItem(REMOVED_USERS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  }


  function isTruthyValue(v) {
    return String(v || '').trim().length > 0;
  }

  function isFilledArray(list) {
    return Array.isArray(list) && list.some(item => {
      if (item == null) return false;
      if (typeof item === 'string') return isTruthyValue(item);
      if (typeof item === 'object') return Object.values(item).some(isTruthyValue);
      return isTruthyValue(item);
    });
  }

  function isProfileComplete(profile) {
    if (!profile || typeof profile !== 'object') return false;
    const address = profile.address || {};
    const hasCore =
      isTruthyValue(profile.name) &&
      isTruthyValue(profile.email) &&
      isTruthyValue(profile.phone) &&
      isTruthyValue(profile.description) &&
      isTruthyValue(profile.sex) &&
      isTruthyValue(profile.birthDate) &&
      isTruthyValue(profile.educationStatus);
    const hasAddress =
      isTruthyValue(address.unitNo) &&
      isTruthyValue(address.street) &&
      isTruthyValue(address.barangay) &&
      isTruthyValue(address.city) &&
      isTruthyValue(address.province) &&
      isTruthyValue(address.country) &&
      isTruthyValue(address.zip);
    const hasSections =
      isFilledArray(profile.workExperiences) &&
      isFilledArray(profile.educationBackgrounds) &&
      isFilledArray(profile.skills) &&
      isFilledArray(profile.languages) &&
      isFilledArray(profile.profileLinks) &&
      isFilledArray(profile.personality);
    return hasCore && hasAddress && hasSections;
  }

  function formatAddress(address) {
    if (!address || typeof address !== 'object') return '—';
    const parts = [
      address.unitNo,
      address.street,
      address.barangay,
      address.city,
      address.province,
      address.country,
      address.zip
    ].map(v => String(v || '').trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }

  function formatList(list, mapper) {
    if (!Array.isArray(list) || !list.length) return '—';
    const entries = list
      .map(item => (mapper ? mapper(item) : String(item || '').trim()))
      .map(v => String(v || '').trim())
      .filter(Boolean);
    return entries.length ? entries.join('; ') : '—';
  }

  function jobTitleFromReference(reference) {
    const text = String(reference || '').trim();
    if (!text) return 'Reported Job';
    if (!text.includes('|')) return text;
    return text.split('|')[0].trim() || 'Reported Job';
  }

  async function buildUsersDataset() {
    // Try to load from database first
    if (window.RJGDb && typeof window.RJGDb.listAllUsers === 'function') {
      try {
        const dbUsers = await window.RJGDb.listAllUsers();
        if (Array.isArray(dbUsers) && dbUsers.length > 0) {
          return dbUsers.map(u => ({
            id: u.id,
            name: formatUserName(u),
            email: u.email,
            role: u.role === 'admin' ? 'Admin' : (u.role === 'recruiter' || u.role === 'employer') ? 'Recruiter' : 'Seeker',
            created: formatIsoDate(u.createdAt),
            jobsApplied: u.jobsApplied || 0,
            jobsPosted: u.jobsPosted || 0,
            profile: u.profile || null,
            accountStatus: u.account_status || 'active'
          }));
        }
      } catch (e) {
        console.warn('Failed to load users from database:', e);
      }
    }

    // Fallback to localStorage (legacy)
    const users = [];
    const account = getStoredJSON('accountData', {});
    const profile = getStoredJSON('profileData', {});
    const profileIsComplete = isProfileComplete(profile);
    if (account && (account.email || profile.name)) {
      users.push({
        id: `acct:${String(account.email || 'user')}`,
        name: toTitleCase(profile.name || String(account.email || 'User').split('@')[0]),
        email: String(account.email || ''),
        role: profileIsComplete ? 'Seeker' : 'Recruiter',
        created: formatIsoDate(account.accountCreatedAt || account.lastChangedAt),
        jobsApplied: Array.isArray(getStoredJSON('myApplications', [])) ? getStoredJSON('myApplications', []).length : 0,
        jobsPosted: 0,
        profile
      });
    }

    const admin = getStoredJSON('adminAccountData', {});
    if (admin && admin.email) {
      users.push({
        id: `admin:${String(admin.email)}`,
        name: 'Admin',
        email: String(admin.email),
        role: 'Recruiter',
        created: formatIsoDate(admin.accountCreatedAt || admin.lastChangedAt || admin.lastLoginAt),
        jobsApplied: 0,
        jobsPosted: jobs.length,
        profile: null
      });
    }

    if (!users.length) {
      users.push(
        { id: 'sample-seeker-1', name: 'Account Name', email: 'sample1@email.com', role: 'Seeker', created: '01/12/2026', jobsApplied: 3, jobsPosted: 1, profile: null },
        { id: 'sample-seeker-2', name: 'Account Name', email: 'sample2@email.com', role: 'Recruiter', created: '01/13/2026', jobsApplied: 2, jobsPosted: 0, profile: null },
        { id: 'sample-rec-1', name: 'Recruiter Name', email: 'recruiter@email.com', role: 'Recruiter', created: '01/10/2026', jobsApplied: 0, jobsPosted: 4, profile: null }
      );
    }
    const removed = removeUsersSet();
    return users.filter(u => !removed.has(String(u.id)));
  }

  function filterUsers(users) {
    const q = String(userSearchInput?.value || '').trim().toLowerCase();
    return users.filter(user => {
      // Exclude admin users from the list
      if (user.role === 'Admin' || user.role === 'admin') {
        return false;
      }
      
      // Check if user is archived
      const isArchived = user.accountStatus === 'archived' || user.account_status === 'archived';
      
      const rolePass =
        activeUserTab === 'seekers'
          ? user.role === 'Seeker' && !isArchived
          : activeUserTab === 'recruiters'
            ? user.role === 'Recruiter' && !isArchived
            : activeUserTab === 'archived'
              ? isArchived // Show only archived users
              : !isArchived; // For 'all' tab, exclude archived users
      const searchPass =
        !q ||
        String(user.name || '').toLowerCase().includes(q) ||
        String(user.email || '').toLowerCase().includes(q);
      return rolePass && searchPass;
    }).sort((a, b) => parseDisplayDateToTime(b.created) - parseDisplayDateToTime(a.created));
  }

  async function renderUserList() {
    if (!userListEl) return;
    
    // Show loading state
    userListEl.innerHTML = '<div class="admin-dashboard-loading" style="padding: 20px; text-align: center;">Loading users...</div>';
    
    try {
      const users = filterUsers(await buildUsersDataset());
      userListEl.innerHTML = users
        .map(
          user => {
            const isArchived = user.accountStatus === 'archived';
            console.log(`Rendering user ${user.id}: ${user.name}, status: ${user.accountStatus}, isArchived: ${isArchived}`);
            return `<article class="admin-dashboard-job-row admin-dashboard-user-row${isArchived ? ' user-archived' : ''}" data-user-id="${user.id}">
              <div class="admin-dashboard-job-cell admin-dashboard-job-cell--title">${user.name}${isArchived ? ' (Archived)' : ''}</div>
              <div class="admin-dashboard-job-cell">${user.created}</div>
              <div class="admin-dashboard-row-actions">
                <button type="button" class="admin-dashboard-review-btn" data-user-action="review">Review Info</button>
                <button type="button" class="admin-dashboard-delete-btn" data-user-action="${isArchived ? 'restore' : 'delete'}" aria-label="${isArchived ? 'Restore user' : 'Delete user'}">
                  <img src="${isArchived ? '../assets/images/Restore.png' : '../assets/images/Delete.png'}" alt="" class="admin-dashboard-delete-icon" aria-hidden="true">
                </button>
              </div>
            </article>`;
          }
        )
        .join('');
      if (userEmptyEl) userEmptyEl.hidden = users.length > 0;
    } catch (e) {
      userListEl.innerHTML = '<div class="admin-dashboard-error" style="padding: 20px; text-align: center; color: #dc3545;">Failed to load users.</div>';
    }
  }

  async function buildReportDataset() {
    if (!window.RJGDb || typeof window.RJGDb.loadAllReports !== 'function') return [];
    try {
      console.log('buildReportDataset: Loading reports from database...');
      const dbReports = await window.RJGDb.loadAllReports();
      console.log('buildReportDataset: Loaded', dbReports.length, 'reports from database');
      console.log('buildReportDataset: Report IDs:', dbReports.map(r => r.id));
      if (!Array.isArray(dbReports) || !dbReports.length) return [];
      return dbReports.map(r => ({
        id: r.id,
        name: r.targetType === 'resume'
          ? (r.targetUserName || 'Unknown User')
          : (r.reporterName || 'Unknown'),
        email: r.targetType === 'resume' && r.resumeProfile && r.resumeProfile.email
          ? r.resumeProfile.email
          : '',
        created: formatIsoDate(r.createdAt),
        jobsApplied: 0,
        jobsPosted: 0,
        kind: r.targetType === 'resume' ? 'resume' : 'job',
        type: r.reason || (r.targetType === 'resume' ? 'Reported Resume' : 'Reported Job'),
        reference: r.targetJobId || '',
        title: r.targetJobTitle || 'Reported Job',
        description: r.reason || 'No reason provided.',
        status: r.status,
        targetUserId: r.targetUserId,
        targetUserName: r.targetUserName,
        reportedBy: r.reporterName || 'Unknown',
        reportedEmail: r.reporterName || '',
        snapshot: r.resumeProfile ? { resumeProfile: r.resumeProfile } : null
      }));
    } catch (e) {
      console.warn('Failed to load reports from database:', e);
      return [];
    }
  }

  function jobIdentityCandidates(job) {
    if (!job || typeof job !== 'object') return [];
    const title = String(job.title || '').trim();
    const company = String(job.company || '').trim();
    const postedBy = String(job.postedBy || '').trim();
    const ids = new Set();
    if (job.id != null && String(job.id).trim() !== '') ids.add(String(job.id));
    if (title) {
      ids.add(`${title}|${company}`);
      ids.add(`${title}|${postedBy}`);
      ids.add(`${title}|`);
    }
    return Array.from(ids);
  }

  function findJobFromReportReference(reference) {
    const key = String(reference || '').trim();
    if (!key) return null;
    const fromId = jobs.find(job => String(job.id || '') === key);
    if (fromId) return fromId;
    return jobs.find(job => jobIdentityCandidates(job).includes(key)) || null;
  }

  function humanizeFieldLabel(key) {
    const raw = String(key || '');
    const aliases = {
      type: 'Settings',
      postedAgo: 'Posted',
      postedBy: 'Posted By',
      rateUnit: 'Rate Unit'
    };
    if (aliases[raw]) return aliases[raw];
    return raw
      .replace(/^_+/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function serializeFieldValue(value) {
    if (value == null || value === '') return '—';
    if (Array.isArray(value)) {
      if (!value.length) return '—';
      return value
        .map(item => {
          if (item == null) return '';
          if (typeof item === 'object') return JSON.stringify(item);
          return String(item);
        })
        .filter(Boolean)
        .join(', ');
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Object]';
      }
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  function fullLocationFromJob(job) {
    if (!job || typeof job !== 'object') return 'No location provided';
    const rawAddress =
      (job.address && typeof job.address === 'object' ? job.address : null) ||
      (job.locationDetails && typeof job.locationDetails === 'object' ? job.locationDetails : null);
    if (rawAddress) {
      const fromObject = formatAddress(rawAddress);
      if (fromObject && fromObject !== '—') return fromObject;
    }
    const parts = [
      job.unitNo || job.unit || job.houseNo,
      job.street,
      job.barangay || job.village || job.district,
      job.city || job.municipality,
      job.province || job.state,
      job.country,
      job.zip || job.postalCode
    ].map(v => String(v || '').trim()).filter(Boolean);
    if (parts.length) return parts.join(', ');
    const fromString =
      String(job.fullLocation || job.jobLocation || job.location || job.address || '').trim();
    return fromString || 'No location provided';
  }

  function getJobFieldValue(job, key) {
    if (!job || typeof job !== 'object') return undefined;
    if (key === 'postedBy') {
      return job.postedBy || job.posterName || job.recruiterName || job.company || job.companyName || 'Not specified';
    }
    if (key === 'postedAgo') {
      return job.postedAgo || job.postedAtLabel || job.createdAtLabel || job.reportedAt || job.createdAt || job.postedAt || 'Not specified';
    }
    if (key === 'location') {
      return fullLocationFromJob(job);
    }
    if (key === 'type') return job.type || job.settings || job.workType || 'Not specified';
    if (key === 'schedule') return job.schedule || job.shift || 'Not specified';
    if (key === 'rate') return job.rate || job.salary || 'Not specified';
    if (key === 'skills') {
      if (Array.isArray(job.skills) && job.skills.length) return job.skills;
      if (Array.isArray(job.skillTags) && job.skillTags.length) return job.skillTags;
      if (Array.isArray(job.tags) && job.tags.length) return job.tags;
      return 'No skills listed';
    }
    if (key === 'description') return job.description || job.jobDescription || job.desc || 'No description provided';
    return job[key];
  }

  function buildFullJobInfoText(job) {
    if (!job || typeof job !== 'object') return 'No job info found.';
    const preferredOrder = [
      'title',
      'postedBy',
      'postedAgo',
      'category',
      'schedule',
      'type',
      'location',
      'rate',
      'rateUnit',
      'urgent',
      'skills',
      'description'
    ];
    const hiddenKeys = new Set(['applicants', 'reportedApplicantKeys', 'company', 'image', 'postedBy', 'isOwnerPost', 'imageUrl']);
    const allKeys = Object.keys(job).filter(key => !hiddenKeys.has(key) && !String(key).startsWith('_'));
    const orderedKeys = Array.from(new Set([...preferredOrder, ...allKeys]));
    return orderedKeys
      .map(key => `${humanizeFieldLabel(key)}: ${serializeFieldValue(getJobFieldValue(job, key))}`)
      .join('\n');
  }

  function jobImageSource(job) {
    if (!job || typeof job !== 'object') return '';
    const candidates = [
      job.image,
      job.imageUrl,
      job.jobImage,
      job.jobImageUrl,
      job.thumbnail,
      job.photo,
      job.picture
    ];
    const src = candidates.find(value => typeof value === 'string' && value.trim());
    return src ? src.trim() : '';
  }

  function buildReportTypeOptions(reports) {
    if (!reportTypeSelect) return;
    const currentValue = String(reportTypeSelect.value || 'all').toLowerCase();
    const entries = Array.from(new Set(reports.map(report => String(report.type || '').trim()).filter(Boolean)));
    reportTypeSelect.innerHTML =
      `<option value="all">All</option>` +
      entries.map(type => `<option value="${type.toLowerCase()}">${type}</option>`).join('');
    reportTypeSelect.value = entries.some(type => type.toLowerCase() === currentValue) ? currentValue : 'all';
  }

  function filterReports(reports) {
    const q = String(reportSearchInput?.value || '').trim().toLowerCase();
    const selectedType = String(reportTypeSelect?.value || 'all').trim().toLowerCase();
    return reports.filter(report => {
      const byKind = report.kind === activeReportKind;
      const byType = selectedType === 'all' || String(report.type || '').toLowerCase() === selectedType;
      const bySearch =
        !q ||
        String(report.name || '').toLowerCase().includes(q) ||
        String(report.email || '').toLowerCase().includes(q) ||
        String(report.reference || '').toLowerCase().includes(q);
      return byKind && byType && bySearch;
    }).sort((a, b) => parseDisplayDateToTime(b.created) - parseDisplayDateToTime(a.created));
  }

  async function renderReportList() {
    if (!reportListEl) return;
    console.log('renderReportList: Starting to fetch reports...');
    const allReports = await buildReportDataset();
    console.log('renderReportList: Fetched', allReports.length, 'total reports');
    const currentKindReports = allReports.filter(report => report.kind === activeReportKind);
    console.log('renderReportList: Filtered to', currentKindReports.length, 'reports of kind', activeReportKind);
    buildReportTypeOptions(currentKindReports);
    const reports = filterReports(allReports);
    const isJobKind = activeReportKind === 'job';
    const isResumeKind = activeReportKind === 'resume';
    if (reportListHead) reportListHead.classList.toggle('is-job', isJobKind);
    if (reportListHead) reportListHead.classList.toggle('is-resume', isResumeKind);
    if (reportHeadCol1) reportHeadCol1.textContent = isJobKind ? 'Job Title' : 'Account Name';
    if (reportHeadCol2) reportHeadCol2.textContent = 'Created';
    if (reportHeadCol3) reportHeadCol3.hidden = isJobKind || isResumeKind;
    if (reportHeadCol4) reportHeadCol4.hidden = isJobKind || isResumeKind;
    reportListEl.innerHTML = reports
      .map(
        report => `<article class="admin-dashboard-job-row admin-dashboard-user-row admin-dashboard-report-row ${isJobKind ? 'is-job' : ''} ${isResumeKind ? 'is-resume' : ''}" data-report-id="${report.id}">
          <div class="admin-dashboard-job-cell admin-dashboard-job-cell--title">${isJobKind ? (report.title || jobTitleFromReference(report.reference)) : report.name}</div>
          <div class="admin-dashboard-job-cell">${report.created}</div>
          ${isJobKind || isResumeKind ? '' : `<div class="admin-dashboard-job-cell">${report.jobsApplied}</div>`}
          ${isJobKind || isResumeKind ? '' : `<div class="admin-dashboard-job-cell">${report.jobsPosted}</div>`}
          <div class="admin-dashboard-row-actions">
            <button type="button" class="admin-dashboard-review-btn" data-report-action="review">Review Info</button>
          </div>
        </article>`
      )
      .join('');
    if (reportEmptyEl) reportEmptyEl.hidden = reports.length > 0;
  }

  async function getReportById(id) {
    if (!id) return null;
    const reports = await buildReportDataset();
    return reports.find(report => String(report.id) === String(id)) || null;
  }

  let jobs = [];

  async function hydrateJobsFromDb() {
    if (!window.RJGDb || typeof window.RJGDb.loadAllJobs !== 'function') return;
    try {
      const dbJobs = await window.RJGDb.loadAllJobs();
      jobs = Array.isArray(dbJobs) ? dbJobs.slice() : [];
      renderList();
      await renderUserList();
      await renderReportList();
    } catch (e) {
      console.warn('Failed to load jobs from database:', e);
    }
  }

  function switchPanel(panel) {
    navButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.adminPanel === panel));
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.adminPanelContent === panel));
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.adminPanel));
  });

  function closeHeaderMenu() {
    if (!headerMenuBtn || !headerMenuDropdown) return;
    headerMenuDropdown.hidden = true;
    headerMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleHeaderMenu() {
    if (!headerMenuBtn || !headerMenuDropdown) return;
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

  function filterJobs() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    console.log('filterJobs called - activeTab:', activeTab, 'total jobs:', jobs.length);
    console.log('All jobs data:', jobs.map(j => ({ title: j.title, postedAgo: j.postedAgo, is_archived: j.is_archived, status: j.status, listing_open: j.listing_open })));
    
    return jobs.filter(job => {
      // Check if job is archived
      const isArchived = job.is_archived === true || job.status === 'archived' || job.listing_open === false;
      
      const byTab =
        activeTab === 'recent' ? (() => {
          const days = postedAgoToDays(job.postedAgo);
          const result = days <= 7 && !isArchived;
          console.log('Recent filter check - Job:', job.title, 'postedAgo:', job.postedAgo, 'days:', days, 'isArchived:', isArchived, 'result:', result);
          return result;
        })() :
        activeTab === 'urgent' ? !!job.urgent && !isArchived :
        activeTab === 'archived' ? isArchived : // Show only archived jobs
        !isArchived; // For 'all' tab, exclude archived jobs
      const bySearch =
        !q ||
        String(job.title || '').toLowerCase().includes(q) ||
        String(job.company || job.postedBy || '').toLowerCase().includes(q);
      const byPoster =
        !filterState.poster ||
        String(job.company || job.postedBy || '').toLowerCase().includes(filterState.poster);
      const byDays =
        filterState.maxDays == null ||
        postedAgoToDays(job.postedAgo) <= filterState.maxDays;
      return byTab && bySearch && byPoster && byDays;
    });
  }

  function renderList() {
    if (!listEl) return;
    const shown = filterJobs().sort((a, b) => parseDisplayDateToTime(b.postedAgo) - parseDisplayDateToTime(a.postedAgo));
    listEl.innerHTML = shown.map(job => {
      const isArchived = job.is_archived === true || job.status === 'archived' || job.listing_open === false;
      return `
      <article class="admin-dashboard-job-row${isArchived ? ' user-archived' : ''}" data-job-id="${job.id || `${job.title}|${job.company || job.postedBy || ''}`}">
        <div class="admin-dashboard-job-cell admin-dashboard-job-cell--title">${job.title}${isArchived ? ' (Archived)' : ''}</div>
        <div class="admin-dashboard-job-cell">${job.company || job.postedBy || '—'}</div>
        <div class="admin-dashboard-job-cell">${job.postedAgo}</div>
        <div class="admin-dashboard-row-actions">
          <button type="button" class="admin-dashboard-review-btn" data-action="review">Review Job</button>
          <button type="button" class="admin-dashboard-delete-btn" data-action="${isArchived ? 'restore' : 'delete'}" aria-label="${isArchived ? 'Restore job' : 'Delete job'}">
            <img src="${isArchived ? '../assets/images/Restore.png' : '../assets/images/Delete.png'}" alt="" class="admin-dashboard-delete-icon" aria-hidden="true">
          </button>
        </div>
      </article>
    `;}).join('');
    if (emptyEl) emptyEl.hidden = shown.length > 0;
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeTab = chip.dataset.adminJobTab;
      chips.forEach(c => c.classList.toggle('is-active', c === chip));
      renderList();
    });
  });

  if (searchBtn) searchBtn.addEventListener('click', renderList);
  if (searchInput) searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') renderList();
  });

  function openFilter() {
    if (!filterModal) return;
    filterModal.classList.add('open');
    filterModal.setAttribute('aria-hidden', 'false');
  }
  function closeFilter() {
    if (!filterModal) return;
    filterModal.classList.remove('open');
    filterModal.setAttribute('aria-hidden', 'true');
  }
  if (filterBtn) filterBtn.addEventListener('click', openFilter);
  if (filterApplyBtn) {
    filterApplyBtn.addEventListener('click', () => {
      filterState.poster = String(filterPosterInput?.value || '').trim().toLowerCase();
      filterState.maxDays =
        filterMaxDaysInput && filterMaxDaysInput.value !== ''
          ? Number(filterMaxDaysInput.value)
          : null;
      closeFilter();
      renderList();
    });
  }
  if (filterResetBtn) {
    filterResetBtn.addEventListener('click', () => {
      filterState.poster = '';
      filterState.maxDays = null;
      if (filterPosterInput) filterPosterInput.value = '';
      if (filterMaxDaysInput) filterMaxDaysInput.value = '';
      closeFilter();
      renderList();
    });
  }
  if (filterModal) {
    filterModal.addEventListener('click', e => {
      if (e.target === filterModal) return;
    });
  }

  function openReview(job) {
    if (!reviewModal || !job) return;
    currentReviewedJob = job;
    if (reviewTitle) reviewTitle.textContent = job.title || '—';
    if (reviewBy) reviewBy.textContent = job.company || job.postedBy || '—';
    if (reviewAgo) reviewAgo.textContent = job.postedAgo || '—';
    if (reviewCategory) reviewCategory.textContent = job.category || '—';
    if (reviewSchedule) reviewSchedule.textContent = job.schedule || '—';
    if (reviewType) reviewType.textContent = job.type || '—';
    if (reviewLocation) reviewLocation.textContent = job.location || '—';
    if (reviewRate) reviewRate.textContent = job.rate || '—';
    if (reviewUrgent) reviewUrgent.textContent = job.urgent ? 'Yes' : 'No';
    if (reviewSkills) {
      const skills = Array.isArray(job.skills) ? job.skills.filter(Boolean) : [];
      reviewSkills.textContent = skills.length ? skills.join(', ') : '—';
    }
    if (reviewDesc) reviewDesc.textContent = job.description || 'No description.';
    if (reviewImageBtn) reviewImageBtn.disabled = !jobImageSource(job);
    reviewModal.classList.add('open');
    reviewModal.setAttribute('aria-hidden', 'false');
  }

  async function getFreshJobForReview(jobId, fallbackJob) {
    const id = String(jobId || '').trim();
    if (!id) return fallbackJob || null;

    if (!window.RJGDb || typeof window.RJGDb.loadAllJobs !== 'function') {
      return fallbackJob || null;
    }

    try {
      const dbJobs = await window.RJGDb.loadAllJobs();
      if (!Array.isArray(dbJobs) || !dbJobs.length) return fallbackJob || null;
      const fresh = dbJobs.find((j) => String(j.id || '') === id);
      if (!fresh) return fallbackJob || null;

      const imageCandidate = jobImageSource(fresh);
      if (imageCandidate && typeof window.RJGDb.getJobImageUrl === 'function') {
        try {
          const resolved = await window.RJGDb.getJobImageUrl(imageCandidate);
          if (resolved) {
            fresh.image = resolved;
            fresh.imageUrl = resolved;
          }
        } catch (e) {
          // Keep original image candidate if URL resolution fails
        }
      }

      const idx = jobs.findIndex((j) => String(j.id || '') === id);
      if (idx >= 0) {
        jobs[idx] = fresh;
      } else {
        jobs.unshift(fresh);
      }
      return fresh;
    } catch (e) {
      console.warn('Failed to load fresh job data for review:', e);
      return fallbackJob || null;
    }
  }
  function closeReview() {
    if (!reviewModal) return;
    currentReviewedJob = null;
    reviewModal.classList.remove('open');
    reviewModal.setAttribute('aria-hidden', 'true');
  }
  if (reviewCloseBtn) reviewCloseBtn.addEventListener('click', closeReview);
  if (reviewModal) {
    reviewModal.addEventListener('click', e => {
      if (e.target === reviewModal) return;
    });
  }

  async function loadUserDocuments(userId) {
    try {
      const documentsContainer = document.getElementById('adminUserReviewDocuments');
      if (!documentsContainer) return;

      // Show loading state
      documentsContainer.innerHTML = '<p style="text-align: center; color: #666;">Loading documents...</p>';

      console.log('DEBUG: Loading documents for user:', userId);

      // Fetch user documents from database
      if (window.RJGDb && typeof window.RJGDb.listUserDocuments === 'function') {
        console.log('DEBUG: Calling listUserDocuments function...');
        const documents = await window.RJGDb.listUserDocuments(userId);
        console.log('DEBUG: Documents result:', documents);
        
        if (documents && documents.length > 0) {
          documentsContainer.innerHTML = documents.map(doc => `
            <div class="admin-dashboard-review-document-item">
              <div class="admin-dashboard-review-document-info">
                <div class="admin-dashboard-review-document-name">${doc.name || 'Untitled Document'}</div>
                <div class="admin-dashboard-review-document-type">${doc.type || 'Unknown'}</div>
              </div>
              <div class="admin-dashboard-review-document-actions">
                ${doc.url ? `
                  <button type="button" class="admin-dashboard-review-document-btn view" onclick="showImageModal('${doc.url}')">
                    View
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('');
        } else {
          console.log('DEBUG: No documents found for user');
          documentsContainer.innerHTML = '<p class="admin-dashboard-review-no-documents">No documents uploaded</p>';
        }
      } else {
        console.log('DEBUG: listUserDocuments function not available');
        // Fallback if database function not available
        documentsContainer.innerHTML = '<p class="admin-dashboard-review-no-documents">Document feature not available</p>';
      }
    } catch (error) {
      console.error('Failed to load user documents:', error);
      console.log('DEBUG: Error details:', error.message);
      const documentsContainer = document.getElementById('adminUserReviewDocuments');
      if (documentsContainer) {
        // Show more specific error message
        if (error.message.includes('user_documents') && error.message.includes('does not exist')) {
          documentsContainer.innerHTML = '<p class="admin-dashboard-review-no-documents">Document table not found in database</p>';
        } else {
          documentsContainer.innerHTML = '<p class="admin-dashboard-review-no-documents">Unable to load documents</p>';
        }
      }
    }
  }

  async function openUserReview(user) {
    if (!userReviewModal || !user) return;
    currentEditingUser = user;
    currentEditingUserId = user.id;
    const profile = user.profile || {};
    const isAdmin = user.role === 'Admin';

    // Account Information
    if (userReviewId) userReviewId.textContent = user.id || '—';
    if (userReviewName) userReviewName.textContent = user.name || '—';
    if (userReviewEmail) userReviewEmail.textContent = user.email || 'No email set';
    if (userReviewRole) userReviewRole.textContent = user.role || '—';
    if (userReviewStatus) userReviewStatus.textContent = user.isActive === false ? 'Inactive' : 'Active';
    if (userReviewCreated) userReviewCreated.textContent = user.created || '—';
    if (userReviewUpdated) userReviewUpdated.textContent = user.updated || '—';

    // Activity
    if (userReviewApplied) userReviewApplied.textContent = String(user.jobsApplied ?? 0);
    if (userReviewPosted) userReviewPosted.textContent = String(user.jobsPosted ?? 0);

    // Profile Information - Handle admin users differently
    if (userReviewPhone) userReviewPhone.textContent = isAdmin ? 'Not set for admin' : (profile.phone || '—');
    if (userReviewAddress) userReviewAddress.textContent = isAdmin ? 'Not set for admin' : formatAddress(profile.address);
    if (userReviewSex) userReviewSex.textContent = isAdmin ? 'Not set for admin' : (profile.sex || '—');
    if (userReviewBirthDate) userReviewBirthDate.textContent = isAdmin ? 'Not set for admin' : (profile.birthDate || '—');
    if (userReviewEducationStatus) userReviewEducationStatus.textContent = isAdmin ? 'Not set for admin' : (profile.educationStatus || '—');
    if (userReviewLinks) userReviewLinks.textContent = isAdmin ? 'Not set for admin' : formatList(profile.profileLinks);
    if (userReviewLanguages) userReviewLanguages.textContent = isAdmin ? 'Not set for admin' : formatList(profile.languages, entry => `${entry.language || ''} - ${entry.level || ''}`);
    if (userReviewPersonality) userReviewPersonality.textContent = isAdmin ? 'Not set for admin' : formatList(profile.personality);
    if (userReviewSkills) userReviewSkills.textContent = isAdmin ? 'Not set for admin' : formatList(profile.skills);
    if (userReviewWork) {
      userReviewWork.textContent = isAdmin ? 'Not set for admin' : formatList(profile.workExperiences, work => {
        const position = work.positionName || '';
        const company = work.companyName || '';
        const years = [work.startYear, work.endYear].filter(Boolean).join(' - ');
        return [position, company, years].filter(Boolean).join(' | ');
      });
    }
    if (userReviewEducation) {
      userReviewEducation.textContent = isAdmin ? 'Not set for admin' : formatList(profile.educationBackgrounds, edu => {
        const level = edu.educationLevel || '';
        const school = edu.schoolName || '';
        const program = edu.program || '';
        return [level, school, program].filter(Boolean).join(' | ');
      });
    }
    if (userReviewDescription) userReviewDescription.textContent = isAdmin ? 'Not set for admin' : (profile.description || 'No description.');

    // Profile Image
    const imageUrl = profile.imageUrl || '';
    if (userReviewImage && userReviewImagePlaceholder) {
      if (imageUrl) {
        userReviewImage.src = imageUrl;
        userReviewImage.style.display = 'block';
        userReviewImagePlaceholder.style.display = 'none';
        if (userViewImageBtn) userViewImageBtn.style.display = 'inline-block';
      } else {
        userReviewImage.style.display = 'none';
        userReviewImage.removeAttribute('src');
        userReviewImagePlaceholder.style.display = 'block';
        if (userViewImageBtn) userViewImageBtn.style.display = 'none';
      }
    }

    // Load and display user documents
    await loadUserDocuments(user.id);

    userReviewModal.classList.add('open');
    userReviewModal.setAttribute('aria-hidden', 'false');
  }

  function closeUserReview() {
    if (!userReviewModal) return;
    currentEditingUser = null;
    currentEditingUserId = null;
    userReviewModal.classList.remove('open');
    userReviewModal.setAttribute('aria-hidden', 'true');
  }

  if (userReviewCloseBtn) userReviewCloseBtn.addEventListener('click', closeUserReview);
  if (userReviewModal) {
    userReviewModal.addEventListener('click', e => {
      if (e.target === userReviewModal) return;
    });
  }

  // Track current user being edited
  let currentEditingUserId = null;
  let currentEditingUser = null;

  // ── User Edit Profile Modal ──
  const userEditModal = document.getElementById('adminUserEditModal');
  const userEditName = document.getElementById('adminUserEditName');
  const userEditLastName = document.getElementById('adminUserEditLastName');
  const userEditFirstName = document.getElementById('adminUserEditFirstName');
  const userEditMiddleName = document.getElementById('adminUserEditMiddleName');
  const userEditSuffix = document.getElementById('adminUserEditSuffix');
  const userEditPhone = document.getElementById('adminUserEditPhone');
  const userEditSex = document.getElementById('adminUserEditSex');
  const userEditBirthDate = document.getElementById('adminUserEditBirthDate');
  const userEditEducationStatus = document.getElementById('adminUserEditEducationStatus');
  const userEditDescription = document.getElementById('adminUserEditDescription');
  const userEditAddressUnitNo = document.getElementById('adminUserEditAddressUnitNo');
  const userEditAddressStreet = document.getElementById('adminUserEditAddressStreet');
  const userEditAddressRegion = document.getElementById('adminUserEditAddressRegion');
  const userEditAddressProvince = document.getElementById('adminUserEditAddressProvince');
  const userEditAddressCity = document.getElementById('adminUserEditAddressCity');
  const userEditAddressBarangay = document.getElementById('adminUserEditAddressBarangay');
  const userEditAddressCountry = document.getElementById('adminUserEditAddressCountry');
  const userEditAddressZip = document.getElementById('adminUserEditAddressZip');

  // Profile picture elements
  const userEditProfilePictureBtn = document.getElementById('adminUserEditProfilePictureBtn');
  const userEditProfilePictureInput = document.getElementById('adminUserEditProfilePictureInput');
  const userEditProfilePicturePreview = document.getElementById('adminUserEditProfilePicturePreview');
  const userEditProfilePicturePlaceholder = document.getElementById('adminUserEditProfilePicturePlaceholder');
  
  // Store uploaded profile picture file
  let uploadedProfilePicture = null;

  // Profile picture upload handler
  console.log('DEBUG: Profile picture elements found:', {
    btn: !!userEditProfilePictureBtn,
    input: !!userEditProfilePictureInput,
    preview: !!userEditProfilePicturePreview,
    placeholder: !!userEditProfilePicturePlaceholder
  });
  
  if (userEditProfilePictureBtn && userEditProfilePictureInput) {
    userEditProfilePictureBtn.addEventListener('click', () => {
      console.log('DEBUG: Profile picture button clicked');
      userEditProfilePictureInput.click();
    });

    userEditProfilePictureInput.addEventListener('change', async (e) => {
      console.log('DEBUG: File input changed, files:', e.target.files);
      const file = e.target.files[0];
      console.log('DEBUG: Selected file:', file);
      if (file && file.type.startsWith('image/')) {
        console.log('DEBUG: Valid image file selected, type:', file.type);
        uploadedProfilePicture = file; // Store the file for upload during save
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log('DEBUG: File loaded, setting preview');
            if (userEditProfilePicturePreview) {
              userEditProfilePicturePreview.src = e.target.result;
              userEditProfilePicturePreview.style.display = 'block';
              console.log('DEBUG: Preview updated');
            }
            if (userEditProfilePicturePlaceholder) {
              userEditProfilePicturePlaceholder.style.display = 'none';
              console.log('DEBUG: Placeholder hidden');
            }
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.error('Error reading file:', err);
          if (window.showAppToast) window.showAppToast('Error loading image', 'error');
        }
      } else {
        console.log('DEBUG: No valid image file selected');
        uploadedProfilePicture = null;
      }
    });
  } else {
    console.log('DEBUG: Profile picture elements not found');
  }

  const userEditSkillsList = document.getElementById('adminUserEditSkillsList');
  const userEditPersonalityList = document.getElementById('adminUserEditPersonalityList');
  const userEditWorkList = document.getElementById('adminUserEditWorkList');
  const userEditWorkForm = document.getElementById('adminUserEditWorkForm');
  const userEditWorkToggleBtn = document.getElementById('adminUserEditWorkToggleBtn');
  const userEditWorkAddBtn = document.getElementById('adminUserEditWorkAddBtn');
  const userEditEduList = document.getElementById('adminUserEditEduList');
  const userEditEduForm = document.getElementById('adminUserEditEduForm');
  const userEditEduToggleBtn = document.getElementById('adminUserEditEduToggleBtn');
  const userEditEduAddBtn = document.getElementById('adminUserEditEduAddBtn');
  const userEditLangList = document.getElementById('adminUserEditLangList');
  const userEditLangAddBtn = document.getElementById('adminUserEditLangAddBtn');
  const userEditLinksList = document.getElementById('adminUserEditLinksList');
  const userEditLinksAddBtn = document.getElementById('adminUserEditLinksAddBtn');
  const userEditSaveBtn = document.getElementById('adminUserEditSaveBtn');
  const userEditCloseBtn = document.getElementById('adminUserEditCloseBtn');

  // Temp arrays for add/remove items
  let aueWorkExperiences = [];
  let aueEducationBackgrounds = [];
  let aueLanguages = [];
  let aueProfileLinks = [];

  const aueLanguageOptions = [
    'English', 'Filipino / Tagalog', 'Cebuano', 'Ilocano', 'Hiligaynon',
    'Bicolano', 'Chinese (Mandarin)', 'Spanish', 'Japanese', 'Korean',
    'Arabic', 'French', 'German', 'Hindi', 'Malay / Indonesian', 'Other'
  ];
  const aueLevelOptions = ['Native', 'Fluent', 'Intermediate', 'Basic'];

  if (userEditBtn) {
    userEditBtn.addEventListener('click', () => {
      if (!currentEditingUser) return;
      openUserEditModal(currentEditingUser);
    });
  }

  // ── Render helpers ──
  function aueRenderWorkList() {
    if (!userEditWorkList) return;
    userEditWorkList.innerHTML = '';
    if (!aueWorkExperiences.length) {
      userEditWorkList.innerHTML = '<p style="color:#999;font-style:italic;font-size:13px;margin:0;">No work experiences added yet</p>';
      return;
    }
    aueWorkExperiences.forEach((exp, idx) => {
      const card = document.createElement('div');
      card.className = 'aue-item-card';
      const start = exp.startMonth ? `${exp.startMonth}/${exp.startYear}` : (exp.startYear || '?');
      const end = exp.endMonth ? `${exp.endMonth}/${exp.endYear}` : (exp.endYear || '?');
      card.innerHTML = `
        <div class="aue-item-content">
          <div class="aue-item-title">${exp.positionName || ''}</div>
          <div class="aue-item-subtitle">${exp.companyName || ''} &bull; ${exp.location || ''} (${start}-${end})</div>
        </div>
        <button type="button" class="aue-item-remove" data-idx="${idx}">&times;</button>`;
      card.querySelector('.aue-item-remove').addEventListener('click', () => {
        aueWorkExperiences.splice(idx, 1);
        aueRenderWorkList();
      });
      userEditWorkList.appendChild(card);
    });
  }

  function aueRenderEduList() {
    if (!userEditEduList) return;
    userEditEduList.innerHTML = '';
    if (!aueEducationBackgrounds.length) {
      userEditEduList.innerHTML = '<p style="color:#999;font-style:italic;font-size:13px;margin:0;">No educational background added yet</p>';
      return;
    }
    aueEducationBackgrounds.forEach((edu, idx) => {
      const card = document.createElement('div');
      card.className = 'aue-item-card';
      const start = edu.startMonth ? `${edu.startMonth}/${edu.startYear}` : (edu.startYear || '?');
      const end = edu.endMonth ? `${edu.endMonth}/${edu.endYear}` : (edu.endYear || '?');
      card.innerHTML = `
        <div class="aue-item-content">
          <div class="aue-item-title">${edu.educationLevel || ''}</div>
          <div class="aue-item-subtitle">${edu.schoolName || ''} &bull; ${edu.program || ''} (${start}-${end})</div>
        </div>
        <button type="button" class="aue-item-remove" data-idx="${idx}">&times;</button>`;
      card.querySelector('.aue-item-remove').addEventListener('click', () => {
        aueEducationBackgrounds.splice(idx, 1);
        aueRenderEduList();
      });
      userEditEduList.appendChild(card);
    });
  }

  function aueRenderLangList() {
    if (!userEditLangList) return;
    userEditLangList.innerHTML = '';
    if (!aueLanguages.length) {
      userEditLangList.innerHTML = '<p style="color:#999;font-style:italic;font-size:13px;margin:0;">No languages added yet</p>';
      return;
    }
    aueLanguages.forEach((lang, idx) => {
      const card = document.createElement('div');
      card.className = 'aue-item-card';
      card.innerHTML = `
        <div class="aue-item-content">
          <div class="aue-item-title">${lang.language || ''} — ${lang.level || ''}</div>
        </div>
        <button type="button" class="aue-item-remove" data-idx="${idx}">&times;</button>`;
      card.querySelector('.aue-item-remove').addEventListener('click', () => {
        aueLanguages.splice(idx, 1);
        aueRenderLangList();
      });
      userEditLangList.appendChild(card);
    });
  }

  function aueRenderLinksList() {
    if (!userEditLinksList) return;
    userEditLinksList.innerHTML = '';
    if (!aueProfileLinks.length) {
      userEditLinksList.innerHTML = '<p style="color:#999;font-style:italic;font-size:13px;margin:0;">No profile links added yet</p>';
      return;
    }
    aueProfileLinks.forEach((link, idx) => {
      const card = document.createElement('div');
      card.className = 'aue-item-card';
      card.innerHTML = `
        <div class="aue-item-content">
          <div class="aue-item-title">${link}</div>
        </div>
        <button type="button" class="aue-item-remove" data-idx="${idx}">&times;</button>`;
      card.querySelector('.aue-item-remove').addEventListener('click', () => {
        aueProfileLinks.splice(idx, 1);
        aueRenderLinksList();
      });
      userEditLinksList.appendChild(card);
    });
  }

  // ── Checkbox max-5 enforcement ──
  function aueEnforceCheckboxMax(container, max) {
    if (!container) return;
    const cbs = container.querySelectorAll('input[type="checkbox"]');
    cbs.forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = container.querySelectorAll('input[type="checkbox"]:checked');
        if (checked.length > max) {
          cb.checked = false;
          if (window.showAppToast) window.showAppToast(`Maximum ${max} selections allowed.`, 'warn');
        }
      });
    });
  }

  function aueSetCheckboxValues(container, values) {
    if (!container) return;
    const set = new Set(Array.isArray(values) ? values.map(String) : []);
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = set.has(cb.value);
    });
  }

  function aueGetCheckedValues(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  }

  // ── Work Experience add form toggle & add ──
  if (userEditWorkToggleBtn && userEditWorkForm) {
    userEditWorkToggleBtn.addEventListener('click', () => {
      const showing = userEditWorkForm.style.display !== 'none';
      userEditWorkForm.style.display = showing ? 'none' : 'block';
      userEditWorkToggleBtn.textContent = showing ? '+ Add Work Experience' : 'Cancel';
    });
  }
  if (userEditWorkAddBtn) {
    userEditWorkAddBtn.addEventListener('click', () => {
      const pos = document.getElementById('adminUserEditWorkPosition');
      const comp = document.getElementById('adminUserEditWorkCompany');
      const loc = document.getElementById('adminUserEditWorkLocation');
      const sm = document.getElementById('adminUserEditWorkStartMonth');
      const sy = document.getElementById('adminUserEditWorkStartYear');
      const em = document.getElementById('adminUserEditWorkEndMonth');
      const ey = document.getElementById('adminUserEditWorkEndYear');
      if (!pos.value.trim() || !comp.value.trim()) {
        if (window.showAppToast) window.showAppToast('Position and Company are required.', 'warn');
        return;
      }
      aueWorkExperiences.push({
        positionName: pos.value.trim(),
        companyName: comp.value.trim(),
        location: loc.value.trim(),
        startMonth: sm.value,
        startYear: sy.value.trim(),
        endMonth: em.value,
        endYear: ey.value.trim()
      });
      pos.value = ''; comp.value = ''; loc.value = ''; sm.value = ''; sy.value = ''; em.value = ''; ey.value = '';
      aueRenderWorkList();
      userEditWorkForm.style.display = 'none';
      if (userEditWorkToggleBtn) userEditWorkToggleBtn.textContent = '+ Add Work Experience';
    });
  }

  // ── Education add form toggle & add ──
  if (userEditEduToggleBtn && userEditEduForm) {
    userEditEduToggleBtn.addEventListener('click', () => {
      const showing = userEditEduForm.style.display !== 'none';
      userEditEduForm.style.display = showing ? 'none' : 'block';
      userEditEduToggleBtn.textContent = showing ? '+ Add Educational Background' : 'Cancel';
    });
  }
  if (userEditEduAddBtn) {
    userEditEduAddBtn.addEventListener('click', () => {
      const lvl = document.getElementById('adminUserEditEduLevel');
      const sch = document.getElementById('adminUserEditEduSchool');
      const prog = document.getElementById('adminUserEditEduProgram');
      const sm = document.getElementById('adminUserEditEduStartMonth');
      const sy = document.getElementById('adminUserEditEduStartYear');
      const em = document.getElementById('adminUserEditEduEndMonth');
      const ey = document.getElementById('adminUserEditEduEndYear');
      if (!lvl.value || !sch.value.trim()) {
        if (window.showAppToast) window.showAppToast('Education Level and School are required.', 'warn');
        return;
      }
      aueEducationBackgrounds.push({
        educationLevel: lvl.value,
        schoolName: sch.value.trim(),
        program: prog.value.trim(),
        startMonth: sm.value,
        startYear: sy.value.trim(),
        endMonth: em.value,
        endYear: ey.value.trim()
      });
      lvl.value = ''; sch.value = ''; prog.value = ''; sm.value = ''; sy.value = ''; em.value = ''; ey.value = '';
      aueRenderEduList();
      userEditEduForm.style.display = 'none';
      if (userEditEduToggleBtn) userEditEduToggleBtn.textContent = '+ Add Educational Background';
    });
  }

  // ── Language inline add ──
  function aueAddLangRow(language, level) {
    if (!userEditLangList) return;
    // Remove empty-state text
    const emptyP = userEditLangList.querySelector('p');
    if (emptyP) emptyP.remove();

    const row = document.createElement('div');
    row.className = 'aue-lang-row';
    row.innerHTML = `
      <select class="aue-lang-select">
        ${aueLanguageOptions.map(o => `<option value="${o}"${o === (language || '') ? ' selected' : ''}>${o}</option>`).join('')}
      </select>
      <input type="text" class="aue-lang-custom" placeholder="Enter language" style="display:none;">
      <select class="aue-level-select">
        ${aueLevelOptions.map(o => `<option value="${o}"${o === (level || '') ? ' selected' : ''}>${o}</option>`).join('')}
      </select>
      <button type="button" class="aue-item-remove">&times;</button>`;

    const langSel = row.querySelector('.aue-lang-select');
    const customIn = row.querySelector('.aue-lang-custom');
    if (language && !aueLanguageOptions.includes(language)) {
      langSel.value = 'Other';
      customIn.style.display = 'block';
      customIn.value = language;
    }
    langSel.addEventListener('change', () => {
      customIn.style.display = langSel.value === 'Other' ? 'block' : 'none';
      if (langSel.value !== 'Other') customIn.value = '';
    });
    row.querySelector('.aue-item-remove').addEventListener('click', () => { row.remove(); });
    userEditLangList.appendChild(row);
  }

  if (userEditLangAddBtn) {
    userEditLangAddBtn.addEventListener('click', () => { aueAddLangRow('', ''); });
  }

  // ── Profile Link inline add ──
  function aueAddLinkRow(link) {
    if (!userEditLinksList) return;
    const emptyP = userEditLinksList.querySelector('p');
    if (emptyP) emptyP.remove();

    const row = document.createElement('div');
    row.className = 'aue-item-card';
    row.innerHTML = `
      <input type="text" class="aue-link-input" value="${link || ''}" placeholder="https://example.com" style="flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
      <button type="button" class="aue-item-remove">&times;</button>`;
    row.querySelector('.aue-item-remove').addEventListener('click', () => { row.remove(); });
    userEditLinksList.appendChild(row);
  }

  if (userEditLinksAddBtn) {
    userEditLinksAddBtn.addEventListener('click', () => { aueAddLinkRow(''); });
  }

  // ── Enforce max 5 on skills & personality ──
  aueEnforceCheckboxMax(userEditSkillsList, 5);
  aueEnforceCheckboxMax(userEditPersonalityList, 5);

  // ── Philippine Address API Functions ──
  async function loadPhilippineRegions() {
    if (!userEditAddressRegion) return;
    
    try {
      userEditAddressRegion.innerHTML = '<option value="">— Select Region —</option>';
      userEditAddressRegion.disabled = true;
      
      // Fetch regions from PSGC API
      const response = await fetch('https://psgc.cloud/api/regions');
      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }
      
      const regions = await response.json();
      
      regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.code;
        option.textContent = region.name;
        userEditAddressRegion.appendChild(option);
      });
      
      userEditAddressRegion.disabled = false;
    } catch (error) {
      console.error('Failed to load regions:', error);
      userEditAddressRegion.disabled = false;
      // Fallback to mock data if API fails
      const fallbackRegions = [
        { code: '130000000', name: 'National Capital Region (NCR)' },
        { code: '140000000', name: 'Cordillera Administrative Region (CAR)' },
        { code: '010000000', name: 'Region I - Ilocos Region' },
        { code: '020000000', name: 'Region II - Cagayan Valley' }
      ];
      
      fallbackRegions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.code;
        option.textContent = region.name;
        userEditAddressRegion.appendChild(option);
      });
    }
  }

  async function loadPhilippineProvinces(regionCode) {
    if (!userEditAddressProvince || !regionCode) return;
    
    try {
      userEditAddressProvince.innerHTML = '<option value="">— Select Province —</option>';
      userEditAddressProvince.disabled = true;
      userEditAddressCity.innerHTML = '<option value="">— Select City —</option>';
      userEditAddressCity.disabled = true;
      userEditAddressBarangay.innerHTML = '<option value="">— Select Barangay —</option>';
      userEditAddressBarangay.disabled = true;
      
      // Fetch provinces from PSGC API
      const response = await fetch(`https://psgc.cloud/api/regions/${regionCode}/provinces`);
      if (!response.ok) {
        throw new Error('Failed to fetch provinces');
      }
      
      const provinces = await response.json();
      
      provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province.code;
        option.textContent = province.name;
        userEditAddressProvince.appendChild(option);
      });
      
      userEditAddressProvince.disabled = false;
    } catch (error) {
      console.error('Failed to load provinces:', error);
      userEditAddressProvince.disabled = false;
      // Fallback to mock data if API fails
      const fallbackProvinces = [
        { code: '137400000', name: 'Caloocan City' },
        { code: '136900000', name: 'Manila City' },
        { code: '137500000', name: 'Quezon City' }
      ];
      
      fallbackProvinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province.code;
        option.textContent = province.name;
        userEditAddressProvince.appendChild(option);
      });
    }
  }

  async function loadPhilippineCities(provinceCode) {
    if (!userEditAddressCity || !provinceCode) return;
    
    try {
      userEditAddressCity.innerHTML = '<option value="">— Select City —</option>';
      userEditAddressCity.disabled = true;
      userEditAddressBarangay.innerHTML = '<option value="">— Select Barangay —</option>';
      userEditAddressBarangay.disabled = true;
      
      // Fetch cities from PSGC API
      const response = await fetch(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      
      const cities = await response.json();
      
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.code;
        option.textContent = city.name;
        userEditAddressCity.appendChild(option);
      });
      
      userEditAddressCity.disabled = false;
    } catch (error) {
      console.error('Failed to load cities:', error);
      userEditAddressCity.disabled = false;
      // Fallback to mock data if API fails
      const fallbackCities = [
        { code: '137404000', name: 'Caloocan City Proper' },
        { code: '137405000', name: 'South Caloocan' },
        { code: '136901000', name: 'Manila Proper' }
      ];
      
      fallbackCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.code;
        option.textContent = city.name;
        userEditAddressCity.appendChild(option);
      });
    }
  }

  async function loadPhilippineBarangays(cityCode) {
    if (!userEditAddressBarangay || !cityCode) return;
    
    try {
      userEditAddressBarangay.innerHTML = '<option value="">— Select Barangay —</option>';
      userEditAddressBarangay.disabled = true;
      
      // Fetch barangays from PSGC API
      const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
      if (!response.ok) {
        throw new Error('Failed to fetch barangays');
      }
      
      const barangays = await response.json();
      
      barangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay.code;
        option.textContent = barangay.name;
        userEditAddressBarangay.appendChild(option);
      });
      
      userEditAddressBarangay.disabled = false;
    } catch (error) {
      console.error('Failed to load barangays:', error);
      userEditAddressBarangay.disabled = false;
      // Fallback to mock data if API fails
      const fallbackBarangays = [
        { code: '137404001', name: 'Barangay 1' },
        { code: '137404002', name: 'Barangay 2' },
        { code: '137404003', name: 'Barangay 3' }
      ];
      
      fallbackBarangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay.code;
        option.textContent = barangay.name;
        userEditAddressBarangay.appendChild(option);
      });
    }
  }

  // ── Address Dropdown Event Handlers ──
  if (userEditAddressRegion) {
    userEditAddressRegion.addEventListener('change', async (e) => {
      const regionCode = e.target.value;
      if (userEditAddressProvince) {
        await loadPhilippineProvinces(regionCode);
      }
    });
  }

  if (userEditAddressProvince) {
    userEditAddressProvince.addEventListener('change', async (e) => {
      const provinceCode = e.target.value;
      if (userEditAddressCity) {
        await loadPhilippineCities(provinceCode);
      }
    });
  }

  if (userEditAddressCity) {
    userEditAddressCity.addEventListener('change', async (e) => {
      const cityCode = e.target.value;
      if (userEditAddressBarangay) {
        await loadPhilippineBarangays(cityCode);
      }
    });
  }

  // ── Open modal ──
  async function openUserEditModal(user) {
    if (!user || !userEditModal) return;
    currentEditingUserId = user.id;
    const profile = user.profile || {};
    const userRole = user.role || 'seeker';
    const isRecruiter = userRole === 'recruiter' || userRole === 'Recruiter' || userRole === 'employer';
    
    console.log('DEBUG: Editing user:', user.id, 'Role:', userRole, 'Is Recruiter:', isRecruiter);
    console.log('DEBUG: Full user object:', user);
    console.log('DEBUG: User profile:', profile);

    // Show/hide sections based on user type
    const seekerSections = [
      'adminUserEditProfilePictureSection', 'adminUserEditBasicInfoSection', 'adminUserEditPersonalInfoSection', 'adminUserEditEducationInfoSection', 
      'adminUserEditDescriptionSection', 'adminUserEditWorkSection', 'adminUserEditEduSection', 
      'adminUserEditSkillsSection', 'adminUserEditPersonalitySection', 'adminUserEditLangSection',
      'adminUserEditAddressSection'
    ];
    
    const recruiterSections = [
      'adminUserEditCompanySection', 'adminUserEditContactSection', 'adminUserEditAddressSection',
      'adminUserEditLinksSection'
    ];

    console.log('DEBUG: Seeker sections to hide:', seekerSections);
    console.log('DEBUG: Recruiter sections to hide:', recruiterSections);

    // Hide all sections first
    [...seekerSections, ...recruiterSections].forEach(sectionId => {
      const element = document.getElementById(sectionId);
      console.log('DEBUG: Hiding section:', sectionId, 'Element found:', !!element);
      if (element) {
        element.style.display = 'none';
        console.log('DEBUG: Section hidden:', sectionId);
      }
    });

    if (isRecruiter) {
      console.log('DEBUG: Showing recruiter sections for user:', user.id);
      // Show recruiter-specific sections
      recruiterSections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        console.log('DEBUG: Showing recruiter section:', sectionId, 'Element found:', !!element);
        if (element) {
          element.style.display = 'block';
          console.log('DEBUG: Recruiter section shown:', sectionId);
        }
      });
      
      // For recruiters: first_name stores company name, last_name is null
      if (userEditFirstName) {
        userEditFirstName.value = profile.first_name || '';
        // Change label to "Company Name"
        const label = document.querySelector('label[for="adminUserEditFirstName"]');
        if (label) label.textContent = 'Company Name';
      }
      if (userEditLastName) userEditLastName.value = '';
      
      if (userEditMiddleName) userEditMiddleName.value = '';
      if (userEditSuffix) userEditSuffix.value = '';
      
      // Update modal title
      const modalTitle = document.getElementById('adminUserEditModalTitle');
      if (modalTitle) modalTitle.textContent = 'Edit Recruiter Profile';
      
    } else {
      console.log('DEBUG: Showing seeker sections for user:', user.id);
      // Show seeker-specific sections
      seekerSections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        console.log('DEBUG: Showing seeker section:', sectionId, 'Element found:', !!element);
        if (element) {
          element.style.display = 'block';
          console.log('DEBUG: Seeker section shown:', sectionId);
        }
      });
      
      // For seekers: normal name fields
      if (userEditLastName) userEditLastName.value = profile.last_name || '';
      if (userEditFirstName) {
        userEditFirstName.value = profile.first_name || '';
        // Reset label to "First Name"
        const label = document.querySelector('label[for="adminUserEditFirstName"]');
        if (label) label.textContent = 'First Name';
      }
      if (userEditMiddleName) userEditMiddleName.value = profile.middle_name || '';
      if (userEditSuffix) userEditSuffix.value = profile.suffix || '';
      
      // Update modal title
      const modalTitle = document.getElementById('adminUserEditModalTitle');
      if (modalTitle) modalTitle.textContent = 'Edit Seeker Profile';
    }
    // Phone validation for both seeker and recruiter contact fields
    const phoneFields = document.querySelectorAll('#adminUserEditPhone');
    phoneFields.forEach(field => {
      if (field) {
        field.value = profile.phone || '';
        // Add phone number validation - numbers only, exactly 11
        field.addEventListener('input', function(e) {
          e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
        });
      }
    });

    // Unit number validation - numbers only
    if (userEditAddressUnitNo) {
      userEditAddressUnitNo.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
    }

    // ZIP code validation - numbers only, max 4
    if (userEditAddressZip) {
      userEditAddressZip.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
      });
    }
    
    // Populate profile picture
    if (profile.avatar_url) {
      if (userEditProfilePicturePreview) {
        userEditProfilePicturePreview.src = profile.avatar_url;
        userEditProfilePicturePreview.style.display = 'block';
      }
      if (userEditProfilePicturePlaceholder) {
        userEditProfilePicturePlaceholder.style.display = 'none';
      }
    } else {
      if (userEditProfilePicturePreview) {
        userEditProfilePicturePreview.style.display = 'none';
      }
      if (userEditProfilePicturePlaceholder) {
        userEditProfilePicturePlaceholder.style.display = 'flex';
      }
    }
    
    if (userEditSex) userEditSex.value = profile.sex || '';
    if (userEditBirthDate) {
      userEditBirthDate.value = profile.birthDate || '';
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
      const maxDate = fifteenYearsAgo.toISOString().split("T")[0];
      userEditBirthDate.setAttribute("max", maxDate);
      userEditBirthDate.placeholder = "YYYY-MM-DD";
      
      // Add birthdate validation
      userEditBirthDate.addEventListener('change', function(e) {
        const selectedDate = new Date(e.target.value);
        const fifteenYearsAgo = new Date();
        fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
        
        if (selectedDate > fifteenYearsAgo) {
          e.target.setCustomValidity('User must be at least 15 years old');
        } else {
          e.target.setCustomValidity('');
        }
      });
    }
    if (userEditDescription) userEditDescription.value = profile.description || '';

    // Education status
    if (userEditEducationStatus) userEditEducationStatus.value = profile.educationStatus || '';

    // Address
    const addr = profile.address || {};
    if (userEditAddressUnitNo) {
      userEditAddressUnitNo.value = addr.unitNo || '';
      // Add unit number validation (numbers only)
      userEditAddressUnitNo.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9\sA-Za-z\-\/]/g, '');
      });
    }
    if (userEditAddressStreet) userEditAddressStreet.value = addr.street || '';
    
    // Initialize cascading address dropdowns - match by text instead of code
    if (userEditAddressRegion) {
      await loadPhilippineRegions();
      // Select region by matching text
      if (addr.region) {
        for (let i = 0; i < userEditAddressRegion.options.length; i++) {
          if (userEditAddressRegion.options[i].text === addr.region) {
            userEditAddressRegion.value = userEditAddressRegion.options[i].value;
            break;
          }
        }
        
        if (userEditAddressRegion.value) {
          await loadPhilippineProvinces(userEditAddressRegion.value);
          // Select province by matching text
          if (addr.province) {
            for (let i = 0; i < userEditAddressProvince.options.length; i++) {
              if (userEditAddressProvince.options[i].text === addr.province) {
                userEditAddressProvince.value = userEditAddressProvince.options[i].value;
                break;
              }
            }
            
            if (userEditAddressProvince.value) {
              await loadPhilippineCities(userEditAddressProvince.value);
              // Select city by matching text
              if (addr.city) {
                for (let i = 0; i < userEditAddressCity.options.length; i++) {
                  if (userEditAddressCity.options[i].text === addr.city) {
                    userEditAddressCity.value = userEditAddressCity.options[i].value;
                    break;
                  }
                }
                
                if (userEditAddressCity.value) {
                  await loadPhilippineBarangays(userEditAddressCity.value);
                  // Select barangay by matching text
                  if (addr.barangay) {
                    for (let i = 0; i < userEditAddressBarangay.options.length; i++) {
                      if (userEditAddressBarangay.options[i].text === addr.barangay) {
                        userEditAddressBarangay.value = userEditAddressBarangay.options[i].value;
                        break;
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
    
    if (userEditAddressZip) {
      userEditAddressZip.value = addr.zip || '';
      // Add zip code validation (numbers only, max 4 digits)
      userEditAddressZip.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
      });
    }

    // Work Experiences
    aueWorkExperiences = Array.isArray(profile.workExperiences) ? profile.workExperiences.slice() : [];
    aueRenderWorkList();
    if (userEditWorkForm) userEditWorkForm.style.display = 'none';
    if (userEditWorkToggleBtn) userEditWorkToggleBtn.textContent = '+ Add Work Experience';

    // Education Backgrounds
    aueEducationBackgrounds = Array.isArray(profile.educationBackgrounds) ? profile.educationBackgrounds.slice() : [];
    aueRenderEduList();
    if (userEditEduForm) userEditEduForm.style.display = 'none';
    if (userEditEduToggleBtn) userEditEduToggleBtn.textContent = '+ Add Educational Background';

    // Skills & Personality checkboxes
    aueSetCheckboxValues(userEditSkillsList, profile.skills || []);
    aueSetCheckboxValues(userEditPersonalityList, profile.personality || []);

    // Languages (dynamic rows)
    if (userEditLangList) userEditLangList.innerHTML = '';
    const langs = Array.isArray(profile.languages) ? profile.languages : [];
    if (langs.length) {
      langs.forEach(l => {
        const lang = typeof l === 'string' ? l : (l.language || '');
        const lvl = typeof l === 'object' ? (l.level || '') : '';
        aueAddLangRow(lang, lvl);
      });
    } else {
      if (userEditLangList) userEditLangList.innerHTML = '<p style="color:#999;font-style:italic;font-size:13px;margin:0;">No languages added yet</p>';
    }

    // Profile Links (dynamic rows)
    if (userEditLinksList) userEditLinksList.innerHTML = '';
    const links = Array.isArray(profile.profileLinks) ? profile.profileLinks : [];
    if (links.length) {
      links.forEach(link => aueAddLinkRow(link));
    } else {
      if (userEditLinksList) userEditLinksList.innerHTML = '<p style="color:#999;font-style:italic;font-size:13px;margin:0;">No profile links added yet</p>';
    }

    userEditModal.classList.add('open');
    userEditModal.setAttribute('aria-hidden', 'false');
  }

  function closeUserEditModal() {
    if (!userEditModal) return;
    userEditModal.classList.remove('open');
    userEditModal.setAttribute('aria-hidden', 'true');
    
    // Reset uploaded profile picture
    uploadedProfilePicture = null;
    
    // Reset profile picture preview
    if (userEditProfilePicturePreview) {
      userEditProfilePicturePreview.style.display = 'none';
      userEditProfilePicturePreview.src = '';
    }
    if (userEditProfilePicturePlaceholder) {
      userEditProfilePicturePlaceholder.style.display = 'flex';
    }
    if (userEditProfilePictureInput) {
      userEditProfilePictureInput.value = '';
    }
  }

  if (userEditCloseBtn) userEditCloseBtn.addEventListener('click', closeUserEditModal);
  if (userEditModal) {
    userEditModal.addEventListener('click', e => {
      if (e.target === userEditModal) return;
    });
  }

  // ── Save ──
  if (userEditSaveBtn) {
    userEditSaveBtn.addEventListener('click', async () => {
      if (!currentEditingUserId) return;
      if (!window.RJGDb || !window.RJGDb.adminUpdateUserProfile) {
        if (window.showAppToast) window.showAppToast('Update function not available', 'error');
        return;
      }

      // Get current user data to determine type
      const currentUser = currentEditingUser;
      const userRole = currentUser.role || 'seeker';
      const isRecruiter = userRole === 'recruiter' || userRole === 'Recruiter' || userRole === 'employer';

      console.log('DEBUG SAVE: User Role:', userRole, 'Is Recruiter:', isRecruiter, 'Current User:', currentUser);

      // Validation based on user type
      if (isRecruiter) {
        console.log('DEBUG: Entering recruiter validation logic');
        // Recruiter validation: Company name, contact, address, profile links
        const recruiterCompanySection = document.getElementById('adminUserEditCompanySection');
        const companyField = recruiterCompanySection ?
          recruiterCompanySection.querySelector('#adminUserEditFirstName') :
          userEditFirstName;
        console.log('DEBUG: Company name field element:', companyField);
        console.log('DEBUG: Company name field value (raw):', companyField?.value);
        const companyName = companyField?.value.trim();
        console.log('DEBUG: Company name value (trimmed):', companyName);
        
        // Get phone from the recruiter contact section (visible field)
        const recruiterContactSection = document.getElementById('adminUserEditContactSection');
        const phone = recruiterContactSection ? 
          recruiterContactSection.querySelector('#adminUserEditPhone')?.value.trim() : 
          userEditPhone?.value.trim();
        console.log('DEBUG: Phone value:', phone);
        
        const street = userEditAddressStreet?.value.trim();
        const region = userEditAddressRegion?.value;
        const province = userEditAddressProvince?.value;
        const city = userEditAddressCity?.value;
        const barangay = userEditAddressBarangay?.value;

        if (!companyName) {
          console.log('DEBUG: Company name validation failed');
          if (window.showAppToast) window.showAppToast('Company name is required for recruiters', 'warning');
          return;
        }
        if (!phone) {
          if (window.showAppToast) window.showAppToast('Contact number is required for recruiters', 'warning');
          return;
        }
        if (phone.length !== 11 || !/^[0-9]{11}$/.test(phone)) {
          if (window.showAppToast) window.showAppToast('Contact number must be exactly 11 numbers', 'warning');
          return;
        }
        // Validate all address fields for recruiters
        const unitNo = userEditAddressUnitNo?.value.trim();
        const zip = userEditAddressZip?.value.trim();
        const country = userEditAddressCountry?.value.trim();
        
        if (!unitNo || !street || !region || !province || !city || !barangay || !zip || !country) {
          if (window.showAppToast) window.showAppToast('All address fields are required (Unit/No, Street, Region, Province, City, Barangay, ZIP, Country)', 'warning');
          return;
        }
        
        // Validate region, province, city, barangay are not default selections
        if (region === "" || province === "" || city === "" || barangay === "" || barangay === "Select Barangay") {
          if (window.showAppToast) window.showAppToast('Please select valid options for Region, Province, City, and Barangay', 'warning');
          return;
        }

        // Check if at least one profile link exists
        const linksList = document.getElementById('adminUserEditLinksList');
        const linkInputs = linksList ? linksList.querySelectorAll('input[type="text"]') : [];
        const hasValidLink = Array.from(linkInputs).some(input => input.value.trim());
        
        if (!hasValidLink) {
          if (window.showAppToast) window.showAppToast('At least one profile link is required for recruiters', 'warning');
          return;
        }

      } else {
        // Seeker validation: All fields except middle name and suffix are required
        const lastName = userEditLastName?.value.trim();
        const firstName = userEditFirstName?.value.trim();
        // Get phone from the seeker personal info section (visible field)
        const seekerPersonalSection = document.getElementById('adminUserEditPersonalInfoSection');
        const phone = seekerPersonalSection ? 
          seekerPersonalSection.querySelector('#adminUserEditPhone')?.value.trim() : 
          userEditPhone?.value.trim();
        const sex = userEditSex?.value;
        const birthDate = userEditBirthDate?.value;
        const educationStatus = userEditEducationStatus?.value;
        
        // Address fields for seekers
        const street = userEditAddressStreet?.value.trim();
        const region = userEditAddressRegion?.value;
        const province = userEditAddressProvince?.value;
        const city = userEditAddressCity?.value;
        const barangay = userEditAddressBarangay?.value;

        if (!lastName || !firstName) {
          if (window.showAppToast) window.showAppToast('First name and last name are required for seekers', 'warning');
          return;
        }
        if (!phone) {
          if (window.showAppToast) window.showAppToast('Contact number is required for seekers', 'warning');
          return;
        }
        if (phone.length !== 11 || !/^[0-9]{11}$/.test(phone)) {
          if (window.showAppToast) window.showAppToast('Contact number must be exactly 11 numbers', 'warning');
          return;
        }
        if (!sex) {
          if (window.showAppToast) window.showAppToast('Sex is required for seekers', 'warning');
          return;
        }
        if (!birthDate) {
          if (window.showAppToast) window.showAppToast('Birth date is required for seekers', 'warning');
          return;
        }
        if (!educationStatus) {
          if (window.showAppToast) window.showAppToast('Education status is required for seekers', 'warning');
          return;
        }

        // Validate all address fields for seekers
        const unitNo = userEditAddressUnitNo?.value.trim();
        const zip = userEditAddressZip?.value.trim();
        const country = userEditAddressCountry?.value.trim();
        
        if (!unitNo || !street || !region || !province || !city || !barangay || !zip || !country) {
          if (window.showAppToast) window.showAppToast('All address fields are required (Unit/No, Street, Region, Province, City, Barangay, ZIP, Country)', 'warning');
          return;
        }
        
        // Validate region, province, city, barangay are not default selections
        if (region === "" || province === "" || city === "" || barangay === "" || barangay === "Select Barangay") {
          if (window.showAppToast) window.showAppToast('Please select valid options for Region, Province, City, and Barangay', 'warning');
          return;
        }

        // Validate age (must be at least 15)
        const selectedDate = new Date(birthDate);
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 15);
        if (selectedDate > minDate) {
          if (window.showAppToast) window.showAppToast('User must be at least 15 years old.', 'warn');
          return;
        }

        // Validate description is required for seekers
        const description = userEditDescription?.value.trim();
        if (!description) {
          if (window.showAppToast) window.showAppToast('Description is required for seekers', 'warning');
          return;
        }

        // Validate skills are required for seekers
        const selectedSkills = aueGetCheckedValues(userEditSkillsList);
        if (!selectedSkills || selectedSkills.length === 0) {
          if (window.showAppToast) window.showAppToast('At least one skill is required for seekers', 'warning');
          return;
        }

        // Validate personality traits are required for seekers
        const selectedPersonality = aueGetCheckedValues(userEditPersonalityList);
        if (!selectedPersonality || selectedPersonality.length === 0) {
          if (window.showAppToast) window.showAppToast('At least one personality trait is required for seekers', 'warning');
          return;
        }

        // Validate languages are required for seekers
        if (userEditLangList) {
          const langRows = userEditLangList.querySelectorAll('.aue-lang-row');
          if (langRows.length === 0) {
            if (window.showAppToast) window.showAppToast('At least one language is required for seekers', 'warning');
            return;
          }
          
          let hasValidLanguage = false;
          langRows.forEach(row => {
            const sel = row.querySelector('.aue-lang-select');
            const custom = row.querySelector('.aue-lang-custom');
            const lvl = row.querySelector('.aue-level-select');
            let language = sel ? sel.value : '';
            if (language === 'Other' && custom) language = custom.value.trim();
            const level = lvl ? lvl.value : '';
            if (language && level) hasValidLanguage = true;
          });
          
          if (!hasValidLanguage) {
            if (window.showAppToast) window.showAppToast('At least one complete language entry (language + level) is required for seekers', 'warning');
            return;
          }
        }

        // Validate work experience is required for seekers
        if (aueWorkExperiences.length === 0) {
          if (window.showAppToast) window.showAppToast('At least one work experience is required for seekers', 'warning');
          return;
        }

        // Validate education is required for seekers
        if (aueEducationBackgrounds.length === 0) {
          if (window.showAppToast) window.showAppToast('At least one education background is required for seekers', 'warning');
          return;
        }

        // Validate profile links are required for seekers
        const linksList = document.getElementById('adminUserEditLinksList');
        const linkInputs = linksList ? linksList.querySelectorAll('input[type="text"]') : [];
        const hasValidLink = Array.from(linkInputs).some(input => input.value.trim());
        
        if (!hasValidLink) {
          if (window.showAppToast) window.showAppToast('At least one profile link is required for seekers', 'warning');
          return;
        }
      }

      const updates = {};
      if (userEditName) updates.full_name = userEditName.value.trim();
      if (userEditPhone) updates.phone = userEditPhone.value.trim();
      // Conditional field updates based on user type
      if (isRecruiter) {
        // Recruiter: first_name stores company name, last_name is null
        // Get company name from the recruiter company section (visible field)
        const recruiterCompanySection = document.getElementById('adminUserEditCompanySection');
        console.log('DEBUG: Recruiter company section found:', !!recruiterCompanySection);
        const companyField = recruiterCompanySection ? 
          recruiterCompanySection.querySelector('#adminUserEditFirstName') : 
          userEditFirstName;
        console.log('DEBUG: Company field from recruiter section:', companyField);
        console.log('DEBUG: Company field value direct:', companyField?.value);
        const companyName = companyField?.value.trim() || '';
        console.log('DEBUG: Company name after trim:', companyName);
        updates.first_name = companyName;
        console.log('DEBUG: Recruiter save - Final company name to save:', companyName);
        updates.last_name = null; // Always null for recruiters
        updates.middle_name = null;
        updates.suffix = null;
        // Recruiters don't need sex, birth_date, education_status, description
        updates.sex = null;
        updates.birth_date = null;
        updates.education_status_code = null;
        updates.description = null;
        
        console.log('DEBUG: Recruiter save - Company Name:', companyName, 'Setting first_name:', companyName, 'last_name: null');
      } else {
        // Seeker: normal name fields with company name handling
        const firstName = userEditFirstName?.value.trim() || '';
        const lastName = userEditLastName?.value.trim() || '';
        
        // If first name looks like a company name (no last name or last_name is empty/null), set last_name to null
        if (firstName && (!lastName || lastName === '')) {
          updates.first_name = firstName;
          updates.last_name = null; // Company name scenario
          console.log('DEBUG: Company name detected for seeker, setting last_name to null');
        } else {
          updates.first_name = firstName;
          updates.last_name = lastName;
        }
        
        updates.middle_name = userEditMiddleName?.value.trim() || '';
        updates.suffix = userEditSuffix?.value.trim() || '';
        updates.sex = userEditSex?.value || null;
        updates.birth_date = userEditBirthDate?.value || null;
        updates.education_status_code = userEditEducationStatus?.value || null;
        updates.description = userEditDescription?.value.trim() || '';
      }

      // Common fields for both types
      updates.phone = userEditPhone?.value.trim() || '';

      // Address - store human-readable names instead of PSGC codes
      updates.address = {
        unitNo: userEditAddressUnitNo ? userEditAddressUnitNo.value.trim() : '',
        street: userEditAddressStreet ? userEditAddressStreet.value.trim() : '',
        barangay: userEditAddressBarangay ? userEditAddressBarangay.options[userEditAddressBarangay.selectedIndex]?.text.trim() : '',
        city: userEditAddressCity ? userEditAddressCity.options[userEditAddressCity.selectedIndex]?.text.trim() : '',
        province: userEditAddressProvince ? userEditAddressProvince.options[userEditAddressProvince.selectedIndex]?.text.trim() : '',
        region: userEditAddressRegion ? userEditAddressRegion.options[userEditAddressRegion.selectedIndex]?.text.trim() : '',
        country: userEditAddressCountry ? userEditAddressCountry.value.trim() : 'Philippines',
        zip: userEditAddressZip ? userEditAddressZip.value.trim() : ''
      };

      // Work Experiences
      updates.work_experiences = aueWorkExperiences.slice();

      // Education Backgrounds
      updates.education_backgrounds = aueEducationBackgrounds.slice();

      // Skills & Personality
      updates.skills = aueGetCheckedValues(userEditSkillsList);
      updates.personality = aueGetCheckedValues(userEditPersonalityList);

      // Languages (read from dynamic rows)
      if (userEditLangList) {
        const langRows = userEditLangList.querySelectorAll('.aue-lang-row');
        const langArr = [];
        langRows.forEach(row => {
          const sel = row.querySelector('.aue-lang-select');
          const custom = row.querySelector('.aue-lang-custom');
          const lvl = row.querySelector('.aue-level-select');
          let language = sel ? sel.value : '';
          if (language === 'Other' && custom) language = custom.value.trim();
          const level = lvl ? lvl.value : '';
          if (language) langArr.push({ language, level });
        });
        updates.languages = langArr;
      }

      // Profile Links (read from dynamic rows)
      if (userEditLinksList) {
        const linkInputs = userEditLinksList.querySelectorAll('.aue-link-input');
        updates.profile_links = Array.from(linkInputs).map(inp => inp.value.trim()).filter(Boolean);
      }

      userEditSaveBtn.disabled = true;
      userEditSaveBtn.textContent = 'Saving...';
      
      // Upload profile picture if one was selected
      if (uploadedProfilePicture) {
        console.log('DEBUG: Uploading profile picture for user:', currentEditingUserId);
        try {
          const avatarUrl = await window.RJGDb.adminUploadProfileImage(currentEditingUserId, uploadedProfilePicture);
          console.log('DEBUG: Profile picture uploaded, URL:', avatarUrl);
          updates.avatar_url = avatarUrl;
        } catch (uploadErr) {
          console.error('Error uploading profile picture:', uploadErr);
          const uploadMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(uploadErr, 'Profile picture upload failed. Please try again.')) || 'Profile picture upload failed. Please try again.';
          if (window.showAppToast) window.showAppToast(uploadMsg, 'error');
          userEditSaveBtn.disabled = false;
          userEditSaveBtn.textContent = 'Save Changes';
          return;
        }
      }
      
      console.log('DEBUG: Sending to database - User ID:', currentEditingUserId);
      console.log('DEBUG: Sending to database - Updates object:', updates);
      
      try {
        console.log('DEBUG: About to call adminUpdateUserProfile with:', currentEditingUserId, updates);
        const result = await window.RJGDb.adminUpdateUserProfile(currentEditingUserId, updates);
        console.log('DEBUG: Database save result:', result);
        console.log('DEBUG: Database save successful, result type:', typeof result);
        
        if (!result) {
          console.error('DEBUG: Database save returned null/undefined');
          if (window.showAppToast) window.showAppToast('Save failed: No response from database', 'error');
          return;
        }
        
        if (window.showAppToast) window.showAppToast('User profile updated successfully', 'success');
        closeUserEditModal();
        closeUserReview();
        await renderUserList();
      } catch (err) {
        console.error('Failed to update user:', err);
        const updateMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to update user. Please try again.')) || 'Unable to update user. Please try again.';
        if (window.showAppToast) window.showAppToast(updateMsg, 'error');
      } finally {
        userEditSaveBtn.disabled = false;
        userEditSaveBtn.textContent = 'Save Changes';
      }
    });
  }

  // Admin User Change Modal Functions
  let currentChangeType = null; // 'email' or 'password'

  function openAdminUserChangeModal(type) {
    if (!adminUserChangeModal || !currentEditingUserId) return;
    
    currentChangeType = type;
    
    // Reset form
    adminUserChangeForm.reset();
    adminUserChangeEmailRow.style.display = 'none';
    adminUserChangePasswordRow.style.display = 'none';
    adminUserChangeConfirmPasswordRow.style.display = 'none';
    adminPasswordStrength.style.display = 'none';
    adminUserChangeSubmitBtn.disabled = true;
    
    // Configure modal based on type
    if (type === 'email') {
      adminUserChangeTitle.textContent = 'Change User Email';
      adminUserChangeText.textContent = `Update the email address for ${currentEditingUser?.name || currentEditingUser?.email || 'this user'}.`;
      adminUserChangeEmailRow.style.display = 'flex';
    } else if (type === 'password') {
      adminUserChangeTitle.textContent = 'Change User Password';
      adminUserChangeText.textContent = `Reset the password for ${currentEditingUser?.name || currentEditingUser?.email || 'this user'}.`;
      adminUserChangePasswordRow.style.display = 'flex';
      adminUserChangeConfirmPasswordRow.style.display = 'flex';
      adminPasswordStrength.style.display = 'block';
    }
    
    adminUserChangeModal.classList.remove('hidden');
    adminUserChangeModal.setAttribute('aria-hidden', 'false');
  }

  function closeAdminUserChangeModal() {
    if (!adminUserChangeModal) return;
    adminUserChangeModal.classList.add('hidden');
    adminUserChangeModal.setAttribute('aria-hidden', 'true');
    currentChangeType = null;
  }

  function openAdminUserOtpModal() {
    if (!adminUserOtpModal) return;
    adminUserOtpForm.reset();
    adminUserOtpSubmitBtn.disabled = true;
    adminUserOtpModal.classList.remove('hidden');
    adminUserOtpModal.setAttribute('aria-hidden', 'false');
  }

  function closeAdminUserOtpModal() {
    if (!adminUserOtpModal) return;
    adminUserOtpModal.classList.add('hidden');
    adminUserOtpModal.setAttribute('aria-hidden', 'true');
  }

  function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    return strength;
  }

  function updatePasswordStrength(password) {
    const strength = checkPasswordStrength(password);
    adminPasswordStrengthBar.className = 'password-strength-bar';
    
    if (strength <= 1) {
      adminPasswordStrengthBar.classList.add('weak');
    } else if (strength === 2) {
      adminPasswordStrengthBar.classList.add('medium');
    } else {
      adminPasswordStrengthBar.classList.add('strong');
    }
  }

  // Change Email with modal
  if (userChangeEmailBtn) {
    userChangeEmailBtn.addEventListener('click', () => {
      openAdminUserChangeModal('email');
    });
  }

  // Change Password with modal
  if (userChangePasswordBtn) {
    userChangePasswordBtn.addEventListener('click', () => {
      openAdminUserChangeModal('password');
    });
  }

  // Admin User Change Modal Event Handlers
  if (adminUserChangeCloseBtn) {
    adminUserChangeCloseBtn.addEventListener('click', closeAdminUserChangeModal);
  }

  if (adminUserChangeCancelBtn) {
    adminUserChangeCancelBtn.addEventListener('click', closeAdminUserChangeModal);
  }

  // Form validation
  if (adminUserChangeEmailInput) {
    adminUserChangeEmailInput.addEventListener('input', () => {
      const isValid = adminUserChangeEmailInput.checkValidity() && adminUserChangeEmailInput.value.trim() !== '';
      adminUserChangeSubmitBtn.disabled = !isValid;
    });
  }

  if (adminUserChangePasswordInput) {
    adminUserChangePasswordInput.addEventListener('input', () => {
      const password = adminUserChangePasswordInput.value;
      const confirmPassword = adminUserChangeConfirmPasswordInput.value;
      
      updatePasswordStrength(password);
      
      const isValid = password.length >= 8 && password === confirmPassword;
      adminUserChangeSubmitBtn.disabled = !isValid;
    });
  }

  if (adminUserChangeConfirmPasswordInput) {
    adminUserChangeConfirmPasswordInput.addEventListener('input', () => {
      const password = adminUserChangePasswordInput.value;
      const confirmPassword = adminUserChangeConfirmPasswordInput.value;
      
      const isValid = password.length >= 8 && password === confirmPassword;
      adminUserChangeSubmitBtn.disabled = !isValid;
    });
  }

  // Form submission
  if (adminUserChangeForm) {
    adminUserChangeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!currentEditingUserId || !currentChangeType) return;
      
      try {
        if (currentChangeType === 'email') {
          const newEmail = adminUserChangeEmailInput.value.trim();
          
          if (window.RJGDb && typeof window.RJGDb.adminUpdateUserEmail === 'function') {
            await window.RJGDb.adminUpdateUserEmail(currentEditingUserId, newEmail);
            if (window.showAppToast) window.showAppToast('Email updated successfully', 'success');
            closeAdminUserChangeModal();
            // Update displayed email
            if (userReviewEmail) userReviewEmail.textContent = newEmail;
            await renderUserList();
            closeUserReview();
          } else {
            if (window.showAppToast) window.showAppToast('Database function not available', 'error');
          }
        } else if (currentChangeType === 'password') {
          const newPassword = adminUserChangePasswordInput.value;
          
          if (window.RJGDb && typeof window.RJGDb.adminUpdateUserPassword === 'function') {
            await window.RJGDb.adminUpdateUserPassword(currentEditingUserId, newPassword);
            if (window.showAppToast) window.showAppToast('Password updated successfully', 'success');
            closeAdminUserChangeModal();
            closeUserReview();
          } else {
            if (window.showAppToast) window.showAppToast('Database function not available', 'error');
          }
        }
      } catch (error) {
        console.error('Failed to update user:', error);
        if (window.showAppToast) window.showAppToast('Failed to update user', 'error');
      }
    });
  }

  // OTP Modal Event Handlers
  if (adminUserOtpCancelBtn) {
    adminUserOtpCancelBtn.addEventListener('click', closeAdminUserOtpModal);
  }

  if (adminUserOtpInput) {
    adminUserOtpInput.addEventListener('input', () => {
      const isValid = adminUserOtpInput.value.length === 6;
      adminUserOtpSubmitBtn.disabled = !isValid;
    });
  }

  if (adminUserOtpForm) {
    adminUserOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        // Handle OTP verification logic here
        if (window.showAppToast) window.showAppToast('Account updated successfully', 'success');
        closeAdminUserOtpModal();
        closeAdminUserChangeModal();
        closeUserReview();
      } catch (error) {
        console.error('Failed to verify OTP:', error);
        if (window.showAppToast) window.showAppToast('Failed to verify code', 'error');
      }
    });
  }

  if (adminUserResendOtpBtn) {
    adminUserResendOtpBtn.addEventListener('click', async () => {
      try {
        if (window.showAppToast) window.showAppToast('Verification code sent', 'info');
        adminUserResendOtpBtn.disabled = true;
        setTimeout(() => {
          adminUserResendOtpBtn.disabled = false;
        }, 30000);
      } catch (error) {
        console.error('Failed to resend OTP:', error);
        if (window.showAppToast) window.showAppToast('Failed to resend code', 'error');
      }
    });
  }

  if (userViewImageBtn) {
    userViewImageBtn.addEventListener('click', () => {
      const imageUrl = userReviewImage && userReviewImage.src ? userReviewImage.src : '';
      if (imageUrl) {
        const modal = document.getElementById('adminJobImageModal');
        const preview = document.getElementById('adminJobImagePreview');
        const empty = document.getElementById('adminJobImageEmpty');
        const title = document.getElementById('adminJobImageTitle');
        if (!modal || !preview || !empty) return;
        preview.hidden = false;
        preview.style.display = 'block';
        preview.alt = 'User profile image preview';
        preview.src = imageUrl;
        preview.onerror = () => {
          preview.style.display = 'none';
          empty.textContent = 'Image failed to load.';
          empty.hidden = false;
          empty.style.display = '';
        };
        if (title) title.textContent = 'User Profile Image';
        empty.hidden = true;
        empty.style.display = 'none';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  function openReportReview(report) {
    if (!reportReviewModal || !report) return;
    activeReportReviewId = String(report.id || '');
    currentReviewedReportResumeImage = null;
    console.log('Opening report review:', report);
    if (reportReviewTitle) reportReviewTitle.textContent = `Reported for "${report.type || 'Type of Report'}"`;
    if (reportReviewReportedBy) reportReviewReportedBy.textContent = report.reportedBy || report.name || '—';
    if (reportReviewInfoLabel) {
      reportReviewInfoLabel.textContent = report.kind === 'job' ? 'Job Info:' : 'Resume Info:';
    }
    if (reportReviewBody) {
      if (report.kind === 'job') {
        const jobRef = String(report.reference || '');
        const matchedJob = report.snapshot && typeof report.snapshot === 'object'
          ? report.snapshot
          : findJobFromReportReference(jobRef);
        currentReviewedReportJob = matchedJob || null;
        const info = matchedJob
          ? buildFullJobInfoText(matchedJob)
          : [
              `Reported By: ${report.name || '—'}`,
              `Created: ${report.created || '—'}`,
              `Reference: ${report.reference || '—'}`,
              ``,
              `${report.description || 'No details.'}`
            ].join('\n');
        reportReviewBody.textContent = info;
      } else {
        currentReviewedReportJob = null;
        console.log('Processing resume report, snapshot:', report.snapshot);
        console.log('Report object keys:', Object.keys(report));
        const profile = resolveReportedResumeProfile(report);
        console.log('Resolved profile:', profile);
        console.log('All profile keys:', Object.keys(profile || {}));
        console.log('Profile validId:', profile?.validId);
        console.log('Profile validCert:', profile?.validCert);
        console.log('Profile id_url:', profile?.id_url);
        console.log('Profile cert_url:', profile?.cert_url);
        console.log('Profile id_status:', profile?.id_status);
        console.log('Profile cert_status:', profile?.cert_status);
        const resumeText = buildFullResumeInfoText(profile, report);
        reportReviewBody.innerHTML = resumeText.replace(/\[View ID\]/g, `<button type="button" class="report-view-document-btn" onclick="showImageModal('${profile.validId?.url || ''}')" style="margin-left: 8px; padding: 2px 8px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">View ID</button>`).replace(/\[View Certificate\]/g, `<button type="button" class="report-view-document-btn" onclick="showImageModal('${profile.validCert?.url || ''}')" style="margin-left: 8px; padding: 2px 8px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">View Certificate</button>`);
        currentReviewedReportResumeImage = profile && profile.avatarUrl ? profile.avatarUrl : null;
        console.log('Resume image URL:', currentReviewedReportResumeImage);
      }
    }
    if (reportReviewImageBtn) {
      if (report.kind === 'job') {
        reportReviewImageBtn.hidden = false;
        reportReviewImageBtn.disabled = false;
        reportReviewImageBtn.textContent = 'View Job Image';
      } else if (report.kind === 'resume' && currentReviewedReportResumeImage) {
        reportReviewImageBtn.hidden = false;
        reportReviewImageBtn.disabled = false;
        reportReviewImageBtn.textContent = 'View Resume Image';
      } else {
        reportReviewImageBtn.hidden = true;
        reportReviewImageBtn.disabled = true;
      }
    }
    if (reportReviewActions) reportReviewActions.hidden = false;
    if (reportRemoveBanBtn) reportRemoveBanBtn.hidden = report.kind !== 'job';
    if (reportRemoveJobBtn) reportRemoveJobBtn.hidden = report.kind !== 'job';
    const banUserBtn = document.getElementById('adminReportBanUserBtn');
    if (banUserBtn) banUserBtn.hidden = report.kind !== 'resume';
    reportReviewModal.classList.add('open');
    reportReviewModal.setAttribute('aria-hidden', 'false');
  }

  function resolveReportedResumeProfile(report) {
    if (!report || typeof report !== 'object') return null;
    const snapshot = report.snapshot && typeof report.snapshot === 'object' ? report.snapshot : null;
    if (!snapshot) return null;
    if (snapshot.resumeProfile && typeof snapshot.resumeProfile === 'object') {
      return snapshot.resumeProfile;
    }
    return snapshot;
  }

  function buildFullResumeInfoText(profile, report) {
    if (!profile || typeof profile !== 'object') {
      return [
        `Reported By: ${report.name || '—'}`,
        `Created: ${report.created || '—'}`,
        `Reference: ${report.reference || '—'}`,
        '',
        'No resume snapshot available for this report.'
      ].join('\n');
    }
    const address = formatAddress(profile.address);
    const work = formatList(profile.workExperiences, workEntry => {
      const position = workEntry.positionName || workEntry.position || '';
      const company = workEntry.companyName || workEntry.company || '';
      const years = [workEntry.startYear, workEntry.endYear].filter(Boolean).join(' - ');
      return [position, company, years].filter(Boolean).join(' | ');
    });
    const education = formatList(profile.educationBackgrounds, edu => {
      const level = edu.educationLevel || '';
      const school = edu.schoolName || '';
      const program = edu.program || '';
      return [level, school, program].filter(Boolean).join(' | ');
    });
    const languages = formatList(profile.languages, lang => `${lang.language || ''} - ${lang.level || ''}`);
    // Add valid documents information with view buttons
    const validId = profile.validId && profile.validId.url ? 
      `Valid ID: Available (${profile.validId.type || 'ID'}) - Status: ${profile.validId.status || 'unknown'} [View ID]` : 
      'Valid ID: Not uploaded';
    
    const validCert = profile.validCert && profile.validCert.url ? 
      `Valid Certificate: Available (${profile.validCert.type || 'Certificate'}) - Status: ${profile.validCert.status || 'unknown'} [View Certificate]` : 
      'Valid Certificate: Not uploaded';

    return [
      `Name: ${profile.name || report.name || '—'}`,
      `Email: ${profile.email || report.reportedEmail || '—'}`,
      `Phone: ${profile.phone || '—'}`,
      `Address: ${address}`,
      `Sex: ${profile.sex || '—'}`,
      `Birth Date: ${profile.birthDate || '—'}`,
      `Education Status: ${profile.educationStatus || '—'}`,
      `Skills: ${formatList(profile.skills)}`,
      `Languages: ${languages}`,
      `Personality: ${formatList(profile.personality)}`,
      `Profile Links: ${formatList(profile.profileLinks)}`,
      `Work Experience: ${work}`,
      `Education Background: ${education}`,
      '',
      `Valid Documents:`,
      `  ${validId}`,
      `  ${validCert}`,
      '',
      `Description: ${profile.description || 'No description.'}`
    ].join('\n');
  }

  function closeReportReview() {
    if (!reportReviewModal) return;
    activeReportReviewId = '';
    currentReviewedReportJob = null;
    currentReviewedReportResumeImage = null;
    reportReviewModal.classList.remove('open');
    reportReviewModal.setAttribute('aria-hidden', 'true');
  }

  if (reportReviewCloseBtn) reportReviewCloseBtn.addEventListener('click', closeReportReview);
  if (reportReviewModal) {
    reportReviewModal.addEventListener('click', e => {
      if (e.target === reportReviewModal) return;
    });
  }

  if (reportReviewImageBtn) {
    reportReviewImageBtn.addEventListener('click', () => {
      if (currentReviewedReportJob) {
        openJobImagePreview(currentReviewedReportJob);
      } else if (currentReviewedReportResumeImage) {
        openReportImagePreview(currentReviewedReportResumeImage);
      }
    });
  }

  async function openReportImagePreview(imageUrl) {
    console.log('openReportImagePreview called with:', imageUrl);
    const modal = document.getElementById('adminJobImageModal');
    const preview = document.getElementById('adminJobImagePreview');
    const empty = document.getElementById('adminJobImageEmpty');
    const title = document.getElementById('adminJobImageTitle');
    if (!modal || !preview || !empty) {
      console.error('Missing elements for image preview');
      return;
    }
    let src = imageUrl || '';
    if (!src) {
      preview.hidden = true;
      preview.removeAttribute('src');
      preview.alt = '';
      modal.setAttribute('aria-labelledby', 'adminJobImageTitle');
      if (title) title.textContent = 'Resume Image';
      empty.textContent = 'No Image Uploaded';
      empty.hidden = false;
    } else {
      preview.hidden = false;
      preview.alt = 'Resume image preview';
      preview.style.display = 'block';
      preview.onerror = () => {
        console.error('Image failed to load:', src);
        preview.style.display = 'none';
        empty.textContent = 'Image failed to load.';
        empty.hidden = false;
        empty.style.display = 'block';
      };
      preview.onload = () => {
        console.log('Image loaded successfully, naturalWidth:', preview.naturalWidth, 'naturalHeight:', preview.naturalHeight);
      };
      preview.src = src;
      if (title) title.textContent = 'Resume Image';
      empty.hidden = true;
      empty.style.display = 'none';
    }
    console.log('After modifications - preview.hidden:', preview.hidden, 'preview.src:', preview.src, 'preview.style.display:', preview.style.display, 'empty.hidden:', empty.hidden);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  async function openJobImagePreview(job) {
    if (!jobImageModal || !jobImagePreview || !jobImageEmpty) return;
    let src = jobImageSource(job);
    if (src && window.RJGDb && typeof window.RJGDb.getJobImageUrl === 'function') {
      try {
        const resolved = await window.RJGDb.getJobImageUrl(src);
        if (resolved) {
          src = resolved;
          if (job && typeof job === 'object') {
            job.image = resolved;
            job.imageUrl = resolved;
          }
        }
      } catch (e) {
        // keep original src
      }
    }
    if (!src) {
      jobImagePreview.hidden = true;
      jobImagePreview.removeAttribute('src');
      jobImagePreview.alt = '';
      jobImageModal.setAttribute('aria-labelledby', 'adminJobImageTitle');
      const title = document.getElementById('adminJobImageTitle');
      if (title) title.textContent = 'Job Image';
      jobImageEmpty.textContent = 'No Image Uploaded';
      jobImageEmpty.hidden = false;
    } else {
      jobImagePreview.hidden = false;
      jobImagePreview.src = src;
      jobImagePreview.alt = 'Job image preview';
      const title = document.getElementById('adminJobImageTitle');
      if (title) title.textContent = 'Job Image';
      jobImageEmpty.hidden = true;
    }
    jobImageModal.classList.add('open');
    jobImageModal.setAttribute('aria-hidden', 'false');
  }

  function closeJobImagePreview() {
    if (!jobImageModal || !jobImagePreview) return;
    jobImageModal.classList.remove('open');
    jobImageModal.setAttribute('aria-hidden', 'true');
    jobImagePreview.removeAttribute('src');
  }

  if (reviewEditBtn) {
    reviewEditBtn.addEventListener('click', () => {
      if (!currentReviewedJob) return;
      openJobEditModal(currentReviewedJob);
    });
  }

  // Job Edit Modal Functions
  let currentEditingJobId = null;
  let currentEditingJob = null;
  let locationData = {};
  let pendingImageFile = null;
  const jobEditModal = document.getElementById('adminJobEditModal');
  const jobEditTitle = document.getElementById('adminJobEditTitle');
  const jobEditCategory = document.getElementById('adminJobEditCategory');
  const jobEditSchedule = document.getElementById('adminJobEditSchedule');
  const jobEditType = document.getElementById('adminJobEditType');
  const jobEditLocation = document.getElementById('adminJobEditLocation');
  const jobEditLocationBtn = document.getElementById('adminJobEditLocationBtn');
  const jobEditCurrency = document.getElementById('adminJobEditCurrency');
  const jobEditRateAmount = document.getElementById('adminJobEditRateAmount');
  const jobEditRateUnit = document.getElementById('adminJobEditRateUnit');
  const jobEditUrgent = document.getElementById('adminJobEditUrgent');
  const jobEditDescription = document.getElementById('adminJobEditDescription');
  const jobEditImagePreview = document.getElementById('adminJobEditImagePreview');
  const jobEditImageInput = document.getElementById('adminJobEditImageInput');
  const jobEditImageBtn = document.getElementById('adminJobEditImageBtn');
  const jobEditSkills = document.getElementById('adminJobEditSkills');
  const jobEditSkillsDisplay = document.getElementById('adminJobEditSkillsDisplay');
  const jobEditSkillsBtn = document.getElementById('adminJobEditSkillsBtn');
  const jobEditSaveBtn = document.getElementById('adminJobEditSaveBtn');
  const jobEditCloseBtn = document.getElementById('adminJobEditCloseBtn');

  // Job Skills Modal
  const jobSkillsModal = document.getElementById('adminJobSkillsModal');
  const jobSkillsList = document.getElementById('adminJobSkillsList');
  const jobSkillsSaveBtn = document.getElementById('adminJobSkillsSaveBtn');
  const jobSkillsCloseBtn = document.getElementById('adminJobSkillsCloseBtn');
  let selectedSkills = [];

  // Job Location Edit Modal
  const jobLocationModal = document.getElementById('adminJobLocationModal');
  const jobLocationUnit = document.getElementById('adminJobLocationUnit');
  const jobLocationStreet = document.getElementById('adminJobLocationStreet');
  const jobLocationRegion = document.getElementById('adminJobLocationRegion');
  const jobLocationProvince = document.getElementById('adminJobLocationProvince');
  const jobLocationCity = document.getElementById('adminJobLocationCity');
  const jobLocationBarangay = document.getElementById('adminJobLocationBarangay');
  const jobLocationCountry = document.getElementById('adminJobLocationCountry');
  const jobLocationZip = document.getElementById('adminJobLocationZip');
  const jobLocationSaveBtn = document.getElementById('adminJobLocationSaveBtn');
  const jobLocationCloseBtn = document.getElementById('adminJobLocationCloseBtn');

  function parseRate(rateText) {
    const raw = String(rateText || '');
    // Match patterns like "PHP 500/day" or "USD 1000/month"
    const match = raw.match(/^([A-Z]{3})\s+(\d+(?:\.\d+)?)\s*\/\s*(\w+)$/i);
    if (match) {
      return {
        currency: match[1].toUpperCase(),
        amount: parseFloat(match[2]),
        unit: match[3].toLowerCase()
      };
    }
    return { currency: 'PHP', amount: '', unit: 'hour' };
  }

  async function populateDropdownFromDB(selectElement, category, currentValue) {
    if (!selectElement || !window.RJGDb || !window.RJGDb.getDropdownOptions) return;
    
    try {
      const options = window.RJGDb.getDropdownOptions(category);
      if (!Array.isArray(options) || options.length === 0) return;
      
      // Save current value
      const current = currentValue || selectElement.value;
      
      // Clear and rebuild options (filter out is_other options)
      selectElement.innerHTML = '';
      const normalizedOptions = options.filter(opt => !opt.isOther);
      normalizedOptions.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.code;
          option.textContent = opt.label;
          selectElement.appendChild(option);
        });
      
      // Restore selection
      if (current) {
        // current may be a code or a label from loaded jobs; support both
        const byCode = normalizedOptions.find(opt => String(opt.code) === String(current));
        const byLabel = normalizedOptions.find(opt => String(opt.label).toLowerCase() === String(current).toLowerCase());
        selectElement.value = byCode ? byCode.code : (byLabel ? byLabel.code : selectElement.value);
      }
    } catch (e) {
      console.warn(`Failed to load ${category} dropdown:`, e);
    }
  }

  async function openJobEditModal(job) {
    if (!jobEditModal || !job) return;
    currentEditingJobId = job.id;
    currentEditingJob = job;
    pendingImageFile = null;

    // Ensure dropdown cache is loaded before reading options
    if (window.RJGDb && typeof window.RJGDb.ensureDropdownOptionCache === 'function' && typeof window.RJGDb.getClient === 'function') {
      try {
        const supa = window.RJGDb.getClient();
        if (supa) await window.RJGDb.ensureDropdownOptionCache(supa);
      } catch (e) {
        console.warn('Failed to warm dropdown option cache for edit modal:', e);
      }
    }
    
    // Populate dropdowns from DB first
    await Promise.all([
      populateDropdownFromDB(jobEditCategory, 'job_category', job.category),
      populateDropdownFromDB(jobEditSchedule, 'schedule', job.schedule),
      populateDropdownFromDB(jobEditType, 'work_setting', job.type),
      populateDropdownFromDB(jobEditCurrency, 'currency', null),
      populateDropdownFromDB(jobEditRateUnit, 'rate_unit', null)
    ]);
    
    if (jobEditTitle) jobEditTitle.value = job.title || '';
    
    // Parse and set rate fields
    const rate = parseRate(job.rate);
    if (jobEditCurrency) jobEditCurrency.value = rate.currency;
    if (jobEditRateAmount) jobEditRateAmount.value = rate.amount;
    if (jobEditRateUnit) jobEditRateUnit.value = rate.unit;
    
    // Store location data
    locationData = {
      street: job.street || '',
      barangay: job.barangay || '',
      city: job.city || '',
      province: job.province || '',
      country: job.country || 'Philippines',
      zip: job.zip || job.postalCode || ''
    };
    if (jobEditLocation) jobEditLocation.value = job.location || '';
    
    // Show image preview if exists
    if (jobEditImagePreview && job.image) {
      jobEditImagePreview.innerHTML = `<img src="${job.image}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 8px;">`;
      jobEditImagePreview.style.display = 'block';
    } else if (jobEditImagePreview) {
      jobEditImagePreview.style.display = 'none';
      jobEditImagePreview.innerHTML = '';
    }
    
    // Set skills
    if (jobEditSkills) {
      const skills = Array.isArray(job.skills) ? job.skills : [];
      jobEditSkills.value = skills.join(',');
    }
    updateSkillsDisplay();
    
    if (jobEditUrgent) jobEditUrgent.checked = !!job.urgent;
    if (jobEditDescription) jobEditDescription.value = job.description || '';
    
    jobEditModal.classList.add('open');
    jobEditModal.setAttribute('aria-hidden', 'false');
  }

  function closeJobEditModal() {
    if (!jobEditModal) return;
    currentEditingJobId = null;
    currentEditingJob = null;
    pendingImageFile = null;
    jobEditModal.classList.remove('open');
    jobEditModal.setAttribute('aria-hidden', 'true');
  }

  // ── PSGC API Cascading Location Logic for Admin Job Location ──
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

  // Numeric-only input validation for Unit and ZIP fields
  function enforceNumericOnly(input) {
    input.addEventListener('input', function() {
      // Remove any non-numeric characters
      this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    input.addEventListener('keypress', function(e) {
      // Prevent non-numeric keypresses
      const char = String.fromCharCode(e.which || e.keyCode);
      if (!/[0-9]/.test(char)) {
        e.preventDefault();
        return false;
      }
    });
    
    input.addEventListener('paste', function(e) {
      // Prevent pasting non-numeric content
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      const numericData = pasteData.replace(/[^0-9]/g, '');
      document.execCommand('insertText', false, numericData);
    });
  }

  // Initialize numeric validation for Unit field
  if (jobLocationUnit) {
    enforceNumericOnly(jobLocationUnit);
  }

  // Initialize numeric validation for ZIP field with 4-digit limit
  if (jobLocationZip) {
    enforceNumericOnly(jobLocationZip);
    
    // Enforce 4-digit maximum for ZIP
    jobLocationZip.addEventListener('input', function() {
      if (this.value.length > 4) {
        this.value = this.value.slice(0, 4);
      }
    });
  }

  async function loadAdminJobRegions() {
    const regions = await fetchPSGC("https://psgc.cloud/api/regions");
    if (!jobLocationRegion) return;
    
    // Sort regions by name
    regions.sort((a, b) => a.name.localeCompare(b.name));
    
    jobLocationRegion.innerHTML = '<option value="">Select Region</option>';
    regions.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.code;
      opt.textContent = r.name;
      jobLocationRegion.appendChild(opt);
    });
  }

  jobLocationRegion?.addEventListener("change", async () => {
    const regionCode = jobLocationRegion.value;
    jobLocationProvince.innerHTML = '<option value="">Select Province</option>';
    jobLocationCity.innerHTML = '<option value="">Select City</option>';
    jobLocationBarangay.innerHTML = '<option value="">Select Barangay</option>';
    
    jobLocationProvince.disabled = !regionCode;
    jobLocationCity.disabled = true;
    jobLocationBarangay.disabled = true;

    if (regionCode) {
      const provinces = await fetchPSGC(`https://psgc.cloud/api/regions/${regionCode}/provinces`);
      provinces.sort((a, b) => a.name.localeCompare(b.name));
      provinces.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.code;
        opt.textContent = p.name;
        jobLocationProvince.appendChild(opt);
      });
    }
  });

  jobLocationProvince?.addEventListener("change", async () => {
    const provinceCode = jobLocationProvince.value;
    jobLocationCity.innerHTML = '<option value="">Select City</option>';
    jobLocationBarangay.innerHTML = '<option value="">Select Barangay</option>';
    
    jobLocationCity.disabled = !provinceCode;
    jobLocationBarangay.disabled = true;

    if (provinceCode) {
      const cities = await fetchPSGC(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
      cities.sort((a, b) => a.name.localeCompare(b.name));
      cities.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.code;
        opt.textContent = c.name;
        jobLocationCity.appendChild(opt);
      });
    }
  });

  jobLocationCity?.addEventListener("change", async () => {
    const cityCode = jobLocationCity.value;
    jobLocationBarangay.innerHTML = '<option value="">Select Barangay</option>';
    
    jobLocationBarangay.disabled = !cityCode;

    if (cityCode) {
      const barangays = await fetchPSGC(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
      barangays.sort((a, b) => a.name.localeCompare(b.name));
      barangays.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.code;
        opt.textContent = b.name;
        jobLocationBarangay.appendChild(opt);
      });
    }
  });

  // Location Modal Functions
  function openJobLocationModal() {
    if (!jobLocationModal) return;
    
    // Load regions if not already loaded
    if (jobLocationRegion && jobLocationRegion.options.length <= 1) {
      loadAdminJobRegions();
    }
    
    if (jobLocationUnit) jobLocationUnit.value = locationData.unit || '';
    if (jobLocationStreet) jobLocationStreet.value = locationData.street || '';
    
    // Set cascading dropdown values by matching text
    if (locationData.region && jobLocationRegion) {
      for (let i = 0; i < jobLocationRegion.options.length; i++) {
        if (jobLocationRegion.options[i].text === locationData.region) {
          jobLocationRegion.value = jobLocationRegion.options[i].value;
          break;
        }
      }
    }
    
    if (locationData.province && jobLocationProvince) {
      // Load provinces first, then set value
      setTimeout(() => {
        for (let i = 0; i < jobLocationProvince.options.length; i++) {
          if (jobLocationProvince.options[i].text === locationData.province) {
            jobLocationProvince.value = jobLocationProvince.options[i].value;
            break;
          }
        }
        
        if (locationData.city && jobLocationCity) {
          // Load cities next, then set value
          setTimeout(() => {
            for (let i = 0; i < jobLocationCity.options.length; i++) {
              if (jobLocationCity.options[i].text === locationData.city) {
                jobLocationCity.value = jobLocationCity.options[i].value;
                break;
              }
            }
            
            if (locationData.barangay && jobLocationBarangay) {
              // Load barangays last, then set value
              setTimeout(() => {
                for (let i = 0; i < jobLocationBarangay.options.length; i++) {
                  if (jobLocationBarangay.options[i].text === locationData.barangay) {
                    jobLocationBarangay.value = jobLocationBarangay.options[i].value;
                    break;
                  }
                }
              }, 500);
            }
          }, 500);
        }
      }, 500);
    }
    
    if (jobLocationCountry) jobLocationCountry.value = locationData.country || 'Philippines';
    if (jobLocationZip) jobLocationZip.value = locationData.zip || '';
    jobLocationModal.classList.add('open');
    jobLocationModal.setAttribute('aria-hidden', 'false');
  }

  function closeJobLocationModal() {
    if (!jobLocationModal) return;
    jobLocationModal.classList.remove('open');
    jobLocationModal.setAttribute('aria-hidden', 'true');
  }

  if (jobEditLocationBtn) {
    jobEditLocationBtn.addEventListener('click', openJobLocationModal);
  }

  if (jobLocationSaveBtn) {
    jobLocationSaveBtn.addEventListener('click', () => {
      // Get selected text from dropdowns
      const region = jobLocationRegion?.options[jobLocationRegion.selectedIndex]?.text || '';
      const province = jobLocationProvince?.options[jobLocationProvince.selectedIndex]?.text || '';
      const city = jobLocationCity?.options[jobLocationCity.selectedIndex]?.text || '';
      const barangay = jobLocationBarangay?.options[jobLocationBarangay.selectedIndex]?.text || '';
      
      // Validate that all location fields are selected
      if (!region || !province || !city || !barangay || barangay === "Select Barangay") {
        if (window.showAppToast) {
          window.showAppToast("Please complete all location fields: Region, Province, City, and Barangay are required.", "warning");
        } else {
          console.warn("Location validation failed: Missing required fields");
        }
        return;
      }
      
      locationData = {
        unit: jobLocationUnit?.value || '',
        street: jobLocationStreet?.value || '',
        region: region,
        province: province,
        city: city,
        barangay: barangay,
        country: jobLocationCountry?.value || 'Philippines',
        zip: jobLocationZip?.value || ''
      };
      
      // Build full location text from parts
      const parts = [locationData.unit, locationData.street, locationData.barangay, locationData.city, locationData.province, locationData.country, locationData.zip].filter(Boolean);
      const fullLocation = parts.join(', ');
      if (jobEditLocation) jobEditLocation.value = fullLocation;
      closeJobLocationModal();
    });
  }

  if (jobLocationCloseBtn) jobLocationCloseBtn.addEventListener('click', closeJobLocationModal);
  if (jobLocationModal) {
    jobLocationModal.addEventListener('click', e => {
      if (e.target === jobLocationModal) closeJobLocationModal();
    });
  }

  // Skills Modal Functions
  // Same skills used by recruiters (dashb.js setupSkillOptions)
  const SKILL_OPTIONS = [
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

  function openJobSkillsModal() {
    if (!jobSkillsModal || !jobSkillsList) return;
    
    // Get current skills
    const currentSkills = jobEditSkills?.value ? jobEditSkills.value.split(',').map(s => s.trim()).filter(Boolean) : [];
    selectedSkills = [...currentSkills];
    
    // Build skills list
    jobSkillsList.innerHTML = '';
    
    const skillsGrid = document.createElement('div');
    skillsGrid.style.display = 'grid';
    skillsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    skillsGrid.style.gap = '8px';
    
    SKILL_OPTIONS.forEach(skill => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '6px';
      label.style.padding = '6px';
      label.style.cursor = 'pointer';
      label.style.borderRadius = '6px';
      label.style.transition = 'background 0.2s';
      label.style.fontSize = '13px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = skill;
      checkbox.checked = selectedSkills.includes(skill);
      checkbox.style.cursor = 'pointer';
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
        } else {
          selectedSkills = selectedSkills.filter(s => s !== skill);
        }
      });
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(skill));
      skillsGrid.appendChild(label);
    });
    
    jobSkillsList.appendChild(skillsGrid);
    
    jobSkillsModal.classList.add('open');
    jobSkillsModal.setAttribute('aria-hidden', 'false');
  }

  function closeJobSkillsModal() {
    if (!jobSkillsModal) return;
    jobSkillsModal.classList.remove('open');
    jobSkillsModal.setAttribute('aria-hidden', 'true');
  }

  function updateSkillsDisplay() {
    if (!jobEditSkillsDisplay) return;
    jobEditSkillsDisplay.innerHTML = '';
    
    const skills = jobEditSkills?.value ? jobEditSkills.value.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    if (skills.length === 0) {
      const emptyText = document.createElement('span');
      emptyText.textContent = 'No skills selected';
      emptyText.style.color = '#999';
      emptyText.style.fontSize = '13px';
      jobEditSkillsDisplay.appendChild(emptyText);
      return;
    }
    
    skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.textContent = skill;
      tag.style.background = '#5b8c51';
      tag.style.color = '#fff';
      tag.style.padding = '4px 10px';
      tag.style.borderRadius = '14px';
      tag.style.fontSize = '12px';
      tag.style.fontWeight = '500';
      jobEditSkillsDisplay.appendChild(tag);
    });
  }

  if (jobEditSkillsBtn) {
    jobEditSkillsBtn.addEventListener('click', openJobSkillsModal);
  }

  if (jobSkillsSaveBtn) {
    jobSkillsSaveBtn.addEventListener('click', () => {
      if (jobEditSkills) jobEditSkills.value = selectedSkills.join(',');
      updateSkillsDisplay();
      closeJobSkillsModal();
    });
  }

  if (jobSkillsCloseBtn) jobSkillsCloseBtn.addEventListener('click', closeJobSkillsModal);
  if (jobSkillsModal) {
    jobSkillsModal.addEventListener('click', e => {
      if (e.target === jobSkillsModal) closeJobSkillsModal();
    });
  }

  // Image Upload Functions
  if (jobEditImageBtn && jobEditImageInput) {
    jobEditImageBtn.addEventListener('click', () => {
      jobEditImageInput.click();
    });
    
    jobEditImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        pendingImageFile = file;
        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
          if (jobEditImagePreview) {
            jobEditImagePreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 8px;">`;
            jobEditImagePreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (jobEditSaveBtn) {
    jobEditSaveBtn.addEventListener('click', async () => {
      if (!currentEditingJobId || !window.RJGDb) {
        if (window.showAppToast) window.showAppToast('Unable to save: admin function not available', 'error');
        return;
      }
      
      try {
        // Handle image upload first if there's a pending image
        let imageUrl = currentEditingJob?.image || '';
        if (pendingImageFile && window.RJGDb.uploadJobImage) {
          try {
            const uploadResult = await window.RJGDb.uploadJobImage(pendingImageFile, currentEditingJobId);
            if (uploadResult) {
              imageUrl = uploadResult; // uploadJobImage returns URL directly, not an object
            }
          } catch (uploadErr) {
            const msg = String(uploadErr && uploadErr.message ? uploadErr.message : uploadErr || '');
            if (window.showAppToast) {
              if (msg.toLowerCase().includes('row-level security')) {
                window.showAppToast('Image was not updated due to storage permissions. Other changes were saved.', 'info');
              } else {
                window.showAppToast('Image upload failed. Other changes were saved.', 'info');
              }
            }
          }
        }
        
        // Build rate string
        const currency = jobEditCurrency?.value || 'PHP';
        const amount = jobEditRateAmount?.value || '0';
        const unit = jobEditRateUnit?.value || 'hour';
        const rateString = `${currency} ${amount}/${unit}`;
        
        // Parse skills from comma-separated input
        const skillsValue = jobEditSkills?.value || '';
        const skills = skillsValue.split(',').map(s => s.trim()).filter(Boolean);
        
        const updates = {
          title: jobEditTitle?.value || '',
          category_code: jobEditCategory?.value || '',
          schedule_code: jobEditSchedule?.value || '',
          setting_code: jobEditType?.value || '',
          description: jobEditDescription?.value || '',
          is_urgent: jobEditUrgent?.checked || false,
          image_url: imageUrl
        };
        
        // Add location updates
        const locationUpdates = {
          street: locationData.street || null,
          barangay: locationData.barangay || null,
          city: locationData.city || null,
          province: locationData.province || null,
          country: locationData.country || 'Philippines',
          zip: locationData.zip || null
        };
        
        // Add rate updates
        const rateUpdates = {
          amount: parseFloat(amount) || 0,
          currency_code: currency,
          unit_code: unit
        };
        
        // Update job via admin function
        await window.RJGDb.adminUpdateJob(currentEditingJobId, updates);
        
        // Update location if available
        if (window.RJGDb.adminUpdateJobLocation) {
          await window.RJGDb.adminUpdateJobLocation(currentEditingJobId, locationUpdates);
        }
        
        // Update rate if available
        if (window.RJGDb.adminUpdateJobRate) {
          await window.RJGDb.adminUpdateJobRate(currentEditingJobId, rateUpdates);
        }

        // Update skills if available
        if (window.RJGDb.adminUpdateJobSkills) {
          await window.RJGDb.adminUpdateJobSkills(currentEditingJobId, skills);
        }
        
        // Update local jobs array
        const idx = jobs.findIndex(j => String(j.id) === String(currentEditingJobId));
        if (idx >= 0) {
          jobs[idx] = { 
            ...jobs[idx], 
            ...updates,
            location: jobEditLocation?.value || '',
            rate: rateString,
            image: imageUrl,
            imageUrl: imageUrl,
            skills: skills
          };
        }
        
        if (window.showAppToast) window.showAppToast('Job updated successfully', 'success');
        closeJobEditModal();
        closeReview();
        renderList();
        
        // Refresh from DB to get actual saved data
        await hydrateJobsFromDb();
      } catch (err) {
        console.error('Failed to update job:', err);
        const jobUpdateMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to update job. Please try again.')) || 'Unable to update job. Please try again.';
        if (window.showAppToast) window.showAppToast(jobUpdateMsg, 'error');
      }
    });
  }

  if (jobEditCloseBtn) jobEditCloseBtn.addEventListener('click', closeJobEditModal);
  if (jobEditModal) {
    jobEditModal.addEventListener('click', e => {
      if (e.target === jobEditModal) closeJobEditModal();
    });
  }

  if (reviewImageBtn) {
    reviewImageBtn.addEventListener('click', async () => {
      await openJobImagePreview(currentReviewedJob);
    });
  }


  if (jobImageCloseBtn) jobImageCloseBtn.addEventListener('click', closeJobImagePreview);
  if (jobImageModal) {
    jobImageModal.addEventListener('click', e => {
      if (e.target === jobImageModal) return;
    });
  }

  if (reportInvalidateBtn) {
    reportInvalidateBtn.addEventListener('click', async () => {
      console.log('Invalidate button clicked, activeReportReviewId:', activeReportReviewId);
      const report = await getReportById(activeReportReviewId);
      if (!report) {
        console.error('No report found with ID:', activeReportReviewId);
        if (window.showAppToast) window.showAppToast('Report not found.', 'error');
        return closeReportReview();
      }
      console.log('Found report:', report);
      
      const doInvalidate = async () => {
        console.log('Starting invalidate process for report:', report.id);
        // Just remove the report entry — no job or account changes
        let dbSuccess = false;
        try {
          console.log('Checking RJGDb availability...');
          if (!window.RJGDb) {
            throw new Error('RJGDb not available');
          }
          
          console.log('Checking admin report functions...');
          if (typeof window.RJGDb.adminUpdateReportStatus === 'function') {
            console.log('Calling adminUpdateReportStatus for report:', report.id);
            await window.RJGDb.adminUpdateReportStatus(report.id, 'invalidated');
            console.log('adminUpdateReportStatus succeeded');
            dbSuccess = true;
          } else if (typeof window.RJGDb.adminDeleteReport === 'function') {
            console.log('Calling adminDeleteReport for report:', report.id);
            await window.RJGDb.adminDeleteReport(report.id);
            console.log('adminDeleteReport succeeded');
            dbSuccess = true;
          } else {
            console.error('No admin report functions available');
            throw new Error('No admin report functions available');
          }
        } catch (err) {
          console.error('Failed to invalidate report in DB:', err);
          const invMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to invalidate report. Please try again.')) || 'Unable to invalidate report. Please try again.';
          if (window.showAppToast) window.showAppToast(invMsg, 'error');
          return;
        }
        if (!dbSuccess) {
          if (window.showAppToast) window.showAppToast('Could not reach database. Please try again.', 'error');
          return;
        }
        console.log('Invalidation successful, closing modal and refreshing list');
        closeReportReview();
        console.log('About to call renderReportList...');
        await renderReportList();
        console.log('renderReportList completed');
        if (window.showAppToast) window.showAppToast('Report invalidated. No account or content was affected.', 'info');
      };
      
      if (typeof window.showAppConfirmModal === 'function') {
        window.showAppConfirmModal({
          title: 'Invalidate report?',
          message: 'This report will be removed from the list. No accounts or content will be affected.',
          confirmLabel: 'Invalidate',
          cancelLabel: 'Cancel',
          onConfirm: doInvalidate
        });
      } else {
        await doInvalidate();
      }
    });
  }

  function removeJobFromReport(report) {
    const key = String(report.reference || '');
    if (!key) return false;
    const before = jobs.length;
    jobs = jobs.filter(job => String(job.id || `${job.title}|${job.company || job.postedBy || ''}`) !== key);
    if (jobs.length !== before) {
      renderList();
    }
    return jobs.length !== before;
  }

  if (reportRemoveJobBtn) {
    reportRemoveJobBtn.addEventListener('click', async () => {
      console.log('Remove job button clicked, activeReportReviewId:', activeReportReviewId);
      const report = await getReportById(activeReportReviewId);
      if (!report) {
        console.error('No report found with ID:', activeReportReviewId);
        if (window.showAppToast) window.showAppToast('Report not found.', 'error');
        return closeReportReview();
      }
      console.log('Found report for job removal:', report);
      
      const doRemove = async () => {
        console.log('Starting job removal process for report:', report.id);
        // Archive the reported job (set accountStatus = 'archived' or is_active = false)
        const jobId = report.reference || '';
        console.log('Job ID to archive:', jobId);
        
        if (jobId && window.RJGDb) {
          try {
            console.log('Checking adminArchiveJob function...');
            if (typeof window.RJGDb.adminArchiveJob === 'function') {
              console.log('Calling adminArchiveJob for job:', jobId);
              await window.RJGDb.adminArchiveJob(jobId, report.type || report.description || 'Violation of community guidelines');
              console.log('adminArchiveJob succeeded');
            } else if (typeof window.RJGDb.adminUpdateJob === 'function') {
              console.log('Calling adminUpdateJob for job:', jobId);
              await window.RJGDb.adminUpdateJob(jobId, { is_archived: true, archived_at: new Date().toISOString(), listing_open: false });
              console.log('adminUpdateJob succeeded');
            } else {
              console.error('No admin job functions available');
            }
          } catch (err) {
            console.error('Failed to archive reported job:', err);
            const archJobMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to archive this job. Please try again.')) || 'Unable to archive this job. Please try again.';
            if (window.showAppToast) window.showAppToast(archJobMsg, 'error');
            return;
          }
        } else {
          console.error('No jobId or RJGDb available');
        }
        
        // Remove the report entry
        try {
          console.log('Deleting report entry...');
          if (window.RJGDb && typeof window.RJGDb.adminDeleteReport === 'function') {
            await window.RJGDb.adminDeleteReport(report.id);
            console.log('Report deleted successfully');
          } else {
            console.error('adminDeleteReport not available');
          }
        } catch (err) {
          console.error('Failed to delete report:', err);
          const delRepMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to delete this report. Please try again.')) || 'Unable to delete this report. Please try again.';
          if (window.showAppToast) window.showAppToast(delRepMsg, 'error');
          return;
        }
        
        removeJobFromReport(report);
        closeReportReview();
        await renderReportList();
        // Also refresh the jobs list to remove archived jobs
        await hydrateJobsFromDb();
        if (window.showAppToast) window.showAppToast('Job has been archived and removed from listings.', 'info');
      };
      
      if (typeof window.showAppConfirmModal === 'function') {
        window.showAppConfirmModal({
          title: 'Remove this job?',
          message: 'The reported job will be archived and removed from all job listings. The recruiter\'s account will not be affected.',
          confirmLabel: 'Remove Job',
          cancelLabel: 'Cancel',
          danger: true,
          onConfirm: doRemove
        });
      } else {
        await doRemove();
      }
    });
  }

  if (reportRemoveBanBtn) {
    reportRemoveBanBtn.addEventListener('click', async () => {
      console.log('Remove job and ban user button clicked, activeReportReviewId:', activeReportReviewId);
      const report = await getReportById(activeReportReviewId);
      if (!report) {
        console.error('No report found with ID:', activeReportReviewId);
        if (window.showAppToast) window.showAppToast('Report not found.', 'error');
        return closeReportReview();
      }
      console.log('Found report for job removal and user ban:', report);
      
      const doRemoveBan = async () => {
        console.log('Starting job removal and user ban process for report:', report.id);
        const reportReason = report.type || report.description || 'Violation of community guidelines';
        
        // Archive the reported job
        const jobId = report.reference || '';
        console.log('Job ID to archive:', jobId);
        if (jobId && window.RJGDb) {
          try {
            console.log('Checking adminArchiveJob function...');
            if (typeof window.RJGDb.adminArchiveJob === 'function') {
              console.log('Calling adminArchiveJob for job:', jobId);
              await window.RJGDb.adminArchiveJob(jobId, reportReason);
              console.log('adminArchiveJob succeeded');
            } else if (typeof window.RJGDb.adminUpdateJob === 'function') {
              console.log('Calling adminUpdateJob for job:', jobId);
              await window.RJGDb.adminUpdateJob(jobId, { is_active: false, status: 'archived' });
              console.log('adminUpdateJob succeeded');
            } else {
              console.error('No admin job functions available');
            }
          } catch (err) {
            console.error('Failed to archive reported job:', err);
            const archJobMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to archive this job. Please try again.')) || 'Unable to archive this job. Please try again.';
            if (window.showAppToast) window.showAppToast(archJobMsg, 'error');
            return;
          }
        } else {
          console.error('No jobId or RJGDb available');
        }
        
        // Archive the recruiter's account (the user who posted the reported job)
        // For job reports, we need to get the recruiter from the job's posted_by field
        let recruiterUserId = report.targetUserId || '';
        console.log('Initial targetUserId:', recruiterUserId);
        
        // If targetUserId is empty (job report), fetch the job to get posted_by
        if (!recruiterUserId && jobId && window.RJGDb) {
          try {
            console.log('Fetching job to get recruiter ID...');
            const supa = window.RJGDb.getClient();
            const { data: jobData, error: jobError } = await supa
              .from("job_post")
              .select("posted_by")
              .eq("id", jobId)
              .maybeSingle();
            
            if (!jobError && jobData && jobData.posted_by) {
              recruiterUserId = jobData.posted_by;
              console.log('Found recruiter ID from job:', recruiterUserId);
            } else {
              console.error('Failed to get recruiter from job:', jobError);
            }
          } catch (fetchErr) {
            console.error('Error fetching job for recruiter ID:', fetchErr);
          }
        }
        
        console.log('Final recruiter user ID to archive:', recruiterUserId);
        if (recruiterUserId && window.RJGDb) {
          try {
            console.log('Checking admin user functions...');
            if (typeof window.RJGDb.adminArchiveUser === 'function') {
              console.log('Calling adminArchiveUser for recruiter:', recruiterUserId);
              await window.RJGDb.adminArchiveUser(recruiterUserId, reportReason);
              console.log('adminArchiveUser succeeded');
            } else if (typeof window.RJGDb.adminBanUser === 'function') {
              console.log('Calling adminBanUser for recruiter:', recruiterUserId);
              await window.RJGDb.adminBanUser(recruiterUserId);
              console.log('adminBanUser succeeded');
            } else if (typeof window.RJGDb.adminUpdateUser === 'function') {
              console.log('Calling adminUpdateUser for recruiter:', recruiterUserId);
              await window.RJGDb.adminUpdateUser(recruiterUserId, { accountStatus: 'archived' });
            } else {
              console.error('No admin user functions available');
            }
          } catch (err) {
            console.error('Failed to archive recruiter account:', err);
            const archRecMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to archive this recruiter. Please try again.')) || 'Unable to archive this recruiter. Please try again.';
            if (window.showAppToast) window.showAppToast(archRecMsg, 'error');
            return;
          }
        } else {
          console.error('No recruiter user ID found to archive');
        }
        
        // Remove the report entry
        try {
          console.log('Deleting report entry...');
          if (window.RJGDb && typeof window.RJGDb.adminDeleteReport === 'function') {
            await window.RJGDb.adminDeleteReport(report.id);
            console.log('Report deleted successfully');
          } else {
            console.error('adminDeleteReport not available');
          }
        } catch (err) {
          console.error('Failed to delete report:', err);
          const delRepMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to delete this report. Please try again.')) || 'Unable to delete this report. Please try again.';
          if (window.showAppToast) window.showAppToast(delRepMsg, 'error');
          return;
        }
        
        removeJobFromReport(report);
        closeReportReview();
        await renderReportList();
        // Refresh jobs and users lists to reflect archived items
        await hydrateJobsFromDb();
        await renderUserList();
        if (window.showAppToast) window.showAppToast('Job removed and recruiter account banned. Both will no longer appear in listings.', 'success');
      };
      
      if (typeof window.showAppConfirmModal === 'function') {
        window.showAppConfirmModal({
          title: 'Remove job and ban recruiter?',
          message: 'The reported job will be hidden from all seekers and the recruiter\'s account will be banned. The recruiter will be notified. This action cannot be undone easily.',
          confirmLabel: 'Remove Job & Ban Recruiter',
          cancelLabel: 'Cancel',
          danger: true,
          onConfirm: doRemoveBan
        });
      } else {
        await doRemoveBan();
      }
    });
  }

  const reportBanUserBtn = document.getElementById('adminReportBanUserBtn');
  if (reportBanUserBtn) {
    reportBanUserBtn.addEventListener('click', async () => {
      console.log('Ban user button clicked, activeReportReviewId:', activeReportReviewId);
      const report = await getReportById(activeReportReviewId);
      if (!report) {
        console.error('No report found with ID:', activeReportReviewId);
        if (window.showAppToast) window.showAppToast('Report not found.', 'error');
        return closeReportReview();
      }
      console.log('Found report for user ban:', report);
      
      const doBanUser = async () => {
        console.log('Starting user ban process for report:', report.id);
        const reportReason = report.type || report.description || 'Violation of community guidelines';
        
        // Archive the account of the user who owns the reported resume (seeker)
        const targetUserId = report.targetUserId || '';
        console.log('Target user ID to archive:', targetUserId);
        if (targetUserId && window.RJGDb) {
          try {
            console.log('Checking admin user functions...');
            if (typeof window.RJGDb.adminArchiveUser === 'function') {
              console.log('Calling adminArchiveUser for user:', targetUserId);
              await window.RJGDb.adminArchiveUser(targetUserId, reportReason);
              console.log('adminArchiveUser succeeded');
            } else if (typeof window.RJGDb.adminBanUser === 'function') {
              console.log('Calling adminBanUser for user:', targetUserId);
              await window.RJGDb.adminBanUser(targetUserId);
              console.log('adminBanUser succeeded');
            } else if (typeof window.RJGDb.adminUpdateUser === 'function') {
              console.log('Calling adminUpdateUser for user:', targetUserId);
              await window.RJGDb.adminUpdateUser(targetUserId, { accountStatus: 'archived' });
              console.log('adminUpdateUser succeeded');
            } else {
              console.error('No admin user functions available');
            }
          } catch (err) {
            console.error('Failed to archive user account:', err);
            const archUserMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to archive this user. Please try again.')) || 'Unable to archive this user. Please try again.';
            if (window.showAppToast) window.showAppToast(archUserMsg, 'error');
            return;
          }
        } else {
          console.error('No targetUserId or RJGDb available');
        }
        
        // Remove the report entry only
        try {
          console.log('Deleting report entry...');
          if (window.RJGDb && typeof window.RJGDb.adminDeleteReport === 'function') {
            await window.RJGDb.adminDeleteReport(report.id);
            console.log('Report deleted successfully');
          } else {
            console.error('adminDeleteReport not available');
          }
        } catch (err) {
          console.error('Failed to delete report:', err);
          const delRepMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to delete this report. Please try again.')) || 'Unable to delete this report. Please try again.';
          if (window.showAppToast) window.showAppToast(delRepMsg, 'error');
          return;
        }
        
        closeReportReview();
        await renderReportList();
        // Also refresh the users list to remove archived users
        await renderUserList();
        if (window.showAppToast) window.showAppToast('User account has been archived.', 'info');
      };
      
      if (typeof window.showAppConfirmModal === 'function') {
        window.showAppConfirmModal({
          title: 'Archive this user?',
          message: 'The account of the user who owns this reported resume will be archived. The report will be removed from the list.',
          confirmLabel: 'Archive User',
          cancelLabel: 'Cancel',
          danger: true,
          onConfirm: doBanUser
        });
      } else {
        await doBanUser();
      }
    });
  }

  if (listEl) {
    listEl.addEventListener('click', async e => {
      const row = e.target.closest('.admin-dashboard-job-row');
      if (!row) return;
      const id = row.dataset.jobId;
      const job = jobs.find(j => String(j.id || `${j.title}|${j.company || j.postedBy || ''}`) === String(id));
      if (!job) return;
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'review') {
        const reviewBtn = e.target.closest('[data-action="review"]');
        if (reviewBtn) {
          reviewBtn.classList.add('loading');
          const spinner = document.createElement('span');
          spinner.className = 'admin-review-btn-spinner';
          reviewBtn.insertBefore(spinner, reviewBtn.firstChild);
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Please Wait'; });
        }
        if (reviewTitle) reviewTitle.textContent = 'Loading...';
        if (reviewBy) reviewBy.textContent = 'Loading...';
        if (reviewAgo) reviewAgo.textContent = 'Loading...';
        if (reviewCategory) reviewCategory.textContent = 'Loading...';
        if (reviewSchedule) reviewSchedule.textContent = 'Loading...';
        if (reviewType) reviewType.textContent = 'Loading...';
        if (reviewLocation) reviewLocation.textContent = 'Loading...';
        if (reviewRate) reviewRate.textContent = 'Loading...';
        if (reviewUrgent) reviewUrgent.textContent = 'Loading...';
        if (reviewSkills) reviewSkills.textContent = 'Loading...';
        if (reviewDesc) reviewDesc.textContent = 'Loading full job information from database...';
        if (reviewImageBtn) reviewImageBtn.disabled = true;
        reviewModal.classList.add('open');
        reviewModal.setAttribute('aria-hidden', 'false');

        const freshJob = await getFreshJobForReview(id, job);
        openReview(freshJob || job);
        if (reviewBtn) {
          reviewBtn.classList.remove('loading');
          const sp = reviewBtn.querySelector('.admin-review-btn-spinner');
          if (sp) sp.remove();
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Review Job'; });
        }
        return;
      }
      if (action === 'restore') {
        const doRestoreJob = async () => {
          if (window.RJGDb && window.RJGDb.adminUnarchiveJob) {
            try {
              // Restore (unarchive) the job
              await window.RJGDb.adminUnarchiveJob(id);
              if (window.showAppToast) window.showAppToast('Job restored successfully.', 'success');
            } catch (err) {
              console.error('Failed to restore job:', err);
              if (window.showAppToast) window.showAppToast('Failed to restore job.', 'error');
              return;
            }
          }
          // Refresh the job list
          await hydrateJobsFromDb();
          renderList();
        };
        
        if (typeof window.showAppConfirmModal === 'function') {
          window.showAppConfirmModal({
            title: 'Restore Job?',
            message: `This will restore "${job.title}" and it will be visible to job seekers again.`,
            confirmLabel: 'Restore Job',
            cancelLabel: 'Cancel',
            danger: false,
            onConfirm: doRestoreJob
          });
        } else {
          await doRestoreJob();
        }
      }
      if (action === 'delete') {
        const doArchiveJob = async () => {
          if (window.RJGDb && window.RJGDb.adminArchiveJob) {
            try {
              // Archive the job using the proper admin function
              await window.RJGDb.adminArchiveJob(id, 'Removed by admin via dashboard');
              if (window.showAppToast) window.showAppToast('Job archived and hidden from seekers.', 'success');
            } catch (err) {
              console.error('Failed to archive job:', err);
              if (window.showAppToast) window.showAppToast('Failed to archive job.', 'error');
              return;
            }
          }
          // Refresh the job list to remove the archived job
          await hydrateJobsFromDb();
          renderList();
        };
        
        if (typeof window.showAppConfirmModal === 'function') {
          window.showAppConfirmModal({
            title: 'Remove Job (Archive)?',
            message: 'This job will be archived and hidden from all job seekers. The recruiter who posted it will see the job with lowered opacity and a message that it was removed by admin.',
            confirmLabel: 'Remove Job',
            cancelLabel: 'Cancel',
            danger: true,
            onConfirm: doArchiveJob
          });
        } else {
          await doArchiveJob();
        }
      }
    });
  }

  if (userSearchBtn) userSearchBtn.addEventListener('click', renderUserList);
  if (userRefreshBtn) userRefreshBtn.addEventListener('click', renderUserList);
  if (jobRefreshBtn) jobRefreshBtn.addEventListener('click', () => {
    hydrateJobsFromDb();
    renderList();
  });
  if (reportRefreshBtn) reportRefreshBtn.addEventListener('click', renderReportList);
  if (userSearchInput) {
    userSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') renderUserList();
    });
  }

  userTabChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeUserTab = chip.dataset.adminUserTab;
      userTabChips.forEach(c => c.classList.toggle('is-active', c === chip));
      renderUserList();
    });
  });

  if (userListEl) {
    userListEl.addEventListener('click', async e => {
      const row = e.target.closest('.admin-dashboard-user-row');
      if (!row) return;
      const users = await buildUsersDataset();
      const user = users.find(u => String(u.id) === String(row.dataset.userId));
      if (!user) return;
      const action = e.target.closest('[data-user-action]')?.dataset.userAction;
      if (action === 'review') {
        const reviewBtn = e.target.closest('[data-user-action="review"]');
        if (reviewBtn) {
          reviewBtn.classList.add('loading');
          const spinner = document.createElement('span');
          spinner.className = 'admin-review-btn-spinner';
          reviewBtn.insertBefore(spinner, reviewBtn.firstChild);
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Please Wait'; });
        }
        await openUserReview(user);
        if (reviewBtn) {
          reviewBtn.classList.remove('loading');
          const sp = reviewBtn.querySelector('.admin-review-btn-spinner');
          if (sp) sp.remove();
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Review Info'; });
        }
        return;
      }
      if (action === 'restore') {
        const doRestoreUser = async () => {
          if (window.RJGDb && window.RJGDb.adminUnarchiveUser) {
            try {
              // Restore (unarchive) the user
              await window.RJGDb.adminUnarchiveUser(user.id);
              if (window.showAppToast) window.showAppToast('User restored successfully.', 'success');
            } catch (err) {
              console.error('Failed to restore user:', err);
              if (window.showAppToast) window.showAppToast('Failed to restore user.', 'error');
              return;
            }
          }
          // Refresh the user list
          await renderUserList();
        };
        
        if (typeof window.showAppConfirmModal === 'function') {
          window.showAppConfirmModal({
            title: 'Restore User?',
            message: `This will restore "${user.name}" and they will be able to access the platform again.`,
            confirmLabel: 'Restore User',
            cancelLabel: 'Cancel',
            danger: false,
            onConfirm: doRestoreUser
          });
        } else {
          await doRestoreUser();
        }
      }
      if (action === 'delete') {
        const doBanUser = async () => {
          if (window.RJGDb && window.RJGDb.adminArchiveUser) {
            try {
              // Ban (archive) the user using the proper admin function
              await window.RJGDb.adminArchiveUser(user.id, 'Banned by admin via dashboard');
              if (window.showAppToast) window.showAppToast('User banned and will receive notification.', 'success');
            } catch (err) {
              console.error('Failed to ban user:', err);
              if (window.showAppToast) window.showAppToast('Failed to ban user.', 'error');
              return;
            }
          }
          // Refresh the user list to show the banned user
          await renderUserList();
        };
        
        if (typeof window.showAppConfirmModal === 'function') {
          window.showAppConfirmModal({
            title: 'Ban User (Archive)?',
            message: `This will ban "${user.name}" and they will no longer be able to access the platform. The user will receive a notification that they have been banned.`,
            confirmLabel: 'Ban User',
            cancelLabel: 'Cancel',
            danger: true,
            onConfirm: doBanUser
          });
        } else {
          await doBanUser();
        }
      }
    });
  }

  if (reportSearchBtn) reportSearchBtn.addEventListener('click', renderReportList);
  if (reportSearchInput) {
    reportSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') renderReportList();
    });
  }

  // Set initial placeholder based on default tab
  if (reportSearchInput) {
    reportSearchInput.placeholder = 'Search Job by Name'; // Default to job tab
  }

  reportKindChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeReportKind = chip.dataset.adminReportKind || 'job';
      reportKindChips.forEach(c => c.classList.toggle('is-active', c === chip));
      
      // Update search placeholder based on selected tab
      if (reportSearchInput) {
        if (activeReportKind === 'job') {
          reportSearchInput.placeholder = 'Search Job by Name';
        } else if (activeReportKind === 'resume') {
          reportSearchInput.placeholder = 'Search Resume by Name or Email';
        }
      }
      
      renderReportList();
    });
  });

  if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', renderReportList);
  }

  if (reportListEl) {
    reportListEl.addEventListener('click', async e => {
      const row = e.target.closest('.admin-dashboard-user-row');
      if (!row) return;
      const reports = await buildReportDataset();
      const report = reports.find(item => String(item.id) === String(row.dataset.reportId));
      if (!report) return;
      const action = e.target.closest('[data-report-action]')?.dataset.reportAction;
      if (action === 'review') {
        const reviewBtn = e.target.closest('[data-report-action="review"]');
        if (reviewBtn) {
          reviewBtn.classList.add('loading');
          const spinner = document.createElement('span');
          spinner.className = 'admin-review-btn-spinner';
          reviewBtn.insertBefore(spinner, reviewBtn.firstChild);
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Please Wait'; });
        }
        openReportReview(report);
        if (reviewBtn) {
          reviewBtn.classList.remove('loading');
          const sp = reviewBtn.querySelector('.admin-review-btn-spinner');
          if (sp) sp.remove();
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Review Info'; });
        }
        return;
      }
    });
  }

  // Initial render — jobs list starts empty, populated from DB
  renderList();
  (async function init() {
    await hydrateJobsFromDb();
    await renderUserList();
    await renderReportList();
    await renderVerifList();

    // Real-time date updates for job posted times
    setInterval(() => {
      // Update job posted times without full re-render
      if (listEl && jobs.length > 0) {
        const jobCells = listEl.querySelectorAll('.admin-dashboard-job-cell:nth-child(3)');
        jobCells.forEach((cell, index) => {
          const job = jobs[index];
          if (job && job.posted_at) {
            const now = Date.now();
            const dt = new Date(job.posted_at);
            const diff = now - dt.getTime();
            
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            let newTimeText;
            if (seconds < 60) newTimeText = "Just now";
            else if (minutes < 60) newTimeText = `${minutes}m ago`;
            else if (hours < 24) newTimeText = `${hours}h ago`;
            else if (days === 1) newTimeText = "1d ago";
            else newTimeText = `${days}d ago`;
            
            if (cell.textContent !== newTimeText) {
              cell.textContent = newTimeText;
            }
          }
        });
      }
    }, 30000); // Update every 30 seconds
  })();

  // -----------------------------------------------
  // VERIFICATION LIST
  // -----------------------------------------------
  const verifListEl = document.getElementById('adminVerifList');
  const verifEmptyEl = document.getElementById('adminVerifEmpty');
  const verifSearchInput = document.getElementById('adminVerifSearchInput');
  const verifSearchBtn = document.getElementById('adminVerifSearchBtn');
  const verifRefreshBtn = document.getElementById('adminVerifRefreshBtn');

  // Modal elements
  const verifReviewModal = document.getElementById('adminVerifReviewModal');
  const verifReviewAvatar = document.getElementById('adminVerifReviewAvatar');
  const verifReviewAvatarPlaceholder = document.getElementById('adminVerifReviewAvatarPlaceholder');
  const verifReviewName = document.getElementById('adminVerifReviewName');
  const verifReviewEmail = document.getElementById('adminVerifReviewEmail');
  const verifReviewPhone = document.getElementById('adminVerifReviewPhone');
  const verifReviewAddress = document.getElementById('adminVerifReviewAddress');
  const verifIdImage = document.getElementById('adminVerifIdImage');
  const verifIdPlaceholder = document.getElementById('adminVerifIdPlaceholder');
  const verifCertImage = document.getElementById('adminVerifCertImage');
  const verifCertPlaceholder = document.getElementById('adminVerifCertPlaceholder');
  const verifIdCurrentStatus = document.getElementById('adminVerifIdCurrentStatus');
  const verifCertCurrentStatus = document.getElementById('adminVerifCertCurrentStatus');
  const verifIdPendingLabel = document.getElementById('adminVerifIdPendingLabel');
  const verifCertPendingLabel = document.getElementById('adminVerifCertPendingLabel');
  const verifIdVerifyBtn = document.getElementById('adminVerifIdVerifyBtn');
  const verifIdChangeBtn = document.getElementById('adminVerifIdChangeBtn');
  const verifCertVerifyBtn = document.getElementById('adminVerifCertVerifyBtn');
  const verifCertChangeBtn = document.getElementById('adminVerifCertChangeBtn');
  const verifSaveBtn = document.getElementById('adminVerifSaveBtn');
  const verifCloseBtn = document.getElementById('adminVerifCloseBtn');

  let verifDataset = [];
  let currentVerifEntry = null;
  let pendingIdStatus = null;
  let pendingCertStatus = null;

  function statusLabel(status) {
    if (status === 'verified') return '✔ Verified';
    if (status === 'change_requested') return '⚠ Change Requested';
    return '⏳ Pending';
  }

  function statusClass(status) {
    if (status === 'verified') return 'admin-verif-status--verified';
    if (status === 'change_requested') return 'admin-verif-status--change';
    return 'admin-verif-status--pending';
  }

  async function renderVerifList() {
    if (!verifListEl) return;
    verifListEl.innerHTML = '<div style="padding:20px;text-align:center;">Loading...</div>';
    try {
      if (window.RJGDb && typeof window.RJGDb.listPendingVerifications === 'function') {
        verifDataset = await window.RJGDb.listPendingVerifications();
      } else {
        verifDataset = [];
      }
    } catch (e) {
      verifDataset = [];
      verifListEl.innerHTML = '<div style="padding:20px;text-align:center;color:#dc3545;">Failed to load verifications.</div>';
      return;
    }

    const q = String(verifSearchInput?.value || '').trim().toLowerCase();
    const filtered = verifDataset.filter(v =>
      !q ||
      String(v.name || '').toLowerCase().includes(q) ||
      String(v.email || '').toLowerCase().includes(q)
    );

    if (verifEmptyEl) verifEmptyEl.hidden = filtered.length > 0;

    verifListEl.innerHTML = filtered.map(v => `
      <article class="admin-dashboard-job-row admin-dashboard-user-row" data-verif-user-id="${v.userId}">
        <div class="admin-dashboard-job-cell admin-dashboard-job-cell--title">${v.name || '—'}</div>
        <div class="admin-dashboard-job-cell">${v.email || '—'}</div>
        <div class="admin-dashboard-job-cell">
          <span class="admin-verif-status-chip ${statusClass(v.id_status)}">${statusLabel(v.id_status)}</span>
        </div>
        <div class="admin-dashboard-job-cell">
          <span class="admin-verif-status-chip ${statusClass(v.cert_status)}">${statusLabel(v.cert_status)}</span>
        </div>
        <div class="admin-dashboard-row-actions">
          <button type="button" class="admin-dashboard-review-btn" data-verif-action="review">Review Info</button>
        </div>
      </article>
    `).join('');
  }

  function applyVerifStatusStyle(el, status) {
    if (!el) return;
    el.className = 'admin-verif-status-text ' + statusClass(status);
    el.textContent = statusLabel(status);
  }

  function openVerifReview(entry) {
    currentVerifEntry = entry;
    pendingIdStatus = null;
    pendingCertStatus = null;

    // Seeker info
    if (verifReviewName) verifReviewName.textContent = entry.name || '—';
    if (verifReviewEmail) verifReviewEmail.textContent = entry.email || '—';
    if (verifReviewPhone) verifReviewPhone.textContent = entry.phone || '—';
    if (verifReviewAddress) verifReviewAddress.textContent = entry.address || '—';

    // Avatar
    if (entry.avatarUrl) {
      if (verifReviewAvatar) { verifReviewAvatar.src = entry.avatarUrl; verifReviewAvatar.style.display = 'block'; }
      if (verifReviewAvatarPlaceholder) verifReviewAvatarPlaceholder.style.display = 'none';
    } else {
      if (verifReviewAvatar) verifReviewAvatar.style.display = 'none';
      if (verifReviewAvatarPlaceholder) verifReviewAvatarPlaceholder.style.display = 'flex';
    }

    // ID image
    if (entry.id_url) {
      if (verifIdImage) { 
        verifIdImage.src = entry.id_url; 
        verifIdImage.style.display = 'block'; 
        verifIdImage.style.cursor = 'pointer';
        verifIdImage.onclick = () => showImageModal(entry.id_url);
        verifIdImage.title = 'Click to view full size';
      }
      if (verifIdPlaceholder) verifIdPlaceholder.style.display = 'none';
      if (document.getElementById('adminVerifIdActions')) document.getElementById('adminVerifIdActions').style.display = 'flex';
    } else {
      if (verifIdImage) verifIdImage.style.display = 'none';
      if (verifIdPlaceholder) verifIdPlaceholder.style.display = 'block';
      if (document.getElementById('adminVerifIdActions')) document.getElementById('adminVerifIdActions').style.display = 'none';
    }

    // Cert image
    if (entry.cert_url) {
      if (verifCertImage) { 
        verifCertImage.src = entry.cert_url; 
        verifCertImage.style.display = 'block'; 
        verifCertImage.style.cursor = 'pointer';
        verifCertImage.onclick = () => showImageModal(entry.cert_url);
        verifCertImage.title = 'Click to view full size';
      }
      if (verifCertPlaceholder) verifCertPlaceholder.style.display = 'none';
      if (document.getElementById('adminVerifCertActions')) document.getElementById('adminVerifCertActions').style.display = 'flex';
    } else {
      if (verifCertImage) verifCertImage.style.display = 'none';
      if (verifCertPlaceholder) verifCertPlaceholder.style.display = 'block';
      if (document.getElementById('adminVerifCertActions')) document.getElementById('adminVerifCertActions').style.display = 'none';
    }

    applyVerifStatusStyle(verifIdCurrentStatus, entry.id_status);
    applyVerifStatusStyle(verifCertCurrentStatus, entry.cert_status);
    if (verifIdPendingLabel) verifIdPendingLabel.style.display = 'none';
    if (verifCertPendingLabel) verifCertPendingLabel.style.display = 'none';

    if (verifReviewModal) { verifReviewModal.removeAttribute('aria-hidden'); verifReviewModal.style.display = 'flex'; }
  }

  function closeVerifReview() {
    if (verifReviewModal) { verifReviewModal.setAttribute('aria-hidden', 'true'); verifReviewModal.style.display = 'none'; }
    currentVerifEntry = null;
    pendingIdStatus = null;
    pendingCertStatus = null;
  }

  function setVerifPending(type, status) {
    if (type === 'id') {
      pendingIdStatus = status;
      applyVerifStatusStyle(verifIdCurrentStatus, status);
      if (verifIdPendingLabel) {
        verifIdPendingLabel.textContent = status === 'verified' ? '✔ Marked as Verified (unsaved)' : '⚠ Change Requested (unsaved)';
        verifIdPendingLabel.style.display = 'block';
        verifIdPendingLabel.className = 'admin-verif-pending-label ' + (status === 'verified' ? 'admin-verif-pending-label--verified' : 'admin-verif-pending-label--change');
      }
    } else {
      pendingCertStatus = status;
      applyVerifStatusStyle(verifCertCurrentStatus, status);
      if (verifCertPendingLabel) {
        verifCertPendingLabel.textContent = status === 'verified' ? '✔ Marked as Verified (unsaved)' : '⚠ Change Requested (unsaved)';
        verifCertPendingLabel.style.display = 'block';
        verifCertPendingLabel.className = 'admin-verif-pending-label ' + (status === 'verified' ? 'admin-verif-pending-label--verified' : 'admin-verif-pending-label--change');
      }
    }
  }

  if (verifIdVerifyBtn) verifIdVerifyBtn.addEventListener('click', () => setVerifPending('id', 'verified'));
  if (verifIdChangeBtn) verifIdChangeBtn.addEventListener('click', () => setVerifPending('id', 'change_requested'));
  if (verifCertVerifyBtn) verifCertVerifyBtn.addEventListener('click', () => setVerifPending('cert', 'verified'));
  if (verifCertChangeBtn) verifCertChangeBtn.addEventListener('click', () => setVerifPending('cert', 'change_requested'));

  if (verifSaveBtn) {
    verifSaveBtn.addEventListener('click', async () => {
      if (!currentVerifEntry) return;
      if (!pendingIdStatus && !pendingCertStatus) {
        if (window.showAppToast) window.showAppToast('No changes to save.', 'info');
        return;
      }
      try {
        verifSaveBtn.disabled = true;
        verifSaveBtn.textContent = 'Saving...';
        await window.RJGDb.adminUpdateVerificationStatus(
          currentVerifEntry.userId,
          pendingIdStatus,
          pendingCertStatus
        );
        if (window.showAppToast) window.showAppToast('Verification status saved successfully.', 'success');
        closeVerifReview();
        await renderVerifList();
      } catch (e) {
        const verifMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(e, 'Unable to save verification. Please try again.')) || 'Unable to save verification. Please try again.';
        if (window.showAppToast) window.showAppToast(verifMsg, 'error');
      } finally {
        verifSaveBtn.disabled = false;
        verifSaveBtn.textContent = 'Save';
      }
    });
  }

  if (verifCloseBtn) verifCloseBtn.addEventListener('click', closeVerifReview);
  if (verifReviewModal) {
    verifReviewModal.addEventListener('click', e => {
      if (e.target === verifReviewModal) closeVerifReview();
    });
  }

  if (verifSearchBtn) verifSearchBtn.addEventListener('click', renderVerifList);
  if (verifSearchInput) verifSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') renderVerifList(); });
  if (verifRefreshBtn) verifRefreshBtn.addEventListener('click', renderVerifList);

  if (verifListEl) {
    verifListEl.addEventListener('click', e => {
      const row = e.target.closest('[data-verif-user-id]');
      if (!row) return;
      const action = e.target.closest('[data-verif-action]')?.dataset.verifAction;
      if (action === 'review') {
        const reviewBtn = e.target.closest('[data-verif-action="review"]');
        if (reviewBtn) {
          reviewBtn.classList.add('loading');
          const spinner = document.createElement('span');
          spinner.className = 'admin-review-btn-spinner';
          reviewBtn.insertBefore(spinner, reviewBtn.firstChild);
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Please Wait'; });
        }
        const entry = verifDataset.find(v => v.userId === row.dataset.verifUserId);
        if (entry) openVerifReview(entry);
        if (reviewBtn) {
          reviewBtn.classList.remove('loading');
          const sp = reviewBtn.querySelector('.admin-review-btn-spinner');
          if (sp) sp.remove();
          Array.from(reviewBtn.childNodes).filter(n => n.nodeType === 3).forEach(n => { n.textContent = 'Review Info'; });
        }
      }
    });
  }
})();