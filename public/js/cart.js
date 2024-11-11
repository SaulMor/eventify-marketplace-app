// public/js/cart.js

document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");

  /**
   * Function to update cart item quantity via AJAX
   */
  function updateCartQuantity(listingId, newQuantity, cartItemElement) {
    fetch("/cart/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ listingId, quantity: newQuantity }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update the item's total price in the DOM
          const unitPriceElement = cartItemElement.querySelector(".item-price");
          const unitPriceText = unitPriceElement.textContent;
          const unitPriceMatch = unitPriceText.match(
            /Unit Price:\s*\$(\d+(\.\d{1,2})?)/
          );
          const unitPrice = unitPriceMatch ? parseFloat(unitPriceMatch[1]) : 0;

          const newTotalPrice = (unitPrice * newQuantity).toFixed(2);
          const itemTotalElement = cartItemElement.querySelector(".item-total");
          itemTotalElement.textContent = newTotalPrice;

          // Update the summary totals
          updateSummary();

          // Display success message
          displayFlashMessage(
            "success",
            data.success || "Cart updated successfully."
          );
        } else if (data.error) {
          // Revert the quantity input to the previous valid value
          const previousQuantity = cartItemElement.getAttribute(
            "data-previous-quantity"
          );
          const quantityInput =
            cartItemElement.querySelector(".quantity-input");
          quantityInput.value = previousQuantity;

          // Display error message
          displayFlashMessage("error", data.error || "Failed to update cart.");
        }
      })
      .catch((error) => {
        console.error("Error updating cart:", error);
        displayFlashMessage(
          "error",
          "An error occurred while updating your cart."
        );
      });
  }

  /**
   * Function to update summary totals
   */
  function updateSummary() {
    const summaryItems = document.getElementById("summary-items");
    const summaryTotal = document.getElementById("summary-total");
    let totalPrice = 0;

    document.querySelectorAll(".cart-item").forEach((cartItem) => {
      // Check if the cart item is visible
      const style = window.getComputedStyle(cartItem);
      if (style.display !== "none") {
        const itemTotalElement = cartItem.querySelector(".item-total");
        const itemTotal = parseFloat(itemTotalElement.textContent);
        if (!isNaN(itemTotal)) {
          totalPrice += itemTotal;
        }
      }
    });

    if (summaryItems && summaryTotal) {
      summaryItems.textContent = `$${totalPrice.toFixed(2)}`;
      summaryTotal.textContent = `$${totalPrice.toFixed(2)}`;
    }
  }

  /**
   * Function to display flash messages
   */
  function displayFlashMessage(type, message) {
    // Remove existing flash messages
    const existingMessages = document.querySelectorAll(".flash-message");
    existingMessages.forEach((msg) => msg.remove());

    // Create a new flash message
    const flashDiv = document.createElement("div");
    flashDiv.className = `flash-message ${type}`;
    flashDiv.textContent = message;

    // Insert the flash message at the top of the cart container
    const cartContainer = document.querySelector(".cart-container");
    if (cartContainer) {
      cartContainer.insertBefore(flashDiv, cartContainer.firstChild);
    }

    // Automatically remove the flash message after 5 seconds
    setTimeout(() => {
      flashDiv.remove();
    }, 5000);
  }

  /**
   * Function to handle Remove Item
   */
  function handleRemoveItem(button) {
    const listingId = button.getAttribute("data-listing-id");
    const listingName = button.getAttribute("data-listing-name");

    // Send AJAX request to remove the item
    fetch("/cart/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ listingId: listingId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Find the cart item element
          const cartItemDiv = button.closest(".cart-item");
          if (cartItemDiv) {
            // Hide the entire cart item with a fade-out effect
            cartItemDiv.classList.add("fade-out");

            // After transition ends, hide the element and show the removal message
            cartItemDiv.addEventListener(
              "transitionend",
              () => {
                cartItemDiv.style.display = "none";

                // Find the removal message div
                const removalMessageDiv = document.getElementById(
                  `removal-message-${listingId}`
                );
                if (removalMessageDiv) {
                  removalMessageDiv.textContent = `${listingName} was removed from Shopping Cart.`;
                  removalMessageDiv.classList.add("removal-message-visible");
                }

                // Update the cart count in the header
                updateCartCount(data.cartCount);

                // **Update the summary totals**
                updateSummary();
              },
              { once: true }
            );
          }
        } else {
          // Display error message
          displayFlashMessage(
            "error",
            data.error || "Failed to remove item from cart."
          );
        }
      })
      .catch((error) => {
        console.error("Error removing item from cart:", error);
        displayFlashMessage(
          "error",
          "An error occurred while removing the item from your cart."
        );
      });
  }

  /**
   * Function to update Cart Count in Header
   */
  function updateCartCount(newCount) {
    const countElement = document.getElementById("cart-count");
    if (countElement) {
      let displayCount = newCount;
      let digits = 1;

      if (newCount > 99) {
        displayCount = "99+";
        digits = 3;
      } else if (newCount > 9) {
        digits = 2;
      }

      countElement.textContent = displayCount;
      countElement.dataset.digits = digits; // Set data-digits attribute

      if (newCount > 0) {
        countElement.style.display = "flex"; // Use flex to align text
      } else {
        countElement.textContent = "";
        countElement.style.display = "none"; // Hide the badge when count is 0
      }
    }
  }

  /**
   * Attach Event Listeners
   */
  function attachEventListeners() {
    // Add event listeners to quantity inputs
    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const newQuantity = parseInt(e.target.value, 10);
        const cartItemElement = e.target.closest(".cart-item");
        const listingId = cartItemElement.getAttribute("data-listing-id");

        // Validate the new quantity
        if (isNaN(newQuantity) || newQuantity < 1) {
          alert("Quantity must be at least 1.");
          // Revert to previous valid quantity
          e.target.value =
            cartItemElement.getAttribute("data-previous-quantity") || 1;
          return;
        }

        // Update the previous quantity attribute
        cartItemElement.setAttribute("data-previous-quantity", newQuantity);

        // Update cart via AJAX
        updateCartQuantity(listingId, newQuantity, cartItemElement);
      });

      // Initialize previous quantity data attribute
      const cartItemElement = input.closest(".cart-item");
      if (cartItemElement) {
        const currentQuantity = parseInt(input.value, 10);
        cartItemElement.setAttribute("data-previous-quantity", currentQuantity);
      }
    });

    // Handle Remove Item Button Click
    document.querySelectorAll(".remove-item").forEach((button) => {
      button.addEventListener("click", () => {
        handleRemoveItem(button);
      });
    });
  }

  // Initialize
  attachEventListeners();

  // Handle Buy Now Button Click to Open Modal
  const buyNowBtn = document.getElementById("checkout-btn");
  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", () => {
      const paymentModal = document.getElementById("paymentModal");
      if (paymentModal) {
        paymentModal.style.display = "block";
      }
    });
  }

  // Initial summary calculation on page load
  updateSummary();
});
