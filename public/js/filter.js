// public/js/filter.js

document.addEventListener('DOMContentLoaded', () => {
    // Toggle Buttons for Filters
    document.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('click', () => {
            const ariaControls = button.getAttribute('aria-controls');
            const section = document.getElementById(ariaControls);
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            // Toggle the hidden-filter class
            section.classList.toggle('hidden-filter');

            // Update aria-expanded attribute
            button.setAttribute('aria-expanded', !isExpanded);
            
            // Update button text
            button.textContent = isExpanded ? '+' : '-';
        });
    });

    // Handle Color Circle Clicks for Visual Feedback
    document.querySelectorAll('.color-group label').forEach(label => {
        label.addEventListener('click', (event) => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            const colorCircle = label.querySelector('.color-circle');
            // Delay the class toggle to allow the checkbox state to update
            setTimeout(() => {
                if (checkbox.checked) {
                    colorCircle.classList.add('selected');
                } else {
                    colorCircle.classList.remove('selected');
                }
            }, 0);
        });
    });

    // Initialize Color Circle States on Page Load
    document.querySelectorAll('.color-group label').forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        const colorCircle = label.querySelector('.color-circle');
        if (checkbox.checked) {
            colorCircle.classList.add('selected');
        } else {
            colorCircle.classList.remove('selected');
        }
    });
});
