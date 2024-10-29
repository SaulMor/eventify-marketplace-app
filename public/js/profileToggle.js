// public/js/profileToggle.js

document.addEventListener('DOMContentLoaded', () => {
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
});
