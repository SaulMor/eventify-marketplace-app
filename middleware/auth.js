// middleware/auth.js

module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session.userId) {
            return next();
        }
        req.flash('error', 'Please log in to view that resource');
        res.redirect('/login'); // Redirect unauthenticated users to the login page
    }
};
