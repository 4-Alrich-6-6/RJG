/**
 * Error Handler Utility - Converts technical errors to user-friendly messages
 * Handles Supabase rate limits and other technical errors gracefully
 */

(function() {
  'use strict';

  function getUserFriendlyMessage(error, defaultMessage) {
    if (!error || !error.message) {
      return defaultMessage || 'Something went wrong. Please try again.';
    }

    const errorMsg = String(error.message).toLowerCase();
    
    // Rate limiting errors
    if (errorMsg.includes('too many requests') || errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (errorMsg.includes('over_email_send_rate_limit')) {
      const waitTime = error.message && error.message.match(/(\d+)\s+seconds/) 
        ? error.message.match(/(\d+)\s+seconds/)[1] 
        : 'a few';
      return `Please wait for ${waitTime} seconds before trying again.`;
    }

    // Authentication errors
    if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid_grant') || 
        errorMsg.includes('wrong password') || errorMsg.includes('invalid password')) {
      return 'Invalid email or password. Please try again.';
    }

    if (errorMsg.includes('email not confirmed') || errorMsg.includes('email_not_confirmed')) {
      return 'Your email is not yet verified. Please check your inbox for the verification link.';
    }

    if (errorMsg.includes('user not found') || errorMsg.includes('no user found')) {
      return 'No account found with this email. Please sign up first.';
    }

    if (errorMsg.includes('user already registered') || errorMsg.includes('email address is already') ||
        errorMsg.includes('user_already_exists') || errorMsg.includes('duplicate key') ||
        errorMsg.includes('already in use')) {
      return 'An account with this email already exists. Please log in instead.';
    }

    if (errorMsg.includes('weak password') || errorMsg.includes('password too short') || 
        errorMsg.includes('password_strength')) {
      return 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.';
    }

    if (errorMsg.includes('invalid email') || errorMsg.includes('email_address_invalid')) {
      return 'Please enter a valid email address.';
    }

    if (errorMsg.includes('expired') || errorMsg.includes('token')) {
      return 'Your session has expired. Please log in again.';
    }

    if (errorMsg.includes('network') || errorMsg.includes('connection') || 
        errorMsg.includes('fetch') || errorMsg.includes('offline')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (errorMsg.includes('permission') || errorMsg.includes('unauthorized') || 
        errorMsg.includes('access denied')) {
      return 'You do not have permission to perform this action.';
    }

    if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
      return 'The requested resource was not found.';
    }

    if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
      return 'Please check your input and try again.';
    }

    // Database/storage errors
    if (errorMsg.includes('storage') || errorMsg.includes('upload') || errorMsg.includes('file')) {
      return 'File upload failed. Please try again.';
    }

    if (errorMsg.includes('database') || errorMsg.includes('constraint') || 
        errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
      return 'Data could not be saved. Please check your information and try again.';
    }

    // If we can't identify the specific error, return a generic user-friendly message
    return defaultMessage || 'Something went wrong. Please try again.';
  }

  function showUserError(error, defaultMessage, showToastFunction) {
    const userMessage = getUserFriendlyMessage(error, defaultMessage);
    
    // Log the technical error for debugging
    console.error('Technical error details:', error);
    console.error('User-friendly message:', userMessage);
    
    if (showToastFunction && typeof showToastFunction === 'function') {
      showToastFunction(userMessage, 'error');
    } else if (window.showAppToast && typeof window.showAppToast === 'function') {
      window.showAppToast(userMessage, 'error');
    } else if (window.notify && typeof window.notify === 'function') {
      window.notify(userMessage, 'warn');
    } else {
      console.error('User message:', userMessage);
    }
  }

  // Expose the utility functions
  window.RJGErrorHandler = {
    getUserFriendlyMessage,
    showUserError
  };

})();
