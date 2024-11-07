// public/js/productDetail.js

document.addEventListener("DOMContentLoaded", () => {
    const favoriteButton = document.getElementById("favorite-button");
    const addToCartButton = document.querySelector(".add-to-cart-btn"); // Select the 'Add to Cart' button
    const csrfToken = document.getElementById("csrf-token").value;
  
    if (favoriteButton) {
      favoriteButton.addEventListener("click", async function (e) {
        e.preventDefault(); // Prevent default button behavior
  
        const button = e.currentTarget;
        const listingId = button.getAttribute("data-listing-id");
  
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
  
        const button = e.currentTarget;
        const listingId = button.getAttribute("data-listing-id") || getListingIdFromURL();
        const quantity = 1; // Default quantity, can be modified to allow user input
  
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
            displaySuccess(button, data.success || 'Added to cart successfully.');
            // Optionally, update cart count in header
            updateCartCount(1);
          } else {
            displayError(button, data.error || 'Failed to add to cart.');
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
          displayError(button, 'An error occurred while adding to cart.');
        }
      });
    }
  
    // Utility Functions to Display Messages
    function displayError(element, message) {
      // Remove existing error messages
      const existingError = element.parentElement.querySelector('.form-error');
      if (existingError) existingError.remove();
  
      // Create a new error message element
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error';
      errorDiv.textContent = message;
  
      // Insert the error message after the button
      element.parentElement.appendChild(errorDiv);
    }
  
    function displaySuccess(element, message) {
      // Remove existing success messages
      const existingSuccess = element.parentElement.querySelector('.form-success');
      if (existingSuccess) existingSuccess.remove();
  
      // Create a new success message element
      const successDiv = document.createElement('div');
      successDiv.className = 'form-success';
      successDiv.textContent = message;
  
      // Insert the success message after the button
      element.parentElement.appendChild(successDiv);
    }
  
    /**
     * Function to Update Cart Count in Header
     */
    function updateCartCount(change) {
      const countElement = document.getElementById("cart-count");
      if (countElement) {
        let currentCount = parseInt(countElement.textContent, 10) || 0;
        currentCount += change;
        countElement.textContent = currentCount > 0 ? currentCount : "";
      }
    }
  
    /**
     * Function to Extract Listing ID from URL
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
  