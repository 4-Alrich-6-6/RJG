(function () {
  function storedJobKey(job) {
    if (!job || typeof job !== 'object') return '';
    const title = String(job.title || '').trim();
    if (job.id != null && String(job.id).trim() !== '') return String(job.id);
    if (!title && job.id == null) return '';
    return `${title}|${String(job.company || '').trim()}`;
  }

  window.storedJobKey = storedJobKey;
  // DB-reliant bookmarks: use window.RJGDb in pages (async).
})();
