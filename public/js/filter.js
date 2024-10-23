document.querySelectorAll('.category-group h4').forEach(item => {
    item.addEventListener('click', event => {
        const categoryGroup = item.parentElement;
        categoryGroup.classList.toggle('active'); // Toggle active class
    });
});
