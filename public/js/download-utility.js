/**
 * Document Download Utility
 * Provides robust document download functionality without Bootstrap dependencies
 */
(function() {
    console.log('Document download utility loaded');
    
    // Track download attempts to avoid infinite retries
    const downloadAttempts = new Map();
    
    // Override the global downloadDocument function
    window.downloadDocument = function(docId, docPath, docName) {
        console.log('Enhanced download document called:', { docId, docPath, docName });
        
        // Show loading message
        showDownloadAlert('Preparing download...', 'info');
        
        // Reset attempt counter for this document
        const docKey = getDocumentKey(docId, docPath, docName);
        downloadAttempts.set(docKey, 0);
        
        // Try the download with multiple potential endpoints
        tryDownloadWithMultipleEndpoints(docId, docPath, docName);
    };
    
    // Try download with multiple potential endpoints
    function tryDownloadWithMultipleEndpoints(docId, docPath, docName) {
        // Get authentication token
        const token = localStorage.getItem('token');
        if (!token) {
            showDownloadAlert('Authentication required. Please log in again.', 'error');
            return;
        }
        
        // Generate doc key for tracking attempts
        const docKey = getDocumentKey(docId, docPath, docName);
        
        // Track attempts
        let attempts = downloadAttempts.get(docKey) || 0;
        attempts++;
        downloadAttempts.set(docKey, attempts);
        
        // Stop if too many attempts
        if (attempts > 3) {
            showDownloadAlert('Download failed after multiple attempts. Please try again later.', 'error');
            return;
        }
        
        // Log attempt
        console.log(`Download attempt ${attempts} for ${docName}`);
        
        // Build all possible endpoint URLs to try
        const endpoints = [
            // Standard document API endpoint
            docId ? `/api/documents/${docId}` : 
            docPath ? `/api/documents/path/${encodeURIComponent(docPath)}` : 
            docName ? `/api/documents/name/${encodeURIComponent(docName)}` : null,
            
            // Employee documents endpoint
            docPath ? `/api/employees/documents/path/${encodeURIComponent(docPath)}` : null,
            
            // Direct file endpoint
            docPath ? `/uploads/${encodeURIComponent(docPath)}` : null,
            
            // Download endpoint
            `/api/documents/download?${new URLSearchParams({
                id: docId || '',
                path: docPath || '',
                name: docName || ''
            }).toString()}`
        ].filter(Boolean); // Remove null values
        
        // Try the first endpoint
        tryNextEndpoint(endpoints, 0, token, docId, docPath, docName);
    }
    
    // Try endpoints one by one
    function tryNextEndpoint(endpoints, index, token, docId, docPath, docName) {
        if (index >= endpoints.length) {
            // We've tried all endpoints, show error
            showDownloadAlert('Document download failed. Please try again later.', 'error');
            
            // Try with fallback method - direct link
            tryDirectDownload(docId, docPath, docName, token);
            return;
        }
        
        // Get the current endpoint to try
        const endpoint = endpoints[index];
        console.log(`Trying endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);
        
        // Create hidden iframe for download
        const downloadFrame = document.createElement('iframe');
        downloadFrame.style.display = 'none';
        document.body.appendChild(downloadFrame);
        
        // Add token to URL
        const url = endpoint.includes('token=') ? endpoint : 
                  (endpoint.includes('?') ? `${endpoint}&token=${encodeURIComponent(token)}` : 
                                           `${endpoint}?token=${encodeURIComponent(token)}`);
        
        // Set download source
        downloadFrame.src = url;
        
        // Set timeout for this attempt
        const timeoutId = setTimeout(() => {
            console.log(`Endpoint ${index + 1} timed out, trying next endpoint`);
            cleanupAndTryNext();
        }, 5000);
        
        // Handle load event
        downloadFrame.onload = function() {
            clearTimeout(timeoutId);
            
            try {
                // Try to detect error page (might fail due to cross-origin restrictions)
                const frameDoc = downloadFrame.contentWindow.document;
                const content = frameDoc.body.textContent || '';
                
                if (content.includes('Error') || content.includes('404') || 
                    content.includes('not found') || content.includes('Not Found')) {
                    console.log(`Endpoint ${index + 1} returned error content, trying next`);
                    cleanupAndTryNext();
                } else {
                    // Assume success
                    showDownloadAlert(`Document "${docName}" is downloading...`, 'success');
                    cleanupFrame();
                }
            } catch (e) {
                // Cross-origin issue - assume success for now
                console.log('Cross-origin access error:', e);
                showDownloadAlert(`Document "${docName}" download initiated`, 'success');
                cleanupFrame();
            }
        };
        
        // Handle errors
        downloadFrame.onerror = function() {
            console.log(`Endpoint ${index + 1} failed with error, trying next endpoint`);
            clearTimeout(timeoutId);
            cleanupAndTryNext();
        };
        
        // Helper to clean up and move to next endpoint
        function cleanupAndTryNext() {
            cleanupFrame();
            tryNextEndpoint(endpoints, index + 1, token, docId, docPath, docName);
        }
        
        // Helper to clean up the iframe
        function cleanupFrame() {
            clearTimeout(timeoutId);
            setTimeout(() => {
                if (downloadFrame && downloadFrame.parentNode) {
                    downloadFrame.parentNode.removeChild(downloadFrame);
                }
            }, 1000);
        }
    }
    
    // Fallback: Try direct download with link
    function tryDirectDownload(docId, docPath, docName, token) {
        console.log('Trying direct download as last resort');
        
        // Determine the URL
        let url = '';
        if (docId) url = `/api/documents/${docId}`;
        else if (docPath) url = `/api/documents/path/${encodeURIComponent(docPath)}`;
        else if (docName) url = `/api/documents/name/${encodeURIComponent(docName)}`;
        else return;
        
        // Add token
        url += `?token=${encodeURIComponent(token)}`;
        
        // Create link and trigger click
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = docName || 'document';
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Trigger click and clean up
        link.click();
        setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
            showDownloadAlert('If download doesn\'t start, please check browser settings', 'warning');
        }, 1000);
    }
    
    // Show alert for download status
    function showDownloadAlert(message, type) {
        // Remove any existing download alerts
        const existingAlerts = document.querySelectorAll('.download-alert');
        existingAlerts.forEach(alert => {
            if (alert.parentNode) alert.parentNode.removeChild(alert);
        });
        
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = 'download-alert';
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.padding = '12px 20px';
        alertDiv.style.borderRadius = '4px';
        alertDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        alertDiv.style.zIndex = '10000';
        alertDiv.style.maxWidth = '350px';
        alertDiv.style.display = 'flex';
        alertDiv.style.alignItems = 'center';
        alertDiv.style.justifyContent = 'space-between';
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        alertDiv.style.transition = 'all 0.3s ease';
        
        // Set style based on type
        switch (type) {
            case 'success':
                alertDiv.style.backgroundColor = '#d4edda';
                alertDiv.style.color = '#155724';
                alertDiv.style.borderLeft = '4px solid #28a745';
                break;
            case 'error':
                alertDiv.style.backgroundColor = '#f8d7da';
                alertDiv.style.color = '#721c24';
                alertDiv.style.borderLeft = '4px solid #dc3545';
                break;
            case 'warning':
                alertDiv.style.backgroundColor = '#fff3cd';
                alertDiv.style.color = '#856404';
                alertDiv.style.borderLeft = '4px solid #ffc107';
                break;
            case 'info':
            default:
                alertDiv.style.backgroundColor = '#d1ecf1';
                alertDiv.style.color = '#0c5460';
                alertDiv.style.borderLeft = '4px solid #17a2b8';
                break;
        }
        
        // Add content with close button
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button style="background: none; border: none; font-size: 16px; margin-left: 10px; cursor: pointer; color: inherit;">&times;</button>
        `;
        
        // Add to DOM
        document.body.appendChild(alertDiv);
        
        // Trigger animation
        setTimeout(() => {
            alertDiv.style.opacity = '1';
            alertDiv.style.transform = 'translateY(0)';
        }, 10);
        
        // Add close functionality
        const closeBtn = alertDiv.querySelector('button');
        closeBtn.addEventListener('click', () => closeAlert(alertDiv));
        
        // Auto close after 5 seconds
        setTimeout(() => closeAlert(alertDiv), 5000);
    }
    
    // Close alert with animation
    function closeAlert(alertDiv) {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
        }, 300);
    }
    
    // Helper to generate a unique key for a document
    function getDocumentKey(docId, docPath, docName) {
        return `${docId || ''}_${docPath || ''}_${docName || ''}`;
    }
    
    console.log('Document download utility ready');
})(); 