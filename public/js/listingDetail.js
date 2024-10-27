// public/js/listingDetail.js

document.addEventListener("DOMContentLoaded", () => {
    const colorCircles = document.querySelectorAll('.color-circle');
    colorCircles.forEach(circle => {
        const color = circle.getAttribute('data-color');
        if (color) {
            circle.style.backgroundColor = color;
        }
    });
});
