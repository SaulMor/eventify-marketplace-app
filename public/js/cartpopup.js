// Get the modal
var modal = document.getElementById("paymentModal");

// Get the button that opens the modal
var btn = document.querySelector(".buy-now");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal only if Visa is selected
btn.onclick = function() {
    // Check if Visa is selected
    var selectedPayment = document.querySelector('input[name="payment"]:checked');
    
    if (!selectedPayment || selectedPayment.value !== "visa") {
        alert("Please select Visa as your payment method before proceeding.");
        return; // Stops modal from opening if Visa is not selected
    }
    
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Format the card number as the user types
document.getElementById("cardNumber").addEventListener("input", function(event) {
    var cardNumber = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    var formattedCardNumber = '';

    // Insert a space every 4 digits
    for (var i = 0; i < cardNumber.length; i += 4) {
        formattedCardNumber += cardNumber.slice(i, i + 4) + ' ';
    }

    // Trim any extra space at the end
    event.target.value = formattedCardNumber.trim();
});

// Format the expiry date as the user types (MM/YY format)
document.getElementById("expiry").addEventListener("input", function(event) {
    var expiry = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    var formattedExpiry = '';

    // Add the slash after the first two digits
    if (expiry.length > 2) {
        formattedExpiry = expiry.slice(0, 2) + '/' + expiry.slice(2, 4);
    } else {
        formattedExpiry = expiry.slice(0, 2);
    }

    // Update the input field with the formatted value
    event.target.value = formattedExpiry;
});

// Handle form submission for payment
document.getElementById("paymentForm").onsubmit = function(event) {
    event.preventDefault();
    
    var cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, ''); // Remove spaces for validation
    var expiry = document.getElementById("expiry").value.replace(/\//g, ''); // Remove slash for validation
    var cvv = document.getElementById("cvv").value;
    
    // Ensure the card number is exactly 16 digits and contains only numbers
    var cardRegex = /^\d{16}$/;
    if (!cardRegex.test(cardNumber)) {
        alert("Card number must be exactly 16 digits and contain only numbers.");
        return; // Stops form submission if card number is invalid
    }
    
    // Ensure the expiry date is valid (MMYY format)
    var expiryMonth = expiry.slice(0, 2);
    var expiryYear = "20" + expiry.slice(2, 4); // Assuming the year is in 2-digit format (YY)
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth() + 1; // Get current month (1-12)
    var currentYear = currentDate.getFullYear(); // Get current year (YYYY)

    // Check if month is between 01 and 12
    if (parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
        alert("Invalid month. Please enter a month between 01 and 12.");
        return; // Stops form submission if month is invalid
    }

    // Check if expiry year is in the future, or if it's the current year, check month
    if (parseInt(expiryYear) < currentYear || 
        (parseInt(expiryYear) === currentYear && parseInt(expiryMonth) < currentMonth)) {
        alert("Expiry date is in the past. Please enter a valid future date.");
        return; // Stops form submission if expiry date is in the past
    }
    
    // Ensure the CVV is exactly 3 digits and contains only numbers
    var cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(cvv)) {
        alert("CVV must be exactly 3 digits and contain only numbers.");
        return; // Stops form submission if CVV is invalid
    }

    // If all fields are valid, show confirmation message
    alert("Payment confirmed!");
    // You can also trigger the success or payment logic here
}

// Handle the confirmation button
document.getElementById("confirmPurchase").onclick = function() {
    // Get form values
    var cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, ''); // Remove spaces for validation
    var expiry = document.getElementById("expiry").value.replace(/\//g, ''); // Remove slash for validation
    var cvv = document.getElementById("cvv").value;
    
    // Validate Card Number (must be 16 digits)
    var cardRegex = /^\d{16}$/;
    if (!cardRegex.test(cardNumber)) {
        alert("Card number must be exactly 16 digits and contain only numbers.");
        return; // Prevent further processing
    }

    // Validate Expiry Date (must be 4 digits MMYY)
    var expiryMonth = expiry.slice(0, 2);
    var expiryYear = "20" + expiry.slice(2, 4); // Assuming the year is in 2-digit format (YY)
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth() + 1; // Get current month (1-12)
    var currentYear = currentDate.getFullYear(); // Get current year (YYYY)

    // Check if month is between 01 and 12
    if (parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
        alert("Invalid month. Please enter a month between 01 and 12.");
        return; // Prevent further processing
    }

    // Check if expiry year is in the future, or if it's the current year, check month
    if (parseInt(expiryYear) < currentYear || 
        (parseInt(expiryYear) === currentYear && parseInt(expiryMonth) < currentMonth)) {
        alert("Expiry date is in the past. Please enter a valid future date.");
        return; // Prevent further processing
    }

    // Validate CVV (must be 3 digits)
    var cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(cvv)) {
        alert("CVV must be exactly 3 digits and contain only numbers.");
        return; // Prevent further processing
    }

    // If all fields are valid, show confirmation and proceed
    alert("Payment confirmed!");

    // Redirect to home page after confirmation
    window.location.href = '/'; // Redirects to the homepage
}

// Handle cancel button (close the modal)
document.getElementById("cancelPurchase").onclick = function() {
    modal.style.display = "none"; // Close the modal
}
