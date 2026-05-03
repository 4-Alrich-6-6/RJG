(function () {
  const STORAGE_KEY = 'myApplications';
  let currentModalEntry = null;
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

  const backBtn = document.getElementById('applicationBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async function () {
      window.location.href = await resolveRoleHomePage();
    });
  }

  const jobModal = document.getElementById('applicationJobModal');
  const closeHeader = document.getElementById('applicationJobModalCloseHeader');
  const employerContactsModal = document.getElementById('employerContactsModal');
  const employerContactsCloseBtn = document.getElementById('employerContactsCloseBtn');

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatAppliedDisplay(applied) {
    const iso = applied == null ? null : String(applied).trim();
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    
    if (diffMins < 1) return 'Applied just now';
    if (diffMins < 60) return `Applied ${diffMins}m ago`;
    if (diffHours < 24) return `Applied ${diffHours}h ago`;
    if (diffDays === 1) return 'Applied 1d ago';
    if (diffDays < 7) return `Applied ${diffDays}d ago`;
    if (diffWeeks === 1) return 'Applied 1w ago';
    if (diffWeeks < 4) return `Applied ${diffWeeks}w ago`;
    
    return `Applied ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  function formatPostedDisplay(posted) {
    const s = posted == null ? '' : String(posted).trim();
    if (!s || s === '—') return '—';
    if (s.toLowerCase().startsWith('posted')) return s;
    return `Posted ${s}`;
  }

  async function loadApplications() {
    try {
      console.log('Loading applications...');
      if (window.RJGDb && typeof window.RJGDb.listApplications === 'function') {
        const apps = await window.RJGDb.listApplications();
        console.log('Applications loaded:', apps.length, apps);
        return apps;
      } else {
        console.log('RJGDb or listApplications not available');
        return [];
      }
    } catch (e) {
      console.error('Error loading applications:', e);
      return [];
    }
  }

  function statusMeta(status) {
    if (status === 'accepted') {
      return { className: 'application-status--accepted', label: 'Accepted' };
    }
    if (status === 'rejected') {
      return { className: 'application-status--rejected', label: 'Rejected' };
    }
    if (status === 'terminated') {
      return { className: 'application-status--terminated', label: 'Terminated' };
    }
    return { className: 'application-status--pending', label: 'In process' };
  }

  /** Merge legacy / alternate API keys so modal always has data to show */
  function enrichApplicationEntry(entry) {
    if (!entry || typeof entry !== 'object') return {};
    const o = { ...entry };
    if (o.title == null || String(o.title).trim() === '') {
      o.title = o.jobTitle || o.job_name || o.name || 'Job';
    }
    if (!o.company && o.employer) o.company = o.employer;
    if (!o.posterName) o.posterName = o.company;
    if (!o.typeLabel) o.typeLabel = o.category || o.jobCategory || o.typeCategory;
    if (!o.settingsLabel && o.type) {
      o.settingsLabel = String(o.type).replace(/On-Site/gi, 'On-site');
    }
    if (!o.salary && (o.rate || o.pay)) o.salary = o.rate || o.pay;
    if (!o.postedAgo && o.posted != null) o.postedAgo = o.posted;
    if (typeof o.skills === 'string' && o.skills.trim()) o.skills = [o.skills.trim()];
    if (o.posterProfileLinks && typeof o.posterProfileLinks === 'string') {
      o.posterProfileLinks = [o.posterProfileLinks.trim()].filter(Boolean);
    }
    return o;
  }

  function readLivePosterProfileContacts() {
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
    return { phone, email, profileLinks };
  }

  /**
   * Resolves phone, email, and profile links for the job poster.
   * Uses stored snapshot fields; for jobs posted as "You", fills gaps from profile/account.
   */
  function resolvePosterContactsForEntry(entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    const posterLabel =
      String(e.posterName || e.company || e.employer || 'Employer').trim() || 'Employer';
    let phone = String(e.posterPhone || '').trim();
    let email = String(
      e.posterEmail || e.poster_email || e.employerEmail || e.contactEmail || ''
    ).trim();
    let links = Array.isArray(e.posterProfileLinks) ? e.posterProfileLinks.filter(Boolean).map(String) : [];

    const company = String(e.company || '').trim();
    const posterName = String(e.posterName || '').trim();
    const jid = String(e.jobId || '');
    const isPostedByYou =
      company === 'You' ||
      posterName === 'You' ||
      /^posted-/.test(jid);

    if (isPostedByYou) {
      const live = readLivePosterProfileContacts();
      if (!phone) phone = live.phone;
      if (!email) email = live.email;
      if (!links.length) links = live.profileLinks.slice();
    }

    // Fallback: derive email from profile links like "mailto:..." or plain email text.
    if (!email && links.length) {
      for (let i = 0; i < links.length; i += 1) {
        const raw = String(links[i] || '').trim();
        if (!raw) continue;
        const mailtoMatch = raw.match(/^mailto:(.+)$/i);
        if (mailtoMatch && mailtoMatch[1]) {
          email = mailtoMatch[1].trim();
          break;
        }
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          email = raw;
          break;
        }
      }
    }

    return { posterLabel, phone, email, links };
  }

  async function fetchPosterEmailFallback(postedById) {
    const id = String(postedById || '').trim();
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

  function displayFieldsFromEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return {
        title: 'Job',
        poster: '—',
        posted: '—',
        schedule: '—',
        typeLabel: '—',
        location: '—',
        salary: '—',
        settingsLabel: '—',
        skills: ['—'],
        description: 'No description available.'
      };
    }
    const typeLabel = entry.typeLabel || entry.category || entry.jobCategory || '';
    const settingsLabel =
      entry.settingsLabel ||
      entry.settings ||
      (entry.type && String(entry.type).replace(/On-Site/gi, 'On-site')) ||
      '';
    const salary = entry.salary || entry.rate || entry.pay || '';
    const poster = entry.posterName || entry.company || entry.employer || '';
    const posted = entry.postedAgo != null ? entry.postedAgo : entry.posted;
    let skills = [];
    if (Array.isArray(entry.skills) && entry.skills.length) skills = entry.skills;
    else if (typeof entry.skills === 'string' && entry.skills.trim()) skills = [entry.skills.trim()];
    const desc =
      (entry.description && String(entry.description).trim()) ||
      (entry.desc && String(entry.desc).trim()) ||
      '';
    return {
      title: String(entry.title || 'Job').trim() || 'Job',
      poster: String(poster || '—').trim() || '—',
      posted: posted == null ? '—' : String(posted),
      schedule: String(entry.schedule || '—').trim() || '—',
      typeLabel: String(typeLabel || '—').trim() || '—',
      location: String(entry.location || '—').trim() || '—',
      salary: String(salary || '—').trim() || '—',
      settingsLabel: String(settingsLabel || '—').trim() || '—',
      skills: skills.length ? skills : ['—'],
      description: desc || 'No description available.'
    };
  }

  function buildModalBodyHtml(d, entry) {
    const skillsTags = (Array.isArray(d.skills) ? d.skills : ['—'])
      .map(function (s) {
        return '<span class="app-job-modal__tag">' + escapeHtml(String(s)) + '</span>';
      })
      .join('');
    const sm = statusMeta(entry && entry.status);
    const st =
      entry && (entry.status === 'accepted' || entry.status === 'rejected' || entry.status === 'terminated') ? entry.status : 'pending';
    const when = formatAppliedDisplay(entry && entry.appliedAt);
    const whenHtml = when ? escapeHtml(' · ' + when) : '';
    const imageSrc = escapeHtml(String((entry && entry.image) || '').trim());
    const heroMarkup = imageSrc
      ? '<img src="' + imageSrc + '" alt="" class="app-job-modal__hero-img" loading="lazy">'
      : '<span class="app-job-modal__hero-no-image">No Image</span>';

    return (
      '<div class="app-job-modal__hero">' + heroMarkup + '</div>' +
      '<p class="app-job-modal__by">By <span>' +
      escapeHtml(d.poster) +
      '</span></p>' +
      '<p class="app-job-modal__posted">' +
      escapeHtml(formatPostedDisplay(d.posted)) +
      '</p>' +
      '<p class="app-job-modal__row"><strong>Schedule:</strong> ' +
      escapeHtml(d.schedule) +
      '</p>' +
      '<p class="app-job-modal__row"><strong>Type:</strong> ' +
      escapeHtml(d.typeLabel) +
      '</p>' +
      '<p class="app-job-modal__row app-job-modal__row--icon">' +
      '<img src="../assets/images/Location.png" alt="" class="app-job-modal__icon" width="18" height="18">' +
      '<span>' +
      escapeHtml(d.location) +
      '</span></p>' +
      '<p class="app-job-modal__row app-job-modal__row--icon">' +
      '<img src="../assets/images/Rate.png" alt="" class="app-job-modal__icon" width="18" height="18">' +
      '<span>' +
      escapeHtml(d.salary) +
      '</span></p>' +
      '<p class="app-job-modal__row"><strong>Settings:</strong> ' +
      escapeHtml(d.settingsLabel) +
      '</p>' +
      '<div class="app-job-modal__skills">' +
      '<span class="app-job-modal__skills-label">Skill Requirement(s):</span>' +
      '<div class="app-job-modal__tags">' +
      skillsTags +
      '</div></div>' +
      '<div class="app-job-modal__desc">' +
      '<span class="app-job-modal__desc-label">Description:</span>' +
      '<p class="app-job-modal__desc-text">' +
      escapeHtml(d.description) +
      '</p></div>' +
      '<div class="application-modal-your-app">' +
      '<span class="application-modal-your-app-label">Your application</span>' +
      '<span class="application-modal-your-app-status application-modal-status--' +
      escapeHtml(st) +
      '">' +
      escapeHtml(sm.label) +
      '</span>' +
      '<span class="application-modal-your-app-when">' +
      whenHtml +
      '</span></div>' +
      '<div class="application-modal-cancel-wrap">' +
      (entry && entry.status === 'accepted'
        ? '<button type="button" class="application-employer-contacts-btn">Employer Contacts</button>'
        : entry && (entry.status === 'rejected' || entry.status === 'terminated')
          ? '<button type="button" class="application-remove-from-list-btn">Remove from list</button>'
          : '<button type="button" class="application-cancel-app-btn">Cancel application</button>') +
      '</div>'
    );
  }

  async function removeApplicationByJobId(jobId) {
    try {
      if (window.RJGDb && typeof window.RJGDb.withdrawApplication === 'function') {
        await window.RJGDb.withdrawApplication(jobId);
      }
    } catch (err) {
      console.error('[My Applications] remove', err);
    }
  }

  function finalizeApplicationRemoval(toastMessage) {
    closeJobModal();
    renderList();
    if (typeof window.buildPostingGrid === 'function') window.buildPostingGrid();
    if (window.showAppToast) window.showAppToast(toastMessage, 'info');
  }

  function fillJobModal(entry) {
    console.log('fillJobModal called with entry:', entry);
    if (!jobModal) {
      console.log('jobModal not found');
      return;
    }
    try {
      console.log('Enriching application entry...');
      const enriched = enrichApplicationEntry(entry);
      console.log('Enriched entry:', enriched);
      currentModalEntry = enriched;
      const d = displayFieldsFromEntry(enriched);
      console.log('Display fields:', d);
      const titleEl = jobModal.querySelector('#applicationJobModalTitle');
      if (titleEl) titleEl.textContent = d.title;
      const mount = jobModal.querySelector('#applicationJobModalBodyMount');
      if (mount) {
        console.log('Building modal body HTML...');
        mount.innerHTML = buildModalBodyHtml(d, enriched);
        console.log('Modal body HTML built successfully');
      }
    } catch (err) {
      console.error('[My Applications] fillJobModal', err);
      console.error('Error stack:', err.stack);
      const mount = jobModal.querySelector('#applicationJobModalBodyMount');
      if (mount) {
        mount.innerHTML =
          '<p class="app-job-modal__row">Could not load job details. Try refreshing the page.</p>';
      }
    }
  }

  function openJobModal(entry) {
    if (!jobModal || !entry) return;
    fillJobModal(entry);
    jobModal.classList.add('open');
    jobModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('application-job-modal-open');
    if (closeHeader) closeHeader.focus();
  }

  function closeJobModal() {
    if (!jobModal) return;
    jobModal.classList.remove('open');
    jobModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('application-job-modal-open');
    currentModalEntry = null;
  }

  function closeEmployerContactsModal() {
    if (!employerContactsModal) return;
    employerContactsModal.classList.remove('open');
    employerContactsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('employer-contacts-modal-open');
  }

  async function openEmployerContactsModal(entry) {
    if (!employerContactsModal) return;
    const r = resolvePosterContactsForEntry(enrichApplicationEntry(entry));
    if (!r.email) {
      const fallbackEmail = await fetchPosterEmailFallback(entry && entry.postedBy);
      if (fallbackEmail) r.email = fallbackEmail;
    }
    const forLine = employerContactsModal.querySelector('#employerContactsForLine');
    const phoneEl = employerContactsModal.querySelector('#employerContactsPhone');
    const emailEl = employerContactsModal.querySelector('#employerContactsEmail');
    const linksMount = employerContactsModal.querySelector('#employerContactsLinksMount');
    if (forLine) {
      forLine.innerHTML =
        'Contact details for <strong>' + escapeHtml(r.posterLabel) + '</strong>';
    }
    if (phoneEl) {
      phoneEl.textContent = '';
      if (r.phone) {
        const t = document.createElement('a');
        t.className = 'employer-contacts-tel';
        t.href = 'tel:' + String(r.phone).replace(/\s/g, '');
        t.textContent = r.phone;
        phoneEl.appendChild(t);
      } else {
        phoneEl.textContent = '—';
      }
    }
    if (emailEl) {
      emailEl.textContent = '';
      if (r.email) {
        const a = document.createElement('a');
        a.className = 'employer-contacts-mail';
        a.href = 'mailto:' + r.email;
        a.textContent = r.email;
        emailEl.appendChild(a);
      } else {
        emailEl.textContent = '—';
      }
    }
    if (linksMount) {
      linksMount.textContent = '';
      if (r.links.length) {
        const ul = document.createElement('ul');
        ul.className = 'employer-contacts-links';
        r.links.forEach(function (href) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = href;
          li.appendChild(a);
          ul.appendChild(li);
        });
        linksMount.appendChild(ul);
      } else {
        linksMount.textContent = '—';
      }
    }
    employerContactsModal.classList.add('open');
    employerContactsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('employer-contacts-modal-open');
    if (employerContactsCloseBtn) employerContactsCloseBtn.focus();
  }

  if (closeHeader) closeHeader.addEventListener('click', closeJobModal);
  if (jobModal) {
    jobModal.addEventListener('click', function (e) {
      if (e.target === jobModal) return;
    });
    jobModal.addEventListener('click', function (e) {
      const contactsBtn = e.target.closest('.application-employer-contacts-btn');
      if (contactsBtn && jobModal.contains(contactsBtn)) {
        e.preventDefault();
        const entry = currentModalEntry;
        if (entry && entry.status === 'accepted') {
          Promise.resolve(openEmployerContactsModal(entry));
        }
        return;
      }
      const removeRejectedBtn = e.target.closest('.application-remove-from-list-btn');
      if (removeRejectedBtn && jobModal.contains(removeRejectedBtn)) {
        e.preventDefault();
        const entry = currentModalEntry;
        if (!entry || (entry.status !== 'rejected' && entry.status !== 'terminated') || entry.jobId == null || entry.jobId === '') return;
        if (typeof window.showAppConfirmModal !== 'function') return;
        window.showAppConfirmModal({
          title: 'Remove from your list?',
          message:
            'This rejected application will be removed from My Applications. You can still find the job on Job Listing if it is open.',
          confirmLabel: 'Remove from list',
          cancelLabel: 'Keep',
          danger: true,
          onConfirm: async function () {
            await removeApplicationByJobId(entry.jobId);
            finalizeApplicationRemoval('Removed from your list.');
          }
        });
        return;
      }
      const btn = e.target.closest('.application-cancel-app-btn');
      if (!btn || !jobModal.contains(btn)) return;
      e.preventDefault();
      const entry = currentModalEntry;
      if (!entry || entry.jobId == null || entry.jobId === '') return;
      if (typeof window.showAppConfirmModal !== 'function') return;
      window.showAppConfirmModal({
        title: 'Cancel this application?',
        message:
          'Your application will be withdrawn and removed from My Applications. Employers will no longer see you on their applicant list for this job.',
        confirmLabel: 'Cancel application',
        cancelLabel: 'Keep application',
        danger: true,
        onConfirm: async function () {
          await removeApplicationByJobId(entry.jobId);
          finalizeApplicationRemoval('Application canceled.');
        }
      });
    });
  }

  if (employerContactsCloseBtn) {
    employerContactsCloseBtn.addEventListener('click', closeEmployerContactsModal);
  }
  if (employerContactsModal) {
    employerContactsModal.addEventListener('click', function (e) {
      if (e.target === employerContactsModal) return;
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const confirmEl = document.getElementById('logoutConfirmModal');
    if (confirmEl && confirmEl.classList.contains('open')) return;
    const appConfirm = document.getElementById('appConfirmOverlay');
    if (appConfirm && appConfirm.classList.contains('open')) return;
    if (employerContactsModal && employerContactsModal.classList.contains('open')) {
      e.preventDefault();
      closeEmployerContactsModal();
      return;
    }
    if (jobModal && jobModal.classList.contains('open')) {
      e.preventDefault();
      closeJobModal();
    }
  });

  async function renderList() {
    console.log('renderList() called');
    const ul = document.getElementById('applicationList');
    if (!ul) {
      console.log('applicationList element not found');
      return;
    }

    const items = await loadApplications();
    console.log('Items to render:', items.length);
    if (!items.length) {
      console.log('No applications found, showing empty message');
      ul.innerHTML =
        '<li class="application-empty">You have not applied to any jobs yet. Open <a href="../seeker/dashb.html">Job Listing</a> to find roles.</li>';
      return;
    }

    ul.innerHTML = items
      .map((entry, index) => {
        const title = escapeHtml(entry.title || 'Job');
        const company = escapeHtml(entry.company || '—');
        const location = escapeHtml(entry.location || '');
        const metaLine = location ? `${company} · ${location}` : company;
        const applied = formatAppliedDisplay(entry.appliedAt);
        const sm = statusMeta(entry.status);
        const appliedHtml = applied
          ? `<p class="application-applied">${escapeHtml(applied)}</p>`
          : '';
        const imageSrc = escapeHtml(String(entry.image || '').trim());
        const thumbMarkup = imageSrc
          ? `<img src="${imageSrc}" alt="" class="application-card-thumb-img" loading="lazy">`
          : `<span class="application-card-thumb-no-image">No Image</span>`;
        return `<li class="application-card" role="button" tabindex="0" data-application-index="${index}" aria-label="View job details">
          <div class="application-card-thumb" aria-hidden="true">${thumbMarkup}</div>
          <div class="application-card-main">
            <h2 class="application-job-title">${title}</h2>
            <p class="application-meta">${metaLine}</p>
            ${appliedHtml}
          </div>
          <span class="application-status ${sm.className}">${escapeHtml(sm.label)}</span>
        </li>`;
      })
      .join('');
  }

  const applicationListEl = document.getElementById('applicationList');
  if (applicationListEl) {
    applicationListEl.addEventListener('click', function (e) {
      const card = e.target.closest('.application-card[data-application-index]');
      if (!card) return;
      const idx = Number(card.dataset.applicationIndex);
      Promise.resolve()
        .then(function () { return loadApplications(); })
        .then(function (items) {
          const entry = Array.isArray(items) ? items[idx] : null;
          if (entry) openJobModal(entry);
        });
    });

    applicationListEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.application-card[data-application-index]');
      if (!card) return;
      e.preventDefault();
      const idx = Number(card.dataset.applicationIndex);
      Promise.resolve()
        .then(function () { return loadApplications(); })
        .then(function (items) {
          const entry = Array.isArray(items) ? items[idx] : null;
          if (entry) openJobModal(entry);
        });
    });
  }

  renderList();
})();
