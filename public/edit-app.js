// =================================================================
// ऐप एडिट पेज स्क्रिप्ट
// यह मौजूदा ऐप का डेटा लाती है और उसे अपडेट करने देती है
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const editFormContainer = document.getElementById('edit-form-container');
    if (!editFormContainer) return;

    // 1. URL से ऐप की ID निकालें (जैसे ?id=xxxxxxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get('id');

    if (!appId) {
        editFormContainer.innerHTML = '<p class="empty-message">No App ID provided. Please go back to the dashboard.</p>';
        return;
    }

    try {
        // 2. API से उस ऐप का मौजूदा डेटा प्राप्त करें
        const response = await fetch(`/api/app/${appId}`);
        if (!response.ok) throw new Error('App not found or you do not have permission to edit it.');
        const app = await response.json();

        // 3. पेज का शीर्षक बदलें
        const pageTitle = document.getElementById('edit-page-title');
        if(pageTitle) pageTitle.textContent = `Editing: ${app.appName}`;

        // 4. फॉर्म का पूरा HTML बनाएं और उसे डेटा से भरें
        const formHtml = `
            <h2>App Details</h2>
            <p class="description">Update the details for your app below. To change the file or icon, simply upload a new one. Leave fields blank to keep them unchanged.</p>
            
            <form class="upload-form" action="/update-app/${appId}" method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="appName">App / Creation Name</label>
                    <input type="text" id="appName" name="appName" class="form-control" value="${app.appName || ''}" required>
                </div>

                <div class="form-group">
                    <label for="appCategory">Category</label>
                    <select id="appCategory" name="category" class="form-control" required>
                        <option value="app" ${app.category === 'app' ? 'selected' : ''}>Android App (.apk)</option>
                        <option value="ebook" ${app.category === 'ebook' ? 'selected' : ''}>Ebook (.epub, .pdf)</option>
                        <option value="music" ${app.category === 'music' ? 'selected' : ''}>Music (.mp3)</option>
                        <option value="game" ${app.category === 'game' ? 'selected' : ''}>Game (.apk)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Monetization</label>
                    <select id="monetization-type" name="isPaid" class="form-control">
                        <option value="false" ${!app.isPaid ? 'selected' : ''}>Free</option>
                        <option value="true" ${app.isPaid ? 'selected' : ''}>Paid</option>
                    </select>
                </div>

                <div class="form-group" id="price-input-container" style="display: ${app.isPaid ? 'block' : 'none'};">
                    <label for="price">Price (in INR)</label>
                    <input type="number" id="price" name="price" class="form-control" min="10" value="${app.price || '49'}" placeholder="e.g., 49">
                </div>

                <div class="form-group">
                    <label for="appFile">Update Main File (Optional)</label>
                    <p class="description" style="margin-bottom: 5px;">Current: ${app.filePath.split(/[\\/]/).pop()}</p>
                    <input type="file" id="appFile" name="appFile" class="form-control">
                </div>

                <div class="form-group">
                    <label for="appIcon">Update Icon (Optional)</label>
                    <input type="file" id="appIcon" name="appIcon" class="form-control" accept="image/png, image/jpeg">
                </div>

                <div class="form-group">
                    <label for="appScreenshots">Add More Screenshots (Optional)</label>
                    <input type="file" id="appScreenshots" name="screenshots" class="form-control" accept="image/jpeg, image/png" multiple>
                </div>
                
                <div class="form-group">
                    <label for="appDescription">Description</label>
                    <textarea id="appDescription" name="description" class="form-control" rows="6" required>${app.description || ''}</textarea>
                </div>
                
                <button type="submit" class="btn-form">Update App</button>
            </form>
        `;

        // 5. फॉर्म को पेज पर दिखाएं
        editFormContainer.innerHTML = formHtml;
        
        // 6. मुद्रीकरण (Monetization) ड्रॉपडाउन के लिए इवेंट लिसनर जोड़ें
        document.getElementById('monetization-type').addEventListener('change', function() {
            document.getElementById('price-input-container').style.display = this.value === 'true' ? 'block' : 'none';
        });

    } catch (error) {
        console.error('Failed to load app for editing:', error);
        editFormContainer.innerHTML = `<p class="empty-message">${error.message}</p>`;
    }
});