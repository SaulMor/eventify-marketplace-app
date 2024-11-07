// public/js/cart.js

document.addEventListener("DOMContentLoaded", () => {
    const quantityInputs = document.querySelectorAll("input[name='quantity']");
    const removeButtons = document.querySelectorAll(".remove-item");
    const checkoutBtn = document.getElementById("checkout-btn");
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    // Function to update cart item quantity
    quantityInputs.forEach(input => {
        input.addEventListener("change", async (e) => {
            const listingId = e.target.getAttribute("data-listing-id");
            const newQuantity = e.target.value;

            if (newQuantity < 1) {
                alert("Quantity cannot be less than 1.");
                e.target.value = 1;
                return;
            }

            try {
                const response = await fetch('/cart/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({
                        listingId: listingId,
                        quantity: newQuantity
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Update the item's total price
                    const itemPriceElement = e.target.closest('.cart-item').querySelector('.item-price');
                    const itemPrice = parseFloat(itemPriceElement.textContent.replace('$', ''));
                    const newTotal = (itemPrice * newQuantity).toFixed(2);
                    itemPriceElement.textContent = `$${newTotal}`;

                    // Update the summary totals
                    updateSummary();
                    alert(data.success || 'Cart updated successfully.');
                } else {
                    alert(data.error || 'Failed to update cart.');
                }
            } catch (error) {
                console.error('Error updating cart:', error);
                alert('An error occurred while updating your cart.');
            }
        });
    });

    // Function to remove item from cart
    removeButtons.forEach(button => {
        button.addEventListener("click", async (e) => {
            const listingId = e.target.getAttribute("data-listing-id");

            if (confirm("Are you sure you want to remove this item from your cart?")) {
                try {
                    const response = await fetch('/cart/remove', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'CSRF-Token': csrfToken
                        },
                        body: JSON.stringify({
                            listingId: listingId
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Remove the item from the DOM
                        const cartItem = e.target.closest('.cart-item');
                        if (cartItem) {
                            cartItem.remove();
                        }
                        // Update the summary total
                        updateSummary();
                        alert(data.success || 'Item removed from cart.');
                    } else {
                        alert(data.error || 'Failed to remove item from cart.');
                    }
                } catch (error) {
                    console.error('Error removing from cart:', error);
                    alert('An error occurred while removing the item from your cart.');
                }
            }
        });
    });

    // Function to update summary totals
    function updateSummary() {
        const cartItems = document.querySelectorAll(".cart-item");
        let itemsTotal = 0;

        cartItems.forEach(item => {
            const price = parseFloat(item.querySelector(".item-price").textContent.replace('$', ''));
            const quantity = parseInt(item.querySelector("input[name='quantity']").value, 10);
            itemsTotal += price * quantity;
        });

        const summaryItems = document.getElementById("summary-items");
        const summaryTotal = document.getElementById("summary-total");

        if (summaryItems && summaryTotal) {
            summaryItems.textContent = `$${itemsTotal.toFixed(2)}`;
            summaryTotal.textContent = `$${itemsTotal.toFixed(2)}`;
        }
    }

     // Handle Buy Now Button Click to Open Modal
     if (buyNowBtn) {
        buyNowBtn.addEventListener("click", () => {
            const paymentModal = document.getElementById("paymentModal");
            if (paymentModal) {
                paymentModal.style.display = "block";
            }
        });
    }
    // Optional: Recalculate summary on page load
    updateSummary();
});
