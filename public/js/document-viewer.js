/**
 * Document Viewer Module
 * This module enhances document viewing in the application
 * Uses plain CSS instead of Bootstrap dependencies
 */

(function() {
    console.log('Document viewer module loaded');
    
    // Store any existing viewDocument function
    const originalViewDocument = window.viewDocument;
    
    // Emergency escape function to close modals if needed
    window.closeAllModals = function(showNotification = false) {
        console.log('Closing all document modals');
        
        // Find all modal elements
        const modals = document.querySelectorAll('#document-viewer-modal, .modal');
        let count = 0;
        
        modals.forEach(function(modal) {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
                count++;
            }
        });
        
        // Remove modal backdrop if present
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(backdrop) {
            if (backdrop && backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        });
        
        // Reset body style
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        
        // Show notification if requested
        if (showNotification) {
            alert(`${count} modal(s) closed successfully.`);
        }
        
        return count;
    };
    
    // Override the global viewDocument function
    window.viewDocument = function(docId, docPath, docName, docType, docMime, employeeId) {
        console.log('Document viewer called:', { docId, docPath, docName, docType });
        
        try {
            // Create and show the document viewer modal
            createAndShowDocumentModal(docId, docPath, docName, docType, docMime, employeeId);
        } catch (error) {
            console.error('Error showing document:', error);
            
            // Try to use simpleDocumentViewer as fallback
            if (typeof window.simpleDocumentViewer === 'function') {
                console.log('Falling back to simple document viewer');
                window.simpleDocumentViewer(docName, getPlaceholderContent(docName, docType));
            } else if (originalViewDocument && typeof originalViewDocument === 'function') {
                // Fall back to original function if available
                console.log('Falling back to original view document function');
                originalViewDocument(docId, docPath, docName, docType, docMime, employeeId);
            } else {
                // Last resort - show alert
                alert(`Cannot display document "${docName}". Please try downloading it instead.`);
            }
        }
    };
    
    /**
     * Creates and shows the document modal
     */
    function createAndShowDocumentModal(docId, docPath, docName, docType, docMime, employeeId) {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'document-modal-container';
        modalContainer.id = 'document-viewer-modal';
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modalContainer.style.zIndex = '9999';
        modalContainer.style.display = 'flex';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.opacity = '0';
        modalContainer.style.transition = 'opacity 0.3s ease';
        
        // Determine document type for icon and content
        let iconClass = 'fa-file';
        let title = docName || 'Document';
        
        if (docType?.includes('tax') || docName?.toLowerCase().includes('tax')) {
            iconClass = 'fa-file-invoice-dollar';
            title = docName || 'Tax Form (TD1)';
        } else if (docType?.includes('work') || docName?.toLowerCase().includes('work')) {
            iconClass = 'fa-id-card';
            title = docName || 'Work Authorization';
        } else if (docType?.includes('citizenship') || docName?.toLowerCase().includes('citizen')) {
            iconClass = 'fa-passport';
            title = docName || 'Citizenship Document';
        }
        
        // Create modal content with infobox instead of trying to load actual document
        modalContainer.innerHTML = `
            <div class="document-modal-content" style="background-color: white; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.5); overflow: hidden;">
                <div class="document-modal-header" style="padding: 15px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center;">
                        <i class="fas ${iconClass}" style="margin-right: 10px; color: #3498db;"></i>
                        ${title}
                    </h3>
                    <button class="document-modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; color: #555;">&times;</button>
                </div>
                <div class="document-modal-body" style="padding: 20px; overflow-y: auto; flex-grow: 1;">
                    <div class="alert info-alert" style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                        The actual document content is not available for preview. This is a placeholder view.
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; background-color: #f8f9fa; margin-bottom: 20px;">
                            <i class="fas ${iconClass}" style="font-size: 48px; color: #3498db; margin-bottom: 15px;"></i>
                            <h3 style="margin-bottom: 15px; color: #333;">${title}</h3>
                            <p style="font-size: 1.1rem; margin-bottom: 15px;">This document was submitted during the onboarding process.</p>
                            <div style="background-color: #f8f9fa; border: 1px dashed #ddd; padding: 20px;">
                                <p style="margin: 0;">Please use the download button to view the actual document content.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="document-modal-footer" style="padding: 15px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
                    <button class="mark-verified-btn" style="background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-check-circle" style="margin-right: 5px;"></i> Mark as Verified
                    </button>
                    <div>
                        <button class="download-document-btn" style="background-color: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 4px; margin-right: 10px; cursor: pointer;">
                            <i class="fas fa-download" style="margin-right: 5px;"></i> Download
                        </button>
                        <button class="close-modal-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modalContainer);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        // Show with animation
        setTimeout(() => {
            modalContainer.style.opacity = '1';
        }, 10);
        
        // Add event listeners
        const closeButtons = modalContainer.querySelectorAll('.document-modal-close, .close-modal-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeDocumentModal(modalContainer);
            });
        });
        
        // Close on backdrop click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeDocumentModal(modalContainer);
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', function escKeyHandler(e) {
            if (e.key === 'Escape') {
                closeDocumentModal(modalContainer);
                document.removeEventListener('keydown', escKeyHandler);
            }
        });
        
        // Set up download button
        const downloadBtn = modalContainer.querySelector('.download-document-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                // Check if we have the enhanced download function
                if (typeof window.downloadDocument === 'function') {
                    window.downloadDocument(docId, docPath, docName);
                } else {
                    // Fallback direct download approach
                    directDownloadDocument(docId, docPath, docName);
                }
            });
        }
        
        // Set up verify button
        const verifyBtn = modalContainer.querySelector('.mark-verified-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', function() {
                verifyBtn.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 5px;"></i> Verified';
                verifyBtn.style.backgroundColor = '#218838';
                verifyBtn.disabled = true;
                
                // Show success message
                const alertDiv = document.createElement('div');
                alertDiv.style.position = 'fixed';
                alertDiv.style.top = '20px';
                alertDiv.style.right = '20px';
                alertDiv.style.backgroundColor = '#d4edda';
                alertDiv.style.color = '#155724';
                alertDiv.style.padding = '15px 20px';
                alertDiv.style.borderRadius = '5px';
                alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                alertDiv.style.zIndex = '10000';
                alertDiv.innerHTML = `${docName} has been marked as verified.`;
                
                document.body.appendChild(alertDiv);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.parentNode.removeChild(alertDiv);
                    }
                }, 3000);
            });
        }
    }
    
    /**
     * Closes the document modal
     */
    function closeDocumentModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            document.body.style.overflow = '';
        }, 300);
    }
    
    /**
     * Fallback method for downloading documents
     */
    function directDownloadDocument(docId, docPath, docName) {
        const token = localStorage.getItem('token');
        let downloadUrl;
        
        if (docId) {
            downloadUrl = `/api/documents/${docId}?token=${encodeURIComponent(token)}`;
        } else if (docPath) {
            downloadUrl = `/api/documents/path/${encodeURIComponent(docPath)}?token=${encodeURIComponent(token)}`;
        } else if (docName) {
            downloadUrl = `/api/documents/name/${encodeURIComponent(docName)}?token=${encodeURIComponent(token)}`;
        } else {
            alert('Error: Cannot download document - missing identifier');
            return;
        }
        
        // Create an iframe to handle the download
        const downloadFrame = document.createElement('iframe');
        downloadFrame.style.display = 'none';
        downloadFrame.src = downloadUrl;
        document.body.appendChild(downloadFrame);
        
        // Remove the iframe after a delay
        setTimeout(() => {
            if (downloadFrame.parentNode) {
                downloadFrame.parentNode.removeChild(downloadFrame);
            }
        }, 5000);
    }
    
    /**
     * Returns placeholder content for document types
     */
    function getPlaceholderContent(docName, docType) {
        return `
            <div style="text-align: center; padding: 20px;">
                <div class="alert info-alert" style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: left;">
                    <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                    The actual document content is not available for preview. This is a placeholder view.
                </div>
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; background-color: #f8f9fa; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px; color: #333;">${docName || 'Document'}</h3>
                    <p style="font-size: 1.1rem; margin-bottom: 15px;">Document submitted during the onboarding process.</p>
                    <p>Please use the download option to view the actual document content.</p>
                </div>
            </div>
        `;
    }
    
    // Attach document action listeners to any existing document cards
    function attachDocumentListeners() {
        // Find all view document buttons
        const viewButtons = document.querySelectorAll('.view-document-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const docId = this.getAttribute('data-document-id');
                const docPath = this.getAttribute('data-document-path');
                const docName = this.getAttribute('data-document-name');
                const docType = this.getAttribute('data-document-type');
                
                window.viewDocument(docId, docPath, docName, docType);
            });
        });
        
        // Find all download document buttons
        const downloadButtons = document.querySelectorAll('.download-document-btn');
        downloadButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const docId = this.getAttribute('data-document-id');
                const docPath = this.getAttribute('data-document-path');
                const docName = this.getAttribute('data-document-name');
                
                if (typeof window.downloadDocument === 'function') {
                    window.downloadDocument(docId, docPath, docName);
                } else {
                    directDownloadDocument(docId, docPath, docName);
                }
            });
        });
    }
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', function() {
        attachDocumentListeners();
    });
})();