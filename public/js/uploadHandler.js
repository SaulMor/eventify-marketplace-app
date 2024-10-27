// public/js/uploadHandler.js

document.addEventListener("DOMContentLoaded", () => {
    const uploadButtons = document.querySelectorAll(".upload-button");
    const maxPhotos = 5; // Maximum number of photos to preview

    uploadButtons.forEach(button => {
        const fileInput = button.nextElementSibling; // Assuming input is immediately after button
        const thumbnailsContainer = button.closest(".photo-upload-container").querySelector(".photo-thumbnails");

        if (button && fileInput) {
            button.addEventListener("click", () => {
                fileInput.click();
            });
        }

        if (fileInput && thumbnailsContainer) {
            fileInput.addEventListener("change", () => {
                const files = Array.from(fileInput.files);
                if (files.length > maxPhotos) {
                    showFeedback(`You can upload up to ${maxPhotos} photos.`, "error");
                    fileInput.value = ""; // Reset the input
                    thumbnailsContainer.innerHTML = ""; // Clear existing thumbnails
                    return;
                }

                thumbnailsContainer.innerHTML = ""; // Clear existing thumbnails

                files.forEach((file) => {
                    if (!file.type.startsWith("image/")) return; // Skip non-image files
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement("img");
                        img.src = e.target.result;
                        img.alt = "Photo Preview";
                        img.classList.add("thumbnail");
                        thumbnailsContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });

                if (files.length > 0) {
                    showFeedback("Photos uploaded successfully!", "success");
                } else {
                    showFeedback("No valid images selected.", "error");
                }
            });
        }
    });

    // Drag and Drop Functionality (if applicable)
    const photoUploadSections = document.querySelectorAll(".photo-upload-section");

    photoUploadSections.forEach(section => {
        section.addEventListener("dragover", (e) => {
            e.preventDefault();
            section.classList.add("dragover");
        });

        section.addEventListener("dragleave", (e) => {
            e.preventDefault();
            section.classList.remove("dragover");
        });

        section.addEventListener("drop", (e) => {
            e.preventDefault();
            section.classList.remove("dragover");
            const files = Array.from(e.dataTransfer.files);
            const filesToUpload = files.slice(0, maxPhotos);

            if (files.length > maxPhotos) {
                showFeedback(`You can upload up to ${maxPhotos} photos.`, "error");
            }

            const thumbnailsContainer = section.querySelector(".photo-thumbnails");
            if (thumbnailsContainer) {
                thumbnailsContainer.innerHTML = ""; // Clear existing thumbnails
            }

            filesToUpload.forEach((file) => {
                if (!file.type.startsWith("image/")) return; // Skip non-image files
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.alt = "Photo Preview";
                    img.classList.add("thumbnail");
                    if (thumbnailsContainer) {
                        thumbnailsContainer.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
            });

            if (filesToUpload.length > 0) {
                showFeedback("Photos uploaded successfully!", "success");
            } else {
                showFeedback("No valid images selected.", "error");
            }
        });
    });

    // Feedback Function
    const uploadFeedback = document.getElementById('upload-feedback');

    function showFeedback(message, type) {
        if (uploadFeedback) {
            uploadFeedback.innerHTML = `<div class="alert ${type}">${message}</div>`;
            setTimeout(() => {
                uploadFeedback.innerHTML = "";
            }, 3000);
        }
    }
});
