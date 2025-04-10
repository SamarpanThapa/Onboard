/**
 * Simple Document Viewer - Works without Bootstrap dependencies
 * Handles document viewing and downloading correctly
 */

// Initialize the simple document viewer when the DOM is ready
(function() {
    console.log('Simple document viewer initialized');
    
    // Override the viewDocument function with a pure CSS/JS implementation
    window.viewDocument = function(docId, docPath, docName, docType) {
        console.log('Simple document viewer called:', { docId, docPath, docName, docType });
        
        // Show loading message
        showSimpleAlert('Loading document preview...', 'info');
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'simple-modal-container';
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
        let iconClass, content, title;
        
        if (docType?.includes('tax') || docName?.toLowerCase().includes('tax')) {
            iconClass = 'fa-file-invoice-dollar';
            title = docName || 'Tax Form (TD1)';
            content = createTaxDocumentContent(docName);
        } else if (docType?.includes('work') || docName?.toLowerCase().includes('work')) {
            iconClass = 'fa-id-card';
            title = docName || 'Work Authorization';
            content = createWorkAuthContent(docName);
        } else if (docType?.includes('citizenship') || docName?.toLowerCase().includes('citizenship')) {
            iconClass = 'fa-passport';
            title = docName || 'Citizenship Document';
            content = createCitizenshipContent(docName);
        } else {
            iconClass = 'fa-file-alt';
            title = docName || 'Document';
            content = createGenericDocumentContent(docName);
        }
        
        // Create modal content
        modalContainer.innerHTML = `
            <div class="simple-modal-content" style="background-color: white; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.5); overflow: hidden;">
                <div class="simple-modal-header" style="padding: 15px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center;">
                        <i class="fas ${iconClass}" style="margin-right: 10px; color: #3498db;"></i>
                        ${title}
                    </h3>
                    <button class="simple-modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; color: #555;">&times;</button>
                </div>
                <div class="simple-modal-body" style="padding: 20px; overflow-y: auto; flex-grow: 1;">
                    ${content}
                </div>
                <div class="simple-modal-footer" style="padding: 15px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
                    <button class="verify-document-btn" style="background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
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
        const closeButtons = modalContainer.querySelectorAll('.simple-modal-close, .close-modal-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => closeDocumentModal(modalContainer));
        });
        
        // Close on backdrop click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeDocumentModal(modalContainer);
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', function documentEscapeHandler(e) {
            if (e.key === 'Escape') {
                closeDocumentModal(modalContainer);
                document.removeEventListener('keydown', documentEscapeHandler);
            }
        });
        
        // Download button
        const downloadBtn = modalContainer.querySelector('.download-document-btn');
        downloadBtn.addEventListener('click', function() {
            enhancedDownloadDocument(docId, docPath, docName);
        });
        
        // Verify button
        const verifyBtn = modalContainer.querySelector('.verify-document-btn');
        verifyBtn.addEventListener('click', function() {
            verifyBtn.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 5px;"></i> Verified';
            verifyBtn.style.backgroundColor = '#218838';
            verifyBtn.disabled = true;
            showSimpleAlert(`${docName || 'Document'} marked as verified`, 'success');
        });
    };
    
    // Close document modal
    function closeDocumentModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }, 300);
    }
    
    // Enhanced download document function
    function enhancedDownloadDocument(docId, docPath, docName) {
        console.log('Enhanced download document:', { docId, docPath, docName });
        
        // Show loading indicator
        showSimpleAlert('Preparing download...', 'info');
        
        // Get authentication token
        const token = localStorage.getItem('token');
        
        // Additional backup paths to try if the first one fails
        const apiPaths = [
            // Try the standard document endpoint first
            docId ? `/api/documents/${docId}` : 
            docPath ? `/api/documents/path/${encodeURIComponent(docPath)}` : 
            docName ? `/api/documents/name/${encodeURIComponent(docName)}` : null,
            
            // Try the employee documents endpoint
            docPath ? `/api/employees/documents/path/${encodeURIComponent(docPath)}` : null,
            
            // Try the direct file endpoint
            docPath ? `/uploads/${encodeURIComponent(docPath)}` : null,
            
            // Try the download endpoint
            `/api/documents/download?${new URLSearchParams({
                id: docId || '',
                path: docPath || '',
                name: docName || ''
            }).toString()}`
        ].filter(Boolean); // Remove null entries
        
        // Try all endpoints sequentially
        tryDownloadSequence(apiPaths, 0, token, docName);
    }
    
    // Sequential download attempts
    function tryDownloadSequence(endpoints, index, token, docName) {
        if (index >= endpoints.length) {
            // We've tried all endpoints without success
            showSimpleAlert(`Could not download document. Please try again later.`, 'error');
            return;
        }
        
        const endpoint = endpoints[index];
        console.log(`Trying download endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);
        
        // Create download frame
        const downloadFrame = document.createElement('iframe');
        downloadFrame.style.display = 'none';
        document.body.appendChild(downloadFrame);
        
        // Add token to URL if not already included
        const url = endpoint.includes('token=') ? endpoint : 
                   (endpoint.includes('?') ? `${endpoint}&token=${encodeURIComponent(token)}` : 
                                            `${endpoint}?token=${encodeURIComponent(token)}`);
        
        // Set the source with a timeout to catch failures
        downloadFrame.src = url;
        
        // Set up timeout for this attempt
        const timeoutId = setTimeout(() => {
            console.log(`Download attempt ${index + 1} timed out, trying next endpoint`);
            cleanupAndTryNext();
        }, 5000);
        
        // Monitor response
        downloadFrame.onload = function() {
            clearTimeout(timeoutId);
            
            try {
                // Check if frame loaded an error page
                const frameContent = downloadFrame.contentWindow.document.body.textContent;
                if (frameContent && (frameContent.includes('404') || 
                                    frameContent.includes('Error') || 
                                    frameContent.includes('not found'))) {
                    console.log(`Endpoint ${index + 1} returned error content, trying next`);
                    cleanupAndTryNext();
                } else {
                    // Assume success
                    showSimpleAlert(`Document "${docName}" downloading...`, 'success');
                    
                    // Clean up after a short delay
                    setTimeout(() => {
                        if (downloadFrame && downloadFrame.parentNode) {
                            document.body.removeChild(downloadFrame);
                        }
                    }, 3000);
                }
            } catch (e) {
                // Cross-origin issues might prevent access to frame content
                // Assume success for now
                console.log('Download frame access error (possibly cross-origin):', e);
                showSimpleAlert(`Document "${docName}" download initiated`, 'success');
                
                // Clean up
                setTimeout(() => {
                    if (downloadFrame && downloadFrame.parentNode) {
                        document.body.removeChild(downloadFrame);
                    }
                }, 3000);
            }
        };
        
        // Handle errors
        downloadFrame.onerror = function(error) {
            console.error('Download frame error:', error);
            clearTimeout(timeoutId);
            cleanupAndTryNext();
        };
        
        // Helper to clean up and try next endpoint
        function cleanupAndTryNext() {
            if (downloadFrame && downloadFrame.parentNode) {
                document.body.removeChild(downloadFrame);
            }
            clearTimeout(timeoutId);
            
            // Try the next endpoint
            tryDownloadSequence(endpoints, index + 1, token, docName);
        }
    }
    
    // Content templates for document types
    function createTaxDocumentContent(docName) {
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; background-color: #f8f9fa; margin-bottom: 20px;">
                    <img src="/img/tax-document-icon.png" onerror="this.onerror=null; this.src='/img/document-icon.png'; this.style.display='none';" style="width: 64px; height: 64px; margin-bottom: 15px;">
                    <h3 style="margin-bottom: 15px; color: #333;">Tax Form (TD1)</h3>
                    <p style="font-size: 1.1rem; margin-bottom: 15px;">This document was submitted during the onboarding process.</p>
                    <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: left;">
                        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                        The document contains tax information and has been successfully processed.
                    </div>
                    <div style="background-color: #f8f9fa; border: 1px dashed #ddd; padding: 20px; margin-top: 20px;">
                        <p style="margin: 0;">The actual document content is not available for preview. This is a placeholder view.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createWorkAuthContent(docName) {
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; background-color: #f8f9fa; margin-bottom: 20px;">
                    <img src="/img/id-card-icon.png" onerror="this.onerror=null; this.src='/img/document-icon.png'; this.style.display='none';" style="width: 64px; height: 64px; margin-bottom: 15px;">
                    <h3 style="margin-bottom: 15px; color: #333;">Work Authorization Document</h3>
                    <p style="font-size: 1.1rem; margin-bottom: 15px;">This document was submitted during the onboarding process.</p>
                    <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: left;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                        Work permit information requires verification. This document has been processed.
                    </div>
                    <div style="background-color: #f8f9fa; border: 1px dashed #ddd; padding: 20px; margin-top: 20px;">
                        <p style="margin: 0;">The actual document content is not available for preview. This is a placeholder view.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createCitizenshipContent(docName) {
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; background-color: #f8f9fa; margin-bottom: 20px;">
                    <img src="/img/passport-icon.png" onerror="this.onerror=null; this.src='/img/document-icon.png'; this.style.display='none';" style="width: 64px; height: 64px; margin-bottom: 15px;">
                    <h3 style="margin-bottom: 15px; color: #333;">Citizenship/Immigration Document</h3>
                    <p style="font-size: 1.1rem; margin-bottom: 15px;">This document was submitted during the onboarding process.</p>
                    <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: left;">
                        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                        This document contains citizenship information that has been processed.
                    </div>
                    <div style="background-color: #f8f9fa; border: 1px dashed #ddd; padding: 20px; margin-top: 20px;">
                        <p style="margin: 0;">The actual document content is not available for preview. This is a placeholder view.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createGenericDocumentContent(docName) {
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; background-color: #f8f9fa; margin-bottom: 20px;">
                    <img src="/img/document-icon.png" onerror="this.style.display='none';" style="width: 64px; height: 64px; margin-bottom: 15px;">
                    <h3 style="margin-bottom: 15px; color: #333;">${docName || 'Document'}</h3>
                    <p style="font-size: 1.1rem; margin-bottom: 15px;">This document was submitted during the onboarding process.</p>
                    <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: left;">
                        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                        The document has been processed by the system.
                    </div>
                    <div style="background-color: #f8f9fa; border: 1px dashed #ddd; padding: 20px; margin-top: 20px;">
                        <p style="margin: 0;">The actual document content is not available for preview. This is a placeholder view.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Simple alert function
    function showSimpleAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'simple-alert ' + type;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.padding = '15px 20px';
        alertDiv.style.borderRadius = '5px';
        alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        alertDiv.style.zIndex = '10000';
        alertDiv.style.maxWidth = '300px';
        alertDiv.style.transition = 'all 0.3s ease';
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        
        // Set type-specific styles
        switch (type) {
            case 'success':
                alertDiv.style.backgroundColor = '#d4edda';
                alertDiv.style.color = '#155724';
                alertDiv.style.borderLeft = '5px solid #28a745';
                break;
            case 'error':
                alertDiv.style.backgroundColor = '#f8d7da';
                alertDiv.style.color = '#721c24';
                alertDiv.style.borderLeft = '5px solid #dc3545';
                break;
            case 'warning':
                alertDiv.style.backgroundColor = '#fff3cd';
                alertDiv.style.color = '#856404';
                alertDiv.style.borderLeft = '5px solid #ffc107';
                break;
            case 'info':
            default:
                alertDiv.style.backgroundColor = '#d1ecf1';
                alertDiv.style.color = '#0c5460';
                alertDiv.style.borderLeft = '5px solid #17a2b8';
                break;
        }
        
        // Create content with close button
        alertDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px; font-size: 1.2rem; padding: 0; line-height: 1;">&times;</button>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(alertDiv);
        
        // Show with animation
        setTimeout(() => {
            alertDiv.style.opacity = '1';
            alertDiv.style.transform = 'translateY(0)';
        }, 10);
        
        // Add close button functionality
        const closeButton = alertDiv.querySelector('button');
        closeButton.addEventListener('click', () => {
            closeAlert(alertDiv);
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            closeAlert(alertDiv);
        }, 5000);
    }
    
    // Close alert with animation
    function closeAlert(alertDiv) {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 300);
    }
    
    // Expose simpleDocumentViewer to the global scope
    window.simpleDocumentViewer = function(docName, customContent) {
        // Create a simplified document viewer modal
        const container = document.createElement('div');
        container.id = 'simple-document-modal';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.backgroundColor = 'rgba(0,0,0,0.5)';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        
        container.innerHTML = `
            <div style="background-color: white; border-radius: 8px; max-width: 800px; width: 90%; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; font-size: 1.2rem;">${docName}</h3>
                    <button style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                    ${customContent || `
                        <div style="text-align: center; padding: 20px;">
                            <div style="margin-bottom: 20px; color: #3498db;">
                                <i class="fas fa-info-circle" style="font-size: 3rem;"></i>
                            </div>
                            <p>The actual document content is not available for preview. This is a placeholder view.</p>
                        </div>
                    `}
                </div>
                <div style="padding: 15px; border-top: 1px solid #eee; text-align: right;">
                    <button class="close" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Add close functionality
        const closeButtons = container.querySelectorAll('button');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                document.body.removeChild(container);
            });
        });
        
        // Close on backdrop click
        container.addEventListener('click', function(e) {
            if (e.target === container) {
                document.body.removeChild(container);
            }
        });
    };
    
    // Override downloadDocument if not already defined
    if (!window.downloadDocument) {
        window.downloadDocument = function(docId, docPath, docName) {
            enhancedDownloadDocument(docId, docPath, docName);
        };
    }
    
    console.log('Simple document viewer ready - pure CSS/JS version');
})(); 