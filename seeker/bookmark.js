(function () {
  const SA = window.SeekerApp;
  if (!SA) {
    console.error('[Bookmarks] SeekerApp not loaded');
    return;
  }

  let currentBookmarkJob = null;
  function getRoleHomePage() {
    const role = String(
      (sessionStorage.getItem('rjgUserRole') || localStorage.getItem('rjgUserRole') || '')
    ).toLowerCase();
    return role === 'recruiter' || role === 'employer' ? '../recruiter/recruiter-dashb.html' : '../seeker/dashb.html';
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

  const backBtn = document.getElementById('bookmarkBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async function () {
      window.location.href = await resolveRoleHomePage();
    });
  }

  const jobModal = document.getElementById('bookmarkJobModal');
  const closeHeader = document.getElementById('bookmarkJobModalCloseHeader');
  const applyBtn = document.getElementById('bookmarkModalApplyBtn');
  const removeBtn = document.getElementById('bookmarkModalRemoveBtn');

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPostedDisplay(posted) {
    const s = posted == null ? '' : String(posted).trim();
    if (!s || s === '—') return '—';
    if (s.toLowerCase().startsWith('posted')) return s;
    return `Posted ${s}`;
  }

  async function hasAppliedToJob(job) {
    const key = typeof window.storedJobKey === 'function' ? window.storedJobKey(job) : '';
    if (!key) return false;
    if (!window.RJGDb || typeof window.RJGDb.hasApplied !== 'function') return false;
    return !!(await window.RJGDb.hasApplied(key));
  }

  function bookmarkDisplayFromJob(job) {
    const d = SA.normalizeJobDetailPayload(job);
    const skills = Array.isArray(d.skills) && d.skills.length ? d.skills : ['—'];
    return {
      poster: String(d.posterName || '—'),
      posted: d.postedAgo != null ? String(d.postedAgo) : '—',
      schedule: String(d.schedule || '—'),
      typeLabel: String(d.typeLabel || '—'),
      location: String(d.location || '—'),
      salary: String(d.salary || '—'),
      settingsLabel: String(d.settingsLabel || '—'),
      skills,
      description: String(d.description || 'No description available.')
    };
  }

  function buildBookmarkBodyHtml(d, job) {
    const skillsTags = (Array.isArray(d.skills) ? d.skills : ['—'])
      .map(function (s) {
        return '<span class="app-job-modal__tag">' + escapeHtml(String(s)) + '</span>';
      })
      .join('');
    const imageSrc = escapeHtml(String((job && job.image) || '').trim());
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
      '</p></div>'
    );
  }

  async function syncBookmarkApplyButton(job) {
    if (!applyBtn) return;
    if (!job) return;
    const applied = await hasAppliedToJob(job);
    applyBtn.disabled = applied;
    if (applied) {
      applyBtn.textContent = 'Job Applied';
      applyBtn.classList.add('bookmark-modal-btn--applied');
    } else {
      applyBtn.textContent = 'Apply';
      applyBtn.classList.remove('bookmark-modal-btn--applied');
    }
  }

  async function fillBookmarkModal(job) {
    if (!jobModal || !job) return;
    currentBookmarkJob = job;
    const d = bookmarkDisplayFromJob(job);
    const titleEl = document.getElementById('bookmarkJobModalTitle');
    if (titleEl) titleEl.textContent = SA.normalizeJobDetailPayload(job).title || job.title || 'Job';
    const mount = document.getElementById('bookmarkJobModalBodyMount');
    if (mount) mount.innerHTML = buildBookmarkBodyHtml(d, job);
    await syncBookmarkApplyButton(job);
  }

  async function openBookmarkModal(job) {
    if (!jobModal || !job) return;
    await fillBookmarkModal(job);
    jobModal.classList.add('open');
    jobModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bookmark-job-modal-open');
    if (closeHeader) closeHeader.focus();
  }

  function closeBookmarkModal() {
    if (!jobModal) return;
    jobModal.classList.remove('open');
    jobModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('bookmark-job-modal-open');
    currentBookmarkJob = null;
  }

  function formatBookmarkedLabel(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function renderList() {
    const ul = document.getElementById('bookmarkList');
    if (!ul) return;
    let items = [];
    try {
      items = window.RJGDb && typeof window.RJGDb.listBookmarks === 'function'
        ? await window.RJGDb.listBookmarks()
        : [];
    } catch (e) {
      items = [];
    }
    if (!items.length) {
      ul.innerHTML =
        '<li class="application-empty">You have no bookmarked jobs yet. Open <a href="../seeker/dashb.html">Job Listing</a> and tap Bookmark on a job.</li>';
      return;
    }
    ul.innerHTML = items
      .map(function (entry, index) {
        const title = escapeHtml(entry.title || 'Job');
        const company = escapeHtml(entry.company || '—');
        const location = escapeHtml(entry.location || '');
        const metaLine = location ? company + ' · ' + location : company;
        const when = entry._bookmarkedAt ? formatBookmarkedLabel(entry._bookmarkedAt) : '';
        const whenHtml = when
          ? '<p class="application-applied">Saved ' + escapeHtml(when) + '</p>'
          : '';
        const imageSrc = escapeHtml(String(entry.image || '').trim());
        const thumbMarkup = imageSrc
          ? `<img src="${imageSrc}" alt="" class="application-card-thumb-img" loading="lazy">`
          : `<span class="application-card-thumb-no-image">No Image</span>`;
        return (
          '<li class="application-card bookmark-card" role="button" tabindex="0" data-bookmark-index="' +
          index +
          '" aria-label="View bookmarked job">' +
          '<div class="application-card-thumb" aria-hidden="true">' + thumbMarkup + '</div>' +
          '<div class="application-card-main">' +
          '<h2 class="application-job-title">' +
          title +
          '</h2>' +
          '<p class="application-meta">' +
          metaLine +
          '</p>' +
          whenHtml +
          '</div>' +
          '<span class="bookmark-card-badge" aria-hidden="true">★</span>' +
          '</li>'
        );
      })
      .join('');
  }

  if (closeHeader) closeHeader.addEventListener('click', closeBookmarkModal);
  if (jobModal) {
    jobModal.addEventListener('click', function (e) {
      if (e.target === jobModal) return;
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      const job = currentBookmarkJob;
      if (!job) return;
      if (typeof window.showAppConfirmModal !== 'function') return;
      var d = SA.normalizeJobDetailPayload(job);
      if (
        !d.isOwnerView &&
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
        onConfirm: async function () {
          try {
            await SA.recordSeekerApplication(job);
            await syncBookmarkApplyButton(job);
            if (typeof window.buildPostingGrid === 'function') window.buildPostingGrid();
            if (window.showAppToast) window.showAppToast('Application submitted.', 'success');
          } catch (e) {
            if (window.showAppToast) window.showAppToast('Unable to submit application.', 'warn');
          }
        }
      });
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', function () {
      const job = currentBookmarkJob;
      if (!job || typeof window.showAppConfirmModal !== 'function') return;
      window.showAppConfirmModal({
        title: 'Remove bookmark?',
        message: 'This job will be removed from your bookmarks.',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        danger: true,
        onConfirm: async function () {
          try {
            if (window.RJGDb && typeof window.RJGDb.toggleBookmark === 'function' && job.id != null) {
              await window.RJGDb.toggleBookmark(String(job.id));
            }
            closeBookmarkModal();
            await renderList();
            if (window.showAppToast) window.showAppToast('Removed from bookmarks.', 'info');
          } catch (e) {
            if (window.showAppToast) window.showAppToast('Unable to remove bookmark.', 'warn');
          }
        }
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const confirmEl = document.getElementById('logoutConfirmModal');
    if (confirmEl && confirmEl.classList.contains('open')) return;
    const appConfirm = document.getElementById('appConfirmOverlay');
    if (appConfirm && appConfirm.classList.contains('open')) return;
    if (jobModal && jobModal.classList.contains('open')) {
      e.preventDefault();
      closeBookmarkModal();
    }
  });

  const listEl = document.getElementById('bookmarkList');
  if (listEl) {
    listEl.addEventListener('click', function (e) {
      const card = e.target.closest('.bookmark-card[data-bookmark-index]');
      if (!card) return;
      const idx = Number(card.dataset.bookmarkIndex);
      renderList().then(function () {
        const cards = Array.from(listEl.querySelectorAll('.bookmark-card[data-bookmark-index]'));
        const card2 = cards.find(function (c) { return Number(c.dataset.bookmarkIndex) === idx; });
        if (!card2) return;
        // Re-load source list for correct entry mapping
        Promise.resolve()
          .then(function () {
            return window.RJGDb && typeof window.RJGDb.listBookmarks === 'function' ? window.RJGDb.listBookmarks() : [];
          })
          .then(async function (items2) {
            const entry = Array.isArray(items2) ? items2[idx] : null;
            if (entry) await openBookmarkModal(entry);
          });
      });
    });
    listEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.bookmark-card[data-bookmark-index]');
      if (!card) return;
      e.preventDefault();
      const idx = Number(card.dataset.bookmarkIndex);
      Promise.resolve()
        .then(function () {
          return window.RJGDb && typeof window.RJGDb.listBookmarks === 'function' ? window.RJGDb.listBookmarks() : [];
        })
        .then(async function (items2) {
          const entry = Array.isArray(items2) ? items2[idx] : null;
          if (entry) await openBookmarkModal(entry);
        });
    });
  }

  renderList();
})();
