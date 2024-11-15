// public/js/imageModalHandler.js

document.addEventListener("DOMContentLoaded", () => {
    // Select the modal by ID
    const imageModal = document.getElementById("imageModal");
    
    // Select the image inside the modal
    const modalImage = document.getElementById("modalImage");
    
    // Select the caption element
    const captionText = document.getElementById("caption");
    
    // Select the close button within the modal
    const closeImageModalBtn = document.getElementById("closeImageModal");
    
    // Select all containers that may hold thumbnails, including the main product image container
    const thumbnailsContainers = document.querySelectorAll(".photo-thumbnails, .product-thumbnails, .product-main-image");

    let lastFocusedThumbnail = null;

    // Function to open the modal with the specified image and alt text
    const openModal = (src, alt) => {
        modalImage.src = src;
        modalImage.alt = alt;
        captionText.textContent = alt || "Enlarged Image";
        imageModal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Prevent background scrolling
        closeImageModalBtn.focus(); // Set focus to the close button for accessibility
    };

    // Function to close the modal
    const closeModal = () => {
        imageModal.style.display = "none";
        document.body.style.overflow = "auto"; // Restore scrolling
        if (lastFocusedThumbnail) {
            lastFocusedThumbnail.focus(); // Return focus to the last focused thumbnail
        }
    };

    // Attach a single event listener to each thumbnails container for event delegation
    thumbnailsContainers.forEach((container) => {
        container.addEventListener("click", (event) => {
            // Determine if a thumbnail was clicked
            const thumbnail = event.target.closest(".thumbnail");
            if (thumbnail && container.contains(thumbnail)) {
                const src = thumbnail.getAttribute("data-src") || thumbnail.src;
                const alt = thumbnail.alt || "Enlarged Image";
                lastFocusedThumbnail = thumbnail;
                openModal(src, alt);
            }
        });
    });

    // Attach click event to the close button to close the modal
    if (closeImageModalBtn) {
        closeImageModalBtn.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside the image
    if (imageModal) {
        imageModal.addEventListener("click", (event) => {
            if (event.target === imageModal) {
                closeModal();
            }
        });
    }

    // Close modal on Esc key press
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && imageModal.style.display === "flex") {
            closeModal();
        }
    });
});
