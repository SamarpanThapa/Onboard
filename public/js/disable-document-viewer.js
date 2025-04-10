// Script to completely disable document viewer and close stuck modals
(function() {
    console.log("📝 Document viewer disabler loaded");
    
    // Function to force close all modals except simulated document viewer
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(function(modal) {
            // Skip simulated document viewer
            if (modal.id === 'simulated-doc-modal') {
                return;
            }
            console.log("Closing modal:", modal.id);
            modal.style.display = 'none';
        });
    }
    
    // Function to remove document viewer modal completely
    function removeDocumentModal() {
        const docModal = document.getElementById('document-viewer-modal');
        if (docModal && docModal.parentNode) {
            console.log("Removing document viewer modal");
            docModal.parentNode.removeChild(docModal);
        }
    }
    
    // Function to revoke all blob URLs
    function revokeBlobUrls() {
        document.querySelectorAll('iframe, img').forEach(function(el) {
            if (el.src && el.src.startsWith('blob:')) {
                console.log("Revoking blob URL:", el.src);
                URL.revokeObjectURL(el.src);
            }
        });
    }
    
    // Function to disable document-related buttons
    function disableDocumentButtons() {
        document.querySelectorAll('.view-document-btn, [data-action="view-document"]').forEach(function(btn) {
            // Don't disable buttons - only override their functionality
            // Leave them enabled to trigger our simulated document viewer
            // btn.disabled = true;
            // btn.style.opacity = '0.5';
            // btn.style.cursor = 'not-allowed';
            
            // Remove event listeners by cloning and replacing
            // Only if they're not for our simulated document viewer
            if (!btn.classList.contains('simulated-doc-btn')) {
                const newBtn = btn.cloneNode(true);
                if (btn.parentNode) {
                    btn.parentNode.replaceChild(newBtn, btn);
                }
            }
        });
    }
    
    // Override document viewer functions but allow for simulated document viewing
    const originalViewDocument = window.viewDocument;
    window.viewDocument = function(docId, docPath, docType) {
        console.log("Document viewer redirected to simulated viewer");
        if (typeof showSimulatedDocument === 'function') {
            return showSimulatedDocument(docType);
        }
        return false;
    };
    
    window.downloadDocument = function() {
        console.log("Document download has been disabled");
        return false;
    };
    
    // Handle ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Run immediately
    closeAllModals();
    revokeBlobUrls();
    
    // Add listener for when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        removeDocumentModal();
        disableDocumentButtons();
        
        // For good measure, run again after a short delay
        setTimeout(function() {
            closeAllModals();
            disableDocumentButtons();
        }, 500);
    });
    
    // Add listener for any clicks on the document
    document.addEventListener('click', function(e) {
        // If clicking anywhere with modals visible, close them
        // But don't close our simulated document viewer
        const openModal = document.querySelector('.modal[style*="display: block"]');
        if (openModal && openModal.id !== 'simulated-doc-modal') {
            closeAllModals();
        }
    });
})(); 