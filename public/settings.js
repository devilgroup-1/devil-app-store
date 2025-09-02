// =================================================================
// अकाउंट सेटिंग्स पेज स्क्रिप्ट
// यह यूजर की जानकारी दिखाती है और उसे अपडेट करने देती है
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {

    // HTML एलिमेंट्स को चुनें
    const profileForm = document.getElementById('profile-form');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const profileMessage = document.getElementById('profile-message');

    // अगर पेज पर ये एलिमेंट्स नहीं हैं, तो कुछ न करें
    if (!profileForm || !fullNameInput || !emailInput || !profileMessage) {
        return;
    }

    // --- यूजर की मौजूदा जानकारी API से प्राप्त करें और फॉर्म में भरें ---
    try {
        const response = await fetch('/api/user-status');
        if (!response.ok) throw new Error('Could not fetch user data');
        const user = await response.json();
        
        fullNameInput.value = user.fullName;
        emailInput.value = user.email;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        profileMessage.textContent = 'Could not load your data.';
        profileMessage.style.color = 'var(--primary-red)';
    }

    // --- फॉर्म सबमिट होने पर प्रोफाइल अपडेट करें ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // पेज को रीलोड होने से रोकें
        
        const data = { fullName: fullNameInput.value };

        try {
            // यूजर को फीडबैक दें कि अपडेट हो रहा है
            profileMessage.textContent = 'Updating...';
            profileMessage.style.color = 'var(--text-muted)';

            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();

            if (result.success) {
                profileMessage.textContent = 'Profile updated successfully!';
                profileMessage.style.color = 'var(--green-status)';
            } else {
                throw new Error(result.error || 'Update failed');
            }
        } catch (error) {
            profileMessage.textContent = 'Error updating profile. Please try again.';
            profileMessage.style.color = 'var(--primary-red)';
            console.error('Profile update error:', error);
        }
    });
});