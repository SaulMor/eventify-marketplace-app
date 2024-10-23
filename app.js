const express = require('express');
const path = require('path'); 
const mongoose = require('mongoose'); 
const session = require('express-session'); 
const bcrypt = require('bcrypt'); 
const User = require('./models/User'); 
const { error } = require('console');
const userRoute = require('./routes/user');
const authRoute = require('./routes/auth');
const listingRoute = require('./routes/listing');

const app = express();
// MongoDB Connecion 
mongoose.connect("mongodb+srv://kabulsoud:Wsmaky72%40@cluster0.elbg8.mongodb.net/Eventify?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log('MongoDB is Connected'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(session({
    secret: 'Secret_KEY',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index'); // Render index.ejs
});

app.get('/login', (req, res) => {
    res.render('login'); // Render login.ejs
}); 
// POST route for login (moved it auth.js)

app.get('/signup', async (req, res) => {
    res.render('signup'); // Render signup.ejs 
}); 

// POST route for sign up (moved it to auth.js)
// app.get('/profile', async (req, res) => {
//     res.render('profile'); // Render profile.ejs
// });  
// using userRoute, authRoutes, and lsiting Routes
app.use(userRoute);
app.use(authRoute);
app.use(listingRoute);

app.get('/contact', (req, res) => {
    res.render('contact'); // Ensure this matches the filename in your views directory
});

app.get('/cart', (req, res) => {
    res.render('cart'); // Make sure this matches the EJS file in 'views' folder
});

app.get('/createListing', (req, res) => {
    res.render('createListing'); // Make sure this matches the EJS file in 'views' folder
});

app.get('/orderActivity', (req, res) => {
    res.render('orderActivity'); // Make sure this matches the EJS file in 'views' folder
});

// Start your server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
