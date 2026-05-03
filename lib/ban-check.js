/**
 * Ban Check Utility - Checks if user is banned and shows notification modal
 * This should be included on all pages after database.js and ban-notification.js
 */

(function() {
  'use strict';

  let banCheckInProgress = false;
  let banNotificationShown = false;

  /**
   * Check if the current user is banned and show notification if needed
   * @returns {Promise<{isBanned: boolean, reason: string|null}>}
   */
  async function checkAndHandleBanStatus() {
    // Prevent multiple simultaneous checks
    if (banCheckInProgress) {
      return { isBanned: false, reason: null };
    }

    // Prevent showing notification multiple times
    if (banNotificationShown) {
      return { isBanned: true, reason: 'Already notified' };
    }

    banCheckInProgress = true;

    try {
      // Check if required functions are available
      if (!window.RJGDb || typeof window.RJGDb.checkUserBanStatus !== 'function') {
        console.warn('Ban check function not available');
        return { isBanned: false, reason: null };
      }

      if (!window.showBanNotificationModal) {
        console.warn('Ban notification modal not available');
        return { isBanned: false, reason: null };
      }

      // Check user's ban status
      const banStatus = await window.RJGDb.checkUserBanStatus();
      
      if (banStatus.isBanned) {
        console.log('User is banned, showing notification:', banStatus);
        
        // Show ban notification modal
        window.showBanNotificationModal({
          title: 'Account Suspended',
          message: banStatus.reason || 'You got banned. Contact support for more inquiries.',
          buttonText: 'Go back to Log-in'
        });
        
        banNotificationShown = true;
        
        // Optional: Log the ban event for analytics/security
        console.log('Ban notification displayed for user:', banStatus.userData);
        
        return banStatus;
      }

      return { isBanned: false, reason: null };

    } catch (error) {
      console.error('Error during ban check:', error);
      return { isBanned: false, reason: null };
    } finally {
      banCheckInProgress = false;
    }
  }

  /**
   * Initialize ban checking for the current page
   * This should be called after user authentication is established
   */
  async function initializeBanCheck() {
    // Wait a moment for authentication to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await checkAndHandleBanStatus();
    } catch (error) {
      console.error('Failed to initialize ban check:', error);
    }
  }

  /**
   * Reset ban notification flag (for testing or special cases)
   */
  function resetBanNotification() {
    banNotificationShown = false;
  }

  /**
   * Check if ban notification has been shown
   */
  function isBanNotificationShown() {
    return banNotificationShown;
  }

  // Auto-initialize on page load (with delay for auth)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBanCheck);
  } else {
    // DOM already loaded, initialize after a short delay
    setTimeout(initializeBanCheck, 1500);
  }

  // Also check on visibility change (user returns to tab)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && !banNotificationShown) {
      // Small delay to ensure auth state is current
      setTimeout(async () => {
        try {
          await checkAndHandleBanStatus();
        } catch (error) {
          console.warn('Ban check on visibility change failed:', error);
        }
      }, 500);
    }
  });

  // Expose functions globally
  window.RJGBanCheck = {
    checkAndHandleBanStatus,
    initializeBanCheck,
    resetBanNotification,
    isBanNotificationShown
  };

})();
