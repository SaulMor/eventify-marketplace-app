// public/js/productDetail.js

document.addEventListener("DOMContentLoaded", () => {
  const favoriteButton = document.getElementById("favorite-button");
  const addToCartButton = document.querySelector(".add-to-cart-form .add-to-cart-btn"); // Select the 'Add to Cart' button within the form
  const csrfTokenElement = document.getElementById("csrf-token");
  const csrfToken = csrfTokenElement ? csrfTokenElement.value : '';

  if (favoriteButton) {
    favoriteButton.addEventListener("click", async function (e) {
      e.preventDefault(); // Prevent default button behavior

      const button = e.currentTarget;
      const listingId = button.getAttribute("data-listing-id") || getListingIdFromURL();

      try {
        const response = await fetch(`/listing/${listingId}/favorite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json", // Specify to expect JSON response
            "CSRF-Token": csrfToken, // Include CSRF token in headers
          },
          body: `_csrf=${encodeURIComponent(csrfToken)}`,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.message === "Added to favorites.") {
            // Update button to reflect favorited state
            button.classList.add("favorited");
            button.querySelector("i").className = "fas fa-heart";
            button.querySelector("span").textContent = "Remove from Favorites";
            // Optionally, update the favorites count in the header
            updateFavoritesCount(1);
          } else if (result.message === "Removed from favorites.") {
            // Update button to reflect unfavorited state
            button.classList.remove("favorited");
            button.querySelector("i").className = "far fa-heart";
            button.querySelector("span").textContent =
              "Like it and save it for later";
            // Optionally, update the favorites count in the header
            updateFavoritesCount(-1);
          }
        } else {
          const errorData = await response.json();
          alert(errorData.error || "An error occurred.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while updating your favorites.");
      }
    });
  }

  /**
   * Function to Update Favorites Count in Header
   */
  function updateFavoritesCount(change) {
    const countElement = document.getElementById("favorites-count");
    if (countElement) {
      let currentCount = parseInt(countElement.textContent, 10) || 0;
      currentCount += change;
      countElement.textContent = currentCount > 0 ? currentCount : "";
    }
  }

  // Handle Add to Cart Button Click
  if (addToCartButton) {
    addToCartButton.addEventListener("click", async function (e) {
      e.preventDefault(); // Prevent default button behavior

      const form = e.currentTarget.closest('.add-to-cart-form');
      const listingId = form.querySelector("input[name='listingId']").value;
      const quantityInput = document.getElementById("quantity"); // Correctly select the quantity input by ID
      const quantity = parseInt(quantityInput.value, 10);
      const csrfToken = form.querySelector("input[name='_csrf']").value;

      // Validate the quantity on the client-side
      if (isNaN(quantity) || quantity < 1) {
        alert("Please enter a valid quantity (1 or more).");
        quantityInput.focus();
        return;
      }

      try {
        const response = await fetch('/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken, // Include CSRF token in headers
          },
          body: JSON.stringify({
            listingId: listingId,
            quantity: quantity,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Instead of displaying a message under the button, show a modal
          showAddToCartModal("Your order has been added to the cart.");
          // Update cart count in header based on server response
          if (data.cartCount !== undefined) {
            updateCartCount(data.cartCount);
          }
        } else {
          displayError(form, data.error || 'Failed to add to cart.');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        displayError(form, 'An error occurred while adding to cart.');
      }
    });
  }

  // Utility Function to Show Add to Cart Modal
  function showAddToCartModal(message) {
    const modal = document.getElementById("addToCartModal");
    const modalMessage = document.getElementById("addToCartMessage");
    const continueButton = document.getElementById("continueButton");

    modalMessage.textContent = message;
    modal.style.display = "block";

    // Close modal when clicking the 'Continue' button
    continueButton.onclick = function() {
      modal.style.display = "none";
    };

    // Close modal when clicking outside the modal content
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  /**
   * Function to Update Cart Count in Header
   */
  function updateCartCount(newCount) {
    const countElement = document.getElementById("cart-count");
    if (countElement) {
      if (newCount > 0) {
        countElement.textContent = newCount;
        countElement.style.display = "block"; // Show the badge
      } else {
        countElement.textContent = "";
        countElement.style.display = "none"; // Hide the badge when count is 0
      }
    }
  }

  /**
   * Function to Extract Listing ID from URL (Fallback)
   */
  function getListingIdFromURL() {
    const pathSegments = window.location.pathname.split('/');
    const listingIndex = pathSegments.findIndex(segment => segment === 'listing');
    if (listingIndex !== -1 && pathSegments.length > listingIndex + 1) {
      return pathSegments[listingIndex + 1];
    }
    return null;
  }

  // Message Seller Modal Handling (Existing Code)
  const makeOfferBtn = document.getElementById("makeOfferBtn");
  const offerModal = document.getElementById("offerModal");
  const closeModal = document.getElementById("closeModal");

  if (makeOfferBtn && offerModal && closeModal) {
    makeOfferBtn.addEventListener("click", () => {
      offerModal.style.display = "block";
    });

    closeModal.addEventListener("click", () => {
      offerModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === offerModal) {
        offerModal.style.display = "none";
      }
    });
  }
});
