/**
 * Security Feedback System with Rate Limiting
 * Provides proper feedback messages for security-sensitive operations
 */

class SecurityFeedbackSystem {
  constructor() {
    this.rateLimits = new Map(); // Track rate limits per action type
    this.feedbackQueue = []; // Queue for delayed feedback messages
    this.isProcessing = false;
    
    // Configuration for different security actions
    this.actionConfig = {
      'send_otp': {
        delay: 3000, // 3 seconds delay
        maxAttempts: 3, // Max attempts per time window
        timeWindow: 300000, // 5 minutes time window
        messages: {
          success: 'Security code sent to your email. Please check all folders including spam. For your security, please wait {delay} seconds before requesting another code.',
          rate_limit: 'For security purposes, please wait {waitTime} before requesting another security code.',
          error: 'Failed to send security code. Please try again later.'
        }
      },
      'verify_otp': {
        delay: 1000, // 1 second delay
        maxAttempts: 5, // Max attempts per time window
        timeWindow: 900000, // 15 minutes time window
        messages: {
          success: 'Verification successful. Your account has been updated.',
          invalid: 'Invalid security code. Please check your email and try again.',
          expired: 'Security code has expired. Please request a new one.',
          rate_limit: 'Too many failed attempts. For security, please wait {waitTime} before trying again.',
          error: 'Verification failed. Please try again later.'
        }
      },
      'change_password': {
        delay: 2000, // 2 seconds delay
        maxAttempts: 3,
        timeWindow: 600000, // 10 minutes time window
        messages: {
          success: 'Password changed successfully. For your security, you may need to log in again.',
          weak: 'Password does not meet security requirements. Please choose a stronger password.',
          incorrect: 'Current password is incorrect. Please try again.',
          rate_limit: 'For security purposes, please wait {waitTime} before attempting another password change.',
          error: 'Password change failed. Please try again later.'
        }
      },
      'change_email': {
        delay: 5000, // 5 seconds delay
        maxAttempts: 3,
        timeWindow: 600000, // 10 minutes time window
        messages: {
          success: 'Email update initiated. Please verify your new email address to complete the change.',
          exists: 'This email address is already associated with another account.',
          rate_limit: 'For security purposes, please wait {waitTime} before attempting another email change.',
          error: 'Email change failed. Please try again later.'
        }
      },
      'delete_account': {
        delay: 10000, // 10 seconds delay
        maxAttempts: 2,
        timeWindow: 86400000, // 24 hours time window
        messages: {
          success: 'Account deletion request received. For your security, this action cannot be undone.',
          confirm: 'Please confirm you want to delete your account. This action is permanent.',
          rate_limit: 'For security purposes, account deletion requests are limited. Please wait {waitTime} before trying again.',
          error: 'Account deletion failed. Please contact support if this issue persists.'
        }
      }
    };
  }

  /**
   * Check if an action is rate limited
   */
  isRateLimited(actionType) {
    const config = this.actionConfig[actionType];
    if (!config) return false;

    const now = Date.now();
    const rateLimitKey = actionType;
    const rateLimitData = this.rateLimits.get(rateLimitKey);

    if (!rateLimitData) {
      // First time this action is performed
      this.rateLimits.set(rateLimitKey, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return false;
    }

    // Check if we're outside the time window
    if (now - rateLimitData.firstAttempt > config.timeWindow) {
      // Reset the counter
      this.rateLimits.set(rateLimitKey, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return false;
    }

    // Check if we've exceeded max attempts
    if (rateLimitData.attempts >= config.maxAttempts) {
      return true;
    }

    // Increment attempt counter
    rateLimitData.attempts++;
    rateLimitData.lastAttempt = now;
    return false;
  }

  /**
   * Get wait time for rate limited action
   */
  getWaitTime(actionType) {
    const config = this.actionConfig[actionType];
    if (!config) return 0;

    const rateLimitData = this.rateLimits.get(actionType);
    if (!rateLimitData) return 0;

    const timeUntilReset = config.timeWindow - (Date.now() - rateLimitData.firstAttempt);
    return Math.max(0, timeUntilReset);
  }

  /**
   * Format wait time into human readable format
   */
  formatWaitTime(milliseconds) {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.ceil(seconds / 60);
    const hours = Math.ceil(minutes / 60);

    if (hours > 1) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 1) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  /**
   * Show security feedback message with delay
   */
  async showFeedback(actionType, messageType, customMessage = null) {
    const config = this.actionConfig[actionType];
    if (!config) return;

    // Check rate limiting first
    if (this.isRateLimited(actionType)) {
      const waitTime = this.getWaitTime(actionType);
      const waitTimeFormatted = this.formatWaitTime(waitTime);
      const message = config.messages.rate_limit.replace('{waitTime}', waitTimeFormatted);
      this.showToast(message, 'warning');
      return;
    }

    // Get the appropriate message
    let message = customMessage;
    if (!message && config.messages[messageType]) {
      message = config.messages[messageType];
      if (message.includes('{delay}')) {
        const delaySeconds = Math.ceil(config.delay / 1000);
        message = message.replace('{delay}', delaySeconds);
      }
    }

    if (!message) return;

    // Show the message after the configured delay
    await this.delayedToast(message, this.getMessageType(messageType), config.delay);
  }

  /**
   * Get toast message type based on security message type
   */
  getMessageType(securityMessageType) {
    const typeMap = {
      'success': 'success',
      'weak': 'warning',
      'incorrect': 'error',
      'invalid': 'error',
      'expired': 'warning',
      'exists': 'warning',
      'confirm': 'info',
      'rate_limit': 'warning',
      'error': 'error'
    };
    return typeMap[securityMessageType] || 'info';
  }

  /**
   * Show toast message after delay
   */
  async delayedToast(message, type, delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.showToast(message, type);
        resolve();
      }, delay);
    });
  }

  /**
   * Show toast message (uses existing toast system)
   */
  showToast(message, type = 'info') {
    if (window.showAppToast) {
      window.showAppToast(message, type);
    } else {
      // Fallback to console
      console.log(`[${type.toUpperCase()}] ${message}`);
      // Create a simple toast if no toast system exists
      this.createSimpleToast(message, type);
    }
  }

  /**
   * Create a simple toast element as fallback
   */
  createSimpleToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      word-wrap: break-word;
      ${this.getToastColor(type)}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  /**
   * Get toast color based on type
   */
  getToastColor(type) {
    const colors = {
      'success': 'background-color: #28a745;',
      'error': 'background-color: #dc3545;',
      'warning': 'background-color: #ffc107; color: #212529;',
      'info': 'background-color: #17a2b8;'
    };
    return colors[type] || colors['info'];
  }

  /**
   * Reset rate limiting for a specific action
   */
  resetRateLimit(actionType) {
    this.rateLimits.delete(actionType);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits() {
    this.rateLimits.clear();
  }
}

// Create global instance
window.securityFeedback = new SecurityFeedbackSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityFeedbackSystem;
}
