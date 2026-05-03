(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('preferencesForm');
    const scheduleSelect = document.getElementById('prefSchedule');
    const settingSelect = document.getElementById('prefSetting');
    const typeSelect = document.getElementById('prefType');
    const currencySelect = document.getElementById('prefCurrency');
    const minRateInput = document.getElementById('prefMinRate');
    const maxRateInput = document.getElementById('prefMaxRate');
    const rateUnitSelect = document.getElementById('prefRateUnit');
    const notesInput = document.getElementById('prefNotes');
    const saveBtn = document.getElementById('savePreferencesBtn');

    // Populate dropdown with options from database (filter out "Other" options)
    function populateDropdown(selectEl, options, includeEmpty = true) {
        if (!selectEl) return;
        const currentValue = selectEl.value;
        selectEl.innerHTML = '';
        
        if (includeEmpty) {
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = 'Select...';
            selectEl.appendChild(emptyOpt);
        }
        
        // Filter out options where isOther is true
        const filteredOptions = options.filter(opt => !opt.isOther);
        
        filteredOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.label;
            option.textContent = opt.label;
            option.dataset.code = opt.code;
            selectEl.appendChild(option);
        });
        
        // Restore value if still valid
        if (currentValue) {
            const matchingOpt = Array.from(selectEl.options).find(o => o.value === currentValue);
            if (matchingOpt) selectEl.value = currentValue;
        }
    }

    // Load dropdown options from database
    async function loadDropdownOptions() {
        if (!window.RJGDb || typeof window.RJGDb.ensureDropdownOptionCache !== 'function') {
            console.warn('RJGDb.ensureDropdownOptionCache not available');
            return;
        }

        try {
            const supa = window.RJGDb.getClient ? window.RJGDb.getClient() : null;
            if (supa) {
                await window.RJGDb.ensureDropdownOptionCache(supa);
            }
            
            // Get options for each category (matching job posting dropdowns)
            const scheduleOpts = window.RJGDb.getDropdownOptions ? window.RJGDb.getDropdownOptions('schedule') : [];
            const settingOpts = window.RJGDb.getDropdownOptions ? window.RJGDb.getDropdownOptions('work_setting') : [];
            const categoryOpts = window.RJGDb.getDropdownOptions ? window.RJGDb.getDropdownOptions('job_category') : [];
            const currencyOpts = window.RJGDb.getDropdownOptions ? window.RJGDb.getDropdownOptions('currency') : [];
            const rateUnitOpts = window.RJGDb.getDropdownOptions ? window.RJGDb.getDropdownOptions('rate_unit') : [];
            
            populateDropdown(scheduleSelect, scheduleOpts);
            populateDropdown(settingSelect, settingOpts);
            populateDropdown(typeSelect, categoryOpts); // Job Category from job posting
            populateDropdown(currencySelect, currencyOpts, false);
            populateDropdown(rateUnitSelect, rateUnitOpts, false);
            
        } catch (err) {
            console.error('Failed to load dropdown options:', err);
        }
    }

    // Helper to resolve dropdown code to label
    function resolveLabelFromCode(category, code) {
        if (!code || !window.RJGDb || typeof window.RJGDb.getDropdownOptions !== 'function') return code;
        const options = window.RJGDb.getDropdownOptions(category);
        const match = options.find(opt => opt.code === code || opt.label === code);
        return match ? match.label : code;
    }

    // Load preferences from database
    async function loadPreferences() {
        if (!window.RJGDb || typeof window.RJGDb.loadSeekerPreferences !== 'function') {
            console.warn('RJGDb.loadSeekerPreferences not available');
            return;
        }

        try {
            const prefs = await window.RJGDb.loadSeekerPreferences();
            if (!prefs) return;

            // Resolve codes to labels for dropdown matching
            const scheduleLabel = resolveLabelFromCode('schedule', prefs.schedule);
            const settingLabel = resolveLabelFromCode('work_setting', prefs.setting);
            const typeLabel = resolveLabelFromCode('job_category', prefs.type);
            const currencyLabel = resolveLabelFromCode('currency', prefs.currency);
            const rateUnitLabel = resolveLabelFromCode('rate_unit', prefs.rateUnit);

            // Populate form
            if (scheduleSelect) scheduleSelect.value = scheduleLabel || '';
            if (settingSelect) settingSelect.value = settingLabel || '';
            if (typeSelect) typeSelect.value = typeLabel || '';
            if (currencySelect) currencySelect.value = currencyLabel || 'PHP';
            if (minRateInput) minRateInput.value = prefs.minRate || '';
            if (maxRateInput) maxRateInput.value = prefs.maxRate || '';
            if (rateUnitSelect) rateUnitSelect.value = rateUnitLabel || 'hour';
            if (notesInput) notesInput.value = prefs.notes || '';

        } catch (err) {
            console.error('Failed to load preferences:', err);
            notify('Failed to load preferences.', 'error');
        }
    }

    // Save preferences to database
    async function savePreferences(e) {
        e.preventDefault();
        
        if (!window.RJGDb || typeof window.RJGDb.saveSeekerPreferences !== 'function') {
            console.warn('RJGDb.saveSeekerPreferences not available');
            return;
        }

        const prefs = {
            schedule: scheduleSelect ? scheduleSelect.value : '',
            scheduleOther: '',
            setting: settingSelect ? settingSelect.value : '',
            settingOther: '',
            type: typeSelect ? typeSelect.value : '',
            typeOther: '',
            currency: currencySelect ? currencySelect.value : 'PHP',
            minRate: minRateInput && minRateInput.value ? Number(minRateInput.value) : null,
            maxRate: maxRateInput && maxRateInput.value ? Number(maxRateInput.value) : null,
            rateUnit: rateUnitSelect ? rateUnitSelect.value : 'hour',
            notes: notesInput ? notesInput.value.trim() : ''
        };

        // Show confirmation
        if (typeof window.showAppConfirmModal === 'function') {
            window.showAppConfirmModal({
                title: 'Save Preferences?',
                message: 'Are you sure you want to save these job preferences?',
                confirmLabel: 'Save',
                cancelLabel: 'Cancel',
                danger: false,
                onConfirm: async () => {
                    await doSave(prefs);
                }
            });
        } else {
            await doSave(prefs);
        }
    }

    async function doSave(prefs) {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        try {
            // Save directly to seeker_preferences table
            await window.RJGDb.saveSeekerPreferences(prefs);
            // Also keep user_profile.preferences in sync
            if (typeof window.RJGDb.loadCurrentUserProfile === 'function' && typeof window.RJGDb.saveCurrentUserProfile === 'function') {
                try {
                    const profile = await window.RJGDb.loadCurrentUserProfile();
                    if (profile) {
                        profile.preferences = prefs;
                        await window.RJGDb.saveCurrentUserProfile(profile);
                    }
                } catch (syncErr) {
                    console.warn('Profile preferences sync failed (non-critical):', syncErr);
                }
            }
            notify('Preferences saved successfully.', 'success');
        } catch (err) {
            console.error('Failed to save preferences:', err);
            const prefMsg = (window.RJGErrorHandler && window.RJGErrorHandler.getUserFriendlyMessage(err, 'Unable to save your preferences. Please try again.')) || 'Unable to save your preferences. Please try again.';
            notify(prefMsg, 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Preferences';
            }
        }
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', savePreferences);
    }

    // Back button
    const backBtn = document.getElementById('profileBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../seeker/dashb.html';
        });
    }

    // Load dropdowns first, then preferences on page load
    document.addEventListener('DOMContentLoaded', async () => {
        await loadDropdownOptions();
        await loadPreferences();
    });

    // Helper function for notifications
    function notify(message, type = 'info') {
        if (window.showAppToast) {
            window.showAppToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
})();
