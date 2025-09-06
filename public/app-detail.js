// =================================================================
// ऐप डिटेल पेज स्क्रिप्ट (समीक्षा प्रणाली के साथ अंतिम संस्करण)
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const appDetailContainer = document.getElementById('app-detail-container');
    if (!appDetailContainer) return;

    try {
        const pathParts = window.location.pathname.split('/');
        const appId = pathParts[pathParts.length - 1];
        if (!appId || appId.length < 12) throw new Error('Invalid App ID in URL.');

        const response = await fetch(`/api/app/${appId}`);
        if (!response.ok) throw new Error('The requested app could not be found on the server.');
        const app = await response.json();
        
        document.title = `${app.appName} - Devil App Store`;

        let screenshotsHtml = '<p>No screenshots available.</p>';
        if (app.screenshots && app.screenshots.length > 0) {
            screenshotsHtml = app.screenshots.map(p => `<img src="/${p.replace(/\\/g, '/')}" alt="Screenshot">`).join('');
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        let downloadButtonHtml = '';
        if (app.isPaid && app.price > 0) {
            downloadButtonHtml = `<a href="/checkout?appId=${app._id}" class="btn-download" style="background-color: #f0ad4e;">Buy for ₹${app.price}</a>`;
        } else {
            let downloadUrl = `/download/${app._id}`;
            if (refCode) downloadUrl += `?ref=${refCode}`;
            downloadButtonHtml = `<a href="${downloadUrl}" class="btn-download">Download</a>`;
        }

        const developerName = app.developer ? app.developer.fullName : 'Unknown Developer';
        const iconPath = app.iconPath.replace(/\\/g, '/');
        const appHtml = `
            <div class="container">
                <section class="app-header">
                    <img src="/${iconPath}" alt="App Icon" class="app-icon-large">
                    <div class="app-title-info">
                        <h1>${app.appName}</h1>
                        <p class="developer-name">By ${developerName}</p>
                        <!-- औसत रेटिंग को यहाँ दिखाएं -->
                        <div class="rating" id="app-header-rating">${'★'.repeat(Math.round(app.averageRating || 0))}${'☆'.repeat(5 - Math.round(app.averageRating || 0))} (${app.reviewCount || 0} reviews)</div>
                        ${downloadButtonHtml}
                    </div>
                </section>
                <section class="app-screenshots">
                    <h2>Screenshots</h2>
                    <div class="screenshot-gallery">${screenshotsHtml}</div>
                </section>
                <section class="app-description">
                    <h2>Description</h2>
                    <p>${app.description.replace(/\n/g, '<br>')}</p>
                </section>
            </div>
        `;
        appDetailContainer.innerHTML = appHtml;

        // --- समीक्षा प्रणाली का लॉजिक ---
        const reviewFormContainer = document.getElementById('review-form-container');
        const reviewsList = document.getElementById('reviews-list');
        const avgRatingSummary = document.getElementById('avg-rating-summary');
        
        if(avgRatingSummary) avgRatingSummary.textContent = `${(app.averageRating || 0).toFixed(1)} ★`;

        const reviewsResponse = await fetch(`/api/app/${appId}/reviews`);
        const reviews = await reviewsResponse.json();
        let reviewsHtml = '';
        if (reviews.length > 0) {
            reviews.forEach(review => {
                reviewsHtml += `<div class="review-card"><strong>${review.userName}</strong><div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div><p>${review.comment}</p></div>`;
            });
        } else {
            reviewsHtml = '<p class="empty-message">No reviews yet. Be the first to write one!</p>';
        }
        if(reviewsList) reviewsList.innerHTML = reviewsHtml;

        const userStatusResponse = await fetch('/api/user-status');
        if (userStatusResponse.ok && reviewFormContainer) {
            reviewFormContainer.style.display = 'block';
            const reviewForm = document.getElementById('review-form');
            const stars = reviewForm.querySelectorAll('.star-rating i');
            const ratingInput = document.getElementById('rating-value');

            stars.forEach(star => {
                star.addEventListener('click', () => {
                    ratingInput.value = star.dataset.value;
                    stars.forEach((s, index) => {
                        s.className = index < ratingInput.value ? 'fas fa-star selected' : 'far fa-star';
                    });
                });
            });

            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const response = await fetch(`/api/app/${appId}/review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: ratingInput.value, comment: reviewForm.querySelector('textarea[name="comment"]').value })
                });
                if (response.ok) window.location.reload();
                else alert('Failed to submit review.');
            });
        }
        
    } catch (error) {
        console.error('Failed to render app details:', error);
        appDetailContainer.innerHTML = `<div class="container"><h1 class="page-title">Error</h1><p class="empty-message">${error.message}</p></div>`;
    }
});