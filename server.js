// =================================================================
// Devil App Store - Final Server Code
// =================================================================

// 1. मॉड्यूल इंपोर्ट करें
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 2. एप्लिकेशन और कॉन्फ़िगरेशन
const app = express();
const PORT = 3000;
const CONNECTION_STRING = "mongodb+srv://devil_user:devilgroup2003@cluster0.3yrdulr.mongodb.net/devilappstore?retryWrites=true&w=majority&appName=Cluster0";

// Multer कॉन्फ़िगरेशन
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, (req.session.userId || 'temp') + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// 3. मिडलवेयर (यह क्रम बहुत महत्वपूर्ण है)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'a_very_secret_key_for_devil_app_store_12345',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: CONNECTION_STRING })
}));

// 4. डेटाबेस स्कीमा
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    aadhaarNumber: { type: String, default: null },
    verificationStatus: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    role: { type: String, enum: ['developer', 'admin'], default: 'developer' },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});
const User = mongoose.model('User', userSchema);

const appSchema = new mongoose.Schema({
    appName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: String, default: '1.0' },
    filePath: { type: String, required: true },
    iconPath: { type: String, required: true },
    screenshots: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    price: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    uploadDate: { type: Date, default: Date.now },
    downloadCount: { type: Number, default: 0 }
});
appSchema.index({ appName: 'text', description: 'text', category: 'text' });
const App = mongoose.model('App', appSchema);

const downloadSchema = new mongoose.Schema({
    app: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    downloadedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    referredBy: { type: String }
});
const Download = mongoose.model('Download', downloadSchema);

// 5. कस्टम रूट मिडलवेयर
const requireLogin = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login.html');
    next();
};

const requireVerified = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.verificationStatus !== 'verified') {
            return res.status(403).send("<h1>Access Denied</h1><p>You must be a verified developer to perform this action.</p><a href='/dashboard'>Go back</a>");
        }
        next();
    } catch (error) {
        res.status(500).send("<h1>Error</h1><p>Something went wrong.</p>");
    }
};

// 6. API और एक्शन रूट्स
// AUTH
app.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) return res.status(400).send('<h1>Error</h1><p>All fields are required.</p>');
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ fullName, email, password: hashedPassword });
        res.redirect('/login.html');
    } catch (error) {
        if (error.code === 11000) return res.status(400).send('<h1>Error</h1><p>Email already exists.</p>');
        res.status(500).send('<h1>Error</h1><p>Server error during registration.</p>');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send('<h1>Login Failed</h1><p>Incorrect email or password.</p>');
        }
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).send('<h1>Error</h1><p>Server error during login.</p>');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const token = crypto.randomBytes(20).toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000;
            await user.save();
            const resetURL = `http://localhost:3000/reset/${token}`; // Note: Replace localhost in production
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'devilgroup1@gmail.com',
                    pass: 'yqik fncw pmqv gkkb'
                }
            });

            const mailOptions = {
                from: 'Devil App Store <devilgroup1@gmail.com>',
                to: user.email,
                subject: 'Password Reset for Your Devil App Store Account',
                html: `<p>You requested a password reset. Click this link to reset your password:</p><a href="${resetURL}">${resetURL}</a><p>This link will expire in one hour.</p>`
            };
            await transporter.sendMail(mailOptions);
        }
        res.status(200).send('If an account with this email exists, a reset link has been sent.');
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).send("An internal server error occurred.");
    }
});

app.get('/reset/:token', async (req, res) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).send('<h1>Error</h1><p>Password reset token is invalid or has expired.</p>');
        res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
    } catch (error) { res.status(500).send('<h1>Error</h1><p>An error occurred.</p>'); }
});

app.post('/reset/:token', async (req, res) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).send('<h1>Error</h1><p>Password reset token is invalid or has expired.</p>');
        if (req.body.password !== req.body.confirmPassword) return res.status(400).send('<h1>Error</h1><p>Passwords do not match.</p>');

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.send('<h1>Success!</h1><p>Your password has been reset. You can now <a href="/login.html">login</a>.</p>');
    } catch (error) { res.status(500).send('<h1>Error</h1><p>Error resetting password.</p>'); }
});

// ACTIONS
app.post('/verify', requireLogin, upload.single('aadhaarScan'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("<h1>Error</h1><p>Aadhaar scan file is required.</p>");
        await User.findByIdAndUpdate(req.session.userId, { fullName: req.body.fullName, aadhaarNumber: req.body.aadhaarNumber, verificationStatus: 'pending' });
        res.redirect('/dashboard');
    } catch(error) { res.status(500).send("<h1>Error</h1><p>Verification submission failed.</p>"); }
});

app.post('/upload-app', requireLogin, requireVerified, upload.fields([ { name: 'appFile', maxCount: 1 }, { name: 'appIcon', maxCount: 1 }, { name: 'screenshots', maxCount: 5 } ]), async (req, res) => {
    try {
        const { appName, category, description, isPaid, price, version } = req.body;
        await App.create({
            appName, category, description,
            version: version || '1.0',
            isPaid: isPaid === 'true',
            price: isPaid === 'true' ? price : 0,
            developer: req.session.userId,
            filePath: req.files['appFile'][0].path,
            iconPath: req.files['appIcon'][0].path,
            screenshots: req.files['screenshots'] ? req.files['screenshots'].map(file => file.path) : []
        });
        res.redirect('/dashboard');
    } catch (error) { console.error(error); res.status(500).send("<h1>Error</h1><p>App upload failed.</p>"); }
});

