// middleware/auth.js

module.exports = function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        // For API routes, respond with JSON
        if (req.originalUrl.startsWith('/user') || req.originalUrl.startsWith('/auth')) {
            return res.status(401).json({ error: 'Unauthorized: No session found' });
        }
        // For web routes, redirect to login with an error message
        req.session.error = 'Please log in to view that resource';
        res.redirect('/auth/login');
    }
};
