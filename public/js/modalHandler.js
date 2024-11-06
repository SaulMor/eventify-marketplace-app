// public/js/modalHandler.js

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");
    const closeBtn = document.getElementsByClassName("close")[0];

    // Get the thumbnails container
    const thumbnailsContainer = document.querySelector(".photo-thumbnails");

    // Variable to keep track of the last focused thumbnail
    let lastFocusedThumbnail = null;

    // Add a single event listener to the thumbnails container using Event Delegation
    thumbnailsContainer.addEventListener("click", (e) => {
        // Check if the clicked element has the 'thumbnail' class
        if (e.target && e.target.classList.contains("thumbnail")) {
            modal.style.display = "block";
            modalImg.src = e.target.src;
            modalImg.alt = e.target.alt;
            captionText.innerHTML = e.target.alt || "Enlarged Image";
            document.body.style.overflow = "hidden"; 
            closeBtn.focus(); 
            lastFocusedThumbnail = e.target; 
        }
    });

    // When the user clicks on <span> (x), close the modal
    closeBtn.onclick = function () {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; 
        if (lastFocusedThumbnail) {
            lastFocusedThumbnail.focus(); 
        }
    };

    // When the user clicks anywhere outside of the modal content, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; 
            if (lastFocusedThumbnail) {
                lastFocusedThumbnail.focus(); 
            }
        }
    };

    // Close modal on Esc key press
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && modal.style.display === "block") {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; 
            if (lastFocusedThumbnail) {
                lastFocusedThumbnail.focus(); 
            }
        }
    });
});
