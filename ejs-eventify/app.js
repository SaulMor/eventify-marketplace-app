const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/signup', (req, res) => {
    res.render('signup'); // Render signup.ejs
});

app.get('/contact', (req, res) => {
    res.render('contact'); // Ensure this matches the filename in your views directory
});

// Start your server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
