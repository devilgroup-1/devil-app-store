// =================================================================
// ग्लोबल स्क्रिप्ट - यह वेबसाइट के हर पेज पर चलती है
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // --- मोबाइल मेनू (हैमबर्गर) लॉजिक ---
    
    // HTML एलिमेंट्स को चुनें
    const mobileMenuButton = document.getElementById('mobile-menu');
    const mainNav = document.getElementById('main-nav');

    // अगर पेज पर मोबाइल मेनू बटन मौजूद है, तो ही आगे बढ़ें
    if (mobileMenuButton && mainNav) {
        
        // बटन पर क्लिक इवेंट जोड़ें
        mobileMenuButton.addEventListener('click', function() {
            // 'active' क्लास को टॉगल करें
            // CSS इस क्लास का उपयोग करके मेनू को दिखाता/छिपाता है और आइकन को 'X' में बदलता है
            mainNav.classList.toggle('active');
            mobileMenuButton.classList.toggle('active');
        });
    }

});