app.post('/update-app/:appId', requireLogin, upload.fields([ { name: 'appFile', maxCount: 1 }, { name: 'appIcon', maxCount: 1 }, { name: 'screenshots', maxCount: 5 } ]), async (req, res) => {
    try {
        const { appName, category, description, isPaid, price, version } = req.body;
        const updateData = { appName, category, description, isPaid: isPaid === 'true', price: isPaid === 'true' ? price : 0, version };
        if (req.files['appFile']) updateData.filePath = req.files['appFile'][0].path;
        if (req.files['appIcon']) updateData.iconPath = req.files['appIcon'][0].path;
        await App.findByIdAndUpdate(req.params.appId, updateData);
        res.redirect('/dashboard');
    } catch (error) { console.error(error); res.status(500).send("<h1>Error</h1><p>App update failed.</p>"); }
});

app.post('/api/delete-app/:appId', requireLogin, async (req, res) => {
    try {
        const appId = req.params.appId;
        const app = await App.findOne({ _id: appId, developer: req.session.userId });
        if (!app) return res.status(404).json({ error: 'App not found or you are not the owner.' });
        await App.findByIdAndDelete(appId);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Server error while deleting app.' }); }
});

app.post('/api/update-profile', requireLogin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.session.userId, { fullName: req.body.fullName });
        res.status(200).json({ success: true, message: 'Profile updated!' });
    } catch (error) { res.status(500).json({ success: false, error: 'Server error' }); }
});

// DATA FETCHING
app.get('/api/user-status', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/apps', async (req, res) => {
    try {
        const filter = { status: 'approved' };
        if (req.query.category) { filter.category = req.query.category; }
        const apps = await App.find(filter).populate('developer', 'fullName').sort({ uploadDate: -1 });
        res.json(apps);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/app/:appId', async (req, res) => {
    try {
        const app = await App.findById(req.params.appId).populate('developer', 'fullName');
        if (!app) return res.status(404).json({ error: 'App not found' });
        res.json(app);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/my-apps', requireLogin, async (req, res) => {
    try {
        const myApps = await App.find({ developer: req.session.userId }).sort({ uploadDate: -1 });
        res.json(myApps);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/my-stats', requireLogin, async (req, res) => {
    try {
        const apps = await App.find({ developer: req.session.userId });
        const totalApps = apps.length;
        const totalDownloads = apps.reduce((sum, app) => sum + app.downloadCount, 0);
        res.json({ totalApps, totalDownloads });
    } catch { res.status(500).json({ error: 'Error fetching stats.' }); }
});

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Search query is required.' });
        const apps = await App.find({ $text: { $search: query }, status: 'approved' }).populate('developer', 'fullName');
        res.json(apps);
    } catch { res.status(500).json({ error: 'Server error during search.' }); }
});

// DOWNLOAD ROUTE (Simplest and Most Robust Version)
app.get('/download/:appId', async (req, res) => {
    try {
        const appId = req.params.appId;
        const app = await App.findById(appId);

        if (!app || !app.filePath) {
            return res.status(404).send('File record not found.');
        }
        
        // डाउनलोड की गिनती और रिकॉर्डिंग
        app.downloadCount += 1;
        await app.save();
        
        const downloadRecord = new Download({ app: appId, referredBy: req.query.ref, ipAddress: req.ip });
        await downloadRecord.save();
        
        // --- यह सबसे सरल समाधान है ---

        // 1. सर्वर के रूट से सिर्फ फाइल का नाम लें
        const fileNameOnServer = path.basename(app.filePath);

        // 2. uploads फोल्डर का पूरा पाथ बनाएं
        const absoluteFilePath = path.join(__dirname, 'uploads', fileNameOnServer);

        // 3. उपयोगकर्ता के लिए एक सुंदर फाइल नाम बनाएं
        const friendlyFileName = `${app.appName}${path.extname(app.filePath)}`;
        
        // 4. res.download() का उपयोग करें, यह सबसे विश्वसनीय तरीका है
        res.download(absoluteFilePath, friendlyFileName, (err) => {
            if (err) {
                console.error(`Download Error for AppID ${appId}:`, err);
                // एरर को सीधे तौर पर न भेजें, बस एक सामान्य संदेश दें
                if (!res.headersSent) {
                    res.status(404).send("Could not find the file to download. It may have been removed.");
                }
            }
        });

    } catch (error) {
        console.error(`Critical error in download route for AppID ${req.params.appId}:`, error);
        if (!res.headersSent) {
            res.status(500).send("An internal server error occurred.");
        }
    }
});
// 7. पेज सर्विंग रूट्स (HTML फाइलें)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/forgot-password.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgot-password.html')));
app.get('/reset-password.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/apps.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'apps.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'public', 'search.html')));
app.get('/dashboard', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/upload.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'upload.html')));
app.get('/edit-app.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'edit-app.html')));
app.get('/statistics.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'statistics.html')));
app.get('/settings.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'settings.html')));
app.get('/app/:appId', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app-detail.html')));

// 8. डेटाबेस कनेक्शन और सर्वर स्टार्ट
mongoose.connect(CONNECTION_STRING)
  .then(() => {
    console.log('MongoDB Connected!');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Initial MongoDB Connection Error:', err);
    process.exit(1);
  });