// public/js/profileToggle.js

document.addEventListener('DOMContentLoaded', () => {
    /* === Toggle Button Functionality === */
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('aria-controls');
            const content = document.getElementById(sectionId);
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';

            if (isExpanded) {
                content.classList.add('hidden');
                btn.textContent = '+';
                btn.setAttribute('aria-expanded', 'false');
            } else {
                content.classList.remove('hidden');
                btn.textContent = '−';
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* === Flash Message Dismissal Functionality === */
    // Handle Close Button Click
    const closeButtons = document.querySelectorAll('.flash-close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const flashMessage = button.parentElement;
            flashMessage.style.transition = "opacity 0.5s ease-out";
            flashMessage.style.opacity = "0";
            setTimeout(() => {
                flashMessage.remove();
            }, 500);
        });

        // Allow keyboard activation (Enter or Space)
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });

    // Auto-dismiss flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.transition = "opacity 0.5s ease-out";
            message.style.opacity = "0";
            setTimeout(() => {
                message.remove();
            }, 500);
        }, 5000); // 5 seconds
    });
});
