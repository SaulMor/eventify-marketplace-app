// middleware/authorizeListing.js

const Listing = require('../models/Listing');

const authorizeListing = async (req, res, next) => {
    try {
        const listingId = req.params.id;

        if (!listingId || !listingId.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash('error', 'Invalid listing ID.');
            return res.redirect('/user/profile1');
        }

        const listing = await Listing.findById(listingId);

        if (!listing) {
            req.flash('error', 'Listing not found.');
            return res.redirect('/user/profile1');
        }

        // Check if the logged-in user is the owner
        if (listing.userId.toString() !== req.session.user.id.toString()) {
            req.flash('error', 'You are not authorized to perform this action.');
            return res.redirect('/user/profile1');
        }

        // Attach the listing to the request object for use in the route handler
        req.listing = listing;

        next();
    } catch (error) {
        console.error('Error in authorizeListing middleware:', error);
        req.flash('error', 'An error occurred. Please try again.');
        res.redirect('/user/profile1');
    }
};

module.exports = authorizeListing;
