// public/js/productDetail.js

document.addEventListener("DOMContentLoaded", () => {
  const favoriteButton = document.getElementById("favorite-button");
  const addToCartForm = document.querySelector(".add-to-cart-form"); // Select the form instead of the button
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

  // Handle Add to Cart Form Submission
  if (addToCartForm) {
    addToCartForm.addEventListener("submit", async function (e) {
      e.preventDefault(); // Prevent traditional form submission

      const listingId = addToCartForm.querySelector("input[name='listingId']").value;
      const quantityInput = document.getElementById("quantity"); // Select the quantity input by ID
      const quantity = parseInt(quantityInput.value, 10);
      const csrfToken = addToCartForm.querySelector("input[name='_csrf']").value;

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
          // Show the Add to Cart Success Modal
          showAddToCartModal("Your order has been added to the cart.");
          // Update cart count in header based on server response
          if (data.cartCount !== undefined) {
            updateCartCount(data.cartCount);
          }
        } else {
          displayError(addToCartForm, data.error || 'Failed to add to cart.');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        displayError(addToCartForm, 'An error occurred while adding to cart.');
      }
    });
  }

  // Updated Utility Function to Show Add to Cart Modal
  function showAddToCartModal(message) {
    console.log("showAddToCartModal called"); // Debugging log
    const modal = document.getElementById("addToCartModal");
    const modalMessage = document.getElementById("addToCartMessage");
    const continueButton = document.getElementById("continueButton");

    modalMessage.textContent = message;
    modal.classList.add("active"); // Show the modal by adding 'active' class
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    // Close modal when clicking the 'Continue' button
    continueButton.onclick = function () {
      modal.classList.remove("active"); // Hide the modal by removing 'active' class
      document.body.style.overflow = "auto"; // Re-enable background scrolling
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

  /**
   * Function to Display Error Messages
   */
  function displayError(form, message) {
    let errorContainer = form.querySelector('.error-message');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-message';
      form.appendChild(errorContainer);
    }
    errorContainer.textContent = message;
    errorContainer.style.color = 'red';
    errorContainer.style.marginTop = '10px';
  }

  // Message Seller Modal Handling
  const makeOfferBtn = document.getElementById("makeOfferBtn");
  const offerModal = document.getElementById("offerModal");

  if (makeOfferBtn && offerModal) {
    makeOfferBtn.addEventListener("click", () => {
      offerModal.classList.add("active"); // Show the modal by adding 'active' class
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    });
  }
});
