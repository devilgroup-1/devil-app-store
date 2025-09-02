// =================================================================
// ऐप डिटेल पेज स्क्रिप्ट
// यह URL से ऐप ID लेती है और API से डेटा लाकर पेज बनाती है
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // मुख्य कंटेनर को चुनें जहाँ ऐप की जानकारी दिखाई जाएगी
    const appDetailContainer = document.getElementById('app-detail-container');
    
    // अगर पेज पर यह कंटेनर नहीं है, तो कुछ न करें
    if (!appDetailContainer) {
        return;
    }

    try {
        // --- 1. URL से ऐप की ID निकालें ---
        const pathParts = window.location.pathname.split('/');
        const appId = pathParts[pathParts.length - 1]; // URL का आखिरी हिस्सा ID होगा

        // अगर ID नहीं मिलती है, तो एरर दिखाएं
        if (!appId || appId.length < 10) {
            throw new Error('Invalid App ID in URL.');
        }

        // --- 2. API से उस ID वाले ऐप का डेटा मांगें ---
        const response = await fetch(`/api/app/${appId}`);
        
        if (!response.ok) {
            throw new Error('App not found on the server.');
        }
        const app = await response.json();
        
        // --- 3. पेज का टाइटल ऐप के नाम से बदलें ---
        document.title = `${app.appName} - Devil App Store`;

        // --- 4. स्क्रीनशॉट के लिए HTML बनाएं ---
        let screenshotsHtml = '';
        if (app.screenshots && app.screenshots.length > 0) {
            app.screenshots.forEach(screenshotPath => {
                const urlPath = screenshotPath.replace(/\\/g, '/');
                screenshotsHtml += `<img src="/${urlPath}" alt="Screenshot of ${app.appName}">`;
            });
        } else {
            screenshotsHtml = '<p>No screenshots available.</p>';
        }

        // --- 5. डाउनलोड लिंक बनाएं ---
        let downloadButtonHtml = '';
        if (app.isPaid && app.price > 0) {
            // भविष्य में पेमेंट गेटवे के लिए
            downloadButtonHtml = `<button class="btn-download" style="background-color: #f0ad4e;">Buy for ₹${app.price}</button>`;
        } else {
            const downloadUrl = `/download/${app._id}`;
            downloadButtonHtml = `<a href="${downloadUrl}" class="btn-download">Download</a>`;
        }

        // --- 6. पूरे ऐप डिटेल का HTML बनाएं ---
        const appHtml = `
            <div class="container">
                <section class="app-header">
                    <img src="/${app.iconPath.replace(/\\/g, '/')}" alt="App Icon" class="app-icon-large">
                    <div class="app-title-info">
                        <h1>${app.appName}</h1>
                        <p class="developer-name">By ${app.developer ? app.developer.fullName : 'Unknown Developer'}</p>
                        <div class="rating">★★★★☆ (${app.downloadCount.toLocaleString()} downloads)</div>
                        ${downloadButtonHtml}
                    </div>
                </section>

                <section class="app-screenshots">
                    <h2>Screenshots</h2>
                    <div class="screenshot-gallery">
                        ${screenshotsHtml}
                    </div>
                </section>

                <section class="app-description">
                    <h2>Description</h2>
                    <p>${app.description.replace(/\n/g, '<br>')}</p>
                </section>
            </div>
        `;

        // --- 7. "Loading..." संदेश को असली HTML से बदलें ---
        appDetailContainer.innerHTML = appHtml;

        // --- 8. डाउनलोड बटन पर फीडबैक जोड़ें ---
        const downloadBtn = document.querySelector('.btn-download');
        if(downloadBtn && !app.isPaid) { // सिर्फ फ्री ऐप्स के लिए
            downloadBtn.addEventListener('click', () => {
                setTimeout(() => { downloadBtn.textContent = 'Downloading...'; }, 100);
                setTimeout(() => {
                    downloadBtn.textContent = 'Download';
                }, 4000);
            });
        }

    } catch (error) {
        // अगर कोई भी एरर आता है, तो एक उपयोगी संदेश दिखाएं
        console.error('Failed to fetch app details:', error);
        appDetailContainer.innerHTML = `
            <div class="container">
                <h1 class="page-title">404 - Not Found</h1>
                <p class="empty-message">The app you are looking for does not exist or may have been removed.</p>
            </div>
        `;
    }
});