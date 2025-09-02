// =================================================================
// होमपेज और ब्राउज़ पेज स्क्रिप्ट
// यह API से ऐप्स लाती है और उन्हें ग्रिड में दिखाती है
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // ऐप ग्रिड दिखाने वाले कंटेनर को चुनें
    const appGridContainer = document.getElementById('app-grid-container');
    
    // अगर पेज पर यह कंटेनर नहीं है, तो कुछ न करें
    if (!appGridContainer) {
        return;
    }

    // --- कैटेगरी फिल्टर के लिए URL से पैरामीटर पढ़ें ---
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category'); // जैसे 'app', 'game', आदि

    // अगर कोई कैटेगरी है, तो API URL को अपडेट करें
    let apiUrl = '/api/apps';
    if (category) {
        apiUrl = `/api/apps?category=${category}`;
    }

    try {
        // --- API से ऐप्स का डेटा प्राप्त करें ---
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apps = await response.json();

        // अगर कोई ऐप नहीं मिला, तो एक संदेश दिखाएं
        if (apps.length === 0) {
            appGridContainer.innerHTML = '<p class="empty-message">No approved apps found in this category.</p>';
            return;
        }
        
        // --- हर ऐप के लिए HTML कार्ड बनाएं ---
        
        let allAppsHtml = '';

        apps.forEach(app => {
            // सुरक्षा जांच: अगर डेवलपर की जानकारी नहीं है, तो एक डिफ़ॉल्ट नाम दिखाएं
            const developerName = app.developer ? app.developer.fullName : 'Unknown Developer';
            
            // विंडोज पाथ (\\) को URL-फ्रेंडली पाथ (/) में बदलें
            const iconPath = app.iconPath.replace(/\\/g, '/');

            allAppsHtml += `
                <a href="/app/${app._id}" class="app-card-link">
                    <div class="app-card">
                        <img src="/${iconPath}" alt="${app.appName} Icon">
                        <div class="app-info">
                            <h3>${app.appName}</h3>
                            <p class="category">${developerName}</p>
                            <div class="rating">★★★★☆</div>
                        </div>
                    </div>
                </a>
            `;
        });

        // पूरे HTML को एक ही बार में ग्रिड में सेट करें
        appGridContainer.innerHTML = allAppsHtml;

    } catch (error) {
        // अगर कोई एरर आता है, तो एक एरर संदेश दिखाएं
        console.error('Failed to fetch apps:', error);
        appGridContainer.innerHTML = '<p class="empty-message">Could not load apps. Please try again later.</p>';
    }
});