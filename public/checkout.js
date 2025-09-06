document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get('appId');
    
    // API से ऐप की कीमत लाएं और दिखाएं
    const response = await fetch(`/api/app/${appId}`);
    const app = await response.json();
    
    const detailsDiv = document.getElementById('checkout-details');
    detailsDiv.innerHTML = `<p><strong>App:</strong> ${app.appName}</p><p><strong>Price:</strong> ₹${app.price}</p>`;
    
    // भविष्य में, आप यहीं पर Razorpay का स्क्रिप्ट लोड करेंगे और पेमेंट शुरू करेंगे।
});