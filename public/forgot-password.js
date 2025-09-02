// =================================================================
// Forgot Password पेज स्क्रिप्ट
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-password-form');
    const messageEl = document.getElementById('form-message');
    if (!form || !messageEl) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // पेज को रीलोड होने से रोकें

        const email = form.querySelector('input[name="email"]').value;
        const button = form.querySelector('button');

        try {
            messageEl.textContent = 'Sending...';
            messageEl.style.color = 'var(--text-muted)';
            button.disabled = true;

            const response = await fetch('/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            // सर्वर हमेशा एक सफलता का संदेश भेजता है, भले ही ईमेल मौजूद न हो,
            // ताकि कोई यह पता न लगा सके कि कौन से ईमेल रजिस्टर्ड हैं।
            if (response.ok) {
                // सर्वर से टेक्स्ट जवाब प्राप्त करें
                const successMessage = await response.text();
                // पूरे फॉर्म को सफलता के संदेश से बदलें
                form.innerHTML = `<h2 class="form-title">Link Sent!</h2><p style="text-align: center; color: var(--text-muted);">${successMessage}</p><p style="text-align: center; margin-top: 20px;"><a href="/login.html" style="color: var(--primary-red);">Back to Login</a></p>`;
            } else {
                throw new Error('Server responded with an error.');
            }

        } catch (error) {
            messageEl.textContent = 'An error occurred. Please try again.';
            messageEl.style.color = 'var(--primary-red)';
            console.error('Forgot password error:', error);
        } finally {
            button.disabled = false;
        }
    });
});