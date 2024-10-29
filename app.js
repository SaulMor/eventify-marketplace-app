// app.js

const express = require('express');
const path = require('path'); 
const mongoose = require('mongoose'); 
const session = require('express-session'); 
const bcrypt = require('bcrypt'); 
const User = require('./models/User'); 
const methodOverride = require('method-override');
const flash = require('connect-flash'); // For flash messages
const morgan = require('morgan'); // For logging
const helmet = require('helmet'); // For securing HTTP headers
const rateLimit = require('express-rate-limit'); // Optional: For rate limiting
const MongoStore = require('connect-mongo'); // For session storage

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

// HTTP request logger
app.use(morgan('dev'));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Method Override Middleware
app.use(methodOverride('_method')); // Looks for a query parameter like ?_method=PUT

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'))); 

// Helmet for security
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https://yourdomain.com'],
            connectSrc: ["'self'"],
            // Add other directives as needed
        },
    })
);

// Rate Limiting (Optional but Recommended)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many attempts from this IP, please try again after 15 minutes'
});
app.use('/auth', authLimiter);

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET, // Use environment variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Flash Messages
app.use(flash());

// Make flash messages and user data available in all views
app.use(async (req, res, next) => {
    res.locals.messages = req.flash(); // Combines all flash messages into a single object
    res.locals.user = null; // Default user
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId).lean(); // Use .lean() for plain JS objects
            res.locals.user = user;
        } catch (err) {
            console.error(err);
        }
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

// Authentication Routes
const authRoutes = require('./routes/auth'); // Import the auth routes
app.use('/auth', authRoutes); // Mount them under /auth

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
// User Routes (Mounted Here)
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
    res.status(500).render('500', { message: 'Internal Server Error' }); // Ensure you have a 500.ejs template
});

// -----------------------------
// Start Your Server
// -----------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
