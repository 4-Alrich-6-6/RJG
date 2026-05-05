(function () {
  if (window.showAppConfirmModal) return;

  function ensureAppConfirmModal() {
    let overlay = document.getElementById('appConfirmOverlay');
    if (overlay) return overlay;

    const style = document.createElement('style');
    style.id = 'appConfirmModalStyles';
    style.textContent = `
      .app-confirm-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.38);z-index:1400;padding:16px;overflow-y:auto;overflow-x:hidden}
      .app-confirm-overlay.open{display:flex}
      .app-confirm-modal{width:min(460px,100%);max-height:min(88vh,700px);overflow-y:auto;overflow-x:hidden;background:#fff;border-radius:16px;border:1px solid #e9e9e9;box-shadow:0 18px 48px rgba(0,0,0,0.2);padding:24px}
      .app-confirm-title{margin:0 0 10px;font-family:Montserrat,Inter,sans-serif;font-size:26px;font-weight:700;color:#000;line-height:1.2}
      .app-confirm-text{margin:0;font-family:Inter,sans-serif;font-size:16px;line-height:1.45;color:#1a1a1a;white-space:pre-wrap;overflow-wrap:anywhere}
      .app-confirm-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
      .app-confirm-btn{border:none;border-radius:10px;padding:10px 16px;font-family:Inter,sans-serif;font-size:14px;font-weight:700;cursor:pointer;line-height:1}
      .app-confirm-btn-cancel{background:#efefef;color:#1a1a1a}
      .app-confirm-btn-ok{background:#5b8c51;color:#fff}
      .app-confirm-btn-ok.app-confirm-btn--danger{background:#9e2a2a;color:#fff}
      .app-confirm-btn:hover{opacity:0.92}
      .app-confirm-spinner-wrap{display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px 0 6px}
      .app-confirm-spinner-wrap.visible{display:flex}
      .app-confirm-spinner{width:44px;height:44px;border:4px solid #e0e0e0;border-top-color:#5b8c51;border-radius:50%;animation:app-confirm-spin 0.75s linear infinite}
      .app-confirm-spinner-label{font-family:Inter,sans-serif;font-size:15px;font-weight:600;color:#444;letter-spacing:0.01em}
      @keyframes app-confirm-spin{to{transform:rotate(360deg)}}
      @media (max-width:768px){
        .app-confirm-modal{width:min(380px,100%);max-height:90vh;padding:20px;border-radius:14px}
        .app-confirm-title{font-size:22px}
        .app-confirm-text{font-size:15px}
        .app-confirm-actions{justify-content:stretch;flex-direction:column-reverse}
        .app-confirm-btn{flex:1;font-size:14px;padding:11px 14px}
      }
    `;
    document.head.appendChild(style);

    overlay = document.createElement('div');
    overlay.id = 'appConfirmOverlay';
    overlay.className = 'app-confirm-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="appConfirmTitle">
        <h2 class="app-confirm-title" id="appConfirmTitle"></h2>
        <p class="app-confirm-text" id="appConfirmText"></p>
        <div class="app-confirm-actions">
          <button type="button" class="app-confirm-btn app-confirm-btn-cancel" id="appConfirmCancel"></button>
          <button type="button" class="app-confirm-btn app-confirm-btn-ok" id="appConfirmOk"></button>
        </div>
        <div class="app-confirm-spinner-wrap" id="appConfirmSpinnerWrap" aria-live="polite" aria-label="Please Wait">
          <div class="app-confirm-spinner" role="status"></div>
          <span class="app-confirm-spinner-label">Please Wait</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function showSpinner() {
      overlay.querySelector('#appConfirmSpinnerWrap').classList.add('visible');
      overlay.querySelector('.app-confirm-actions').style.display = 'none';
      overlay.querySelector('#appConfirmTitle').style.display = 'none';
      overlay.querySelector('#appConfirmText').style.display = 'none';
    }

    function hideSpinner() {
      overlay.querySelector('#appConfirmSpinnerWrap').classList.remove('visible');
      overlay.querySelector('.app-confirm-actions').style.display = '';
      overlay.querySelector('#appConfirmTitle').style.display = '';
      overlay.querySelector('#appConfirmText').style.display = '';
    }

    function closeAppConfirm() {
      hideSpinner();
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      overlay._pendingConfirm = null;
    }

    overlay._closeAppConfirm = closeAppConfirm;

    overlay.querySelector('#appConfirmOk').addEventListener('click', async () => {
      const fn = overlay._pendingConfirm;
      overlay._pendingConfirm = null;
      overlay.querySelector('#appConfirmOk').disabled = true;
      overlay.querySelector('#appConfirmCancel').disabled = true;
      showSpinner();
      try {
        if (typeof fn === 'function') await fn();
      } finally {
        closeAppConfirm();
      }
    });

    overlay.querySelector('#appConfirmCancel').addEventListener('click', closeAppConfirm);

    overlay.addEventListener('click', () => {
      // Do not close when clicking outside the modal.
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        const spinnerWrap = overlay.querySelector('#appConfirmSpinnerWrap');
        if (spinnerWrap && spinnerWrap.classList.contains('visible')) return;
        closeAppConfirm();
      }
    });

    return overlay;
  }

  function showAppConfirmModal(opts) {
    const overlay = ensureAppConfirmModal();
    const okBtn = overlay.querySelector('#appConfirmOk');
    const cancelBtn = overlay.querySelector('#appConfirmCancel');

    okBtn.disabled = false;
    cancelBtn.disabled = false;

    overlay.querySelector('#appConfirmTitle').textContent = opts.title || 'Confirm';
    overlay.querySelector('#appConfirmText').textContent = opts.message || '';
    okBtn.textContent = opts.confirmLabel || 'OK';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';
    cancelBtn.style.display = opts.hideCancel ? 'none' : '';
    okBtn.className =
      'app-confirm-btn app-confirm-btn-ok' + (opts.danger ? ' app-confirm-btn--danger' : '');

    overlay._pendingConfirm = opts.onConfirm || null;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  window.ensureAppConfirmModal = ensureAppConfirmModal;
  window.showAppConfirmModal = showAppConfirmModal;
})();