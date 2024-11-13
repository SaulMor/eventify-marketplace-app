// public/js/imageModalHandler.js

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const captionText = document.getElementById("caption");
  const closeBtn = document.getElementById("closeImageModal");
  const thumbnails = document.querySelectorAll(".thumbnail, .clickable-image");

  let lastFocusedThumbnail = null;

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      const dataSrc = thumbnail.getAttribute("data-src");
      if (dataSrc) {
        modalImg.src = dataSrc;
        modalImg.alt = thumbnail.alt;
        captionText.textContent = thumbnail.alt || "Enlarged Image";
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        closeBtn.focus();
        lastFocusedThumbnail = thumbnail;
      }
    });
  });

  // Close modal when the close button is clicked
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    if (lastFocusedThumbnail) {
      lastFocusedThumbnail.focus();
    }
  });

  // Close modal when clicking outside the modal content
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      if (lastFocusedThumbnail) {
        lastFocusedThumbnail.focus();
      }
    }
  });

  // Close modal on Esc key press
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      if (lastFocusedThumbnail) {
        lastFocusedThumbnail.focus();
      }
    }
  });
});
