const express = require('express');
const path = require('path'); 
const mongoose = require('mongoose'); 
const session = require('express-session'); 
const bcrypt = require('bcrypt'); 
const User = require('./models/User'); 
const { error } = require('console');

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
// POST route for login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user._id; // Store userId in session
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Log in Error");
    }
});
app.get('/signup', async (req, res) => {
    res.render('signup'); // Render signup.ejs 
}); 

// POST route for sign up
app.post('/signup', async (req, res) => { 
    try { 
        const {name, email, password} = req.body; 
        const encyptedPassword = bcrypt.hashSync(password, 10); 

        const newUser = await User.create({ 
            name, 
            email, 
            password: encyptedPassword
        });
        res.redirect('/login')
    } catch(err) { 
        console.error(err); 
        res.status(500).send("Sign up Erorr");
    }
});
// app.get('/profile', async (req, res) => {
//     res.render('profile'); // Render profile.ejs
// }); 
app.get('/profile', async (req, res) => {
    try {
        // if user not logged in, redirect to profile
        if (!req.session.userId) {
            return res.redirect('/signup');
        }

        // Find the user by id to display their profile
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Render profile with user data
        res.render('profile', { user: user}); {
            user: user
        };
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving profile information.');
    }
});

app.get('/contact', (req, res) => {
    res.render('contact'); // Ensure this matches the filename in your views directory
});

// Start your server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
