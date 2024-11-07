// public/js/productDetail.js

document.addEventListener("DOMContentLoaded", () => {
  const favoriteButton = document.getElementById("favorite-button");
  if (favoriteButton) {
    favoriteButton.addEventListener("click", async function (e) {
      e.preventDefault(); // Prevent default button behavior

      const button = e.currentTarget;
      const listingId = button.getAttribute("data-listing-id");
      const csrfToken = document.getElementById("csrf-token").value;

      try {
        const response = await fetch(`/listing/${listingId}/favorite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json", // Specify to expect JSON response
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
   * Optional: Function to Update Favorites Count in Header
   */
  function updateFavoritesCount(change) {
    const countElement = document.getElementById("favorites-count");
    if (countElement) {
      let currentCount = parseInt(countElement.textContent, 10) || 0;
      currentCount += change;
      countElement.textContent = currentCount > 0 ? currentCount : "";
    }
  }
});
