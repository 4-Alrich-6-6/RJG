// Image Modal functionality for seekers and recruiters
(function() {
  console.log('Image modal script loading...');
  
  // Wait for DOM to be ready
  function initImageModal() {
    const imageModalOverlay = document.getElementById('imageModalOverlay');
    const imageModalImg = document.getElementById('imageModalImg');
    const imageModalClose = document.getElementById('imageModalClose');

    console.log('Image modal elements found:', {
      overlay: !!imageModalOverlay,
      img: !!imageModalImg,
      close: !!imageModalClose
    });

    if (!imageModalOverlay || !imageModalImg || !imageModalClose) {
      console.warn('Image modal elements not found, retrying in 500ms...');
      setTimeout(initImageModal, 500);
      return;
    }

    // Show image modal
    function showImageModal(imageSrc) {
      if (!imageSrc) return;
      
      imageModalImg.src = imageSrc;
      imageModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Hide image modal
    function hideImageModal() {
      imageModalOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      imageModalImg.src = ''; // Clear image source
    }

    // Close modal when clicking the close button
    imageModalClose.addEventListener('click', hideImageModal);

    // Close modal when clicking the overlay background
    imageModalOverlay.addEventListener('click', function(e) {
      if (e.target === imageModalOverlay) {
        hideImageModal();
      }
    });

    // Close modal when pressing Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && imageModalOverlay.classList.contains('active')) {
        hideImageModal();
      }
    });

    // Add click handlers to all clickable images in job cards
    function addImageClickHandlers() {
      let handlersAdded = 0;
      
      // Check if we're on the seeker main dashboard (dashb.html)
      const isSeekerMainDashboard = window.location.pathname.includes('dashb.html') || 
                                   document.title.includes('Dashboard') && 
                                   !window.location.pathname.includes('admin');
      
      // Handle images in job cards (main dashboard)
      // Skip for seeker main dashboard, but allow for recruiter dashboard
      if (!isSeekerMainDashboard) {
        const jobCardImages = document.querySelectorAll('.job-thumb-img, .card-thumb-img');
        
        jobCardImages.forEach((img, index) => {
          if (img.src && !img.hasAttribute('data-modal-enabled')) {
            img.style.cursor = 'pointer';
            img.setAttribute('data-modal-enabled', 'true');
            img.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              showImageModal(this.src);
            });
            handlersAdded++;
          }
        });
      }

      // Handle images in job detail modal (seeker viewing job)
      const jobDetailImages = document.querySelectorAll('.job-detail-hero-img');
      
      jobDetailImages.forEach((img, index) => {
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
        }
      });

      // Handle images in job detail views and other areas
      const detailImages = document.querySelectorAll('.job-detail-image, .company-logo img, .profile-image img');
      detailImages.forEach(img => {
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
        }
      });

      // Handle resume profile pictures (PFP) in recruiter dashboard
      const resumeAvatars = document.querySelectorAll('.resume-view-avatar');
      console.log('Found resume avatars:', resumeAvatars.length);
      
      resumeAvatars.forEach((img, index) => {
        console.log(`Resume avatar ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled') });
        
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('Resume avatar clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to resume avatar');
        }
      });

      // Handle seeker profile images (profile page)
      const profileAvatars = document.querySelectorAll('.profile-avatar');
      console.log('Found profile avatars:', profileAvatars.length);
      
      profileAvatars.forEach((img, index) => {
        console.log(`Profile avatar ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled') });
        
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('Profile avatar clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to profile avatar');
        }
      });

      // Handle valid ID images in seeker profile
      const validIdImages = document.querySelectorAll('#validIdImage');
      console.log('Found valid ID images:', validIdImages.length);
      
      validIdImages.forEach((img, index) => {
        console.log(`Valid ID image ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled'), display: img.style.display });
        
        if (img.src && img.style.display !== 'none' && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('Valid ID image clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to valid ID image');
        }
      });

      // Handle valid certificate images in seeker profile
      const validCertImages = document.querySelectorAll('#validCertImage');
      console.log('Found valid cert images:', validCertImages.length);
      
      validCertImages.forEach((img, index) => {
        console.log(`Valid cert image ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled'), display: img.style.display });
        
        if (img.src && img.style.display !== 'none' && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('Valid cert image clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to valid cert image');
        }
      });

      // Handle seeker application card images
      const applicationCardImages = document.querySelectorAll('.application-card-thumb-img');
      console.log('Found application card images:', applicationCardImages.length);
      
      applicationCardImages.forEach((img, index) => {
        console.log(`Application card image ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled') });
        
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('Application card image clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to application card image');
        }
      });

      // Handle seeker application job modal images
      const applicationModalImages = document.querySelectorAll('.app-job-modal__hero-img');
      console.log('Found application modal images:', applicationModalImages.length);
      
      applicationModalImages.forEach((img, index) => {
        console.log(`Application modal image ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled') });
        
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('Application modal image clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to application modal image');
        }
      });

      // Handle for-you card images
      const forYouCardImages = document.querySelectorAll('.fy-card-img');
      console.log('Found for-you card images:', forYouCardImages.length);
      
      forYouCardImages.forEach((img, index) => {
        console.log(`For-you card image ${index}:`, { src: img.src, hasModalEnabled: img.hasAttribute('data-modal-enabled') });
        
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            console.log('For-you card image clicked:', this.src);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
          console.log('Added modal to for-you card image');
        }
      });

      // Handle admin document view buttons
      const adminDocumentBtns = document.querySelectorAll('.admin-dashboard-review-document-btn.view');
      console.log('Found admin document view buttons:', adminDocumentBtns.length);
      
      adminDocumentBtns.forEach((btn, index) => {
        console.log(`Admin document button ${index}:`, { onclick: btn.onclick });
        
        if (btn.onclick && !btn.hasAttribute('data-modal-enabled')) {
          btn.setAttribute('data-modal-enabled', 'true');
          handlersAdded++;
          console.log('Admin document button already has onclick handler');
        }
      });

      // Handle other application images
      const applicationImages = document.querySelectorAll('.application-image img, .resume-image img');
      applicationImages.forEach(img => {
        if (img.src && !img.hasAttribute('data-modal-enabled')) {
          img.style.cursor = 'pointer';
          img.setAttribute('data-modal-enabled', 'true');
          img.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.src);
          });
          handlersAdded++;
        }
      });

      // Handle resume valid ID and certificate links in recruiter dashboard
      const resumeLinks = document.querySelectorAll('.resume-view-li a');
      console.log('Found resume links:', resumeLinks.length);
      
      resumeLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        console.log(`Resume link ${index}:`, { href, text, target: link.getAttribute('target') });
        
        // Check if this is a valid ID or certificate link
        const isIdLink = text.includes('Valid ID') || href.includes('id_url');
        const isCertLink = text.includes('Certificate') || href.includes('cert_url');
        
        if ((isIdLink || isCertLink) && href && !link.hasAttribute('data-modal-enabled')) {
          console.log('Adding modal to resume link:', text);
          
          // Remove target="_blank" to prevent new tab
          link.removeAttribute('target');
          link.style.cursor = 'pointer';
          link.setAttribute('data-modal-enabled', 'true');
          
          // Add click event listener
          link.addEventListener('click', function(e) {
            console.log('Resume link clicked:', this.href);
            e.preventDefault();
            e.stopPropagation();
            showImageModal(this.href);
          });
          
          handlersAdded++;
        }
      });

      // Only log when new handlers are actually added
      if (handlersAdded > 0) {
        console.log('Image modal: Added', handlersAdded, 'new image click handlers');
      }
    }

    // Initial setup
    addImageClickHandlers();

    // Re-scan for new images periodically (useful for dynamic content)
    // Reduced frequency and removed console logging to prevent spam
    setInterval(function() {
      addImageClickHandlers();
    }, 5000); // Scan every 5 seconds instead of 2

    // Also re-scan when DOM changes
    if (window.MutationObserver) {
      const observer = new MutationObserver(function(mutations) {
        addImageClickHandlers();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Make functions globally available for external use
    window.showImageModal = showImageModal;
    window.hideImageModal = hideImageModal;
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageModal);
  } else {
    initImageModal();
  }
})();
