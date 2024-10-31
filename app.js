// app.js

const express = require('express');
const path = require('path'); 
const mongoose = require('mongoose'); 
const methodOverride = require('method-override');
const morgan = require('morgan'); // For logging
const helmet = require('helmet'); // For securing HTTP headers
const rateLimit = require('express-rate-limit'); // For rate limiting
const admin = require('firebase-admin');
const cors = require('cors'); // For handling CORS, if needed
const csrf = require('csurf'); // CSRF protection
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); // Import cookie-parser
const session = require('express-session'); // Import express-session
const MongoStore = require('connect-mongo'); // Import connect-mongo
const flash = require('connect-flash');

require('dotenv').config(); // Load environment variables

const app = express();

// -----------------------------
// MongoDB Connection 
// -----------------------------

mongoose.connect(process.env.MONGODB_URI, { // Use environment variable only
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB is Connected'))
    .catch((error) => console.error('MongoDB connection error:', error));

// -----------------------------
// Middleware
// -----------------------------

// Initialize Firebase Admin SDK using the service account JSON file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://your_project_id.firebaseio.com", // Uncomment if using Realtime Database
});

// HTTP request logger
app.use(morgan('dev'));

// Body Parsing Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// Method Override Middleware
app.use(methodOverride('_method')); // Looks for a query parameter like ?_method=PUT

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'))); 

// Helmet for security
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                'https://www.gstatic.com',
                'https://www.googleapis.com',
                'https://www.gstatic.com/firebasejs/',
                'https://cdn.jsdelivr.net'
            ],
            styleSrc: [
                "'self'",
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com'
            ],
            fontSrc: [
                "'self'",
                'https://fonts.gstatic.com',
                'https://cdnjs.cloudflare.com'
            ],
            imgSrc: [
                "'self'",
                'data:',
                'https://yourdomain.com' // Replace with your actual domain
            ],
            connectSrc: [
                "'self'",
                'https://www.googleapis.com',
                'https://www.gstatic.com',
                'https://identitytoolkit.googleapis.com' // Added Firebase Auth endpoint
            ],
            // Add other directives as needed
        },
    })
);

// CORS Middleware (Optional: Adjust based on your needs)
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your client's origin
    credentials: true
}));

// Rate Limiting (Optional but Recommended)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many attempts from this IP, please try again after 15 minutes'
});
app.use('/auth', authLimiter);

// Use cookie-parser before express-session and csurf
app.use(cookieParser());

// Initialize express-session with MongoDB as the session store
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Initialize connect-flash
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Initialize CSRF protection with cookies
const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection to auth routes and set csrfToken
app.use('/auth', csrfProtection, (req, res, next) => {
    res.locals.csrfToken = req.csrfToken(); // Set CSRF token for EJS templates
    next();
}, require('./routes/auth'));

// Make CSRF token available in all views if it exists (for other routes)
app.use((req, res, next) => {
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next();
});

// -----------------------------
// View Engine Setup
// -----------------------------

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// -----------------------------
// Routes
// -----------------------------

// Home Route
app.get('/', (req, res) => {
    res.render('index'); // Render index.ejs
});

// Contact Route
app.get('/contact', (req, res) => {
    res.render('contact'); // Ensure this matches the filename in your views directory
});

// Cart Route
app.get('/cart', (req, res) => {
    res.render('cart'); // Make sure this matches the EJS file in 'views' folder
});

// Order Activity Route
app.get('/orderActivity', (req, res) => {
    res.render('orderActivity'); // Make sure this matches the EJS file in 'views' folder
});

// -----------------------------
// Listing Routes (Mounted Here)
// -----------------------------

const listingRoutes = require('./routes/listing'); // Import the listing routes
app.use('/listing', listingRoutes); // Mount them under /listing

// -----------------------------
// User Routes (Protected API)
// -----------------------------

const userRoutes = require('./routes/user'); // Import the user routes
app.use('/user', userRoutes); // Mount them under /user

// -----------------------------
// Error Handling Middleware
// -----------------------------

// 404 Route (Should be the last route)
app.use((req, res, next) => {
    res.status(404).render('404', { message: 'Page Not Found' }); // Ensure you have a 404.ejs template
});

// 500 Route (Error handling middleware)
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (req.originalUrl.startsWith('/auth') || req.originalUrl.startsWith('/user')) {
        // If the request is for an API route, respond with JSON
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        // For non-API routes, render the 500 error page
        res.status(500).render('500', { message: 'Internal Server Error' });
    }
});

// -----------------------------
// Start Your Server
// -----------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
