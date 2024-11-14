// public/js/deleteHandler.js

document.addEventListener('DOMContentLoaded', function() {
    const deleteForm = document.getElementById('deleteForm');
    const openDeleteModalBtn = document.getElementById('openDeleteModalBtn');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    if (openDeleteModalBtn && confirmationModal && closeModalBtn && confirmDeleteBtn && cancelDeleteBtn && deleteForm) {
        // Open the modal when the delete button is clicked
        openDeleteModalBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent any default action
            confirmationModal.style.display = 'flex'; // Show the modal
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            confirmDeleteBtn.focus(); // Set focus to the confirm button for accessibility
        });

        // Close the modal when the close button is clicked
        closeModalBtn.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            openDeleteModalBtn.focus(); // Return focus to the delete button
        });

        // Close the modal when the cancel button is clicked
        cancelDeleteBtn.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            openDeleteModalBtn.focus(); // Return focus to the delete button
        });

        // Handle the confirmation of deletion
        confirmDeleteBtn.addEventListener('click', function() {
            // Optionally, add any pre-submission logic here

            // Submit the form programmatically
            deleteForm.submit();
        });

        // Close the modal when clicking outside the modal content
        window.addEventListener('click', function(event) {
            if (event.target === confirmationModal) {
                confirmationModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scrolling
                openDeleteModalBtn.focus(); // Return focus to the delete button
            }
        });

        // Optional: Close the modal on Esc key press
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && confirmationModal.style.display === 'flex') {
                confirmationModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scrolling
                openDeleteModalBtn.focus(); // Return focus to the delete button
            }
        });
    } else {
        console.error('One or more elements not found. Check your HTML for correct IDs.');
    }
});
