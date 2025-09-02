// =================================================================
// सर्च रिजल्ट पेज स्क्रिप्ट
// यह URL से खोज शब्द लेती है और API से परिणाम लाकर दिखाती है
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // HTML एलिमेंट्स को चुनें
    const appGridContainer = document.getElementById('app-grid-container');
    const searchTitle = document.getElementById('search-results-title');

    // अगर पेज पर ये एलिमेंट्स नहीं हैं, तो कुछ न करें
    if (!appGridContainer || !searchTitle) {
        return;
    }

    // --- URL से खोज शब्द (query) निकालें ---
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    // अगर कोई खोज शब्द नहीं है, तो संदेश दिखाएं
    if (!query) {
        appGridContainer.innerHTML = '<p class="empty-message">Please enter a search term in the header.</p>';
        searchTitle.textContent = 'No Search Query';
        return;
    }
    
    // पेज के शीर्षक को अपडेट करें
    searchTitle.textContent = `Search Results for "${query}"`;

    try {
        // --- API से खोज परिणाम प्राप्त करें ---
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Search request failed');
        }
        const apps = await response.json();

        // अगर कोई परिणाम नहीं मिला, तो संदेश दिखाएं
        if (apps.length === 0) {
            appGridContainer.innerHTML = `<p class="empty-message">No results found for "${query}".</p>`;
            return;
        }

        // --- परिणामों को HTML कार्ड्स में बदलें ---
        let allAppsHtml = '';
        apps.forEach(app => {
            const developerName = app.developer ? app.developer.fullName : 'Unknown Developer';
            const iconPath = app.iconPath.replace(/\\/g, '/');
            
            // यह home.js जैसा ही कार्ड है
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
        // अगर कोई एरर आता है, तो एरर संदेश दिखाएं
        console.error('Failed to perform search:', error);
        appGridContainer.innerHTML = '<p class="empty-message">An error occurred during the search. Please try again.</p>';
    }
});