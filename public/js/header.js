// public/js/header.js

// Function to toggle the profile dropdown visibility
function toggleProfileDropdown(event) {
    event.stopPropagation(); // Prevent the click event from bubbling up to the window
    const dropdown = document.getElementById("profileDropdown");
    dropdown.classList.toggle("show-dropdown");
}

// Close the dropdown if clicking outside the profile icon or dropdown
window.onclick = function(event) {
    const dropdown = document.getElementById("profileDropdown");
    if (!event.target.matches('#profile-icon') && !dropdown.contains(event.target)) {
        if (dropdown.classList.contains('show-dropdown')) {
            dropdown.classList.remove('show-dropdown');
        }
    }
};

// Function to handle logout
function logout() {
    alert("Logged out successfully!");
}
