// middleware/auth.js

module.exports = function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    req.flash('error', 'Please log in to view that resource');
    res.redirect('/auth/login'); // Redirect to login instead of signup
};
