// public/js/modalHandler.js

document.addEventListener("DOMContentLoaded", () => {
  function initializeModal(modalId, closeBtnId) {
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);

    if (modal && closeBtn) {
      // Close modal when the close button is clicked
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
      });

      // Close modal when clicking outside the modal content
      window.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.classList.remove("active");
          document.body.style.overflow = "auto";
        }
      });

      // Close modal on Esc key press
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) {
          modal.classList.remove("active");
          document.body.style.overflow = "auto";
        }
      });
    }
  }

  // Initialize Offer Modal
  initializeModal("offerModal", "closeOfferModal");

  // Initialize Add to Cart Modal
  initializeModal("addToCartModal", "closeAddToCartModal");
});
