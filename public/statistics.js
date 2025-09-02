// =================================================================
// स्टैटिस्टिक्स पेज स्क्रिप्ट
// यह डेवलपर के आँकड़े API से लाती है और दिखाती है
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // HTML एलिमेंट्स को चुनें
    const totalAppsElem = document.getElementById('stats-total-apps');
    const totalDownloadsElem = document.getElementById('stats-total-downloads');

    // अगर पेज पर ये एलिमेंट्स नहीं हैं, तो कुछ न करें
    if (!totalAppsElem || !totalDownloadsElem) {
        return;
    }

    try {
        // --- API से आँकड़े प्राप्त करें ---
        const response = await fetch('/api/my-stats');
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        const stats = await response.json();

        // पेज पर आँकड़े दिखाएं
        totalAppsElem.textContent = stats.totalApps;
        totalDownloadsElem.textContent = stats.totalDownloads.toLocaleString(); // संख्याओं को कॉमा के साथ फॉर्मेट करें

    } catch (error) {
        // अगर कोई एरर आता है, तो एरर संदेश दिखाएं
        console.error("Failed to fetch stats:", error);
        totalAppsElem.textContent = 'Error';
        totalDownloadsElem.textContent = 'Error';
    }
});