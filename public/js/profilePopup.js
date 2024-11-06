document.addEventListener('DOMContentLoaded', () => {
    const profileIcon = document.querySelector('.profile-container a');
    const profileDropdown = document.getElementById('profileDropdown');

    // Make sure the dropdown starts hidden when the page loads
    profileDropdown.classList.add('hidden');

    // Event listener to toggle the profile dropdown visibility
    profileIcon.addEventListener('click', (event) => {
        // Preventing the link's default action
        event.preventDefault();

        // Toggle the visibility of the dropdown
        profileDropdown.classList.toggle('hidden');
    });

    // Close dropdown if clicking outside of it
    document.addEventListener('click', (event) => {
        if (!profileDropdown.contains(event.target) && !profileIcon.contains(event.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
});
