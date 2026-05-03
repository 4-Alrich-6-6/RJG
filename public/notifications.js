(function () {
  function getRoleHomePage() {
    const role = String(
      (sessionStorage.getItem('rjgUserRole') || localStorage.getItem('rjgUserRole') || '')
    ).toLowerCase();
    return role === 'recruiter' || role === 'employer' ? '/recruiter/recruiter-dashb.html' : '/seeker/dashb.html';
  }
  async function resolveRoleHomePage() {
    if (window.RJGDb && typeof window.RJGDb.getCurrentUserRole === 'function') {
      try {
        const dbRole = String((await window.RJGDb.getCurrentUserRole()) || '').toLowerCase();
        if (dbRole) {
          sessionStorage.setItem('rjgUserRole', dbRole);
          localStorage.setItem('rjgUserRole', dbRole);
          return dbRole === 'recruiter' || dbRole === 'employer' ? '/recruiter/recruiter-dashb.html' : '/seeker/dashb.html';
        }
      } catch (error) {}
    }
    return getRoleHomePage();
  }
  const backBtn = document.getElementById('notificationsBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async function () {
      window.location.href = await resolveRoleHomePage();
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  async function renderList() {
    const ul = document.getElementById('notificationList');
    if (!ul) return;
    let items = [];
    try {
      items = window.RJGDb && typeof window.RJGDb.listNotifications === 'function'
        ? await window.RJGDb.listNotifications()
        : [];
    } catch (e) {
      items = [];
    }
    if (!items.length) {
      ul.innerHTML =
        '<li class="application-empty">' +
        'No notifications yet.' +
        '</li>';
      return;
    }
    const sorted = items.slice().sort(function (a, b) {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    ul.innerHTML = sorted
      .map(function (n) {
        const title = escapeHtml(n.title || 'Notification');
        const body = escapeHtml(n.body || '');
        const isUnread = !n.readAt;
        const unreadIndicator = isUnread ? '<span class="notification-item__unread"></span>' : '';
        return (
          '<li class="notification-item' + (isUnread ? ' notification-item--unread' : '') + '" data-notification-id="' +
          escapeHtml(String(n.id != null ? n.id : '')) +
          '">' +
          '<div class="notification-item__main">' +
          '<div class="notification-item__header">' +
          '<h2 class="notification-item__title">' +
          title +
          '</h2>' +
          '<div class="notification-item__actions">' +
          unreadIndicator +
          '<button type="button" class="notification-item__delete" data-notification-id="' +
          escapeHtml(String(n.id != null ? n.id : '')) +
          '" title="Delete notification" aria-label="Delete notification">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notification-delete-icon">' +
          '<path d="M3 6h18"></path>' +
          '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
          '<line x1="10" y1="11" x2="10" y2="17"></line>' +
          '<line x1="14" y1="11" x2="14" y2="17"></line>' +
          '</svg>' +
          '</button>' +
          '</div>' +
          '</div>' +
          (body ? '<p class="notification-item__body">' + body + '</p>' : '') +
          '</div></li>'
        );
      })
      .join('');

    // Add click handlers to mark notifications as read
    ul.querySelectorAll('.notification-item').forEach(function(item) {
      item.addEventListener('click', async function(e) {
        // Don't mark as read if clicking on delete button
        if (e.target.closest('.notification-item__delete')) return;
        
        const id = item.getAttribute('data-notification-id');
        if (!id) return;
        try {
          const success = await window.RJGDb.markNotificationAsRead(id);
          if (success) {
            item.classList.remove('notification-item--unread');
            const unreadIndicator = item.querySelector('.notification-item__unread');
            if (unreadIndicator) unreadIndicator.remove();
          }
        } catch (e) {
          console.warn('Failed to mark notification as read:', e);
        }
      });
    });

    // Add click handlers to delete buttons
    ul.querySelectorAll('.notification-item__delete').forEach(function(button) {
      button.addEventListener('click', async function(e) {
        e.stopPropagation(); // Prevent marking as read
        const id = button.getAttribute('data-notification-id');
        if (!id) return;
        
        // Show confirmation dialog
        if (typeof window.showAppConfirmModal === 'function') {
          window.showAppConfirmModal({
            title: "Delete Notification",
            message: "Are you sure you want to delete this notification? This action cannot be undone.",
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
            danger: true,
            onConfirm: async function () {
              try {
                const success = await window.RJGDb.deleteNotification(id);
                if (success) {
                  // Remove the notification item with animation
                  const item = button.closest('.notification-item');
                  if (item) {
                    item.style.transition = 'opacity 0.3s, transform 0.3s';
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                      item.remove();
                      // If no notifications left, show empty message
                      const remainingItems = ul.querySelectorAll('.notification-item');
                      if (remainingItems.length === 0) {
                        ul.innerHTML = '<li class="application-empty">No notifications yet.</li>';
                      }
                    }, 300);
                  }
                }
              } catch (e) {
                console.warn('Failed to delete notification:', e);
                if (window.showAppToast) {
                  window.showAppToast('Failed to delete notification', 'error');
                }
              }
            }
          });
        } else {
          // Fallback: delete without confirmation if modal not available
          try {
            const success = await window.RJGDb.deleteNotification(id);
            if (success) {
              const item = button.closest('.notification-item');
              if (item) {
                item.style.transition = 'opacity 0.3s, transform 0.3s';
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                setTimeout(() => {
                  item.remove();
                  const remainingItems = ul.querySelectorAll('.notification-item');
                  if (remainingItems.length === 0) {
                    ul.innerHTML = '<li class="application-empty">No notifications yet.</li>';
                  }
                }, 300);
              }
            }
          } catch (e) {
            console.warn('Failed to delete notification:', e);
          }
        }
      });
    });
  }

  renderList();
})();
