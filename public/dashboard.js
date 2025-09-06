// =================================================================
// डेवलपर डैशबोर्ड स्क्रिप्ट (अंतिम संस्करण)
// =================================================================

// --- 1. यूजर की वेरिफिकेशन स्थिति को प्राप्त करने और दिखाने का फंक्शन ---
const fetchUserStatus = async () => {
    try {
        const response = await fetch('/api/user-status');
        if (!response.ok) throw new Error('Failed to fetch user status');
        const user = await response.json();
        const statusTextElement = document.getElementById('verification-status-text');
        const descriptionElement = document.getElementById('verification-description');
        const formElement = document.getElementById('verification-form');
        const fullNameInput = document.getElementById('fullName');
        const statusExtraText = document.getElementById('status-extra-text');
        if (!statusTextElement || !descriptionElement || !formElement || !fullNameInput || !statusExtraText) return;
        if (user.fullName) { fullNameInput.value = user.fullName; }
        let statusText = user.verificationStatus.replace('_', ' ');
        statusTextElement.textContent = `Status: ${statusText}`;
        statusTextElement.className = `verification-status ${user.verificationStatus}`;
        statusExtraText.style.display = 'inline-block';
        switch (user.verificationStatus) {
            case 'not_submitted':
                descriptionElement.textContent = 'To upload apps, you must verify your identity. Please provide your Aadhaar details below.';
                formElement.style.display = 'block';
                break;
            case 'pending':
                descriptionElement.textContent = 'Your verification details are under review. We will notify you once the process is complete.';
                formElement.style.display = 'none';
                break;
            case 'verified':
                statusExtraText.style.display = 'none';
                descriptionElement.textContent = 'Congratulations! Your account is verified. You can now start uploading apps.';
                formElement.style.display = 'none';
                break;
            case 'rejected':
                descriptionElement.textContent = 'Your verification was rejected. Please review your details and submit the form again.';
                formElement.style.display = 'block';
                break;
        }
    } catch (error) { console.error('Error fetching user status:', error); }
};
// --- 2. यूजर के ऐप्स को प्राप्त करने और दिखाने का फंक्शन ---
const fetchMyApps = async () => {
    const myAppsList = document.getElementById('my-apps-list');
    if (!myAppsList) return;

    try {
        const response = await fetch('/api/my-apps');
        if (!response.ok) throw new Error('Failed to fetch apps');
        const apps = await response.json();

        if (apps.length === 0) {
            myAppsList.innerHTML = '<p class="empty-message">You have not uploaded any apps yet.</p>';
            return;
        }
        
        let appsHtml = '';
        apps.forEach(app => {
            // ====================== यह ऐप कार्ड का अंतिम और सही HTML है ======================
            // आइकन पाथ को URL-फ्रेंडली बनाएं
            const iconPath = app.iconPath.replace(/\\/g, '/');

            appsHtml += `
                <div class="dashboard-app-card">
                    <div class="app-card-header">
                        <!-- असली आइकन दिखाने के लिए img टैग का उपयोग करें -->
                        <img src="/${iconPath}" alt="${app.appName} icon" class="app-icon-small">
                        <div class="app-info">
                            <h3>${app.appName}</h3>
                            <span class="version">v${app.version || '1.0'}</span>
                        </div>
                        <span class="app-status ${app.status}">${app.status}</span>
                    </div>
                    <div class="app-info-footer">
                        <span class="downloads"><i class="fas fa-download"></i> ${app.downloadCount.toLocaleString()}</span>
                        <span class="category-tag">${app.category}</span>
                    </div>
                    <div class="app-actions">
                        <a href="/edit-app.html?id=${app._id}" class="btn-action-edit">Edit</a>
                        <!-- Get Link बटन को वापस जोड़ा गया है -->
                        <button class="btn-action-getlink" data-appid="${app._id}">Get Link</button>
                        <a href="#" class="btn-action-stats">View Stats</a>
                        <button class="btn-action-delete" data-appid="${app._id}">Delete</button>
                    </div>
                </div>
            `;
            // ====================== बदलाव का अंत ======================
        });
        myAppsList.innerHTML = appsHtml;
        
    } catch (error) {
        console.error('Failed to fetch my apps:', error);
        myAppsList.innerHTML = '<p class="empty-message">Could not load your apps.</p>';
    }
};
// --- 3. इवेंट लिसनर्स (Delete, Get Link, और Copy ID के लिए) ---
const addActionListeners = () => {
    const myAppsList = document.getElementById('my-apps-list');
    if (myAppsList) {
        myAppsList.addEventListener('click', async (event) => {
            const target = event.target;

            // डिलीट बटन का लॉजिक
            if (target.closest('.btn-action-delete')) {
                const appId = target.closest('.btn-action-delete').dataset.appid;
                const confirmDelete = confirm('Are you sure you want to delete this app? This action cannot be undone.');

                if (confirmDelete) {
                    try {
                        const response = await fetch(`/api/delete-app/${appId}`, { method: 'POST' });
                        const result = await response.json();
                        if (result.success) {
                            alert('App deleted successfully.');
                            fetchMyApps();
                        } else {
                            alert('Error: ' + (result.error || 'Could not delete the app.'));
                        }
                    } catch (error) {
                        alert('A server error occurred while deleting the app.');
                    }
                }
            }

            // Get Link बटन का लॉजिक
            if (target.closest('.btn-action-getlink')) {
                const appId = target.closest('.btn-action-getlink').dataset.appid;
                const referralLink = `${window.location.origin}/download/${appId}?ref=YOUR_USER_REFERRAL_CODE`;
                prompt("Copy this direct download link and use it in your app's referral system:", referralLink);
            }

            // ====================== नया Copy ID बटन का लॉजिक ======================
            const copyButton = target.closest('.btn-copy-id');
            if (copyButton) {
                const appId = copyButton.dataset.appid;
                navigator.clipboard.writeText(appId).then(() => {
                    const originalIcon = copyButton.innerHTML;
                    copyButton.innerHTML = `<i class="fas fa-check"></i>`;
                    setTimeout(() => {
                        copyButton.innerHTML = originalIcon;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy App ID: ', err);
                    alert('Could not copy App ID.');
                });
            }
            // ====================== नए लॉजिक का अंत ======================
        });
    }
};

// --- 4. पेज लोड होने पर सभी फंक्शन चलाएं ---
document.addEventListener('DOMContentLoaded', () => {
    fetchUserStatus();
    fetchMyApps();
    addActionListeners();
});