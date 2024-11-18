// public/js/deleteHandler.js

document.addEventListener('DOMContentLoaded', function() {
    // Get the confirmation modal elements
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    // Variable to store the form to be submitted
    let formToDelete = null;

    // Get all delete buttons with the common class '.delete-btn'
    const deleteButtons = document.querySelectorAll('.delete-btn');

    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent any default action

            // Get the form ID from data attribute
            const formId = this.getAttribute('data-form-id');
            formToDelete = document.getElementById(formId);

            if (formToDelete) {
                // Show the confirmation modal
                confirmationModal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                confirmDeleteBtn.focus(); // Set focus to the confirm button for accessibility
            } else {
                console.error('Form not found for deletion.');
            }
        });
    });

    // Close the modal when the close button is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            formToDelete = null;
        });
    }

    // Close the modal when the cancel button is clicked
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            formToDelete = null;
        });
    }

    // Handle the confirmation of deletion
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (formToDelete) {
                formToDelete.submit();
            } else {
                console.error('No form is set to delete.');
            }
        });
    }

    // Close the modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            formToDelete = null;
        }
    });

    // Optional: Close the modal on Esc key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && confirmationModal.style.display === 'flex') {
            confirmationModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            formToDelete = null;
        }
    });
});
