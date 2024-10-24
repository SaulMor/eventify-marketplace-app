// public/scripts/createListing.js

document.getElementById('createListingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const formData = new FormData(e.target);

    // Convert FormData to JSON
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    try {
        const response = await fetch('/api/listings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Include authentication headers if necessary
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const savedListing = await response.json();
            alert('Listing created successfully!');
            window.location.href = `/listing/${savedListing._id}`;
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
    }
});
